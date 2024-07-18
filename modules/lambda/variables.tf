variable "clickhouse_public_ip" {
  type = string
}

variable "vpc_id" {
  description = "The ID of the VPC"
  type        = string
}

variable "subnet_ids" {
  description = "The ID of the subnet where the instance will be launched"
  type        = list(string)
}