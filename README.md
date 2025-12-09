

---

## 📋 PR 리뷰 코멘트 반영 내역

PR 리뷰 코멘트를 반영하여 수정한 내용을 정리합니다.

---

### 1. joinStatus enum 수정

#### 리뷰 코멘트
> joinStatus 문자열을 enum으로 반환해서 사용 해야 하는 이유가 궁금합니다.
> joinStatus의 enum이 PENDING 한 가지가 끝이던데 혹시 이 부분 때문이라면 코드 수정보다는 enum 모델 추가가 더 낫지 않을까요?
> 프론트 코드: `JoinStatus // "PENDING" | "APPROVED" | "REJECTED" | "NEED_UPDATE"`

#### 수정 전 (prisma/schema.prisma)
```prisma
enum joinStatus {
  PENDING
}
```

#### 수정 후 (prisma/schema.prisma)
```prisma
enum joinStatus {
  PENDING
  APPROVED
  REJECTED
}
```

#### 수정 전 (src/user/services/admin.service.ts)
```typescript
function parseJoinStatus(joinStatusString: string): joinStatus {
  if (joinStatusString === 'PENDING') return joinStatus.PENDING;
  if (joinStatusString === 'APPROVED') return joinStatus.APPROVED;
  if (joinStatusString === 'REJECTED') return 'REJECTED' as joinStatus; // 타입 캐스팅 사용
  throw createError(400, '잘못된 joinStatus 값입니다.');
}
```

#### 수정 후 (src/user/services/admin.service.ts)
```typescript
function parseJoinStatus(joinStatusString: string): joinStatus {
  if (joinStatusString === 'PENDING') return joinStatus.PENDING;
  if (joinStatusString === 'APPROVED') return joinStatus.APPROVED;
  if (joinStatusString === 'REJECTED') return joinStatus.REJECTED; // 정상적인 enum 사용
  throw createError(400, '잘못된 joinStatus 값입니다.');
}
```

---

### 2. 회원가입 시 중복 체크 강화

#### 리뷰 코멘트
> username은 중복이 불가피 할 것으로 보입니다.
> 이메일 또는 휴대폰 번호 같은 더블 체크가 필요할 것 같습니다.

#### 수정 전 (src/user/services/admin.service.ts - superAdminRegister)
```typescript
async superAdminRegister(data: SuperAdminsInput) {
  // 1. username으로 기존 관리자가 있는지 확인
  const existingAdmin = await adminRepository.findAdminByUsername(
    data.username,
  );
  if (existingAdmin) {
    throw createError(409, '이미 존재하는 아이디입니다.');
  }

  // 비밀번호 해시화 및 계정 생성...
}
```

#### 수정 후 (src/user/services/admin.service.ts - superAdminRegister)
```typescript
async superAdminRegister(data: SuperAdminsInput) {
  // 1. username으로 기존 관리자가 있는지 확인
  const existingAdminByUsername = await adminRepository.findAdminByUsername(
    data.username,
  );
  if (existingAdminByUsername) {
    throw createError(409, '이미 존재하는 아이디입니다.');
  }

  // 2. email로 기존 관리자가 있는지 확인
  const existingAdminByEmail = await adminRepository.findAdminByEmail(
    data.email,
  );
  if (existingAdminByEmail) {
    throw createError(409, '이미 존재하는 이메일입니다.');
  }

  // 비밀번호 해시화 및 계정 생성...
}
```

#### 추가된 Repository 메서드 (src/user/repositories/admin.repository.ts)
```typescript
// email로 관리자 찾기
async findAdminByEmail(email: string) {
  const admin = await prisma.user.findFirst({
    where: {
      email: email,
    },
  });

  return admin;
}
```

---

### 3. 아파트 중복 등록 방지

#### 리뷰 코멘트
> DB구조상 관리자 계정을 생성하면서 아파트 정보까지 같이 등록이 되는 구조 같은데
> 관리자 계정의 중복보다는 아파트 정보의 중복을 걸러내는 서비스 코드가 필요할것 같습니다.
> 완전히 동일한 이름의 아파트를 다른 관리자 계정으로 등록해도 등록이 되는걸 확인했습니다.
> 아파트 이름을 유니크값으로 설정하는게 어떨까요?

