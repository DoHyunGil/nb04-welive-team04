# WeLive Backend - AWS 배포 가이드

## 프로젝트 정보

- **리전**: ap-northeast-2 (서울)
- **EC2 퍼블릭 IP**: 54.180.160.33
- **EC2 보안 그룹 ID**: sg-0f4095cd3144a9cf0
- **ECR 저장소**: welive
- **ECR URI**: 746387398820.dkr.ecr.ap-northeast-2.amazonaws.com/welive
- **RDS 엔드포인트**: database-1.c7c6maikgavt.ap-northeast-2.rds.amazonaws.com
  - 데이터베이스 이름: welive
  - 마스터 사용자: postgres
  - 포트: 5432

## 진행 상태

- [x] 1단계: EC2 인스턴스 생성
- [x] 2단계: RDS 보안 그룹 설정
- [x] 3단계: EC2 초기 설정
- [x] 4단계: AWS CLI 설정
- [x] 5단계: 환경 변수 파일 생성
- [x] 6단계: Nginx 설정
- [x] 7단계: GitHub Secrets 설정
- [ ] 8단계: 첫 배포
- [ ] 9단계: 배포 확인

## 배포 순서

### 1단계: EC2 인스턴스 생성

#### AWS Console에서 진행

1. **EC2 Dashboard 접속**
   - AWS Console → EC2 → "인스턴스 시작" 클릭

2. **기본 설정**
   ```
   이름: welive-backend
   AMI: Ubuntu Server 22.04 LTS
   인스턴스 유형: t3.small (권장) 또는 t2.micro (프리티어)
   ```

3. **키 페어 생성**
   ```
   - "새 키 페어 생성" 클릭
   - 키 페어 이름: welive-backend-key
   - 키 페어 유형: RSA
   - 프라이빗 키 파일 형식: .pem
   - 다운로드된 .pem 파일 안전하게 보관!
   ```

4. **보안 그룹 설정**

   **EC2 보안 그룹 이름**: welive-backend-sg

   **인바운드 규칙** (외부 → EC2로 들어오는 트래픽):

   | 유형        | 프로토콜 | 포트 | 소스          | 용도 |
   |------------|---------|------|--------------|------|
   | SSH        | TCP     | 22   | 내 IP (예: 123.456.789.0/32) | 개발자가 EC2에 SSH 접속 |
   | HTTP       | TCP     | 80   | 0.0.0.0/0 (모든 IP) | 사용자가 웹 브라우저로 접속 (Nginx) |
   | HTTPS      | TCP     | 443  | 0.0.0.0/0 (모든 IP) | SSL 인증서 사용 시 |
   | Custom TCP | TCP     | 4000 | 0.0.0.0/0 (모든 IP) | Docker 컨테이너 직접 접근 (테스트용) |

   > **참고**:
   > - `0.0.0.0/0` = 모든 IP에서 접근 가능
   > - `내 IP` = 보안을 위해 SSH는 개발자 IP만 허용
   > - 포트 4000은 선택사항 (Nginx만 사용한다면 불필요)

   **아웃바운드 규칙** (EC2 → 외부로 나가는 트래픽):

   | 유형        | 프로토콜 | 포트 범위 | 대상        | 용도 |
   |------------|---------|----------|------------|------|
   | All traffic | All     | All      | 0.0.0.0/0  | EC2가 외부와 통신 (RDS, ECR, S3, 인터넷) |

   > **기본값**: 아웃바운드는 보통 모두 허용 (변경하지 않아도 됨)

5. **스토리지**: 20 GiB

6. **인스턴스 시작** 후 **퍼블릭 IP 복사**

---

### 2단계: RDS 보안 그룹 설정 ✅

RDS가 EC2에서만 접근 가능하도록 설정:

1. **리전 확인**: AWS Console 상단에서 **ap-northeast-2 (아시아 태평양(서울))** 선택

2. **RDS Console** → 데이터베이스 → database-1 클릭

3. **연결 & 보안** 탭 → VPC 보안 그룹 클릭

4. **인바운드 규칙 편집** 클릭

   **RDS 보안 그룹 인바운드 규칙** (외부 → RDS로 들어오는 트래픽):

   | 유형        | 프로토콜 | 포트 | 소스 | 용도 |
   |------------|---------|------|------|------|
   | PostgreSQL | TCP     | 5432 | sg-0f4095cd3144a9cf0 | EC2에서만 RDS 접근 허용 |

   > **중요**:
   > - 소스는 **EC2 보안 그룹 ID**: `sg-0f4095cd3144a9cf0`
   > - 입력하면 자동완성으로 `sg-0f4095cd3144a9cf0 / welive-backend` 표시됨
   > - RDS는 외부 인터넷에서 직접 접근 불가 (보안)
   > - ⚠️ **같은 리전(ap-northeast-2)에 있어야만 작동!**

   **네트워크 흐름**:
   ```
   EC2 (서울, sg-0f4095cd3144a9cf0) → RDS (서울, PostgreSQL 5432)
   ```

