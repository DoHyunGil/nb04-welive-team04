#!/bin/bash

# Nginx 리버스 프록시 설정 스크립트

echo "======================================"
echo "Nginx 리버스 프록시 설정"
echo "======================================"

# Nginx 설정 파일 복사
sudo cp scripts/nginx-config.conf /etc/nginx/sites-available/welive-backend

# 심볼릭 링크 생성
sudo ln -sf /etc/nginx/sites-available/welive-backend /etc/nginx/sites-enabled/

# 기본 설정 제거
sudo rm -f /etc/nginx/sites-enabled/default

# Nginx 설정 테스트
echo "Nginx 설정 테스트..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx 설정이 올바릅니다."
    echo "Nginx 재시작..."
    sudo systemctl restart nginx
    sudo systemctl enable nginx
    echo "✅ Nginx 설정 완료!"
else
    echo "❌ Nginx 설정에 오류가 있습니다."
    exit 1
fi

echo ""
echo "======================================"
echo "SSL 인증서 설정 (Let's Encrypt)"
echo "======================================"
echo ""
echo "다음 명령어로 SSL 인증서를 설정하세요:"
echo ""
echo "sudo apt-get install certbot python3-certbot-nginx -y"
echo "sudo certbot --nginx -d your-domain.com"
echo ""
