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
  vpc_id      = var.vpc_id

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
  subnet_id              = var.subnet_id
  key_name               = aws_key_pair.generated_key.key_name
  associate_public_ip_address = true
  tags = {
    Name = "Flask-Server"
  }

  user_data = <<-EOF
#!/bin/bash
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1
echo "Starting user data script execution"

# Log the clickhouse_public_ip
echo "clickhouse_public_ip is: ${var.clickhouse_public_ip}"

apt-get update
apt-get install -y docker.io
echo "Docker installed"
systemctl start docker
systemctl enable docker

# Wait for Docker to be fully operational
echo "Waiting for Docker service to be fully operational..."
timeout=300  # 5 minutes timeout
end=$((SECONDS+timeout))

while [ $SECONDS -lt $end ]; do
    if docker info >/dev/null 2>&1; then
        echo "Docker is up and running"
        break
    else
        echo "Waiting for Docker to start... ($(($end-SECONDS)) seconds left)"
        sleep 5
    fi
done

if ! docker info >/dev/null 2>&1; then
    echo "Docker failed to start within the allotted time" >&2
    exit 1
fi

sudo usermod -aG docker ubuntu
echo "Added ubuntu user to docker group"

docker pull kuanchiliao/helios-flask-amd:dev
echo "Docker image pulled"

# Create a directory for the Dockerfile
mkdir -p /app
cd /app

# Create the Dockerfile
cat <<EOT > Dockerfile
FROM kuanchiliao/helios-flask-amd:dev
ENV CH_HOST=${var.clickhouse_public_ip}
EOT
echo "Dockerfile created"

# Build the new image
docker build -t flask-app-with-env .
echo "New Docker image built"

# Run the new image
docker run -d -p 5000:5000 --name flask-app flask-app-with-env
echo "Flask app container started"

echo "User data script execution completed"
EOF

  provisioner "local-exec" {
    command = <<EOT
      while ! nc -zv ${var.clickhouse_public_ip} 8123; do
        echo "Waiting for ClickHouse to be available..."
        sleep 2
      done
      echo "ClickHouse is up and running!"
    EOT
  }

  # provisioner "remote-exec" {
  #   inline = [
  #     "while ! nc -z ${var.clickhouse_public_ip} 8123; do echo 'Waiting for ClickHouse to be available...'; sleep 2; done",
  #     "echo 'ClickHouse is up and running!'"
  #   ]

  #   connection {
  #     type        = "ssh"
  #     user        = "ubuntu"
  #     private_key = tls_private_key.ssh_key.private_key_pem
  #     host        = aws_instance.flask_server.public_ip
  #   }
  # }

}

output "private_key" {
  value     = tls_private_key.ssh_key.private_key_pem
  sensitive = true
}

output "flask_server_public_ip" {
  value = aws_instance.flask_server.public_ip
}

# docker run -d -p 5000:5000 --name flask-app jamesdrabinsky/flask-frontend-app:latest

# docker exec -it flask-app
# echo "CH_HOST=${var.clickhouse_public_ip}" >> .env

# sudo cat /var/log/user-data.log
# sudo docker logs flask-app

An error occurred (AccessDeniedException) when calling the Query operation: User: arn:aws:iam::533266998695:user/helios is not authorized to perform: dynamodb:Query on resource: arn:aws:dynamodb:us-west-1:533266998695:table/tables_streams because no VPC endpoint policy allows the dynamodb:Query action