import {
  beforeEach,
  afterEach,
  afterAll,
  describe,
  expect,
  it,
} from '@jest/globals';
import { prisma } from '../../lib/prisma.js';
import complaintRepository from '../repositories/complaint.repository.js';

describe('ComplaintRepository - 단위 테스트', () => {
  let adminId;
  let residentId;
  let apartmentId;
  beforeEach(async () => {
    // 테스트용 관리자 생성
    const admin = await prisma.user.create({
      data: {
        avatar: '',
        contact: '010-0000-0000',
        email: '1@test.com',
        isActive: true,
        joinStatus: 'APPROVED',
        name: 'test1',
        username: 'test1',
        role: 'ADMIN',
        password: 'test1',
        adminOf: {
          create: {
            address: '테스트 주소',
            buildingNumberFrom: 1,
            buildingNumberTo: 2,
            description: '테스트 설명',
            floorCountPerBuilding: 11,
            name: '테스트 아파트',
            officeNumber: '02-3001-0000',
            unitCountPerFloor: 2,
          },
        },
      },
      include: {
        adminOf: true,
      },
    });
    adminId = admin.id;
    // 테스트용 아파트 생성
    const apartment = await prisma.apartment.create({
      data: {
        name: '테스트 아파트',
        address: '테스트 주소',
        description: '테스트 설명',
        officeNumber: '02-3001-0000',
        adminOfId: admin.adminOf?.id,
        buildingNumberFrom: 1,
        buildingNumberTo: 2,
        buildings: [1, 2],
        floorCountPerBuilding: 11,
        unitCountPerFloor: 2,
        units: [101, 102],
      },
    });
    apartmentId = apartment.id;
    // 테스트용 입주민 생성
    const resident = await prisma.user.create({
      data: {
        avatar: '',
        contact: '010-1111-1111',
        email: '2@test.com',
        isActive: true,
        joinStatus: 'APPROVED',
        name: 'test2',
        username: 'test2',
        role: 'USER',
        password: 'test2',
        resident: {
          create: {
            contact: '010-1111-1111',
            email: '2@test.com',
            isHouseholder: true,
            building: 1,
            unit: 101,
            name: 'test2',
            apartmentId: apartmentId,
          },
        },
      },
    });
    residentId = resident.id;
  });

  const createComplaint = async (overrides = {}) => {
    return await prisma.complain.create({
      data: {
        title: '기본 제목',
        content: '기본 내용',
        isPublic: false,
        apartmentId,
        complainantId: residentId,
        ...overrides,
      },
    });
  };

  afterEach(async () => {
    await prisma.complain.deleteMany();
    await prisma.resident.deleteMany();
    await prisma.adminOf.deleteMany();
    await prisma.apartment.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('createComplaint', () => {
    it('민원을 생성한다', async () => {
      const data = {
        title: '테스트 민원 제목',
        content: '테스트 민원 내용',
        isPublic: true,
        apartmentId: apartmentId,
      };
      const result = await complaintRepository.createComplaint(
        residentId,
        data,
      );

      expect(result).toBeDefined();
      expect(result.title).toBe('테스트 민원 제목');
      expect(result.complainantId).toBe(residentId);

      const dbData = await prisma.complain.findUnique({
        where: { id: result.id },
      });
      expect(dbData).not.toBeNull();
    });
  });
  describe('getComplaints', () => {
    beforeEach(async () => {
      await createComplaint({ title: '1' });
      await createComplaint({ title: '2' });
      await createComplaint({ title: '3' });
    });
    it('민원 목록을 조회한다', async () => {
      const complaints = await complaintRepository.getComplaints({
        page: 1,
        limit: 20,
      });
      expect(Array.isArray(complaints)).toBe(true);
      expect(complaints.length).toBe(3);
      expect(complaints[0].complainant).toBeDefined();
    });
    it('페이지네이션이 적용된다', async () => {
      const firstPage = await complaintRepository.getComplaints({
        page: 1,
        limit: 2,
      });
      const secondPage = await complaintRepository.getComplaints({
        page: 2,
        limit: 2,
      });
      expect(firstPage.length).toBe(2);
      expect(secondPage.length).toBe(1);
      expect(firstPage[0].id).not.toBe(secondPage[0].id);
    });
    it('최신순으로 정렬된다', async () => {
      const complaints = await complaintRepository.getComplaints({
        page: 1,
        limit: 20,
      });
      for (let i = 0; i < complaints.length - 1; i++) {
        expect(complaints[i].createdAt.getTime()).toBeGreaterThanOrEqual(
          complaints[i + 1].createdAt.getTime(),
        );
      }
    });
  });
  describe('getComplaintCount', () => {
    beforeEach(async () => {
      await createComplaint({ title: '1' });
      await createComplaint({ title: '2' });
      await createComplaint({ title: '3', isPublic: true });
    });
    it('조건에 맞는 민원이 총 몇개인지 센다', async () => {
      const result1 = await complaintRepository.getComplaintCount();
      expect(result1).toBe(3);
      const result2 = await complaintRepository.getComplaintCount(
        undefined,
        undefined,
        true,
      );
      expect(result2).toBe(1);
    });
  });
  describe('getComplaintById', () => {
    it('민원 상세를 조회한다', async () => {
      const complaint = await createComplaint({ title: '조회용' });
      const result = await complaintRepository.getComplaintById(complaint.id);
      expect(result).not.toBeNull();
      expect(result?.title).toBe('조회용');
      expect(result?.complainant).toBeDefined();
    });
    it('존재하지 않은 민원 ID로 조회 시 null을 반환한다', async () => {
      const result = await complaintRepository.getComplaintById(999);
      expect(result).toBeNull();
    });
  });
  describe('incrementViewCount', () => {
    it('민원의 조회수가 1만큼 증가해야 한다', async () => {
      const complaint = await createComplaint({
        title: '조회수 테스트',
        viewsCount: 10,
      });
      await complaintRepository.incrementViewCount(complaint.id);
      const dbData = await prisma.complain.findUnique({
        where: { id: complaint.id },
      });
      expect(dbData?.viewsCount).toBe(11);
    });
    it('존재하지 않는 민원 ID로 호출 시 에러를 발생한다', async () => {
      await expect(
        complaintRepository.incrementViewCount(999),
      ).rejects.toThrow();
    });
  });
  describe('updateComplaint', () => {
    it('민원을 수정한다', async () => {
      const complaint = await createComplaint({ title: '수정용' });
      const result = await complaintRepository.updateComplaint(complaint.id, {
        content: '내용 수정',
      });
      expect(result).not.toBeNull();
      expect(result.content).toBe('내용 수정');
      expect(result.id).toBe(complaint.id);

      const dbData = await prisma.complain.findUnique({
        where: { id: complaint.id },
      });
      expect(dbData?.content).toBe('내용 수정');
    });
    it('존재하지 않은 민원 수정 시 에러를 던진다', async () => {
      await expect(
        complaintRepository.updateComplaint(999, { title: '수정용' }),
      ).rejects.toThrow();
    });
  });
  describe('deleteComplaint', () => {
    it('민원을 삭제한다', async () => {
      const complaint = await createComplaint({ title: '삭제용' });
      await complaintRepository.deleteComplaint(complaint.id);

      const dbData = await prisma.complain.findUnique({
        where: { id: complaint.id },
      });
      expect(dbData).toBeNull();
    });
    it('존재하지 않은 민원 삭제 시 에러를 던진다', async () => {
      await expect(complaintRepository.deleteComplaint(999)).rejects.toThrow();
    });
  });
  describe('updateComplaintStatus', () => {
    it('민원 상태를 수정한다', async () => {
      const complaint = await createComplaint({ title: '상태 수정용' });
      const result = await complaintRepository.updateComplaintStatus(
        complaint.id,
        'IN_PROGRESS',
      );
      expect(result).not.toBeNull();
      expect(result.status).toBe('IN_PROGRESS');
      expect(result.id).toBe(complaint.id);

      const dbData = await prisma.complain.findUnique({
        where: { id: complaint.id },
      });
      expect(dbData?.status).toBe('IN_PROGRESS');
    });
    it('존재하지 않은 민원 상태 수정 시 에러를 던진다', async () => {
      await expect(
        complaintRepository.updateComplaintStatus(999, 'IN_PROGRESS'),
      ).rejects.toThrow();
    });
  });
  describe('checkUserRole', () => {
    it('해당 유저의 role을 조회한다', async () => {
      const result1 = await complaintRepository.checkUserRole(adminId);
      expect(result1?.role).toBe('ADMIN');
      const result2 = await complaintRepository.checkUserRole(residentId);
      expect(result2?.role).toBe('USER');
    });
    it('존재하지 않은 유저의 role 조회 시 null을 반환한다', async () => {
      const result = await complaintRepository.checkUserRole(999);
      expect(result).toBeNull();
    });
  });
  describe('findResidentById', () => {
    it('해당 유저의 resident 값을 조회한다', async () => {
      const result = await complaintRepository.findResidentById(residentId);
      expect(result?.resident).not.toBeNull();
      expect(result?.resident?.userId).toBe(residentId);
    });
    it('관리자일 경우 resident 값이 null이다', async () => {
      const result = await complaintRepository.findResidentById(adminId);
      expect(result?.resident).toBeNull();
    });
    it('존재하지 않은 유저의 resident 조회 시 null을 반환한다', async () => {
      const result = await complaintRepository.findResidentById(999);
      expect(result).toBeNull();
    });
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });
});