---

### 3단계: EC2 초기 설정 ✅

#### 로컬 머신에서

```bash
# 1. 키 파일 권한 설정 (프로젝트 디렉토리에서)
cd ~/nb04-welive-team04
chmod 400 welive-backend-key.pem

# 2. setup-ec2.sh 스크립트를 EC2로 전송
scp -i welive-backend-key.pem \
    scripts/setup-ec2.sh \
    ubuntu@54.180.160.33:~/setup-ec2.sh

# 3. EC2 접속
ssh -i welive-backend-key.pem ubuntu@54.180.160.33
```

#### EC2 인스턴스에서

```bash
# 1. 실행 권한 부여
chmod +x setup-ec2.sh

# 2. 스크립트 실행 (Docker, AWS CLI, Nginx 설치 - 5-10분 소요)
./setup-ec2.sh

# 3. Docker 권한 적용을 위해 로그아웃
exit
```

#### 로컬 머신에서 재접속

```bash
# 재접속 (Docker 권한 적용 확인)
ssh -i welive-backend-key.pem ubuntu@54.180.160.33

# 설치 확인
docker --version
aws --version
sudo systemctl status nginx
ls -la ~/welive-backend/
```

---

### 4단계: AWS CLI 설정 ✅

EC2에서 실행:

```bash
aws configure
```

입력 값:
```
AWS Access Key ID [None]: <팀에서 공유한 Access Key>
AWS Secret Access Key [None]: <팀에서 공유한 Secret Key>
Default region name [None]: ap-northeast-2
Default output format [None]: json
```

---

### 5단계: 환경 변수 파일 생성 ⚠️ (RDS 엔드포인트 대기 중)

```bash
cd ~/welive-backend
nano .env.production
```

아래 내용 입력:

```bash
# ========================
# DATABASE (AWS RDS)
# ========================
DATABASE_URL="postgresql://postgres:Welive2026!@database-1.c7c6maikgavt.ap-northeast-2.rds.amazonaws.com:5432/welive"

# ========================
# SERVER
# ========================
PORT=4000
NODE_ENV=production

# ========================
# CORS
# ========================
CORS_ORIGIN="https://yourdomain.com"
# 또는 프론트엔드 도메인
# CORS_ORIGIN="http://your-frontend-ec2-ip:3000"

# ========================
# JWT
# ========================
JWT_ACCESS_SECRET=팀에서_공유한_Access_Secret
JWT_REFRESH_SECRET=팀에서_공유한_Refresh_Secret

# ========================
# AWS S3
# ========================
AWS_REGION=ap-northeast-2
AWS_ACCESS_KEY_ID=<팀에서_공유한_Access_Key>
AWS_SECRET_ACCESS_KEY=<팀에서_공유한_Secret_Key>
AWS_S3_BUCKET_NAME=nb04-welive-team04
```

저장: `Ctrl + X` → `Y` → `Enter`

---

### 6단계: Nginx 설정 ✅

#### 로컬 머신에서

```bash
# EC2에서 로그아웃 (만약 접속 중이라면)
exit

# nginx-config.conf 파일을 EC2로 전송
scp -i welive-backend-key.pem \
    scripts/nginx-config.conf \
    ubuntu@54.180.160.33:~/nginx-config.conf

# EC2 재접속
ssh -i welive-backend-key.pem ubuntu@54.180.160.33
```

#### EC2에서 실행

```bash
# Nginx 설정 파일 복사
sudo cp nginx-config.conf /etc/nginx/sites-available/welive-backend

# 심볼릭 링크 생성 (활성화)
sudo ln -s /etc/nginx/sites-available/welive-backend /etc/nginx/sites-enabled/

# 기본 설정 제거
sudo rm /etc/nginx/sites-enabled/default

# 설정 테스트
sudo nginx -t

# Nginx 재시작 및 자동 시작 활성화
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

### 7단계: GitHub Secrets 설정

GitHub 저장소 → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

추가할 Secrets:

| Secret 이름 | 값 | 설명 |
|------------|-----|------|
| `AWS_ACCESS_KEY_ID` | `<팀에서 공유한 Access Key>` | ECR 푸시 권한이 있는 IAM Access Key |
| `AWS_SECRET_ACCESS_KEY` | `<팀에서 공유한 Secret Key>` | IAM Secret Access Key |
| `EC2_HOST` | `54.180.160.33` | EC2 퍼블릭 IP 주소 |
| `EC2_USER` | `ubuntu` | 고정값 |
| `EC2_SSH_KEY` | .pem 파일 전체 내용 | 아래 참고 |

#### EC2_SSH_KEY 설정 방법

로컬 머신의 프로젝트 디렉토리에서:

```bash
# .pem 파일 내용 출력
cd ~/nb04-welive-team04
cat welive-backend-key.pem

