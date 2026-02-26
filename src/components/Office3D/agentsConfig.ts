/**
 * Office 3D — Agent Configuration
 *
 * This file defines the visual layout of agents in the 3D office.
 * Names, emojis and roles are loaded at runtime from the OpenClaw API
 * (/api/agents → openclaw.json), so you only need to set positions and colors here.
 *
 * Agent IDs correspond to workspace directory suffixes:
 *   id: "main"     → workspace/          (main agent)
 *   id: "studio"   → workspace-studio/
 *   id: "infra"    → workspace-infra/
 *   etc.
 *
 * Add, remove or reposition agents to match your own OpenClaw setup.
 */

export interface AgentConfig {
  id: string;
  name: string;
  emoji: string;
  position: [number, number, number]; // x, y, z
  color: string;
  role: string;
  model?: string; // Optional model name
}

export const AGENTS: AgentConfig[] = [
  {
    id: "main",
    name: "主控鹅",
    emoji: "🪿",
    position: [0, 0, 0], // Center — main desk
    color: "#FFCC00",
    role: "主控 Agent",
    model: "qwen3.5-plus",
  },
  {
    id: "code-helper",
    name: "代码鹅",
    emoji: "💻",
    position: [-4, 0, -3],
    color: "#4CAF50",
    role: "代码助手",
    model: "kimi-k2.5",
  },
  {
    id: "project-assistant",
    name: "项目鹅",
    emoji: "📊",
    position: [4, 0, -3],
    color: "#E91E63",
    role: "项目管理",
    model: "glm-4.7",
  },
  {
    id: "meeting-secretary",
    name: "行政鹅",
    emoji: "📝",
    position: [-4, 0, 3],
    color: "#0077B5",
    role: "行政秘书",
    model: "kimi-k2.5",
  },
  {
    id: "tech-writer",
    name: "文案鹅",
    emoji: "✍️",
    position: [4, 0, 3],
    color: "#9C27B0",
    role: "技术写作",
    model: "qwen3.5-plus",
  },
  {
    id: "researcher",
    name: "研究鹅",
    emoji: "🔬",
    position: [0, 0, 6],
    color: "#607D8B",
    role: "研究员",
    model: "qwen3-max",
  },
];

export type AgentStatus = "idle" | "working" | "thinking" | "error";

export interface AgentState {
  id: string;
  status: AgentStatus;
  currentTask?: string;
  model?: string; // opus, sonnet, haiku
  tokensPerHour?: number;
  tasksInQueue?: number;
  uptime?: number; // days
}
