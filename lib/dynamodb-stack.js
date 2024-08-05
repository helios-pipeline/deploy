const { Stack, RemovalPolicy, CfnOutput, Fn } = require('aws-cdk-lib');
const dynamodb = require('aws-cdk-lib/aws-dynamodb');
const ec2 = require('aws-cdk-lib/aws-ec2');
const iam = require('aws-cdk-lib/aws-iam');

class DynamoDbStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const table = new dynamodb.Table(this, 'StreamTableMap', {
      tableName: 'stream_table_map',
      // change this ^ to stream_table_map in production
      partitionKey: { name: 'stream_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'table_id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 3,
      writeCapacity: 3,
      removalPolicy: RemovalPolicy.DESTROY, // CAUTION: This will delete the table when the stack is destroyed
    });

    table.addGlobalSecondaryIndex({
      indexName: 'TableIdIndex',
      partitionKey: { name: 'table_id', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
      readCapacity: 1,
      writeCapacity: 1,
    });

    new CfnOutput(this, 'TableName', {
      value: table.tableName,
      description: 'The name of the DynamoDB table',
      exportName: 'StreamTableMapName',
    });

    new CfnOutput(this, 'TableArn', {
      value: table.tableArn,
      description: 'The ARN of the DynamoDB table',
      exportName: 'StreamTableMapArn',
    });
  }
}

module.exports = { DynamoDbStack };
