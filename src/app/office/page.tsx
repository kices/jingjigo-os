'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

// 动态导入 3D 组件（避免 SSR 问题）
const Office3D = dynamic(() => import('@/components/Office3D/Office3D'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">🪿</div>
        <h2 className="text-2xl font-bold text-white mb-2">正在加载 3D 办公室...</h2>
        <p className="text-gray-400">首次加载可能需要几秒钟</p>
      </div>
    </div>
  ),
});

// 动态导入对话面板和任务流
const DialoguePanel = dynamic(() => import('@/components/Office3D/DialoguePanel'), { ssr: false });
const TaskFlowViz = dynamic(() => import('@/components/Office3D/TaskFlowViz'), { ssr: false });

// 错误回退组件
function OfficeFallback({ error }: { error?: unknown }) {
  const err = error instanceof Error ? error : undefined;
  return (
    <div className="fixed inset-0 bg-gray-900 flex items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <div className="text-6xl mb-6">🏢</div>
        <h1 className="text-3xl font-bold text-white mb-4">竞技鹅 3D 办公室</h1>
        {err && (
          <div className="bg-red-900/50 rounded-lg p-4 mb-6 text-left">
            <p className="text-red-300 font-mono text-sm">错误：{err.message}</p>
          </div>
        )}
        <p className="text-gray-400 mb-6">
          3D 渲染暂时不可用，可能是浏览器不支持 WebGL 或显卡驱动问题。
        </p>
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">建议操作：</h2>
          <ul className="text-left text-gray-300 space-y-2">
            <li>• 检查浏览器是否支持 WebGL</li>
            <li>• 更新显卡驱动程序</li>
            <li>• 清除浏览器缓存后重试</li>
          </ul>
        </div>
        <div className="flex gap-4 justify-center flex-wrap">
          <a href="/" className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">返回仪表板</a>
          <button onClick={() => window.location.reload()} className="inline-block bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">重新加载</button>
        </div>
      </div>
    </div>
  );
}

function ErrorFallback({ error, resetErrorBoundary }: { error: unknown; resetErrorBoundary: () => void }) {
  const err = error instanceof Error ? error : new Error(String(error));
  return (
    <div role="alert">
      <OfficeFallback error={err} />
    </div>
  );
}

export default function OfficePage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🪿</div>
          <h2 className="text-2xl font-bold text-white mb-2">正在加载...</h2>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.reload()}>
      <div className="relative">
        <Suspense fallback={
          <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">🪿</div>
              <h2 className="text-2xl font-bold text-white mb-2">正在加载 3D 办公室...</h2>
            </div>
          </div>
        }>
          <Office3D />
        </Suspense>
        
        {/* Dialogue Panel - Bottom Center */}
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
          <DialoguePanel />
        </div>
        
        {/* Task Flow Visualization - Top Right */}
        <div className="fixed top-4 right-4 w-[400px] max-w-[90vw] z-40">
          <TaskFlowViz />
        </div>
      </div>
    </ErrorBoundary>
  );
}
