const cdk = require('aws-cdk-lib');
const ec2 = require('aws-cdk-lib/aws-ec2');
const { Stack, CfnOutput, Tags } = cdk;

class VpcStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Create VPC
    this.vpc = new ec2.Vpc(this, 'HeliosVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 1,
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Add tags to VPC
    Tags.of(this.vpc).add('Name', 'Helios VPC');

    // Internet Gateway is automatically created by CDK when public subnets are defined

    // Add tags to the public subnet
    this.vpc.publicSubnets.forEach((subnet, index) => {
      Tags.of(subnet).add('Name', `Helios Public Subnet ${index + 1}`);
    });

    // Route table for public subnet is automatically created by CDK

    // Create default security group
    const defaultSg = new ec2.SecurityGroup(this, 'HeliosDefaultSG', {
      vpc: this.vpc,
      allowAllOutbound: true,
      description: 'Helios Security Group - VPC',
    });

    defaultSg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.allTraffic(),
      'Allow all inbound traffic'
    );

    Tags.of(defaultSg).add('Name', 'Helios Security Group - VPC');

    // Default route table
    const defaultRouteTable = this.vpc.publicSubnets[0].routeTable;
    Tags.of(defaultRouteTable).add('Name', 'Helios Route Table - Public Subnet');

    this.subnetId = this.vpc.publicSubnets[0].subnetId;

    // Outputs
    new CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
      exportName: 'HeliosVpcId',
    });

    new CfnOutput(this, 'PublicSubnetId', {
      value: this.vpc.publicSubnets[0].subnetId,
      description: 'Public Subnet ID',
      exportName: 'HeliosPublicSubnetId',
    });
  }
}

module.exports = { VpcStack };
