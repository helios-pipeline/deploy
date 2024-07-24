#!/usr/bin/env node
const cdk = require('aws-cdk-lib');
const { VpcStack } = require('../lib/vpc-stack');
const { ClickhouseEc2Stack } = require('../lib/clickhouse-ec2-stack');
const { FlaskEc2Stack } = require('../lib/flask-ec2-stack');
const { DynamoDbStack } = require('../lib/dynamodb-stack');
const { LambdaStack } = require('../lib/lambda-stack');
const { IamStack } = require('../lib/iam-stack');
const { S3Stack } = require('../lib/s3-stack');

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION
}

const iamStack = new IamStack(app, 'IamStack', { env });

const vpcStack = new VpcStack(app, 'VpcStack', { env });

const s3Stack = new S3Stack(app, 'S3Stack', { env });

const clickhouseEc2Stack = new ClickhouseEc2Stack(app, 'ClickhouseEc2Stack', {
  env,
  vpcId: vpcStack.vpc.vpcId,
  availabilityZones: vpcStack.vpc.availabilityZones,
  publicSubnetIds: vpcStack.vpc.publicSubnets.map(subnet => subnet.subnetId),
});

const flaskEc2Stack = new FlaskEc2Stack(app, 'FlaskEc2Stack', {
  env,
  vpcId: vpcStack.vpc.vpcId,
  availabilityZones: vpcStack.vpc.availabilityZones,
  publicSubnetIds: vpcStack.vpc.publicSubnets.map(subnet => subnet.subnetId),
});

const dynamoDbStack = new DynamoDbStack(app, 'DynamoDbStack', {
  env,
  vpcId: vpcStack.vpc.vpcId,
  availabilityZones: vpcStack.vpc.availabilityZones,
  publicSubnetIds: vpcStack.vpc.publicSubnets.map(subnet => subnet.subnetId),
});

const lambdaStack = new LambdaStack(app, 'LambdaStack', {
  env,
  vpcId: vpcStack.vpc.vpcId,
  availabilityZones: vpcStack.vpc.availabilityZones,
  publicSubnetIds: vpcStack.vpc.publicSubnets.map(subnet => subnet.subnetId),
});

vpcStack.addDependency(iamStack);
s3Stack.addDependency(vpcStack);
clickhouseEc2Stack.addDependency(vpcStack);
clickhouseEc2Stack.addDependency(s3Stack);
lambdaStack.addDependency(clickhouseEc2Stack);
dynamoDbStack.addDependency(vpcStack);
flaskEc2Stack.addDependency(vpcStack);
flaskEc2Stack.addDependency(clickhouseEc2Stack);
flaskEc2Stack.addDependency(dynamoDbStack);



app.synth();