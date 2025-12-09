import { joinStatus } from '../../../../generated/prisma/client.js';

export interface SuperAdminsInput {
  username: string;
  email: string;
  contact: string;
  name: string;
  password: string;
}

export interface AdminOfInput {
  name: string;
  address: string;
  description?: string;
  officeNumber?: string;
  buildingNumberFrom: number;
  buildingNumberTo: number;
  floorCountPerBuilding: number;
  unitCountPerFloor: number;
}

export interface AdminInput {
  username: string;
  email: string;
  contact: string;
  name: string;
  password: string;
  adminOf: AdminOfInput;
}

export interface FindAdminsParams {
  searchKeyword?: string;
  joinStatusString?: string;
  skip?: number;
  limit?: number;
}

export interface CountAdminsParams {
  searchKeyword?: string;
  joinStatusString?: string;
}

export interface UpdateJoinStatus {
  joinStatus: joinStatus;
}

export interface AdminUpdateInput {
  email?: string;
  contact?: string;
  name?: string;
}

export interface AdminOfUpdateInput {
  name?: string;
  address?: string;
  description?: string;
  officeNumber?: string;
}
