#!/bin/bash
# 7×24 进度汇报 - 每 20 分钟执行

set -e

WORKSPACE="/root/jingjigo-os"
LOG_FILE="/root/.openclaw/workspace/logs/progress-report.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$TIMESTAMP] === 进度汇报 ===" >> "$LOG_FILE"

cd "$WORKSPACE"

# 1. 统计今日开发次数
DEV_COUNT=$(grep -c "开发周期完成" /root/.openclaw/workspace/logs/dev-cycle.log 2>/dev/null || echo "0")

# 2. 统计代码变更
LINES_ADDED=$(git log --since="00:00" --pretty=tformat: --numstat | awk '{added+=$1} END {print added}' 2>/dev/null || echo "0")
LINES_REMOVED=$(git log --since="00:00" --pretty=tformat: --numstat | awk '{removed+=$2} END {print removed}' 2>/dev/null || echo "0")

# 3. 获取 PM2 状态
PM2_STATUS=$(pm2 status | grep mission-control | awk '{print $6}' 2>/dev/null || echo "unknown")

# 4. 生成报告
REPORT="🪿 竞技鹅 OS 进度汇报

📊 今日开发周期：$DEV_COUNT 次
📝 代码变更：+$LINES_ADDED / -$LINES_REMOVED
✅ 服务状态：$PM2_STATUS
🕐 汇报时间：$TIMESTAMP"

echo "$REPORT" >> "$LOG_FILE"

# 5. 发送到 Telegram
curl -s -X POST "https://api.telegram.org/bot8656238462:AAHH8JrVu7X9Rx847KHVA_tr9wSRvpPwXr0/sendMessage" \
  -d "chat_id=-1003718132480" \
  -d "parse_mode=HTML" \
  -d "text=$(echo "$REPORT" | sed 's/\n/<br>/g')" >> "$LOG_FILE" 2>&1 || true

echo "进度汇报完成"
