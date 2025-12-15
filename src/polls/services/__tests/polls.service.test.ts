// src/polls/services/__tests/polls.service.test.ts
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

type AsyncFn = (...args: unknown[]) => Promise<unknown>;
type MockPrismaFn = jest.Mock<AsyncFn>;
type TransactionCallback = (tx: unknown) => Promise<unknown>;

const mockFn = () => jest.fn<AsyncFn>();

const mockUser = { findUnique: mockFn() };
const mockPoll = {
  create: mockFn(),
  findMany: mockFn(),
  findUnique: mockFn(),
  update: mockFn(),
  updateMany: mockFn(),
  delete: mockFn(),
  count: mockFn(),
};
const mockPollOption = {
  deleteMany: mockFn(),
  update: mockFn(),
  create: mockFn(),
};
const mockPollVote = {
  create: mockFn(),
  findFirst: mockFn(),
  delete: mockFn(),
};

const mockTransaction = jest.fn((callback: unknown) => {
  const fn = callback as TransactionCallback;
  return fn({
    poll: mockPoll,
    pollOption: mockPollOption,
  });
});

const mockPrismaClient = {
  user: mockUser,
  poll: mockPoll,
  pollOption: mockPollOption,
  pollVote: mockPollVote,
  $transaction: mockTransaction,
};

jest.unstable_mockModule('../../../lib/prisma.js', () => ({
  __esModule: true,
  prisma: mockPrismaClient,
}));

const { prisma } = await import('../../../lib/prisma.js');
const { default: pollsService } = await import('../polls.service.js');

const defaultResident = {
  id: 1,
  userId: 1,
  apartmentId: 1,
  building: 101,
  unit: 1001,
  isHouseholder: true,
};

const createTestUser = (
  overrides: { role?: string; resident?: unknown } = {},
) => ({
  id: 1,
  email: 'test@test.com',
  name: '테스트',
  role: overrides.role || 'ADMIN',
  resident:
    overrides.resident === undefined ? defaultResident : overrides.resident,
});

const getFutureDates = () => {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(now.getDate() + 1);
  const endDate = new Date(now);
  endDate.setDate(now.getDate() + 7);
  return { startDate, endDate };
};

const createTestPoll = (overrides: { status?: string; id?: string } = {}) => {
  const { startDate, endDate } = getFutureDates();
  return {
    id: overrides.id || 'poll123',
    title: '테스트 투표',
    content: '테스트 내용',
    status: overrides.status || 'PENDING',
    startDate: startDate,
    endDate: endDate,
    apartmentId: 1,
    building: null,
    authorId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    noticeCreated: false,
    author: { id: 1, name: '테스트' },
    options: [
      {
        id: 'opt1',
        title: '찬성',
        order: 0,
        pollId: 'poll123',
        _count: { votes: 0 },
      },
      {
        id: 'opt2',
        title: '반대',
        order: 1,
        pollId: 'poll123',
        _count: { votes: 0 },
      },
    ],
    votes: [],
  };
};

const { startDate, endDate } = getFutureDates();
const defaultPollInput = {
  title: '테스트 투표',
  content: '테스트 내용',
  startDate: startDate.toISOString(),
  endDate: endDate.toISOString(),
  options: [{ title: '찬성' }, { title: '반대' }],
};

const setupTestContext = (
  options: { role?: string; pollStatus?: string; resident?: unknown } = {},
) => {
  const { role = 'ADMIN', pollStatus, resident } = options;

  const mockUser = createTestUser({ role, resident });
  (prisma.user.findUnique as unknown as MockPrismaFn).mockResolvedValue(
    mockUser,
  );

  const mockPollInstance = pollStatus
    ? createTestPoll({ status: pollStatus })
    : createTestPoll();

  if (pollStatus) {
    (prisma.poll.findUnique as unknown as MockPrismaFn).mockResolvedValue(
      mockPollInstance,
    );
  }

  return { mockUser, mockPoll: mockPollInstance };
};

