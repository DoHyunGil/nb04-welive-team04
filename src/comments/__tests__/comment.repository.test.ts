import { beforeEach, afterEach, describe, expect, it } from '@jest/globals';
import { prisma } from '../../lib/prisma.js';
import commentRepository from '../repositories/comment.repository.js';
import {
  Role,
  joinStatus,
  CommentResourceType,
  NoticeCategory,
} from '../../../generated/prisma/client.js';

describe('CommentRepository DB Tests', () => {
  let testUserId: number;
  let testNoticeId: number;
  let testApartmentId: number;

  beforeEach(async () => {
    // 테스트 관리자 생성 (apartment 생성을 위해)
    const admin = await prisma.user.create({
      data: {
        username: 'commentadmin',
        email: 'commentadmin@example.com',
        password: 'hashed-password',
        name: 'Comment Admin',
        contact: '010-9999-9999',
        role: Role.ADMIN,
        joinStatus: joinStatus.APPROVED,
        isActive: true,
        avatar: '',
      },
    });

    const adminOf = await prisma.adminOf.create({
      data: {
        name: 'Test Apartment for Comments',
        address: 'Seoul',
        description: 'Test',
        officeNumber: '02-1234-5678',
        buildingNumberFrom: 101,
        buildingNumberTo: 105,
        floorCountPerBuilding: 10,
        unitCountPerFloor: 4,
        userId: admin.id,
      },
    });

    const apartment = await prisma.apartment.create({
      data: {
        name: 'Test Apartment for Comments',
        address: 'Seoul',
        description: 'Test',
        officeNumber: '02-1234-5678',
        buildingNumberFrom: 101,
        buildingNumberTo: 105,
        floorCountPerBuilding: 10,
        unitCountPerFloor: 4,
        buildings: [],
        units: [],
        adminOfId: adminOf.id,
      },
    });
    testApartmentId = apartment.id;

    // 테스트 사용자 생성
    const user = await prisma.user.create({
      data: {
        username: 'commenttest',
        email: 'commenttest@example.com',
        password: 'hashed-password',
        name: 'Comment Test User',
        contact: '010-5555-5555',
        role: Role.USER,
        joinStatus: joinStatus.APPROVED,
        isActive: true,
        avatar: '',
      },
    });
    testUserId = user.id;

    // 테스트 공지사항 생성 (댓글을 달기 위한 리소스)
    const notice = await prisma.notice.create({
      data: {
        title: 'Test Notice for Comments',
        content: 'Test Content',
        category: NoticeCategory.COMMUNITY,
        isPinned: false,
        authorId: testUserId,
        apartmentId: testApartmentId,
      },
    });
    testNoticeId = notice.id;
  });

  afterEach(async () => {
    // 테스트 데이터 정리
    await prisma.comment.deleteMany({
      where: { authorId: testUserId },
    });
    await prisma.notice.deleteMany({
      where: { id: testNoticeId },
    });
    await prisma.apartment.deleteMany({
      where: { id: testApartmentId },
    });
    await prisma.adminOf.deleteMany({
      where: { name: 'Test Apartment for Comments' },
    });
    await prisma.user.deleteMany({
      where: { username: { in: ['commenttest', 'commentadmin'] } },
    });
  });

  describe('createComment', () => {
    it('공지사항에 댓글을 생성한다', async () => {
      const comment = await commentRepository.createComment(testUserId, {
        content: 'Test comment',
        resourceType: CommentResourceType.NOTICE,
        resourceId: testNoticeId.toString(),
      });

      expect(comment).not.toBeNull();
      expect(comment.content).toBe('Test comment');
      expect(comment.authorId).toBe(testUserId);
      expect(comment.noticeId).toBe(testNoticeId);
      expect(comment.resourceType).toBe(CommentResourceType.NOTICE);
      expect(comment.author).toBeDefined();
      expect(comment.author.id).toBe(testUserId);
      expect(comment.author.name).toBe('Comment Test User');
    });

    it('생성된 댓글이 DB에 저장된다', async () => {
      const comment = await commentRepository.createComment(testUserId, {
        content: 'Persistent comment',
        resourceType: CommentResourceType.NOTICE,
        resourceId: testNoticeId.toString(),
      });

      // DB에서 직접 확인
      const commentFromDb = await prisma.comment.findUnique({
        where: { id: comment.id },
      });

      expect(commentFromDb).not.toBeNull();
      expect(commentFromDb?.content).toBe('Persistent comment');
      expect(commentFromDb?.authorId).toBe(testUserId);
    });
  });

  describe('getComments', () => {
    beforeEach(async () => {
      // 테스트 댓글 여러 개 생성
      await commentRepository.createComment(testUserId, {
        content: 'Comment 1',
        resourceType: CommentResourceType.NOTICE,
        resourceId: testNoticeId.toString(),
      });

      await commentRepository.createComment(testUserId, {
        content: 'Comment 2',
        resourceType: CommentResourceType.NOTICE,
        resourceId: testNoticeId.toString(),
      });

      await commentRepository.createComment(testUserId, {
        content: 'Comment 3',
        resourceType: CommentResourceType.NOTICE,
        resourceId: testNoticeId.toString(),
      });
    });

    it('댓글 목록을 조회한다', async () => {
      const comments = await commentRepository.getComments({
        resourceType: CommentResourceType.NOTICE,
        resourceId: testNoticeId.toString(),
        skip: 0,
        limit: 10,
      });

      expect(Array.isArray(comments)).toBe(true);
      expect(comments.length).toBe(3);
      expect(comments[0].author).toBeDefined();
    });

    it('페이지네이션이 적용된다', async () => {
      const firstPage = await commentRepository.getComments({
        resourceType: CommentResourceType.NOTICE,
        resourceId: testNoticeId.toString(),
        skip: 0,
        limit: 2,
      });

      const secondPage = await commentRepository.getComments({
        resourceType: CommentResourceType.NOTICE,
        resourceId: testNoticeId.toString(),
        skip: 2,
        limit: 2,
      });

      expect(firstPage.length).toBe(2);
      expect(secondPage.length).toBe(1);
      expect(firstPage[0].id).not.toBe(secondPage[0].id);
    });

    it('최신순으로 정렬된다', async () => {
      const comments = await commentRepository.getComments({
        resourceType: CommentResourceType.NOTICE,
        resourceId: testNoticeId.toString(),
        skip: 0,
        limit: 10,
      });

      // createdAt 기준 내림차순 확인
      for (let i = 0; i < comments.length - 1; i++) {
        expect(comments[i].createdAt.getTime()).toBeGreaterThanOrEqual(
          comments[i + 1].createdAt.getTime(),
        );
      }
    });
  });

  describe('countComments', () => {
    beforeEach(async () => {
      // 테스트 댓글 생성
      await commentRepository.createComment(testUserId, {
        content: 'Comment 1',
        resourceType: CommentResourceType.NOTICE,
        resourceId: testNoticeId.toString(),
      });

      await commentRepository.createComment(testUserId, {
        content: 'Comment 2',
        resourceType: CommentResourceType.NOTICE,
        resourceId: testNoticeId.toString(),
      });
    });

    it('댓글 수를 센다', async () => {
      const count = await commentRepository.countComments({
        resourceType: CommentResourceType.NOTICE,
        resourceId: testNoticeId.toString(),
      });

      expect(count).toBe(2);
    });

    it('다른 리소스의 댓글은 세지 않는다', async () => {
      // 다른 공지사항 생성
      const anotherNotice = await prisma.notice.create({
        data: {
          title: 'Another Notice',
          content: 'Another Content',
          category: NoticeCategory.ETC,
          isPinned: false,
          authorId: testUserId,
          apartmentId: testApartmentId,
        },
      });

      await commentRepository.createComment(testUserId, {
        content: 'Comment on another notice',
        resourceType: CommentResourceType.NOTICE,
        resourceId: anotherNotice.id.toString(),
      });

      const count = await commentRepository.countComments({
        resourceType: CommentResourceType.NOTICE,
        resourceId: testNoticeId.toString(),
      });

      expect(count).toBe(2); // 원래 공지사항의 댓글만 2개

      // 정리
      await prisma.notice.delete({ where: { id: anotherNotice.id } });
    });
  });

  describe('getCommentById', () => {
    it('댓글 ID로 댓글을 조회한다', async () => {
      const createdComment = await commentRepository.createComment(testUserId, {
        content: 'Find me',
        resourceType: CommentResourceType.NOTICE,
        resourceId: testNoticeId.toString(),
      });

      const foundComment =
        await commentRepository.getCommentById(createdComment.id);

      expect(foundComment).not.toBeNull();
      expect(foundComment?.id).toBe(createdComment.id);
      expect(foundComment?.content).toBe('Find me');
      expect(foundComment?.author).toBeDefined();
    });

    it('존재하지 않는 댓글 ID로 조회 시 null을 반환한다', async () => {
      const foundComment = await commentRepository.getCommentById(999999);

      expect(foundComment).toBeNull();
    });
  });

  describe('updateComment', () => {
    it('댓글을 수정한다', async () => {
      const comment = await commentRepository.createComment(testUserId, {
        content: 'Original content',
        resourceType: CommentResourceType.NOTICE,
        resourceId: testNoticeId.toString(),
      });

      const updatedComment = await commentRepository.updateComment(comment.id, {
        content: 'Updated content',
      });

      expect(updatedComment).not.toBeNull();
      expect(updatedComment.content).toBe('Updated content');
      expect(updatedComment.id).toBe(comment.id);

      // DB에서 직접 확인
      const commentFromDb = await prisma.comment.findUnique({
        where: { id: comment.id },
      });
      expect(commentFromDb?.content).toBe('Updated content');
    });

    it('존재하지 않는 댓글 수정 시 에러를 던진다', async () => {
      await expect(
        commentRepository.updateComment(999999, {
          content: 'Updated content',
        }),
      ).rejects.toThrow();
    });
  });

  describe('deleteComment', () => {
    it('댓글을 삭제한다', async () => {
      const comment = await commentRepository.createComment(testUserId, {
        content: 'Delete me',
        resourceType: CommentResourceType.NOTICE,
        resourceId: testNoticeId.toString(),
      });

      const deletedComment = await commentRepository.deleteComment(comment.id);

      expect(deletedComment).not.toBeNull();
      expect(deletedComment.id).toBe(comment.id);

      // DB에서 삭제 확인
      const commentFromDb = await prisma.comment.findUnique({
        where: { id: comment.id },
      });
      expect(commentFromDb).toBeNull();
    });

    it('존재하지 않는 댓글 삭제 시 에러를 던진다', async () => {
      await expect(commentRepository.deleteComment(999999)).rejects.toThrow();
    });
  });
});
