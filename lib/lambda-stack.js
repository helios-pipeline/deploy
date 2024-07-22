const { Stack, Duration, CfnOutput, Fn } = require('aws-cdk-lib');
const lambda = require('aws-cdk-lib/aws-lambda');
const iam = require('aws-cdk-lib/aws-iam');
const ec2 = require('aws-cdk-lib/aws-ec2');
const ssm = require('aws-cdk-lib/aws-ssm');

class LambdaStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const lambdaRole = new iam.Role(this, 'LambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'IAM role for Lambda function',
    });

    lambdaRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'));
    lambdaRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaKinesisExecutionRole'));
    lambdaRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess'));

    const lambdaLayerPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'lambda:PublishLayerVersion',
        'lambda:GetLayerVersion',
        'lambda:DeleteLayerVersion',
      ],
      resources: ['*'],
    });
    lambdaRole.addToPolicy(lambdaLayerPolicy);

    const lambdaFunction = new lambda.Function(this, 'KinesisToClickhouseFunction', {
      functionName: 'kinesis-to-clickhouse-dev',
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'lambda_function.lambda_handler',
      code: lambda.Code.fromAsset('lambda_function.zip'),
      role: lambdaRole,
      timeout: Duration.seconds(300),
      environment: {
        CLICKHOUSE_HOST: ssm.StringParameter.valueForStringParameter(this, '/helios/clickhouse/ip'),
        CLICKHOUSE_PORT: '8123',
      },
    });

    const lambdaLayer = new lambda.LayerVersion(this, 'LambdaLayer', {
      code: lambda.Code.fromAsset('layer_content.zip'),
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_12],
      description: 'Layer for Kinesis to ClickHouse Lambda function',
    });

    lambdaFunction.addLayers(lambdaLayer);

    new CfnOutput(this, 'LambdaFunctionArn', {
      value: lambdaFunction.functionArn,
      description: 'ARN of the Lambda function',
      exportName: 'KinesisToClickhouseLambdaArn',
    });
  }
}

module.exports = { LambdaStack };