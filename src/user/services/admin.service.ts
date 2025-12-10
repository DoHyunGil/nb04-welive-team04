import createError from 'http-errors';
import { hashPassword } from '../../lib/password.js';
import adminRepository from '../repositories/admin.repository.js';
import { joinStatus } from '../../../generated/prisma/enums.js';
import type {
  SuperAdminsInput,
  AdminInput,
  FindAdminsServiceParams,
} from '../repositories/types/admin.types.js';

// joinStatus 문자열을 enum으로 변환하는 함수
function parseJoinStatus(joinStatusString: string): joinStatus {
  if (joinStatusString === 'PENDING') return joinStatus.PENDING;
  if (joinStatusString === 'APPROVED') return joinStatus.APPROVED;
  if (joinStatusString === 'REJECTED') return joinStatus.REJECTED;
  throw createError(400, '잘못된 joinStatus 값입니다.');
}

class AdminService {
  // 슈퍼 관리자 회원가입
  async superAdminRegister(data: SuperAdminsInput) {
    const existingAdminByUsername = await adminRepository.findAdminByUsername(data.username);
    if (existingAdminByUsername) {
      throw createError(409, '이미 존재하는 아이디입니다.');
    }

    const existingAdminByEmail = await adminRepository.findAdminByEmail(data.email);
    if (existingAdminByEmail) {
      throw createError(409, '이미 존재하는 이메일입니다.');
    }

    data.password = await hashPassword(data.password);
    const newSuperAdmin = await adminRepository.createSuperAccount(data);

    return newSuperAdmin;
  }

  // 일반 관리자 회원가입
  async adminRegister(data: AdminInput) {
    const existingAdminByUsername = await adminRepository.findAdminByUsername(data.username);
    if (existingAdminByUsername) {
      throw createError(409, '이미 존재하는 아이디입니다.');
    }

    const existingAdminByEmail = await adminRepository.findAdminByEmail(data.email);
    if (existingAdminByEmail) {
      throw createError(409, '이미 존재하는 이메일입니다.');
    }

    const existingApartment = await adminRepository.findApartmentByName(data.adminOf.name);
    if (existingApartment) {
      throw createError(409, '이미 등록된 아파트입니다.');
    }

    data.password = await hashPassword(data.password);
    const newUser = await adminRepository.createAccount(data);
    await adminRepository.createAdminOf(newUser.id, data.adminOf);

    return newUser;
  }

  // 관리자 목록 조회 (페이지네이션 포함)
  async findAdmins(params: FindAdminsServiceParams) {
    const { page, limit, searchKeyword, joinStatusString } = params;

    // 페이지 계산 (서비스에서 처리)
    const skip = (page - 1) * limit;

    const adminListPromise = adminRepository.findAdmins({
      searchKeyword,
      joinStatusString,
      skip,
      limit,
    });
    const totalCountPromise = adminRepository.countAdmins({ searchKeyword, joinStatusString });

    const adminList = await adminListPromise;
    const totalCount = await totalCountPromise;

    const hasNextPage = skip + limit < totalCount;

    return {
      data: adminList,
      totalCount,
      page,
      limit,
      hasNext: hasNextPage,
    };
  }

  // 여러 관리자의 가입 상태를 한번에 변경
  async updateManyJoinStatus(joinStatusString: string) {
    const joinStatusEnum = parseJoinStatus(joinStatusString);
    const updateResult = await adminRepository.updateManyJoinStatus(joinStatusEnum);
    return updateResult.count;
  }

  // 특정 관리자의 가입 상태 변경
  async updateJoinStatusById(id: number, joinStatusString: string) {
    const joinStatusEnum = parseJoinStatus(joinStatusString);
    const updatedAdmin = await adminRepository.updateJoinStatusById(id, joinStatusEnum);
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
    const adminOfData = data.adminOf;
    const userData = {
      email: data.email,
      contact: data.contact,
      name: data.name,
    };

    const updatedAdmin = await adminRepository.updateAdmin(id, userData, adminOfData);
    return updatedAdmin;
  }

  // 관리자 삭제
  async deleteAdmin(id: number) {
    const residentCount = await adminRepository.countResidentsByAdminId(id);
    if (residentCount > 0) {
      throw createError(
        400,
        '입주민이 등록된 관리자는 삭제할 수 없습니다. 먼저 입주민을 삭제해주세요.',
      );
    }

    const deletedAdmin = await adminRepository.deleteAdmin(id);
    return deletedAdmin;
  }

  // 거절된 관리자들을 모두 삭제
  async deleteRejectedAdmins() {
    const deleteResult = await adminRepository.deleteRejectedAdmins();
    return deleteResult.count;
  }
}

export default new AdminService();
