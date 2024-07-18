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

module "vpc" {
  source = "./modules/vpc"
}

module "clickhouse_ec2_instance" {
  source = "./modules/clickhouse_ec2_instance"
  vpc_id    = module.vpc.vpc_id
  subnet_id = module.vpc.public_subnet_ids
}

module "flask_ec2_instance" {
  source                = "./modules/flask_ec2_instance"
  vpc_id                = module.vpc.vpc_id
  subnet_id             = module.vpc.public_subnet_ids
  clickhouse_public_ip  = module.clickhouse_ec2_instance.clickhouse_public_ip
}

module "dynamodb_instance" {
  source = "./modules/dynamodb_instance"
}

module "lambda_function" {
  source           = "./modules/lambda"
  vpc_id           = module.vpc.vpc_id
  subnet_ids       = [module.vpc.public_subnet_ids]
  clickhouse_public_ip = module.clickhouse_ec2_instance.clickhouse_public_ip
}


 