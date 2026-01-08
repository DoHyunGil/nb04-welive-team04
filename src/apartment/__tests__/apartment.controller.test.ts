import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';

// mock service
const mockApartmentService = {
  getApartmentById: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  getApartments: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
};

jest.unstable_mockModule('../apartment.service.js', () => ({
  __esModule: true,
  default: mockApartmentService,
}));

let apartmentController: any;

beforeAll(async () => {
  const module = await import('../apartment.controller.js');
  apartmentController = module.default;
});

// mock helpers
const createMockRequest = (
  overrides: Partial<Request> = {},
): Partial<Request> => ({
  params: {},
  query: {},
  body: {},
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

// tests
describe('ApartmentController Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getApartmentById', () => {
    it('아파트 단건 조회 성공 시 200 응답을 반환한다', async () => {
      const mockApartment = {
        id: 1,
        name: '래미안 퍼스티지',
      };

      mockApartmentService.getApartmentById.mockResolvedValue(mockApartment);

      const req = createMockRequest({
        params: { id: '1' },
      });
      const { status, json, statusMock, jsonMock } = createMockResponse();
      const res = { status, json } as unknown as Response;

      await apartmentController.getApartmentById(req as Request, res, mockNext);

      expect(mockApartmentService.getApartmentById).toHaveBeenCalledWith({
        id: 1,
      });
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ data: mockApartment });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('getApartments', () => {
    it('아파트 목록 조회 성공 시 200 응답을 반환한다', async () => {
      const mockResult = {
        data: [
          { id: '1', name: '래미안 퍼스티지' },
          { id: '2', name: '자이 아파트' },
        ],
        totalCount: 2,
        page: 1,
        limit: 20,
        hasNext: false,
      };

      mockApartmentService.getApartments.mockResolvedValue(mockResult);

      const req = createMockRequest({
        query: {
          page: '1',
          limit: '20',
          searchKeyword: '',
        },
      });
      const { status, json, statusMock, jsonMock } = createMockResponse();
      const res = { status, json } as unknown as Response;

      await apartmentController.getApartments(req as Request, res, mockNext);

      expect(mockApartmentService.getApartments).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        searchKeyword: '',
      });
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockResult);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('쿼리 없이 호출하면 기본값(page=1, limit=20)을 사용한다', async () => {
      mockApartmentService.getApartments.mockResolvedValue({
        data: [],
        totalCount: 0,
        page: 1,
        limit: 20,
        hasNext: false,
      });

      const req = createMockRequest();
      const { status, json, statusMock, jsonMock } = createMockResponse();
      const res = { status, json } as unknown as Response;

      await apartmentController.getApartments(req as Request, res, mockNext);

      expect(mockApartmentService.getApartments).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        searchKeyword: '',
      });
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
