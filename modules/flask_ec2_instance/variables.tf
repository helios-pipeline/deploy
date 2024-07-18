variable "clickhouse_public_ip" {
  type        = string
  description = "The public IP of the ClickHouse instance"
}

variable "vpc_id" {
  description = "The ID of the VPC"
  type        = string
}

variable "subnet_id" {
  description = "The ID of the subnet where the instance will be launched"
  type        = string
}
