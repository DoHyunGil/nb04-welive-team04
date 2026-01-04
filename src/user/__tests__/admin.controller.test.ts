import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';

// Mock admin service
const mockAdminService = {
  superAdminRegister: jest.fn<(...args: unknown[]) => Promise<void>>(),
  adminRegister: jest.fn<(...args: unknown[]) => Promise<void>>(),
  findAdmins: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  updateManyJoinStatus: jest.fn<(...args: unknown[]) => Promise<number>>(),
  updateJoinStatusById: jest.fn<(...args: unknown[]) => Promise<void>>(),
  updateAdmin: jest.fn<(...args: unknown[]) => Promise<void>>(),
  deleteAdmin: jest.fn<(...args: unknown[]) => Promise<void>>(),
  deleteRejectedAdmins: jest.fn<(...args: unknown[]) => Promise<number>>(),
};

jest.unstable_mockModule('../services/admin.service.js', () => ({
  __esModule: true,
  default: mockAdminService,
}));

const { default: adminController } = await import(
  '../controllers/admin.controller.js'
);

const createMockRequest = (
  overrides: Partial<Request> = {},
): Partial<Request> => ({
  body: {},
  params: {},
  query: {},
  ...overrides,
});

const createMockResponse = () => {
  const statusMock = jest.fn();
  const jsonMock = jest.fn();
  statusMock.mockReturnValue({
    json: jsonMock,
  });
  return {
    status: statusMock,
    json: jsonMock,
    statusMock,
    jsonMock,
  };
};

const mockNext = jest.fn() as NextFunction;

describe('AdminController Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('superAdminsRegister', () => {
    it('슈퍼 관리자 등록 성공 시 204 응답을 반환한다', async () => {
      mockAdminService.superAdminRegister.mockResolvedValue();

      const req = createMockRequest({
        body: {
          username: 'superadmin',
          password: 'password123',
          email: 'super@example.com',
        },
      });
      const { status, json, statusMock, jsonMock } = createMockResponse();
      const res = { status, json } as unknown as Response;

      await adminController.superAdminsRegister(req as Request, res, mockNext);

      expect(mockAdminService.superAdminRegister).toHaveBeenCalledWith(
        req.body,
      );
      expect(statusMock).toHaveBeenCalledWith(204);
      expect(jsonMock).toHaveBeenCalledWith({});
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('등록 실패 시 에러를 next로 전달한다', async () => {
      const error = new Error('Registration failed');
      mockAdminService.superAdminRegister.mockRejectedValue(error);

      const req = createMockRequest({ body: {} });
      const { status, json } = createMockResponse();
      const res = { status, json } as unknown as Response;

      await adminController.superAdminsRegister(req as Request, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('adminsRegister', () => {
    it('일반 관리자 등록 성공 시 204 응답을 반환한다', async () => {
      mockAdminService.adminRegister.mockResolvedValue();

      const req = createMockRequest({
        body: {
          username: 'admin',
          password: 'password123',
          adminOf: { name: 'Apartment A' },
        },
      });
      const { status, json, statusMock, jsonMock } = createMockResponse();
      const res = { status, json } as unknown as Response;

      await adminController.adminsRegister(req as Request, res, mockNext);

      expect(mockAdminService.adminRegister).toHaveBeenCalledWith(req.body);
      expect(statusMock).toHaveBeenCalledWith(204);
      expect(jsonMock).toHaveBeenCalledWith({});
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('getAdmins', () => {
    it('관리자 목록 조회 성공 시 200 응답과 데이터를 반환한다', async () => {
      const mockResult = {
        data: [{ id: '1', username: 'admin1' }],
        totalCount: 1,
        page: 1,
        limit: 20,
      };

      mockAdminService.findAdmins.mockResolvedValue(mockResult);

      const req = createMockRequest({
        query: { page: '1', limit: '20', searchKeyword: 'admin' },
      });
      const { status, json, statusMock, jsonMock } = createMockResponse();
      const res = { status, json } as unknown as Response;

      await adminController.getAdmins(req as Request, res, mockNext);

      expect(mockAdminService.findAdmins).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        searchKeyword: 'admin',
        joinStatusString: undefined,
      });
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockResult);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('기본값을 사용하여 조회한다', async () => {
      const mockResult = { data: [], totalCount: 0, page: 1, limit: 20 };
      mockAdminService.findAdmins.mockResolvedValue(mockResult);

      const req = createMockRequest({ query: {} });
      const { status, json } = createMockResponse();
      const res = { status, json } as unknown as Response;

      await adminController.getAdmins(req as Request, res, mockNext);

      expect(mockAdminService.findAdmins).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        searchKeyword: undefined,
        joinStatusString: undefined,
      });
    });
  });

  describe('updateJoinStatusById', () => {
    it('가입 상태 변경 성공 시 204 응답을 반환한다', async () => {
      mockAdminService.updateJoinStatusById.mockResolvedValue();

      const req = createMockRequest({
        params: { id: '1' },
        body: { joinStatus: 'APPROVED' },
      });
      const { status, json, statusMock, jsonMock } = createMockResponse();
      const res = { status, json } as unknown as Response;

      await adminController.updateJoinStatusById(req as Request, res, mockNext);

      expect(mockAdminService.updateJoinStatusById).toHaveBeenCalledWith({
        id: 1,
        joinStatus: 'APPROVED',
      });
      expect(statusMock).toHaveBeenCalledWith(204);
      expect(jsonMock).toHaveBeenCalledWith({});
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('updateAdmin', () => {
    it('관리자 정보 수정 성공 시 204 응답을 반환한다', async () => {
      mockAdminService.updateAdmin.mockResolvedValue();

      const req = createMockRequest({
        params: { id: '1' },
        body: { email: 'newemail@example.com', contact: '010-1234-5678' },
      });
      const { status, json, statusMock, jsonMock } = createMockResponse();
      const res = { status, json } as unknown as Response;

      await adminController.updateAdmin(req as Request, res, mockNext);

      expect(mockAdminService.updateAdmin).toHaveBeenCalledWith({
        id: 1,
        email: 'newemail@example.com',
        contact: '010-1234-5678',
      });
      expect(statusMock).toHaveBeenCalledWith(204);
      expect(jsonMock).toHaveBeenCalledWith({});
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('deleteAdmin', () => {
    it('관리자 삭제 성공 시 204 응답을 반환한다', async () => {
      mockAdminService.deleteAdmin.mockResolvedValue();

      const req = createMockRequest({
        params: { id: '1' },
      });
      const { status, json, statusMock, jsonMock } = createMockResponse();
      const res = { status, json } as unknown as Response;

      await adminController.deleteAdmin(req as Request, res, mockNext);

      expect(mockAdminService.deleteAdmin).toHaveBeenCalledWith({ id: 1 });
      expect(statusMock).toHaveBeenCalledWith(204);
      expect(jsonMock).toHaveBeenCalledWith({});
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('삭제 실패 시 에러를 next로 전달한다', async () => {
      const error = new Error('Delete failed');
      mockAdminService.deleteAdmin.mockRejectedValue(error);

      const req = createMockRequest({ params: { id: '1' } });
      const { status, json } = createMockResponse();
      const res = { status, json } as unknown as Response;

      await adminController.deleteAdmin(req as Request, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
