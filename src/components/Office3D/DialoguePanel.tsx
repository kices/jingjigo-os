/**
 * Agent Dialogue Panel Component
 * Shows real-time conversation between agents in 3D office
 */

'use client';

import { useState, useEffect, useRef } from 'react';

interface Message {
  role: 'user' | 'assistant';
  from: string;
  content: string;
  timestamp: string;
}

interface AgentConfig {
  id: string;
  name: string;
  emoji: string;
  status: 'idle' | 'working' | 'thinking' | 'error';
}

const AGENTS: AgentConfig[] = [
  { id: 'main', name: '主控鹅', emoji: '🪿', status: 'working' },
  { id: 'code-helper', name: '代码鹅', emoji: '💻', status: 'thinking' },
  { id: 'project-assistant', name: '项目鹅', emoji: '📊', status: 'idle' },
  { id: 'admin-assistant', name: '行政鹅', emoji: '📋', status: 'working' },
  { id: 'tech-writer', name: '文案鹅', emoji: '✍️', status: 'idle' },
  { id: 'researcher', name: '研究鹅', emoji: '🔬', status: 'thinking' },
  { id: 'content-assistant', name: '内容鹅', emoji: '📝', status: 'idle' },
];

export default function DialoguePanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeAgents, setActiveAgents] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionId = 'office-dialogue';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Load existing session
    fetch(`/api/agent/dialogue?sessionId=${sessionId}`)
      .then(res => res.json())
      .then(data => {
        if (data.messages) {
          setMessages(data.messages.slice(-10)); // Last 10 messages
        }
      })
      .catch(console.error);

    // Poll for new messages every 5 seconds
    const interval = setInterval(() => {
      fetch(`/api/agent/dialogue?sessionId=${sessionId}`)
        .then(res => res.json())
        .then(data => {
          if (data.messages && data.messages.length > messages.length) {
            setMessages(data.messages.slice(-10));
            // Extract active agents from messages
            const active = Array.from(new Set(data.messages.slice(-3).map((m: any) => m.from)));
            setActiveAgents(active);
          }
        })
        .catch(console.error);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAgentEmoji = (agentId: string) => {
    return AGENTS.find(a => a.id === agentId)?.emoji || '🤖';
  };

  const getAgentName = (agentId: string) => {
    return AGENTS.find(a => a.id === agentId)?.name || agentId;
  };

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-[600px] max-w-[95vw]">
      {/* Panel Container */}
      <div className="bg-black/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
        {/* Header */}
        <div
          className="bg-gradient-to-r from-blue-600/80 to-green-600/80 px-4 py-3 cursor-pointer flex items-center justify-between"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">💬</span>
            <div>
              <h3 className="text-white font-bold text-sm">Agent 对话面板</h3>
              <p className="text-xs text-gray-300">
                {activeAgents.length > 0
                  ? `${activeAgents.map(getAgentName).join(' ↔ ')} 正在对话`
                  : '等待对话...'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {activeAgents.map(agentId => (
                <div
                  key={agentId}
                  className="w-8 h-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-lg"
                  title={getAgentName(agentId)}
                >
                  {getAgentEmoji(agentId)}
                </div>
              ))}
            </div>
            <button className="text-white/70 hover:text-white transition-colors">
              {isExpanded ? '▼' : '▲'}
            </button>
          </div>
        </div>

        {/* Messages */}
        {isExpanded && (
          <div className="max-h-[300px] overflow-y-auto p-4 space-y-3 bg-black/40">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p>💬 暂无对话</p>
                <p className="text-xs mt-1">Agent 协作时对话将显示在这里</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 animate-fade-in"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/30 to-green-500/30 border border-white/30 flex items-center justify-center text-base">
                    {getAgentEmoji(message.from)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-white">
                        {getAgentName(message.from)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-200 break-words line-clamp-3">
                      {message.content}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Status Bar */}
        <div className="bg-black/60 px-4 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <span className="text-gray-400">
              📊 会话：{messages.length} 条消息
            </span>
            <span className="text-gray-400">
              🤖 活跃：{activeAgents.length} Agent
            </span>
          </div>
          <button
            onClick={() => setMessages([])}
            className="text-gray-400 hover:text-red-400 transition-colors"
          >
            清空
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
