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
});