#### 수정 전 (src/user/services/admin.service.ts - adminRegister)
```typescript
async adminRegister(data: AdminInput) {
  // 1. username으로 기존 관리자가 있는지 확인
  const existingAdmin = await adminRepository.findAdminByUsername(
    data.username,
  );

  // 2. 이미 존재하면 에러
  if (existingAdmin) {
    throw createError(409, '이미 존재하는 아이디입니다.');
  }

  // 비밀번호 해시화 및 계정/아파트 생성...
}
```

#### 수정 후 (src/user/services/admin.service.ts - adminRegister)
```typescript
async adminRegister(data: AdminInput) {
  // 1. username으로 기존 관리자가 있는지 확인
  const existingAdminByUsername = await adminRepository.findAdminByUsername(
    data.username,
  );
  if (existingAdminByUsername) {
    throw createError(409, '이미 존재하는 아이디입니다.');
  }

  // 2. email로 기존 관리자가 있는지 확인
  const existingAdminByEmail = await adminRepository.findAdminByEmail(
    data.email,
  );
  if (existingAdminByEmail) {
    throw createError(409, '이미 존재하는 이메일입니다.');
  }

  // 3. 아파트 이름 중복 확인
  const existingApartment = await adminRepository.findApartmentByName(
    data.adminOf.name,
  );
  if (existingApartment) {
    throw createError(409, '이미 등록된 아파트입니다.');
  }

  // 비밀번호 해시화 및 계정/아파트 생성...
}
```

#### 추가된 Repository 메서드 (src/user/repositories/admin.repository.ts)
```typescript
// 아파트 이름으로 아파트 찾기
async findApartmentByName(name: string) {
  const apartment = await prisma.adminOf.findFirst({
    where: {
      name: name,
    },
  });

  return apartment;
}
```

---

### 4. 관리자 삭제 시 방어 코드 추가

#### 리뷰 코멘트
> 관리자 삭제 서비스는 승인 전 관리자를 삭제하기 위한 서비스인 것 같습니다.
> 테스트 페이지에서 입주민이 0명인 아파트 관리자의 계정을 삭제하려고 하니 삭제가 안되더라고요.
> 승인이 안된 관리자 계정만 삭제가 가능했습니다.
> 아파트나 입주민 정보가 하나라도 연관되어 있으면 삭제할 수 없는 방어 코드 작성이 필요해 보입니다.

#### 수정 전 (src/user/services/admin.service.ts - deleteAdmin)
```typescript
async deleteAdmin(id: number) {
  // adminRepository의 deleteAdmin 함수 호출
  const deletedAdmin = await adminRepository.deleteAdmin(id);

  return deletedAdmin;
}
```

#### 수정 후 (src/user/services/admin.service.ts - deleteAdmin)
```typescript
async deleteAdmin(id: number) {
  // 1. 해당 관리자에게 연결된 입주민이 있는지 확인
  const residentCount = await adminRepository.countResidentsByAdminId(id);
  if (residentCount > 0) {
    throw createError(
      400,
      '입주민이 등록된 관리자는 삭제할 수 없습니다. 먼저 입주민을 삭제해주세요.',
    );
  }

  // 2. adminRepository의 deleteAdmin 함수 호출
  const deletedAdmin = await adminRepository.deleteAdmin(id);

  return deletedAdmin;
}
```

#### 추가된 Repository 메서드 (src/user/repositories/admin.repository.ts)
```typescript
// 관리자에게 연결된 입주민 수 확인
async countResidentsByAdminId(adminId: number) {
  const adminOf = await prisma.adminOf.findFirst({
    where: { userId: adminId },
  });

  if (!adminOf) {
    return 0;
  }

  const residentCount = await prisma.resident.count({
    where: {
      user: {
        role: Role.RESIDENT,
      },
    },
  });

  return residentCount;
}
```

---

### 요약

| 항목 | 수정 전 | 수정 후 |
|------|---------|---------|
| joinStatus enum | PENDING만 존재 | PENDING, APPROVED, REJECTED 추가 |
| 슈퍼관리자 회원가입 | username 중복 체크만 | username + email 중복 체크 |
| 일반관리자 회원가입 | username 중복 체크만 | username + email + 아파트명 중복 체크 |
| 관리자 삭제 | 바로 삭제 | 입주민 존재 시 삭제 불가 처리 |

---

**문의사항이 있으시면 이슈를 등록해주세요.**
