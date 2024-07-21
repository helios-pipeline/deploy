const { Stack, CfnOutput, Fn } = require('aws-cdk-lib');
const ec2 = require('aws-cdk-lib/aws-ec2');
const iam = require('aws-cdk-lib/aws-iam');
const ssm = require('aws-cdk-lib/aws-ssm');
const fs = require('fs');
const path = require('path');

class ClickhouseEc2Stack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const vpc = ec2.Vpc.fromVpcAttributes(this, 'ImportedVpc', {
      vpcId: props.vpcId,
      availabilityZones: props.availabilityZones,
      publicSubnetIds: props.publicSubnetIds,
      publicSubnetRouteTableIds: [Fn.importValue('MainPublicSubnetRouteTableId')],
    });

    const securityGroup = new ec2.SecurityGroup(this, 'ClickHouseSecurityGroup', {
      vpc,
      description: 'Security group for ClickHouse EC2 instance',
      allowAllOutbound: true,
    });

    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'Allow SSH access');
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(8123), 'Allow ClickHouse HTTP');
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(8443), 'Allow ClickHouse HTTPS');
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(9000), 'Allow ClickHouse native protocol');
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(9440), 'Allow ClickHouse native protocol (SSL)');

    const role = new iam.Role(this, 'EC2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
    });

    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'));
    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'));

    role.addToPolicy(new iam.PolicyStatement({
      actions: [
        'secretsmanager:GetSecretValue',
        'secretsmanager:DescribeSecret'
      ],
      resources: ['*'],
    }));

    const ubuntuAmi = ec2.MachineImage.fromSsmParameter(
      '/aws/service/canonical/ubuntu/server/focal/stable/current/amd64/hvm/ebs-gp2/ami-id',
      { os: ec2.OperatingSystemType.LINUX }
    );

    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      fs.readFileSync(path.join(__dirname, '..', 'scripts', 'user_data.sh'), 'utf8')
    );

    const instance = new ec2.Instance(this, 'ClickHouseInstance', {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
      machineImage: ubuntuAmi,
      securityGroup: securityGroup,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      role: role,
      userData: userData,
    });

    new ssm.StringParameter(this, 'ClickhouseIpParameter', {
      parameterName: '/helios/clickhouse/ip',
      stringValue: instance.instancePublicIp,
    });

    new CfnOutput(this, 'InstancePublicIp', {
      value: instance.instancePublicIp,
      description: 'Public IP address of the EC2 instance',
      exportName: 'ClickHouseInstancePublicIp',
    });

    new CfnOutput(this, 'InstanceId', {
      value: instance.instanceId,
      description: 'EC2 Instance ID',
      exportName: 'ClickHouseInstanceId',
    });
  }
}

module.exports = { ClickhouseEc2Stack };

An error occurred (AccessDeniedException) when calling the Query operation: User: arn:aws:iam::533266998695:user/helios is not authorized to perform: dynamodb:Query on resource: arn:aws:dynamodb:us-west-1:533266998695:table/tables_streams because no VPC endpoint policy allows the dynamodb:Query action