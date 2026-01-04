import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';

// Mock comment service
const mockCommentService = {
  createComment: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  findComments: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  updateComment: jest.fn<(...args: unknown[]) => Promise<void>>(),
  deleteComment: jest.fn<(...args: unknown[]) => Promise<void>>(),
};

jest.unstable_mockModule('../services/comment.service.js', () => ({
  __esModule: true,
  default: mockCommentService,
}));

const { default: commentController } = await import(
  '../controllers/comment.controller.js'
);

const createMockRequest = (
  overrides: Partial<Request> = {},
): Partial<Request> => ({
  body: {},
  params: {},
  query: {},
  user: undefined,
  ...overrides,
});

const createMockResponse = () => {
  const statusMock = jest.fn();
  const jsonMock = jest.fn();
  statusMock.mockReturnValue({
    json: jsonMock,
  });
  return {
    status: statusMock,
    json: jsonMock,
    statusMock,
    jsonMock,
  };
};

const mockNext = jest.fn() as NextFunction;

describe('CommentController Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('댓글 생성 성공 시 201 응답과 댓글 정보를 반환한다', async () => {
      const mockComment = {
        id: '1',
        content: 'Test comment',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        author: {
          id: '1',
          name: 'Test User',
        },
      };

      mockCommentService.createComment.mockResolvedValue(mockComment);

      const req = createMockRequest({
        user: { id: 1 },
        body: {
          resourceType: 'POLL',
          resourceId: '1',
          content: 'Test comment',
        },
      });
      const { status, json, statusMock, jsonMock } = createMockResponse();
      const res = { status, json } as unknown as Response;

      await commentController.create(req as Request, res, mockNext);

      expect(mockCommentService.createComment).toHaveBeenCalledWith(1, {
        resourceType: 'POLL',
        resourceId: '1',
        content: 'Test comment',
      });
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(mockComment);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('인증되지 않은 사용자는 401 에러를 받는다', async () => {
      const req = createMockRequest({
        user: undefined,
        body: {
          resourceType: 'POLL',
          resourceId: '1',
          content: 'Test comment',
        },
      });
      const { status, json } = createMockResponse();
      const res = { status, json } as unknown as Response;

      await commentController.create(req as Request, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 401,
          message: '로그인이 필요합니다.',
        }),
      );
      expect(mockCommentService.createComment).not.toHaveBeenCalled();
    });

    it('댓글 생성 중 에러 발생 시 next로 전달한다', async () => {
      const error = new Error('Create failed');
      mockCommentService.createComment.mockRejectedValue(error);

      const req = createMockRequest({
        user: { id: 1 },
        body: {
          resourceType: 'POLL',
          resourceId: '1',
          content: 'Test comment',
        },
      });
      const { status, json } = createMockResponse();
      const res = { status, json } as unknown as Response;

      await commentController.create(req as Request, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('findAll', () => {
    it('댓글 목록 조회 성공 시 200 응답과 댓글 목록을 반환한다', async () => {
      const mockResult = {
        data: [
          {
            id: '1',
            content: 'Test comment',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
            author: {
              id: '1',
              name: 'Test User',
            },
          },
        ],
        totalCount: 1,
        page: 1,
        limit: 10,
        hasNext: false,
      };

      mockCommentService.findComments.mockResolvedValue(mockResult);

      const req = createMockRequest({
        query: {
          resourceType: 'POLL',
          resourceId: '1',
          page: '1',
          limit: '10',
        },
      });
      const { status, json, statusMock, jsonMock } = createMockResponse();
      const res = { status, json } as unknown as Response;

      await commentController.findAll(req as Request, res, mockNext);

      expect(mockCommentService.findComments).toHaveBeenCalledWith({
        resourceType: 'POLL',
        resourceId: '1',
        page: 1,
        limit: 10,
      });
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockResult);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('페이지 및 limit 기본값을 사용한다', async () => {
      const mockResult = {
        data: [],
        totalCount: 0,
        page: 1,
        limit: 10,
        hasNext: false,
      };

      mockCommentService.findComments.mockResolvedValue(mockResult);

      const req = createMockRequest({
        query: {
          resourceType: 'POLL',
          resourceId: '1',
        },
      });
      const { status, json } = createMockResponse();
      const res = { status, json } as unknown as Response;

      await commentController.findAll(req as Request, res, mockNext);

      expect(mockCommentService.findComments).toHaveBeenCalledWith({
        resourceType: 'POLL',
        resourceId: '1',
        page: 1,
        limit: 10,
      });
    });
  });

  describe('update', () => {
    it('댓글 수정 성공 시 204 응답을 반환한다', async () => {
      mockCommentService.updateComment.mockResolvedValue();

      const req = createMockRequest({
        user: { id: 1 },
        params: { commentId: '1' },
        body: { content: 'Updated comment' },
      });
      const { status, json, statusMock, jsonMock } = createMockResponse();
      const res = { status, json } as unknown as Response;

      await commentController.update(req as Request, res, mockNext);

      expect(mockCommentService.updateComment).toHaveBeenCalledWith(1, {
        commentId: 1,
        content: 'Updated comment',
      });
      expect(statusMock).toHaveBeenCalledWith(204);
      expect(jsonMock).toHaveBeenCalledWith({});
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('인증되지 않은 사용자는 401 에러를 받는다', async () => {
      const req = createMockRequest({
        user: undefined,
        params: { commentId: '1' },
        body: { content: 'Updated comment' },
      });
      const { status, json } = createMockResponse();
      const res = { status, json } as unknown as Response;

      await commentController.update(req as Request, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 401,
          message: '로그인이 필요합니다.',
        }),
      );
      expect(mockCommentService.updateComment).not.toHaveBeenCalled();
    });

    it('댓글 수정 중 에러 발생 시 next로 전달한다', async () => {
      const error = new Error('Update failed');
      mockCommentService.updateComment.mockRejectedValue(error);

      const req = createMockRequest({
        user: { id: 1 },
        params: { commentId: '1' },
        body: { content: 'Updated comment' },
      });
      const { status, json } = createMockResponse();
      const res = { status, json } as unknown as Response;

      await commentController.update(req as Request, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('remove', () => {
    it('댓글 삭제 성공 시 204 응답을 반환한다', async () => {
      mockCommentService.deleteComment.mockResolvedValue();

      const req = createMockRequest({
        user: { id: 1, role: 'USER' },
        params: { commentId: '1' },
      });
      const { status, json, statusMock, jsonMock } = createMockResponse();
      const res = { status, json } as unknown as Response;

      await commentController.remove(req as Request, res, mockNext);

      expect(mockCommentService.deleteComment).toHaveBeenCalledWith(
        1,
        'USER',
        {
          commentId: 1,
        },
      );
      expect(statusMock).toHaveBeenCalledWith(204);
      expect(jsonMock).toHaveBeenCalledWith({});
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('인증되지 않은 사용자는 401 에러를 받는다', async () => {
      const req = createMockRequest({
        user: undefined,
        params: { commentId: '1' },
      });
      const { status, json } = createMockResponse();
      const res = { status, json } as unknown as Response;

      await commentController.remove(req as Request, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 401,
          message: '로그인이 필요합니다.',
        }),
      );
      expect(mockCommentService.deleteComment).not.toHaveBeenCalled();
    });

    it('role이 없는 사용자는 401 에러를 받는다', async () => {
      const req = createMockRequest({
        user: { id: 1 },
        params: { commentId: '1' },
      });
      const { status, json } = createMockResponse();
      const res = { status, json } as unknown as Response;

      await commentController.remove(req as Request, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 401,
          message: '로그인이 필요합니다.',
        }),
      );
      expect(mockCommentService.deleteComment).not.toHaveBeenCalled();
    });

    it('댓글 삭제 중 에러 발생 시 next로 전달한다', async () => {
      const error = new Error('Delete failed');
      mockCommentService.deleteComment.mockRejectedValue(error);

      const req = createMockRequest({
        user: { id: 1, role: 'USER' },
        params: { commentId: '1' },
      });
      const { status, json } = createMockResponse();
      const res = { status, json } as unknown as Response;

      await commentController.remove(req as Request, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
