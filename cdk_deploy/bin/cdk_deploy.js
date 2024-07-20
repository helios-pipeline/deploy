#!/usr/bin/env node

// const cdk = require('aws-cdk-lib');
// const { CdkDeployStack } = require('../lib/cdk_deploy-stack');

// const app = new cdk.App();
// new CdkDeployStack(app, 'CdkDeployStack', {
//   /* If you don't specify 'env', this stack will be environment-agnostic.
//    * Account/Region-dependent features and context lookups will not work,
//    * but a single synthesized template can be deployed anywhere. */

//   /* Uncomment the next line to specialize this stack for the AWS Account
//    * and Region that are implied by the current CLI configuration. */
//   // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

//   /* Uncomment the next line if you know exactly what Account and Region you
//    * want to deploy the stack to. */
//   env: { account: '533266998695', region: 'us-west-1' },

//   /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
// });

const cdk = require('aws-cdk-lib');
const { CdkDeployStack } = require('../lib/cdk_deploy-stack');

// Set the AWS profile
process.env.AWS_PROFILE = 'capstone-team4'; // Set this to your AWS profile name

const app = new cdk.App();

const env = {
  account: '533266998695', // Replace with your AWS account ID
  region: 'us-west-1', // Replace with your AWS region
};

new CdkDeployStack(app, 'CdkDeployStack', { env });

app.synth();
