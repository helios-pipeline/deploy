#!/bin/bash

sudo apt-get install -y apt-transport-https ca-certificates curl gnupg

curl -fsSL 'https://packages.clickhouse.com/rpm/lts/repodata/repomd.xml.key' | sudo gpg --dearmor -o /usr/share/keyrings/clickhouse-keyring.gpg

echo "deb [signed-by=/usr/share/keyrings/clickhouse-keyring.gpg] https://packages.clickhouse.com/deb stable main" | sudo tee \
    /etc/apt/sources.list.d/clickhouse.list
    
sudo apt-get update

sudo DEBIAN_FRONTEND=noninteractive apt-get install -y clickhouse-server clickhouse-client

sudo tee /etc/clickhouse-server/config.d/network.xml <<EOF
<clickhouse>
    <listen_host replace="replace">
        <listen_host>0.0.0.0</listen_host>
    </listen_host>
</clickhouse>
EOF

sudo chown clickhouse:clickhouse /etc/clickhouse-server/config.d/network.xml
sudo chmod 644 /etc/clickhouse-server/config.d/network.xml

sudo systemctl start clickhouse-server
sudo systemctl enable clickhouse-server