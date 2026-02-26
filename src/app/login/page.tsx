"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Terminal, Lock, AlertCircle } from "lucide-react";

function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (data.success) {
        // Always redirect to dashboard after login
        window.location.href = '/dashboard';
        return;
      } else {
        setError(data.error || "密码错误");
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError("连接错误：" + (err.message || "未知错误"));
    }

    setLoading(false);
    
    // 确保无论成功失败都停止 loading
    setTimeout(() => setLoading(false), 500);
  };

  return (
    <div 
      className="rounded-xl p-10"
      style={{
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
      }}
    >
      {/* Header */}
      <div className="text-center mb-6 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">🪿</span>
          <h1 
            className="text-xl font-bold"
            style={{ 
              fontFamily: 'var(--font-heading)',
              color: 'var(--text-primary)',
              letterSpacing: '-0.5px'
            }}
          >
            竞技鹅智能 OS
          </h1>
        </div>
        <p 
          className="text-sm"
          style={{ color: 'var(--text-secondary)' }}
        >
          请输入密码以访问系统
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative">
          <Lock 
            className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px]" 
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-lg text-sm"
            style={{
              backgroundColor: 'var(--card-elevated)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
            placeholder="请输入密码"
            required
          />
        </div>

        {error && (
          <div 
            className="flex items-center gap-2 text-sm px-4 py-3 rounded-lg"
            style={{
              backgroundColor: 'var(--error-bg)',
              color: 'var(--error)',
            }}
          >
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50"
          style={{
            backgroundColor: 'var(--accent)',
            color: 'white',
          }}
        >
          {loading ? "登录中..." : "登录"}
        </button>
      </form>

      {/* Footer */}
      <p 
        className="text-center text-xs mt-6"
        style={{ color: 'var(--text-muted)' }}
      >
        竞技鹅智能管理系统
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 -ml-64"
      style={{ backgroundColor: 'var(--background)' }}
    >
      <div className="w-full max-w-md">
        <Suspense fallback={
          <div 
            className="rounded-xl p-10 animate-pulse"
            style={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
            }}
          >
            <div className="h-8 bg-gray-700 rounded mb-4" />
            <div className="h-12 bg-gray-700 rounded mb-4" />
            <div className="h-10 bg-gray-700 rounded" />
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
