import { z } from 'zod';

// 슈퍼관리자 회원가입 스키마
export const superAdminRegisterSchema = z.object({
  username: z
    .string()
    .min(5, '아이디는 최소 5자 이상입니다.')
    .max(30, '아이디는 최대 30자까지 가능합니다.'),
  email: z
    .string()
    .min(1, '이메일을 입력해주세요')
    .email('이메일 형식으로 작성해 주세요.'),
  contact: z
    .string()
    .regex(/^\d+$/, '숫자만 입력해주세요. 하이픈(-)은 제외해주세요.'),
  name: z.string().min(2, '이름을 입력해주세요'),
  password: z
    .string()
    .min(8, '비밀번호는 최소 8자 이상입니다.')
    .regex(
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+[\]{};:'",.<>/?\\|`~]).{8,}$/,
      '영문, 숫자, 특수문자를 모두 포함해야 합니다.',
    ),
});

// 일반 관리자 회원가입 스키마
export const adminRegisterSchema = z.object({
  username: z
    .string()
    .min(5, '아이디는 최소 5자 이상입니다.')
    .max(30, '아이디는 최대 30자까지 가능합니다.'),
  email: z
    .string()
    .min(1, '이메일을 입력해주세요')
    .email('이메일 형식으로 작성해 주세요.'),
  contact: z
    .string()
    .regex(/^\d+$/, '숫자만 입력해주세요. 하이픈(-)은 제외해주세요.'),
  name: z.string().min(2, '이름을 입력해주세요'),
  password: z
    .string()
    .min(8, '비밀번호는 최소 8자 이상입니다.')
    .regex(
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+[\]{};:'",.<>/?\\|`~]).{8,}$/,
      '영문, 숫자, 특수문자를 모두 포함해야 합니다.',
    ),
  adminOf: z.object({
    name: z.string().min(1, '아파트명을 입력해주세요'),
    address: z.string().min(1, '아파트 주소를 입력해주세요'),
    description: z.string().min(1, '아파트 소개를 입력해주세요'),
    officeNumber: z.string().min(1, '관리소 번호를 입력해주세요'),
    buildingNumberFrom: z
      .number()
      .int()
      .min(1, '동을 입력해주세요')
      .max(99, '동은 두 자리까지만 입력 가능합니다'),
    buildingNumberTo: z
      .number()
      .int()
      .min(1, '동을 입력해주세요')
      .max(99, '동은 두 자리까지만 입력 가능합니다'),
    floorCountPerBuilding: z
      .number()
      .int()
      .min(1, '층을 입력해주세요')
      .max(99, '층은 두 자리까지만 입력 가능합니다'),
    unitCountPerFloor: z
      .number()
      .int()
      .min(1, '호를 입력해주세요')
      .max(99, '호는 두 자리까지만 입력 가능합니다'),
  }),
});

// 관리자 정보 수정 스키마
export const updateAdminSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다.').optional(),
  contact: z
    .string()
    .regex(/^010-\d{4}-\d{4}$/, '연락처는 010-XXXX-XXXX 형식이어야 합니다.')
    .optional(),
  name: z
    .string()
    .min(2, '이름은 최소 2자 이상이어야 합니다.')
    .max(20, '이름은 최대 20자까지 가능합니다.')
    .optional(),
  adminOf: z
    .object({
      name: z
        .string()
        .min(2, '아파트 이름은 최소 2자 이상이어야 합니다.')
        .optional(),
      address: z
        .string()
        .min(5, '주소는 최소 5자 이상이어야 합니다.')
        .optional(),
      description: z.string().optional(),
      officeNumber: z.string().optional(),
    })
    .optional(),
});

// 가입 상태 변경 스키마
export const updateJoinStatusSchema = z.object({
  joinStatus: z.enum(['PENDING', 'APPROVED', 'REJECTED'], {
    message: 'joinStatus는 PENDING, APPROVED, REJECTED 중 하나여야 합니다.',
  }),
});

// 단일 관리자 가입 상태 변경 스키마 (ID 포함)
export const updateJoinStatusByIdSchema = z.object({
  id: z.number().int().positive('ID는 양수여야 합니다.'),
  joinStatus: z.enum(['PENDING', 'APPROVED', 'REJECTED'], {
    message: 'joinStatus는 PENDING, APPROVED, REJECTED 중 하나여야 합니다.',
  }),
});

// 관리자 조회 쿼리 파라미터 스키마
export const getAdminsQuerySchema = z.object({
  searchKeyword: z.string().optional(),
  joinStatus: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  page: z
    .string()
    .regex(/^\d+$/, 'page는 숫자여야 합니다.')
    .optional()
    .transform((val) => (val ? parseInt(val) : 1)),
  limit: z
    .string()
    .regex(/^\d+$/, 'limit는 숫자여야 합니다.')
    .optional()
    .transform((val) => (val ? parseInt(val) : 20)),
});
