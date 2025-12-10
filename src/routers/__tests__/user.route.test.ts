/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
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

/**
 * Jest 모킹 패턴 설명 (https://inpa.tistory.com 참고)
 *
 * jest.fn() - 개별 함수 모킹
 * - mockResolvedValue(): 비동기 성공 반환값 설정
 * - mockRejectedValue(): 비동기 에러 설정
 * - toHaveBeenCalledWith(): 인자 검증
 * - toHaveBeenCalledTimes(): 호출 횟수 검증
 * - not.toHaveBeenCalled(): 호출되지 않음 검증
 */

// jest.fn()을 사용한 서비스 모킹
// 제네릭 타입에 (인자타입) => 반환타입 형태로 정의
const mockAdminService = {
  superAdminRegister: jest.fn<(data: any) => Promise<any>>(),
  adminRegister: jest.fn<(data: any) => Promise<any>>(),
  findAdmins: jest.fn<(params: any) => Promise<any>>(),
  updateManyJoinStatus: jest.fn<(joinStatus: string) => Promise<number>>(),
  updateJoinStatusById:
    jest.fn<(id: number, joinStatus: string) => Promise<any>>(),
  updateAdmin: jest.fn<(id: number, data: any) => Promise<any>>(),
  deleteAdmin: jest.fn<(id: number) => Promise<any>>(),
  deleteRejectedAdmins: jest.fn<() => Promise<number>>(),
};

// JWT 인증 미들웨어 모킹
const mockJwtAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: '인증이 필요합니다.' });
  }
  req.user = { id: 1 };
  next();
};

// 컨트롤러 모킹 - 실제 컨트롤러 로직을 모킹된 서비스로 대체
const mockAdminController = {
  superAdminsRegister: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      await mockAdminService.superAdminRegister(req.body);
      res.status(204).json({});
    } catch (error: any) {
      next(error);
    }
  },
  adminsRegister: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await mockAdminService.adminRegister(req.body);
      res.status(204).json({});
    } catch (error: any) {
      next(error);
    }
  },
  getAdmins: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const pageNumber = Number(req.query.page) || 1;
      const limitNumber = Number(req.query.limit) || 20;
      const searchKeyword = req.query.searchKeyword?.toString();
      const joinStatusString = req.query.joinStatus?.toString();
      const skipCount = (pageNumber - 1) * limitNumber;

      const result = await mockAdminService.findAdmins({
        searchKeyword,
        joinStatusString,
        skip: skipCount,
        limit: limitNumber,
      });
      res.status(200).json(result);
    } catch (error: any) {
      next(error);
    }
  },
  updateManyJoinStatus: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const updatedCount = await mockAdminService.updateManyJoinStatus(
        req.body.joinStatus,
      );
      res.json({ updatedCount, joinStatus: req.body.joinStatus });
    } catch (error: any) {
      next(error);
    }
  },
  updateJoinStatusById: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const adminId = Number(req.params.id);
      await mockAdminService.updateJoinStatusById(adminId, req.body.joinStatus);
      res.status(204).json({});
    } catch (error: any) {
      next(error);
    }
  },
  updateAdmin: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adminId = Number(req.params.id);
      await mockAdminService.updateAdmin(adminId, req.body);
      res.status(204).json({});
    } catch (error: any) {
      next(error);
    }
  },
  deleteAdmin: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adminId = Number(req.params.id);
      await mockAdminService.deleteAdmin(adminId);
      res.status(204).json({});
    } catch (error: any) {
      next(error);
    }
  },
  deleteRejectedAdmins: async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      await mockAdminService.deleteRejectedAdmins();
      res.status(204).json({});
    } catch (error: any) {
      next(error);
    }
  },
};

