// src/notification/constants/notification.constants.ts

export enum NotificationType {
  ADMIN_SIGNUP_REQUEST = 'ADMIN_SIGNUP_REQUEST',

  RESIDENT_SIGNUP_REQUEST = 'RESIDENT_SIGNUP_REQUEST',
  NEW_COMPLAINT = 'NEW_COMPLAINT',

  COMPLAINT_STATUS_CHANGED = 'COMPLAINT_STATUS_CHANGED',
  NEW_ANNOUNCEMENT = 'NEW_ANNOUNCEMENT',
}

export const NotificationMessages = {
  [NotificationType.ADMIN_SIGNUP_REQUEST]: (name: string) =>
    `새로운 관리자 회원가입 신청이 있습니다. (${name})`,

  [NotificationType.RESIDENT_SIGNUP_REQUEST]: (
    name: string,
    dong: string,
    ho: string,
  ) => `새로운 입주민 회원가입 신청이 있습니다. (${dong}동 ${ho}호 - ${name})`,

  [NotificationType.NEW_COMPLAINT]: (dong: string, ho: string, title: string) =>
    `새로운 민원이 등록되었습니다. (${dong}동 ${ho}호 - ${title})`,

  [NotificationType.COMPLAINT_STATUS_CHANGED]: (
    title: string,
    status: string,
  ) => `민원 상태가 변경되었습니다. (${title} - ${status})`,

  [NotificationType.NEW_ANNOUNCEMENT]: (title: string) =>
    `새로운 공지사항이 등록되었습니다. (${title})`,
} as const;

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export const ComplaintStatusLabel = {
  PENDING: '접수대기',
  IN_PROGRESS: '처리중',
  RESOLVED: '처리완료',
  REJECTED: '반려',
} as const;
