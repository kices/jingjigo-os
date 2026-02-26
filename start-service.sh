#!/bin/bash
cd /root/.openclaw/workspace/mission-control
export PORT=3001
export HOST=0.0.0.0
export PATH="/root/.nvm/versions/node/v22.22.0/bin:$PATH"
while true; do
  echo "Starting TenacitOS at $(date)" >> /tmp/tenacitos.log
  /root/.nvm/versions/node/v22.22.0/bin/npm start >> /tmp/tenacitos.log 2>&1
  echo "Service crashed at $(date), restarting in 3 seconds..." >> /tmp/tenacitos.log
  sleep 3
done
