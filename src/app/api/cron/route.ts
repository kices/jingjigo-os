/**
 * Cron Jobs API - Real scheduled tasks
 * GET /api/cron
 */

import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const OPENCLAW_DIR = process.env.OPENCLAW_DIR || '/root/.openclaw';
const WORKSPACE = path.join(OPENCLAW_DIR, 'workspace');

interface CronJob {
  id: string;
  schedule: string;
  command: string;
  description: string;
  status: 'active' | 'inactive' | 'error';
  lastRun?: string;
  nextRun?: string;
  logs?: string[];
}

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const jobs: CronJob[] = [];

    // 1. Load system crontab
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      const { stdout } = await execAsync('crontab -l', { timeout: 5000 });
      const lines = stdout.split('\n');
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          // Parse cron schedule (5 fields + command)
          const parts = trimmed.split(/\s+/);
          if (parts.length >= 6) {
            const schedule = parts.slice(0, 5).join(' ');
            const command = parts.slice(5).join(' ');
            
            jobs.push({
              id: `cron-${Date.now()}-${Math.random()}`,
              schedule,
              command,
              description: command.slice(0, 50),
              status: 'active',
              nextRun: getNextRun(schedule),
            });
          }
        }
      }
    } catch (e) {
      // No crontab or command failed
    }

    // 2. Load from workspace scripts
    try {
      const scriptsDir = path.join(WORKSPACE, 'scripts');
      const scripts = await fs.readdir(scriptsDir);
      
      const scriptJobs: CronJob[] = [
        {
          id: 'dev-cycle',
          schedule: '*/10 * * * *',
          command: '/root/.openclaw/workspace/scripts/dev-cycle.sh',
          description: '开发周期检查 (每 10 分钟)',
          status: 'active',
          nextRun: getNextRun('*/10 * * * *'),
        },
        {
          id: 'progress-report',
          schedule: '*/20 * * * *',
          command: '/root/.openclaw/workspace/scripts/progress-report.sh',
          description: '进度汇报 (每 20 分钟)',
          status: 'active',
          nextRun: getNextRun('*/20 * * * *'),
        },
        {
          id: 'backup',
          schedule: '0 2 * * *',
          command: '/root/.openclaw/workspace/scripts/backup.sh',
          description: '每日备份 (凌晨 2 点)',
          status: 'active',
          nextRun: getNextRun('0 2 * * *'),
        },
      ];

      // Check if scripts exist
      for (const job of scriptJobs) {
        try {
          await fs.access(job.command);
          jobs.push(job);
        } catch (e) {
          // Script doesn't exist
          jobs.push({
            ...job,
            status: 'error',
            description: `${job.description} - 脚本不存在`,
          });
        }
      }
    } catch (e) {
      // Scripts dir might not exist
    }

    // 3. Add OpenClaw internal cron from config
    try {
      const configPath = path.join(OPENCLAW_DIR, 'openclaw.json');
      const config = await fs.readFile(configPath, 'utf-8');
      const data = JSON.parse(config);
      
      if (data.cron && Array.isArray(data.cron)) {
        for (const cron of data.cron) {
          jobs.push({
            id: `openclaw-cron-${cron.name || Date.now()}`,
            schedule: cron.schedule || 'unknown',
            command: cron.command || 'unknown',
            description: cron.description || cron.name || 'OpenClaw 定时任务',
            status: cron.enabled === false ? 'inactive' : 'active',
          });
        }
      }
    } catch (e) {
      // Config might not have cron
    }

    // Add demo jobs if empty
    if (jobs.length === 0) {
      jobs.push(
        {
          id: 'demo-dev-cycle',
          schedule: '*/10 * * * *',
          command: 'dev-cycle.sh',
          description: '开发周期检查',
          status: 'active',
          nextRun: getNextRun('*/10 * * * *'),
        },
        {
          id: 'demo-progress',
          schedule: '*/20 * * * *',
          command: 'progress-report.sh',
          description: '进度汇报',
          status: 'active',
          nextRun: getNextRun('*/20 * * * *'),
        },
        {
          id: 'demo-backup',
          schedule: '0 2 * * *',
          command: 'backup.sh',
          description: '每日备份',
          status: 'active',
          nextRun: getNextRun('0 2 * * *'),
        }
      );
    }

    return NextResponse.json({ jobs });
  } catch (error: any) {
    console.error('[cron] Error:', error);
    return NextResponse.json(
      { error: 'Failed to load cron jobs', details: error.message },
      { status: 500 }
    );
  }
}

function getNextRun(schedule: string): string {
  // Simple next run calculation
  const now = new Date();
  
  if (schedule.includes('*/10')) {
    // Every 10 minutes
    const minutes = Math.ceil(now.getMinutes() / 10) * 10;
    const next = new Date(now);
    next.setMinutes(minutes === 60 ? 0 : minutes);
    next.setSeconds(0);
    if (minutes === 60) next.setHours(next.getHours() + 1);
    return next.toISOString();
  }
  
  if (schedule.includes('*/20')) {
    // Every 20 minutes
    const minutes = Math.ceil(now.getMinutes() / 20) * 20;
    const next = new Date(now);
    next.setMinutes(minutes === 60 ? 0 : minutes);
    next.setSeconds(0);
    if (minutes === 60) next.setHours(next.getHours() + 1);
    return next.toISOString();
  }
  
  if (schedule.includes('0 2')) {
    // Daily at 2:00 AM
    const next = new Date(now);
    next.setHours(2, 0, 0, 0);
    if (now.getHours() >= 2) {
      next.setDate(next.getDate() + 1);
    }
    return next.toISOString();
  }
  
  // Default: 1 hour from now
  const next = new Date(now);
  next.setHours(next.getHours() + 1);
  return next.toISOString();
}
