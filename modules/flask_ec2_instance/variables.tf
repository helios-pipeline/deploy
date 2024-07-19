variable "clickhouse_public_ip" {
  type        = string
  description = "The public IP of the ClickHouse instance"
}

variable "subnet_id" {
  description = "The ID of the subnet to launch the instance in"
  type        = string
}