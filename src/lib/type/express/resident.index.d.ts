import type { ParsedQs } from 'qs';

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

export class GetResidentsDto {
  page: number = 1;
  limit: number = 10;
  searchKeyword?: string;
  joinStatus?: string;
  building?: number;
  unit?: number;
  isHouseholder?: boolean;
  isRegistered?: boolean;

  // constructor(query: ParsedQs) {
  //   this.page = query.page ? Number(query.page) : 1;
  //   this.limit = query.limit ? Number(query.limit) : 10;
  //   this.searchKeyword =
  //     typeof query.searchKeyword === 'string' ? query.searchKeyword : undefined;
  //   this.joinStatus =
  //     typeof query.joinStatus === 'string' ? query.joinStatus : undefined;
  //   this.building =
  //     typeof query.building === 'string' ? Number(query.building) : undefined;
  //   this.unit = typeof query.unit === 'string' ? Number(query.unit) : undefined;
  //   this.isHouseholder =
  //     query.isHouseholder === 'true'
  //       ? true
  //       : query.isHouseholder === 'false'
  //         ? false
  //         : undefined;
  //   this.isRegistered =
  //     query.isRegistered === 'true'
  //       ? true
  //       : query.isRegistered === 'false'
  //         ? false
  //         : undefined;
  // }
}

export class GetResidentsAuthDto {
  page: number = 1;
  limit: number = 10;
  searchKeyword?: string;
  joinStatus?: string;
  building?: number;
  unit?: number;

  // constructor(query: ParsedQs) {
  //   this.page = query.page ? Number(query.page) : 1;
  //   this.limit = query.limit ? Number(query.limit) : 10;
  //   this.searchKeyword =
  //     typeof query.searchKeyword === 'string' ? query.searchKeyword : undefined;
  //   this.joinStatus =
  //     typeof query.joinStatus === 'string' ? query.joinStatus : undefined;
  //   this.building =
  //     typeof query.building === 'string' ? Number(query.building) : undefined;
  //   this.unit = typeof query.unit === 'string' ? Number(query.unit) : undefined;
  // }
}

export interface CreateResidentBody {
  userId?: number | null;
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
