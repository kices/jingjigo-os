#!/bin/bash

################################################################################
# 竞技鹅 OS 自动安装脚本
# JingjiGo OS Auto Installer
# 
# 使用方法:
#   curl -fsSL https://raw.githubusercontent.com/kices/jingjigo-os/main/install.sh | bash
#
# 或下载后执行:
#   wget https://raw.githubusercontent.com/YOUR_USERNAME/jingjigo-os/main/install.sh
#   chmod +x install.sh
#   ./install.sh
################################################################################

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
REPO_URL="https://github.com/kices/jingjigo-os.git"
INSTALL_DIR="/root/jingjigo-os"
PORT="${PORT:-80}"
NODE_VERSION="20"

# 打印函数
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否 root 用户
check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "请使用 root 用户运行此脚本"
        print_error "Usage: sudo $0"
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

# 检查并安装依赖
install_dependencies() {
    print_info "检查并安装依赖..."
    
    if command -v dnf &> /dev/null; then
        dnf install -y git curl wget nodejs npm
    elif command -v yum &> /dev/null; then
        yum install -y git curl wget nodejs npm
    elif command -v apt-get &> /dev/null; then
        apt-get update
        apt-get install -y git curl wget nodejs npm
    else
        print_error "不支持的包管理器"
        exit 1
    fi
    
    print_success "依赖安装完成"
}

# 安装 Node.js (如果版本不够)
install_nodejs() {
    print_info "检查 Node.js 版本..."
    
    if command -v node &> /dev/null; then
        NODE_VER=$(node -v | cut -d'.' -f1 | cut -d'v' -f2)
        if [ "$NODE_VER" -lt 20 ]; then
            print_warning "Node.js 版本过低 ($NODE_VER)，需要 >= 20"
            print_info "安装 Node.js $NODE_VERSION..."
            
            # 使用 nvm 安装
            curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
            export NVM_DIR="$HOME/.nvm"
            [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
            nvm install $NODE_VERSION
            nvm use $NODE_VERSION
            nvm alias default $NODE_VERSION
            
            print_success "Node.js $(node -v) 安装完成"
        else
            print_success "Node.js $(node -v) 版本符合要求"
        fi
    else
        print_info "安装 Node.js..."
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        nvm install $NODE_VERSION
        nvm use $NODE_VERSION
        
        print_success "Node.js $(node -v) 安装完成"
    fi
}

# 安装 PM2
install_pm2() {
    print_info "检查 PM2..."
    
    if ! command -v pm2 &> /dev/null; then
        print_info "安装 PM2..."
        npm install -g pm2
        print_success "PM2 安装完成"
    else
        print_success "PM2 已安装 ($(pm2 -v))"
    fi
}

# 克隆或更新代码
clone_repo() {
    print_info "获取竞技鹅 OS 代码..."
    
    if [ -d "$INSTALL_DIR" ]; then
        print_info "目录已存在，更新代码..."
        cd "$INSTALL_DIR"
        git pull origin main
    else
        print_info "克隆仓库..."
        git clone "$REPO_URL" "$INSTALL_DIR"
        cd "$INSTALL_DIR"
    fi
    
    print_success "代码准备完成"
}

# 安装项目依赖
install_project_deps() {
    print_info "安装项目依赖..."
    cd "$INSTALL_DIR"
    npm install
    print_success "项目依赖安装完成"
}

# 构建项目
build_project() {
    print_info "构建项目..."
    cd "$INSTALL_DIR"
    npm run build
    print_success "项目构建完成"
}

# 配置 PM2
setup_pm2() {
    print_info "配置 PM2..."
    cd "$INSTALL_DIR"
    
    # 停止旧实例
    pm2 stop mission-control 2>/dev/null || true
    pm2 delete mission-control 2>/dev/null || true
    
    # 启动新实例
    PORT=$PORT HOST=0.0.0.0 pm2 start npm --name "mission-control" -- start -- -H 0.0.0.0 -p $PORT
    
    # 等待启动
    sleep 10
    
    # 保存 PM2 配置
    pm2 save
    pm2 startup | tail -5
    
    print_success "PM2 配置完成"
}

# 配置防火墙
setup_firewall() {
    print_info "配置防火墙..."
    
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
    print_info "验证安装..."
    sleep 5
    
    if curl -s http://localhost:$PORT > /dev/null 2>&1; then
        print_success "服务运行正常"
        print_success "竞技鹅 OS 已成功安装！"
        echo ""
        print_info "访问地址：http://$(hostname -I | awk '{print $1}'):$PORT"
        print_info "或 http://localhost:$PORT"
    else
        print_warning "服务可能未正常启动，请检查日志："
        print_warning "pm2 logs mission-control"
    fi
}

# 显示帮助
show_help() {
    echo "竞技鹅 OS 自动安装脚本"
    echo ""
    echo "用法：$0 [选项]"
    echo ""
    echo "选项:"
    echo "  -p, --port PORT     设置端口 (默认：80)"
    echo "  -d, --dir DIR       设置安装目录 (默认：/root/jingjigo-os)"
    echo "  -h, --help          显示此帮助"
    echo ""
    echo "示例:"
    echo "  $0                  # 使用默认配置安装"
    echo "  $0 -p 3000          # 安装到端口 3000"
    echo "  $0 --port 8080      # 安装到端口 8080"
}

# 解析参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--port)
            PORT="$2"
            shift 2
            ;;
        -d|--dir)
            INSTALL_DIR="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            print_error "未知选项：$1"
            show_help
            exit 1
            ;;
    esac
done

# 主安装流程
main() {
    echo ""
    echo "========================================"
    echo "     竞技鹅 OS 自动安装程序"
    echo "     JingjiGo OS Installer"
    echo "========================================"
    echo ""
    
    check_root
    detect_os
    install_dependencies
    install_nodejs
    install_pm2
    clone_repo
    install_project_deps
    build_project
    setup_pm2
    setup_firewall
    verify_install
    
    echo ""
    echo "========================================"
    echo "          安装完成！"
    echo "========================================"
    echo ""
    print_info "管理命令:"
    echo "  pm2 status              # 查看状态"
    echo "  pm2 logs mission-control # 查看日志"
    echo "  pm2 restart mission-control # 重启服务"
    echo "  pm2 stop mission-control # 停止服务"
    echo ""
    print_info "访问地址：http://$(hostname -I | awk '{print $1}'):$PORT"
    echo ""
}

# 执行主函数
main