describe('User Admin Routes', () => {
  let app: express.Application;
  const superAdminToken = 'test-super-admin-token';

  beforeAll(() => {
    // Express 앱 설정
    app = express();
    app.use(express.json());

    // super-admins 라우터
    const superAdminRouter = express.Router();
    superAdminRouter.post('/', mockAdminController.superAdminsRegister);

    // admins 라우터
    const adminRouter = express.Router();
    adminRouter.post('/', mockAdminController.adminsRegister);
    adminRouter.get('/', mockJwtAuth, mockAdminController.getAdmins);
    adminRouter.patch(
      '/join-status',
      mockJwtAuth,
      mockAdminController.updateManyJoinStatus,
    );
    adminRouter.patch(
      '/:id/join-status',
      mockJwtAuth,
      mockAdminController.updateJoinStatusById,
    );
    adminRouter.patch('/:id', mockJwtAuth, mockAdminController.updateAdmin);
    adminRouter.delete(
      '/rejected',
      mockJwtAuth,
      mockAdminController.deleteRejectedAdmins,
    );
    adminRouter.delete('/:id', mockJwtAuth, mockAdminController.deleteAdmin);

    app.use('/api/v2/users/super-admins', superAdminRouter);
    app.use('/api/v2/users/admins', adminRouter);

    // 에러 핸들러
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      res.status(err.status || 500).json({ message: err.message });
    });
  });

  // 각 테스트 전에 mock 초기화
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v2/users/super-admins', () => {
    it('슈퍼 관리자 계정 생성 성공', async () => {
      // Given: 슈퍼 관리자 생성 성공 응답 설정
      mockAdminService.superAdminRegister.mockResolvedValue({
        id: 2,
        username: 'newadmin',
      });

      const requestBody = {
        username: 'newadmin',
        email: 'newadmin@example.com',
        contact: '010-1111-1111',
        name: '새관리자',
        password: 'password123',
      };

      // When: 슈퍼 관리자 생성 요청
      const response = await request(app)
        .post('/api/v2/users/super-admins')
        .send(requestBody);

      // Then: 응답 검증
      expect(response.status).toBe(204);

      // 서비스가 올바른 인자로 호출되었는지 검증
      expect(mockAdminService.superAdminRegister).toHaveBeenCalledTimes(1);
      expect(mockAdminService.superAdminRegister).toHaveBeenCalledWith(
        requestBody,
      );
    });

    it('중복된 username으로 계정 생성 실패', async () => {
      // Given: 중복 에러 설정
      const error = new Error('이미 존재하는 아이디입니다.') as any;
      error.status = 409;
      mockAdminService.superAdminRegister.mockRejectedValue(error);

      // When: 중복 username으로 요청
      const response = await request(app)
        .post('/api/v2/users/super-admins')
        .send({
          username: 'superadmin',
          email: 'duplicate@example.com',
          contact: '010-2222-2222',
          name: '중복',
          password: 'password123',
        });

      // Then: 409 에러 응답 검증
      expect(response.status).toBe(409);
      expect(mockAdminService.superAdminRegister).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /api/v2/users/admins', () => {
    it('관리자 계정 생성 성공', async () => {
      // Given: 관리자 생성 성공 응답 설정
      mockAdminService.adminRegister.mockResolvedValue({
        id: 3,
        username: 'testadmin',
      });

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

      // When: 관리자 생성 요청
      const response = await request(app)
        .post('/api/v2/users/admins')
        .send(requestBody);

      // Then: 응답 검증
      expect(response.status).toBe(204);
      expect(mockAdminService.adminRegister).toHaveBeenCalledTimes(1);
      expect(mockAdminService.adminRegister).toHaveBeenCalledWith(requestBody);
    });
  });

  describe('GET /api/v2/users/admins', () => {
    it('관리자 목록 조회 성공 (슈퍼 관리자)', async () => {
      // Given: 관리자 목록 조회 성공 응답 설정
      const mockResult = {
        data: [{ id: 3, username: 'testadmin' }],
        totalCount: 1,
        page: 1,
        limit: 20,
        hasNext: false,
      };
      mockAdminService.findAdmins.mockResolvedValue(mockResult);

      // When: 관리자 목록 조회 요청
      const response = await request(app)
        .get('/api/v2/users/admins')
        .set('Authorization', `Bearer ${superAdminToken}`);

      // Then: 응답 검증
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('totalCount');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');

      // 서비스 호출 검증
      expect(mockAdminService.findAdmins).toHaveBeenCalledTimes(1);
      expect(mockAdminService.findAdmins).toHaveBeenCalledWith({
        searchKeyword: undefined,
        joinStatusString: undefined,
        skip: 0,
        limit: 20,
      });
    });

    it('인증 없이 관리자 목록 조회 실패', async () => {
      // When: 인증 헤더 없이 요청
      const response = await request(app).get('/api/v2/users/admins');

      // Then: 401 에러 응답 검증
      expect(response.status).toBe(401);
      // 인증 실패로 서비스가 호출되지 않아야 함
      expect(mockAdminService.findAdmins).not.toHaveBeenCalled();
    });

    it('검색 키워드로 관리자 필터링', async () => {
      // Given: 빈 결과 응답 설정
      mockAdminService.findAdmins.mockResolvedValue({
        data: [],
        totalCount: 0,
        page: 1,
        limit: 20,
        hasNext: false,
      });

      // When: 검색 키워드와 함께 요청
      const response = await request(app)
        .get('/api/v2/users/admins?searchKeyword=테스트')
        .set('Authorization', `Bearer ${superAdminToken}`);

      // Then: 응답 검증
      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();

      // 서비스가 검색 키워드와 함께 호출되었는지 검증
      expect(mockAdminService.findAdmins).toHaveBeenCalledWith({
        searchKeyword: '테스트',
        joinStatusString: undefined,
        skip: 0,
        limit: 20,
      });
    });

    it('페이지네이션 동작 확인', async () => {
      // Given: 페이지네이션 결과 응답 설정
      mockAdminService.findAdmins.mockResolvedValue({
        data: [],
        totalCount: 0,
        page: 2,
        limit: 10,
        hasNext: false,
      });

      // When: 페이지네이션 파라미터와 함께 요청
      const response = await request(app)
        .get('/api/v2/users/admins?page=2&limit=10')
        .set('Authorization', `Bearer ${superAdminToken}`);

      // Then: 응답 검증
      expect(response.status).toBe(200);

      // 서비스가 올바른 skip, limit으로 호출되었는지 검증
      expect(mockAdminService.findAdmins).toHaveBeenCalledWith({
        searchKeyword: undefined,
        joinStatusString: undefined,
        skip: 10, // (2-1) * 10 = 10
        limit: 10,
      });
    });
  });

  describe('PATCH /api/v2/users/admins/:id/join-status', () => {
    it('관리자 가입 상태 변경 성공', async () => {
      // Given: 가입 상태 변경 성공 응답 설정
      mockAdminService.updateJoinStatusById.mockResolvedValue({
        id: 3,
        joinStatus: 'APPROVED',
      });

      // When: 가입 상태 변경 요청
      const response = await request(app)
        .patch('/api/v2/users/admins/3/join-status')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ joinStatus: 'APPROVED' });

      // Then: 응답 검증
      expect(response.status).toBe(204);

      // 서비스가 올바른 인자로 호출되었는지 검증
      expect(mockAdminService.updateJoinStatusById).toHaveBeenCalledTimes(1);
      expect(mockAdminService.updateJoinStatusById).toHaveBeenCalledWith(
        3,
        'APPROVED',
      );
    });
  });

  describe('PATCH /api/v2/users/admins/:id', () => {
    it('관리자 정보 수정 성공', async () => {
      // Given: 관리자 수정 성공 응답 설정
      mockAdminService.updateAdmin.mockResolvedValue({
        id: 3,
        email: 'updated@example.com',
      });

      const updateData = {
        email: 'updated@example.com',
        contact: '010-9999-9999',
      };

      // When: 관리자 정보 수정 요청
      const response = await request(app)
        .patch('/api/v2/users/admins/3')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(updateData);

      // Then: 응답 검증
      expect(response.status).toBe(204);
      expect(mockAdminService.updateAdmin).toHaveBeenCalledTimes(1);
      expect(mockAdminService.updateAdmin).toHaveBeenCalledWith(3, updateData);
    });
  });

  describe('DELETE /api/v2/users/admins/:id', () => {
    it('관리자 삭제 성공', async () => {
      // Given: 관리자 삭제 성공 응답 설정
      mockAdminService.deleteAdmin.mockResolvedValue({
        id: 3,
        username: 'testadmin',
      });

      // When: 관리자 삭제 요청
      const response = await request(app)
        .delete('/api/v2/users/admins/3')
        .set('Authorization', `Bearer ${superAdminToken}`);

      // Then: 응답 검증
      expect(response.status).toBe(204);
      expect(mockAdminService.deleteAdmin).toHaveBeenCalledTimes(1);
      expect(mockAdminService.deleteAdmin).toHaveBeenCalledWith(3);
    });

    it('입주민이 있는 관리자 삭제 실패', async () => {
      // Given: 삭제 불가 에러 설정
      const error = new Error(
        '입주민이 등록된 관리자는 삭제할 수 없습니다.',
      ) as any;
      error.status = 400;
      mockAdminService.deleteAdmin.mockRejectedValue(error);

      // When: 관리자 삭제 요청
      const response = await request(app)
        .delete('/api/v2/users/admins/3')
        .set('Authorization', `Bearer ${superAdminToken}`);

      // Then: 400 에러 응답 검증
      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/v2/users/admins/rejected', () => {
    it('거절된 관리자 일괄 삭제 성공', async () => {
      // Given: 일괄 삭제 성공 응답 설정
      mockAdminService.deleteRejectedAdmins.mockResolvedValue(5);

      // When: 거절된 관리자 일괄 삭제 요청
      const response = await request(app)
        .delete('/api/v2/users/admins/rejected')
        .set('Authorization', `Bearer ${superAdminToken}`);

      // Then: 응답 검증
      expect(response.status).toBe(204);
      expect(mockAdminService.deleteRejectedAdmins).toHaveBeenCalledTimes(1);
    });
  });

  describe('PATCH /api/v2/users/admins/join-status', () => {
    it('여러 관리자 가입 상태 일괄 변경 성공', async () => {
      // Given: 일괄 변경 성공 응답 설정
      mockAdminService.updateManyJoinStatus.mockResolvedValue(10);

      // When: 일괄 상태 변경 요청
      const response = await request(app)
        .patch('/api/v2/users/admins/join-status')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ joinStatus: 'APPROVED' });

      // Then: 응답 검증
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('updatedCount', 10);
      expect(response.body).toHaveProperty('joinStatus', 'APPROVED');

      // 서비스 호출 검증
      expect(mockAdminService.updateManyJoinStatus).toHaveBeenCalledTimes(1);
      expect(mockAdminService.updateManyJoinStatus).toHaveBeenCalledWith(
        'APPROVED',
      );
    });
  });
});
