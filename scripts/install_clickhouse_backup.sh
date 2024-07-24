#!/bin/bash
sudo apt-get update
sudo curl -LO "https://github.com/Altinity/clickhouse-backup/releases/download/v2.5.20/clickhouse-backup-linux-amd64.tar.gz"
sudo tar -zxvf clickhouse-backup-linux-amd64.tar.gz
sudo mv build/linux/amd64/clickhouse-backup /usr/bin/
sudo rm clickhouse-backup-linux-amd64.tar.gz
sudo chmod +x /usr/bin/clickhouse-backup
sudo mkdir -p /etc/clickhouse-backup/

REGION=$(sudo curl -s http://169.254.169.254/latest/meta-data/placement/region)
ACCOUNT=$(curl -s http://169.254.169.254/latest/dynamic/instance-identity/document | grep accountId | cut -d'"' -f4)

# note that region is currently hardcoded to us-west-1
sudo tee /etc/clickhouse-backup/config.yml << EOF
general:
  remote_storage: s3
  max_file_size: 1073741824
  disable_progress_bar: true
  backups_to_keep_local: 1
  backups_to_keep_remote: 30
  log_level: info
  allow_empty_backups: false
  download_concurrency: 1
  upload_concurrency: 1
  restore_schema_on_cluster: ""
  upload_by_part: true
  download_by_part: true
clickhouse:
  username: default
  password: ""
  host: localhost
  port: 9000
  disk_mapping: {}
  skip_tables:
    - system.*
    - INFORMATION_SCHEMA.*
    - information_schema.*
  timeout: 5m
  freeze_by_part: false
  freeze_by_part_where: ""
  secure: false
  skip_verify: false
  sync_replicated_tables: true
  tls_key: ""
  tls_cert: ""
  tls_ca: ""
  log_sql_queries: false
  debug: false
  config_dir: "/etc/clickhouse-server"
  restart_command: "systemctl restart clickhouse-server"
  ignore_not_exists_error_during_freeze: true
  check_replicas_before_attach: true
s3:
  access_key: ""
  secret_key: ""
  bucket: "my-clickhouse-backups-${ACCOUNT}"
  endpoint: ""
  region: "${REGION}"
  acl: private
  assume_role_arn: ""
  force_path_style: false
  path: ""
  disable_ssl: false
  compression_level: 1
  compression_format: tar
  sse: ""
  disable_cert_verification: false
  use_custom_storage_class: false
  storage_class: STANDARD
  concurrency: 1
  part_size: 0
  max_parts_count: 10000
  allow_multipart_download: false
  debug: false
EOF

echo "YAML file 'clickhouse-backup.yml' has been created."