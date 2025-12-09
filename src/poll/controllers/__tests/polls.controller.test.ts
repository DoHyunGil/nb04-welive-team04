// src/poll/controllers/__tests/polls.controller.test.ts
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';

const mockPollsService = {
  createPoll: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  getPolls: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  getPollById: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  updatePoll: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  deletePoll: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  vote: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  unvote: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  updatePollStatuses: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
};

jest.unstable_mockModule('../../services/polls.service.js', () => ({
  __esModule: true,
  default: mockPollsService,
}));

const { default: pollsController } = await import('../polls.controller.js');

const createMockRequest = (
  overrides: Partial<Request> = {},
): Partial<Request> => ({
  user: {
    id: 1,
    email: 'test@test.com',
    role: 'ADMIN',
  },
  body: {},
  params: {},
  query: {},
  ...overrides,
});

const createMockResponse = () => {
  const statusMock = jest.fn();
  const jsonMock = jest.fn();
  const sendMock = jest.fn();
  statusMock.mockReturnValue({
    json: jsonMock,
    send: sendMock,
  });

  return {
    status: statusMock,
    json: jsonMock,
    send: sendMock,
    statusMock,
    jsonMock,
    sendMock,
  };
};

const mockNext = jest.fn() as NextFunction;

describe('PollsController - 단위 테스트', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPoll', () => {
    it('투표 생성에 성공하면 201 상태코드를 반환한다', async () => {
      const mockPoll = {
        id: 'poll123',
        title: '테스트 투표',
        content: '테스트 내용',
        status: 'PENDING',
      };

      const mockRequest = createMockRequest({
        body: {
          title: '테스트 투표',
          content: '테스트 내용',
          startDate: '2024-12-20T00:00:00Z',
          endDate: '2024-12-25T23:59:59Z',
          options: [{ title: '찬성' }, { title: '반대' }],
        },
      });

      const { status, json, statusMock, jsonMock } = createMockResponse();
      mockPollsService.createPoll.mockResolvedValue(mockPoll);

      await pollsController.createPoll(
        mockRequest as Request,
        { status, json } as unknown as Response,
        mockNext,
      );

      expect(mockPollsService.createPoll).toHaveBeenCalledWith(
        1,
        mockRequest.body,
      );
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(mockPoll);
    });

    it('사용자 정보가 없으면 401 에러를 반환한다', async () => {
      const mockRequest = createMockRequest({ user: undefined });
      const { status, json, statusMock, jsonMock } = createMockResponse();

      await pollsController.createPoll(
        mockRequest as Request,
        { status, json } as unknown as Response,
        mockNext,
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        message: '인증이 필요합니다.',
      });
      expect(mockPollsService.createPoll).not.toHaveBeenCalled();
    });

    it('서비스에서 에러가 발생하면 next를 호출한다', async () => {
      const error = new Error('Service Error');
      const mockRequest = createMockRequest({
        body: {
          title: '테스트',
          content: '내용',
        },
      });
      const { status, json } = createMockResponse();

      mockPollsService.createPoll.mockRejectedValue(error);

      await pollsController.createPoll(
        mockRequest as Request,
        { status, json } as unknown as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getPolls', () => {
    it('투표 목록 조회에 성공하면 200 상태코드를 반환한다', async () => {
      const mockPolls = {
        data: [{ id: 'poll1', title: '투표1', status: 'PENDING' }],
        totalCount: 1,
        page: 1,
        limit: 20,
        hasNext: false,
      };

      const mockRequest = createMockRequest({
        query: { page: '1', limit: '20' },
      });

      const { status, json, statusMock, jsonMock } = createMockResponse();

      mockPollsService.getPolls.mockResolvedValue(mockPolls);

      await pollsController.getPolls(
        mockRequest as Request,
        { status, json } as unknown as Response,
        mockNext,
      );

      expect(mockPollsService.getPolls).toHaveBeenCalledWith(1, {
        page: 1,
        limit: 20,
        searchKeyword: undefined,
        status: undefined,
        building: undefined,
      });
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockPolls);
    });

    it('쿼리 파라미터를 올바르게 변환한다', async () => {
      const mockRequest = createMockRequest({
        query: {
          page: '2',
          limit: '10',
          searchKeyword: '테스트',
          status: 'PENDING',
          building: '101',
        },
      });

      const { status, json } = createMockResponse();

      mockPollsService.getPolls.mockResolvedValue({
        data: [],
        totalCount: 0,
        page: 2,
        limit: 10,
        hasNext: false,
      });

      await pollsController.getPolls(
        mockRequest as Request,
        { status, json } as unknown as Response,
        mockNext,
      );
      expect(mockPollsService.getPolls).toHaveBeenCalledWith(1, {
        page: 2,
        limit: 10,
        searchKeyword: '테스트',
        status: 'PENDING',
        building: 101,
      });
    });
  });

  describe('getPollById', () => {
    it('투표 상세 조회에 성공하면 200 상태코드를 반환한다', async () => {
      const mockPoll = {
        id: 'poll123',
        title: '테스트 투표',
        content: '테스트 내용',
        status: 'PENDING',
      };

      const mockRequest = createMockRequest({
        params: { pollId: 'poll123' },
      });

      const { status, json, statusMock, jsonMock } = createMockResponse();

      mockPollsService.getPollById.mockResolvedValue(mockPoll);

      await pollsController.getPollById(
        mockRequest as Request,
        { status, json } as unknown as Response,
        mockNext,
      );

      expect(mockPollsService.getPollById).toHaveBeenCalledWith('poll123', 1);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockPoll);
    });

    it('pollId가 없으면 400 에러를 반환한다', async () => {
      const mockRequest = createMockRequest({ params: {} });
      const { status, json, statusMock, jsonMock } = createMockResponse();

      await pollsController.getPollById(
        mockRequest as Request,
        { status, json } as unknown as Response,
        mockNext,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'pollId가 필요합니다.',
      });
      expect(mockPollsService.getPollById).not.toHaveBeenCalled();
    });
  });

  describe('updatePoll', () => {
    it('투표 수정에 성공하면 204 상태코드를 반환한다', async () => {
      const mockRequest = createMockRequest({
        params: { pollId: 'poll123' },
        body: { title: '수정된 제목', content: '수정된 내용' },
      });

      const { status, send, statusMock, sendMock } = createMockResponse();

      mockPollsService.updatePoll.mockResolvedValue({});

      await pollsController.updatePoll(
        mockRequest as Request,
        { status, send } as unknown as Response,
        mockNext,
      );

      expect(mockPollsService.updatePoll).toHaveBeenCalledWith(
        'poll123',
        1,
        mockRequest.body,
      );
      expect(statusMock).toHaveBeenCalledWith(204);
      expect(sendMock).toHaveBeenCalled();
    });
  });

  describe('deletePoll', () => {
    it('투표 삭제에 성공하면 204 상태코드를 반환한다', async () => {
      const mockRequest = createMockRequest({
        params: { pollId: 'poll123' },
      });

      const { status, send, statusMock, sendMock } = createMockResponse();

      mockPollsService.deletePoll.mockResolvedValue({
        message: '투표가 삭제되었습니다.',
      });

      await pollsController.deletePoll(
        mockRequest as Request,
        { status, send } as unknown as Response,
        mockNext,
      );

      expect(mockPollsService.deletePoll).toHaveBeenCalledWith('poll123', 1);
      expect(statusMock).toHaveBeenCalledWith(204);
      expect(sendMock).toHaveBeenCalled();
    });
  });

  describe('vote', () => {
    it('투표하기에 성공하면 204 상태코드를 반환한다', async () => {
      const mockRequest = createMockRequest({
        params: { pollId: 'poll123' },
        body: { optionId: 'option123' },
      });

      const { status, send, statusMock, sendMock } = createMockResponse();

      mockPollsService.vote.mockResolvedValue({
        message: '투표가 완료되었습니다.',
      });

      await pollsController.vote(
        mockRequest as Request,
        { status, send } as unknown as Response,
        mockNext,
      );

      expect(mockPollsService.vote).toHaveBeenCalledWith(
        'poll123',
        'option123',
        1,
      );
      expect(statusMock).toHaveBeenCalledWith(204);
      expect(sendMock).toHaveBeenCalled();
    });

    it('optionId가 없으면 400 에러를 반환한다', async () => {
      const mockRequest = createMockRequest({
        params: { pollId: 'poll123' },
        body: {},
      });

      const { status, json, statusMock, jsonMock } = createMockResponse();

      await pollsController.vote(
        mockRequest as Request,
        { status, json } as unknown as Response,
        mockNext,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'optionId가 필요합니다.',
      });
      expect(mockPollsService.vote).not.toHaveBeenCalled();
    });
  });

  describe('unvote', () => {
    it('투표 취소에 성공하면 204 상태코드를 반환한다', async () => {
      const mockRequest = createMockRequest({
        params: { pollId: 'poll123' },
      });

      const { status, send, statusMock, sendMock } = createMockResponse();

      mockPollsService.unvote.mockResolvedValue({
        message: '투표가 취소되었습니다.',
      });

      await pollsController.unvote(
        mockRequest as Request,
        { status, send } as unknown as Response,
        mockNext,
      );

      expect(mockPollsService.unvote).toHaveBeenCalledWith('poll123', 1);
      expect(statusMock).toHaveBeenCalledWith(204);
      expect(sendMock).toHaveBeenCalled();
    });
  });
});
