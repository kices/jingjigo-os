/**
 * Agent Task Flow API
 * Manages task chains and agent collaboration workflows
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const WORKSPACE = process.env.OPENCLAW_DIR 
  ? path.join(process.env.OPENCLAW_DIR, 'workspace')
  : '/root/.openclaw/workspace';
const FLOWS_FILE = path.join(WORKSPACE, 'task-flows.json');

interface TaskNode {
  id: string;
  agent: string;
  task: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  dependencies: string[];
  startTime?: string;
  endTime?: string;
}

interface TaskFlow {
  id: string;
  name: string;
  nodes: TaskNode[];
  createdAt: string;
  updatedAt: string;
}

// GET - List all task flows
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const flowId = searchParams.get('flowId');

    let flows: TaskFlow[] = [];
    try {
      const content = await fs.readFile(FLOWS_FILE, 'utf-8');
      flows = JSON.parse(content);
    } catch (e) {
      // File doesn't exist yet
    }

    if (flowId) {
      const flow = flows.find(f => f.id === flowId);
      return NextResponse.json(flow || { error: 'Flow not found' });
    }

    return NextResponse.json({ flows });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to load flows', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create or update task flow
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { flowId, name, nodes, action } = body;

    let flows: TaskFlow[] = [];
    try {
      const content = await fs.readFile(FLOWS_FILE, 'utf-8');
      flows = JSON.parse(content);
    } catch (e) {
      // File doesn't exist yet
    }

    if (action === 'create') {
      // Create new flow
      const newFlow: TaskFlow = {
        id: flowId || `flow-${Date.now()}`,
        name: name || 'New Task Flow',
        nodes: nodes || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      flows.unshift(newFlow);
    } else if (action === 'update' && flowId) {
      // Update existing flow
      const index = flows.findIndex(f => f.id === flowId);
      if (index !== -1) {
        flows[index] = {
          ...flows[index],
          nodes: nodes || flows[index].nodes,
          updatedAt: new Date().toISOString(),
        };
      }
    } else if (action === 'delete' && flowId) {
      // Delete flow
      flows = flows.filter(f => f.id !== flowId);
    }

    // Save flows
    await fs.writeFile(FLOWS_FILE, JSON.stringify(flows, null, 2));

    return NextResponse.json({ 
      success: true, 
      flows: flows.slice(0, 10) // Return last 10 flows
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to save flow', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/agent/trigger - Trigger agent collaboration
export async function triggerAgentCollaboration(
  fromAgent: string,
  toAgent: string,
  task: string,
  dependencies: string[] = []
) {
  try {
    let flows: TaskFlow[] = [];
    try {
      const content = await fs.readFile(FLOWS_FILE, 'utf-8');
      flows = JSON.parse(content);
    } catch (e) {
      // File doesn't exist yet
    }

    // Find or create active flow
    let activeFlow = flows.find(f => f.nodes.some(n => n.status === 'running'));
    
    if (!activeFlow) {
      activeFlow = {
        id: `flow-${Date.now()}`,
        name: `${task.slice(0, 30)}...`,
        nodes: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      flows.unshift(activeFlow);
    }

    // Add new task node
    const newNode: TaskNode = {
      id: `task-${Date.now()}`,
      agent: toAgent,
      task: task,
      status: 'pending',
      progress: 0,
      dependencies: dependencies,
    };

    activeFlow.nodes.push(newNode);
    activeFlow.updatedAt = new Date().toISOString();

    // Save flows
    await fs.writeFile(FLOWS_FILE, JSON.stringify(flows, null, 2));

    // Trigger actual agent via sessions_send
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    try {
      const command = `openclaw sessions_send --agent-id ${toAgent} --message "${task.replace(/"/g, '\\"')}"`;
      await execAsync(command, {
        timeout: 5000,
        env: { ...process.env, OPENCLAW_DIR: process.env.OPENCLAW_DIR || '/root/.openclaw' }
      });

      // Update node status to running
      const nodeIndex = activeFlow.nodes.findIndex(n => n.id === newNode.id);
      if (nodeIndex !== -1) {
        activeFlow.nodes[nodeIndex].status = 'running';
        activeFlow.nodes[nodeIndex].startTime = new Date().toISOString();
        await fs.writeFile(FLOWS_FILE, JSON.stringify(flows, null, 2));
      }
    } catch (e) {
      console.error('Failed to trigger agent:', e);
    }

    return { success: true, flowId: activeFlow.id, taskId: newNode.id };
  } catch (error: any) {
    console.error('Failed to trigger collaboration:', error);
    return { success: false, error: error.message };
  }
}
