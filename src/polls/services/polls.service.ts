// src/polls/services/polls.service.ts
import createError from 'http-errors';
import { Prisma, PollStatus } from '../../../generated/prisma/client.js';
import type {
  GetPollsQuery,
  CreatePollData,
  UpdatePollData,
} from '../controllers/polls.types.js';
import pollsRepository from '../repositories/polls.repository.js';
import eventRepository from '../../events/repositories/event.repository.js';
import noticeRepository from '../../notices/repositories/notice.repository.js';

const allowedRoles = ['ADMIN', 'SUPER_ADMIN'];

class PollsService {
  private async getUserWithResident(userId: number | undefined) {
    if (!userId) {
      throw createError(401, '인증이 필요합니다.');
    }

    const user = await pollsRepository.findUserWithResident(userId);

    if (!user) throw createError(404, '사용자를 찾을 수 없습니다.');

    if (allowedRoles.includes(user.role)) {
      return { user, resident: user.resident || null };
    }

    if (!user.resident) {
      throw createError(
        403,
        '입주민 정보가 존재하지 않아 투표 서비스를 이용할 수 없습니다.',
      );
    }

    return { user, resident: user.resident };
  }

  async createPoll(userId: number | undefined, data: CreatePollData) {
    const { user, resident } = await this.getUserWithResident(userId);

    if (!allowedRoles.includes(user.role)) {
      throw createError(403, '관리자만 투표를 생성할 수 있습니다.');
    }

    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const now = new Date();

    if (start >= end) {
      throw createError(400, '종료 시간은 시작 시간보다 이후여야 합니다.');
    }

    if (end <= now) {
      throw createError(400, '종료 시간은 현재 시간보다 이후여야 합니다.');
    }

    const poll = await pollsRepository.createPoll({
      title: data.title,
      content: data.content,
      startDate: start,
      endDate: end,
      apartmentId: user.adminOf!.apartment!.id,
      building: data.building ?? null,
      authorId: user.id,
      options: data.options.map((opt) => opt.title),
    });

    await eventRepository.createEvent({
      title: data.title,
      category: 'RESIDENT_VOTE',
      startDate: start,
      endDate: end,
      apartmentId: user.adminOf!.apartment!.id,
      resourceId: poll.id,
      resourceType: 'POLL',
    });
    return this.formatPollResponse(poll);
  }

