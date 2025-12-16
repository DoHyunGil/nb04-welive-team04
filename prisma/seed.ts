// prisma/seed.ts
import { prisma } from '../src/lib/prisma.js';
import { hashPassword } from '../src/lib/password.js';
import { Role, joinStatus } from '../generated/prisma/client.js';

async function main() {
  console.log('시드 데이터 생성 시작...');

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

  // 1. 테스트 아파트 생성
  // const apartment = await prisma.apartment.upsert({
  //   where: { id: 1 },
  //   update: {},
  //   create: {
  //     id: 1,
  //     name: '테스트 아파트',
  //     address: '서울시 강남구 테헤란로 123',
  //     description: '테스트용 아파트입니다',
  //     officeNumber: 1234567890,
  //     buildings: [101, 102, 103],
  //     units: [1001, 1002, 1003, 2001, 2002, 2003],
  //   },
  // });
  // console.log('✅ 아파트 생성 완료:', apartment.name);

  // // 2. 테스트 관리자 유저 생성
  // const adminUser = await prisma.user.upsert({
  //   where: { id: 1 },
  //   update: {},
  //   create: {
  //     id: 1,
  //     password: 'test1234',
  //     username: 'admin',
  //     email: 'admin@test.com',
  //     contact: '010-1234-5678',
  //     name: '테스트관리자',
  //     role: 'ADMIN',
  //     avatar: '',
  //     joinStatus: 'PENDING', // ← 수정!
  //     isActive: true,
  //   },
  // });
  // console.log('✅ 관리자 유저 생성 완료:', adminUser.email);

  // // 3. 테스트 입주민 정보 생성
  // const resident = await prisma.resident.upsert({
  //   where: { userId: 1 },
  //   update: {},
  //   create: {
  //     userId: 1,
  //     apartmentId: 1,
  //     building: 101,
  //     unit: 1001,
  //     isHouseholder: true,
  //   },
  // });
  // console.log(
  //   '✅ 입주민 정보 생성 완료:',
  //   `${resident.building}동 ${resident.unit}호`,
  // );

  // // 4. 추가 테스트 유저 (일반 입주민)
  // const residentUser = await prisma.user.upsert({
  //   where: { id: 2 },
  //   update: {},
  //   create: {
  //     id: 2,
  //     password: 'test1234',
  //     username: 'resident1',
  //     email: 'resident@test.com',
  //     contact: '010-9876-5432',
  //     name: '테스트입주민',
  //     role: 'RESIDENT',
  //     avatar: '',
  //     joinStatus: 'PENDING', // ← 수정!
  //     isActive: true,
  //   },
  // });
  // console.log('✅ 입주민 유저 생성 완료:', residentUser.email);

  // await prisma.resident.upsert({
  //   where: { userId: 2 },
  //   update: {},
  //   create: {
  //     userId: 2,
  //     apartmentId: 1,
  //     building: 102,
  //     unit: 1002,
  //     isHouseholder: false,
  //   },
  // });
  // console.log('✅ 추가 입주민 정보 생성 완료');
  //#endregion
  console.log('🎉 시드 데이터 생성 완료!');
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
