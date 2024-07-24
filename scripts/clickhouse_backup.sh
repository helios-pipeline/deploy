#!/bin/bash
sudo tee /opt/scripts/clickhouse-backup.sh << 'EOF'
#!/bin/bash
set -e

BACKUP_NAME=clickhouse-backup_$(date -u +%Y-%m-%dT%H-%M-%S)

sudo clickhouse-backup create $BACKUP_NAME
sudo clickhouse-backup upload $BACKUP_NAME
EOF