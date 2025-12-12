// 관리자 목록 조회 DTO
export interface GetAdminsDto {
  page: number;
  limit: number;
  searchKeyword?: string;
  joinStatusString?: string;
}

// 가입 상태 업데이트 DTO
export interface UpdateJoinStatusDto {
  joinStatus: string;
}

// 관리자 ID와 가입 상태 업데이트 DTO
export interface UpdateJoinStatusByIdDto {
  id: number;
  joinStatus: string;
}

// 관리자 정보 업데이트 DTO
export interface UpdateAdminDto {
  id: number;
  email?: string;
  contact?: string;
  name?: string;
  adminOf?: {
    name?: string;
    address?: string;
    description?: string;
    officeNumber?: string;
  };
}

// 관리자 삭제 DTO
export interface DeleteAdminDto {
  id: number;
}
