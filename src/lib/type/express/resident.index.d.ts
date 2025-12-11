export interface GetResidentsQuery {
  page?: number;
  limit?: number;
  searchKeyword?: string;
  building?: number;
  unit?: number;
  isHouseholder?: boolean;
  isRegistered?: boolean;
}
export type GetResidentsAuthQuery = GetResidentsQuery & {
  joinStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
};

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

declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      email: string;
      role: 'ADMIN' | 'RESIDENT';
      apartmentId: number;
      residentId?: number | null;
    }
    interface Request {
      user?: User;
    }
  }
}
