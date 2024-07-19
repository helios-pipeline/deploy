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
  subnet_id = "subnet-0000096f5281a5eec"
}

module "flask_ec2_instance" {
  source                = "./modules/flask_ec2_instance"
  clickhouse_public_ip  = module.clickhouse_ec2_instance.clickhouse_public_ip
  subnet_id = "subnet-0000096f5281a5eec"
}

module "lambda_function" {
  source           = "./modules/lambda"
  clickhouse_public_ip = module.clickhouse_ec2_instance.clickhouse_public_ip
}
