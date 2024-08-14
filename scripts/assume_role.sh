#!/bin/bash

set -e

if [ $# -eq 0 ]; then
    echo "No profile provided. Usage: $0 <profile_name>"
    exit 1
fi

PROFILE=$1
export AWS_PROFILE=$PROFILE

ROLE_ARN=$(aws cloudformation describe-stacks --stack-name IamStack --query "Stacks[0].Outputs[?ExportName=='HeliosDeploymentRoleArn'].OutputValue" --output text)

if [ -z "$ROLE_ARN" ]; then
    echo "Error: Unable to retrieve the deployment role ARN. Make sure the IamStack has been deployed."
    exit 1
fi

CREDENTIALS=$(aws sts assume-role --role-arn $ROLE_ARN --role-session-name DeploymentSession --output text --query 'Credentials.[AccessKeyId,SecretAccessKey,SessionToken]')

if [ $? -ne 0 ]; then
    echo "Error: Failed to assume the deployment role."
    exit 1
fi

IFS=$'\t' read -r -a cred_array <<< "$CREDENTIALS"

export AWS_ACCESS_KEY_ID="${cred_array[0]}"
export AWS_SECRET_ACCESS_KEY="${cred_array[1]}"
export AWS_SESSION_TOKEN="${cred_array[2]}"

echo "Temporary credentials set. You can now run 'cdk deploy --all'."