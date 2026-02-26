'use client';

import { useState } from 'react';
import { Box } from '@react-three/drei';
import type { AgentState } from './agentsConfig';

interface WhiteboardProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  onClick?: () => void;
  agentStates?: Record<string, AgentState>;
}

export default function Whiteboard({ position, rotation = [0, 0, 0], onClick, agentStates }: WhiteboardProps) {
  const [hovered, setHovered] = useState(false);

  // 获取正在工作的 Agent 任务
  const workingAgents = agentStates
    ? Object.values(agentStates).filter(agent => agent && agent.status === 'working' && agent.currentTask)
    : [];

  return (
    <group position={position} rotation={rotation}>
      {/* Board surface */}
      <Box
        args={[2.5, 1.5, 0.1]}
        position={[0, 1.5, 0]}
        castShadow
        receiveShadow
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial
          color={hovered ? '#f0f0f0' : '#ffffff'}
          emissive={hovered ? '#fbbf24' : '#000000'}
          emissiveIntensity={hovered ? 0.1 : 0}
        />
      </Box>

      {/* Frame */}
      <Box args={[2.6, 1.6, 0.08]} position={[0, 1.5, -0.05]}>
        <meshStandardMaterial color="#1f2937" metalness={0.3} roughness={0.6} />
      </Box>

      {/* Marker tray */}
      <Box args={[2.3, 0.1, 0.15]} position={[0, 0.7, 0.05]} castShadow>
        <meshStandardMaterial color="#6b7280" />
      </Box>

      {/* Markers */}
      {[-0.6, -0.2, 0.2, 0.6].map((x, i) => (
        <group key={i} position={[x, 0.75, 0.1]}>
          <Box args={[0.08, 0.3, 0.08]} castShadow>
            <meshStandardMaterial
              color={['#ef4444', '#3b82f6', '#22c55e', '#eab308'][i]}
            />
          </Box>
          {/* Cap */}
          <Box args={[0.09, 0.08, 0.09]} position={[0, 0.17, 0]} castShadow>
            <meshStandardMaterial color="#1f2937" />
          </Box>
        </group>
      ))}

      {/* "WORKING" header - simple colored bar */}
      {workingAgents.length > 0 && (
        <group position={[0, 2.2, 0.06]}>
          <Box args={[2, 0.3, 0.02]}>
            <meshStandardMaterial color="#3b82f6" />
          </Box>
        </group>
      )}

      {/* Working agents list - represented as colored dots */}
      {workingAgents.length > 0 && workingAgents.slice(0, 4).map((agent, index) => (
        agent && agent.id && (
          <group key={agent.id} position={[-0.8 + (index * 0.5), 1.8 - (Math.floor(index / 4) * 0.4), 0.06]}>
            {/* Status dot */}
            <mesh position={[0, 0, 0]}>
              <sphereGeometry args={[0.08, 16, 16]} />
              <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.5} />
            </mesh>
          </group>
        )
      ))}
    </group>
  );
}
