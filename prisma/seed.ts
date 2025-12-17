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
        avatar: '',
        joinStatus: joinStatus.APPROVED,
        isActive: true,
      },
    });

    console.log('✅ 슈퍼 관리자 계정 생성 완료:', superAdmin.email);
  }

  //#region DUMMY(참고용으로 쓰시라고 남겨둘게요)

  const buildings = Array.from(
    { length: buildingNumberTo - buildingNumberFrom + 1 },
    (_, i) => buildingNumberFrom + i
  );

  const units: number[] = [];
  for (let floor = 1; floor <= floorCountPerBuilding; floor++) {
    for (let num = 1; num <= unitCountPerFloor; num++) {
      const unit = floor * 100 + num;
      units.push(unit);
    }
  }

  // --- 첫 번째 아파트 ---
  await prisma.apartment.create({
    data: {
      name: "래미안 퍼스티지",
      address: "서울시 강남구 테헤란로 100",
      description: "래미안 퍼스티지 아파트 단지입니다.",
      officeNumber: "02-3000-0000",
      buildingNumberFrom,
      buildingNumberTo,
      floorCountPerBuilding,
      unitCountPerFloor,
      buildings: buildings,
      units: units,
      adminOf: {
        create: {
          user: {
            create: {
              username: "admin",
              password: "1234",
              email: "admin@test.com",
              contact: "010-1111-2222",
              name: "관리자",
              role: "ADMIN",
              avatar: "",
              joinStatus: "PENDING",
              isActive: true,
            },
          },
        },
      },
    },
  });

  // --- 두 번째 아파트 추가 ---
  await prisma.apartment.create({
    data: {
      name: "자이 아파트",
      address: "서울시 송파구 올림픽로 200",
      description: "자이 아파트 단지입니다.",
      officeNumber: "02-4000-0000",
      buildingNumberFrom,
      buildingNumberTo,
      floorCountPerBuilding,
      unitCountPerFloor,
      buildings: buildings,
      units: units,
      adminOf: {
        create: {
          user: {
            create: {
              username: "admin2",
              password: "1234",
              email: "admin2@test.com",
              contact: "010-2222-3333",
              name: "서브 관리자",
              role: "ADMIN",
              avatar: "",
              joinStatus: "PENDING",
              isActive: true,
            },
          },
        },
      },
    },
  });

  console.log("🌱 Seed completed!");
  
  //seed의 db값 테스트
  //console.log(await prisma.apartment.findMany());

main()
  .catch((e) => {
    console.error('❌ 시드 데이터 생성 실패:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
}
