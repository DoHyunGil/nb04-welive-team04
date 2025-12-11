import type { CreateResidentBody } from 'src/lib/type/express/resident.index.js';
import residentsRepository from '../repositories/residents.repository.js';
import { AppError } from '../../middlewares/errorClass.js';

class ResidentsService {
  async getResidents(
    userId: number,
    page: number,
    limit: number,
    searchKeyword?: string,
    building?: number,
    unit?: number,
    isHouseholder?: string | boolean,
    isRegistered?: string | boolean,
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
    if (isHouseholder !== undefined)
      filters.isHouseholder =
        isHouseholder === true || isHouseholder === 'true';
    if (isRegistered !== undefined)
      filters.isRegistered = isRegistered === true || isRegistered === 'true';
    const residents = await residentsRepository.getResidents(
      userId,
      page,
      limit,
      filters,
    );
    const data = residents.map((resident) => ({
      id: resident.id,
      createdAt: resident.createdAt,
      email: resident.email,
      contact: resident.contact,
      name: resident.name,
      building: resident.building,
      unit: resident.unit,
      isHouseholder: resident.isHouseholder,
      userId: resident.userId, // isRegistered 확인용 인듯 (프론트와 연결시 확인 필요)
    }));
    return {
      data,
      total: data.length,
      page,
      limit,
      //hasNext
    };
  }
  async getResidentsById(userId: number, residentId: number) {
    if (!residentId) {
      throw new AppError('입주민 정보가 없습니다.', 400);
    }
    const residents = await residentsRepository.getResidentsById(
      userId,
      residentId,
    );
    const data = {
      id: residents?.id,
      createdAt: residents?.createdAt,
      email: residents?.email,
      contact: residents?.contact,
      name: residents?.name,
      building: residents?.building,
      unit: residents?.unit,
      isHouseholder: residents?.isHouseholder, // string으로 나가는지 boolean 값으로 나가는지 확인 필요
      userId: residents?.userId,
    };
    return data;
  }
  async createResidents(userId: number, residentData: CreateResidentBody) {
    const admin = await residentsRepository.findById(userId);
    const apartmentId = admin?.adminOf?.Apartment?.id;
    if (!admin || !admin.adminOf) {
      throw new AppError('관리자 권한이 없습니다.', 403);
    }
    if (!apartmentId) {
      throw new AppError('아파트 정보가 없습니다.', 400);
    }
    const userEmail = await residentsRepository.findByEmail(residentData.email);
    if (userEmail) {
      throw new AppError('이미 존재하는 사용자입니다.', 400);
    }
    const residents = await residentsRepository.createResidents(
      residentData,
      apartmentId,
    );
    const data = {
      id: residents.id,
      createdAt: new Date(),
      email: residents.email,
      contact: residents.contact,
      name: residents.name,
      building: residents.building,
      unit: residents.unit,
      isHouseholder: residents.isHouseholder,
      userId: residents.userId,
    };
    return data;
  }
  async updateResidents(
    userId: number,
    residentId: number,
    residentData: Partial<CreateResidentBody>,
  ) {
    const admin = await residentsRepository.findById(userId);
    if (!admin || !admin.adminOf) {
      throw new AppError('관리자 권한이 없습니다.', 403);
    }
    const residents = await residentsRepository.updateResidents(
      residentId,
      residentData,
    );
    const data = {
      id: residents.id,
      contact: residents.contact,
      name: residents.name,
      building: residents.building,
      unit: residents.unit,
      isHouseholder: residents.isHouseholder,
      userId: residents.userId,
    };
    return data;
  }
  async deleteResidentById(userId: number, residentId: number) {
    if (!residentId) {
      throw new AppError('입주민 정보가 없습니다.', 400);
    }
    return await residentsRepository.deleteResidentById(userId, residentId);
  }
}

export default new ResidentsService();
