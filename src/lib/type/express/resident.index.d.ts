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

export {};

declare global {
  namespace Express {
    interface User {
      id: number;
    }
    interface Request {
      user?: User;
    }
  }
}
