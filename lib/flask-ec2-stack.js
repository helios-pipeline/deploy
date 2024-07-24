// const { Stack, CfnOutput, Fn, Duration } = require('aws-cdk-lib');
// const ec2 = require('aws-cdk-lib/aws-ec2');
// const iam = require('aws-cdk-lib/aws-iam');
// const elbv2 = require('aws-cdk-lib/aws-elasticloadbalancingv2');
// const acm = require('aws-cdk-lib/aws-certificatemanager');
// const targets = require('aws-cdk-lib/aws-elasticloadbalancingv2-targets');

// class FlaskEc2Stack extends Stack {
//   constructor(scope, id, props) {
//     super(scope, id, props);

//     const vpc = ec2.Vpc.fromVpcAttributes(this, 'ImportedVpc', {
//       vpcId: props.vpcId,
//       availabilityZones: props.availabilityZones,
//       publicSubnetIds: props.publicSubnetIds,
//       publicSubnetRouteTableIds: [Fn.importValue('MainPublicSubnetRouteTableId')],
//     });

//     const flaskSecurityGroup = new ec2.SecurityGroup(this, 'FlaskSecurityGroup', {
//       vpc,
//       description: 'Security group for Flask EC2 instance',
//       allowAllOutbound: true,
//     });

//     flaskSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'Allow SSH access');

//     // Create ALB Security Group
//     const albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
//       vpc,
//       description: 'Security group for ALB',
//       allowAllOutbound: true,
//     });

//     // Allow inbound HTTPS traffic to ALB
//     albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'Allow HTTPS traffic');
//     albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP traffic');

//     // Modify the Flask EC2 security group to allow traffic only from ALB
//     flaskSecurityGroup.addIngressRule(
//       ec2.Peer.securityGroupId(albSecurityGroup.securityGroupId),
//       ec2.Port.tcp(5000),
//       'Allow traffic from ALB to Flask app'
//     );

//     const role = new iam.Role(this, 'FlaskEC2Role', {
//       assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
//     });

//     role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'));
//     role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'));

//     role.addToPolicy(new iam.PolicyStatement({
//       effect: iam.Effect.ALLOW,
//       actions: ["dynamodb:*", "lambda:*"],
//       resources: "*"
//     }));

//     const ubuntuAmi = ec2.MachineImage.fromSsmParameter(
//       '/aws/service/canonical/ubuntu/server/focal/stable/current/amd64/hvm/ebs-gp2/ami-id',
//       { os: ec2.OperatingSystemType.LINUX }
//     );

//     const userData = ec2.UserData.forLinux();
//     userData.addCommands(
//       'apt-get update',
//       'apt-get install -y docker.io awscli',
//       'systemctl start docker',
//       'systemctl enable docker',
//       'usermod -aG docker ubuntu',
//       'CH_HOST=$(aws ssm get-parameter --name /helios/clickhouse/ip --query "Parameter.Value" --output text --region ' + this.region + ')',
//       'echo "CH_HOST=$CH_HOST" > /home/ubuntu/.env',
//       'docker pull kuanchiliao/helios-flask-lb-amd:dev',
//       'docker run -d -p 5000:5000 --env-file /home/ubuntu/.env --name flask-app kuanchiliao/helios-flask-lb-amd:dev'
//     );

//     const instance = new ec2.Instance(this, 'FlaskInstance', {
//       vpc,
//       instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
//       machineImage: ubuntuAmi,
//       securityGroup: flaskSecurityGroup,
//       vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
//       role: role,
//       userData: userData,
//     });

//     const alb = new elbv2.ApplicationLoadBalancer(this, 'FlaskALB', {
//       vpc,
//       internetFacing: true,
//       securityGroup: albSecurityGroup
//     });

//     const certificate = new acm.Certificate(this, 'Certificate', {
//       domainName: alb.loadBalancerDnsName,
//       validation: acm.CertificateValidation.fromDns(),
//     });

//     const httpsListener = alb.addListener('HttpsListener', {
//       port: 443,
//       certificates: [certificate],
//     });

//     const httpListener = alb.addListener('HttpListener', { port: 80 });

//     httpListener.addAction('HttpRedirect', {
//       action: elbv2.ListenerAction.redirect({
//         port: '443',
//         protocol: elbv2.Protocol.HTTPS,
//         permanent: true,
//       }),
//     });

//     const targetGroup = new elbv2.ApplicationTargetGroup(this, 'FlaskTargetGroup', {
//       vpc,
//       port: 5000,
//       protocol: elbv2.ApplicationProtocol.HTTP,
//       targetType: elbv2.TargetType.INSTANCE,
//       healthCheck: {
//         path: '/',
//         interval: Duration.seconds(60),
//       },
//     });

