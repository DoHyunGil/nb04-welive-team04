import createError from 'http-errors';
import authMiddleware from '../../middlewares/auth.middleware.js';
import adminRepository from '../repositories/admin.repository.js';
import { joinStatus } from '../../../generated/prisma/enums.js';
import type {
  SuperAdminsInput,
  AdminInput,
  FindAdminsParams,
} from '../repositories/types/admin.types.js';

// joinStatus 문자열을 enum으로 변환하는 함수
function parseJoinStatus(joinStatusString: string): joinStatus {
  // PENDING이면 PENDING enum 반환
  if (joinStatusString === 'PENDING') return joinStatus.PENDING;
  // APPROVED이면 APPROVED enum 반환
  if (joinStatusString === 'APPROVED') return joinStatus.APPROVED;
  // REJECTED이면 REJECTED enum 반환
  if (joinStatusString === 'REJECTED') return 'REJECTED' as joinStatus;
  // 위의 값이 아니면 에러 발생
  throw createError(400, '잘못된 joinStatus 값입니다.');
}

class AdminService {
  // 슈퍼 관리자 회원가입
  async superAdminRegister(data: SuperAdminsInput) {
    // 1. username으로 기존 관리자가 있는지 확인
    const existingAdmin = await adminRepository.findAdminByUsername(
      data.username,
    );

    // 2. 이미 존재하면 에러
    if (existingAdmin) {
      throw createError(400, '이미 존재하는 아이디입니다.');
    }

    // 3. 비밀번호를 해시로 암호화
    const hashedPassword = await authMiddleware.hashPassword(data.password);
    data.password = hashedPassword;

    // 4. 슈퍼 관리자 계정 생성
    const newSuperAdmin = await adminRepository.createSuperAccount(data);

    return newSuperAdmin;
  }

  // 일반 관리자 회원가입
  async adminRegister(data: AdminInput) {
    // 1. username으로 기존 관리자가 있는지 확인
    const existingAdmin = await adminRepository.findAdminByUsername(
      data.username,
    );

    // 2. 이미 존재하면 에러
    if (existingAdmin) {
      throw createError(409, '이미 존재하는 아이디입니다.');
    }

    // 3. 비밀번호를 해시로 암호화
    const hashedPassword = await authMiddleware.hashPassword(data.password);
    data.password = hashedPassword;

    // 4. 관리자 계정 생성
    const newUser = await adminRepository.createAccount(data);

    // 5. 관리자의 아파트 정보 생성
    await adminRepository.createAdminOf(newUser.id, data.adminOf);

    // 6. 생성된 사용자 정보 반환
    return newUser;
  }

  // 관리자 목록 조회 (페이지네이션 포함)
  async findAdmins(params: FindAdminsParams) {
    // 1. 관리자 목록과 전체 개수를 동시에 조회
    const adminListPromise = adminRepository.findAdmins(params);
    const totalCountPromise = adminRepository.countAdmins(params);

    // Promise.all로 두 개의 쿼리를 동시에 실행
    const adminList = await adminListPromise;
    const totalCount = await totalCountPromise;

    // 2. 페이지 번호 계산
    const skip = params.skip || 0; // skip이 없으면 0
    const limit = params.limit || 20; // limit이 없으면 20
    const currentPage = Math.floor(skip / limit) + 1; // 현재 페이지 번호

    // 3. 다음 페이지가 있는지 확인
    const hasNextPage = skip + limit < totalCount;

    // 4. 결과 반환
    return {
      data: adminList,
      totalCount: totalCount,
      page: currentPage,
      limit: limit,
      hasNext: hasNextPage,
    };
  }

  // 여러 관리자의 가입 상태를 한번에 변경
  async updateManyJoinStatus(joinStatusString: string) {
    // 1. 문자열을 enum으로 변환
    const joinStatusEnum = parseJoinStatus(joinStatusString);

    // 2. 여러 관리자의 가입 상태 변경
    const updateResult = await adminRepository.updateManyJoinStatus(
      joinStatusEnum,
    );

    // 3. 변경된 개수 반환
    return updateResult.count;
  }

  // 특정 관리자의 가입 상태 변경
  async updateJoinStatusById(id: number, joinStatusString: string) {
    // 1. 문자열을 enum으로 변환
    const joinStatusEnum = parseJoinStatus(joinStatusString);

    // 2. 해당 id의 관리자 가입 상태 변경
    const updatedAdmin = await adminRepository.updateJoinStatusById(
      id,
      joinStatusEnum,
    );

    return updatedAdmin;
  }

  // 관리자 정보 수정
  async updateAdmin(
    id: number,
    data: {
      email?: string;
      contact?: string;
      name?: string;
      adminOf?: {
        name?: string;
        address?: string;
        description?: string;
        officeNumber?: string;
      };
    },
  ) {
    // 1. adminOf와 사용자 정보를 분리
    const adminOfData = data.adminOf;
    const userData = {
      email: data.email,
      contact: data.contact,
      name: data.name,
    };

    // 2. 관리자 정보 업데이트
    const updatedAdmin = await adminRepository.updateAdmin(
      id,
      userData,
      adminOfData,
    );

    return updatedAdmin;
  }

  // 관리자 삭제
  async deleteAdmin(id: number) {
    // adminRepository의 deleteAdmin 함수 호출
    const deletedAdmin = await adminRepository.deleteAdmin(id);

    return deletedAdmin;
  }

  // 거절된 관리자들을 모두 삭제
  async deleteRejectedAdmins() {
    // 1. 거절된 관리자들 삭제
    const deleteResult = await adminRepository.deleteRejectedAdmins();

    // 2. 삭제된 개수 반환
    return deleteResult.count;
  }
}

export default new AdminService();
