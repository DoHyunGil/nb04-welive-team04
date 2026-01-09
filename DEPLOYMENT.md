# AWS EC2 배포 가이드

이 문서는 GitHub Actions를 사용하여 AWS ECR과 EC2로 자동 배포하는 방법을 설명합니다.

## 아키텍처

```
GitHub (main 브랜치 push)
    ↓
GitHub Actions
    ↓
Docker 이미지 빌드 → AWS ECR 푸시
    ↓
EC2 인스턴스에 SSH 접속
    ↓
ECR에서 이미지 Pull → Docker 컨테이너 실행
    ↓
Nginx 리버스 프록시 → 외부 접근
```

## 사전 준비

### 1. AWS 리소스 준비

#### 1-1. ECR 저장소 생성
```bash
# AWS Console에서 진행
1. ECR 콘솔로 이동
2. "리포지토리 생성" 클릭
3. 리포지토리 이름: welive-backend
4. 생성 후 URI 복사 (예: 123456789.dkr.ecr.ap-northeast-2.amazonaws.com/welive-backend)
```

#### 1-2. RDS PostgreSQL (이미 생성되어 있음)
- 엔드포인트 URL 확인
- 보안 그룹에서 EC2 인스턴스의 보안 그룹 허용 확인

#### 1-3. EC2 인스턴스 생성
```bash
1. AMI: Ubuntu Server 22.04 LTS
2. 인스턴스 타입: t3.small 이상 권장
3. 키 페어: 새로 생성 또는 기존 사용 (.pem 파일 다운로드)
4. 보안 그룹 설정:
   - SSH (22): 내 IP
   - HTTP (80): 0.0.0.0/0
   - HTTPS (443): 0.0.0.0/0
5. 스토리지: 20GB 이상
```

#### 1-4. IAM 사용자 생성 (GitHub Actions용)
```bash
1. IAM 콘솔 → 사용자 생성
2. 권한 정책:
   - AmazonEC2ContainerRegistryPowerUser
   - (또는 ECR에 대한 푸시 권한만)
3. 액세스 키 생성 → Access Key ID, Secret Access Key 저장
```

### 2. EC2 초기 설정

EC2 인스턴스에 SSH 접속:
```bash
# 로컬 머신에서
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@<EC2-PUBLIC-IP>
```

초기 설정 스크립트 실행:
```bash
# EC2 인스턴스에서
# 스크립트 다운로드
curl -o setup-ec2.sh https://raw.githubusercontent.com/your-repo/main/scripts/setup-ec2.sh

# 실행 권한 부여
chmod +x setup-ec2.sh

# 실행
./setup-ec2.sh
```

재접속:
```bash
exit
ssh -i your-key.pem ubuntu@<EC2-PUBLIC-IP>
```

### 3. AWS CLI 설정

```bash
# EC2 인스턴스에서
aws configure

# 입력:
# AWS Access Key ID: (GitHub Actions용 IAM 사용자의 키)
# AWS Secret Access Key: (GitHub Actions용 IAM 사용자의 시크릿)
# Default region name: ap-northeast-2
# Default output format: json
```

### 4. 환경 변수 파일 생성

```bash
cd ~/welive-backend
cp .env.production.example .env.production
nano .env.production
```

`.env.production` 파일에 실제 값 입력:
```bash
DATABASE_URL="postgresql://postgres:Welive2026!@database-1.c7c6maikgavt.ap-northeast-2.rds.amazonaws.com:5432/welive"
PORT=4000
NODE_ENV=production
CORS_ORIGIN="https://yourdomain.com"
JWT_ACCESS_SECRET=your-strong-access-secret-here-change-this
JWT_REFRESH_SECRET=your-strong-refresh-secret-here-change-this
AWS_REGION=ap-northeast-2
AWS_ACCESS_KEY_ID=your-s3-access-key
AWS_SECRET_ACCESS_KEY=your-s3-secret-key
AWS_S3_BUCKET_NAME=nb04-welive-team04
```

### 5. Nginx 설정

```bash
# nginx-config.conf 다운로드
curl -o nginx-config.conf https://raw.githubusercontent.com/your-repo/main/scripts/nginx-config.conf

# 도메인 수정 (your-domain.com을 실제 도메인으로 변경)
nano nginx-config.conf

# Nginx 설정 복사
sudo cp nginx-config.conf /etc/nginx/sites-available/welive-backend
sudo ln -s /etc/nginx/sites-available/welive-backend /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# 설정 테스트 및 재시작
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 6. GitHub Secrets 설정

GitHub 저장소 → Settings → Secrets and variables → Actions → New repository secret

다음 Secrets 추가:

| Secret 이름 | 값 | 설명 |
|------------|-------|------|
| `AWS_ACCESS_KEY_ID` | AKIA... | IAM 사용자의 Access Key ID |
| `AWS_SECRET_ACCESS_KEY` | ... | IAM 사용자의 Secret Access Key |
| `EC2_HOST` | 12.34.56.78 | EC2 퍼블릭 IP 주소 |
| `EC2_USER` | ubuntu | EC2 사용자 이름 (Ubuntu의 경우 ubuntu) |
| `EC2_SSH_KEY` | -----BEGIN RSA PRIVATE KEY----- ... | .pem 파일의 전체 내용 |

## 배포하기

### 자동 배포

`main` 브랜치에 푸시하면 자동으로 배포됩니다:

```bash
git add .
git commit -m "feat: 새로운 기능 추가"
git push origin main
```

GitHub Actions가 자동으로:
1. Docker 이미지 빌드
2. ECR에 푸시
3. EC2에 SSH 접속
4. 최신 이미지 Pull
5. 컨테이너 재시작

### 배포 상태 확인

GitHub 저장소 → Actions 탭에서 워크플로우 진행 상황 확인

### EC2에서 직접 확인

```bash
# SSH 접속
ssh -i your-key.pem ubuntu@<EC2-PUBLIC-IP>

