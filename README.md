# WeLive Backend API

> 아파트 관리 플랫폼 WeLive의 백엔드 API 서버

## 📋 목차

- [프로젝트 소개](#프로젝트-소개)
- [기술 스택](#기술-스택)
- [시작하기](#시작하기)
- [환경 변수 설정](#환경-변수-설정)
- [데이터베이스 접속](#데이터베이스-접속)
- [API 문서](#api-문서)
- [배포 정보](#배포-정보)
- [팀원 협업 가이드](#팀원-협업-가이드)

---

## 🏠 프로젝트 소개

WeLive는 아파트 관리자와 입주민을 위한 종합 관리 플랫폼입니다.

### 주요 기능

- 👥 **사용자 관리**: 관리자/입주민 회원가입 및 인증
- 📢 **공지사항**: 관리자 공지사항 작성 및 조회
- 🗳️ **투표 시스템**: 입주민 투표 생성 및 참여
- 📝 **민원 관리**: 입주민 민원 등록 및 관리자 처리
- 📅 **일정 관리**: 아파트 일정 등록 및 캘린더 조회
- 💬 **댓글 시스템**: 공지사항/민원에 대한 댓글 기능
- 🔔 **알림**: 실시간 SSE 알림 시스템
- 📦 **파일 업로드**: AWS S3 이미지 업로드

---

## 🛠 기술 스택

### Backend

- **Runtime**: Node.js 20
- **Language**: TypeScript
- **Framework**: Express.js
- **ORM**: Prisma 7.2.0 (with @prisma/adapter-pg)
- **Database**: PostgreSQL 15
- **Authentication**: JWT (Passport.js)
- **Validation**: Zod
- **Testing**: Jest, Supertest

### Infrastructure

- **Container**: Docker
- **Registry**: AWS ECR
- **Compute**: AWS EC2 (t3.small, Ubuntu 22.04)
- **Database**: AWS RDS PostgreSQL
- **Storage**: AWS S3
- **CI/CD**: GitHub Actions

---

## 🚀 시작하기

### 1. 필수 요구사항

로컬 개발을 위해 다음이 설치되어 있어야 합니다:

- **Node.js** 20 이상
- **npm** 또는 **yarn**
- **PostgreSQL** 15 (로컬 개발용) 또는 AWS RDS 접속 권한
- **Git**

### 2. 저장소 클론

```bash
git clone https://github.com/DoHyunGil/nb04-welive-team04.git
cd nb04-welive-team04
```

### 3. 의존성 설치

```bash
npm install
```

### 4. 환경 변수 설정

#### 실제 자격증명 받기

프로젝트에 `TEAM_SECRETS.md` 파일이 포함되어 있습니다 (`.gitignore`에 포함되어 GitHub에는 올라가지 않음).
**팀 리더에게 이 파일의 내용을 받아서** 로컬에 저장하세요.

#### .env 파일 생성

`.env` 파일을 생성하고 `TEAM_SECRETS.md`의 실제 값을 참고하여 작성하세요:

```bash
# Database
DATABASE_URL="postgresql://postgres:<PASSWORD>@<RDS_ENDPOINT>:5432/welive"

# Server
PORT=4000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000

# JWT
JWT_ACCESS_SECRET=your-access-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here

# AWS S3
AWS_REGION=ap-northeast-2
AWS_ACCESS_KEY_ID=<YOUR_AWS_ACCESS_KEY>
AWS_SECRET_ACCESS_KEY=<YOUR_AWS_SECRET_KEY>
AWS_S3_BUCKET_NAME=nb04-welive-team04
```

> ⚠️ **주의**:
>
> - 실제 AWS 자격증명, RDS 엔드포인트, 데이터베이스 비밀번호, JWT 시크릿은 **팀 리더에게 개별적으로 문의**하세요.
> - 이 정보들은 **절대 GitHub에 커밋하지 마세요**.

### 5. Prisma 클라이언트 생성

```bash
npx prisma generate
```

### 6. 데이터베이스 마이그레이션 (선택사항)

> 개발 DB를 사용하는 경우에만 실행하세요. 운영 DB는 이미 마이그레이션되어 있습니다.

```bash
npx prisma migrate dev
```

### 7. 개발 서버 실행

```bash
npm run dev
```

서버가 http://localhost:4000 에서 실행됩니다.

### 8. 빌드 및 프로덕션 실행

```bash
# TypeScript 빌드
npm run build

# 프로덕션 서버 실행
npm start
```

---

## ⚙️ 환경 변수 설정

### 필수 환경 변수

| 변수명                  | 설명                           | 예시                                               |
| ----------------------- | ------------------------------ | -------------------------------------------------- |
| `DATABASE_URL`          | PostgreSQL 연결 URL            | `postgresql://user:password@host:5432/dbname`      |
| `PORT`                  | 서버 포트                      | `4000`                                             |
| `NODE_ENV`              | 실행 환경                      | `development`, `production`                        |
| `CORS_ORIGIN`           | CORS 허용 도메인 (쉼표로 구분) | `http://localhost:3000,http://13.125.213.174:3000` |
| `JWT_ACCESS_SECRET`     | Access Token 시크릿            | `your-secret-key`                                  |
| `JWT_REFRESH_SECRET`    | Refresh Token 시크릿           | `your-refresh-secret`                              |
| `AWS_REGION`            | AWS 리전                       | `ap-northeast-2`                                   |
| `AWS_ACCESS_KEY_ID`     | AWS Access Key                 | `AKIAxxxxxxxxxx`                                   |
| `AWS_SECRET_ACCESS_KEY` | AWS Secret Key                 | `xxxxxxxxxx`                                       |
| `AWS_S3_BUCKET_NAME`    | S3 버킷 이름                   | `nb04-welive-team04`                               |

---

## 🗄️ 데이터베이스 접속

### AWS RDS 운영 데이터베이스

#### 접속 정보

```
Host: <RDS_ENDPOINT>
Port: 5432
Database: welive
User: postgres
Password: <DB_PASSWORD>
```

> ⚠️ **보안**: 실제 RDS 엔드포인트와 비밀번호는 팀 리더에게 문의하세요.

#### Prisma Studio로 접속

```bash
npx prisma studio
```

브라우저에서 http://localhost:5555 로 접속하면 GUI로 데이터베이스를 조회/수정할 수 있습니다.

#### psql CLI로 접속

```bash
psql -h <RDS_ENDPOINT> \
     -p 5432 \
     -U postgres \
     -d welive
```

비밀번호 입력: `<DB_PASSWORD>` (팀 리더에게 문의)

#### DBeaver / TablePlus 등 GUI 도구로 접속

1. 새 PostgreSQL 연결 생성
2. 위의 접속 정보 입력
3. SSL 설정: **Require** (또는 활성화)
4. 연결 테스트 후 저장

#### 주요 테이블

- `User`: 사용자 정보 (관리자/입주민)
- `Apartment`: 아파트 정보
- `Resident`: 입주민 상세 정보
- `Notice`: 공지사항
- `Poll`: 투표
- `Complain`: 민원
- `Comment`: 댓글
- `Notification`: 알림
- `Event`: 일정

### 데이터베이스 스키마 확인

```bash
# 스키마 시각화
npx prisma studio

# ERD 생성 (prisma-erd-generator 사용 시)
npx prisma generate
```

---

## 📚 API 문서

### 기본 URL

- **개발**: http://localhost:4000
- **운영**: http://54.180.160.33:4000

### API 엔드포인트

#### 인증 (Authentication)

```bash
POST /api/v2/auth/signup          # 회원가입
POST /api/v2/auth/login           # 로그인
POST /api/v2/auth/refresh         # 토큰 갱신
POST /api/v2/auth/logout          # 로그아웃
```

#### 사용자 (Users)

```bash
GET    /api/v2/users               # 현재 사용자 정보
PATCH  /api/v2/users               # 사용자 정보 수정
DELETE /api/v2/users               # 회원 탈퇴

# 관리자 전용
GET    /api/v2/users/admins        # 관리자 목록
POST   /api/v2/users/admins        # 관리자 생성
GET    /api/v2/users/admins/:id    # 관리자 상세
```

#### 공지사항 (Notices)

```bash
GET    /api/v2/notices             # 공지사항 목록
GET    /api/v2/notices/:id         # 공지사항 상세
POST   /api/v2/notices             # 공지사항 작성 (관리자)
PATCH  /api/v2/notices/:id         # 공지사항 수정 (관리자)
DELETE /api/v2/notices/:id         # 공지사항 삭제 (관리자)
```

#### 투표 (Polls)

```bash
GET    /api/v2/polls               # 투표 목록
GET    /api/v2/polls/:id           # 투표 상세
POST   /api/v2/polls               # 투표 생성 (관리자)
PATCH  /api/v2/polls/:id           # 투표 수정 (관리자)
DELETE /api/v2/polls/:id           # 투표 삭제 (관리자)
POST   /api/v2/polls/:id/vote      # 투표하기
```

#### 민원 (Complaints)

```bash
GET    /api/v2/complaints          # 민원 목록
GET    /api/v2/complaints/:id      # 민원 상세
POST   /api/v2/complaints          # 민원 등록
PATCH  /api/v2/complaints/:id      # 민원 수정
DELETE /api/v2/complaints/:id      # 민원 삭제
PATCH  /api/v2/complaints/:id/status  # 민원 상태 변경 (관리자)
```

#### 댓글 (Comments)

```bash
GET    /api/v2/comments            # 댓글 목록
POST   /api/v2/comments            # 댓글 작성
PATCH  /api/v2/comments/:id        # 댓글 수정
DELETE /api/v2/comments/:id        # 댓글 삭제
```

#### 입주민 (Residents)

```bash
GET    /api/v2/residents           # 입주민 목록 (관리자)
POST   /api/v2/residents           # 입주민 등록 (관리자)
GET    /api/v2/residents/:id       # 입주민 상세
PATCH  /api/v2/residents/:id       # 입주민 정보 수정
DELETE /api/v2/residents/:id       # 입주민 삭제
```

#### 알림 (Notifications)

```bash
GET    /api/v2/notifications       # 알림 목록
GET    /api/v2/notifications/sse   # SSE 연결 (실시간 알림)
PATCH  /api/v2/notifications/:id/read  # 알림 읽음 처리
```

### 인증

대부분의 API는 JWT 인증이 필요합니다.

```bash
# Header에 토큰 포함
Authorization: Bearer <access_token>
```

### API 테스트

#### cURL 예시

```bash
# 로그인
curl -X POST http://localhost:4000/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'

# 공지사항 목록 조회
curl -X GET http://localhost:4000/api/v2/notices \
  -H "Authorization: Bearer <your_token>"
```

---

## 🚢 배포 정보

### 운영 환경

- **프론트엔드**: http://13.125.213.174:3000
- **백엔드 API**: http://54.180.160.33:4000
- **데이터베이스**: AWS RDS PostgreSQL

### 배포 프로세스

#### 자동 배포 (GitHub Actions)

`main` 브랜치에 push하면 자동으로 배포됩니다:

1. GitHub Actions가 트리거됨
2. Docker 이미지 빌드 (linux/amd64 플랫폼)
3. AWS ECR에 푸시
4. EC2에 SSH 접속하여 배포
5. 새 Docker 컨테이너 실행

```bash
# 배포하기
git add .
git commit -m "feat: add new feature"
git push origin main
```

#### 수동 배포 (긴급 시)

EC2에 SSH 접속:

```bash
ssh -i welive-backend-key.pem ubuntu@54.180.160.33
```

컨테이너 재시작:

```bash
# AWS ECR 로그인
aws ecr get-login-password --region ap-northeast-2 | \
  docker login --username AWS --password-stdin \
  746387398820.dkr.ecr.ap-northeast-2.amazonaws.com

# 최신 이미지 Pull
docker pull 746387398820.dkr.ecr.ap-northeast-2.amazonaws.com/welive:latest

# 기존 컨테이너 중지 및 제거
docker stop welive-backend
docker rm welive-backend

# 새 컨테이너 실행
docker run -d \
  --name welive-backend \
  --restart unless-stopped \
  -p 4000:4000 \
  --env-file /home/ubuntu/welive-backend/.env.production \
  746387398820.dkr.ecr.ap-northeast-2.amazonaws.com/welive:latest

# 로그 확인
docker logs -f welive-backend
```

### 환경별 설정

#### 로컬 개발 (`.env`)

```bash
DATABASE_URL=postgresql://...
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

#### 운영 (EC2 서버의 `/home/ubuntu/welive-backend/.env.production`)

```bash
DATABASE_URL=postgresql://postgres:<PASSWORD>@<RDS_ENDPOINT>:5432/welive
NODE_ENV=production
CORS_ORIGIN=http://<FRONTEND_IP>:3000,http://localhost:3000
AWS_ACCESS_KEY_ID=<YOUR_AWS_ACCESS_KEY>
AWS_SECRET_ACCESS_KEY=<YOUR_AWS_SECRET_KEY>
```

> ⚠️ **주의**: 운영 환경 변수는 EC2 서버에만 존재하며, GitHub에 커밋되지 않습니다.

---

## 👥 팀원 협업 가이드

### Git 워크플로우

#### 브랜치 전략

```
main (운영)
  ↑
develop (개발)
  ↑
feature/기능명 (기능 개발)
```

#### 새 기능 개발

```bash
# 1. develop 브랜치로 이동
git checkout develop
git pull origin develop

# 2. 새 기능 브랜치 생성
git checkout -b feature/user-profile

# 3. 코드 작성 및 커밋
git add .
git commit -m "feat: add user profile page"

# 4. 원격에 푸시
git push origin feature/user-profile

# 5. GitHub에서 Pull Request 생성
#    feature/user-profile → develop

# 6. 코드 리뷰 후 머지
# 7. develop이 안정화되면 main으로 머지 (자동 배포)
```

#### 커밋 메시지 규칙

```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅, 세미콜론 누락 등
refactor: 코드 리팩토링
test: 테스트 코드 추가
chore: 빌드 업무, 패키지 매니저 설정 등

# 예시
feat: add user authentication
fix: resolve login token expiration bug
docs: update API documentation
```

### 코드 스타일

프로젝트는 TypeScript + ESLint + Prettier를 사용합니다.

```bash
# 린트 검사
npm run lint

# 포맷팅
npm run format

# 테스트 실행
npm test
```

### 트러블슈팅

#### 1. Prisma 클라이언트 오류

```bash
# 해결: Prisma 클라이언트 재생성
npx prisma generate
```

#### 2. 데이터베이스 연결 오류

- `.env` 파일의 `DATABASE_URL` 확인
- RDS 보안 그룹 설정 확인 (VPC 내부에서만 접근 가능)
- SSL 연결 필요 (Prisma가 자동으로 처리)

#### 3. Docker 빌드 오류

```bash
# devDependencies가 필요한 경우 npm ci 사용
RUN npm ci

# DATABASE_URL은 빌드 시 더미 값 사용
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" \
    npx prisma generate && \
    npm run build
```

#### 4. CORS 오류

백엔드 `.env`의 `CORS_ORIGIN`에 프론트엔드 URL 추가:

```bash
CORS_ORIGIN=http://localhost:3000,http://13.125.213.174:3000
```

### 개발 도구

#### 추천 VS Code 확장

- ESLint
- Prettier
- Prisma
- GitLens
- Thunder Client (API 테스트)

#### 로그 확인

```bash
# EC2 백엔드 로그
ssh -i welive-backend-key.pem ubuntu@54.180.160.33
docker logs -f welive-backend

# 프론트엔드 로그
ssh -i welive-frontend-key.pem ubuntu@13.125.213.174
pm2 logs welive-frontend
```

---

### 유용한 링크

- [GitHub Repository](https://github.com/DoHyunGil/nb04-welive-team04)
- [프론트엔드 서버](http://13.125.213.174:3000)
- [백엔드 API](http://54.180.160.33:4000)
- [Prisma 문서](https://www.prisma.io/docs)
- [Express 문서](https://expressjs.com/)

---

## 🔒 보안 정책

### 민감한 정보 관리

다음 파일들은 **절대 GitHub에 커밋하지 마세요**:

- `.env` - 로컬 환경 변수
- `.env.production` - 운영 환경 변수
- `.env.test` - 테스트 환경 변수
- `TEAM_SECRETS.md` - 팀 비밀 정보 (실제 자격증명)
- `*.pem` - SSH 키 파일

이 파일들은 이미 `.gitignore`에 포함되어 있지만, `git add .`을 사용할 때 실수로 추가되지 않도록 주의하세요.

### 자격증명 노출 시 대응

만약 실수로 AWS 키, 비밀번호, JWT 시크릿 등이 GitHub에 푸시되었다면:

1. **즉시 팀 리더에게 알리세요**
2. AWS 콘솔에서 노출된 키를 비활성화하세요
3. RDS 비밀번호를 변경하세요
4. Git 히스토리에서 해당 커밋을 제거하세요 (`git filter-branch` 또는 BFG Repo-Cleaner 사용)

---

## 📄 License

이 프로젝트는 팀 프로젝트이며, 상업적 사용이 제한됩니다.
