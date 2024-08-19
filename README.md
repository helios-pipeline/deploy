# Helios Infrastructure Deployment and CLI

[![ora](https://img.shields.io/npm/v/ora.svg)](https://www.npmjs.com/package/ora)
[![Version](https://img.shields.io/npm/v/try-helios.svg)](https://www.npmjs.com/package/try-helios)

This repository contains the automated deployment process for Helios, an open-source platform designed to simplify the visualization and analysis of real-time event streams. Helios exposes data from Amazon Kinesis streams for SQL querying, allowing teams to gain insights from their existing event streams through an intuitive interface.

![Helios Architecture](images/helios-architecture.png)

## Infrastructure Overview

Helios deploys the following key components:

- ClickHouse database on EC2
- Flask web application on EC2
- Lambda function for Kinesis stream processing
- DynamoDB table for stream-to-table mapping
- S3 bucket for ClickHouse backups
- VPC and security groups

## Deployment and Management

Helios provides a Command-Line Interface (CLI) that streamlines the deployment, configuration, and management of Helios infrastructure on AWS. This interface leverages the AWS Cloud Development Kit (CDK) to manage infrastructure as code. This allows for consistent, repeatable deployments and easy management of complex AWS resources.

### Prerequisites

- An AWS account
- [AWS CLI installed and configured](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html) with the appropriate credentials and region
- Node.js and npm installed

### Installation

Install the Helios CLI globally:

```
npm install -g try-helios
```

### Deploying Helios

To deploy Helios infrastructure, run:

```
helios deploy
```

This command will guide you through the following steps:

1. You will be prompted to enter your AWS Profile name. This should correspond to a profile in your AWS credentials file.
2. You will have the option to enter a ChatGPT API key. This is optional, but if provided, it enables AI-powered error analysis for data in quarantine tables. When data fails to insert into the main ClickHouse tables due to schema mismatches or other errors, it's stored in quarantine tables.
3. The CLI will then use the AWS CDK to deploy all necessary Helios infrastructure to your AWS account.
4. You'll see a progress indicator while the deployment is in progress.
5. Upon successful deployment, you'll receive the URL where you can access the Helios web interface.

### Destroying Helios Infrastructure

To tear down the Helios infrastructure, run:

```
helios destroy
```

This command will:

1. Use the AWS CDK to destroy all Helios-related resources in your AWS account.
2. You'll see a progress indicator during the destruction process.
3. Upon completion, you'll receive a confirmation message.

**Note**: Destroying the infrastructure will remove all related resources and data. This action cannot be undone, so please use with caution.
