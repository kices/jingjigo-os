/**
 * Agent Task Flow Visualization
 * Shows real-time task chains and agent collaboration
 */

'use client';

import { useState, useEffect } from 'react';

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

const AGENT_COLORS: Record<string, string> = {
  main: 'from-yellow-500 to-orange-500',
  'code-helper': 'from-blue-500 to-cyan-500',
  'project-assistant': 'from-purple-500 to-pink-500',
  'admin-assistant': 'from-green-500 to-emerald-500',
  'tech-writer': 'from-pink-500 to-rose-500',
  researcher: 'from-indigo-500 to-blue-500',
  'content-assistant': 'from-amber-500 to-yellow-500',
};

const AGENT_EMOJIS: Record<string, string> = {
  main: '🪿',
  'code-helper': '💻',
  'project-assistant': '📊',
  'admin-assistant': '📋',
  'tech-writer': '✍️',
  researcher: '🔬',
  'content-assistant': '📝',
};

export default function TaskFlowVisualization() {
  const [flows, setFlows] = useState<TaskFlow[]>([]);
  const [selectedFlow, setSelectedFlow] = useState<string | null>(null);

  useEffect(() => {
    // Poll for task flow updates
    const fetchFlows = async () => {
      try {
        const response = await fetch('/api/agent/flows');
        if (response.ok) {
          const data = await response.json();
          setFlows(data.flows || []);
        }
      } catch (error) {
        console.error('Failed to fetch flows:', error);
      }
    };

    fetchFlows();
    const interval = setInterval(fetchFlows, 3000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'running': return 'bg-blue-500 animate-pulse';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getAgentName = (agentId: string) => {
    const names: Record<string, string> = {
      main: '主控鹅',
      'code-helper': '代码鹅',
      'project-assistant': '项目鹅',
      'admin-assistant': '行政鹅',
      'tech-writer': '文案鹅',
      researcher: '研究鹅',
      'content-assistant': '内容鹅',
    };
    return names[agentId] || agentId;
  };

  if (flows.length === 0) {
    return (
      <div className="bg-black/80 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
        <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
          <span>🔄</span> 任务流转图
        </h3>
        <div className="text-center text-gray-500 py-8">
          <p>暂无任务流</p>
          <p className="text-xs mt-1">Agent 开始协作时将显示任务链</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black/80 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
      <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
        <span>🔄</span> 任务流转图
      </h3>

      <div className="space-y-4 max-h-[400px] overflow-y-auto">
        {flows.map((flow) => (
          <div
            key={flow.id}
            className="bg-white/5 rounded-xl p-4 border border-white/10"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-semibold">{flow.name}</h4>
              <span className="text-xs text-gray-500">
                {new Date(flow.updatedAt).toLocaleTimeString('zh-CN')}
              </span>
            </div>

            {/* Flow Nodes */}
            <div className="flex flex-wrap items-center gap-2">
              {flow.nodes.map((node, index) => (
                <div key={node.id} className="flex items-center">
                  {/* Node */}
                  <div
                    className={`relative px-3 py-2 rounded-lg bg-gradient-to-r ${AGENT_COLORS[node.agent] || 'from-gray-500 to-gray-600'} min-w-[120px]`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{AGENT_EMOJIS[node.agent] || '🤖'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white/70 truncate">
                          {getAgentName(node.agent)}
                        </p>
                        <p className="text-xs text-white font-medium truncate">
                          {node.task}
                        </p>
                      </div>
                    </div>
                    {/* Status Indicator */}
                    <div
                      className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${getStatusColor(node.status)} border-2 border-black`}
                    />
                    {/* Progress Bar */}
                    {node.status === 'running' && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30 rounded-b-lg overflow-hidden">
                        <div
                          className="h-full bg-white/50 transition-all duration-300"
                          style={{ width: `${node.progress}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Arrow */}
                  {index < flow.nodes.length - 1 && (
                    <div className="flex items-center px-2">
                      <svg
                        className="w-4 h-4 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