  async getPolls(userId: number | undefined, query: GetPollsQuery) {
    const { page = 1, limit = 20, searchKeyword, status, building } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const { user, resident } = await this.getUserWithResident(userId);

    const where: Prisma.PollWhereInput = {
      apartmentId: resident?.apartmentId || user.adminOf?.apartment?.id,
    };

    if (searchKeyword) {
      where.OR = [
        { title: { contains: searchKeyword } },
        { content: { contains: searchKeyword } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (user.role === 'USER') {
      where.OR = [{ building: null }, { building: resident!.building }];
    }

    if (building !== undefined && building !== null) {
      where.building = building === 0 ? null : Number(building);
    }

    const [totalCount, polls] = await pollsRepository.findAllPolls(
      where,
      skip,
      Number(limit),
      user.id,
    );

    return {
      data: polls.map((poll) => this.formatPollResponse(poll)),
      totalCount,
      page: Number(page),
      limit: Number(limit),
      hasNext: skip + polls.length < totalCount,
    };
  }

  async getPollById(pollId: string, userId: number | undefined) {
    const { user, resident } = await this.getUserWithResident(userId);
    const poll = await pollsRepository.findPollById(pollId, user.id);

    if (!poll) throw createError(404, '투표를 찾을 수 없습니다.');
    const apartmentId = resident?.apartmentId || user.adminOf?.apartment?.id;
    if (poll.apartmentId !== apartmentId) {
      throw createError(403, '권한이 없습니다.');
    }

    if (
      user.role === 'USER' &&
      poll.building !== null &&
      poll.building !== resident!.building
    ) {
      throw createError(403, '해당 동 주민만 조회할 수 있습니다.');
    }

    return this.formatPollResponse(poll);
  }

  async updatePoll(
    pollId: string,
    userId: number | undefined,
    data: UpdatePollData,
  ) {
    const { user, resident } = await this.getUserWithResident(userId);

    if (!allowedRoles.includes(user.role)) {
      throw createError(403, '관리자만 투표를 수정할 수 있습니다.');
    }

    const poll = await pollsRepository.findPollSimple(pollId);

    if (!poll) throw createError(404, '투표를 찾을 수 없습니다.');

    if (poll.apartmentId !== user.adminOf!.apartment!.id) {
      throw createError(403, '수정 권한이 없습니다.');
    }

    if (poll.status !== 'PENDING') {
      throw createError(400, '투표가 이미 시작되어 수정할 수 없습니다.');
    }

    const start = data.startDate ? new Date(data.startDate) : poll.startDate;
    const end = data.endDate ? new Date(data.endDate) : poll.endDate;

    if (start >= end) {
      throw createError(400, '종료 시간은 시작 시간보다 이후여야 합니다.');
    }

    const updatedPoll = await pollsRepository.updatePoll(pollId, data);

    const event = await eventRepository.findEventByResource('POLL', poll.id);
    if (!event) {
      throw createError(404, '일정이 존재하지 않습니다.');
    }
    await eventRepository.updateEvent(event.id, {
      startDate: start,
      endDate: end,
      title: data.title,
    });

    return this.formatPollResponse(updatedPoll);
  }

  async deletePoll(pollId: string, userId: number | undefined) {
    const { user, resident } = await this.getUserWithResident(userId);

    if (!allowedRoles.includes(user.role)) {
      throw createError(403, '관리자만 투표를 삭제할 수 있습니다.');
    }

    const poll = await pollsRepository.findPollSimple(pollId);
    if (!poll) throw createError(404, '투표를 찾을 수 없습니다.');

    if (poll.apartmentId !== user.adminOf!.apartment!.id) {
      throw createError(403, '삭제 권한이 없습니다.');
    }

    if (poll.status !== 'PENDING') {
      throw createError(400, '투표가 이미 시작되어 삭제할 수 없습니다.');
    }

    const eventId = await eventRepository.findEventByResource('POLL', poll.id);
    if (!eventId) {
      throw createError(404, '일정이 존재하지 않습니다.');
    }
    await eventRepository.deleteEvent(eventId.id);
    await pollsRepository.deletePoll(pollId);
    return { message: '투표가 삭제되었습니다.' };
  }

  async vote(pollId: string, optionId: string, userId: number | undefined) {
    const [{ user, resident }, poll] = await Promise.all([
      this.getUserWithResident(userId),
      pollsRepository.findPollSimple(pollId),
    ]);

    if (!poll) throw createError(404, '투표를 찾을 수 없습니다.');

    if (poll.apartmentId !== resident!.apartmentId) {
      throw createError(403, '입주민만 투표할 수 있습니다.');
    }

    if (poll.building !== null && poll.building !== resident!.building) {
      throw createError(403, '해당 동 주민만 투표할 수 있습니다.');
    }

    if (poll.status !== 'IN_PROGRESS') {
      throw createError(400, '진행 중인 투표가 아닙니다.');
    }

    const option = poll.options.find((opt) => opt.id === optionId);
    if (!option) throw createError(400, '유효하지 않은 투표 옵션입니다.');

    try {
      await pollsRepository.createVote(user.id, pollId, optionId);
    } catch (error) {
      const prismaError = error as { code?: string };
      if (prismaError.code === 'P2002') {
        throw createError(400, '이미 투표에 참여하셨습니다.');
      }
      throw error;
    }

    return { message: '투표가 완료되었습니다.' };
  }

  async unvote(pollId: string, userId: number | undefined) {
    const [{ user }, poll] = await Promise.all([
      this.getUserWithResident(userId),
      pollsRepository.findPollSimple(pollId),
    ]);
    if (!poll) throw createError(404, '투표를 찾을 수 없습니다.');
    if (poll.status !== 'IN_PROGRESS') {
      throw createError(400, '진행 중인 투표가 아닙니다.');
    }

    const vote = await pollsRepository.findVote(user.id, pollId);

    if (!vote) throw createError(404, '투표 기록을 찾을 수 없습니다.');

    await pollsRepository.deleteVote(vote.id);
    return { message: '투표가 취소되었습니다.' };
  }

  async updatePollStatuses() {
    const now = new Date();
    const { count: startedCount } =
      await pollsRepository.updateStatusToInProgress(now);

    const closingPolls = await pollsRepository.findClosingPolls(now);

    let closedCount = 0;
    for (const poll of closingPolls) {
      await pollsRepository.closePoll(poll.id);

      const content = `투표 "${poll.title}"가 종료되었습니다. 결과를 확인해주세요.`;
      const adminOfId = await noticeRepository.getAdminOfIdByUserId(
        poll.authorId,
      );
      await noticeRepository.createNotice(adminOfId!.id, poll.authorId, {
        title: poll.title,
        content,
        category: 'RESIDENT_VOTE',
        isPinned: false,
      });

      closedCount++;
    }

    // TODO: 투표 시작/마감 알림 함수
    return {
      message: '투표 상태가 업데이트되었습니다.',
      startedCount,
      closedCount,
    };
  }

  private formatPollResponse(poll: {
    id: string;
    createdAt: Date;
    title: string;
    content: string;
    status: PollStatus;
    startDate: Date;
    endDate: Date;
    apartmentId: number;
    building: number | null;
    author?: { id: number; name: string };
    options?: Array<{
      id: string;
      title: string;
      _count?: { votes: number };
    }>;
    votes?: Array<{ optionId: string }>;
  }) {
    const userVote = poll.votes?.find((v) => v.optionId);

    return {
      id: poll.id,
      createdAt: poll.createdAt,
      title: poll.title,
      content: poll.content,
      status: poll.status,
      startDate: poll.startDate,
      endDate: poll.endDate,
      apartmentId: poll.apartmentId,
      building: poll.building,
      author: poll.author,
      options:
        poll.options?.map((opt) => ({
          id: opt.id,
          title: opt.title,
          voteCount: opt._count?.votes || 0,
        })) || [],
      optionIdVotedByMe: userVote?.optionId || null,
    };
  }
}

export default new PollsService();
