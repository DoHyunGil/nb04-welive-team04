import { joinStatus } from '../../../generated/prisma/client.js';

// export interface GetResidentsQuery {
//   page?: number;
//   limit?: number;
//   searchKeyword?: string;
//   building?: number;
//   unit?: number;
//   isHouseholder?: boolean;
//   isRegistered?: boolean;
// }
// export type GetResidentsAuthQuery = GetResidentsQuery & {
//   joinStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
// };

export interface GetResidentsDto {
  page?: number;
  limit?: number;
  searchKeyword?: string;
  joinStatus?: joinStatus;
  building?: number;
  unit?: number;
  isHouseholder?: string;
  isRegistered?: string;
}

export interface GetResidentsAuthDto {
  page?: number;
  limit?: number;
  searchKeyword?: string;
  joinStatus?: joinStatus;
  building?: number;
  unit?: number;
}

export interface CreateResidentBody {
  userId?: number;
  name: string;
  contact: string;
  email: string;
  building: number;
  unit: number;
  isHouseholder: boolean;
  apartmentId: number;
}

export type CreateResidentAuthBody = CreateResidentBody & {
  userId: number;
  username: string;
  apartmentName: string;
  password: string;
  role: 'RESIDENT' | 'ADMIN' | 'SUPER_ADMIN';
  joinStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  avatar?: string;
  isActive?: boolean;
};

export {};
