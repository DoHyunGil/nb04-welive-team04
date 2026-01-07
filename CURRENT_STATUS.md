# 현재 배포 진행 상황

## 완료된 작업 ✅

### 1. EC2 인스턴스 생성 완료

- **리전**: ap-northeast-2 (서울)
- **퍼블릭 IP**: `54.180.160.33`
- **인스턴스 타입**: t3.small
- **AMI**: Ubuntu Server 22.04 LTS
- **키 페어**: welive-backend-key (다운로드 완료)

### 2. EC2 보안 그룹 설정 완료

- **보안 그룹 이름**: welive-backend
- **보안 그룹 ID**: `sg-0f4095cd3144a9cf0`
- **VPC ID**: vpc-0788e0ce90d4c5bec

#### 인바운드 규칙 (4개):

| 규칙       | 포트 | 소스              | 용도            |
| ---------- | ---- | ----------------- | --------------- |
| SSH        | 22   | 211.210.254.92/32 | 개발자 SSH 접속 |
| HTTP       | 80   | 0.0.0.0/0         | 웹 접근         |
| HTTPS      | 443  | 0.0.0.0/0         | SSL 접근        |
| Custom TCP | 4000 | 0.0.0.0/0         | 앱 직접 접근    |

#### 아웃바운드 규칙:

- All traffic → 0.0.0.0/0

### 3. EC2 초기 설정 완료 ✅

- **Docker 설치**: v29.1.3
- **AWS CLI 설치**: v2.32.30
- **Nginx 설치**: 설치 및 실행 중
- **프로젝트 디렉토리**: `~/welive-backend` 생성
- **방화벽 설정**: UFW 활성화

### 4. AWS CLI 설정 완료 ✅

- ECR 접근을 위한 AWS 자격 증명 설정 완료
- 리전: ap-northeast-2
- ECR 로그인 가능 상태

### 5. Nginx 설정 완료 ✅

- 리버스 프록시 설정: localhost:4000 → 포트 80
- `/etc/nginx/sites-available/welive-backend` 설정 완료
- 설정 테스트 통과 (nginx -t)
- 서비스 실행 중

### 6. GitHub Secrets 설정 완료 ✅

다음 Secrets 추가 완료:

- ✅ AWS_ACCESS_KEY_ID
- ✅ AWS_SECRET_ACCESS_KEY
- ✅ EC2_HOST: `54.180.160.33`
- ✅ EC2_USER: `ubuntu`
- ✅ EC2_SSH_KEY: (PEM 파일 전체 내용)

---

## 완료된 작업 계속 ✅

### 7. RDS PostgreSQL 생성 완료 ✅

- ✅ **RDS 엔드포인트**: database-1.c7c6maikgavt.ap-northeast-2.rds.amazonaws.com
- ✅ **리전**: ap-northeast-2 (서울)
- ✅ **데이터베이스 이름**: welive
- ✅ **마스터 사용자**: postgres
- ✅ **포트**: 5432
- ✅ **보안 그룹**: EC2 접근 허용 완료

---

## 다음 단계: 배포 📋

### 1. 첫 배포 실행

로컬 머신에서:

```bash
# 현재 브랜치 확인
git branch

# 변경사항 커밋
git add .
git commit -m "chore: setup AWS RDS and production environment"

# main 브랜치에 push (자동 배포 시작)
git push origin main
```

또는 Pull Request 생성:

```bash
# 현재 브랜치 push
git push origin feature/admin

# GitHub에서 PR 생성 후 main에 merge
```

### 2. 배포 확인

```bash
# 브라우저에서 Health Check
http://54.180.160.33/health

# EC2에서 확인
ssh -i welive-backend-key.pem ubuntu@54.180.160.33
docker ps
docker logs welive-backend
```

### 3. 데이터베이스 마이그레이션

```bash
# EC2에서 실행
docker exec -it welive-backend npx prisma migrate deploy
```

---

## 현재 리소스 요약

| 리소스             | 상태              | 리전           | 정보                                                     |
| ------------------ | ----------------- | -------------- | -------------------------------------------------------- |
| **EC2**            | ✅ 완료 및 설정됨 | ap-northeast-2 | 54.180.160.33                                            |
| **EC2 보안 그룹**  | ✅ 완료           | ap-northeast-2 | sg-0f4095cd3144a9cf0                                     |
| **Docker**         | ✅ 설치됨         | -              | v29.1.3                                                  |
| **AWS CLI**        | ✅ 설정됨         | -              | v2.32.30                                                 |
| **Nginx**          | ✅ 실행 중        | -              | 포트 80 리버스 프록시                                    |
| **GitHub Actions** | ✅ Secrets 설정됨 | -              | 배포 준비 완료                                           |
| **ECR**            | ✅ 준비됨         | ap-northeast-2 | 746387398820.dkr.ecr.ap-northeast-2.amazonaws.com/welive |
| **S3**             | ✅ 준비됨         | ap-northeast-2 | nb04-welive-team04                                       |
| **RDS**            | ✅ 생성 완료     | ap-northeast-2 | database-1.c7c6maikgavt.ap-northeast-2.rds.amazonaws.com |

---

## 중요 파일 위치

### 로컬 머신

- **키 페어**: `~/nb04-welive-team04/welive-backend-key.pem`
- **설정 가이드**: `SETUP_GUIDE.md`
- **현재 상태**: `CURRENT_STATUS.md`
- **배포 가이드**: `DEPLOYMENT.md`
- **네트워크 구조**: `docs/NETWORK_ARCHITECTURE.md`
- **GitHub Actions**: `.github/workflows/deploy.yml`
- **환경 변수 예제**: `.env.production.example`
- **스크립트**: `scripts/setup-ec2.sh`, `scripts/nginx-config.conf`

### EC2 서버 (`ubuntu@54.180.160.33`)

- **프로젝트 디렉토리**: `~/welive-backend/`
- **환경 변수**: `~/welive-backend/.env.production` (RDS 후 생성 예정)
- **Nginx 설정**: `/etc/nginx/sites-available/welive-backend`

---

## 참고 사항

## 진행률

**전체 진행률**: 90% (9/10 단계 완료)

✅ 완료: EC2, RDS, 보안 그룹, Docker/Nginx, AWS CLI, GitHub Secrets, 환경 변수
📋 남은 작업: 첫 배포 및 확인

---

**최종 업데이트**: 2026-01-07 오후 (RDS 생성 완료)
**다음 업데이트**: 첫 배포 완료 후
