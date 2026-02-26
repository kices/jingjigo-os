# 竞技鹅 OS

> 基于 TenacitOS 的多 Agent 任务控制中心

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20.0.0-green.svg)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![GitHub](https://img.shields.io/github/stars/kices/jingjigo-os?style=social)](https://github.com/kices/jingjigo-os)

## 🚀 快速开始

### 一键安装（推荐）

```bash
# 使用默认配置安装（端口 80）
curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/jingjigo-os/main/install.sh | bash

# 自定义端口安装
curl -fsSL https://raw.githubusercontent.com/kices/jingjigo-os/main/install.sh | bash -s -- -p 3000

# 下载后安装
wget https://raw.githubusercontent.com/kices/jingjigo-os/main/install.sh
chmod +x install.sh
./install.sh
```

### 手动安装

```bash
# 1. 克隆仓库
git clone https://github.com/kices/jingjigo-os.git
cd jingjigo-os

# 2. 安装依赖
npm install

# 3. 构建
npm run build

# 4. 启动
PORT=80 npm start

# 或使用 PM2
pm2 start npm --name "mission-control" -- start -- -H 0.0.0.0 -p 80
pm2 save
```

## 📋 系统要求

- **操作系统**: Linux (OpenCloudOS, CentOS, Ubuntu, Debian)
- **Node.js**: >= 20.0.0
- **内存**: >= 2GB
- **磁盘**: >= 1GB 可用空间

## 🎯 功能特性

- 🤖 **多 Agent 协作** - 支持 7+ Agent 同时工作
- 🏢 **3D 办公室** - 可视化任务流转
- 📊 **实时监控** - 活动日志、定时任务、技能管理
- 🔒 **安全加固** - 文件上传限制、输入验证、路径保护
- ⏰ **7×24 自主开发** - 自动开发周期、进度汇报、备份
- 📱 **响应式设计** - 支持桌面和移动设备

## 🛠️ 技术栈

- **AI 层**: OpenClaw 多 Agent 协作
- **前端**: Next.js 16 + React 18 + TypeScript
- **3D**: Three.js + @react-three/fiber + @react-three/drei
- **后端**: Next.js API Routes
- **进程管理**: PM2

## 📖 文档

- [安装指南](docs/install.md)
- [配置说明](docs/config.md)
- [Agent 开发](docs/agent-dev.md)
- [API 文档](docs/api.md)

## 🔧 常用命令

### PM2 管理

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs mission-control

# 重启服务
pm2 restart mission-control

# 停止服务
pm2 stop mission-control

# 删除服务
pm2 delete mission-control
```

### 开发

```bash
# 开发模式
npm run dev

# 生产构建
npm run build

# 启动生产服务
npm start

# 代码检查
npm run lint
```

## 📝 配置文件

### 环境变量

复制 `.env.example` 到 `.env.local`:

```bash
cp .env.example .env.local
```

编辑 `.env.local`:

```env
# OpenClaw 配置
OPENCLAW_DIR=/root/.openclaw

# 服务端口
PORT=80
HOST=0.0.0.0

# Agent 配置
AGENT_COUNT=7
```

## 🔒 安全说明

- 文件上传类型限制（50+ 扩展名白名单）
- 文件大小限制（10MB）
- 输入验证增强
- 路径遍历防护
- 安全评分：85/100

## 🤝 贡献

欢迎贡献代码！请查看 [贡献指南](CONTRIBUTING.md)。

## 📄 许可证

MIT License - 查看 [LICENSE](LICENSE) 文件

## 🙏 致谢

- 基于 [TenacitOS](https://github.com/tenacitos/tenacitos) 开发
- 感谢 [OpenClaw](https://openclaw.ai) 提供的 Agent 框架
- 3D 办公室灵感来自 [EvoMap](https://evomap.ai)

## 📞 联系方式

- **项目主页**: https://github.com/kices/jingjigo-os
- **问题反馈**: https://github.com/kices/jingjigo-os/issues
- **讨论区**: https://github.com/kices/jingjigo-os/discussions

---

**🪿 竞技鹅 OS - 让多 Agent 协作更简单！**