describe('PollsService - 단위 테스트', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPoll', () => {
    it('관리자가 투표를 생성할 수 있다', async () => {
      const { mockPoll } = setupTestContext({ role: 'ADMIN' });
      (prisma.poll.create as unknown as MockPrismaFn).mockResolvedValue(
        mockPoll,
      );

      const result = await pollsService.createPoll(1, defaultPollInput);

      expect(result).toBeDefined();
      expect(result.title).toBe('테스트 투표');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { resident: true },
      });
      expect(prisma.poll.create).toHaveBeenCalledTimes(1);
    });

    it('입주민 정보가 없으면 에러를 반환한다', async () => {
      setupTestContext({ resident: null });

      await expect(
        pollsService.createPoll(1, {
          ...defaultPollInput,
          options: [{ title: '찬성' }],
        }),
      ).rejects.toThrow(
        '입주민 정보가 존재하지 않아 투표 서비스를 이용할 수 없습니다.',
      );
    });

    it('관리자가 아니면 투표 생성이 불가능하다', async () => {
      setupTestContext({ role: 'RESIDENT' });

      await expect(
        pollsService.createPoll(1, defaultPollInput),
      ).rejects.toThrow('관리자만 투표를 생성할 수 있습니다.');
    });

    it('종료 시간이 시작 시간보다 빠르면 에러를 반환한다', async () => {
      setupTestContext();
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);

      await expect(
        pollsService.createPoll(1, {
          ...defaultPollInput,
          startDate: tomorrow.toISOString(),
          endDate: now.toISOString(),
        }),
      ).rejects.toThrow('종료 시간은 시작 시간보다 이후여야 합니다.');
    });
  });

  describe('getPolls', () => {
    it('투표 목록을 조회할 수 있다', async () => {
      const { mockPoll } = setupTestContext();
      (prisma.poll.count as unknown as MockPrismaFn).mockResolvedValue(1);
      (prisma.poll.findMany as unknown as MockPrismaFn).mockResolvedValue([
        mockPoll,
      ]);

      const result = await pollsService.getPolls(1, { page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.totalCount).toBe(1);
    });

    it('상태별 필터링이 가능하다', async () => {
      setupTestContext();
      (prisma.poll.count as unknown as MockPrismaFn).mockResolvedValue(1);
      (prisma.poll.findMany as unknown as MockPrismaFn).mockResolvedValue([]);

      await pollsService.getPolls(1, { status: 'PENDING' });

      expect(prisma.poll.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'PENDING' }),
        }),
      );
    });
  });

  describe('vote', () => {
    it('투표할 수 있다', async () => {
      setupTestContext({ role: 'RESIDENT', pollStatus: 'IN_PROGRESS' });

      (prisma.pollVote.findFirst as unknown as MockPrismaFn).mockResolvedValue(
        null,
      );
      (prisma.pollVote.create as unknown as MockPrismaFn).mockResolvedValue({
        id: 'vote1',
        userId: 1,
        pollId: 'poll123',
        optionId: 'opt1',
      });

      const result = await pollsService.vote('poll123', 'opt1', 1);

      expect(result.message).toBe('투표가 완료되었습니다.');
      expect(prisma.pollVote.create).toHaveBeenCalledWith({
        data: { userId: 1, pollId: 'poll123', optionId: 'opt1' },
      });
    });

    it('진행 중이 아닌 투표에는 참여할 수 없다', async () => {
      setupTestContext({ role: 'RESIDENT', pollStatus: 'PENDING' });

      await expect(pollsService.vote('poll123', 'opt1', 1)).rejects.toThrow(
        '진행 중인 투표가 아닙니다.',
      );
    });
  });

  describe('deletePoll', () => {
    it('PENDING 상태의 투표를 삭제할 수 있다', async () => {
      const { mockPoll } = setupTestContext({
        role: 'ADMIN',
        pollStatus: 'PENDING',
      });
      (prisma.poll.delete as unknown as MockPrismaFn).mockResolvedValue(
        mockPoll,
      );

      const result = await pollsService.deletePoll('poll123', 1);

      expect(result.message).toBe('투표가 삭제되었습니다.');
      expect(prisma.poll.delete).toHaveBeenCalledWith({
        where: { id: 'poll123' },
      });
    });

    it('시작된 투표는 삭제할 수 없다', async () => {
      setupTestContext({ role: 'ADMIN', pollStatus: 'IN_PROGRESS' });

      await expect(pollsService.deletePoll('poll123', 1)).rejects.toThrow(
        '투표가 이미 시작되어 삭제할 수 없습니다.',
      );
    });
  });
});
