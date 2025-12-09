import request from 'supertest';
import app from '../../main.js';
import { prisma } from '../../lib/prisma.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import jwt from 'jsonwebtoken';

describe('User Admin Routes', () => {
  let superAdminToken: string;
  let superAdminUser: any;
  let testAdmin: any;

  beforeAll(async () => {
    // 슈퍼 관리자 생성
    const hashedPassword = await authMiddleware.hashPassword('superpassword');
    superAdminUser = await prisma.user.create({
      data: {
        username: 'superadmin',
        email: 'super@example.com',
        contact: '010-0000-0000',
        name: '슈퍼관리자',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        avatar: '',
        joinStatus: 'APPROVED',
        isActive: true,
      },
    });

    // 슈퍼 관리자 토큰 생성
    superAdminToken = jwt.sign(
      { id: superAdminUser.id },
      process.env.JWT_ACCESS_SECRET || '',
      { expiresIn: '15m' },
    );
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    await prisma.adminOf.deleteMany({
      where: {
        user: {
          username: {
            in: ['superadmin', 'testadmin', 'newadmin'],
          },
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        username: {
          in: ['superadmin', 'testadmin', 'newadmin'],
        },
      },
    });
    await prisma.$disconnect();
  });

  describe('POST /users/admins/super-admins', () => {
    it('슈퍼 관리자 계정 생성 성공', async () => {
      const response = await request(app)
        .post('/users/admins/super-admins')
        .send({
          username: 'newadmin',
          email: 'newadmin@example.com',
          contact: '010-1111-1111',
          name: '새관리자',
          password: 'password123',
        });

      expect(response.status).toBe(204);
    });

    it('중복된 username으로 계정 생성 실패', async () => {
      const response = await request(app)
        .post('/users/admins/super-admins')
        .send({
          username: 'superadmin',
          email: 'duplicate@example.com',
          contact: '010-2222-2222',
          name: '중복',
          password: 'password123',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /users/admins', () => {
    it('관리자 계정 생성 성공', async () => {
      const response = await request(app)
        .post('/users/admins')
        .send({
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
        });

      expect(response.status).toBe(204);
    });
  });

  describe('GET /users/admins', () => {
    beforeEach(async () => {
      // 테스트용 관리자 생성 (이미 없을 경우)
      const existing = await prisma.user.findFirst({
        where: { username: 'testadmin' },
      });

      if (!existing) {
        const hashedPassword = await authMiddleware.hashPassword('password123');
        testAdmin = await prisma.user.create({
          data: {
            username: 'testadmin',
            email: 'testadmin@example.com',
            contact: '010-3333-3333',
            name: '테스트관리자',
            password: hashedPassword,
            role: 'ADMIN',
            avatar: '',
            joinStatus: 'PENDING',
            isActive: true,
          },
        });

        await prisma.adminOf.create({
          data: {
            userId: testAdmin.id,
            name: '테스트아파트',
            address: '서울시 강남구',
            description: '테스트용 아파트',
            officeNumber: '02-1234-5678',
            buildingNumberFrom: 101,
            buildingNumberTo: 105,
            floorCountPerBuilding: 20,
            unitCountPerFloor: 4,
          },
        });
      }
    });

    it('관리자 목록 조회 성공 (슈퍼 관리자)', async () => {
      const response = await request(app)
        .get('/users/admins')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('totalCount');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
    });

    it('인증 없이 관리자 목록 조회 실패', async () => {
      const response = await request(app).get('/users/admins');

      expect(response.status).toBe(401);
    });

    it('검색 키워드로 관리자 필터링', async () => {
      const response = await request(app)
        .get('/users/admins?searchKeyword=테스트')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
    });

    it('페이지네이션 동작 확인', async () => {
      const response = await request(app)
        .get('/users/admins?page=1&limit=10')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(10);
    });
  });

  describe('PATCH /users/admins/:id/join-status', () => {
    it('관리자 가입 상태 변경 성공', async () => {
      const admin = await prisma.user.findFirst({
        where: { username: 'testadmin' },
      });

      if (admin) {
        const response = await request(app)
          .patch(`/users/admins/${admin.id}/join-status`)
          .set('Authorization', `Bearer ${superAdminToken}`)
          .send({ joinStatus: 'APPROVED' });

        expect(response.status).toBe(204);
      }
    });
  });

  describe('PATCH /users/admins/:id', () => {
    it('관리자 정보 수정 성공', async () => {
      const admin = await prisma.user.findFirst({
        where: { username: 'testadmin' },
      });

      if (admin) {
        const response = await request(app)
          .patch(`/users/admins/${admin.id}`)
          .set('Authorization', `Bearer ${superAdminToken}`)
          .send({
            email: 'updated@example.com',
            contact: '010-9999-9999',
          });

        expect(response.status).toBe(204);
      }
    });
  });

  describe('DELETE /users/admins/:id', () => {
    it('관리자 삭제 성공', async () => {
      const admin = await prisma.user.findFirst({
        where: { username: 'testadmin' },
      });

      if (admin) {
        const response = await request(app)
          .delete(`/users/admins/${admin.id}`)
          .set('Authorization', `Bearer ${superAdminToken}`);

        expect(response.status).toBe(204);
      }
    });
  });
});
