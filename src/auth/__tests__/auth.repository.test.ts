import { beforeEach, afterEach, describe, expect, it } from '@jest/globals';
import { prisma } from '../../lib/prisma.js';
import authRepository from '../repositories/auth.repository.js';
import { Role, joinStatus } from '../../../generated/prisma/client.js';

describe('AuthRepository DB Tests', () => {
  let testUserId: number;

  beforeEach(async () => {
    // 테스트 사용자 생성
    const testUser = await prisma.user.create({
      data: {
        username: 'authtest',
        email: 'authtest@example.com',
        password: 'hashed-password',
        name: 'Auth Test User',
        contact: '010-1234-5678',
        role: Role.USER,
        joinStatus: joinStatus.APPROVED,
        isActive: true,
        avatar: '',
      },
    });
    testUserId = testUser.id;
  });

  afterEach(async () => {
    // 테스트 데이터 정리
    await prisma.user.deleteMany({
      where: {
        OR: [{ username: 'authtest' }, { email: 'authtest@example.com' }],
      },
    });
  });

  describe('findByUserName', () => {
    it('사용자명으로 사용자를 찾는다', async () => {
      const user = await authRepository.findByUserName('authtest');

      expect(user).not.toBeNull();
      expect(user?.username).toBe('authtest');
      expect(user?.email).toBe('authtest@example.com');
      expect(user?.id).toBe(testUserId);
    });

    it('존재하지 않는 사용자명으로 조회 시 null을 반환한다', async () => {
      const user = await authRepository.findByUserName('nonexistent');

      expect(user).toBeNull();
    });

    it('adminOf 관계를 포함해서 조회한다', async () => {
      // adminOf가 있는 관리자 생성
      const admin = await prisma.user.create({
        data: {
          username: 'admintest',
          email: 'admintest@example.com',
          password: 'hashed-password',
          name: 'Admin Test',
          contact: '010-9999-9999',
          role: Role.ADMIN,
          joinStatus: joinStatus.APPROVED,
          isActive: true,
          avatar: '',
        },
      });

      const adminOf = await prisma.adminOf.create({
        data: {
          name: 'Test Apartment',
          address: 'Seoul',
          description: 'Test Description',
          officeNumber: '02-1234-5678',
          buildingNumberFrom: 101,
          buildingNumberTo: 105,
          floorCountPerBuilding: 10,
          unitCountPerFloor: 4,
          userId: admin.id,
        },
      });

      const foundAdmin = await authRepository.findByUserName('admintest');

      expect(foundAdmin).not.toBeNull();
      expect(foundAdmin?.adminOf).not.toBeNull();
      expect(foundAdmin?.adminOf?.name).toBe('Test Apartment');
      expect(foundAdmin?.adminOf?.id).toBe(adminOf.id);

      // 정리
      await prisma.adminOf.delete({ where: { id: adminOf.id } });
      await prisma.user.delete({ where: { id: admin.id } });
    });

    it('resident 관계를 포함해서 조회한다', async () => {
      const user = await authRepository.findByUserName('authtest');

      expect(user).not.toBeNull();
      expect(user?.resident).toBeNull(); // 일반 사용자는 resident가 없음
    });
  });
});
