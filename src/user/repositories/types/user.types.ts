// 비밀번호 변경 요청 타입
export interface UserPasswordUpdateRequest {
  currentPassword: string;
  newPassword: string;
}

// 아바타 업데이트 데이터 타입
export interface UserAvatarUpdateData {
  avatar: string;
}

// 비밀번호 업데이트 데이터 타입
export interface UserPasswordUpdateData {
  password: string;
}
