/**
 * Dashboard Page - Real-time Activity Stats
 */

'use client';

import { useEffect, useState } from 'react';
import { Activity, Clock, CheckCircle, AlertCircle, Users, FileText, Calendar } from 'lucide-react';

interface ActivityStats {
  total: number;
  today: number;
  success: number;
  error: number;
}

interface CronJob {
  id: string;
  schedule: string;
  description: string;
  status: string;
}

interface Skill {
  id: string;
  name: string;
  description: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<ActivityStats>({ total: 0, today: 0, success: 0, error: 0 });
  const [cronJobs, setCronJobs] = useState<CronJob[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch activities
        const activitiesRes = await fetch('/api/activities?limit=100');
        const activitiesData = await activitiesRes.json();
        
        // Calculate stats
        const activities = activitiesData.activities || [];
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        
        const todayActivities = activities.filter((a: any) => a.timestamp.startsWith(today));
        const successActivities = activities.filter((a: any) => a.status === 'success');
        const errorActivities = activities.filter((a: any) => a.status === 'error');
        
        setStats({
          total: activitiesData.total || activities.length,
          today: todayActivities.length,
          success: successActivities.length,
          error: errorActivities.length,
        });
        
        // Fetch cron jobs
        const cronRes = await fetch('/api/cron');
        const cronData = await cronRes.json();
        setCronJobs(cronData.jobs || []);
        
        // Fetch skills
        const skillsRes = await fetch('/api/skills');
        const skillsData = await skillsRes.json();
        setSkills(skillsData.skills || []);
        
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const statCards = [
    { title: '总活动数', value: stats.total, icon: Activity, color: 'from-blue-500 to-cyan-500' },
    { title: '今日', value: stats.today, icon: Clock, color: 'from-green-500 to-emerald-500' },
    { title: '成功', value: stats.success, icon: CheckCircle, color: 'from-purple-500 to-pink-500' },
    { title: '错误', value: stats.error, icon: AlertCircle, color: 'from-red-500 to-orange-500' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🪿</div>
          <h2 className="text-2xl font-bold text-white">加载中...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">竞技鹅智能 OS</h1>
          <p className="text-xl text-gray-400">多 Agent 协作系统活动概览</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-white/30 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-3xl font-bold text-white">{card.value}</span>
                </div>
                <h3 className="text-gray-400 font-medium">{card.title}</h3>
              </div>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cron Jobs */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-bold text-white">定时任务</h2>
            </div>
            <div className="space-y-3">
              {cronJobs.length > 0 ? (
                cronJobs.slice(0, 5).map((job) => (
                  <div key={job.id} className="bg-white/5 rounded-lg p-3">
                    <p className="text-white text-sm">{job.description}</p>
                    <p className="text-gray-500 text-xs mt-1">{job.schedule}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">无定时任务</p>
              )}
            </div>
          </div>

          {/* Skills */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-green-400" />
              <h2 className="text-xl font-bold text-white">技能列表</h2>
            </div>
            <div className="text-center py-8">
              <p className="text-4xl font-bold text-white mb-2">{skills.length}</p>
              <p className="text-gray-400">已安装技能</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
