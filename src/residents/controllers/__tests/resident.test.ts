import { prisma } from '../../../lib/prisma.js';
import { config } from 'dotenv';
import type {
  User,
  Apartment,
  Resident,
  adminOf,
} from '../../../../generated/prisma/client.js';
import residentService from '../../services/residents.service.js';
import residentRepository from '../../repositories/residents.repository.js';

config();

describe('Repository & Service Test', () => {
  let adminUser: User;
  let residentUser: User;
  let apt1: Apartment;
  let apt2: Apartment;
  let residentA: Resident;
  let residentB: Resident;
  let adminOf1: adminOf;
  let adminOf2: adminOf;
  beforeAll(async () => {
    await prisma.adminOf.deleteMany();
    await prisma.resident.deleteMany();
    await prisma.user.deleteMany();
    await prisma.apartment.deleteMany();

    console.log('Database cleaned');
    // 테스트용 데이터 삽입 -- 관리자1, 아파트2, 입주민2
    adminUser = await prisma.user.create({
      data: {
        username: '관리자',
        password: '1234',
        email: 'admin@test.com',
        contact: '010-1111-2222',
        name: '테스트 관리자',
        role: 'ADMIN',
        avatar: '',
        joinStatus: 'PENDING',
        isActive: true,
      },
    });
    residentUser = await prisma.user.create({
      data: {
        username: '입주민',
        password: '1234',
        email: 'resident@test.com',
        contact: '010-2222-3333',
        name: '테스트 입주민',
        role: 'RESIDENT',
        avatar: '',
        joinStatus: 'PENDING',
        isActive: true,
      },
    });
    adminOf1 = await prisma.adminOf.create({
      data: {
        userId: adminUser.id,
        id: adminUser.id,
      },
    });
    adminOf2 = await prisma.adminOf.create({
      data: {
        userId: residentUser.id,
        id: residentUser.id,
      },
    });
    apt1 = await prisma.apartment.create({
      data: {
        name: '아파트1',
        address: '서울시 강남구',
        description: '테스트 아파트',
        officeNumber: 4,
        buildings: [1, 2, 3],
        units: [101, 102, 103],
        adminOfId: adminOf1.id,
      },
    });
    apt2 = await prisma.apartment.create({
      data: {
        name: '아파트2',
        address: '서울시 서초구',
        description: '테스트 아파트2',
        officeNumber: 3,
        buildings: [1, 2],
        units: [201, 202, 203],
        adminOfId: adminOf2.id,
      },
    });

    residentA = await prisma.resident.create({
      data: {
        name: '입주민1',
        email: 'res1@test.com',
        contact: '010-0000-0001',
        building: 1,
        unit: 101,
        isHouseholder: true,
        apartmentId: apt1.id,
      },
    });

    residentB = await prisma.resident.create({
      data: {
        name: '입주민2',
        email: 'res2@test.com',
        contact: '010-0000-0002',
        building: 1,
        unit: 102,
        isHouseholder: false,
        apartmentId: apt2.id,
      },
    });
  });
  test('Repository.getResidents → apt1 입주민 조회', async () => {
    const result = await residentRepository.getResidents(
      adminUser.id,
      10,
      1,
      {},
    );

    expect(result.length).toBe(1);
    const first = result[0]!;
    expect(first.name).toBe('입주민1');
  });

  test('Service.getResidents → 입주민 조회 + 반환 형식 검증', async () => {
    const result = await residentService.getResidents(adminUser.id, 10, 1);

    expect(result.data.length).toBe(1);
    expect(result.total).toBe(1);
  });

  test('Service.createResidents → 신규 입주민 등록', async () => {
    const newResident = await residentService.createResidents(adminUser.id, {
      name: '신규 입주민',
      email: 'new@test.com',
      contact: '010-3333-4444',
      building: 1,
      unit: 201,
      isHouseholder: false,
      apartmentId: apt1.id,
    });

    expect(newResident.name).toBe('신규 입주민');
  });

  test('Service.getResidentsById → 특정 입주민 조회', async () => {
    const result = await residentService.getResidentsById(
      adminUser.id,
      residentA.id,
    );

    expect(result.name).toBe('입주민1');
    expect(result.unit).toBe(101);
  });

  test('Service.updateResidents → 입주민 정보 수정', async () => {
    const updated = await residentService.updateResidents(
      adminUser.id,
      residentA.id,
      {
        contact: '010-9999-8888',
        building: 2,
        unit: 202,
      },
    );

    expect(updated.contact).toBe('010-9999-8888');
    expect(updated.building).toBe(2);
    expect(updated.unit).toBe(202);
  });

  test('Service.deleteResidentById → 입주민 삭제', async () => {
    await residentService.deleteResidentById(adminUser.id, residentB.id);
    const deleted = await prisma.resident.findUnique({
      where: { id: residentB.id },
    });
    expect(deleted).toBeNull();
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
