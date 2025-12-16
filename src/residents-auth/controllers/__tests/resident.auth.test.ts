import { prisma } from '../../../lib/prisma.js';
import { config } from 'dotenv';
import type {
  User,
  Apartment,
  Resident,
  adminOf,
} from '../../../../generated/prisma/client.js';
import residentAuthService from '../../services/residents.auth.service.js';
import residentAuthRepository from '../../repositories/residents.auth.repository.js';

config();

// 테스트 시나리오 1. 같은 아파트의 어드민 유저만 입주민 계정을 조회 할 수 있다.
// 테스트 시나리오 2. 같은 아파트의 어드민 유저만 입주민 계정을 승인, 거절 할 수 있다.
// 테스트 시나리오 3. 이미 존재하는 이메일의 레지던트의 경우 이메일이 동일하면 joinStatus가 자동 APPROVE로 업데이트 한다.
// 테스트 시나리오 4. 레지던트에 존재하지 않는 이메일의 경우 새로운 입주민 생성 > 유저 생성 > 입주민에 유저 ID 업데이트 순으로 진행된다.

describe('Resident.Auth Repository & Service Test', () => {
  let adminUser1: User;
  let adminUser2: User;
  let residentUser1: User;
  let residentUser2: User;
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
    adminUser1 = await prisma.user.create({
      data: {
        username: '관리자1',
        password: '1234',
        email: 'admin1@test.com',
        contact: '010-1111-1112',
        name: '테스트 관리자1',
        role: 'ADMIN',
        avatar: '',
        joinStatus: 'APPROVED',
        isActive: true,
      },
    });
    adminUser2 = await prisma.user.create({
      data: {
        username: '관리자2',
        password: '1234',
        email: 'admin2@test.com',
        contact: '010-1111-3333',
        name: '테스트 관리자2',
        role: 'ADMIN',
        avatar: '',
        joinStatus: 'APPROVED',
        isActive: true,
      },
    });
    residentUser1 = await prisma.user.create({
      data: {
        username: '입주민1',
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
        userId: adminUser1.id,
        id: adminUser1.id,
      },
    });
    adminOf2 = await prisma.adminOf.create({
      data: {
        userId: adminUser2.id,
        id: adminUser2.id,
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
        email: 'resident@test.com',
        contact: '010-0000-0001',
        building: 1,
        unit: 101,
        isHouseholder: true,
        apartmentId: apt1.id,
        userId: residentUser1.id,
      },
    });
    residentB = await prisma.resident.create({
      data: {
        name: '입주민2',
        email: 'resident2@test.com',
        contact: '010-0000-0001',
        building: 1,
        unit: 101,
        isHouseholder: true,
        apartmentId: apt1.id,
      },
    });
  });
  test('Repository.getResidentsAuth → apt1 입주민 계정 조회', async () => {
    const result = await residentAuthRepository.getResidentsAuth(
      adminUser1.id,
      1,
      10,
      {},
    );

    expect(result.length).toBe(1);
    const first = result[0]!;
    expect(first.name).toBe('입주민1');
  });

  test('Service.getResidentsAuth → 입주민 조회 + 반환 형식 검증', async () => {
    const result = await residentAuthService.getResidentsAuth(
      adminUser1.id,
      1,
      10,
    );

    expect(result.data.length).toBe(1);
    expect(result.total).toBe(1);
  });

  test('Service.createResidents → 신규 입주민 등록', async () => {
    const newResident = await residentAuthService.createResidentsAuth(
      adminUser1.id,
      {
        name: '신규 입주민',
        email: 'new@test.com',
        contact: '010-3333-4444',
        building: 1,
        unit: 201,
        isHouseholder: false,
        apartmentId: apt1.id,
      },
    );

    expect(newResident.name).toBe('신규 입주민');
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
