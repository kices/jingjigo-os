#!/bin/bash
# 每日备份 - 每天 2:00 执行

set -e

WORKSPACE="/root/jingjigo-os"
BACKUP_DIR="/root/backups/jingjigo-os"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')

echo "=== 开始备份 ==="

# 创建备份目录
mkdir -p "$BACKUP_DIR"

cd "$WORKSPACE"

# 1. 备份数据库
echo "备份数据库..."
tar -czf "$BACKUP_DIR/data_$TIMESTAMP.tar.gz" data/ 2>/dev/null || true

# 2. 备份配置文件
echo "备份配置文件..."
tar -czf "$BACKUP_DIR/config_$TIMESTAMP.tar.gz" .env.local package.json 2>/dev/null || true

# 3. 备份日志
echo "备份日志..."
tar -czf "$BACKUP_DIR/logs_$TIMESTAMP.tar.gz" /root/.openclaw/workspace/logs/ 2>/dev/null || true

# 4. 清理旧备份（保留 7 天）
echo "清理旧备份..."
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete 2>/dev/null || true

# 5. Git 提交备份记录
echo "提交备份记录..."
git add -A
git commit -m "chore: daily backup $TIMESTAMP" || true
git push || true

echo "=== 备份完成 ==="
