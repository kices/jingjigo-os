'use client';

import { X } from 'lucide-react';
import type { AgentConfig, AgentState } from './agentsConfig';

interface AgentPanelProps {
  agent: AgentConfig;
  state: AgentState;
  onClose: () => void;
}

export default function AgentPanel({ agent, state, onClose }: AgentPanelProps) {
  const getStatusColor = () => {
    switch (state.status) {
      case 'working': return 'text-green-500';
      case 'thinking': return 'text-blue-500 animate-pulse';
      case 'error': return 'text-red-500';
      case 'idle':
      default: return 'text-gray-500';
    }
  };

  const getStatusBgColor = () => {
    switch (state.status) {
      case 'working': return 'bg-green-500/20';
      case 'thinking': return 'bg-blue-500/20';
      case 'error': return 'bg-red-500/20';
      case 'idle':
      default: return 'bg-gray-500/20';
    }
  };

  return (
    <div className="absolute right-0 top-0 h-full w-96 bg-black/90 backdrop-blur-md text-white p-6 shadow-2xl border-l border-white/10">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="text-4xl">{agent.emoji}</span>
            {agent.name}
          </h2>
          <p className="text-sm text-gray-400 mt-1">{agent.role}</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Status badge */}
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 ${getStatusBgColor()}`}>
        <div className={`w-2 h-2 rounded-full ${state.status === 'thinking' ? 'animate-pulse' : ''}`} style={{ backgroundColor: agent.color }}></div>
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {state.status === 'working' && '工作中'}
          {state.status === 'thinking' && '思考中'}
          {state.status === 'error' && '错误'}
          {state.status === 'idle' && '空闲'}
        </span>
      </div>

      {/* Current task */}
      {state.currentTask && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">当前任务</h3>
          <p className="text-base">{state.currentTask}</p>
        </div>
      )}

      {/* Stats */}
      <div className="space-y-4 mb-6">
        <h3 className="text-sm font-semibold text-gray-400">统计数据</h3>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Model */}
          <div className="bg-white/5 p-3 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">模型</p>
            <p className="text-lg font-bold capitalize">{state.model || 'N/A'}</p>
          </div>

          {/* Tokens/hour */}
          <div className="bg-white/5 p-3 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">Tokens/小时</p>
            <p className="text-lg font-bold">{state.tokensPerHour?.toLocaleString() || '0'}</p>
          </div>

          {/* Tasks in queue */}
          <div className="bg-white/5 p-3 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">队列</p>
            <p className="text-lg font-bold">{state.tasksInQueue || 0} 个任务</p>
          </div>

          {/* Uptime */}
          <div className="bg-white/5 p-3 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">运行时间</p>
            <p className="text-lg font-bold">{state.uptime || 0} 天</p>
          </div>
        </div>
      </div>

      {/* Activity Feed (placeholder) */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 mb-3">最近活动</h3>
        <div className="space-y-2">
          <div className="bg-white/5 p-3 rounded-lg text-sm">
            <p className="text-gray-400 text-xs mb-1">2 分钟前</p>
            <p>完成任务：生成报告</p>
          </div>
          <div className="bg-white/5 p-3 rounded-lg text-sm">
            <p className="text-gray-400 text-xs mb-1">15 分钟前</p>
            <p>开始：{state.currentTask || '处理数据'}</p>
          </div>
          <div className="bg-white/5 p-3 rounded-lg text-sm">
            <p className="text-gray-400 text-xs mb-1">1 小时前</p>
            <p>切换模型到 {state.model}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions - Placeholder (功能开发中) */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <h3 className="text-sm font-semibold text-gray-400 mb-3">快捷操作</h3>
        <div className="grid grid-cols-2 gap-2">
          <button 
            className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors cursor-not-allowed opacity-50"
            title="功能开发中"
            disabled
          >
            发送消息 (开发中)
          </button>
          <button 
            className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors cursor-not-allowed opacity-50"
            title="功能开发中"
            disabled
          >
            查看历史 (开发中)
          </button>
          <button 
            className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors cursor-not-allowed opacity-50"
            title="功能开发中"
            disabled
          >
            切换模型 (开发中)
          </button>
          <button 
            className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm transition-colors text-red-400 cursor-not-allowed opacity-50"
            title="功能开发中"
            disabled
          >
            终止任务 (开发中)
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">💡 这些功能将在后续版本中实现</p>
      </div>
    </div>
  );
}
