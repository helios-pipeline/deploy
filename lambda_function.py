# import base64
# import json
# from datetime import datetime
# from dotenv import load_dotenv

# import logging
# import clickhouse_connect
# import os
# import boto3
# from boto3.dynamodb.conditions import Key

# load_dotenv()

# # Set up logging
# logger = logging.getLogger()
# logger.setLevel(logging.DEBUG)

# # ClickHouse connection details
# CLICKHOUSE_HOST = os.environ['CLICKHOUSE_HOST']
# CLICKHOUSE_PORT = int(os.environ.get('CLICKHOUSE_PORT', 8123))
# client = clickhouse_connect.get_client(host=CLICKHOUSE_HOST, port=CLICKHOUSE_PORT)

# def create_dynamodb_client():
#     return boto3.resource(
#         'dynamodb',
#         region_name='us-west-1'
#     )

# def get_table_id(dynamo_client, name, stream_id):
#     table = dynamo_client.Table(name)
#     response = table.query(
#         KeyConditionExpression=Key('stream_id').eq(stream_id)
#     )
#     return response["Items"][0]["table_id"]

# def get_table_name(table_id):
#     res = client.query(f"""
#         SELECT name
#         FROM system.tables
#         WHERE database = 'default'
#         AND toString(uuid) = '{table_id}'
#         """)
#     return res.first_row[0]
            

# def lambda_handler(event, context):
#     logger.info(f"Lambda function invoked with event: {json.dumps(event)}")
#     try:
#         records_processed = 0
#         for record in event['Records']:
#             logger.info(f"Processing record: {record['kinesis']['sequenceNumber']}")
#             logger.info(f"DECODED DATA: {record['kinesis']['data']}")
            
#             # Kinesis data is base64 encoded
#             payload = base64.b64decode(record['kinesis']['data'])
#             logger.info(f"Decoded payload: {payload}")
            
#             data = json.loads(payload)
#             logger.info(f"Parsed data: {json.dumps(data)}")

#             dynamodb_client = create_dynamodb_client()
#             stream_id = record['eventSourceARN']
#             table_id = get_table_id(dynamodb_client, 'tables_streams', stream_id)
#             table_name = get_table_name(table_id)
            
#             # Process the data
#             insert_data_to_clickhouse(data, table_name) # might be [data]
#             records_processed += 1
        
#         logger.info(f"Successfully processed {records_processed} records")
#         return {
#             'statusCode': 200,
#             'body': json.dumps({'status': 'success', 'records_processed': records_processed})
#         }
#     except Exception as e:
#         logger.error(f"Error processing records: {str(e)}", exc_info=True)
#         return {
#             'statusCode': 500,
#             'body': json.dumps({'status': 'error', 'message': str(e)})
#         }

# def insert_data_to_clickhouse(data, tableName):
#     logger.info(f"Data to client.insert: {data}")
    
#     try:
#         column_names = list(data.keys())
#         rows = []
#         for keys, vals in data.items():
#             rows.append(vals)
    
    
#         res = client.insert(tableName, [rows], column_names=column_names)
#         #res = client.insert(tableName, [[rows[0]]], column_names=[column_names[0]])
#         logger.info(f"inserted response: {res}")
#     except Exception as e:
#         logger.error(f"Error during ClickHouse query execution: {str(e)}", exc_info=True)
#         raise


#

import base64
import json
from datetime import datetime
# from dotenv import load_dotenv

import logging
import clickhouse_connect
import os
import boto3
from boto3.dynamodb.conditions import Key

# load_dotenv()

# Set up logging
logger = logging.getLogger()
logger.setLevel(logging.DEBUG)

# ClickHouse connection details
#CLICKHOUSE_HOST = os.environ['CLICKHOUSE_HOST']
CLICKHOUSE_HOST = 'ec2-52-53-199-194.us-west-1.compute.amazonaws.com'
CLICKHOUSE_PORT = int(os.environ.get('CLICKHOUSE_PORT', 8123))
# CLICKHOUSE_PORT = 443
client = clickhouse_connect.get_client(host=CLICKHOUSE_HOST, port=CLICKHOUSE_PORT)


def create_dynamodb_client():
    
    return boto3.resource(
    'dynamodb',
    aws_access_key_id=aws_access_key_id,
    aws_secret_access_key=aws_secret_access_key,
    region_name='us-west-1'  # Replace with your desired region
    )

def get_table_id(dynamo_client, name, stream_id):
    table = dynamo_client.Table(name)
    response = table.query(
        KeyConditionExpression=Key('stream_id').eq(stream_id)
    )
    return response["Items"][0]["table_id"]

def get_table_name(table_id):
    logger.info(f"abc4:{table_id}")
    logger.info(f"abc5:{type(table_id)}")
    res = client.query(f"""
        SELECT name
        FROM system.tables
        WHERE database = 'default'
        AND toString(uuid) = '{table_id}'
        """)
    return res.first_row[0]
            

def lambda_handler(event, context):
    logger.info(f"Lambda function invoked with event: {json.dumps(event)}")
    try:
        records_processed = 0
        for record in event['Records']:
            logger.info(f"Processing record: {record['kinesis']['sequenceNumber']}")
            logger.info(f"DECODED DATA: {record['kinesis']['data']}")
            
            # Kinesis data is base64 encoded
            payload = base64.b64decode(record['kinesis']['data'])
            logger.info(f"Decoded payload: {payload}")
            
            data = json.loads(payload)
            logger.info(f"Parsed data: {json.dumps(data)}")

            dynamodb_client = create_dynamodb_client()
            stream_id = record['eventSourceARN']
            logger.info(f"abc1{stream_id}")
            logger.info(f"Prased data: {stream_id}")
            
            table_id = get_table_id(dynamodb_client, 'tables_streams', stream_id)
            logger.info(f"abc2{table_id}")
            table_name = get_table_name(table_id)
            logger.info(f"abc3{table_name}")
            
            # Process the data
            insert_data_to_clickhouse(data, table_name) # might be [data]
            records_processed += 1
        
        logger.info(f"Successfully processed {records_processed} records")
        return {
            'statusCode': 200,
            'body': json.dumps({'status': 'success', 'records_processed': records_processed})
        }
    except Exception as e:
        logger.error(f"Error processing records: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'body': json.dumps({'status': 'error', 'message': str(e)})
        }

def insert_data_to_clickhouse(data, tableName):
    logger.info(f"Data to client.insert: {data}")
    
    try:
        column_names = list(data.keys())
        rows = []
        for keys, vals in data.items():
            rows.append(vals)
    
    
        res = client.insert(tableName, [rows], column_names=column_names)
        #res = client.insert(tableName, [[rows[0]]], column_names=[column_names[0]])
        logger.info(f"inserted response: {res}")
    except Exception as e:
        logger.error(f"Error during ClickHouse query execution: {str(e)}", exc_info=True)
        raise

