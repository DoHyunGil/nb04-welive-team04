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
      const mockPoll = { id: 'poll123', title: '테스트' };
      const mockRequest = createMockRequest({ body: { title: '테스트' } });
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

    it('서비스가 에러를 던지면 next로 전달한다', async () => {
      const error = new Error('Service Error');
      const mockRequest = createMockRequest();
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
      const mockPolls = { data: [], totalCount: 0 };
      const mockRequest = createMockRequest();
      const { status, json, statusMock, jsonMock } = createMockResponse();

      mockPollsService.getPolls.mockResolvedValue(mockPolls);

      await pollsController.getPolls(
        mockRequest as Request,
        { status, json } as unknown as Response,
        mockNext,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockPolls);
    });
  });

  describe('getPollById', () => {
    it('투표 상세 조회에 성공하면 200 상태코드를 반환한다', async () => {
      const mockPoll = { id: 'poll123' };
      const mockRequest = createMockRequest({ params: { pollId: 'poll123' } });
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
  });

  describe('updatePoll', () => {
    it('투표 수정에 성공하면 204 상태코드를 반환한다', async () => {
      const mockRequest = createMockRequest({ params: { pollId: 'poll123' } });
      const { status, send, statusMock, sendMock } = createMockResponse();

      mockPollsService.updatePoll.mockResolvedValue({});

      await pollsController.updatePoll(
        mockRequest as Request,
        { status, send } as unknown as Response,
        mockNext,
      );

      expect(statusMock).toHaveBeenCalledWith(204);
      expect(sendMock).toHaveBeenCalled();
    });
  });

  describe('deletePoll', () => {
    it('투표 삭제에 성공하면 204 상태코드를 반환한다', async () => {
      const mockRequest = createMockRequest({ params: { pollId: 'poll123' } });
      const { status, send, statusMock, sendMock } = createMockResponse();

      mockPollsService.deletePoll.mockResolvedValue({});

      await pollsController.deletePoll(
        mockRequest as Request,
        { status, send } as unknown as Response,
        mockNext,
      );

      expect(statusMock).toHaveBeenCalledWith(204);
      expect(sendMock).toHaveBeenCalled();
    });
  });

  describe('vote', () => {
    it('투표하기에 성공하면 204 상태코드를 반환한다', async () => {
      const mockRequest = createMockRequest({
        params: { pollId: 'poll123' },
        body: { optionId: 'opt1' },
      });
      const { status, send, statusMock, sendMock } = createMockResponse();

      mockPollsService.vote.mockResolvedValue({});

      await pollsController.vote(
        mockRequest as Request,
        { status, send } as unknown as Response,
        mockNext,
      );

      expect(statusMock).toHaveBeenCalledWith(204);
      expect(sendMock).toHaveBeenCalled();
    });
  });

  describe('unvote', () => {
    it('투표 취소에 성공하면 204 상태코드를 반환한다', async () => {
      const mockRequest = createMockRequest({ params: { pollId: 'poll123' } });
      const { status, send, statusMock, sendMock } = createMockResponse();

      mockPollsService.unvote.mockResolvedValue({});

      await pollsController.unvote(
        mockRequest as Request,
        { status, send } as unknown as Response,
        mockNext,
      );

      expect(statusMock).toHaveBeenCalledWith(204);
      expect(sendMock).toHaveBeenCalled();
    });
  });
});
