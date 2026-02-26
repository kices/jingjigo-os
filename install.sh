#!/bin/bash

################################################################################
# 竞技鹅 OS 自动安装脚本（含 OpenClaw）
# JingjiGo OS Auto Installer with OpenClaw
# 
# 使用方法:
#   curl -fsSL https://raw.githubusercontent.com/kices/jingjigo-os/main/install.sh | bash
#
# 功能:
#   - 自动安装 Node.js 20+
#   - 自动安装 OpenClaw
#   - 自动安装竞技鹅 OS
#   - 自动配置 PM2
#   - 一键完成所有
################################################################################

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# 配置
JINGJIGO_REPO="https://github.com/kices/jingjigo-os.git"
JINGJIGO_DIR="/root/jingjigo-os"
OPENCLAW_DIR="/root/.openclaw"
PORT="${PORT:-80}"
NODE_VERSION="20"

# 打印函数
print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[✓]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[⚠]${NC} $1"; }
print_error() { echo -e "${RED}[✗]${NC} $1"; }
print_step() { echo -e "${MAGENTA}[>>>]${NC} ${CYAN}$1${NC}"; }

# 检查 root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "请使用 root 用户运行此脚本"
        exit 1
    fi
    print_success "Root 用户检查通过"
}

# 检测操作系统
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$NAME
        VER=$VERSION_ID
        print_info "检测到操作系统：$OS $VER"
    else
        print_error "无法检测操作系统版本"
        exit 1
    fi
}

# 安装系统依赖
install_dependencies() {
    print_step "安装系统依赖..."
    
    if command -v dnf &> /dev/null; then
        dnf install -y git curl wget jq
    elif command -v yum &> /dev/null; then
        yum install -y git curl wget jq
    elif command -v apt-get &> /dev/null; then
        apt-get update && apt-get install -y git curl wget jq
    else
        print_error "不支持的包管理器"
        exit 1
    fi
    
    print_success "系统依赖安装完成"
}

# 安装 Node.js
install_nodejs() {
    print_step "安装 Node.js..."
    
    if command -v node &> /dev/null; then
        NODE_VER=$(node -v | cut -d'.' -f1 | cut -d'v' -f2)
        if [ "$NODE_VER" -ge 20 ]; then
            print_success "Node.js $(node -v) 版本符合要求"
            return
        fi
        print_warning "Node.js 版本过低 ($NODE_VER)，需要 >= 20"
    fi
    
    # 安装 nvm
    export NVM_DIR="$HOME/.nvm"
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    
    # 安装 Node.js 20
    nvm install $NODE_VERSION
    nvm use $NODE_VERSION
    nvm alias default $NODE_VERSION
    
    print_success "Node.js $(node -v) 安装完成"
}

# 安装 OpenClaw
install_openclaw() {
    print_step "安装 OpenClaw..."
    
    # 检查是否已安装
    if command -v openclaw &> /dev/null; then
        print_success "OpenClaw 已安装 ($(openclaw --version))"
        return
    fi
    
    # 全局安装 OpenClaw
    npm install -g openclaw
    
    print_success "OpenClaw 安装完成"
}

# 配置 OpenClaw
setup_openclaw() {
    print_step "配置 OpenClaw..."
    
    mkdir -p "$OPENCLAW_DIR/workspace"
    mkdir -p "$OPENCLAW_DIR/config"
    
    # 创建基础配置
    cat > "$OPENCLAW_DIR/config/openclaw.json" << 'EOF'
{
  "model": "bailian/qwen3.5-plus",
  "default_model": "bailian/qwen3.5-plus",
  "thinking": "off",
  "workspace": "/root/.openclaw/workspace",
  "skills": {
    "auto_update": true,
    "auto_install": true
  }
}
EOF
    
    print_success "OpenClaw 配置完成"
}

