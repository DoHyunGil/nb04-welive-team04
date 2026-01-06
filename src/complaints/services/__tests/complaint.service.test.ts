import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { _custom } from 'zod/v4/core';

type AsyncFn = (...args: unknown[]) => Promise<unknown>;
const mockFn = () => jest.fn<AsyncFn>();

const mockComplaintRepository = {
  createComplaint: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  getComplaints: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  getComplaintCount: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  getComplaintById: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  incrementViewCount: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  updateComplaint: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  deleteComplaint: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  updateComplaintStatus: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  checkUserRole: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
};

jest.unstable_mockModule('../../repositories/complaint.repository.js', () => ({
  __esModule: true,
  default: mockComplaintRepository,
}));

const { default: complaintService } = await import('../complaint.service.js');

const admin = {
  id: 1,
  userId: 1,
  apartment: { id: 1 },
};

// 민원 만드는 주민
const resident1 = {
  id: 1,
  userId: 2,
  apartmentId: 1,
  building: 1,
  unit: 101,
  isHouseholder: true,
};

// 비공개 글 조회용 주민
const resident2 = {
  id: 2,
  userId: 3,
  apartmentId: 1,
  building: 1,
  unit: 102,
  isHouseholder: true,
};

// 공개글
const mockComplaint = {
  title: '테스트 민원 제목',
  content: '테스트 민원 내용',
  isPublic: true,
  apartmentId: 1,
};

