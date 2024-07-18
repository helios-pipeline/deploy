terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "tls_private_key" "ssh_key" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "generated_key" {
  key_name   = "capstone-key"
  public_key = tls_private_key.ssh_key.public_key_openssh
}

resource "local_file" "private_key" {
  content         = tls_private_key.ssh_key.private_key_pem
  filename        = "${path.module}/capstone-key.pem"
  file_permission = "0400"
}

resource "aws_security_group" "clickhouse_sg" {
  name        = "clickhouse-security-group"
  description = "Security group for Clickhouse EC2 instance"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 8123
    to_port     = 8123
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 8124
    to_port     = 8124
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "clickhouse-security-group"
  }
}

resource "aws_instance" "clickhouse_server" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t2.micro"
  vpc_security_group_ids = [aws_security_group.clickhouse_sg.id]
  subnet_id              = var.subnet_id
  key_name               = aws_key_pair.generated_key.key_name

  tags = {
    Name = "ClickHouse-Server"
  }

  user_data = <<-EOF
            #!/bin/bash
            apt-get update
            apt-get install -y docker.io
            systemctl start docker
            systemctl enable docker
            sudo usermod -aG docker ubuntu
            docker pull jamesdrabinsky/helios-clickhouse-amd:dev
            docker run -d --name my-clickhouse-container --ulimit nofile=262144:262144 -p 8123:8123 -p 8443:8443 -p 9000:9000 -p 9440:9440 jamesdrabinsky/helios-clickhouse-amd:dev
            EOF
}


output "private_key" {
  value     = tls_private_key.ssh_key.private_key_pem
  sensitive = true
}

# output "clickhouse_public_ip" {
#   value = aws_instance.web_app.public_ip
# }

output "clickhouse_public_ip" {
  value = aws_instance.clickhouse_server.public_ip
}

# docker exec -it clickhouse-server clickhouse-client -- to run the clickhouse client

# WARNING: The requested image's platform (linux/arm64) does not match the detected host platform 
# (linux/amd64/v3) and no specific platform was requested

# docker pull clickhouse/clickhouse-server
# docker run -d --name my-clickhouse-container --ulimit nofile=262144:262144 -p 8124:8123 -p 9001:9000 clickhouse/clickhouse-server
