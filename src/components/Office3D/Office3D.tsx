'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky } from '@react-three/drei';
// Environment removed to avoid HDRI loading issues
import { Suspense, useState } from 'react';
import { Vector3 } from 'three';
import { AGENTS } from './agentsConfig';
import type { AgentState } from './agentsConfig';
import AgentDesk from './AgentDesk';
import Floor from './Floor';
import Walls from './Walls';
import Lights from './Lights';
import AgentPanel from './AgentPanel';
import FileCabinet from './FileCabinet';
import Whiteboard from './Whiteboard';
import CoffeeMachine from './CoffeeMachine';
import PlantPot from './PlantPot';
import WallClock from './WallClock';
import FirstPersonControls from './FirstPersonControls';
import MovingAvatar from './MovingAvatar';

export default function Office3D() {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [interactionModal, setInteractionModal] = useState<string | null>(null);
  const [controlMode, setControlMode] = useState<'orbit' | 'fps'>('orbit'); // orbit=轨道模式，fps=第一人称模式
  const [avatarPositions, setAvatarPositions] = useState<Map<string, any>>(new Map());
  const [conversationLog, setConversationLog] = useState<Array<{agentId: string, agentName: string, text: string, time: string}>>([]);
  
  // Initialize agent states from AGENTS config - ensure no undefined
  const [agentStates] = useState<Record<string, AgentState>>(() => {
    const states: Record<string, AgentState> = {};
    // Initialize ALL agents with default idle state
    AGENTS.forEach(agent => {
      states[agent.id] = {
        id: agent.id,
        status: 'idle' as const,
        model: agent.model || 'unknown',
        tokensPerHour: 0,
        tasksInQueue: 0,
        uptime: 0,
      };
    });
    // Set some mock activity for demo
    if (states['main']) {
      states['main'].status = 'working' as const;
      states['main'].currentTask = '处理任务';
      states['main'].tokensPerHour = 15000;
      states['main'].tasksInQueue = 3;
      states['main'].uptime = 12;
    }
    if (states['code-helper']) {
      states['code-helper'].status = 'thinking' as const;
      states['code-helper'].currentTask = '生成代码';
      states['code-helper'].tokensPerHour = 8000;
      states['code-helper'].tasksInQueue = 1;
      states['code-helper'].uptime = 5;
    }
    if (states['tech-writer']) {
      states['tech-writer'].status = 'working' as const;
      states['tech-writer'].currentTask = '编写文档';
      states['tech-writer'].tokensPerHour = 5000;
      states['tech-writer'].tasksInQueue = 2;
      states['tech-writer'].uptime = 10;
    }
    return states;
  });

  const handleDeskClick = (agentId: string) => {
    // Validate agent exists and has valid status
    const agent = AGENTS.find(a => a.id === agentId);
    const state = agentStates[agentId];
    if (agent && state && state.status) {
      setSelectedAgent(agentId);
    } else {
      console.warn('Agent not found or invalid:', agentId, agent, state);
    }
  };

  const handleClosePanel = () => {
    setSelectedAgent(null);
  };

  const handleFileCabinetClick = () => {
    setInteractionModal('memory');
  };

  const handleWhiteboardClick = () => {
    setInteractionModal('roadmap');
  };

  const handleCoffeeClick = () => {
    setInteractionModal('energy');
  };

  const handleCloseModal = () => {
    setInteractionModal(null);
  };

  // Handle conversation updates from agents
  const handleConversationUpdate = (agentId: string, agentName: string, text: string) => {
    const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setConversationLog(prev => {
      const newLog = [...prev, { agentId, agentName, text, time }];
      // Keep only last 10 messages
      return newLog.slice(-10);
    });
  };

  const handleAvatarPositionUpdate = (id: string, position: any) => {
    setAvatarPositions(prev => new Map(prev).set(id, position));
  };

  // Definir obstáculos (muebles)
  const obstacles = [
    // Escritorios (6)
    ...AGENTS.map(agent => ({
      position: new Vector3(agent.position[0], 0, agent.position[2]),
      radius: 1.5
    })),
    // Archivador
    { position: new Vector3(-8, 0, -5), radius: 0.8 },
    // Pizarra
    { position: new Vector3(0, 0, -8), radius: 1.5 },
    // Máquina de café
    { position: new Vector3(8, 0, -5), radius: 0.6 },
    // Plantas
    { position: new Vector3(-7, 0, 6), radius: 0.5 },
    { position: new Vector3(7, 0, 6), radius: 0.5 },
    { position: new Vector3(-9, 0, 0), radius: 0.4 },
    { position: new Vector3(9, 0, 0), radius: 0.4 },
  ];

  return (
    <div className="fixed inset-0 bg-gray-900" style={{ height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <Canvas
        camera={{ position: [0, 8, 12], fov: 60, near: 0.1, far: 1000 }}
        shadows
        gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}
        style={{ width: '100%', height: '100%' }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener('webglcontextlost', (event) => {
            event.preventDefault();
            console.warn('WebGL context lost, attempting to restore...');
          });
          gl.domElement.addEventListener('webglcontextrestored', () => {
            console.log('WebGL context restored');
          });
        }}
      >
        <Suspense fallback={
          <group>
            <mesh>
              <boxGeometry args={[2, 2, 2]} />
              <meshStandardMaterial color="orange" />
            </mesh>
            <mesh position={[0, 3, 0]}>
              <boxGeometry args={[0.5, 2, 0.5]} />
              <meshStandardMaterial color="gray" />
            </mesh>
          </group>
        }>
          {/* Iluminación */}
          <Lights />

          {/* Cielo y ambiente */}
          <Sky sunPosition={[100, 20, 100]} />
          {/* Environment removed to avoid HDRI loading from external CDN */}

          {/* Suelo */}
          <Floor />

          {/* Paredes */}
          <Walls />

          {/* Escritorios de agentes (sin avatares) */}
          {AGENTS.map((agent) => {
            const state = agentStates[agent.id];
            if (!state) return null; // Safety check
            return (
              <AgentDesk
                key={agent.id}
                agent={agent}
                state={state}
                onClick={() => handleDeskClick(agent.id)}
                isSelected={selectedAgent === agent.id}
              />
            );
          })}

          {/* Avatares móviles */}
          {AGENTS.map((agent) => {
            const state = agentStates[agent.id];
            if (!state) return null; // Safety check
            return (
              <MovingAvatar
                key={`avatar-${agent.id}`}
                agent={agent}
                state={state}
                officeBounds={{ minX: -8, maxX: 8, minZ: -7, maxZ: 7 }}
                obstacles={obstacles}
                otherAvatarPositions={avatarPositions}
                otherAgentStates={agentStates}
                onPositionUpdate={handleAvatarPositionUpdate}
              />
            );
          })}

          {/* Mobiliario interactivo */}
          <FileCabinet
            position={[-8, 0, -5]}
            onClick={handleFileCabinetClick}
          />
          <Whiteboard
            position={[0, 0, -8]}
            rotation={[0, 0, 0]}
            onClick={handleWhiteboardClick}
            agentStates={agentStates}
          />
          <CoffeeMachine
            position={[8, 0.8, -5]}
            onClick={handleCoffeeClick}
          />

          {/* Decoración */}
          <PlantPot position={[-7, 0, 6]} size="large" />
          <PlantPot position={[7, 0, 6]} size="medium" />
          <PlantPot position={[-9, 0, 0]} size="small" />
          <PlantPot position={[9, 0, 0]} size="small" />
          <WallClock
            position={[0, 2.5, -8.4]}
            rotation={[0, 0, 0]}
          />

          {/* Controles de cámara */}
          {controlMode === 'orbit' ? (
            <OrbitControls
              enableDamping
              dampingFactor={0.05}
              minDistance={5}
              maxDistance={30}
              maxPolarAngle={Math.PI / 2.2}
            />
          ) : (
            <FirstPersonControls moveSpeed={5} />
          )}
        </Suspense>
      </Canvas>

      {/* Panel lateral cuando se selecciona un agente */}
      {selectedAgent && agentStates[selectedAgent] && (
        <AgentPanel
          agent={AGENTS.find(a => a.id === selectedAgent)!}
          state={agentStates[selectedAgent]}
          onClose={handleClosePanel}
        />
      )}

      {/* Modal de interacciones con objetos */}
      {interactionModal && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-yellow-500 rounded-lg p-8 max-w-2xl w-full mx-4 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-yellow-400">
                {interactionModal === 'memory' && '📁 记忆浏览器'}
                {interactionModal === 'roadmap' && '📋 路线图与规划'}
                {interactionModal === 'energy' && '☕ Agent 能量看板'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-white text-3xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="text-gray-300 space-y-4">
              {interactionModal === 'memory' && (
                <>
                  <p className="text-lg">🧠 访问工作区记忆和文件</p>
                  <div className="bg-gray-800 p-4 rounded border border-gray-700">
                    <p className="text-sm text-gray-400 mb-2">快速链接：</p>
                    <ul className="space-y-2">
                      <li><a href="/memory" className="text-yellow-400 hover:underline">→ 完整记忆浏览器</a></li>
                      <li><a href="/files" className="text-yellow-400 hover:underline">→ 文件管理器</a></li>
                    </ul>
                  </div>
                  <p className="text-sm text-gray-500 italic">
                    这里将显示 memory/*.md 和工作区文件树
                  </p>
                </>
              )}

              {interactionModal === 'roadmap' && (
                <>
                  <p className="text-lg">🗺️ 项目路线图和规划板</p>
                  <div className="bg-gray-800 p-4 rounded border border-gray-700">
                    <p className="text-sm text-gray-400 mb-2">活跃阶段：</p>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <span className="text-green-400">✓</span>
                        <span>阶段 0: 竞技鹅 OS Shell</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-yellow-400">●</span>
                        <span>阶段 8: 3D 办公室 (MVP)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-gray-500">○</span>
                        <span>阶段 2: 文件浏览器专业版</span>
                      </li>
                    </ul>
                  </div>
                  <p className="text-sm text-gray-500 italic">
                    完整路线图见 workspace/mission-control/ROADMAP.md
                  </p>
                </>
              )}

              {interactionModal === 'energy' && (
                <>
                  <p className="text-lg">⚡ Agent 活动和能量水平</p>
                  <div className="bg-gray-800 p-4 rounded border border-gray-700 space-y-3">
                    <div>
                      <p className="text-sm text-gray-400">今日消耗 Token：</p>
                      <p className="text-2xl font-bold text-yellow-400">47,000</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">活跃 Agent：</p>
                      <p className="text-2xl font-bold text-green-400">3 / 6</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">系统运行时间：</p>
                      <p className="text-2xl font-bold text-blue-400">12 小时 34 分</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 italic">
                    这里将显示实时 Agent 心情/生产力指标
                  </p>
                </>
              )}
            </div>

            <button
              onClick={handleCloseModal}
              className="mt-6 w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 rounded transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {/* 控制面板 */}
      <div className="absolute top-4 left-4 bg-black/70 text-white p-4 rounded-lg backdrop-blur-sm">
        <h2 className="text-lg font-bold mb-2">🏢 3D 办公室</h2>
        <div className="text-sm space-y-1 mb-3">
          <p><strong>模式：{controlMode === 'orbit' ? '🖱️ 轨道模式' : '🎮 第一人称'}</strong></p>
          {controlMode === 'orbit' ? (
            <>
              <p>🖱️ 鼠标：旋转视角</p>
              <p>🔄 滚轮：缩放</p>
              <p>👆 点击：选择 Agent</p>
            </>
          ) : (
            <>
              <p>点击锁定鼠标</p>
              <p>WASD/方向键：移动</p>
              <p>空格：上升 | Shift：下降</p>
              <p>鼠标：视角 | ESC：解锁</p>
            </>
          )}
        </div>
        <button
          onClick={() => setControlMode(controlMode === 'orbit' ? 'fps' : 'orbit')}
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-3 rounded text-xs transition-colors"
        >
          切换到 {controlMode === 'orbit' ? '第一人称模式' : '轨道模式'}
        </button>
      </div>

      {/* 状态图例 */}
      <div className="absolute bottom-4 right-4 bg-black/70 text-white p-4 rounded-lg backdrop-blur-sm">
        <h3 className="text-sm font-bold mb-2">状态说明</h3>
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>工作中</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <span>思考中</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
            <span>空闲</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>错误</span>
          </div>
        </div>
      </div>

      {/* 左侧对话面板 - 移到最底部居中展示 */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-[600px] max-w-[90%] bg-black/80 text-white p-4 rounded-lg backdrop-blur-sm max-h-48 overflow-y-auto">
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2 justify-center">
          <span className="text-lg">💬</span>
          Agent 实时交互对话
        </h3>
        <div className="space-y-2">
          {conversationLog.length === 0 ? (
            <p className="text-xs text-gray-500 italic text-center">等待 Agent 对话...</p>
          ) : (
            conversationLog.map((conv, index) => (
              <div key={index} className="bg-white/5 p-2 rounded text-xs border-l-2 border-yellow-500">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-yellow-400">{conv.agentName}</span>
                  <span className="text-gray-500">{conv.time}</span>
                </div>
                <p className="text-gray-300">{conv.text}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
