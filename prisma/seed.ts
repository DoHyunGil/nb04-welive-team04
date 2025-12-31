// prisma/seed.ts
import { prisma } from '../src/lib/prisma.js';
import { hashPassword } from '../src/lib/password.js';
import { Role, joinStatus } from '../generated/prisma/client.js';

async function main() {
  console.log("Seeding Apartment...");

  const buildingNumberFrom = 1;
  const buildingNumberTo = 10;
  const floorCountPerBuilding = 15;
  const unitCountPerFloor = 4;
  // 슈퍼 관리자 계정 생성
  const existingAdmin = await prisma.user.findFirst({
    where: { username: 'superadmin' },
  });

  if (existingAdmin) {
    console.log('✅ 슈퍼 관리자 계정이 이미 존재합니다:', existingAdmin.email);
  } else {
    const superAdmin = await prisma.user.create({
      data: {
        username: 'superadmin',
        password: await hashPassword('superadmin123!'),
        email: 'superadmin@welive.com',
        contact: '010-0000-0000',
        name: '슈퍼관리자',
        role: Role.SUPER_ADMIN,
        avatar: null,
        joinStatus: joinStatus.APPROVED,
        isActive: true,
      },
    });

    console.log('✅ 슈퍼 관리자 계정 생성 완료:', superAdmin.email);
  }

  //#region DUMMY(참고용으로 쓰시라고 남겨둘게요)

  const buildings = Array.from(
    { length: buildingNumberTo - buildingNumberFrom + 1 },
    (_, i) => buildingNumberFrom + i,
  );

  const units: number[] = [];
  for (let floor = 1; floor <= floorCountPerBuilding; floor++) {
    for (let num = 1; num <= unitCountPerFloor; num++) {
      const unit = floor * 100 + num;
      units.push(unit);
    }
  }

  // --- 첫 번째 아파트 ---
  const apartment1 = await prisma.apartment.create ({
    data: {
      name: '래미안 퍼스티지',
      address: '서울시 강남구 테헤란로 100',
      description: '래미안 퍼스티지 아파트 단지입니다.',
      officeNumber: '02-3000-0000',
      buildingNumberFrom,
      buildingNumberTo,
      floorCountPerBuilding,
      unitCountPerFloor,
      buildings,
      units,
      adminOf: {
        create: {
          name: '래미안 퍼스티지 관리사무소',
          address: '서울시 강남구 테헤란로 100',
          description: '래미안 퍼스티지 관리사무소',
          officeNumber: '02-3000-0000',
          buildingNumberFrom,
          buildingNumberTo,
          floorCountPerBuilding,
          unitCountPerFloor,
          user: {
            create: {
              username: 'admin',
              password: await hashPassword('admin1234!'),
              email: 'admin@test.com',
              contact: '010-1111-2222',
              name: '관리자',
              role: Role.ADMIN,
              avatar: null,
              joinStatus: joinStatus.PENDING,
              isActive: true,
            },
          },
        },
      },
    },
  });

  // --- 두 번째 아파트 추가 ---
  const apartment2 = await prisma.apartment.create ({
    data: {
      name: '자이 아파트',
      address: '서울시 송파구 올림픽로 200',
      description: '자이 아파트 단지입니다.',
      officeNumber: '02-4000-0000',
      buildingNumberFrom,
      buildingNumberTo,
      floorCountPerBuilding,
      unitCountPerFloor,
      buildings,
      units,
      adminOf: {
        create: {
          name: '자이 아파트 관리사무소',
          address: '서울시 송파구 올림픽로 200',
          description: '자이 아파트 관리사무소',
          officeNumber: '02-4000-0000',
          buildingNumberFrom,
          buildingNumberTo,
          floorCountPerBuilding,
          unitCountPerFloor,
          user: {
            create: {
              username: 'admin2',
              password: await hashPassword('admin1234!'),
              email: 'admin2@test.com',
              contact: '010-2222-3333',
              name: '서브 관리자',
              role: Role.ADMIN,
              avatar: null,
              joinStatus: joinStatus.PENDING,
              isActive: true,
            },
          },
        },
      },
    },
  });

  console.log('✅ 일반 주민 계정 생성 시작...');

  // 주민 1 (세대주)
  const resident1 = await prisma.resident.create({
    data: {
      email: 'resident1@test.com',
      contact: '010-3333-4444',
      name: '김주민',
      building: 1,
      unit: 101,
      isHouseholder: true,
      apartmentId: apartment1.id,
      isRegistered: true,
    },
  });

  await prisma.user.create({
    data: {
      username: 'resident1',
      password: await hashPassword('resident1234!'),
      email: 'resident1@test.com',
      contact: '010-3333-4444',
      name: '김주민',
      role: Role.USER,
      avatar: null,
      joinStatus: joinStatus.APPROVED,
      isActive: true,
      resident: {
        connect: {
          id: resident1.id,
        },
      },
    },
  });

  console.log('✅ 주민1 (resident1) 생성 완료');

  // 주민 2 (세대주)
  const resident2 = await prisma.resident.create({
    data: {
      email: 'resident2@test.com',
      contact: '010-4444-5555',
      name: '이주민',
      building: 2,
      unit: 201,
      isHouseholder: true,
      apartmentId: apartment1.id,
      isRegistered: true,
    },
  });

  await prisma.user.create({
    data: {
      username: 'resident2',
      password: await hashPassword('resident1234!'),
      email: 'resident2@test.com',
      contact: '010-4444-5555',
      name: '이주민',
      role: Role.USER,
      avatar: null,
      joinStatus: joinStatus.APPROVED,
      isActive: true,
      resident: {
        connect: {
          id: resident2.id,
        },
      },
    },
  });

  console.log('✅ 주민2 (resident2) 생성 완료');


    console.log("🌱 Seed completed!");
  
  //seed의 db값 테스트
  //console.log(await prisma.apartment.findMany());
}

main()
  .catch((e) => {
    console.error('❌ 시드 데이터 생성 실패:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
