# deploy

## async inserts
- recommended best practice for ClickHouse
- https://clickhouse.com/docs/en/cloud/bestpractices/asynchronous-inserts
- multiple options available, choosing to not handle as a setting specific to each individual INSERT via Lambda function invocation, but rather as a Database user setting
  - not -- `INSERT INTO YourTable SETTINGS async_insert=1, wait_for_async_insert=1 VALUES (...)`
  - instead -- `ALTER USER default SETTINGS async_insert = 1`
- re ^, for our CLI prompts, can choose to either ask a user to provide a username and password for the ClickHouse DB, or just only allow a "default" user to be set up
  - either way, once we create a ClickHouse DB instance on the EC2 for the user, can run the `ALTER USER default SETTINGS async_insert = 1` command while in the `./clickhouse-client` on this EC2

## lambda function notes
option 1 - dynamoDB
get streamID from event - within the lambda_handler
connect to dynamoDB to get tableID for this streamID
tableID = table.__uuid__
{ streamID: tableID }
send a query to ch client to get tableName based on table.__uuid__
client.insert(tableName, data)

re testing this lambda function before abstracting code to terraform:
- setup env variable in the lambda configuration to hardcore a specific EC2 instance public url
- do the same with a dynamoDB table
  - add an item that has a real kinesis_stream_id and real table __uuid__ to this table

option 2 - clickhouse table

questions:
- how to handle lambda to/from dynamo errors?
- similarly, with our try/catch in the lambda... what actually happens if theres an error?
- how to handle timestamps and converting those to comparable format 
event_timestamp = datetime.fromisoformat(record['event_timestamp']).strftime('%Y-%m-%d %H:%M:%S')