'use client';

import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3 } from 'three';
import VoxelAvatar from './VoxelAvatar';
import type { AgentConfig, AgentState } from './agentsConfig';

interface Obstacle {
  position: Vector3;
  radius: number;
}

interface MovingAvatarProps {
  agent: AgentConfig;
  state: AgentState;
  officeBounds: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  };
  obstacles: Obstacle[];
  otherAvatarPositions: Map<string, Vector3>;
  otherAgentStates: Record<string, AgentState>;
  onPositionUpdate: (id: string, pos: Vector3) => void;
  onConversationUpdate?: (agentId: string, agentName: string, text: string) => void;
}

export default function MovingAvatar({ 
  agent, 
  state, 
  officeBounds, 
  obstacles, 
  otherAvatarPositions,
  otherAgentStates,
  onPositionUpdate,
  onConversationUpdate
}: MovingAvatarProps) {
  const groupRef = useRef<Group>(null);
  const [facingAgent, setFacingAgent] = useState<string | null>(null);
  const [conversationText, setConversationText] = useState<string>('');
  
  // Posición inicial completamente aleatoria SIN colisiones
  const [initialPos] = useState(() => {
    let pos: Vector3;
    let attempts = 0;
    const minDistanceToObstacle = 2.5; // 增加距离避免进入桌子

    // Intentar hasta 100 veces encontrar una posición sin colisión
    do {
      const x = Math.random() * (officeBounds.maxX - officeBounds.minX - 4) + officeBounds.minX + 2;
      const z = Math.random() * (officeBounds.maxZ - officeBounds.minZ - 4) + officeBounds.minZ + 2;
      pos = new Vector3(x, 0, z); // Y=0 在地面上（group 的 Y 坐标）

      // Verificar colisión con obstáculos（包括桌子）
      let isFree = true;
      for (const obstacle of obstacles) {
        const distance = pos.distanceTo(obstacle.position);
        if (distance < obstacle.radius + minDistanceToObstacle) {
          isFree = false;
          break;
        }
      }

      if (isFree) break;
      attempts++;
    } while (attempts < 100);

    return pos;
  });

  // 保持 Y 坐标在地面上 (group Y=0, Avatar 内部 Y=0.6)
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.y = 0;
    }
  });

  const [targetPos, setTargetPos] = useState(initialPos);
  const currentPos = useRef(initialPos.clone());
  
  // Notificar posición inicial
  useEffect(() => {
    onPositionUpdate(agent.id, initialPos.clone());
  }, []);

  // 检测最近的活跃 Agent 进行面对面交流
  useEffect(() => {
    if (!groupRef.current) return;

    let nearestAgent: string | null = null;
    let nearestDistance = 5.0; // 5 米内才交流
    const currentPos = groupRef.current.position;

    // 遍历其他 Agent 状态
    Object.entries(otherAgentStates).forEach(([otherId, otherState]) => {
      if (otherId === agent.id) return; // 跳过自己
      if (otherState.status !== 'working' && otherState.status !== 'thinking') return; // 只与工作中/思考中的 Agent 交流

      const otherPos = otherAvatarPositions.get(otherId);
      if (!otherPos) return;

      const distance = currentPos.distanceTo(otherPos);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestAgent = otherId;
      }
    });

    // 找到可交流的 Agent，面向它
    if (nearestAgent) {
      setFacingAgent(nearestAgent);
      const targetPos = otherAvatarPositions.get(nearestAgent);
      if (targetPos) {
        // 计算朝向目标的角度
        const angle = Math.atan2(targetPos.x - currentPos.x, targetPos.z - currentPos.z);
        groupRef.current.rotation.y = angle;
      }
      // 生成对话文字 - 发送到全局对话面板
      const phrases = {
        working: ['正在处理任务...', '工作中...', '执行操作...', '分析数据...'],
        thinking: ['思考中...', '考虑方案...', '计算中...', '规划中...'],
      };
      const statusPhrases = phrases[state.status as keyof typeof phrases] || phrases.working;
      const newPhrase = statusPhrases[Math.floor(Math.random() * statusPhrases.length)];
      setConversationText(newPhrase);
      
      // 触发全局对话事件
      if (onConversationUpdate) {
        onConversationUpdate(agent.id, agent.name, newPhrase);
      }
    } else {
      setFacingAgent(null);
      setConversationText('');
    }
  }, [state.status, otherAvatarPositions, otherAgentStates]);

  // Verificar si una posición está libre (sin colisiones)
  const isPositionFree = (pos: Vector3): boolean => {
    const minDistanceToObstacle = 1.5; // distancia mínima a muebles
    const minDistanceToAvatar = 1.2; // distancia mínima entre avatares

    // Verificar colisión con obstáculos
    for (const obstacle of obstacles) {
      const distance = pos.distanceTo(obstacle.position);
      if (distance < obstacle.radius + minDistanceToObstacle) {
        return false;
      }
    }

    // Verificar colisión con otros avatares
    for (const [otherId, otherPos] of otherAvatarPositions.entries()) {
      if (otherId === agent.id) continue;
      const distance = pos.distanceTo(otherPos);
      if (distance < minDistanceToAvatar) {
        return false;
      }
    }

    return true;
  };

  // Cambiar objetivo cada 5-10 segundos (depende del estado)
  useEffect(() => {
    const getNewTarget = () => {
      let attempts = 0;
      let newPos: Vector3;

      // Intentar encontrar una posición libre (máximo 20 intentos)
      do {
        const x = Math.random() * (officeBounds.maxX - officeBounds.minX) + officeBounds.minX;
        const z = Math.random() * (officeBounds.maxZ - officeBounds.minZ) + officeBounds.minZ;
        newPos = new Vector3(x, 0.6, z);
        attempts++;
      } while (!isPositionFree(newPos) && attempts < 20);

      if (attempts < 20) {
        setTargetPos(newPos);
      }
    };

    // Idle: moverse más frecuentemente
    // Working: moverse menos
    // Thinking: moverse muy poco
    // Error: quedarse quieto
    const getInterval = () => {
      switch (state.status) {
        case 'idle':
          return 3000 + Math.random() * 3000; // 3-6s
        case 'working':
          return 8000 + Math.random() * 7000; // 8-15s
        case 'thinking':
          return 15000 + Math.random() * 10000; // 15-25s
        case 'error':
          return 30000; // casi quieto
        default:
          return 10000;
      }
    };

    // Primer objetivo después de montar
    const timeout = setTimeout(getNewTarget, 1000);
    const interval = setInterval(getNewTarget, getInterval());
    
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [state.status]);

  // Mover suavemente hacia el objetivo
  useFrame((frameState, delta) => {
    if (!groupRef.current) return;

    const speed = state.status === 'idle' ? 1.5 : 0.8; // idle se mueve más rápido
    const moveSpeed = delta * speed;

    // Calcular nueva posición
    const newPos = currentPos.current.clone().lerp(targetPos, moveSpeed);

    // Verificar si la nueva posición es válida
    if (isPositionFree(newPos)) {
      currentPos.current.copy(newPos);
      // 保持 Y=0 在地面上
      currentPos.current.y = 0;
      groupRef.current.position.copy(currentPos.current);

      // Notificar la nueva posición
      onPositionUpdate(agent.id, currentPos.current.clone());

      // Rotar hacia la dirección del movimiento
      const direction = new Vector3().subVectors(targetPos, currentPos.current);
      if (direction.length() > 0.1) {
        const angle = Math.atan2(direction.x, direction.z);
        groupRef.current.rotation.y = angle;
      }
    } else {
      // Si hay colisión, buscar nuevo objetivo
      const x = Math.random() * (officeBounds.maxX - officeBounds.minX) + officeBounds.minX;
      const z = Math.random() * (officeBounds.maxZ - officeBounds.minZ) + officeBounds.minZ;
      const newTarget = new Vector3(x, 0, z); // Y=0 在地面上
      if (isPositionFree(newTarget)) {
        setTargetPos(newTarget);
      }
    }
  });

  return (
    <group ref={groupRef} position={initialPos} scale={3}>
      <VoxelAvatar
        agent={agent}
        position={[0, 0, 0]} // Avatar 在 group 中心，group 已经在正确高度
        isWorking={state.status === 'working'}
        isThinking={state.status === 'thinking'}
        isError={state.status === 'error'}
      />

      {/* 对话文字气泡已移除 - 改用底部对话面板 */}
    </group>
  );
}
