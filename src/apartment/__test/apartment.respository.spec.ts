// import { jest } from '@jest/globals';
// import ApartmentRepository from '../apartment/apartment.respository.js';
// import { prisma } from '../lib/prisma.js';

// jest.mock('../lib/prisma.js', () => ({
//   prisma: {
//     apartment: {
//       findMany: jest.fn(),
//       findUnique: jest.fn(),
//       count: jest.fn(),
//     },
//   },
// }));

// describe('ApartmentRepository', () => {
//   beforeEach(() => {
//     jest.clearAllMocks();
//   });

//   describe('findMany', () => {
//     it('should call prisma.apartment.findMany without searchKeyword', async () => {
//       const mockResult: any[] = [];
//       (prisma.apartment.findMany as jest.Mock).mockResolvedValue(mockResult);

//       const result = await ApartmentRepository.findMany(0, 20);

//       expect(prisma.apartment.findMany).toHaveBeenCalledWith({
//         where: {},
//         skip: 0,
//         take: 20,
//         orderBy: { createdAt: 'desc' },
//         select: {
//           id: true,
//           name: true,
//           address: true,
//           description: true,
//           officeNumber: true,
//           buildings: true,
//           units: true,
//         },
//       });

//       expect(result).toBe(mockResult);
//     });

//     it('should call prisma.apartment.findMany with searchKeyword', async () => {
//       const mockResult = [{ id: 1 }];
//       (prisma.apartment.findMany as jest.Mock).mockResolvedValue(mockResult);

//       const result = await ApartmentRepository.findMany(0, 20, 'apt');

//       expect(prisma.apartment.findMany).toHaveBeenCalledWith(
//         expect.objectContaining({
//           where: {
//             OR: [
//               { name: { contains: 'apt', mode: 'insensitive' } },
//               { address: { contains: 'apt', mode: 'insensitive' } },
//               { description: { contains: 'apt', mode: 'insensitive' } },
//             ],
//           },
//           skip: 0,
//           take: 20,
//         }),
//       );

//       expect(result).toBe(mockResult);
//     });
//   });

//   describe('findById', () => {
//     it('should call prisma.apartment.findUnique', async () => {
//       const mockResult = { id: 1 };
//       (prisma.apartment.findUnique as jest.Mock).mockResolvedValue(mockResult);

//       const result = await ApartmentRepository.findById(1);

//       expect(prisma.apartment.findUnique).toHaveBeenCalledWith({
//         where: { id: 1 },
//       });

//       expect(result).toBe(mockResult);
//     });
//   });

//   describe('count', () => {
//     it('should call prisma.apartment.count without searchKeyword', async () => {
//       (prisma.apartment.count as jest.Mock).mockResolvedValue(0);

//       await ApartmentRepository.count();

//       expect(prisma.apartment.count).toHaveBeenCalledWith({ where: {} });
//     });

//     it('should call prisma.apartment.count with searchKeyword', async () => {
//       (prisma.apartment.count as jest.Mock).mockResolvedValue(1);

//       await ApartmentRepository.count('test');

//       expect(prisma.apartment.count).toHaveBeenCalledWith(
//         expect.objectContaining({
//           where: {
//             OR: [
//               { name: { contains: 'test', mode: 'insensitive' } },
//               { address: { contains: 'test', mode: 'insensitive' } },
//               { description: { contains: 'test', mode: 'insensitive' } },
//             ],
//           },
//         }),
//       );
//     });
//   });
// });
