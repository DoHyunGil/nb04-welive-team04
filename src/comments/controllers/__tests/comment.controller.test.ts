import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';
import { CommentResourceType } from '../../../../generated/prisma/enums.js';

const mockCommentService = {
  createComment: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  findComments: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  updateComment: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  deleteComment: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
};

jest.unstable_mockModule('../../services/comment.service.js', () => ({
  __esModule: true,
  default: mockCommentService,
}));

const { default: commentController } = await import('../comment.controller.js');

const createMockRequest = (
  overrides: Partial<Request> = {},
): Partial<Request> => ({
  user: { id: 1, email: 'test@test.com', role: 'RESIDENT' },
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

const noUser = async (
  request: Partial<Request> = {},
  controllerFn: (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => Promise<void>,
) => {
  const { status, json } = createMockResponse();
  await controllerFn(
    request as Request,
    { status, json } as unknown as Response,
    mockNext,
  );
  expect(mockNext).toHaveBeenCalled();
  expect(mockNext).toHaveBeenCalledWith(
    expect.objectContaining({
      status: 401,
      message: '로그인이 필요합니다.',
    }),
  );
};

const serverError = async (
  request: Partial<Request> = {},
  controllerFn: (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => Promise<void>,
  error: Error,
) => {
  const { status, json } = createMockResponse();
  await controllerFn(
    request as Request,
    { status, json } as unknown as Response,
    mockNext,
  );

  expect(mockNext).toHaveBeenCalledWith(error);
};

describe('CommentController - 단위 테스트', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('댓글 생성에 성공하면 201 상태코드를 반환한다', async () => {
      const mockComment = {
        id: '1',
        content: '테스트 댓글',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        author: {
          id: '1',
          name: '테스트 유저',
        },
      };

      const mockRequest = createMockRequest({
        body: {
          content: '테스트 댓글',
          resourceType: CommentResourceType.COMPLAINT,
          resourceId: '1',
        },
      });

      const { status, json, statusMock, jsonMock } = createMockResponse();
      mockCommentService.createComment.mockResolvedValue(mockComment);

      await commentController.create(
        mockRequest as Request,
        { status, json } as unknown as Response,
        mockNext,
      );

      expect(mockCommentService.createComment).toHaveBeenCalledWith(
        1,
        mockRequest.body,
      );
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(mockComment);
    });

    it('사용자 정보가 없으면 401 에러를 반환한다', async () => {
      const mockRequest = createMockRequest({
        body: {
          content: '테스트 댓글',
          resourceType: CommentResourceType.COMPLAINT,
          resourceId: '1',
        },
        user: undefined,
      });

      noUser(mockRequest, commentController.create);
      expect(mockCommentService.createComment).not.toHaveBeenCalled();
    });

    it('서비스에서 에러가 발생하면 next를 호출한다', async () => {
      const error = new Error('Service Error');
      const mockRequest = createMockRequest({
        body: {
          content: '테스트 댓글',
          resourceType: CommentResourceType.COMPLAINT,
          resourceId: '1',
        },
      });

      mockCommentService.createComment.mockRejectedValue(error);
      serverError(mockRequest, commentController.create, error);
    });
  });

  describe('findAll', () => {
    it('댓글 목록 조회에 성공하면 200 상태코드를 반환한다', async () => {
      const mockComments = {
        data: [
          {
            id: '1',
            content: '테스트 댓글',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
            author: {
              id: '1',
              name: '테스트 유저',
            },
          },
        ],
        totalCount: 1,
        page: 1,
        limit: 10,
        hasNext: false,
      };

      const mockRequest = createMockRequest({
        query: {
          resourceType: CommentResourceType.COMPLAINT as any,
          resourceId: '1' as any,
          page: 1 as any,
          limit: 10 as any,
        },
      });

      const { status, json, statusMock, jsonMock } = createMockResponse();
      mockCommentService.findComments.mockResolvedValue(mockComments);

      await commentController.findAll(
        mockRequest as Request,
        { status, json } as unknown as Response,
        mockNext,
      );

      expect(mockCommentService.findComments).toHaveBeenCalledWith({
        resourceType: CommentResourceType.COMPLAINT,
        resourceId: '1',
        page: 1,
        limit: 10,
      });
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockComments);
    });

    it('서비스에서 에러가 발생하면 next를 호출한다', async () => {
      const error = new Error('Service Error');
      const mockRequest = createMockRequest({
        query: {
          resourceType: CommentResourceType.COMPLAINT as any,
          resourceId: '1' as any,
          page: 1 as any,
          limit: 10 as any,
        },
      });

      mockCommentService.findComments.mockRejectedValue(error);
      serverError(mockRequest, commentController.findAll, error);
    });
  });

  describe('update', () => {
    it('댓글 수정에 성공하면 204 상태코드를 반환한다', async () => {
      const mockRequest = createMockRequest({
        params: { commentId: '1' },
        body: { content: '수정된 댓글' },
        user: { id: 1, email: 'test@test.com', role: 'RESIDENT' },
      });

      const { status, json, statusMock, jsonMock } = createMockResponse();
      mockCommentService.updateComment.mockResolvedValue(undefined);

      await commentController.update(
        mockRequest as Request,
        { status, json } as unknown as Response,
        mockNext,
      );

      expect(mockCommentService.updateComment).toHaveBeenCalledWith(1, {
        commentId: 1,
        content: '수정된 댓글',
      });
      expect(statusMock).toHaveBeenCalledWith(204);
      expect(jsonMock).toHaveBeenCalledWith({});
    });

    it('사용자 정보가 없으면 401 에러를 반환한다', async () => {
      const mockRequest = createMockRequest({
        params: { commentId: '1' },
        body: { content: '수정된 댓글' },
        user: undefined,
      });

      noUser(mockRequest, commentController.update);
      expect(mockCommentService.updateComment).not.toHaveBeenCalled();
    });

    it('서비스에서 에러가 발생하면 next를 호출한다', async () => {
      const error = new Error('Service Error');
      const mockRequest = createMockRequest({
        params: { commentId: '1' },
        body: { content: '수정된 댓글' },
      });

      mockCommentService.updateComment.mockRejectedValue(error);
      serverError(mockRequest, commentController.update, error);
    });
  });

  describe('remove', () => {
    it('댓글 삭제에 성공하면 204 상태코드를 반환한다', async () => {
      const mockRequest = createMockRequest({
        params: { commentId: '1' },
        user: { id: 1, email: 'test@test.com', role: 'RESIDENT' },
      });

      const { status, json, statusMock, jsonMock } = createMockResponse();
      mockCommentService.deleteComment.mockResolvedValue(undefined);

      await commentController.remove(
        mockRequest as Request,
        { status, json } as unknown as Response,
        mockNext,
      );

      expect(mockCommentService.deleteComment).toHaveBeenCalledWith(
        1,
        'RESIDENT',
        {
          commentId: 1,
        },
      );
      expect(statusMock).toHaveBeenCalledWith(204);
      expect(jsonMock).toHaveBeenCalledWith({});
    });

    it('사용자 정보가 없으면 401 에러를 반환한다', async () => {
      const mockRequest = createMockRequest({
        params: { commentId: '1' },
        user: undefined,
      });

      noUser(mockRequest, commentController.remove);
      expect(mockCommentService.deleteComment).not.toHaveBeenCalled();
    });

    it('서비스에서 에러가 발생하면 next를 호출한다', async () => {
      const error = new Error('Service Error');
      const mockRequest = createMockRequest({
        params: { commentId: '1' },
      });

      mockCommentService.deleteComment.mockRejectedValue(error);
      serverError(mockRequest, commentController.remove, error);
    });
  });
});
