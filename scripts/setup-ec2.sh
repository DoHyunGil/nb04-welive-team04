#!/bin/bash

# EC2 초기 설정 스크립트
# Ubuntu 22.04 LTS 기준

set -e  # 에러 발생시 스크립트 중단

echo "======================================"
echo "EC2 서버 초기 설정 시작"
echo "======================================"

# 시스템 업데이트
echo "[1/7] 시스템 업데이트..."
sudo apt-get update -y
sudo apt-get upgrade -y

# 기본 패키지 설치
echo "[2/7] 기본 패키지 설치..."
sudo apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    software-properties-common \
    git \
    unzip

# Docker 설치
echo "[3/7] Docker 설치..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io

# Docker 사용자 권한 설정
sudo usermod -aG docker $USER

# Docker 시작 및 자동 시작 설정
sudo systemctl start docker
sudo systemctl enable docker

# AWS CLI 설치
echo "[4/7] AWS CLI v2 설치..."
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip -q awscliv2.zip
sudo ./aws/install
rm -rf aws awscliv2.zip

# Nginx 설치
echo "[5/7] Nginx 설치..."
sudo apt-get install -y nginx

# 프로젝트 디렉토리 생성
echo "[6/7] 프로젝트 디렉토리 설정..."
mkdir -p ~/welive-backend
cd ~/welive-backend

# .env.production 파일 생성 안내
cat > ~/welive-backend/.env.production.example << 'EOF'
# ========================
# DATABASE (AWS RDS)
# ========================
DATABASE_URL="postgresql://postgres:PASSWORD@your-rds-endpoint.ap-northeast-2.rds.amazonaws.com:5432/welive"

# ========================
# SERVER
# ========================
PORT=4000
NODE_ENV=production

# ========================
# CORS
# ========================
CORS_ORIGIN="https://yourdomain.com"

# ========================
# JWT
# ========================
JWT_ACCESS_SECRET=your-strong-access-secret
JWT_REFRESH_SECRET=your-strong-refresh-secret

# ========================
# AWS S3
# ========================
AWS_REGION=ap-northeast-2
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_S3_BUCKET_NAME=nb04-welive-team04
EOF

# 방화벽 설정
echo "[7/7] 방화벽 설정..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

echo ""
echo "======================================"
echo "✅ EC2 초기 설정 완료!"
echo "======================================"
echo ""
echo "📝 다음 단계:"
echo "1. 로그아웃 후 재접속 (Docker 권한 적용)"
echo "   exit"
echo ""
echo "2. AWS 자격 증명 설정"
echo "   aws configure"
echo ""
echo "3. 환경 변수 파일 생성"
echo "   cd ~/welive-backend"
echo "   cp .env.production.example .env.production"
echo "   nano .env.production  # 실제 값으로 수정"
echo ""
echo "4. Nginx 설정"
echo "   # GitHub에서 nginx-config.conf 다운로드 후"
echo "   sudo cp nginx-config.conf /etc/nginx/sites-available/welive-backend"
echo "   sudo ln -s /etc/nginx/sites-available/welive-backend /etc/nginx/sites-enabled/"
echo "   sudo rm /etc/nginx/sites-enabled/default"
echo "   sudo nginx -t && sudo systemctl restart nginx"
echo ""
echo "5. GitHub Actions에서 자동 배포됩니다!"
echo ""
