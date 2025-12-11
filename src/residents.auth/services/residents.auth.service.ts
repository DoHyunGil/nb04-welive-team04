// import type {
//   CreateResidentAuthBody,
//   CreateResidentBody,
// } from 'src/lib/type/express/resident.index.js';
// import residentsAuthRepository from '../repositories/residents.auth.repository.js';
// import residentsRepository from '../../residents/repositories/residents.repository.js';
// import { AppError } from '../../middlewares/errorClass.js';
// import { joinStatus } from 'generated/prisma/enums.js';
// import type { User } from 'generated/prisma/browser.js';
// import { prisma } from './../../lib/prisma.js';

// class ResidentsAuthService {
//   async getResidentsAuth(
//     userId: number,
//     limit: number,
//     page: number,
//     searchKeyword?: string,
//     building?: number,
//     unit?: number,
//     joinStatus?: 'PENDING' | 'APPROVED' | 'REJECTED',
//   ) {
//     const filters: Record<string, unknown> = {};
//     if (searchKeyword) {
//       filters.OR = [
//         { contact: { contains: searchKeyword } },
//         { name: { contains: searchKeyword } },
//       ];
//     }
//     if (building) filters.building = building;
//     if (unit) filters.unit = unit;
//     if (joinStatus !== undefined) filters.joinStatus = joinStatus;

//     const residents = await residentsAuthRepository.getResidentsAuth(
//       userId,
//       limit,
//       page,
//       filters,
//     );
//     const data = residents.map((resident) => ({
//       id: resident.id,
//       createdAt: resident.createdAt,
//       email: resident.email,
//       name: resident.name,
//       contact: resident.contact,
//       joinStatus: resident.user!.joinStatus,
//       resident: {
//         id: resident.id,
//         building: resident.building,
//         unit: resident.unit,
//       },
//     }));
//     return { data, total: data.length };
//   }

//   // 관리자 권한 없이 일반 입주민 회원가입
//   async createResidentsAuth(residentData: CreateResidentAuthBody) {
//     const userName = await residentsAuthRepository.findByUserName(
//       residentData.username,
//     );
//     if (userName) {
//       throw new AppError('이미 존재하는 아이디입니다.', 400);
//     }
//     const apartment = await residentsAuthRepository.findByApartmentId(
//       residentData.apartmentName,
//     );
//     if (!apartment) {
//       throw new AppError('아파트 정보가 없습니다.', 400);
//     }

//     const userEmail = await residentsAuthRepository.findByUserEmail(
//       residentData.email,
//     );
//     const existingResident = await residentsAuthRepository.findByResidentsEmail(
//       residentData.email,
//     );
//     let isActive = false;
//     if (userEmail && !existingResident) {
//       throw new AppError('이미 존재하는 이메일입니다.', 400);
//     } else if (!userEmail && existingResident) {
//       isActive = true;
//       return isActive;
//     } else if (!userEmail && !existingResident) {
//       isActive = false;
//     }
//     const apartmentId = apartment.id;

//     // 등록된 입주민이 있을 때
//     if (existingResident) {
//       const residentId: number = existingResident.id;
//       const createdUser: User = await residentsAuthRepository.createUser(
//         residentData,
//         joinStatus.APPROVED,
//         residentId,
//         isActive,
//       );
//       await residentsAuthRepository.updateResidentUserId(
//         residentId,
//         createdUser.id,
//       );
//       return createdUser;
//     } else {
//       // 등록된 입주민이 없을 때
//       // 1. resident 생성
//       const residents = await residentsRepository.createResidents(
//         residentData,
//         apartmentId,
//       );
//       // 2. user 생성
//       const createdUser = await residentsAuthRepository.createUser(
//         residentData,
//         joinStatus.PENDING,
//         resident.id,
//         isActive,
//       );

//       return createdUser;
//     }
//   }

//   //////////////////////////////////////////////////////////////////////////////////////////
//   async updateResidents(
//     userId: number,
//     residentId: number,
//     residentData: Partial<CreateResidentBody>,
//   ) {
//     const admin = await residentsAuthRepository.findById(userId);
//     if (!admin || !admin.adminOf) {
//       throw new AppError('관리자 권한이 없습니다.', 403);
//     }
//     const residents = await residentsAuthRepository.updateResidents(
//       residentId,
//       residentData,
//     );
//     const data = {
//       id: residents.id,
//       contact: residents.contact,
//       name: residents.name,
//       building: residents.building,
//       unit: residents.unit,
//       isHouseholder: residents.isHouseholder,
//       userId: residents.userId,
//     };
//     return data;
//   }
//   async deleteResidentById(userId: number, residentId: number) {
//     if (!residentId) {
//       throw new AppError('입주민 정보가 없습니다.', 400);
//     }
//     return await residentsAuthRepository.deleteResidentById(userId, residentId);
//   }
// }

// export default new ResidentsAuthService();
