import base64
import json
from datetime import datetime

import logging
import clickhouse_connect
import os
import boto3

# Set up logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# ClickHouse connection details
CLICKHOUSE_HOST = os.environ['CLICKHOUSE_HOST']
CLICKHOUSE_PORT = int(os.environ.get('CLICKHOUSE_PORT', 8123))
client = clickhouse_connect.get_client(host=CLICKHOUSE_HOST, port=CLICKHOUSE_PORT)


def lambda_handler(event, context):
    logger.info(f"Lambda function invoked with event: {json.dumps(event)}")
    try:
        records_processed = 0
        for record in event['Records']:
            logger.info(f"Processing record: {record['kinesis']['sequenceNumber']}")
            
            # Kinesis data is base64 encoded
            payload = base64.b64decode(record['kinesis']['data'])
            logger.info(f"Decoded payload: {payload}")
            
            data = json.loads(payload)
            logger.info(f"Parsed data: {json.dumps(data)}")
            
            tableName = get_table_name() # TODO
            
            # Process the data
            insert_data_to_clickhouse(data, tableName) # might be [data]
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
        res = client.insert(tableName, data)
        logger.info(f"inserted response: {res}")
     except Exception as e:
        logger.error(f"Error during ClickHouse query execution: {str(e)}", exc_info=True)
        raise
    