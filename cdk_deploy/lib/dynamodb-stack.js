const { Stack, RemovalPolicy, CfnOutput, Fn } = require('aws-cdk-lib');
const dynamodb = require('aws-cdk-lib/aws-dynamodb');
const ec2 = require('aws-cdk-lib/aws-ec2');
const iam = require('aws-cdk-lib/aws-iam');

class DynamoDbStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Import the existing VPC
    const vpc = ec2.Vpc.fromVpcAttributes(this, 'ImportedVpc', {
      vpcId: props.vpcId,
      availabilityZones: props.availabilityZones,
      publicSubnetIds: props.publicSubnetIds,
      publicSubnetRouteTableIds: [Fn.importValue('MainPublicSubnetRouteTableId')],
    });

    // Create the DynamoDB table
    const table = new dynamodb.Table(this, 'StreamTableMap', {
      tableName: 'stream_table_map',
      partitionKey: { name: 'stream_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'table_id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 3,
      writeCapacity: 3,
      removalPolicy: RemovalPolicy.DESTROY, // CAUTION: This will delete the table when the stack is destroyed
    });

    // Add the global secondary index
    table.addGlobalSecondaryIndex({
      indexName: 'TableIdIndex',
      partitionKey: { name: 'table_id', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
      readCapacity: 1,
      writeCapacity: 1,
    });

    // Create a VPC endpoint for DynamoDB
    const dynamoDbEndpoint = new ec2.GatewayVpcEndpoint(this, 'DynamoDBEndpoint', {
      vpc,
      service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
    });

    // Create a policy statement for DynamoDB access
    const dynamoDbAccessPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      principals: [new iam.AnyPrincipal()], // This allows any principal within the VPC to access DynamoDB
      actions: [
        'dynamodb:PutItem',
        'dynamodb:GetItem',
        'dynamodb:UpdateItem',
        'dynamodb:DeleteItem',
        'dynamodb:Query',
        'dynamodb:Scan'
      ],
      resources: [table.tableArn],
    });

    // Add the policy to the VPC endpoint
    dynamoDbEndpoint.addToPolicy(dynamoDbAccessPolicy);

    // Output the table name and ARN
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
