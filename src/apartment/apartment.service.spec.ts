// import apartmentService from './apartment.service.js';
// import apartmentRepository from '../apartment/apartment.respository.js';

// jest.mock('../apartment/apartment.respository', () => ({
//   findMany: jest.fn(),
//   count: jest.fn(),
// }));

// describe('ApartmentService - getApartments', () => {
//   beforeEach(() => {
//     jest.clearAllMocks();
//   });

//   it('should return formatted apartment list result', async () => {
//     (apartmentRepository.findMany as jest.Mock).mockResolvedValue([
//       {
//         id: 1,
//         name: 'Apt',
//         address: 'Seoul',
//         description: '',
//         officeNumber: 101,
//         buildings: [],
//         units: [],
//       },
//     ]);
//     (apartmentRepository.count as jest.Mock).mockResolvedValue(25);

//     const result = await apartmentService.getApartments(2, 10, 'test');

//     expect(apartmentRepository.findMany).toHaveBeenCalledWith(10, 10, 'test'); // skip = (2 - 1) * 10
//     expect(apartmentRepository.count).toHaveBeenCalledWith('test');

//     expect(result).toEqual({
//       data: [
//         {
//           id: 1,
//           name: 'Apt',
//           address: 'Seoul',
//           description: '',
//           officeNumber: 101,
//           buildings: [],
//           units: [],
//         },
//       ],
//       totalCount: 25,
//       page: 2,
//       limit: 10,
//       hasNext: true, // 2 * 10 < 25
//     });
//   });

//   it('should return hasNext: false when no more pages exist', async () => {
//     (apartmentRepository.findMany as jest.Mock).mockResolvedValue([]);
//     (apartmentRepository.count as jest.Mock).mockResolvedValue(20);

//     const result = await apartmentService.getApartments(2, 10);

//     expect(result.hasNext).toBe(false); // 2 * 10 == 20
//   });

//   it('should work without searchKeyword', async () => {
//     (apartmentRepository.findMany as jest.Mock).mockResolvedValue([]);
//     (apartmentRepository.count as jest.Mock).mockResolvedValue(0);

//     const result = await apartmentService.getApartments(1, 20);

//     expect(apartmentRepository.findMany).toHaveBeenCalledWith(0, 20, undefined);
//     expect(apartmentRepository.count).toHaveBeenCalledWith(undefined);

//     expect(result).toEqual({
//       data: [],
//       totalCount: 0,
//       page: 1,
//       limit: 20,
//       hasNext: false,
//     });
//   });
// });
