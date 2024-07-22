const { Stack, CfnOutput } = require('aws-cdk-lib');
const iam = require('aws-cdk-lib/aws-iam');

class IamStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const deploymentRole = new iam.Role(this, 'DeploymentRole', {
      assumedBy: new iam.AccountPrincipal(this.account),
      roleName: 'HeliosDeploymentRole',
      description: 'Role for deploying Helios project resources',
    });

    deploymentRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AWSCloudFormationFullAccess'));
    deploymentRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2FullAccess'));
    deploymentRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess'));
    deploymentRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AWSLambda_FullAccess'));
    deploymentRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('IAMFullAccess'));
    deploymentRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMFullAccess'));

    new CfnOutput(this, 'DeploymentRoleArn', {
      value: deploymentRole.roleArn,
      description: 'ARN of the deployment role',
      exportName: 'HeliosDeploymentRoleArn',
    });
  }
}

module.exports = { IamStack };