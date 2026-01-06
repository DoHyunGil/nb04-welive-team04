import { beforeEach, describe, expect, it, jest } from '@jest/globals';

// Mock dependencies
const mockAdminRepository = {
  findAdminByUsername: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  findAdminByEmail: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  findApartmentByName: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  createSuperAccount: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  createAccount: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  createAdminOf: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  findAdmins: jest.fn<(...args: unknown[]) => Promise<unknown[]>>(),
  countAdmins: jest.fn<(...args: unknown[]) => Promise<number>>(),
  updateManyJoinStatus: jest.fn<
    (...args: unknown[]) => Promise<{ count: number }>
  >(),
  updateJoinStatusById: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  updateAdmin: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  countResidentsByAdminId: jest.fn<(...args: unknown[]) => Promise<number>>(),
  deleteAdmin: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  deleteRejectedAdmins: jest.fn<
    (...args: unknown[]) => Promise<{ count: number }>
  >(),
};

const mockHashPassword = jest.fn<(...args: unknown[]) => Promise<string>>();

jest.unstable_mockModule('../repositories/admin.repository.js', () => ({
  __esModule: true,
  default: mockAdminRepository,
}));

jest.unstable_mockModule('../../lib/password.js', () => ({
  hashPassword: mockHashPassword,
}));

const { default: adminService } = await import(
  '../services/admin.service.js'
);

