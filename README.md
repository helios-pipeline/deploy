# deploy

## async inserts
- recommended best practice for ClickHouse
- https://clickhouse.com/docs/en/cloud/bestpractices/asynchronous-inserts
- multiple options available, choosing to not handle as a setting specific to each individual INSERT via Lambda function invocation, but rather as a Database user setting
  - not -- `INSERT INTO YourTable SETTINGS async_insert=1, wait_for_async_insert=1 VALUES (...)`
  - instead -- `ALTER USER default SETTINGS async_insert = 1`
- re ^, for our CLI prompts, can choose to either ask a user to provide a username and password for the ClickHouse DB, or just only allow a "default" user to be set up
  - either way, once we create a ClickHouse DB instance on the EC2 for the user, can run the `ALTER USER default SETTINGS async_insert = 1` command while in the `./clickhouse-client` on this EC2