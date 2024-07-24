#!/bin/bash

sudo apt-get install -y apt-transport-https ca-certificates curl gnupg

curl -fsSL 'https://packages.clickhouse.com/rpm/lts/repodata/repomd.xml.key' | sudo gpg --dearmor -o /usr/share/keyrings/clickhouse-keyring.gpg

echo "deb [signed-by=/usr/share/keyrings/clickhouse-keyring.gpg] https://packages.clickhouse.com/deb stable main" | sudo tee \
    /etc/apt/sources.list.d/clickhouse.list
    
sudo apt-get update

sudo DEBIAN_FRONTEND=noninteractive apt-get install -y clickhouse-server clickhouse-client

# Configure ClickHouse to listen on all interfaces
sudo sed -i 's/<listen_host>::1/<listen_host>::/' /etc/clickhouse-server/config.xml
sudo sed -i 's/<listen_host>127.0.0.1/<listen_host>0.0.0.0/' /etc/clickhouse-server/config.xml

# Start ClickHouse and enable it to start on boot
sudo systemctl start clickhouse-server
sudo systemctl enable clickhouse-server

sudo service clickhouse-server start
