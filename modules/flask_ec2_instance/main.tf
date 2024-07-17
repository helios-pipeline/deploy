provider "aws" {
  region  = "us-west-1"
  profile = "capstone-team4"
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
  key_name   = "capstone-key1"
  public_key = tls_private_key.ssh_key.public_key_openssh
}

resource "local_file" "private_key" {
  content         = tls_private_key.ssh_key.private_key_pem
  filename        = "${path.module}/capstone-key.pem"
  file_permission = "0400"
}

resource "aws_security_group" "flask_sg" {
  name        = "flask-security-group"
  description = "Security group for flask EC2 instance"

  ingress {
    from_port   = 5000
    to_port     = 5000
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
    Name = "flask-security-group"
  }
}

resource "aws_instance" "flask_server" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t2.micro"
  vpc_security_group_ids = [aws_security_group.flask_sg.id]
  key_name               = aws_key_pair.generated_key.key_name

  tags = {
    Name = "Flask-Server"
  }

  user_data = <<-EOT
  #!/bin/bash
  apt-get update
  apt-get install -y docker.io
  systemctl start docker
  systemctl enable docker
  sudo usermod -aG docker ubuntu
  docker pull jamesdrabinsky/flask-frontend-app:latest

  cat << EOF > Dockerfile
  FROM jamesdrabinsky/flask-frontend-app:latest
  ENV CH_HOST=${var.webapp_public_ip}
  EOF

  # Build a new image with the environment variable
  docker build -t flask-app-with-env .

  # Run the new image
  docker run -d -p 5000:5000 --name flask-app flask-app-with-env

  # Clean up
  rm Dockerfile
  EOT
}

output "private_key" {
  value     = tls_private_key.ssh_key.private_key_pem
  sensitive = true
}



# docker run -d -p 5000:5000 --name flask-app jamesdrabinsky/flask-frontend-app:latest

# docker exec -it flask-app
# echo "CH_HOST=${var.webapp_public_ip}" >> .env
