// src/polls/repositories/polls.repository.ts
import { prisma } from '../../lib/prisma.js';
import { Prisma } from '../../../generated/prisma/client.js';
import type { UpdatePollData } from '../controllers/polls.types.js';

export class PollsRepository {
  // 사용자 및 입주민 정보 조회
  async findUserWithResident(userId: number) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: { resident: true, adminOf: { select: { apartment: true } } },
    });
  }

  // 투표 생성
  async createPoll(data: {
    title: string;
    content: string;
    startDate: Date;
    endDate: Date;
    apartmentId: number;
    building: number | null;
    authorId: number;
    options: string[];
  }) {
    return prisma.poll.create({
      data: {
        title: data.title,
        content: data.content,
        startDate: data.startDate,
        endDate: data.endDate,
        apartmentId: data.apartmentId,
        building: data.building,
        authorId: data.authorId,
        options: {
          create: data.options.map((title, index) => ({
            title,
            order: index,
          })),
        },
      },
      include: {
        author: { select: { id: true, name: true } },
        options: true,
      },
    });
  }

  // 투표 목록 조회 (개수 조회와 목록 조회를 동시에 수행)
  async findAllPolls(
    where: Prisma.PollWhereInput,
    skip: number,
    limit: number,
    userId: number,
  ) {
    return Promise.all([
      prisma.poll.count({ where }),
      prisma.poll.findMany({
        where,
        skip,
        take: limit,
        include: {
          author: { select: { id: true, name: true } },
          options: {
            include: {
              _count: { select: { votes: true } },
            },
          },
          votes: {
            where: { userId },
            select: { optionId: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
  }

  // 단일 투표 상세 조회
  async findPollById(pollId: string, userId: number) {
    return prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        author: { select: { id: true, name: true } },
        options: {
          include: {
            _count: { select: { votes: true } },
          },
          orderBy: { order: 'asc' },
        },
        votes: {
          where: { userId },
          select: { optionId: true },
        },
      },
    });
  }

  // 수정 전 단순 조회 (권한 체크용)
  async findPollSimple(pollId: string) {
    return prisma.poll.findUnique({
      where: { id: pollId },
      include: { options: true },
    });
  }

  // 투표 수정 (트랜잭션 포함)
  async updatePoll(pollId: string, data: UpdatePollData) {
    return prisma.$transaction(async (tx) => {
      // 옵션 처리 로직
      if (data.options && data.options.length > 0) {
        const existingOptionIds = data.options
          .filter((opt) => opt.id)
          .map((opt) => opt.id as string);

        // 삭제된 옵션 제거
        await tx.pollOption.deleteMany({
          where: {
            pollId,
            id: { notIn: existingOptionIds },
          },
        });

        // 옵션 업데이트 또는 생성
        for (let i = 0; i < data.options.length; i++) {
          const opt = data.options[i];
          if (!opt) continue;

          if (opt.id) {
            await tx.pollOption.update({
              where: { id: opt.id },
              data: { title: opt.title, order: i },
            });
          } else {
            await tx.pollOption.create({
              data: { pollId, title: opt.title, order: i },
            });
          }
        }
      }

      // 투표 본문 업데이트
      return tx.poll.update({
        where: { id: pollId },
        data: {
          ...(data.title !== undefined && { title: data.title }),
          ...(data.content !== undefined && { content: data.content }),
          ...(data.startDate && { startDate: new Date(data.startDate) }),
          ...(data.endDate && { endDate: new Date(data.endDate) }),
          ...(data.building !== undefined && {
            building: data.building ?? null,
          }),
        },
        include: {
          author: { select: { id: true, name: true } },
          options: { orderBy: { order: 'asc' } },
        },
      });
    });
  }

  // 투표 삭제
  async deletePoll(pollId: string) {
    return prisma.poll.delete({ where: { id: pollId } });
  }

  // 투표 참여
  async createVote(userId: number, pollId: string, optionId: string) {
    return prisma.pollVote.create({
      data: { userId, pollId, optionId },
    });
  }

  // 투표 취소를 위한 조회
  async findVote(userId: number, pollId: string) {
    return prisma.pollVote.findFirst({
      where: { userId, pollId },
    });
  }

  // 투표 취소
  async deleteVote(voteId: string) {
    return prisma.pollVote.delete({ where: { id: voteId } });
  }

  // 상태 업데이트: 시작 상태로 변경
  async updateStatusToInProgress(now: Date) {
    return prisma.poll.updateMany({
      where: { status: 'PENDING', startDate: { lte: now } },
      data: { status: 'IN_PROGRESS' },
    });
  }

  // 상태 업데이트: 종료 대상 조회
  async findClosingPolls(now: Date) {
    return prisma.poll.findMany({
      where: {
        status: 'IN_PROGRESS',
        endDate: { lte: now },
        noticeCreated: false,
      },
      include: {
        options: {
          include: {
            _count: { select: { votes: true } },
          },
        },
      },
    });
  }

  // 상태 업데이트: 종료 처리
  async closePoll(pollId: string) {
    return prisma.poll.update({
      where: { id: pollId },
      data: { status: 'CLOSED', noticeCreated: true },
    });
  }
}

export default new PollsRepository();
