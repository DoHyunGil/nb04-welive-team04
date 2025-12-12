/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  jest,
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
} from '@jest/globals';
import request from 'supertest';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import adminController from '../controllers/admin.controller.js';

jest.mock('../services/admin.service.js', () => ({
  default: {
    superAdminRegister: jest.fn(),
    adminRegister: jest.fn(),
    findAdmins: jest.fn(),
    updateManyJoinStatus: jest.fn(),
    updateJoinStatusById: jest.fn(),
    updateAdmin: jest.fn(),
    deleteAdmin: jest.fn(),
    deleteRejectedAdmins: jest.fn(),
  },
}));

// Mock된 서비스를 가져옵니다
import adminService from '../services/admin.service.js';

const mockJwtAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: '인증이 필요합니다.' });
  }
  req.user = { id: 1, role: 'SUPER_ADMIN' };
  next();
};

describe('User Admin Routes', () => {
  let app: express.Application;
  const superAdminToken = 'test-super-admin-token';

  beforeAll(() => {
    app = express();
    app.use(express.json());

    const superAdminRouter = express.Router();
    superAdminRouter.post('/', adminController.superAdminsRegister);

    const adminRouter = express.Router();
    adminRouter.post('/', adminController.adminsRegister);
    adminRouter.get('/', mockJwtAuth, adminController.getAdmins);
    adminRouter.patch(
      '/join-status',
      mockJwtAuth,
      adminController.updateManyJoinStatus,
    );
    adminRouter.patch(
      '/:id/join-status',
      mockJwtAuth,
      adminController.updateJoinStatusById,
    );
    adminRouter.patch('/:id', mockJwtAuth, adminController.updateAdmin);
    adminRouter.delete(
      '/rejected',
      mockJwtAuth,
      adminController.deleteRejectedAdmins,
    );
    adminRouter.delete('/:id', mockJwtAuth, adminController.deleteAdmin);

    app.use('/api/v2/users/super-admins', superAdminRouter);
    app.use('/api/v2/users/admins', adminRouter);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      res.status(err.status || 500).json({ message: err.message });
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v2/users/super-admins', () => {
    it('슈퍼 관리자 계정 생성 성공', async () => {
      (
        adminService.superAdminRegister as jest.MockedFunction<
          typeof adminService.superAdminRegister
        >
      ).mockResolvedValue({
        id: 2,
        username: 'newadmin',
      } as any);

      const requestBody = {
        username: 'newadmin',
        email: 'newadmin@example.com',
        contact: '010-1111-1111',
        name: '새관리자',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/v2/users/super-admins')
        .send(requestBody);

      expect(response.status).toBe(204);
      expect(adminService.superAdminRegister).toHaveBeenCalledTimes(1);
      expect(adminService.superAdminRegister).toHaveBeenCalledWith(requestBody);
    });

    it('중복된 username으로 계정 생성 실패', async () => {
      const error = new Error('이미 존재하는 아이디입니다.') as any;
      error.status = 409;
      (
        adminService.superAdminRegister as jest.MockedFunction<
          typeof adminService.superAdminRegister
        >
      ).mockRejectedValue(error);

      const response = await request(app)
        .post('/api/v2/users/super-admins')
        .send({
          username: 'superadmin',
          email: 'duplicate@example.com',
          contact: '010-2222-2222',
          name: '중복',
          password: 'password123',
        });

      expect(response.status).toBe(409);
      expect(adminService.superAdminRegister).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /api/v2/users/admins', () => {
    it('관리자 계정 생성 성공', async () => {
      (
        adminService.adminRegister as jest.MockedFunction<
          typeof adminService.adminRegister
        >
      ).mockResolvedValue({
        id: 3,
        username: 'testadmin',
      } as any);

      const requestBody = {
        username: 'testadmin',
        email: 'testadmin@example.com',
        contact: '010-3333-3333',
        name: '테스트관리자',
        password: 'password123',
        adminOf: {
          name: '테스트아파트',
          address: '서울시 강남구',
          description: '테스트용 아파트',
          officeNumber: '02-1234-5678',
          buildingNumberFrom: 101,
          buildingNumberTo: 105,
          floorCountPerBuilding: 20,
          unitCountPerFloor: 4,
        },
      };

      const response = await request(app)
        .post('/api/v2/users/admins')
        .send(requestBody);

      expect(response.status).toBe(204);
      expect(adminService.adminRegister).toHaveBeenCalledTimes(1);
      expect(adminService.adminRegister).toHaveBeenCalledWith(requestBody);
    });
  });

  describe('GET /api/v2/users/admins', () => {
    it('관리자 목록 조회 성공 (슈퍼 관리자)', async () => {
      const mockResult = {
        data: [{ id: 3, username: 'testadmin' }],
        totalCount: 1,
        page: 1,
        limit: 20,
        hasNext: false,
      };
      (
        adminService.findAdmins as jest.MockedFunction<
          typeof adminService.findAdmins
        >
      ).mockResolvedValue(mockResult as any);

      const response = await request(app)
        .get('/api/v2/users/admins')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('totalCount');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(adminService.findAdmins).toHaveBeenCalledTimes(1);
      expect(adminService.findAdmins).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        searchKeyword: undefined,
        joinStatusString: undefined,
      });
    });

    it('인증 없이 관리자 목록 조회 실패', async () => {
      const response = await request(app).get('/api/v2/users/admins');

      expect(response.status).toBe(401);
      expect(adminService.findAdmins).not.toHaveBeenCalled();
    });

    it('검색 키워드로 관리자 필터링', async () => {
      (
        adminService.findAdmins as jest.MockedFunction<
          typeof adminService.findAdmins
        >
      ).mockResolvedValue({
        data: [],
        totalCount: 0,
        page: 1,
        limit: 20,
        hasNext: false,
      } as any);

      const response = await request(app)
        .get('/api/v2/users/admins?searchKeyword=테스트')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(adminService.findAdmins).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        searchKeyword: '테스트',
        joinStatusString: undefined,
      });
    });

    it('페이지네이션 동작 확인', async () => {
      (
        adminService.findAdmins as jest.MockedFunction<
          typeof adminService.findAdmins
        >
      ).mockResolvedValue({
        data: [],
        totalCount: 0,
        page: 2,
        limit: 10,
        hasNext: false,
      } as any);

      const response = await request(app)
        .get('/api/v2/users/admins?page=2&limit=10')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(adminService.findAdmins).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        searchKeyword: undefined,
        joinStatusString: undefined,
      });
    });
  });

  describe('PATCH /api/v2/users/admins/:id/join-status', () => {
    it('관리자 가입 상태 변경 성공', async () => {
      (
        adminService.updateJoinStatusById as jest.MockedFunction<
          typeof adminService.updateJoinStatusById
        >
      ).mockResolvedValue({
        id: 3,
        joinStatus: 'APPROVED',
      } as any);

      const response = await request(app)
        .patch('/api/v2/users/admins/3/join-status')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ joinStatus: 'APPROVED' });

      expect(response.status).toBe(204);
      expect(adminService.updateJoinStatusById).toHaveBeenCalledTimes(1);
      expect(adminService.updateJoinStatusById).toHaveBeenCalledWith({
        id: 3,
        joinStatus: 'APPROVED',
      });
    });
  });

  describe('PATCH /api/v2/users/admins/:id', () => {
    it('관리자 정보 수정 성공', async () => {
      (
        adminService.updateAdmin as jest.MockedFunction<
          typeof adminService.updateAdmin
        >
      ).mockResolvedValue({
        id: 3,
        email: 'updated@example.com',
      } as any);

      const updateData = {
        email: 'updated@example.com',
        contact: '010-9999-9999',
      };

      const response = await request(app)
        .patch('/api/v2/users/admins/3')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(updateData);

      expect(response.status).toBe(204);
      expect(adminService.updateAdmin).toHaveBeenCalledTimes(1);
      expect(adminService.updateAdmin).toHaveBeenCalledWith({
        id: 3,
        ...updateData,
      });
    });
  });

  describe('DELETE /api/v2/users/admins/:id', () => {
    it('관리자 삭제 성공', async () => {
      (
        adminService.deleteAdmin as jest.MockedFunction<
          typeof adminService.deleteAdmin
        >
      ).mockResolvedValue({
        id: 3,
        username: 'testadmin',
      } as any);

      const response = await request(app)
        .delete('/api/v2/users/admins/3')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(204);
      expect(adminService.deleteAdmin).toHaveBeenCalledTimes(1);
      expect(adminService.deleteAdmin).toHaveBeenCalledWith({ id: 3 });
    });

    it('입주민이 있는 관리자 삭제 실패', async () => {
      const error = new Error(
        '입주민이 등록된 관리자는 삭제할 수 없습니다.',
      ) as any;
      error.status = 400;
      (
        adminService.deleteAdmin as jest.MockedFunction<
          typeof adminService.deleteAdmin
        >
      ).mockRejectedValue(error);

      const response = await request(app)
        .delete('/api/v2/users/admins/3')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/v2/users/admins/rejected', () => {
    it('거절된 관리자 일괄 삭제 성공', async () => {
      (
        adminService.deleteRejectedAdmins as jest.MockedFunction<
          typeof adminService.deleteRejectedAdmins
        >
      ).mockResolvedValue(5);

      const response = await request(app)
        .delete('/api/v2/users/admins/rejected')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(204);
      expect(adminService.deleteRejectedAdmins).toHaveBeenCalledTimes(1);
    });
  });

  describe('PATCH /api/v2/users/admins/join-status', () => {
    it('여러 관리자 가입 상태 일괄 변경 성공', async () => {
      (
        adminService.updateManyJoinStatus as jest.MockedFunction<
          typeof adminService.updateManyJoinStatus
        >
      ).mockResolvedValue(10);

      const response = await request(app)
        .patch('/api/v2/users/admins/join-status')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ joinStatus: 'APPROVED' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('updatedCount', 10);
      expect(response.body).toHaveProperty('joinStatus', 'APPROVED');
      expect(adminService.updateManyJoinStatus).toHaveBeenCalledTimes(1);
      expect(adminService.updateManyJoinStatus).toHaveBeenCalledWith({
        joinStatus: 'APPROVED',
      });
    });
  });
});
