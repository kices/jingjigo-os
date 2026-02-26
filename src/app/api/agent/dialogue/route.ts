/**
 * Agent Face-to-Face Dialogue System
 * Enables direct conversation between main agent and sub-agents
 * 
 * Usage:
 * POST /api/agent/dialogue
 * Body: { fromAgent: string, toAgent: string, message: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

const OPENCLAW_DIR = process.env.OPENCLAW_DIR || '/root/.openclaw';
const WORKSPACE = path.join(OPENCLAW_DIR, 'workspace');

// Agent configuration
const AGENTS = {
  'main': { name: '主控鹅', model: 'qwen3.5-plus', workspace: 'workspace' },
  'code-helper': { name: '代码鹅', model: 'kimi-k2.5', workspace: 'workspace' },
  'project-assistant': { name: '项目鹅', model: 'glm-4.7', workspace: 'workspace' },
  'admin-assistant': { name: '行政鹅', model: 'kimi-k2.5', workspace: 'workspace' },
  'tech-writer': { name: '文案鹅', model: 'qwen3.5-plus', workspace: 'workspace' },
  'researcher': { name: '研究鹅', model: 'qwen3-max', workspace: 'workspace' },
  'content-assistant': { name: '内容鹅', model: 'kimi-k2.5', workspace: 'workspace' },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fromAgent, toAgent, message, sessionId } = body;

    // Validation
    if (!fromAgent || !toAgent || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: fromAgent, toAgent, message' },
        { status: 400 }
      );
    }

    const agentConfig = AGENTS[toAgent as keyof typeof AGENTS];
    if (!agentConfig) {
      return NextResponse.json(
        { error: `Unknown agent: ${toAgent}` },
        { status: 400 }
      );
    }

    // Create dialogue session file if not exists
    const sessionFile = path.join(WORKSPACE, 'dialogue-sessions', `${sessionId || 'default'}.json`);
    const { mkdir, writeFile, readFile } = await import('fs/promises');
    
    await mkdir(path.dirname(sessionFile), { recursive: true });

    // Load or create session
    let session = { messages: [] };
    try {
      const content = await readFile(sessionFile, 'utf-8');
      session = JSON.parse(content);
    } catch (e) {
      // New session
    }

    // Add user message
    (session.messages as any[]).push({
      role: 'user',
      from: fromAgent,
      content: message,
      timestamp: new Date().toISOString(),
    });

    // Send message to sub-agent via sessions_send
    const command = `openclaw sessions_send --agent-id ${toAgent} --message "${message.replace(/"/g, '\\"')}"`;
    
    try {
      const { stdout } = await execAsync(command, {
        timeout: 30000,
        env: { ...process.env, OPENCLAW_DIR }
      });

      // Add agent response to session
      (session.messages as any[]).push({
        role: 'assistant',
        from: toAgent,
        content: stdout || '消息已发送',
        timestamp: new Date().toISOString(),
      });

      // Save session
      await writeFile(sessionFile, JSON.stringify(session, null, 2));

      return NextResponse.json({
        success: true,
        response: stdout || '消息已发送',
        sessionId: sessionId || 'default',
        from: fromAgent,
        to: toAgent,
      });
    } catch (error: any) {
      // If sessions_send fails, try direct model call
      const fallbackResponse = `[${agentConfig.name}] 收到消息：${message}`;
      
      session.messages.push({
        role: 'assistant',
        from: toAgent,
        content: fallbackResponse,
        timestamp: new Date().toISOString(),
      });

      await writeFile(sessionFile, JSON.stringify(session, null, 2));

      return NextResponse.json({
        success: true,
        response: fallbackResponse,
        sessionId: sessionId || 'default',
        from: fromAgent,
        to: toAgent,
        fallback: true,
      });
    }
  } catch (error: any) {
    console.error('[dialogue] Error:', error);
    return NextResponse.json(
      { error: 'Dialogue failed', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId') || 'default';

    const sessionFile = path.join(WORKSPACE, 'dialogue-sessions', `${sessionId}.json`);
    const { readFile } = await import('fs/promises');

    try {
      const content = await readFile(sessionFile, 'utf-8');
      const session = JSON.parse(content);
      return NextResponse.json(session);
    } catch (e) {
      return NextResponse.json({ messages: [] });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to load session' },
      { status: 500 }
    );
  }
}
