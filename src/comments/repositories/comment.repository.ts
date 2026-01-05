import { prisma } from '../../lib/prisma.js';
import { CommentResourceType } from '../../../generated/prisma/enums.js';
import type {
  CreateCommentInput,
  FindCommentsParams,
  UpdateCommentInput,
} from './types/comment.types.js';

class CommentRepository {
  // 댓글 생성
  async createComment(userId: number, createDto: CreateCommentInput) {
    const { content, resourceType, resourceId } = createDto;
    const resourceIdInt = parseInt(resourceId, 10);

    const data: any = {
      content,
      resourceType,
      author: {
        connect: { id: userId },
      },
    };

    // resourceType에 따라 연결
    if (resourceType === CommentResourceType.COMPLAINT) {
      data.complain = { connect: { id: resourceIdInt } };
    } else if (resourceType === CommentResourceType.NOTICE) {
      data.notice = { connect: { id: resourceIdInt } };
    }

    return await prisma.comment.create({
      data,
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  // 댓글 목록 조회 (페이지네이션)
  async getComments(params: FindCommentsParams) {
    const { resourceType, resourceId, skip, limit } = params;
    const resourceIdInt = parseInt(resourceId, 10);

    const where: any = { resourceType };

    if (resourceType === CommentResourceType.COMPLAINT) {
      where.complainId = resourceIdInt;
    } else if (resourceType === CommentResourceType.NOTICE) {
      where.noticeId = resourceIdInt;
    }

    const comments = await prisma.comment.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: skip,
      take: limit,
    });

    return comments;
  }

  // 댓글 수 세기
  async countComments(params: {
    resourceType: CommentResourceType;
    resourceId: string;
  }) {
    const { resourceType, resourceId } = params;
    const resourceIdInt = parseInt(resourceId, 10);

    const where: any = { resourceType };

    if (resourceType === CommentResourceType.COMPLAINT) {
      where.complainId = resourceIdInt;
    } else if (resourceType === CommentResourceType.NOTICE) {
      where.noticeId = resourceIdInt;
    }

    const count = await prisma.comment.count({ where });

    return count;
  }

  // 댓글 ID로 조회
  async getCommentById(commentId: number) {
    return await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  // 댓글 수정
  async updateComment(commentId: number, updateData: UpdateCommentInput) {
    return await prisma.comment.update({
      where: { id: commentId },
      data: {
        content: updateData.content,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  // 댓글 삭제
  async deleteComment(commentId: number) {
    return await prisma.comment.delete({
      where: { id: commentId },
    });
  }
}

export default new CommentRepository();