# 출력된 내용 전체를 복사 (아래 형식)
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
(여러 줄)
...
-----END RSA PRIVATE KEY-----
```

1. **"New repository secret"** 클릭
2. **Name**: `EC2_SSH_KEY` 입력
3. **Secret**: 위에서 복사한 전체 내용 붙여넣기
4. **"Add secret"** 클릭

---

### 8단계: 첫 배포

```bash
# 로컬 머신에서
git add .
git commit -m "chore: setup AWS deployment"
git push origin main
```

**GitHub 저장소 → Actions 탭**에서 배포 진행 상황 확인

배포 프로세스:
1. ✅ Docker 이미지 빌드
2. ✅ ECR에 푸시 (746387398820.dkr.ecr.ap-northeast-2.amazonaws.com/welive)
3. ✅ EC2 SSH 접속
4. ✅ ECR에서 이미지 Pull
5. ✅ Docker 컨테이너 실행

---

### 9단계: 배포 확인

#### 브라우저에서 테스트

```bash
# Health Check (포트 4000 직접 접근)
http://<EC2-PUBLIC-IP>:4000/health

# Nginx를 통한 접근
http://<EC2-PUBLIC-IP>/health
```

#### EC2에서 직접 확인

```bash
# SSH 접속
ssh -i ~/Downloads/welive-backend-key.pem ubuntu@<EC2-PUBLIC-IP>

# 컨테이너 상태
docker ps

# 로그 확인
docker logs welive-backend

# 실시간 로그
docker logs -f welive-backend

# Nginx 로그
sudo tail -f /var/log/nginx/access.log
```

---

## 이후 배포

main 브랜치에 push하면 자동으로 배포됩니다:

```bash
git add .
git commit -m "feat: 새로운 기능"
git push origin main
```

---

## 데이터베이스 마이그레이션

처음 배포 시 또는 스키마 변경 시:

```bash
# EC2에서
docker exec -it welive-backend npx prisma migrate deploy

# 또는 GitHub Actions가 자동으로 처리 (워크플로우 수정 필요시)
```

---

## 문제 해결

### 1. 컨테이너가 시작되지 않을 때

```bash
# 로그 확인
docker logs welive-backend

# 환경 변수 확인
docker exec -it welive-backend env | grep DATABASE_URL
```

### 2. Database connection failed

```bash
# RDS 보안 그룹 확인
# EC2 보안 그룹이 RDS 인바운드 규칙에 있는지 확인

# EC2에서 RDS 연결 테스트
nc -zv database-1.cmdi0yww6bj2.us-east-1.rds.amazonaws.com 5432

# 연결 성공 시:
# Connection to database-1.cmdi0yww6bj2.us-east-1.rds.amazonaws.com 5432 port [tcp/postgresql] succeeded!
```

### 3. GitHub Actions 배포 실패

```bash
# Actions 탭에서 에러 로그 확인

# 주요 체크 포인트:
# - AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY가 올바른지
# - EC2_SSH_KEY가 전체 내용 복사되었는지
# - EC2_HOST가 현재 퍼블릭 IP와 일치하는지 (재시작 시 변경될 수 있음)
```

### 4. Nginx 502 Bad Gateway

```bash
# 컨테이너 상태 확인
docker ps | grep welive-backend

# 포트 확인
sudo netstat -tlnp | grep 4000

# Nginx 에러 로그
sudo tail -f /var/log/nginx/error.log
```

---

## 유용한 명령어

```bash
# 컨테이너 재시작
docker restart welive-backend

# 컨테이너 중지
docker stop welive-backend

# 컨테이너 삭제
docker rm welive-backend

# 이미지 목록
docker images

# 디스크 용량 확인
df -h
docker system df

# 사용하지 않는 이미지 정리
docker image prune -af
```

---

## 리소스 정보 요약

| 항목 | 값 |
|-----|-----|
| **ECR 저장소** | welive |
| **ECR URI** | 746387398820.dkr.ecr.ap-northeast-2.amazonaws.com/welive |
| **RDS 엔드포인트** | database-1.cmdi0yww6bj2.us-east-1.rds.amazonaws.com |
| **RDS 포트** | 5432 |
| **애플리케이션 포트** | 4000 |
| **리전** | ap-northeast-2 (서울) |
| **S3 버킷** | nb04-welive-team04 |

---

## 다음 단계

- [ ] SSL 인증서 설정 (도메인 있을 경우)
- [ ] 모니터링 설정 (CloudWatch)
- [ ] 로그 집계 (CloudWatch Logs)
- [ ] 알람 설정 (서버 다운 시)
- [ ] 백업 전략 수립