describe('AdminService Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('superAdminRegister', () => {
    it('슈퍼 관리자 등록 성공 시 새로운 계정을 반환한다', async () => {
      const mockData = {
        username: 'superadmin',
        password: 'password123',
        email: 'super@example.com',
        contact: '010-1234-5678',
        name: 'Super Admin',
      };

      const mockAdmin = {
        id: 1,
        username: 'superadmin',
        email: 'super@example.com',
        role: 'SUPER_ADMIN',
      };

      mockAdminRepository.findAdminByUsername.mockResolvedValue(null);
      mockAdminRepository.findAdminByEmail.mockResolvedValue(null);
      mockHashPassword.mockResolvedValue('hashed-password');
      mockAdminRepository.createSuperAccount.mockResolvedValue(mockAdmin);

      const result = await adminService.superAdminRegister(mockData);

      expect(mockAdminRepository.findAdminByUsername).toHaveBeenCalledWith(
        'superadmin',
      );
      expect(mockAdminRepository.findAdminByEmail).toHaveBeenCalledWith(
        'super@example.com',
      );
      expect(mockHashPassword).toHaveBeenCalledWith('password123');
      expect(mockAdminRepository.createSuperAccount).toHaveBeenCalledWith({
        ...mockData,
        password: 'hashed-password',
      });
      expect(result).toEqual(mockAdmin);
    });

    it('이미 존재하는 아이디로 등록 시 409 에러를 던진다', async () => {
      mockAdminRepository.findAdminByUsername.mockResolvedValue({
        id: 1,
        username: 'existing',
      });

      await expect(
        adminService.superAdminRegister({
          username: 'existing',
          password: 'password123',
          email: 'test@example.com',
          contact: '010-1234-5678',
          name: 'Test',
        }),
      ).rejects.toMatchObject({
        status: 409,
        message: '이미 존재하는 아이디입니다.',
      });
    });

    it('이미 존재하는 이메일로 등록 시 409 에러를 던진다', async () => {
      mockAdminRepository.findAdminByUsername.mockResolvedValue(null);
      mockAdminRepository.findAdminByEmail.mockResolvedValue({
        id: 1,
        email: 'existing@example.com',
      });

      await expect(
        adminService.superAdminRegister({
          username: 'newuser',
          password: 'password123',
          email: 'existing@example.com',
          contact: '010-1234-5678',
          name: 'Test',
        }),
      ).rejects.toMatchObject({
        status: 409,
        message: '이미 존재하는 이메일입니다.',
      });
    });
  });

  describe('adminRegister', () => {
    it('일반 관리자 등록 성공 시 새로운 계정을 반환한다', async () => {
      const mockData = {
        username: 'admin',
        password: 'password123',
        email: 'admin@example.com',
        contact: '010-1234-5678',
        name: 'Admin',
        adminOf: {
          name: 'Test Apartment',
          address: 'Seoul',
          description: 'Test',
          officeNumber: '02-1234-5678',
          buildingNumberFrom: 101,
          buildingNumberTo: 105,
          floorCountPerBuilding: 10,
          unitCountPerFloor: 4,
        },
      };

      const mockAdmin = {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        role: 'ADMIN',
      };

      mockAdminRepository.findAdminByUsername.mockResolvedValue(null);
      mockAdminRepository.findAdminByEmail.mockResolvedValue(null);
      mockAdminRepository.findApartmentByName.mockResolvedValue(null);
      mockHashPassword.mockResolvedValue('hashed-password');
      mockAdminRepository.createAccount.mockResolvedValue(mockAdmin);
      mockAdminRepository.createAdminOf.mockResolvedValue({});

      const result = await adminService.adminRegister(mockData);

      expect(mockAdminRepository.findAdminByUsername).toHaveBeenCalledWith(
        'admin',
      );
      expect(mockAdminRepository.findAdminByEmail).toHaveBeenCalledWith(
        'admin@example.com',
      );
      expect(mockAdminRepository.findApartmentByName).toHaveBeenCalledWith(
        'Test Apartment',
      );
      expect(mockHashPassword).toHaveBeenCalledWith('password123');
      expect(mockAdminRepository.createAdminOf).toHaveBeenCalledWith(
        1,
        mockData.adminOf,
      );
      expect(result).toEqual(mockAdmin);
    });

    it('이미 등록된 아파트로 등록 시 409 에러를 던진다', async () => {
      mockAdminRepository.findAdminByUsername.mockResolvedValue(null);
      mockAdminRepository.findAdminByEmail.mockResolvedValue(null);
      mockAdminRepository.findApartmentByName.mockResolvedValue({
        id: 1,
        name: 'Existing Apartment',
      });

      await expect(
        adminService.adminRegister({
          username: 'admin',
          password: 'password123',
          email: 'admin@example.com',
          contact: '010-1234-5678',
          name: 'Admin',
          adminOf: {
            name: 'Existing Apartment',
            address: 'Seoul',
            description: 'Test',
            officeNumber: '02-1234-5678',
            buildingNumberFrom: 101,
            buildingNumberTo: 105,
            floorCountPerBuilding: 10,
            unitCountPerFloor: 4,
          },
        }),
      ).rejects.toMatchObject({
        status: 409,
        message: '이미 등록된 아파트입니다.',
      });
    });
  });

  describe('findAdmins', () => {
    it('관리자 목록 조회 성공 시 페이지네이션 정보와 함께 반환한다', async () => {
      const mockAdmins = [
        { id: 1, username: 'admin1', email: 'admin1@example.com' },
        { id: 2, username: 'admin2', email: 'admin2@example.com' },
      ];

      mockAdminRepository.findAdmins.mockResolvedValue(mockAdmins);
      mockAdminRepository.countAdmins.mockResolvedValue(25);

      const result = await adminService.findAdmins({
        page: 1,
        limit: 20,
        searchKeyword: 'admin',
        joinStatusString: 'PENDING',
      });

      expect(mockAdminRepository.findAdmins).toHaveBeenCalledWith({
        searchKeyword: 'admin',
        joinStatusString: 'PENDING',
        skip: 0,
        limit: 20,
      });
      expect(mockAdminRepository.countAdmins).toHaveBeenCalledWith({
        searchKeyword: 'admin',
        joinStatusString: 'PENDING',
      });
      expect(result).toEqual({
        data: mockAdmins,
        totalCount: 25,
        page: 1,
        limit: 20,
        hasNext: true,
      });
    });

    it('다음 페이지가 없을 때 hasNext가 false를 반환한다', async () => {
      mockAdminRepository.findAdmins.mockResolvedValue([]);
      mockAdminRepository.countAdmins.mockResolvedValue(15);

      const result = await adminService.findAdmins({
        page: 1,
        limit: 20,
        searchKeyword: undefined,
        joinStatusString: undefined,
      });

      expect(result.hasNext).toBe(false);
    });
  });

  describe('updateManyJoinStatus', () => {
    it('여러 관리자의 가입 상태 변경 성공 시 변경된 수를 반환한다', async () => {
      mockAdminRepository.updateManyJoinStatus.mockResolvedValue({
        count: 5,
      });

      const result = await adminService.updateManyJoinStatus({
        joinStatus: 'APPROVED',
      });

      expect(mockAdminRepository.updateManyJoinStatus).toHaveBeenCalled();
      expect(result).toBe(5);
    });

    it('잘못된 joinStatus 값이면 400 에러를 던진다', async () => {
      await expect(
        adminService.updateManyJoinStatus({
          joinStatus: 'INVALID_STATUS',
        }),
      ).rejects.toMatchObject({
        status: 400,
        message: '잘못된 joinStatus 값입니다.',
      });
    });
  });

  describe('updateJoinStatusById', () => {
    it('특정 관리자의 가입 상태 변경 성공 시 업데이트된 관리자를 반환한다', async () => {
      const mockUpdatedAdmin = {
        id: 1,
        username: 'admin',
        joinStatus: 'APPROVED',
      };

      mockAdminRepository.updateJoinStatusById.mockResolvedValue(
        mockUpdatedAdmin,
      );

      const result = await adminService.updateJoinStatusById({
        id: 1,
        joinStatus: 'APPROVED',
      });

      expect(mockAdminRepository.updateJoinStatusById).toHaveBeenCalled();
      expect(result).toEqual(mockUpdatedAdmin);
    });
  });

  describe('updateAdmin', () => {
    it('관리자 정보 수정 성공 시 업데이트된 관리자를 반환한다', async () => {
      const mockUpdatedAdmin = {
        id: 1,
        username: 'admin',
        email: 'newemail@example.com',
        contact: '010-9999-9999',
      };

      mockAdminRepository.updateAdmin.mockResolvedValue(mockUpdatedAdmin);

      const result = await adminService.updateAdmin({
        id: 1,
        email: 'newemail@example.com',
        contact: '010-9999-9999',
        name: 'New Name',
      });

      expect(mockAdminRepository.updateAdmin).toHaveBeenCalledWith(
        1,
        {
          email: 'newemail@example.com',
          contact: '010-9999-9999',
          name: 'New Name',
        },
        undefined,
      );
      expect(result).toEqual(mockUpdatedAdmin);
    });

    it('adminOf 데이터가 있으면 함께 업데이트한다', async () => {
      const mockUpdatedAdmin = { id: 1, username: 'admin' };

      mockAdminRepository.updateAdmin.mockResolvedValue(mockUpdatedAdmin);

      await adminService.updateAdmin({
        id: 1,
        email: 'test@example.com',
        adminOf: {
          name: 'Updated Apartment',
          address: 'New Address',
        },
      });

      expect(mockAdminRepository.updateAdmin).toHaveBeenCalledWith(
        1,
        { email: 'test@example.com', contact: undefined, name: undefined },
        { name: 'Updated Apartment', address: 'New Address' },
      );
    });
  });

  describe('deleteAdmin', () => {
    it('입주민이 없는 관리자 삭제 성공 시 삭제된 관리자를 반환한다', async () => {
      const mockDeletedAdmin = { id: 1, username: 'admin' };

      mockAdminRepository.countResidentsByAdminId.mockResolvedValue(0);
      mockAdminRepository.deleteAdmin.mockResolvedValue(mockDeletedAdmin);

      const result = await adminService.deleteAdmin({ id: 1 });

      expect(mockAdminRepository.countResidentsByAdminId).toHaveBeenCalledWith(
        1,
      );
      expect(mockAdminRepository.deleteAdmin).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockDeletedAdmin);
    });

    it('입주민이 있는 관리자 삭제 시 400 에러를 던진다', async () => {
      mockAdminRepository.countResidentsByAdminId.mockResolvedValue(5);

      await expect(adminService.deleteAdmin({ id: 1 })).rejects.toMatchObject({
        status: 400,
        message:
          '입주민이 등록된 관리자는 삭제할 수 없습니다. 먼저 입주민을 삭제해주세요.',
      });

      expect(mockAdminRepository.deleteAdmin).not.toHaveBeenCalled();
    });
  });

  describe('deleteRejectedAdmins', () => {
    it('거절된 관리자들 일괄 삭제 성공 시 삭제된 수를 반환한다', async () => {
      mockAdminRepository.deleteRejectedAdmins.mockResolvedValue({ count: 3 });

      const result = await adminService.deleteRejectedAdmins();

      expect(mockAdminRepository.deleteRejectedAdmins).toHaveBeenCalled();
      expect(result).toBe(3);
    });
  });
});
