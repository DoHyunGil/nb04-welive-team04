import { beforeEach, describe, expect, it, jest } from '@jest/globals';

// Mock dependencies
const mockCommentRepository = {
  createComment: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  getComments: jest.fn<(...args: unknown[]) => Promise<unknown[]>>(),
  countComments: jest.fn<(...args: unknown[]) => Promise<number>>(),
  getCommentById: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  updateComment: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  deleteComment: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
};

jest.unstable_mockModule('../repositories/comment.repository.js', () => ({
  __esModule: true,
  default: mockCommentRepository,
}));

const { default: commentService } = await import(
  '../services/comment.service.js'
);

describe('CommentService Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createComment', () => {
    it('댓글 생성 성공 시 생성된 댓글을 반환한다', async () => {
      const mockComment = {
        id: 1,
        content: 'Test comment',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
        author: {
          id: 1,
          name: 'Test User',
        },
      };

      mockCommentRepository.createComment.mockResolvedValue(mockComment);

      const result = await commentService.createComment(1, {
        resourceType: 'POLL',
        resourceId: '1',
        content: 'Test comment',
      });

      expect(mockCommentRepository.createComment).toHaveBeenCalledWith(1, {
        resourceType: 'POLL',
        resourceId: '1',
        content: 'Test comment',
      });
      expect(result).toEqual({
        id: '1',
        content: 'Test comment',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        author: {
          id: '1',
          name: 'Test User',
        },
      });
    });
  });

  describe('findComments', () => {
    it('댓글 목록 조회 성공 시 페이지네이션 정보와 함께 반환한다', async () => {
      const mockComments = [
        {
          id: 1,
          content: 'Comment 1',
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
          updatedAt: new Date('2024-01-01T00:00:00.000Z'),
          author: { id: 1, name: 'User 1' },
        },
        {
          id: 2,
          content: 'Comment 2',
          createdAt: new Date('2024-01-02T00:00:00.000Z'),
          updatedAt: new Date('2024-01-02T00:00:00.000Z'),
          author: { id: 2, name: 'User 2' },
        },
      ];

      mockCommentRepository.getComments.mockResolvedValue(mockComments);
      mockCommentRepository.countComments.mockResolvedValue(15);

      const result = await commentService.findComments({
        resourceType: 'POLL',
        resourceId: '1',
        page: 1,
        limit: 10,
      });

      expect(mockCommentRepository.getComments).toHaveBeenCalledWith({
        resourceType: 'POLL',
        resourceId: '1',
        skip: 0,
        limit: 10,
      });
      expect(mockCommentRepository.countComments).toHaveBeenCalledWith({
        resourceType: 'POLL',
        resourceId: '1',
      });
      expect(result).toEqual({
        data: [
          {
            id: '1',
            content: 'Comment 1',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
            author: { id: '1', name: 'User 1' },
          },
          {
            id: '2',
            content: 'Comment 2',
            createdAt: '2024-01-02T00:00:00.000Z',
            updatedAt: '2024-01-02T00:00:00.000Z',
            author: { id: '2', name: 'User 2' },
          },
        ],
        totalCount: 15,
        page: 1,
        limit: 10,
        hasNext: true,
      });
    });

    it('다음 페이지가 없을 때 hasNext가 false를 반환한다', async () => {
      mockCommentRepository.getComments.mockResolvedValue([]);
      mockCommentRepository.countComments.mockResolvedValue(5);

      const result = await commentService.findComments({
        resourceType: 'POLL',
        resourceId: '1',
        page: 1,
        limit: 10,
      });

      expect(result.hasNext).toBe(false);
    });
  });

  describe('updateComment', () => {
    it('본인이 작성한 댓글 수정 성공', async () => {
      const mockComment = {
        id: 1,
        authorId: 1,
        content: 'Original comment',
      };

      mockCommentRepository.getCommentById.mockResolvedValue(mockComment);
      mockCommentRepository.updateComment.mockResolvedValue({});

      await commentService.updateComment(1, {
        commentId: 1,
        content: 'Updated comment',
      });

      expect(mockCommentRepository.getCommentById).toHaveBeenCalledWith(1);
      expect(mockCommentRepository.updateComment).toHaveBeenCalledWith(1, {
        content: 'Updated comment',
      });
    });

    it('존재하지 않는 댓글 수정 시 404 에러를 던진다', async () => {
      mockCommentRepository.getCommentById.mockResolvedValue(null);

      await expect(
        commentService.updateComment(1, {
          commentId: 999,
          content: 'Updated comment',
        }),
      ).rejects.toMatchObject({
        status: 404,
        message: '댓글을 찾을 수 없습니다.',
      });

      expect(mockCommentRepository.updateComment).not.toHaveBeenCalled();
    });

    it('다른 사용자의 댓글 수정 시 403 에러를 던진다', async () => {
      const mockComment = {
        id: 1,
        authorId: 2,
        content: 'Original comment',
      };

      mockCommentRepository.getCommentById.mockResolvedValue(mockComment);

      await expect(
        commentService.updateComment(1, {
          commentId: 1,
          content: 'Updated comment',
        }),
      ).rejects.toMatchObject({
        status: 403,
        message: '댓글을 수정할 권한이 없습니다.',
      });

      expect(mockCommentRepository.updateComment).not.toHaveBeenCalled();
    });
  });

  describe('deleteComment', () => {
    it('본인이 작성한 댓글 삭제 성공', async () => {
      const mockComment = {
        id: 1,
        authorId: 1,
        content: 'Test comment',
      };

      mockCommentRepository.getCommentById.mockResolvedValue(mockComment);
      mockCommentRepository.deleteComment.mockResolvedValue({});

      await commentService.deleteComment(1, 'USER', { commentId: 1 });

      expect(mockCommentRepository.getCommentById).toHaveBeenCalledWith(1);
      expect(mockCommentRepository.deleteComment).toHaveBeenCalledWith(1);
    });

    it('관리자가 다른 사용자의 댓글 삭제 성공', async () => {
      const mockComment = {
        id: 1,
        authorId: 2,
        content: 'Test comment',
      };

      mockCommentRepository.getCommentById.mockResolvedValue(mockComment);
      mockCommentRepository.deleteComment.mockResolvedValue({});

      await commentService.deleteComment(1, 'ADMIN', { commentId: 1 });

      expect(mockCommentRepository.deleteComment).toHaveBeenCalledWith(1);
    });

    it('슈퍼 관리자가 다른 사용자의 댓글 삭제 성공', async () => {
      const mockComment = {
        id: 1,
        authorId: 2,
        content: 'Test comment',
      };

      mockCommentRepository.getCommentById.mockResolvedValue(mockComment);
      mockCommentRepository.deleteComment.mockResolvedValue({});

      await commentService.deleteComment(1, 'SUPER_ADMIN', { commentId: 1 });

      expect(mockCommentRepository.deleteComment).toHaveBeenCalledWith(1);
    });

    it('존재하지 않는 댓글 삭제 시 404 에러를 던진다', async () => {
      mockCommentRepository.getCommentById.mockResolvedValue(null);

      await expect(
        commentService.deleteComment(1, 'USER', { commentId: 999 }),
      ).rejects.toMatchObject({
        status: 404,
        message: '댓글을 찾을 수 없습니다.',
      });

      expect(mockCommentRepository.deleteComment).not.toHaveBeenCalled();
    });

    it('일반 사용자가 다른 사용자의 댓글 삭제 시 403 에러를 던진다', async () => {
      const mockComment = {
        id: 1,
        authorId: 2,
        content: 'Test comment',
      };

      mockCommentRepository.getCommentById.mockResolvedValue(mockComment);

      await expect(
        commentService.deleteComment(1, 'USER', { commentId: 1 }),
      ).rejects.toMatchObject({
        status: 403,
        message: '댓글을 삭제할 권한이 없습니다.',
      });

      expect(mockCommentRepository.deleteComment).not.toHaveBeenCalled();
    });
  });
});
