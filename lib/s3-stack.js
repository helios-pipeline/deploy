const cdk = require('aws-cdk-lib');
const s3 = require('aws-cdk-lib/aws-s3');
const { Stack, RemovalPolicy, Duration } = cdk;

class S3Stack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    this.bucket = new s3.Bucket(this, 'my-clickhouse-backups', {
      bucketName: `my-clickhouse-backups-${props.env.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          expiration: Duration.days(30),
        },
      ],
    });
  }
}

module.exports = { S3Stack };