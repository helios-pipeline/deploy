// const { Stack } = require('aws-cdk-lib');
// const { VpcStack } = require('./vpc-stack');
// const { ClickHouseEC2Stack } = require('./clickhouse-ec2-stack');
// // const { FlaskEc2Stack } = require('./flask-ec2-stack');
// // const { DynamodbStack } = require('./dynamodb-stack');
// // const { LambdaStack } = require('./lambda-stack');

// class CdkDeployStack extends Stack {
//   /**
//    * @param {Construct} scope
//    * @param {string} id
//    * @param {StackProps=} props
//    */
//   constructor(scope, id, props) {
//     super(scope, id, props);

//     const env = {
//       account: '533266998695', // Replace with your AWS account ID
//       region: 'us-west-1', // Replace with your AWS region
//     };

//     // Create VPC Stack
//     const vpcStack = new VpcStack(this, 'HeliosVpcStack');

//     // Create Clickhouse EC2 Stack
//     const clickhouseStack = new ClickHouseEC2Stack(this, 'HeliosClickHouseStack', {
//       env,
//       subnetId: vpcStack.subnetId,
//       vpc: vpcStack.vpc
//     });

//     // // Create Flask EC2 Stack
//     // const flaskStack = new FlaskEc2Stack(this, 'HeliosFlaskStack', {
//     //   vpc: vpcStack.vpc,
//     //   clickhouseIp: clickhouseStack.instancePublicIp
//     // });

//     // // Create DynamoDB Stack
//     // const dynamodbStack = new DynamodbStack(this, 'HeliosDynamodbStack');

//     // // Create Lambda Stack
//     // new LambdaStack(this, 'HeliosLambdaStack', {
//     //   vpc: vpcStack.vpc,
//     //   clickhouseIp: clickhouseStack.instancePublicIp
//     // });

//     // You can add outputs here if needed
//     // new cdk.CfnOutput(this, 'VpcId', { value: vpcStack.vpc.vpcId });
//     // new cdk.CfnOutput(this, 'ClickhouseIp', { value: clickhouseStack.instancePublicIp });
//     // ... add more outputs as needed
//   }
// }

// module.exports = { CdkDeployStack }

const { Stack } = require('aws-cdk-lib');
const { VpcStack } = require('./vpc-stack');
const { ClickHouseEC2Stack } = require('./clickhouse-ec2-stack');

class CdkDeployStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const env = {
      account: '533266998695',
      region: 'us-west-1',
    };

    // Create VPC Stack
    const vpcStack = new VpcStack(this, 'HeliosVpcStack', { env });

    // Create Clickhouse EC2 Stack
    new ClickHouseEC2Stack(this, 'HeliosClickHouseStack', {
      env,
      subnetId: vpcStack.subnetId,
      vpcId: vpcStack.vpc.vpcId,
    });
  }
}

module.exports = { CdkDeployStack };
