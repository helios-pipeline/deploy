const { Stack, CfnOutput, Fn } = require("aws-cdk-lib");
const ec2 = require("aws-cdk-lib/aws-ec2");
const iam = require("aws-cdk-lib/aws-iam");
require("dotenv").config();

class FlaskEc2Stack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const vpc = ec2.Vpc.fromVpcAttributes(this, "ImportedVpc", {
      vpcId: props.vpcId,
      availabilityZones: props.availabilityZones,
      publicSubnetIds: props.publicSubnetIds,
      publicSubnetRouteTableIds: [
        Fn.importValue("MainPublicSubnetRouteTableId"),
      ],
    });

    const flaskSecurityGroup = new ec2.SecurityGroup(
      this,
      "FlaskSecurityGroup",
      {
        vpc,
        description: "Security group for Flask EC2 instance",
        allowAllOutbound: true,
      },
    );

    flaskSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(5000),
      "Allow Flask traffic",
    );
    flaskSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      "Allow SSH access",
    );

    // const clickhouseSecurityGroup = ec2.SecurityGroup.fromSecurityGroupId(
    //   this,
    //   'ClickHouseSecurityGroup',
    //   Fn.importValue('ClickHouseSecurityGroupId')
    // );
    // flaskSecurityGroup.addEgressRule(clickhouseSecurityGroup, ec2.Port.tcp(8123), 'Allow traffic to ClickHouse');

    const role = new iam.Role(this, "FlaskEC2Role", {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
    });

    // Add managed policies
    role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "AmazonSSMManagedInstanceCore",
      ),
    );
    role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("CloudWatchAgentServerPolicy"),
    );

    // Add policy for DynamoDB access
    role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["dynamodb:*", "lambda:*"],
        //resources: ['arn:aws:dynamodb:*:*:table/tables_streams'],
        // note change ^ to stream_table_map for production
        resources: "*",
      }),
    );

    const ubuntuAmi = ec2.MachineImage.fromSsmParameter(
      "/aws/service/canonical/ubuntu/server/focal/stable/current/amd64/hvm/ebs-gp2/ami-id",
      { os: ec2.OperatingSystemType.LINUX },
    );

    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      "apt-get update",
      "apt-get install -y docker.io awscli",
      "systemctl start docker",
      "systemctl enable docker",
      "usermod -aG docker ubuntu",
      `CH_HOST=$(aws ssm get-parameter --name /helios/clickhouse/ip --query "Parameter.Value" --output text --region ${props.env.region})`,
      `echo "CH_HOST=$CH_HOST\nCHAT_GPT_API_KEY=${process.env.chatGptApiKey}" > /home/ubuntu/.env`,
      "docker pull kuanchiliao/helios-flask-amd:dev",
      "docker run -d -p 5000:5000 --env-file /home/ubuntu/.env --name flask-app kuanchiliao/helios-flask-amd:dev",
    );

    const instance = new ec2.Instance(this, "FlaskInstance", {
      vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MICRO,
      ),
      machineImage: ubuntuAmi,
      securityGroup: flaskSecurityGroup,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      role: role,
      userData: userData,
    });

    new CfnOutput(this, "FlaskInstancePublicIp", {
      value: instance.instancePublicIp,
      description: "Public IP address of the Flask EC2 instance",
      exportName: "FlaskInstancePublicIp",
    });

    new CfnOutput(this, "FlaskInstanceId", {
      value: instance.instanceId,
      description: "Flask EC2 Instance ID",
      exportName: "FlaskInstanceId",
    });

    // new CfnOutput(this, 'SecurityGroupId', {
    //   value: flaskSecurityGroup.securityGroupId,
    //   description: 'Security Group ID for Flask instance',
    //   exportName: 'FlaskSecurityGroupId',
    // });
  }
}

module.exports = { FlaskEc2Stack };
