#!/bin/bash

set -e

if [ $# -eq 0 ]; then
    echo "No profile provided. Usage: $0 <profile_name>"
    exit 1
fi

PROFILE=$1
echo "2-Using profile: $PROFILE"
export AWS_PROFILE=$PROFILE

command_exists () {
    type "$1" &> /dev/null ;
}

if ! command_exists aws ; then
    echo "AWS CLI is not installed. Please install it and configure your credentials."
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=$(aws configure get region)
USERNAME=$(aws sts get-caller-identity --query Arn --output text | cut -d'/' -f2)

echo "Setting up CDK for Account ID: $ACCOUNT_ID in Region: $REGION for User: $USERNAME"

if aws iam get-policy --policy-arn arn:aws:iam::${ACCOUNT_ID}:policy/CDKDeploymentPolicy 2>/dev/null; then
    echo "CDKDeploymentPolicy already exists. Skipping policy creation."
    POLICY_ARN="arn:aws:iam::${ACCOUNT_ID}:policy/CDKDeploymentPolicy"
else
    echo "Creating CDK policy..."
cat << EOF > cdk_policy.json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "iam:CreateRole",
                "iam:AttachRolePolicy",
                "iam:PutRolePolicy",
                "cloudformation:CreateStack",
                "cloudformation:DescribeStacks",
                "cloudformation:CreateChangeSet",
                "cloudformation:DescribeChangeSet",
                "cloudformation:ExecuteChangeSet",
                "cloudformation:GetTemplate",
                "s3:CreateBucket",
                "s3:PutBucketPolicy",
                "s3:PutBucketVersioning",
                "s3:PutBucketPublicAccessBlock",
                "ssm:PutParameter",
                "sts:AssumeRole"
            ],
            "Resource": "*"
        }
    ]
}
EOF

    POLICY_ARN=$(aws iam create-policy --policy-name CDKDeploymentPolicy --policy-document file://cdk_policy.json --query 'Policy.Arn' --output text)
    echo "CDK policy created with ARN: $POLICY_ARN"
fi

wait_for_iam_propagation() {
    echo "Waiting for IAM changes to propagate..."
    sleep 15
}

if aws iam list-attached-user-policies --user-name $USERNAME --query "AttachedPolicies[?PolicyArn=='$POLICY_ARN']" --output text | grep -q "$POLICY_ARN"; then
    echo "Policy is already attached to user $USERNAME. Skipping attachment."
else
    echo "Attaching policy to user $USERNAME..."
    aws iam attach-user-policy --user-name $USERNAME --policy-arn $POLICY_ARN
    wait_for_iam_propagation
fi

echo "Installing AWS CDK globally..."
if command_exists npm ; then
    npm install -g aws-cdk
else
    echo "npm is not installed. Please install Node.js and npm to continue."
    exit 1
fi

echo "Bootstrapping CDK..."
if command_exists cdk ; then
    cdk bootstrap aws://$ACCOUNT_ID/$REGION
else
    echo "CDK is not in the PATH. Make sure the npm global bin directory is in your PATH."
    exit 1
fi

echo "CDK setup complete!"