# 컨테이너 상태 확인
docker ps

# 로그 확인
docker logs welive-backend

# 실시간 로그
docker logs -f welive-backend

# Nginx 로그
sudo tail -f /var/log/nginx/welive-backend-access.log
sudo tail -f /var/log/nginx/welive-backend-error.log
```

## SSL 인증서 설정 (Let's Encrypt)

도메인이 있는 경우 무료 SSL 인증서 설정:

```bash
# EC2 인스턴스에서
sudo apt-get install certbot python3-certbot-nginx -y

# SSL 인증서 발급 및 자동 설정
sudo certbot --nginx -d yourdomain.com

# 자동 갱신 테스트
sudo certbot renew --dry-run
```

## 유지보수

### 수동 배포 (긴급 상황)

```bash
# EC2에 SSH 접속
ssh -i your-key.pem ubuntu@<EC2-PUBLIC-IP>

# ECR 로그인
aws ecr get-login-password --region ap-northeast-2 | \
  docker login --username AWS --password-stdin \
  123456789.dkr.ecr.ap-northeast-2.amazonaws.com

# 최신 이미지 Pull
docker pull 123456789.dkr.ecr.ap-northeast-2.amazonaws.com/welive-backend:latest

# 컨테이너 재시작
docker stop welive-backend
docker rm welive-backend
docker run -d \
  --name welive-backend \
  --restart unless-stopped \
  -p 4000:4000 \
  --env-file ~/welive-backend/.env.production \
  123456789.dkr.ecr.ap-northeast-2.amazonaws.com/welive-backend:latest
```

### 데이터베이스 마이그레이션

```bash
# 컨테이너 내부에서 실행
docker exec -it welive-backend npx prisma migrate deploy
```

### 로그 로테이션

Docker는 기본적으로 로그를 무제한 저장하므로 docker-compose.production.yml에 로그 설정이 포함되어 있습니다:
- 최대 파일 크기: 10MB
- 최대 파일 개수: 3개

### 컨테이너 정리

```bash
# 사용하지 않는 이미지 삭제
docker image prune -af

# 사용하지 않는 컨테이너 삭제
docker container prune -f

# 전체 정리
docker system prune -af
```

## 트러블슈팅

### 컨테이너가 시작되지 않을 때

```bash
# 로그 확인
docker logs welive-backend

# 환경 변수 확인
docker exec -it welive-backend env
```

### 데이터베이스 연결 실패

```bash
# RDS 보안 그룹 확인
# EC2 보안 그룹이 RDS 보안 그룹에 허용되어 있는지 확인

# EC2에서 RDS 연결 테스트
nc -zv database-1.c7c6maikgavt.ap-northeast-2.rds.amazonaws.com 5432
```

### Nginx 502 Bad Gateway

```bash
# 컨테이너 상태 확인
docker ps

# 컨테이너가 4000 포트를 리스닝하는지 확인
docker exec -it welive-backend netstat -tlnp

# Nginx 로그 확인
sudo tail -f /var/log/nginx/welive-backend-error.log
```

### GitHub Actions 배포 실패

1. GitHub Actions 로그 확인
2. EC2 SSH 접속 확인 (EC2_SSH_KEY가 올바른지)
3. AWS 권한 확인 (ECR 푸시 권한)

## 비용 최적화

### EC2 인스턴스 타입

- 개발/테스트: t3.micro (프리티어)
- 프로덕션: t3.small ~ t3.medium
- 트래픽 많을 때: t3.large 이상

### 비용 절감 팁

1. 개발 환경은 업무 시간에만 실행
2. CloudWatch 알람으로 비정상 트래픽 감지
3. ECR 이미지 수명 주기 정책 설정 (오래된 이미지 자동 삭제)

## 참고 자료

- [AWS ECR 문서](https://docs.aws.amazon.com/ecr/)
- [GitHub Actions 문서](https://docs.github.com/actions)
- [Docker 문서](https://docs.docker.com/)
- [Nginx 문서](https://nginx.org/en/docs/)
