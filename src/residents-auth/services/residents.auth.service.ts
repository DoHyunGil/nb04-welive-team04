import type { CreateResidentAuthBody } from 'src/lib/type/express/resident.index.js';
import residentsAuthRepository from '../repositories/residents.auth.repository.js';
import residentsRepository from '../../residents/repositories/residents.repository.js';
import createError from 'http-errors';
import { joinStatus } from 'generated/prisma/enums.js';
import type { User } from 'generated/prisma/browser.js';

class ResidentsAuthService {
  async getResidentsAuth(
    userId: number,
    page: number,
    limit: number,
    searchKeyword?: string,
    joinStatus?: 'PENDING' | 'APPROVED' | 'REJECTED',
    building?: number,
    unit?: number,
  ) {
    const filters: Record<string, unknown> = {};
    if (searchKeyword) {
      filters.OR = [
        { contact: { contains: searchKeyword } },
        { name: { contains: searchKeyword } },
      ];
    }
    if (building) filters.building = building;
    if (unit) filters.unit = unit;
    if (joinStatus) filters.joinStatus = joinStatus;

    const residents = await residentsAuthRepository.getResidentsAuth(
      userId,
      page,
      limit,
      filters,
    );
    const data = residents.map((resident) => ({
      id: resident.id,
      createdAt: resident.createdAt,
      email: resident.email,
      name: resident.name,
      contact: resident.contact,
      joinStatus: resident.user!.joinStatus,
      resident: {
        id: resident.id,
        building: resident.building,
        unit: resident.unit,
      },
    }));
    return { data, total: data.length };
  }

  // 관리자 권한 없이 일반 입주민 회원가입
  async createResidentsAuth(residentData: CreateResidentAuthBody) {
    const userName = await residentsAuthRepository.findByUserName(
      residentData.username,
    );
    if (userName) {
      throw createError(400, '이미 존재하는 아이디입니다.');
    }
    const apartment = await residentsAuthRepository.findByApartmentId(
      residentData.apartmentName,
    );
    if (!apartment) {
      throw createError(400, '아파트 정보가 없습니다.');
    }
    const userEmail = await residentsAuthRepository.findByUserEmail(
      residentData.email,
    );
    const existingResident = await residentsAuthRepository.findByResidentsEmail(
      residentData.email,
    );
    let isActive = false;
    if (userEmail && !existingResident) {
      throw createError(400, '이미 존재하는 이메일입니다.');
    } else if (!userEmail && existingResident) {
      isActive = true;
      return isActive;
    } else if (!userEmail && !existingResident) {
      isActive = false;
    }
    const apartmentId = apartment.id;

    // 등록된 입주민이 있을 때
    if (existingResident) {
      const residentId: number = existingResident.id;
      const createdUser: User = await residentsAuthRepository.createUser(
        residentData,
        joinStatus.APPROVED,
        residentId,
        isActive,
      );
      await residentsAuthRepository.updateResidentUserId(
        residentId,
        createdUser.id,
      );
      return createdUser;
    } else {
      // 등록된 입주민이 없을 때
      // 1. resident 생성
      const residents = await residentsRepository.createResidents(
        residentData,
        apartmentId,
      );
      // 2. user 생성
      const residentId: number = residents.id;
      const createdUser = await residentsAuthRepository.createUser(
        residentData,
        joinStatus.PENDING,
        residentId,
        isActive,
      );
      await residentsAuthRepository.updateResidentUserId(
        residentId,
        createdUser.id,
      );

      return createdUser;
    }
  }

  async approveResidentsAuth(userId: number, residentId: number) {
    const admin = await residentsRepository.findById(userId);
    if (!admin || !admin.adminOf) {
      throw createError(400, '관리자 권한이 없습니다.');
    }
    const apartmentId: number = admin.adminOf.Apartment!.id;
    const residents = await residentsAuthRepository.findByapartmentId(
      apartmentId,
      residentId,
    );
    // resident는 배열 : 로그인한 관리자 아파트에 속한 user의 Id
    const userIds = residents.map((r) => r.userId);
    const validUserIds = userIds.filter((id): id is number => id !== null);
    const data =
      await residentsAuthRepository.updateapproveResidentsAuth(validUserIds);
    return data;
  }
}

export default new ResidentsAuthService();