describe('ComplaintService - 단위 테스트', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createComplaint', () => {
    it('입주민이 민원을 생성할 수 있다', async () => {
      const mockCreatedComplaint = {
        id: 1,
        complainantId: 2,
        ...mockComplaint,
      };
      mockComplaintRepository.createComplaint.mockResolvedValue(
        mockCreatedComplaint,
      );
      const result = await complaintService.createComplaint(2, mockComplaint);
      expect(result).toBeDefined();
      expect(result.title).toBe('테스트 민원 제목');
      expect(mockComplaintRepository.createComplaint).toHaveBeenCalledTimes(1);
    });
  });
  describe('getComplaints', () => {
    it('민원 목록을 조회할 수 있다', async () => {
      const mockList = [
        {
          id: 1,
          complainantId: 2,
          ...mockComplaint,
          _count: { comments: 0 },
        },
        {
          id: 2,
          complainantId: 2,
          ...mockComplaint,
          _count: { comments: 0 },
        },
      ];
      mockComplaintRepository.getComplaints.mockResolvedValue(mockList);
      mockComplaintRepository.getComplaintCount.mockResolvedValue(2);

      const result = await complaintService.getComplaints({
        page: 1,
        limit: 20,
      });

      expect(result.data).toHaveLength(2);
      expect(result.totalCount).toBe(2);
    });
    it('상태별 필터링이 가능하다', async () => {
      mockComplaintRepository.getComplaints.mockResolvedValue([]);
      mockComplaintRepository.getComplaintCount.mockResolvedValue(1);

      await complaintService.getComplaints({
        page: 1,
        limit: 20,
        status: 'PENDING',
      });
      expect(mockComplaintRepository.getComplaints).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'PENDING',
        }),
      );
      expect(mockComplaintRepository.getComplaintCount).toHaveBeenCalledWith(
        undefined,
        'PENDING',
        undefined,
      );
    });
  });
  describe('getComplaintById', () => {
    const publicComplaint = {
      id: 1,
      ...mockComplaint,
      complainant: { id: 2 },
      _count: { comments: 0 },
    };
    const privateComplaint = {
      id: 2,
      title: '비공개 테스트 민원 제목',
      content: '비공개 테스트 민원 내용',
      isPublic: false,
      apartmentId: 1,
      complainant: { id: 2 },
      _count: { comments: 0 },
    };
    it('공개글은 모두 조회할 수 있다', async () => {
      mockComplaintRepository.getComplaintById.mockResolvedValue(
        publicComplaint,
      );
      mockComplaintRepository.checkUserRole.mockResolvedValue({ role: 'USER' });

      const result = await complaintService.getComplaintById(1, 2);

      expect(result.isPublic).toBe(true);
      expect(result.id).toBe(1);
      expect(mockComplaintRepository.incrementViewCount).toHaveBeenCalledWith(
        1,
      );
    });
    it('작성자는 비공개 글을 조회할 수 있다', async () => {
      mockComplaintRepository.getComplaintById.mockResolvedValue(
        privateComplaint,
      );
      mockComplaintRepository.checkUserRole.mockResolvedValue({ role: 'USER' });

      const result = await complaintService.getComplaintById(2, 2);

      expect(result.isPublic).toBe(false);
      expect(result.id).toBe(2);
      expect(mockComplaintRepository.incrementViewCount).toHaveBeenCalledWith(
        2,
      );
    });
    it('존재하지 않은 민원 조회 시 404 에러를 반환한다', async () => {
      mockComplaintRepository.getComplaintById.mockResolvedValue(null);
      await expect(complaintService.getComplaintById(1, 2)).rejects.toThrow(
        '해당 민원이 존재하지 않습니다.',
      );
    });
    it('존재하지 않은 유저라면 404 에러를 반환한다', async () => {
      mockComplaintRepository.getComplaintById.mockResolvedValue(
        publicComplaint,
      );
      mockComplaintRepository.checkUserRole.mockResolvedValue(null);
      await expect(complaintService.getComplaintById(1, 99)).rejects.toThrow(
        '존재하지 않은 유저입니다.',
      );
    });
    it('권한 없는 유저가 비공개글 조회 시 403 에러를 반환한다', async () => {
      mockComplaintRepository.getComplaintById.mockResolvedValue(
        privateComplaint,
      );
      mockComplaintRepository.checkUserRole.mockResolvedValue({ role: 'USER' });
      await expect(complaintService.getComplaintById(2, 3)).rejects.toThrow(
        '권한이 없습니다.',
      );
    });
    it('관리자는 비공개 글도 조회할 수 있다', async () => {
      mockComplaintRepository.getComplaintById.mockResolvedValue(
        privateComplaint,
      );
      mockComplaintRepository.checkUserRole.mockResolvedValue({
        role: 'ADMIN',
      });

      const result = await complaintService.getComplaintById(2, 1);

      expect(result.isPublic).toBe(false);
      expect(result.id).toBe(2);
      expect(mockComplaintRepository.incrementViewCount).toHaveBeenCalledWith(
        2,
      );
    });
  });
  describe('updateComplaint', () => {
    const complaint = {
      id: 1,
      ...mockComplaint,
      complainant: { id: 2 },
      status: 'PENDING',
    };
    const updateBody = {
      title: '제목 수정',
      content: '내용 수정',
    };
    const updatedComplaint = {
      ...complaint,
      ...updateBody,
    };
    it('작성자는 본인 글을 수정할 수 있다', async () => {
      mockComplaintRepository.getComplaintById.mockResolvedValue(complaint);
      mockComplaintRepository.updateComplaint.mockResolvedValue(
        updatedComplaint,
      );

      const result = await complaintService.updateComplaint(2, 1, updateBody);

      expect(result.title).toBe('제목 수정');
      expect(result.content).toBe('내용 수정');
      expect(mockComplaintRepository.updateComplaint).toHaveBeenCalledWith(
        1,
        updateBody,
      );
    });
    it('존재하지 않은 민원 수정 시 404 에러를 반환한다', async () => {
      mockComplaintRepository.getComplaintById.mockResolvedValue(null);
      await expect(
        complaintService.updateComplaint(2, 99, updateBody),
      ).rejects.toThrow('해당 민원이 존재하지 않습니다.');
    });
    it('작성자가 아닌 유저가 수정 시 403 에러를 반환한다', async () => {
      mockComplaintRepository.getComplaintById.mockResolvedValue(complaint);
      mockComplaintRepository.updateComplaint.mockResolvedValue(
        updatedComplaint,
      );
      await expect(
        complaintService.updateComplaint(3, 1, updateBody),
      ).rejects.toThrow('작성자만 수정 가능합니다.');
    });
    it('수정할 민원의 상태가 "처리 전"이 아닐 시 400 에러를 반환한다', async () => {
      const resolvedComplaint = {
        id: 2,
        ...mockComplaint,
        complainant: { id: 2 },
        status: 'RESOLVED',
      };
      mockComplaintRepository.getComplaintById.mockResolvedValue(
        resolvedComplaint,
      );
      await expect(
        complaintService.updateComplaint(2, 2, updateBody),
      ).rejects.toThrow('처리 전일 때만 수정 가능합니다.');
      expect(mockComplaintRepository.updateComplaint).not.toHaveBeenCalled();
    });
  });
  describe('deleteComplaint', () => {
    const complaint = {
      id: 1,
      ...mockComplaint,
      complainant: { id: 2 },
      status: 'PENDING',
    };
    it('작성자는 본인 글을 삭제할 수 있다', async () => {
      mockComplaintRepository.getComplaintById.mockResolvedValue(complaint);
      mockComplaintRepository.deleteComplaint.mockResolvedValue(undefined);

      await complaintService.deleteComplaint(2, 1);
      expect(mockComplaintRepository.deleteComplaint).toHaveBeenCalledWith(1);
    });
    it('존재하지 않은 민원 삭제 시 404 에러를 반환한다', async () => {
      mockComplaintRepository.getComplaintById.mockResolvedValue(null);
      await expect(complaintService.deleteComplaint(2, 99)).rejects.toThrow(
        '해당 민원이 존재하지 않습니다.',
      );
    });
    it('작성자가 아닌 유저가 삭제 시 403 에러를 반환한다', async () => {
      mockComplaintRepository.getComplaintById.mockResolvedValue(complaint);
      mockComplaintRepository.deleteComplaint.mockResolvedValue(undefined);

      await expect(complaintService.deleteComplaint(3, 1)).rejects.toThrow(
        '작성자만 삭제 가능합니다.',
      );
    });
    it('삭제할 민원의 상태가 "처리 전"이 아닐 시 400 에러를 반환한다', async () => {
      const resolvedComplaint = {
        id: 2,
        ...mockComplaint,
        complainant: { id: 2 },
        status: 'RESOLVED',
      };
      mockComplaintRepository.getComplaintById.mockResolvedValue(
        resolvedComplaint,
      );
      await expect(complaintService.deleteComplaint(2, 2)).rejects.toThrow(
        '처리 전일 때만 삭제 가능합니다.',
      );
    });
  });
  describe('updateComplaintStatus', () => {
    it('관리자는 민원의 상태를 바꿀 수 있다', async () => {
      const complaint = {
        id: 1,
        ...mockComplaint,
        complainant: { id: 2 },
        status: 'PENDING',
      };
      mockComplaintRepository.checkUserRole.mockResolvedValue({
        role: 'ADMIN',
      });
      mockComplaintRepository.getComplaintById.mockResolvedValue(complaint);
      mockComplaintRepository.updateComplaintStatus.mockResolvedValue({
        ...complaint,
        status: 'RESOLVED',
      });

      const result = await complaintService.updateComplaintStatus(
        1,
        1,
        'RESOLVED',
      );

      expect(result.status).toBe('RESOLVED');
      expect(
        mockComplaintRepository.updateComplaintStatus,
      ).toHaveBeenCalledWith(1, 'RESOLVED');
    });
    it('존재하지 않은 유저일 경우 404 에러를 반환한다', async () => {
      mockComplaintRepository.checkUserRole.mockResolvedValue(null);
      await expect(
        complaintService.updateComplaintStatus(99, 1, 'RESOLVED'),
      ).rejects.toThrow('존재하지 않는 user입니다.');
    });
    it('관리자 계정이 아닌 경우 403 에러를 반환한다', async () => {
      mockComplaintRepository.checkUserRole.mockResolvedValue({ role: 'USER' });
      await expect(
        complaintService.updateComplaintStatus(2, 1, 'RESOLVED'),
      ).rejects.toThrow('관리자 계정이 아닙니다.');
    });
    it('존재하지 않은 민원일 경우 404 에러를 반환한다', async () => {
      mockComplaintRepository.checkUserRole.mockResolvedValue({
        role: 'ADMIN',
      });
      mockComplaintRepository.getComplaintById.mockResolvedValue(null);
      await expect(
        complaintService.updateComplaintStatus(1, 99, 'RESOLVED'),
      ).rejects.toThrow('해당 민원이 존재하지 않습니다.');
    });
  });
});
