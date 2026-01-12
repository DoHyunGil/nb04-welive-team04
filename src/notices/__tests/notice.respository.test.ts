import {
  beforeEach,
  afterEach,
  afterAll,
  describe,
  expect,
  it,
} from '@jest/globals';
import { prisma } from '../../lib/prisma.js';
import noticeRepository from '../repositories/notice.repository.js';
import { NoticeCategory } from '../../../generated/prisma/client.js';

describe('NoticeRespository - 단위 테스트', () => {
  let adminId;
  let adminOfId;
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
    adminOfId = admin.adminOf?.id;
    // 테스트용 아파트 생성
    const apartment = await prisma.apartment.create({
      data: {
        name: '테스트 아파트',
        address: '테스트 주소',
        description: '테스트 설명',
        officeNumber: '02-3001-0000',
        adminOfId,
        buildingNumberFrom: 1,
        buildingNumberTo: 2,
        buildings: [1, 2],
        floorCountPerBuilding: 11,
        unitCountPerFloor: 2,
        units: [101, 102],
      },
    });
    apartmentId = apartment.id;
  });

  const createNotice = async (overrides = {}) => {
    return await prisma.notice.create({
      data: {
        title: '기본 제목',
        content: '기본 내용',
        isPinned: false,
        category: 'MAINTENANCE',
        author: {
          connect: {
            id: adminId,
          },
        },
        apartment: {
          connect: {
            id: apartmentId,
          },
        },
        ...overrides,
      },
    });
  };
  afterEach(async () => {
    await prisma.event.deleteMany();
    await prisma.notice.deleteMany();
    await prisma.apartment.deleteMany();
    await prisma.adminOf.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('getAdminOfIdByUserId', () => {
    it('존재하는 userId로 조회하면 adminOf의 id를 반환한다', async () => {
      const result = await noticeRepository.getAdminOfIdByUserId(adminId);
      expect(result).not.toBeNull();
      expect(result).toHaveProperty('id');
      expect(result?.id).toBe(adminOfId);
      expect(typeof result?.id).toBe('number');
    });
    it('존재하지 않는 userId로 조회하면 null을 반환한다', async () => {
      const result = await noticeRepository.getAdminOfIdByUserId(999);
      expect(result).toBeNull();
    });
  });
  describe('createNotice', () => {
    it('공지를 생성한다', async () => {
      const data = {
        title: '테스트 공지 제목',
        content: '테스트 공지 내용',
        isPinned: false,
        category: NoticeCategory.COMMUNITY,
      };
      const result = await noticeRepository.createNotice(
        adminOfId,
        adminId,
        data,
      );

      expect(result).toBeDefined();
      expect(result.title).toBe('테스트 공지 제목');
      expect(result.authorId).toBe(adminId);

      const dbData = await prisma.notice.findUnique({
        where: { id: result.id },
      });
      expect(dbData).not.toBeNull();
    });
  });
  describe('getNotices', () => {
    beforeEach(async () => {
      await createNotice({ title: '1' });
      await createNotice({ title: '2' });
      await createNotice({ title: '3' });
    });
    it('공지 목록을 조회한다', async () => {
      const notices = await noticeRepository.getNotices({
        page: 1,
        limit: 20,
      });
      expect(Array.isArray(notices)).toBe(true);
      expect(notices.length).toBe(3);
      expect(notices[0].author).toBeDefined();
    });
    it('페이지네이션이 적용된다', async () => {
      const firstPage = await noticeRepository.getNotices({
        page: 1,
        limit: 2,
      });
      const secondPage = await noticeRepository.getNotices({
        page: 2,
        limit: 2,
      });
      expect(firstPage.length).toBe(2);
      expect(secondPage.length).toBe(1);
      expect(firstPage[0].id).not.toBe(secondPage[0].id);
    });
    it('최신순으로 정렬된다', async () => {
      const notices = await noticeRepository.getNotices({
        page: 1,
        limit: 20,
      });
      for (let i = 0; i < notices.length - 1; i++) {
        expect(notices[i].createdAt.getTime()).toBeGreaterThanOrEqual(
          notices[i + 1].createdAt.getTime(),
        );
      }
    });
  });
  describe('getNoticeCount', () => {
    beforeEach(async () => {
      await createNotice({ title: '1' });
      await createNotice({ title: '2' });
      await createNotice({ title: '3', category: NoticeCategory.ETC });
    });
    it('조건에 맞는 공지가 총 몇개인지 센다', async () => {
      const result1 = await noticeRepository.getNoticeCount();
      expect(result1).toBe(3);

      const result2 = await noticeRepository.getNoticeCount(undefined, 'ETC');
      expect(result2).toBe(1);
    });
  });
  describe('getNoticeById', () => {
    it('공지 상세를 조회한다', async () => {
      const notice = await createNotice({ title: '조회용' });
      const result = await noticeRepository.getNoticeById(notice.id);
      expect(result).not.toBeNull();
      expect(result?.title).toBe('조회용');
      expect(result?.author).toBeDefined();
    });
    it('존재하지 않는 공지 ID로 조회 시 null을 반환한다', async () => {
      const result = await noticeRepository.getNoticeById(999);
      expect(result).toBeNull();
    });
  });
  describe('incrementViewCount', () => {
    it('공지사항의 조회수가 1만큼 증가해야 한다', async () => {
      const notice = await createNotice({
        title: '조회수 테스트',
        viewsCount: 10,
      });
      await noticeRepository.incrementViewCount(notice.id);
      const dbData = await prisma.notice.findUnique({
        where: { id: notice.id },
      });
      expect(dbData?.viewsCount).toBe(11);
    });
    it('존재하지 않는 공지 ID로 호출 시 에러를 발생한다', async () => {
      await expect(noticeRepository.incrementViewCount(999)).rejects.toThrow();
    });
  });
  describe('updateNotice', () => {
    it('공지를 수정한다', async () => {
      const notice = await createNotice({ title: '수정용' });
      const result = await noticeRepository.updateNotice(notice.id, {
        content: '내용 수정',
        category: 'EMERGENCY',
      });
      expect(result).not.toBeNull();
      expect(result.content).toBe('내용 수정');
      expect(result.category).toBe('EMERGENCY');
      expect(result.id).toBe(notice.id);

      const dbData = await prisma.notice.findUnique({
        where: { id: notice.id },
      });
      expect(dbData?.content).toBe('내용 수정');
    });
    it('존재하지 않는 공지 수정 시 에러를 던진다', async () => {
      await expect(
        noticeRepository.updateNotice(999, { title: '수정용' }),
      ).rejects.toThrow();
    });
  });
  describe('updateNoticeEvent', () => {
    it('이벤트와 공지를 연결한다', async () => {
      const notice = await createNotice({
        title: '이벤트와 연결',
      });
      const event = await prisma.event.create({
        data: {
          startDate: new Date(),
          endDate: new Date(),
          category: 'MAINTENANCE',
          title: '테스트 이벤트',
          apartmentId,
          resourceId: notice.id.toString(),
          resourceType: 'NOTICE',
        },
      });
      const result = await noticeRepository.updateNoticeEvent(
        notice.id,
        event.id,
      );
      expect(result.eventId).toBe(event.id);
      expect(result.author).toBeDefined();
      expect(result.author).toHaveProperty('name');
    });
    it('존재하지 않는 이벤트 ID로 연결을 시도하면 에러가 발생한다', async () => {
      const notice = await createNotice();
      await expect(
        noticeRepository.updateNoticeEvent(notice.id, 999),
      ).rejects.toThrow();
    });
  });
  describe('deleteNotice', () => {
    it('공지를 삭제한다', async () => {
      const notice = await createNotice({ title: '삭제용' });
      await noticeRepository.deleteNotice(notice.id);

      const dbData = await prisma.notice.findUnique({
        where: { id: notice.id },
      });
      expect(dbData).toBeNull();
    });
    it('존재하지 않는 민원 삭제 시 에러를 던진다', async () => {
      await expect(noticeRepository.deleteNotice(999)).rejects.toThrow();
    });
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });
});
