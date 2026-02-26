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
}

const AGENTS: AgentConfig[] = [
  { id: 'main', name: '主控鹅', emoji: '🪿' },
  { id: 'code-helper', name: '代码鹅', emoji: '💻' },
  { id: 'project-assistant', name: '项目鹅', emoji: '📊' },
  { id: 'admin-assistant', name: '行政鹅', emoji: '📋' },
  { id: 'tech-writer', name: '文案鹅', emoji: '✍️' },
  { id: 'researcher', name: '研究鹅', emoji: '🔬' },
  { id: 'content-assistant', name: '内容鹅', emoji: '📝' },
];

export default function AgentDialogue() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [fromAgent, setFromAgent] = useState('main');
  const [toAgent, setToAgent] = useState('code-helper');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionId = 'main-dialogue';

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
          setMessages(data.messages);
        }
      })
      .catch(console.error);
  }, []);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    // Add user message to UI immediately
    const newMessage: Message = {
      role: 'user',
      from: fromAgent,
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, newMessage]);

    try {
      const response = await fetch('/api/agent/dialogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromAgent,
          toAgent,
          message: userMessage,
          sessionId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Add agent response
        const agentMessage: Message = {
          role: 'assistant',
          from: toAgent,
          content: data.response,
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, agentMessage]);
      } else {
        // Add error message
        const errorMessage: Message = {
          role: 'assistant',
          from: 'system',
          content: `错误：${data.error}`,
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error: any) {
      const errorMessage: Message = {
        role: 'assistant',
        from: 'system',
        content: `请求失败：${error.message}`,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const clearSession = () => {
    setMessages([]);
    localStorage.removeItem(`dialogue-${sessionId}`);
  };

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
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Header */}
      <div className="bg-black/40 backdrop-blur-xl border-b border-white/10 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <span>💬</span> Agent 对话系统
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              主控鹅 ↔ 子智能体 直接对话
            </p>
          </div>
          <button
            onClick={clearSession}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg border border-red-500/30 transition-all"
          >
            清空对话
          </button>
        </div>
      </div>

      {/* Agent Selection */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10 p-4">
        <div className="max-w-6xl mx-auto flex gap-4">
          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-2">发送方</label>
            <select
              value={fromAgent}
              onChange={(e) => setFromAgent(e.target.value)}
              className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {AGENTS.map(agent => (
                <option key={agent.id} value={agent.id} className="bg-gray-900">
                  {agent.emoji} {agent.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-center pt-6">
            <span className="text-2xl text-gray-500">→</span>
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-2">接收方</label>
            <select
              value={toAgent}
              onChange={(e) => setToAgent(e.target.value)}
              className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {AGENTS.filter(a => a.id !== fromAgent).map(agent => (
                <option key={agent.id} value={agent.id} className="bg-gray-900">
                  {agent.emoji} {agent.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-20">
              <p className="text-lg">💬 开始 Agent 对话</p>
              <p className="text-sm mt-2">选择发送方和接收方，然后输入消息</p>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 ${
                message.role === 'user' ? 'flex-row' : 'flex-row-reverse'
              }`}
            >
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                  message.role === 'user'
                    ? 'bg-blue-500/20 border border-blue-500/30'
                    : 'bg-green-500/20 border border-green-500/30'
                }`}
              >
                {getAgentEmoji(message.from)}
              </div>
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-blue-500/20 border border-blue-500/30'
                    : 'bg-green-500/20 border border-green-500/30'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-white">
                    {getAgentName(message.from)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                <p className="text-gray-200 whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-xl">
                {getAgentEmoji(toAgent)}
              </div>
              <div className="bg-green-500/20 border border-green-500/30 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                  <span className="text-sm text-gray-400">思考中...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="bg-black/40 backdrop-blur-xl border-t border-white/10 p-4">
        <div className="max-w-4xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入消息..."
            className="flex-1 bg-white/5 border border-white/20 rounded-xl px-6 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all transform hover:scale-105"
          >
            发送
          </button>
        </div>
      </form>
    </div>
  );
}
