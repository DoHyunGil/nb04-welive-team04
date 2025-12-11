export interface GetResidentsQuery {
  page?: number;
  limit?: number;
  searchKeyword?: string;
  building?: number;
  unit?: number;
  isHouseholder?: boolean;
  isRegistered?: boolean;
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

export interface CreateResidentAuthBody {
  userId: number;
  username: string;
  name: string;
  contact: string;
  email: string;
  building: number;
  unit: number;
  isHouseholder: boolean;
  apartmentName: string;
  password: string;
  residentId: number;
  role: 'RESIDENT' | 'ADMIN';
  joinStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  avatar?: string;
  isActive?: boolean;
}

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
