import { prisma } from '../../lib/prisma.js';
import {
  Role,
  joinStatus as JoinStatus,
  Prisma,
} from '../../../generated/prisma/client.js';
import type {
  SuperAdminsInput,
  AdminOfInput,
  AdminInput,
  FindAdminsParams,
  CountAdminsParams,
} from './types/admin.types.js';

class AdminRepository {
  // username으로 관리자 찾기
  async findAdminByUsername(username: string) {
    const admin = await prisma.user.findFirst({
      where: {
        username: username,
      },
    });

    return admin;
  }

  // email로 관리자 찾기
  async findAdminByEmail(email: string) {
    const admin = await prisma.user.findFirst({
      where: {
        email: email,
      },
    });

    return admin;
  }

  // 아파트 이름으로 아파트 찾기
  async findApartmentByName(name: string) {
    const apartment = await prisma.adminOf.findFirst({
      where: {
        name: name,
      },
    });

    return apartment;
  }

  // 관리자에게 연결된 입주민 수 확인
  async countResidentsByAdminId(adminId: number) {
    // adminOf를 통해 아파트 ID를 가져온 후, 해당 아파트의 입주민 수 확인
    const adminOf = await prisma.adminOf.findFirst({
      where: { userId: adminId },
    });

    if (!adminOf) {
      return 0;
    }

    // Resident 모델에서 해당 아파트 건물/호수에 속한 입주민 수 확인
    const residentCount = await prisma.resident.count({
      where: {
        user: {
          role: Role.RESIDENT,
        },
      },
    });

    return residentCount;
  }

