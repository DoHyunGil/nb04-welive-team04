import { beforeEach, afterEach, describe, expect, it } from '@jest/globals';
import { prisma } from '../../lib/prisma.js';
import adminRepository from '../repositories/admin.repository.js';
import { Role, joinStatus as JoinStatus } from '../../../generated/prisma/client.js';

describe('AdminRepository DB Tests', () => {
  let testAdminId: number;
  let testAdminOfId: number;

  beforeEach(async () => {
    // 테스트 관리자 생성
    const admin = await prisma.user.create({
      data: {
        username: 'adminrepotest',
        email: 'adminrepotest@example.com',
        password: 'hashed-password',
        name: 'Admin Repo Test',
        contact: '010-1111-1111',
        role: Role.ADMIN,
        joinStatus: JoinStatus.PENDING,
        isActive: true,
        avatar: '',
      },
    });
    testAdminId = admin.id;

    // 테스트 adminOf 생성
    const adminOf = await prisma.adminOf.create({
      data: {
        name: 'Test Apartment Repo',
        address: 'Seoul Repo',
        description: 'Test Description',
        officeNumber: '02-1111-1111',
        buildingNumberFrom: 101,
        buildingNumberTo: 105,
        floorCountPerBuilding: 10,
        unitCountPerFloor: 4,
        userId: testAdminId,
      },
    });
    testAdminOfId = adminOf.id;
  });

  afterEach(async () => {
    // 테스트 데이터 정리
    await prisma.adminOf.deleteMany({
      where: { name: { contains: 'Test Apartment Repo' } },
    });
    await prisma.user.deleteMany({
      where: {
        OR: [
          { username: { contains: 'adminrepotest' } },
          { email: { contains: 'adminrepotest@example.com' } },
          { username: 'superadmintest' },
          { email: 'superadmintest@example.com' },
        ],
      },
    });
  });

  describe('findAdminByUsername', () => {
    it('사용자명으로 관리자를 찾는다', async () => {
      const admin = await adminRepository.findAdminByUsername('adminrepotest');

      expect(admin).not.toBeNull();
      expect(admin?.username).toBe('adminrepotest');
      expect(admin?.role).toBe(Role.ADMIN);
    });

    it('존재하지 않는 사용자명으로 조회 시 null을 반환한다', async () => {
      const admin = await adminRepository.findAdminByUsername('nonexistent');

      expect(admin).toBeNull();
    });
  });

  describe('findAdminByEmail', () => {
    it('이메일로 관리자를 찾는다', async () => {
      const admin =
        await adminRepository.findAdminByEmail('adminrepotest@example.com');

      expect(admin).not.toBeNull();
      expect(admin?.email).toBe('adminrepotest@example.com');
      expect(admin?.role).toBe(Role.ADMIN);
    });

    it('존재하지 않는 이메일로 조회 시 null을 반환한다', async () => {
      const admin =
        await adminRepository.findAdminByEmail('nonexistent@example.com');

      expect(admin).toBeNull();
    });
  });

  describe('findApartmentByName', () => {
    it('아파트 이름으로 아파트를 찾는다', async () => {
      const apartment =
        await adminRepository.findApartmentByName('Test Apartment Repo');

      expect(apartment).not.toBeNull();
      expect(apartment?.name).toBe('Test Apartment Repo');
      expect(apartment?.id).toBe(testAdminOfId);
    });

    it('존재하지 않는 아파트 이름으로 조회 시 null을 반환한다', async () => {
      const apartment =
        await adminRepository.findApartmentByName('Nonexistent Apartment');

      expect(apartment).toBeNull();
    });
  });

  describe('createSuperAccount', () => {
    it('슈퍼 관리자 계정을 생성한다', async () => {
      const newSuperAdmin = await adminRepository.createSuperAccount({
        username: 'superadmintest',
        email: 'superadmintest@example.com',
        password: 'hashed-password',
        name: 'Super Admin Test',
        contact: '010-9999-9999',
      });

      expect(newSuperAdmin).not.toBeNull();
      expect(newSuperAdmin.username).toBe('superadmintest');
      expect(newSuperAdmin.role).toBe(Role.SUPER_ADMIN);
      expect(newSuperAdmin.joinStatus).toBe(JoinStatus.APPROVED);
      expect(newSuperAdmin.isActive).toBe(true);

      // DB에서 직접 확인
      const superAdminFromDb = await prisma.user.findUnique({
        where: { id: newSuperAdmin.id },
      });
      expect(superAdminFromDb?.role).toBe(Role.SUPER_ADMIN);
    });
  });

  describe('createAccount and createAdminOf', () => {
    it('일반 관리자 계정과 아파트 정보를 생성한다', async () => {
      const newAdmin = await adminRepository.createAccount({
        username: 'adminrepotest2',
        email: 'adminrepotest2@example.com',
        password: 'hashed-password',
        name: 'Admin Test 2',
        contact: '010-2222-2222',
      });

      expect(newAdmin).not.toBeNull();
      expect(newAdmin.username).toBe('adminrepotest2');
      expect(newAdmin.role).toBe(Role.ADMIN);
      expect(newAdmin.joinStatus).toBe(JoinStatus.PENDING);
      expect(newAdmin.isActive).toBe(true);

      const adminOf = await adminRepository.createAdminOf(newAdmin.id, {
        name: 'Test Apartment Repo 2',
        address: 'Busan',
        description: 'Test 2',
        officeNumber: '051-2222-2222',
        buildingNumberFrom: 201,
        buildingNumberTo: 205,
        floorCountPerBuilding: 15,
        unitCountPerFloor: 6,
      });

      expect(adminOf).not.toBeNull();
      expect(adminOf.name).toBe('Test Apartment Repo 2');
      expect(adminOf.userId).toBe(newAdmin.id);

      // DB에서 직접 확인
      const adminOfFromDb = await prisma.adminOf.findUnique({
        where: { id: adminOf.id },
      });
      expect(adminOfFromDb?.userId).toBe(newAdmin.id);
    });
  });

  describe('findAdmins', () => {
    it('관리자 목록을 조회한다', async () => {
      const admins = await adminRepository.findAdmins({
        skip: 0,
        limit: 10,
      });

      expect(Array.isArray(admins)).toBe(true);
      expect(admins.length).toBeGreaterThan(0);

      // 우리가 생성한 관리자가 포함되어 있는지 확인
      const ourAdmin = admins.find((a) => a.id === testAdminId);
      expect(ourAdmin).toBeDefined();
      expect(ourAdmin?.adminOf).toBeDefined();
    });

    it('검색 키워드로 필터링한다', async () => {
      const admins = await adminRepository.findAdmins({
        searchKeyword: 'adminrepotest',
        skip: 0,
        limit: 10,
      });

      expect(admins.length).toBeGreaterThan(0);
      const ourAdmin = admins.find((a) => a.username === 'adminrepotest');
      expect(ourAdmin).toBeDefined();
    });

    it('가입 상태로 필터링한다', async () => {
      const admins = await adminRepository.findAdmins({
        joinStatusString: 'PENDING',
        skip: 0,
        limit: 10,
      });

      expect(Array.isArray(admins)).toBe(true);
      admins.forEach((admin) => {
        expect(admin.joinStatus).toBe(JoinStatus.PENDING);
      });
    });
  });

  describe('countAdmins', () => {
    it('관리자 수를 센다', async () => {
      const count = await adminRepository.countAdmins({});

      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThan(0);
    });

    it('검색 키워드로 필터링하여 센다', async () => {
      const count = await adminRepository.countAdmins({
        searchKeyword: 'adminrepotest',
      });

      expect(count).toBeGreaterThan(0);
    });
  });

  describe('updateJoinStatusById', () => {
    it('특정 관리자의 가입 상태를 변경한다', async () => {
      const updatedAdmin = await adminRepository.updateJoinStatusById(
        testAdminId,
        JoinStatus.APPROVED,
      );

      expect(updatedAdmin).not.toBeNull();
      expect(updatedAdmin.joinStatus).toBe(JoinStatus.APPROVED);

      // DB에서 직접 확인
      const adminFromDb = await prisma.user.findUnique({
        where: { id: testAdminId },
      });
      expect(adminFromDb?.joinStatus).toBe(JoinStatus.APPROVED);
    });
  });

  describe('updateAdmin', () => {
    it('관리자 정보를 수정한다', async () => {
      const updatedAdmin = await adminRepository.updateAdmin(
        testAdminId,
        {
          email: 'newemail@example.com',
          contact: '010-9999-9999',
          name: 'Updated Name',
        },
        {
          address: 'Updated Address',
        },
      );

      expect(updatedAdmin).not.toBeNull();
      expect(updatedAdmin.email).toBe('newemail@example.com');
      expect(updatedAdmin.contact).toBe('010-9999-9999');
      expect(updatedAdmin.name).toBe('Updated Name');
      expect(updatedAdmin.adminOf?.address).toBe('Updated Address');

      // DB에서 직접 확인
      const adminFromDb = await prisma.user.findUnique({
        where: { id: testAdminId },
        include: { adminOf: true },
      });
      expect(adminFromDb?.email).toBe('newemail@example.com');
      expect(adminFromDb?.adminOf?.address).toBe('Updated Address');
    });
  });

  describe('deleteAdmin', () => {
    it('관리자를 삭제한다', async () => {
      // 새 관리자 생성 (삭제용)
      const adminToDelete = await prisma.user.create({
        data: {
          username: 'admintodelete',
          email: 'admintodelete@example.com',
          password: 'hashed-password',
          name: 'Admin To Delete',
          contact: '010-3333-3333',
          role: Role.ADMIN,
          joinStatus: JoinStatus.PENDING,
          isActive: true,
          avatar: '',
        },
      });

      const adminOfToDelete = await prisma.adminOf.create({
        data: {
          name: 'Apartment To Delete',
          address: 'Delete Address',
          description: 'Delete',
          officeNumber: '02-3333-3333',
          buildingNumberFrom: 301,
          buildingNumberTo: 305,
          floorCountPerBuilding: 10,
          unitCountPerFloor: 4,
          userId: adminToDelete.id,
        },
      });

      const deletedAdmin = await adminRepository.deleteAdmin(adminToDelete.id);

      expect(deletedAdmin).not.toBeNull();
      expect(deletedAdmin.id).toBe(adminToDelete.id);

      // DB에서 삭제 확인
      const adminFromDb = await prisma.user.findUnique({
        where: { id: adminToDelete.id },
      });
      expect(adminFromDb).toBeNull();

      const adminOfFromDb = await prisma.adminOf.findUnique({
        where: { id: adminOfToDelete.id },
      });
      expect(adminOfFromDb).toBeNull();
    });
  });

  describe('deleteRejectedAdmins', () => {
    it('거절된 관리자들을 일괄 삭제한다', async () => {
      // 거절된 관리자 생성
      const rejectedAdmin = await prisma.user.create({
        data: {
          username: 'rejectedadmin',
          email: 'rejectedadmin@example.com',
          password: 'hashed-password',
          name: 'Rejected Admin',
          contact: '010-4444-4444',
          role: Role.ADMIN,
          joinStatus: JoinStatus.REJECTED,
          isActive: true,
          avatar: '',
        },
      });

      await prisma.adminOf.create({
        data: {
          name: 'Rejected Apartment',
          address: 'Rejected Address',
          description: 'Rejected',
          officeNumber: '02-4444-4444',
          buildingNumberFrom: 401,
          buildingNumberTo: 405,
          floorCountPerBuilding: 10,
          unitCountPerFloor: 4,
          userId: rejectedAdmin.id,
        },
      });

      const result = await adminRepository.deleteRejectedAdmins();

      expect(result.count).toBeGreaterThan(0);

      // DB에서 삭제 확인
      const adminFromDb = await prisma.user.findUnique({
        where: { id: rejectedAdmin.id },
      });
      expect(adminFromDb).toBeNull();
    });
  });
});
