import type { CreateResidentBody } from 'src/lib/type/express/resident.index.js';
import residentsRepository from '../repositories/residents.repository.js';
import createError from 'http-errors';
import type { GetResidentsDto } from '../../lib/type/express/resident.index.js';

class ResidentsService {
  async getResidents(userId: number, dto: GetResidentsDto) {
    const filters: Record<string, unknown> = {};
    if (dto.searchKeyword) {
      filters.OR = [
        { contact: { contains: dto.searchKeyword } },
        { name: { contains: dto.searchKeyword } },
      ];
    }
    if (dto.building) filters.building = dto.building;
    if (dto.unit) filters.unit = dto.unit;
    if (dto.isHouseholder !== undefined)
      filters.isHouseholder = dto.isHouseholder === true;
    // || dto.isHouseholder === 'true'; boolean이아니라 string로 들어올수도 있어서 체크후 삭제 예정
    if (dto.isRegistered !== undefined)
      filters.isRegistered = dto.isRegistered === true;
    // || dto.isRegistered === 'true'; boolean이아니라 string로 들어올수도 있어서 체크후 삭제 예정
    const residents = await residentsRepository.getResidents(
      userId,
      dto.page,
      dto.limit,
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
      userId: resident.userId
        ? { connect: { id: resident.userId } }
        : undefined, // isRegistered 확인용 인듯 (프론트와 연결시 확인 필요)
    }));
    return {
      data,
      total: data.length,
      page: dto.page,
      limit: dto.limit,
      //hasNext
    };
  }
  async getResidentsById(userId: number, residentId: number) {
    if (!residentId) {
      throw createError(400, '입주민 정보가 없습니다.');
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
      userId: residents?.userId ?? null,
    };
    return data;
  }
  async createResidents(userId: number, residentData: CreateResidentBody) {
    const admin = await residentsRepository.findById(userId);
    const apartmentId = admin?.adminOf?.ownedApartments?.[0]?.id;
    if (!admin || !admin.adminOf) {
      throw createError(400, '관리자 권한이 없습니다.');
    }
    if (!apartmentId) {
      throw createError(400, '아파트 정보가 없습니다.');
    }
    const userEmail = await residentsRepository.findByEmail(residentData.email);
    if (userEmail) {
      throw createError(400, '이미 존재하는 사용자입니다.');
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
      throw createError(400, '관리자 권한이 없습니다.');
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
      throw createError(400, '입주민 정보가 없습니다.');
    }
    return await residentsRepository.deleteResidentById(userId, residentId);
  }
}

export default new ResidentsService();
