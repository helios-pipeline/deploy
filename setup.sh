#!/usr/bin/env bash

set -e
#set -x # testing

error_handler() {
    local line=$1
    local command=$2
    local error_code=${3:-1}
    echo "Error occurred in command '$command' on line $line. Exit code: $error_code" >&2
    which say >/dev/null 2>&1 && say "helios infrastructure setup failed"
    exit $error_code
}

if [ -n "$BASH_VERSION" ]; then
    trap 'error_handler ${LINENO} "$BASH_COMMAND" $?' ERR
fi

main() {
    echo "Starting Helios infrastructure setup..."

    if [ $# -eq 0 ]; then
        echo "Profile name is required as the first argument."
        exit 1
    fi

    PROFILE="$1"
    echo "1-Using profile: $PROFILE"
    export AWS_PROFILE="$PROFILE"

    if [ -f setup_cdk.sh ] && [ -f assume_role.sh ]; then
        chmod +x setup_cdk.sh assume_role.sh
    else
        echo "setup_cdk.sh or assume_role.sh not found in the current directory."
        exit 1
    fi
    
    echo "Running setup_cdk.sh..."
    ./setup_cdk.sh "$PROFILE"
    
    echo "Deploying IamStack..."
    cdk deploy IamStack --require-approval never
    
    echo "Assuming deployment role..."
    ./assume_role.sh "$PROFILE"
    
    echo "Deploying all stacks..."

    if cdk deploy --all --require-approval never; then
        which say >/dev/null 2>&1 && say "helios infrastructure setup done"
        echo "Deployment completed successfully!"
    else
        which say >/dev/null 2>&1 && say "helios infrastructure setup failed"
        echo "Deployment failed. Check the logs for more information." >&2
        exit 1
    fi
}

main "$@"