#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const translations = [
  ['Introduce la contraseña para acceder', '请输入密码以访问系统'],
  ['Contraseña', '密码'],
  ['Contraseña incorrecta', '密码错误'],
  ['Error de conexión', '连接错误'],
  ['Verificando...', '验证中...'],
  ['Entrar', '登录'],
  ['Tenacitas Agent Dashboard', '竞技鹅智能管理系统'],
  ['Mission Control', '任务控制中心'],
  ['Overview of Tenacitas agent activity', '多 Agent 协作系统活动概览'],
  ['Total Activities', '总活动数'],
  ['Today', '今日'],
  ['Successful', '成功'],
  ['Errors', '错误'],
  ['Multi-Agent System', '多 Agent 系统'],
  ['Open Office', '3D 办公室'],
  ['View all →', '查看全部 →'],
  ['Recent Activity', '最近活动'],
  ['Quick Links', '快捷链接'],
  ['Cron Jobs', '定时任务'],
  ['Quick Actions', '快速操作'],
  ['System', '系统'],
  ['Live Logs', '实时日志'],
  ['Memory', '记忆'],
  ['Skills', '技能'],
  ['Notepad', '便签'],
  ['Quick notes, reminders, ideas...', '快速记录笔记、提醒、想法...'],
  ['Clear', '清空'],
  ['Dashboard', '仪表板'],
  ['System Monitor', '系统监控'],
  ['Files', '文件'],
  ['Agents', 'Agent'],
  ['Office', '办公室'],
  ['Activity', '活动'],
  ['Cron', '定时'],
  ['Sessions', '会话'],
  ['Costs & Analytics', '成本分析'],
  ['Settings', '设置'],
  ['Loading weather...', '加载天气中...'],
  ['CPU', 'CPU'],
  ['RAM', '内存'],
  ['DISK', '磁盘'],
  ['Uptime', '运行时间'],
];

function translateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  for (const [en, zh] of translations) {
    const escaped = en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp('(["\\' + "'])" + escaped + '(["\\' + "'])", 'g');
    if (regex.test(content)) {
      content = content.replace(regex, '$1' + zh + '$2');
      modified = true;
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✓ Translated:', filePath);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      walkDir(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      translateFile(filePath);
    }
  }
}

const srcDir = path.join(__dirname, '..', 'src');
console.log('Starting translation to Chinese...\n');
walkDir(srcDir);
console.log('\n✅ Translation complete!');