  // 슈퍼 관리자 계정 생성
  async createSuperAccount(data: SuperAdminsInput) {
    const newSuperAdmin = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        contact: data.contact,
        name: data.name,
        password: data.password,
        role: Role.SUPER_ADMIN, // 역할을 SUPER_ADMIN으로 설정
        avatar: '',
        joinStatus: JoinStatus.APPROVED, // 가입 상태를 APPROVED로 설정
        isActive: true,
      },
    });

    return newSuperAdmin;
  }

  // 일반 관리자 계정 생성
  async createAccount(data: Omit<AdminInput, 'adminOf'>) {
    const newAdmin = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        contact: data.contact,
        name: data.name,
        password: data.password,
        role: Role.ADMIN, // 역할을 ADMIN으로 설정
        avatar: '',
        joinStatus: JoinStatus.PENDING, // 가입 상태를 PENDING으로 설정
        isActive: true,
      },
    });

    return newAdmin;
  }

  // 관리자의 아파트 정보 생성
  async createAdminOf(userId: number, adminOfData: AdminOfInput) {
    const adminOf = await prisma.adminOf.create({
      data: {
        name: adminOfData.name,
        address: adminOfData.address,
        description: adminOfData.description,
        officeNumber: adminOfData.officeNumber,
        buildingNumberFrom: adminOfData.buildingNumberFrom,
        buildingNumberTo: adminOfData.buildingNumberTo,
        floorCountPerBuilding: adminOfData.floorCountPerBuilding,
        unitCountPerFloor: adminOfData.unitCountPerFloor,
        user: {
          connect: { id: userId }, // userId로 관리자와 연결
        },
      },
    });

    return adminOf;
  }

  // 관리자 목록 조회
  async findAdmins(params: FindAdminsParams) {
    const searchKeyword = params.searchKeyword;
    const joinStatusString = params.joinStatusString;
    const skip = params.skip || 0;
    const limit = params.limit || 20;

    // joinStatus를 enum으로 변환
    let joinStatusFilter = undefined;
    if (joinStatusString) {
      joinStatusFilter = JoinStatus[
        joinStatusString as keyof typeof JoinStatus
      ] as JoinStatus;
    }

    // where 조건 만들기
    const andConditions: Prisma.UserWhereInput[] = [];

    // ADMIN 역할이면서 adminOf가 있는 것만 조회
    andConditions.push({
      role: Role.ADMIN,
      adminOf: {
        isNot: null,
      },
    });

    // 검색 키워드가 있으면 OR 조건 추가
    if (searchKeyword) {
      andConditions.push({
        OR: [
          { name: { contains: searchKeyword } },
          { email: { contains: searchKeyword } },
          {
            adminOf: {
              OR: [
                { name: { contains: searchKeyword } },
                { address: { contains: searchKeyword } },
              ],
            },
          },
        ],
      });
    }

    // 가입 상태 필터가 있으면 추가
    if (joinStatusFilter) {
      andConditions.push({
        joinStatus: joinStatusFilter,
      });
    }

    // 조건 구성
    const whereCondition: Prisma.UserWhereInput = { AND: andConditions };

    // 관리자 목록 조회
    const admins = await prisma.user.findMany({
      where: whereCondition,
      include: {
        adminOf: true, // adminOf 정보도 함께 가져오기
      },
      skip: skip,
      take: limit,
      orderBy: { createdAt: 'desc' }, // 최신순으로 정렬
    });

    return admins;
  }

  // 관리자 수 세기
  async countAdmins(params: CountAdminsParams) {
    const searchKeyword = params.searchKeyword;
    const joinStatusString = params.joinStatusString;

    // joinStatus를 enum으로 변환
    let joinStatusFilter = undefined;
    if (joinStatusString) {
      joinStatusFilter = JoinStatus[
        joinStatusString as keyof typeof JoinStatus
      ] as JoinStatus;
    }

    // where 조건 만들기 (findAdmins와 동일)
    const andConditions: Prisma.UserWhereInput[] = [];

    // ADMIN 역할이면서 adminOf가 있는 것만 조회
    andConditions.push({
      role: Role.ADMIN,
      adminOf: {
        isNot: null,
      },
    });

    if (searchKeyword) {
      andConditions.push({
        OR: [
          { name: { contains: searchKeyword } },
          { email: { contains: searchKeyword } },
          {
            adminOf: {
              OR: [
                { name: { contains: searchKeyword } },
                { address: { contains: searchKeyword } },
              ],
            },
          },
        ],
      });
    }

    if (joinStatusFilter) {
      andConditions.push({
        joinStatus: joinStatusFilter,
      });
    }

    const whereCondition: Prisma.UserWhereInput = { AND: andConditions };

    // 조건에 맞는 관리자 수 세기
    const count = await prisma.user.count({
      where: whereCondition,
    });

    return count;
  }

  // 여러 관리자의 가입 상태 변경
  async updateManyJoinStatus(joinStatus: JoinStatus) {
    const result = await prisma.user.updateMany({
      where: { role: Role.ADMIN }, // ADMIN 역할을 가진 모든 사용자
      data: { joinStatus: joinStatus },
    });

    return result;
  }

  // 특정 관리자의 가입 상태 변경
  async updateJoinStatusById(id: number, joinStatus: JoinStatus) {
    const updatedAdmin = await prisma.user.update({
      where: { id: id },
      data: { joinStatus: joinStatus },
    });

    return updatedAdmin;
  }

  // 관리자 정보 수정
  async updateAdmin(
    id: number,
    userData: {
      email?: string;
      contact?: string;
      name?: string;
    },
    adminOfData?: {
      name?: string;
      address?: string;
      description?: string;
      officeNumber?: string;
    },
  ) {
    // adminOf 데이터가 있으면 함께 업데이트
    const updateData: Prisma.UserUpdateInput = {
      email: userData.email,
      contact: userData.contact,
      name: userData.name,
    };

    if (adminOfData) {
      updateData.adminOf = {
        update: adminOfData,
      };
    }

    const updatedAdmin = await prisma.user.update({
      where: { id: id },
      data: updateData,
      include: {
        adminOf: true, // adminOf 정보도 함께 반환
      },
    });

    return updatedAdmin;
  }

  // 관리자 삭제
  async deleteAdmin(id: number) {
    // 1. 먼저 adminOf를 삭제
    await prisma.adminOf.deleteMany({
      where: { userId: id },
    });

    // 2. 그 다음 user를 삭제
    const deletedAdmin = await prisma.user.delete({
      where: { id: id },
    });

    return deletedAdmin;
  }

  // 거절된 관리자들 일괄 삭제
  async deleteRejectedAdmins() {
    // 1. 거절된 관리자들 찾기
    const rejectedAdmins = await prisma.user.findMany({
      where: {
        role: Role.ADMIN,
        joinStatus: JoinStatus.REJECTED,
      },
      select: { id: true }, // id만 가져오기
    });

    // 2. 거절된 관리자들의 id 배열 만들기
    const adminIds = rejectedAdmins.map((admin) => admin.id);

    // 3. adminOf 먼저 삭제
    await prisma.adminOf.deleteMany({
      where: {
        userId: { in: adminIds },
      },
    });

    // 4. user 삭제
    const result = await prisma.user.deleteMany({
      where: {
        id: { in: adminIds },
      },
    });

    return result;
  }
}

export default new AdminRepository();
