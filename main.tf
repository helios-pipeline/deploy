terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  required_version = ">= 1.2.0"
}

module "clickhouse_ec2_instance" {
  source = "./modules/clickhouse_ec2_instance"
}

module "lambda_function" {
  source           = "./modules/lambda"
  webapp_public_ip = module.clickhouse_ec2_instance.webapp_public_ip
}
