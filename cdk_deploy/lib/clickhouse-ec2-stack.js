const cdk = require('aws-cdk-lib');
const ec2 = require('aws-cdk-lib/aws-ec2');
const secretsmanager = require('aws-cdk-lib/aws-secretsmanager');
const { KeyPair } = require('cdk-ec2-key-pair');
const { Stack, CfnOutput, Tags } = cdk;

class ClickHouseEC2Stack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const { vpcId, subnetId } = props;

    // Retrieve the latest Ubuntu AMI
    const ami = ec2.MachineImage.lookup({
      name: 'ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-*',
      owners: ['099720109477'],
      filters: {
        'virtualization-type': ['hvm']
      }
    });

    // Create a new key pair
    const key = new KeyPair(this, 'KeyPair', {
      name: 'capstone-key',
      description: 'Key pair for EC2 instance',
      storePublicKey: true
    });

    // Store the private key in AWS Secrets Manager
    const secret = new secretsmanager.Secret(this, 'PrivateKeySecret', {
      secretName: 'capstone-key-private',
      description: 'Private key for SSH access to EC2',
      secretStringValue: cdk.SecretValue.unsafePlainText(key.privateKey),
    });

    // Create Security Group
    const securityGroup = new ec2.SecurityGroup(this, 'ClickhouseSecurityGroup', {
      vpc: ec2.Vpc.fromLookup(this, 'Vpc', { vpcId: props.vpcId }),
      description: 'Security group for Clickhouse EC2 instance',
      allowAllOutbound: true,
    });

    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(8123), 'Allow Clickhouse access on port 8123');
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(8124), 'Allow Clickhouse access on port 8124');
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'Allow SSH access');
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP access');

    // Create ENI
    const eni = new ec2.CfnNetworkInterface(this, 'ClickhouseENI', {
      subnetId: props.subnetId,
      groupSet: [securityGroup.securityGroupId],
      tags: [{ key: 'Name', value: 'Helios ENI - ClickHouse EC2' }]
    });

    // Create EC2 instance
    const instance = new ec2.Instance(this, 'ClickhouseInstance', {
      vpc: ec2.Vpc.fromLookup(this, 'Vpc', { vpcId: props.vpcId }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
      machineImage: ami,
      keyName: key.keyPairName,
      vpcSubnets: { subnets: [ec2.Subnet.fromSubnetId(this, 'Subnet', props.subnetId)] },
      securityGroup: securityGroup,
    });

    instance.addPropertyOverride('NetworkInterfaces', [{
      NetworkInterfaceId: eni.ref,
      DeviceIndex: '0'
    }]);

    // Add user data to install Docker and run Clickhouse
    instance.addUserData(
      '#!/bin/bash',
      'apt-get update',
      'apt-get install -y docker.io',
      'systemctl start docker',
      'systemctl enable docker',
      'usermod -aG docker ubuntu',
      'docker pull jamesdrabinsky/helios-clickhouse-amd:dev',
      'docker run -d --name my-clickhouse-container --ulimit nofile=262144:262144 -p 8123:8123 -p 8443:8443 -p 9000:9000 -p 9440:9440 jamesdrabinsky/helios-clickhouse-amd:dev'
    );

    // Outputs
    new CfnOutput(this, 'PrivateKeySecretArn', {
      value: secret.secretArn,
      description: 'ARN of the Secret storing the private key for SSH access',
      exportName: 'PrivateKeySecretArn'
    });

    new CfnOutput(this, 'ClickhousePublicIp', {
      value: instance.instancePublicIp,
      description: 'Public IP of the Clickhouse instance',
      exportName: 'ClickhousePublicIp'
    });
  }
}

module.exports = { ClickHouseEC2Stack };
