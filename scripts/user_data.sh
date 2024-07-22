#!/bin/bash
apt-get update
apt-get install -y docker.io
systemctl start docker
systemctl enable docker
sudo usermod -aG docker ubuntu
docker pull jamesdrabinsky/helios-clickhouse-amd:dev
docker run -d --name my-clickhouse-container --ulimit nofile=262144:262144 -p 8123:8123 -p 8443:8443 -p 9000:9000 -p 9440:9440 jamesdrabinsky/helios-clickhouse-amd:dev