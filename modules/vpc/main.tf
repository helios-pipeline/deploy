# terraform {
#   required_providers {
#     aws = {
#       source  = "hashicorp/aws"
#       version = "~> 5.0"
#     }
#   }
# }

# resource "aws_internet_gateway" "main" {
#   vpc_id = aws_vpc.main.id

#   tags = {
#     Name = "main-igw"
#   }
# }

# resource "aws_route_table" "public" {
#   vpc_id = aws_vpc.main.id

#   route {
#     cidr_block = "0.0.0.0/0"
#     gateway_id = aws_internet_gateway.main.id
#   }

#   tags = {
#     Name = "Public Route Table"
#   }
# }

# resource "aws_route_table_association" "public" {
#   subnet_id      = aws_subnet.public[0].id
#   route_table_id = aws_route_table.public.id
# }

# data "aws_availability_zones" "available" {}

# output "vpc_id" {
#   value = aws_vpc.main.id
# }

# output "public_subnet_ids" {
#   value = aws_subnet.public[0].id
# }
