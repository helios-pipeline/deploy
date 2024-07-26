import asyncio
import base64
import json
import logging
import os
import re
import boto3
from boto3.dynamodb.conditions import Key
import clickhouse_connect

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# ClickHouse connection details
CLICKHOUSE_HOST = os.environ["CLICKHOUSE_HOST"]
CLICKHOUSE_PORT = int(os.environ.get("CLICKHOUSE_PORT", 8123))
client = clickhouse_connect.get_client(host=CLICKHOUSE_HOST, port=CLICKHOUSE_PORT)

# Cache for DynamoDB client and table
dynamodb_client = None
dynamodb_table = None

# Cache for table names
table_name_cache = {}

def get_dynamodb_table():
    global dynamodb_client, dynamodb_table
    if dynamodb_table is None:
        dynamodb_client = boto3.resource("dynamodb", region_name="us-west-1")
        dynamodb_table = dynamodb_client.Table("stream_table_map")
    return dynamodb_table

def get_table_id(stream_id):
    table = get_dynamodb_table()
    response = table.query(KeyConditionExpression=Key("stream_id").eq(stream_id))
    return response["Items"][0]["table_id"]

def get_table_name(table_id):
    if table_id not in table_name_cache:
        res = client.query(
            f"""
            SELECT name
            FROM system.tables
            WHERE database = 'default'
            AND toString(uuid) = '{table_id}'
            """
        )
        table_name_cache[table_id] = res.first_row[0]
    return table_name_cache[table_id]

def identify_schema_mismatch(error_message):
    error_patterns = {
        "datetime_parse_error": r"Cannot parse .+ as DateTime: syntax error",
        "uuid_error": r"Cannot parse uuid .+: Cannot parse UUID from String",
        "int_parse_error": r"Cannot parse string .+ as Int32: syntax error",
        "extra_column_error": r"Unrecognized column .+ in table",
        "missing_column_error": r"No such column .+ in table",
        "syntax_error": r"Cannot parse expression of type .+ here:",
        "type_mismatch": r"Type mismatch in .+",
    }
    for error_type, pattern in error_patterns.items():
        if re.search(pattern, error_message):
            return error_type
    return "unknown_error"

def handle_insert_error(data, error, table_name):
    error_message = str(error)
    error_type = identify_schema_mismatch(error_message)
    error_info = {
        "error_type": error_type,
        "error_message": error_message,
        "raw_data": json.dumps(data),
        "table_name": table_name,
    }
    send_to_quarantine(error_info)
    logger.error(f"Error inserting data: {error_type}")
    logger.error(f"Error message: {error_message}")
    logger.error(f"Problematic data: {data}")

def ensure_quarantine_table_exists(table_name):
    try:
        client.command("CREATE DATABASE IF NOT EXISTS quarantine")
        quarantine_table_structure = f"""
        CREATE TABLE IF NOT EXISTS quarantine.{table_name} (
            error_type String,
            error_message String,
            raw_data String,
            original_table String,
            insertion_timestamp DateTime DEFAULT now()
        ) ENGINE = MergeTree()
        ORDER BY (insertion_timestamp, error_type)
        """
        client.command(quarantine_table_structure)
        logger.info(f"Quarantine table created/ensured: quarantine.{table_name}")
    except Exception as e:
        logger.error(f"Error ensuring quarantine table exists: {str(e)}", exc_info=True)
        raise

def send_to_quarantine(error_info):
    table_name = error_info["table_name"]
    ensure_quarantine_table_exists(table_name)
    try:
        logger.info(f"Attempting to send data to quarantine table: quarantine.{table_name}")
        quarantine_data = [
            error_info["error_type"],
            error_info["error_message"],
            error_info["raw_data"],
            table_name,
        ]
        client.insert(
            f"quarantine.{table_name}",
            [quarantine_data],
            column_names=["error_type", "error_message", "raw_data", "original_table"],
        )
        logger.info(f"Successfully sent data to quarantine table: quarantine.{table_name}")
        logger.info(f"Quarantined data: {error_info}")
    except Exception as e:
        logger.error(f"Error sending data to quarantine: {str(e)}", exc_info=True)

async def process_record(record, table_name):
    logger.info(f"Processing record: {record['kinesis']['sequenceNumber']}")
    payload = base64.b64decode(record["kinesis"]["data"])
    data = json.loads(payload)
    logger.info(f"Parsed data: {json.dumps(data)}")
    return data

async def process_kinesis_batch(event):
    try:
        stream_id = event["Records"][0]["eventSourceARN"]
        table_id = get_table_id(stream_id)
        table_name = get_table_name(table_id)

        tasks = [process_record(record, table_name) for record in event["Records"]]
        processed_data = await asyncio.gather(*tasks)

        # Prepare data for batch insert
        column_names = list(processed_data[0].keys())
        rows = [list(data.values()) for data in processed_data]

        try:
            client.insert(table_name, rows, column_names=column_names)
            logger.info(f"Successfully inserted {len(rows)} rows into {table_name}")
        except Exception as e:
            logger.error(f"Error in batch insert: {str(e)}")
            for data in processed_data:
                handle_insert_error(data, e, table_name)

        logger.info(f"Successfully processed {len(processed_data)} records")
        return {
            "statusCode": 200,
            "body": json.dumps(
                {"status": "success", "records_processed": len(processed_data)}
            ),
        }
    except Exception as e:
        logger.error(f"Error processing records: {str(e)}", exc_info=True)
        return {
            "statusCode": 500,
            "body": json.dumps({"status": "error", "message": str(e)}),
        }

def lambda_handler(event, context):
    loop = asyncio.get_event_loop()
    return loop.run_until_complete(process_kinesis_batch(event))