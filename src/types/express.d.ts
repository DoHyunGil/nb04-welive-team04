// src/types/express.d.ts
declare global {
  namespace Express {
    interface User {
      id: number;
      email?: string;
      role: string;
      username?: string;
      contact?: string;
      name?: string;
      avatar?: string | null;
      joinStatus?: string;
      isActive?: boolean;
      createdAt?: Date;
      updatedAt?: Date;
      adminOf?: any;
      resident?: any;
    }
  }
}

export {};
