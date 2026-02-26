#!/bin/bash
# 7×24 自主开发周期 - 每 10 分钟执行

set -e

WORKSPACE="/root/jingjigo-os"
LOG_FILE="/root/.openclaw/workspace/logs/dev-cycle.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$TIMESTAMP] === 开发周期开始 ===" >> "$LOG_FILE"

cd "$WORKSPACE"

# 1. 检查 Git 状态
echo "[$TIMESTAMP] 检查 Git 状态..." >> "$LOG_FILE"
git status --short >> "$LOG_FILE" 2>&1

# 2. 拉取最新代码
echo "[$TIMESTAMP] 拉取最新代码..." >> "$LOG_FILE"
git pull >> "$LOG_FILE" 2>&1

# 3. 安装依赖（如果有新依赖）
echo "[$TIMESTAMP] 检查依赖..." >> "$LOG_FILE"
npm ci --only=production >> "$LOG_FILE" 2>&1 || true

# 4. TypeScript 检查
echo "[$TIMESTAMP] TypeScript 检查..." >> "$LOG_FILE"
npx tsc --noEmit >> "$LOG_FILE" 2>&1 || echo "[$TIMESTAMP] TS 检查有警告" >> "$LOG_FILE"

# 5. 构建
echo "[$TIMESTAMP] 开始构建..." >> "$LOG_FILE"
npm run build >> "$LOG_FILE" 2>&1

# 6. 重启 PM2
echo "[$TIMESTAMP] 重启 PM2 服务..." >> "$LOG_FILE"
pm2 restart mission-control >> "$LOG_FILE" 2>&1

# 7. 记录完成
echo "[$TIMESTAMP] === 开发周期完成 ===" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# 8. 发送通知（可选）
# curl -X POST "https://api.telegram.org/botXXX/sendMessage" \
#   -d "chat_id=XXX" \
#   -d "text=✅ 开发周期完成" >> "$LOG_FILE" 2>&1 || true

echo "开发周期完成"