# 安装竞技鹅 OS
install_jingjigo() {
    print_step "安装竞技鹅 OS..."
    
    if [ -d "$JINGJIGO_DIR" ]; then
        print_info "目录已存在，更新代码..."
        cd "$JINGJIGO_DIR"
        git pull origin main
    else
        print_info "克隆仓库..."
        git clone "$JINGJIGO_REPO" "$JINGJIGO_DIR"
        cd "$JINGJIGO_DIR"
    fi
    
    print_success "竞技鹅 OS 代码准备完成"
}

# 安装项目依赖
install_project_deps() {
    print_step "安装项目依赖..."
    cd "$JINGJIGO_DIR"
    npm install
    print_success "项目依赖安装完成"
}

# 构建项目
build_project() {
    print_step "构建项目..."
    cd "$JINGJIGO_DIR"
    npm run build
    print_success "项目构建完成"
}

# 安装 PM2
install_pm2() {
    print_step "安装 PM2..."
    
    if ! command -v pm2 &> /dev/null; then
        npm install -g pm2
        print_success "PM2 安装完成"
    else
        print_success "PM2 已安装 ($(pm2 -v))"
    fi
}

# 配置 PM2
setup_pm2() {
    print_step "配置 PM2..."
    cd "$JINGJIGO_DIR"
    
    # 停止旧实例
    pm2 stop mission-control 2>/dev/null || true
    pm2 delete mission-control 2>/dev/null || true
    
    # 启动新实例
    PORT=$PORT HOST=0.0.0.0 pm2 start npm --name "mission-control" -- start -- -H 0.0.0.0 -p $PORT
    
    sleep 10
    
    # 保存 PM2 配置
    pm2 save
    pm2 startup | tail -5
    
    print_success "PM2 配置完成"
}

# 配置防火墙
setup_firewall() {
    print_step "配置防火墙..."
    
    if command -v firewall-cmd &> /dev/null; then
        firewall-cmd --permanent --add-port=$PORT/tcp 2>/dev/null || true
        firewall-cmd --reload 2>/dev/null || true
    elif command -v ufw &> /dev/null; then
        ufw allow $PORT/tcp 2>/dev/null || true
    fi
    
    print_success "防火墙配置完成 (端口 $PORT)"
}

# 验证安装
verify_install() {
    print_step "验证安装..."
    sleep 5
    
    if curl -s http://localhost:$PORT > /dev/null 2>&1; then
        print_success "服务运行正常"
        return 0
    else
        print_warning "服务可能未正常启动"
        return 1
    fi
}

# 显示完成信息
show_complete() {
    echo ""
    echo "========================================"
    echo "     🎉 竞技鹅 OS 安装完成！"
    echo "     JingjiGo OS Installation Complete"
    echo "========================================"
    echo ""
    print_success "竞技鹅 OS 已成功安装！"
    echo ""
    print_info "访问地址：http://$(hostname -I | awk '{print $1}'):$PORT"
    print_info "或 http://localhost:$PORT"
    echo ""
    print_info "管理命令:"
    echo "  pm2 status              # 查看状态"
    echo "  pm2 logs mission-control # 查看日志"
    echo "  pm2 restart mission-control # 重启服务"
    echo ""
    print_info "OpenClaw 命令:"
    echo "  openclaw status         # 查看状态"
    echo "  openclaw skills         # 查看技能"
    echo ""
    echo "========================================"
    echo ""
}

# 主函数
main() {
    echo ""
    echo "========================================"
    echo "     竞技鹅 OS 自动安装程序"
    echo "     (含 OpenClaw 集成)"
    echo "========================================"
    echo ""
    
    check_root
    detect_os
    install_dependencies
    install_nodejs
    install_openclaw
    setup_openclaw
    install_pm2
    install_jingjigo
    install_project_deps
    build_project
    setup_pm2
    setup_firewall
    
    if verify_install; then
        show_complete
        exit 0
    else
        print_error "安装完成但服务未正常启动"
        print_warning "请检查日志：pm2 logs mission-control"
        exit 1
    fi
}

# 执行
main