//     targetGroup.addTarget(new targets.InstanceTarget(instance));

//     httpsListener.addTargetGroups('DefaultTarget', {
//       targetGroups: [targetGroup],
//     });

//     new CfnOutput(this, 'FlaskInstanceId', {
//       value: instance.instanceId,
//       description: 'Flask EC2 Instance ID',
//       exportName: 'FlaskInstanceId',
//     });

//     new CfnOutput(this, 'LoadBalancerDNS', {
//       value: alb.loadBalancerDnsName,
//       description: 'HTTPS endpoint for the Flask application',
//       exportName: 'FlaskALBDnsName',
//     });

//     new CfnOutput(this, 'ApplicationUrl', {
//       value: `https://${alb.loadBalancerDnsName}`,
//       description: 'URL of the Flask application (HTTPS)',
//       exportName: 'FlaskAppUrl',
//     });
//   }
// }

// module.exports = { FlaskEc2Stack };

const { Stack, CfnOutput, Fn } = require('aws-cdk-lib');
const ec2 = require('aws-cdk-lib/aws-ec2');
const iam = require('aws-cdk-lib/aws-iam');

class FlaskEc2Stack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const vpc = ec2.Vpc.fromVpcAttributes(this, 'ImportedVpc', {
      vpcId: props.vpcId,
      availabilityZones: props.availabilityZones,
      publicSubnetIds: props.publicSubnetIds,
      publicSubnetRouteTableIds: [Fn.importValue('MainPublicSubnetRouteTableId')],
    });

    const flaskSecurityGroup = new ec2.SecurityGroup(this, 'FlaskSecurityGroup', {
      vpc,
      description: 'Security group for Flask EC2 instance',
      allowAllOutbound: true,
    });

    // Updated: Added ingress rule for port 443 (HTTPS)
    flaskSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'Allow HTTPS traffic');
    flaskSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP traffic');
    flaskSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'Allow SSH access');

    const role = new iam.Role(this, 'FlaskEC2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
    });

    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'));
    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'));

    role.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["dynamodb:*", "lambda:*"],
      resources: "*"
    }));

    const ubuntuAmi = ec2.MachineImage.fromSsmParameter(
      '/aws/service/canonical/ubuntu/server/focal/stable/current/amd64/hvm/ebs-gp2/ami-id',
      { os: ec2.OperatingSystemType.LINUX }
    );

    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'apt-get update',
      'apt-get install -y docker.io awscli openssl', // Added openssl for certificate generation
      'systemctl start docker',
      'systemctl enable docker',
      'usermod -aG docker ubuntu',
      'CH_HOST=$(aws ssm get-parameter --name /helios/clickhouse/ip --query "Parameter.Value" --output text --region ' + this.region + ')',
      'echo "CH_HOST=$CH_HOST" > /home/ubuntu/.env',
      
      'PUBLIC_DNS=$(curl -s http://169.254.169.254/latest/meta-data/public-hostname)',
      'echo "PUBLIC_DNS=$PUBLIC_DNS" >> /home/ubuntu/.env',
      
      'openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /home/ubuntu/key.pem -out /home/ubuntu/cert.pem -subj "/CN=$PUBLIC_DNS"',
      'docker pull kuanchiliao/helios-flask-lb-amd:dev',
      
      'docker run -d -p 80:5000 -p 443:5000 --env-file /home/ubuntu/.env -v /home/ubuntu/cert.pem:/app/cert.pem -v /home/ubuntu/key.pem:/app/key.pem --name flask-app kuanchiliao/helios-flask-lb-amd:dev'
    );

    const instance = new ec2.Instance(this, 'FlaskInstance', {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
      machineImage: ubuntuAmi,
      securityGroup: flaskSecurityGroup,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      role: role,
      userData: userData,
    });

    // Updated: Changed to output the public DNS instead of IP
    new CfnOutput(this, 'FlaskInstancePublicDns', {
      value: instance.instancePublicDnsName,
      description: 'Public DNS of the Flask EC2 instance',
      exportName: 'FlaskInstancePublicDns',
    });

    new CfnOutput(this, 'FlaskInstanceId', {
      value: instance.instanceId,
      description: 'Flask EC2 Instance ID',
      exportName: 'FlaskInstanceId',
    });

    new CfnOutput(this, 'FlaskInstanceUrls', {
      value: `HTTP: http://${instance.instancePublicDnsName}\nHTTPS: https://${instance.instancePublicDnsName}`,
      description: 'URLs for the Flask application',
      exportName: 'FlaskInstanceUrls',
    });
  }
}

module.exports = { FlaskEc2Stack };