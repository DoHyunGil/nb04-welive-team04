// import { jest } from '@jest/globals';
// import ApartmentController from './apartment.controller.js';
// import apartmentService from './apartment.service.js';

// describe('getApartments Controller', () => {
//   const mockReq: any = {
//     query: {},
//   };
//   const mockRes: any = {
//     status: jest.fn().mockReturnThis(),
//     json: jest.fn(),
//   };
//   const mockNext = jest.fn();

//   beforeEach(() => {
//     jest.clearAllMocks();
//   });

//   it('should call apartmentService.getApartments with default params', async () => {
//     const mockResult = {
//       data: [],
//       totalCount: 0,
//       page: 1,
//       limit: 20,
//       hasNext: false,
//     };
//     jest.spyOn(apartmentService, 'getApartments').mockResolvedValue(mockResult);

//     await getApartments(mockReq, mockRes, mockNext);

//     expect(apartmentService.getApartments).toHaveBeenCalledWith(1, 20, '');
//     expect(mockRes.status).toHaveBeenCalledWith(200);
//     expect(mockRes.json).toHaveBeenCalledWith(mockResult);
//   });

//   it('should call apartmentService.getApartments with query params', async () => {
//     mockReq.query = { page: '3', limit: '10', searchKeyword: 'test' };
//     const mockResult = {
//       data: [],
//       totalCount: 0,
//       page: 1,
//       limit: 20,
//       hasNext: false,
//     };

//     jest.spyOn(apartmentService, 'getApartments').mockResolvedValue(mockResult);

//     await getApartments(mockReq, mockRes, mockNext);

//     expect(apartmentService.getApartments).toHaveBeenCalledWith(3, 10, 'test');
//     expect(mockRes.status).toHaveBeenCalledWith(200);
//     expect(mockRes.json).toHaveBeenCalledWith(mockResult);
//   });

//   it('should call next(error) when service throws', async () => {
//     const mockError = new Error('Service error');
//     jest.spyOn(apartmentService, 'getApartments').mockRejectedValue(mockError);

//     await getApartments(mockReq, mockRes, mockNext);

//     expect(mockNext).toHaveBeenCalledWith(mockError);
//   });
// });
