import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';

const mockComplaintsService = {
  createComplaint: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  getComplaints: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  getComplaintById: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  updateComplaint: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  deleteComplaint: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  updateComplaintStatus: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
};

jest.unstable_mockModule('../../services/complaint.service.js', () => ({
  __esModule: true,
  default: mockComplaintsService,
}));

const { default: complaintController } =
  await import('../complaint.controller.js');

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

describe('ComplaintController - 단위 테스트', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('createComplaint', () => {
    it('민원 생성에 성공하면 201 상태코드 반환한다', async () => {
      const mockComplaint = {
        title: '테스트 제목',
        content: '테스트 내용',
        isPublic: true,
        apartmentId: 1,
      };

      const mockRequest = createMockRequest({
        body: {
          title: '테스트 제목',
          content: '테스트 내용',
          isPublic: true,
          apartmentId: 1,
        },
      });

      const { status, json, statusMock, jsonMock } = createMockResponse();
      mockComplaintsService.createComplaint.mockResolvedValue(mockComplaint);
      await complaintController.createComplaint(
        mockRequest as Request,
        { status, json } as unknown as Response,
        mockNext,
      );

      expect(mockComplaintsService.createComplaint).toHaveBeenCalledWith(
        1,
        mockRequest.body,
      );
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(mockComplaint);
    });

    it('사용자 정보가 없으면 401 에러를 반환한다', async () => {
      const mockRequest = createMockRequest({
        body: {
          title: '테스트 제목',
          content: '테스트 내용',
          isPublic: true,
          apartmentId: 1,
        },
        user: undefined,
      });
      noUser(mockRequest, complaintController.createComplaint);
      expect(mockComplaintsService.createComplaint).not.toHaveBeenCalled();
    });
    it('서비스에서 에러가 발생하면 next를 호출한다', async () => {
      const error = new Error('Service Error');
      const mockRequest = createMockRequest({
        body: {
          title: '테스트 제목',
          content: '테스트 내용',
          isPublic: true,
          apartmentId: 1,
        },
      });
      mockComplaintsService.createComplaint.mockRejectedValue(error);
      serverError(mockRequest, complaintController.createComplaint, error);
    });
  });
  describe('getComplaints', () => {
    it('민원 목록 조회에 성공하면 200 상태코드를 반환한다', async () => {
      const mockComplaints = {
        data: [
          {
            id: 1,
            title: '제목',
            content: '내용',
            apartmentId: 1,
            commentCount: 0,
          },
        ],
        totalCount: 1,
        page: 1,
        limit: 10,
        hasNext: false,
      };
      const mockRequest = createMockRequest({});
      const { status, json, statusMock, jsonMock } = createMockResponse();
      mockComplaintsService.getComplaints.mockResolvedValue(mockComplaints);
      await complaintController.getComplaints(
        mockRequest as Request,
        { status, json } as unknown as Response,
        mockNext,
      );

      expect(mockComplaintsService.getComplaints).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
      });
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockComplaints);
    });
    it('서비스에서 에러가 발생하면 next를 호출한다', async () => {
      const error = new Error('Service Error');
      const mockRequest = createMockRequest({});
      mockComplaintsService.getComplaints.mockRejectedValue(error);
      serverError(mockRequest, complaintController.getComplaints, error);
    });
  });

  describe('getComplaintById', () => {
    it('민원 상세 조회에 성공하면 200 상태코드를 반환한다', async () => {
      const mockComplaint = {
        id: 1,
        title: '테스트 제목',
        content: '테스트 내용',
        isPublic: false,
        apartmentId: 1,
      };
      const mockRequest = createMockRequest({
        params: { id: '1' },
        user: { id: 1, email: 'test@test.com', role: 'RESIDENT' },
      });
      const { status, json, statusMock, jsonMock } = createMockResponse();
      mockComplaintsService.getComplaintById.mockResolvedValue(mockComplaint);
      await complaintController.getComplaintById(
        mockRequest as Request,
        { status, json } as unknown as Response,
        mockNext,
      );

      expect(mockComplaintsService.getComplaintById).toHaveBeenCalledWith(1, 1);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockComplaint);
    });
    it('사용자 정보가 없으면 401 에러를 반환한다', async () => {
      const mockRequest = createMockRequest({
        params: { id: '1' },
        user: undefined,
      });
      noUser(mockRequest, complaintController.getComplaintById);
      expect(mockComplaintsService.getComplaintById).not.toHaveBeenCalled();
    });
    it('서비스에서 에러가 발생하면 next를 호출한다', async () => {
      const error = new Error('Service Error');
      const mockRequest = createMockRequest({
        params: { id: '1' },
      });
      mockComplaintsService.getComplaintById.mockRejectedValue(error);
      serverError(mockRequest, complaintController.getComplaintById, error);
    });
  });

  describe('updateComplaint', () => {
    it('민원 수정에 성공하면 204 상태코드를 반환한다', async () => {
      const mockRequest = createMockRequest({
        params: { id: '1' },
        body: {
          title: '수정된 제목',
          content: '수정된 내용',
        },
      });
      const { status, send, statusMock, sendMock } = createMockResponse();
      mockComplaintsService.updateComplaint.mockResolvedValue({});
      await complaintController.updateComplaint(
        mockRequest as Request,
        { status, send } as unknown as Response,
        mockNext,
      );

      expect(mockComplaintsService.updateComplaint).toHaveBeenCalledWith(
        1,
        1,
        mockRequest.body,
      );
      expect(statusMock).toHaveBeenCalledWith(204);
      expect(sendMock).toHaveBeenCalled();
    });
    it('사용자 정보가 없으면 401 에러를 반환한다', async () => {
      const mockRequest = createMockRequest({
        params: { id: '1' },
        body: {
          title: '수정된 제목',
          content: '수정된 내용',
        },
        user: undefined,
      });
      noUser(mockRequest, complaintController.updateComplaint);
    });
    it('서비스에서 에러가 발생하면 next를 호출한다', async () => {
      const error = new Error('Service Error');
      const mockRequest = createMockRequest({
        params: { id: '1' },
        body: {
          title: '수정된 제목',
          content: '수정된 내용',
        },
      });
      mockComplaintsService.updateComplaint.mockRejectedValue(error);
      serverError(mockRequest, complaintController.updateComplaint, error);
    });
  });

  describe('deleteComplaint', () => {
    it('민원 삭제에 성공하면 204 상태코드를 반환한다', async () => {
      const mockRequest = createMockRequest({
        params: { id: '1' },
      });
      const { status, send, statusMock, sendMock } = createMockResponse();
      mockComplaintsService.deleteComplaint.mockResolvedValue({});
      await complaintController.deleteComplaint(
        mockRequest as Request,
        { status, send } as unknown as Response,
        mockNext,
      );
      expect(mockComplaintsService.deleteComplaint).toHaveBeenCalledWith(1, 1);
      expect(statusMock).toHaveBeenCalledWith(204);
      expect(sendMock).toHaveBeenCalled();
    });
    it('사용자 정보가 없으면 401 에러를 반환한다', async () => {
      const mockRequest = createMockRequest({
        params: { id: '1' },
        user: undefined,
      });
      noUser(mockRequest, complaintController.deleteComplaint);
    });
    it('서비스에서 에러가 발생하면 next를 호출한다', async () => {
      const error = new Error('Service Error');
      const mockRequest = createMockRequest({
        params: { id: '1' },
      });
      mockComplaintsService.deleteComplaint.mockRejectedValue(error);
      serverError(mockRequest, complaintController.deleteComplaint, error);
    });
  });

  describe('updateComplaintStatus', () => {
    it('관리자 전용) 민원 상태 수정에 성공하면 204 상태코드를 반환한다', async () => {
      const mockRequest = createMockRequest({
        params: { id: '1' },
        body: { status: 'IN_PROGRESS' },
      });
      const { status, send, statusMock, sendMock } = createMockResponse();
      mockComplaintsService.updateComplaintStatus.mockResolvedValue({});
      await complaintController.updateComplaintStatus(
        mockRequest as Request,
        { status, send } as unknown as Response,
        mockNext,
      );
      expect(mockComplaintsService.updateComplaintStatus).toHaveBeenCalledWith(
        1,
        1,
        'IN_PROGRESS',
      );
      expect(statusMock).toHaveBeenCalledWith(204);
      expect(sendMock).toHaveBeenCalled();
    });
    it('사용자 정보가 없으면 401 에러를 반환한다', async () => {
      const mockRequest = createMockRequest({
        params: { id: '1' },
        body: { status: 'IN_PROGRESS' },
        user: undefined,
      });
      noUser(mockRequest, complaintController.updateComplaintStatus);
    });
    it('서비스에서 에러가 발생하면 next를 호출한다', async () => {
      const error = new Error('Service Error');
      const mockRequest = createMockRequest({
        params: { id: '1' },
        body: { status: 'IN_PROGRESS' },
      });
      mockComplaintsService.updateComplaintStatus.mockRejectedValue(error);
      serverError(
        mockRequest,
        complaintController.updateComplaintStatus,
        error,
      );
    });
  });
});
