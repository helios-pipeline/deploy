terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  required_version = ">= 1.2.0"
}

provider "aws" {
  region  = "us-west-1"
  profile = "capstone-team4"
}

module "clickhouse_ec2_instance" {
  source = "./modules/clickhouse_ec2_instance"
}

module "flask_ec2_instance" {
  source           = "./modules/flask_ec2_instance"
  webapp_public_ip = module.clickhouse_ec2_instance.webapp_public_ip
  depends_on       = [module.clickhouse_ec2_instance]
}

module "dynamodb_instance" {
  source = "./modules/dynamodb_instance"
}

module "lambda_function" {
  source           = "./modules/lambda"
  webapp_public_ip = module.clickhouse_ec2_instance.webapp_public_ip
}


 