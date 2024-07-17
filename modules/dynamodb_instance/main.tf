terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

resource "aws_dynamodb_table" "dynamodb_stream_table" {
  name           = "stream_table_map"
  billing_mode   = "PROVISIONED"
  read_capacity  = 3
  write_capacity = 3
  hash_key       = "stream_id"
  range_key      = "table_id"

  attribute {
    name = "stream_id"
    type = "S"
  }

  attribute {
    name = "table_id"
    type = "S"
  }

  global_secondary_index {
    name               = "TableIdIndex"
    hash_key           = "table_id"
    projection_type    = "ALL"
    read_capacity      = 1
    write_capacity     = 1
  }

  tags = {
    Name        = "dynamodb_stream_table"
  }
}
