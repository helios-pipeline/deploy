const { Stack, CfnOutput } = require('aws-cdk-lib');
const ec2 = require('aws-cdk-lib/aws-ec2');

class VpcStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    this.vpc = new ec2.Vpc(this, 'MainVpc', {
      maxAzs: 1,
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    new CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
      exportName: 'MainVpcId',
    });

    new CfnOutput(this, 'PublicSubnetId', {
      value: this.vpc.publicSubnets[0].subnetId,
      description: 'Public Subnet ID',
      exportName: 'MainPublicSubnetId',
    });

    new CfnOutput(this, 'PublicSubnetRouteTableId', {
      value: this.vpc.publicSubnets[0].routeTable.routeTableId,
      description: 'Public Subnet Route Table ID',
      exportName: 'MainPublicSubnetRouteTableId',
    });

  }
}

module.exports = { VpcStack };