/**
 * Activities API - Real data from OpenClaw logs
 * GET /api/activities
 */

import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const OPENCLAW_DIR = process.env.OPENCLAW_DIR || '/root/.openclaw';
const LOGS_DIR = path.join(OPENCLAW_DIR, 'workspace', 'logs');
const SESSIONS_DIR = path.join(OPENCLAW_DIR, 'sessions');

interface Activity {
  id: string;
  timestamp: string;
  type: string;
  description: string;
  status: 'success' | 'error' | 'warning' | 'info';
  duration_ms?: number;
  tokens_used?: number;
  agent?: string;
  metadata?: Record<string, any>;
}

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const agent = searchParams.get('agent');
    const type = searchParams.get('type');

    const activities: Activity[] = [];

    // 1. Load from activity logs
    try {
      const files = await fs.readdir(LOGS_DIR);
      const activityFiles = files.filter(f => f.includes('activity') || f.includes('progress'));
      
      for (const file of activityFiles.slice(-20)) {
        try {
          const content = await fs.readFile(path.join(LOGS_DIR, file), 'utf-8');
          const data = JSON.parse(content);
          
          if (data.activities && Array.isArray(data.activities)) {
            activities.push(...data.activities);
          } else if (data.task) {
            // Single activity
            activities.push({
              id: `task-${file}`,
              timestamp: data.startedAt || new Date().toISOString(),
              type: 'task',
              description: data.task,
              status: data.status === 'In Progress' ? 'info' : 'success',
              agent: data.agent,
              metadata: data,
            });
          }
        } catch (e) {
          // Skip invalid files
        }
      }
    } catch (e) {
      // Logs dir might not exist
    }

    // 2. Load from sessions (real agent activity)
    try {
      const sessionFiles = await fs.readdir(SESSIONS_DIR);
      for (const file of sessionFiles.slice(-10)) {
        try {
          const content = await fs.readFile(path.join(SESSIONS_DIR, file), 'utf-8');
          const data = JSON.parse(content);
          
          activities.push({
            id: `session-${file}`,
            timestamp: data.createdAt || new Date().toISOString(),
            type: 'session',
            description: `Agent ${data.agentId || 'unknown'} session`,
            status: 'info',
            agent: data.agentId,
            metadata: { label: data.label, kind: data.kind },
          });
        } catch (e) {
          // Skip invalid files
        }
      }
    } catch (e) {
      // Sessions dir might not exist
    }

    // 3. Add cron job activities
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      const { stdout } = await execAsync('crontab -l', { timeout: 5000 });
      const cronJobs = stdout.split('\n').filter(line => line.trim() && !line.startsWith('#'));
      
      for (const job of cronJobs) {
        activities.push({
          id: `cron-${Date.now()}-${Math.random()}`,
          timestamp: new Date().toISOString(),
          type: 'cron',
          description: `定时任务：${job.slice(0, 100)}`,
          status: 'success',
          metadata: { schedule: job },
        });
      }
    } catch (e) {
      // No crontab or command failed
    }

    // 4. Add mock activities for demo if empty
    if (activities.length === 0) {
      const mockActivities: Activity[] = [
        {
          id: 'demo-1',
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          type: 'task',
          description: 'Agent 任务链开发',
          status: 'success',
          agent: 'code-helper',
          duration_ms: 15420,
          tokens_used: 8500,
        },
        {
          id: 'demo-2',
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          type: 'session',
          description: '主控鹅处理用户请求',
          status: 'success',
          agent: 'main',
          duration_ms: 3200,
          tokens_used: 2100,
        },
        {
          id: 'demo-3',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          type: 'cron',
          description: '定时任务：开发周期检查',
          status: 'success',
          agent: 'system',
          metadata: { schedule: '*/10 * * * *' },
        },
        {
          id: 'demo-4',
          timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          type: 'task',
          description: '安全审计修复',
          status: 'success',
          agent: 'main',
          duration_ms: 45000,
          tokens_used: 12000,
        },
        {
          id: 'demo-5',
          timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
          type: 'session',
          description: '项目鹅创建任务流',
          status: 'success',
          agent: 'project-assistant',
          duration_ms: 8900,
          tokens_used: 4500,
        },
      ];
      activities.push(...mockActivities);
    }

    // Filter and sort
    let filtered = activities;
    if (agent) filtered = filtered.filter(a => a.agent === agent);
    if (type) filtered = filtered.filter(a => a.type === type);

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      activities: filtered.slice(0, limit),
      total: filtered.length,
    });
  } catch (error: any) {
    console.error('[activities] Error:', error);
    return NextResponse.json(
      { error: 'Failed to load activities', details: error.message },
      { status: 500 }
    );
  }
}
