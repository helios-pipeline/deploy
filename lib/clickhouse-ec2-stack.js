const { Stack, CfnOutput, Fn, Size } = require('aws-cdk-lib');
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
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(9009), 'Allow ClickHouse interserver HTTP');

    const backupPolicy = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          sid: "AccessS3BackupFiles",
          effect: iam.Effect.ALLOW,
          actions: [
            "s3:PutObject",
            "s3:GetObject"
          ],
          resources: ["arn:aws:s3:::*/*"]
        }),
        new iam.PolicyStatement({
          sid: "AccessS3BackupBucket",
          effect: iam.Effect.ALLOW,
          actions: ["s3:ListBucket"],
          resources: ["arn:aws:s3:::*"]
        })
      ]
    });

    const role = new iam.Role(this, 'EC2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      inlinePolicies: {
        backupPolicy: backupPolicy
      }
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
      fs.readFileSync(path.join(__dirname, '..', 'scripts', 'install_clickhouse.sh'), 'utf8'),
      'sudo mkdir -p /opt/scripts/',
      fs.readFileSync(path.join(__dirname, '..', 'scripts', 'install_clickhouse_backup.sh'), 'utf8'),
      fs.readFileSync(path.join(__dirname, '..', 'scripts', 'clickhouse_backup.sh'), 'utf8'),
      'sudo chmod +x /opt/scripts/clickhouse-backup.sh',
      'echo "*/1 * * * * root /opt/scripts/clickhouse-backup.sh" | sudo tee /etc/cron.d/clickhouse-backup',
      'sudo chmod 0644 /etc/cron.d/clickhouse-backup',
      'sudo systemctl restart cron'
    );

    const ebsVolume = new ec2.Volume(this, 'ClickHouseEBSVolume', {
      availabilityZone: props.availabilityZones[0], // Use the first AZ
      size: Size.gibibytes(1000),
      volumeType: ec2.EbsDeviceVolumeType.GP3,
      encrypted: false,
    });

    const instance = new ec2.Instance(this, 'ClickHouseInstance', {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.LARGE),
      machineImage: ubuntuAmi,
      securityGroup: securityGroup,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      role: role,
      userData: userData,
      blockDevices: [
        {
          deviceName: '/dev/sda1',
          volume: ec2.BlockDeviceVolume.ebs(100, {
            volumeType: ec2.EbsDeviceVolumeType.GP3,
            encrypted: true,
          }),
        },
      ],
    });

    new ec2.CfnVolumeAttachment(this, 'EBSVolumeAttachment', {
      volumeId: ebsVolume.volumeId,
      instanceId: instance.instanceId,
      device: '/dev/sdf',
    });

    // Add commands to set up the EBS volume
    userData.addCommands(
      'sudo mkfs -t ext4 /dev/nvme1n1',
      'sudo mkdir -p /var/lib/clickhouse',
      'sudo mount /dev/nvme1n1 /var/lib/clickhouse',
      'echo "/dev/nvme1n1 /var/lib/clickhouse ext4 defaults,nofail 0 2" | sudo tee -a /etc/fstab',
      'sudo chown clickhouse:clickhouse /var/lib/clickhouse'
    );

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