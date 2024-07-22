#!/bin/bash

set -e
#set -x # testing

error_handler() {
    local line=$1
    local command=$2
    local error_code=${3:-1}
    echo "Error occurred in command '$command' on line $line. Exit code: $error_code" >&2
    say "helios infrastructure setup failed"
    exit $error_code
}

trap 'error_handler ${LINENO} "$BASH_COMMAND" $?' ERR

main() {
    echo "Starting Helios infrastructure setup..."

    read -p "Enter the IAM profile name: " PROFILE
    echo "1-Using profile: $PROFILE"
    export AWS_PROFILE=$PROFILE

    chmod +x setup_cdk.sh assume_role.sh
    
    echo "Running setup_cdk.sh..."
    bash ./setup_cdk.sh $PROFILE
    
    echo "Deploying IamStack..."
    cdk deploy IamStack --require-approval never
    
    echo "Assuming deployment role..."
    bash ./assume_role.sh $PROFILE
    
    echo "Deploying all stacks..."
    if cdk deploy --all --require-approval never; then
        say "helios infrastructure setup done"
        echo "Deployment completed successfully!"
    else
        say "helios infrastructure setup failed"
        echo "Deployment failed. Check the logs for more information." >&2
        exit 1
    fi
}

main