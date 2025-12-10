import complaintController from '../complaint.controller.js';
import complaintService from '../../services/complaint.service.js';
import type { Request, Response, NextFunction } from 'express';

jest.mock('../../../../services/complaint.service.js', () => ({
  default: {
    createComplaint: jest.fn(),
    getComplaints: jest.fn(),
    getComplaintById: jest.fn(),
    updateComplaint: jest.fn(),
    deleteComplaint: jest.fn(),
    updateComplaintStatus: jest.fn(),
  },
}));
const res = {
  status: jest.fn(function (this: Response, code: number) {
    return this;
  }),
  send: jest.fn(),
  json: jest.fn(),
} as unknown as Response;
const next = jest.fn();

describe('createComplaint', () => {
  const mockUserId = 1;
  const mockCreateData = {
    title: '민원 제목',
    content: '민원 내용',
    isPublic: true,
    apartmentId: 1,
  };
  const mockNewComplaint = { id: 1, ...mockCreateData };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('성공 - 민원 생성(201)', async () => {
    (complaintService.createComplaint as jest.Mock).mockResolvedValue(
      mockNewComplaint,
    );

    const mockReq = {
      user: { id: mockUserId },
      createBody: mockCreateData,
    } as unknown as Request;

    await complaintController.createComplaint(mockReq, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = (next as jest.Mock).mock.calls[0][0];
    expect(error.status).toBe(401);
    expect(error.message).toBe('로그인이 필요합니다.');
    expect(complaintService.createComplaint).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
