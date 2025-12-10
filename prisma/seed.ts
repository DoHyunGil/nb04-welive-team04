import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from "../generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding Apartment...");

  const buildingNumberFrom = 1;
  const buildingNumberTo = 10;
  const floorCountPerBuilding = 15;
  const unitCountPerFloor = 4;

  // 1~10 동
  const buildings = Array.from(
    { length: buildingNumberTo - buildingNumberFrom + 1 },
    (_, i) => buildingNumberFrom + i
  );

  // 101 ~ 1504 호 생성
  const units: number[] = [];
  for (let floor = 1; floor <= floorCountPerBuilding; floor++) {
    for (let num = 1; num <= unitCountPerFloor; num++) {
      const unit = floor * 100 + num; // 예: 1층 → 101, 102, 103, 104
      units.push(unit);
    }
  }

  await prisma.apartment.create({
    data: {
      name: "래미안 퍼스티지",
      address: "서울시 강남구 테헤란로 100",
      description: "래미안 퍼스티지 아파트 단지입니다.",
      officeNumber: "02-3000-0000",
      buildings: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      units: [
        101, 102, 103, 104,
        201, 202, 203, 204,
        301, 302, 303, 304,
        401, 402, 403, 404,
        501, 502, 503, 504,
        601, 602, 603, 604,
        701, 702, 703, 704,
        801, 802, 803, 804,
        901, 902, 903, 904,
        1001, 1002, 1003, 1004,
        1101, 1102, 1103, 1104,
        1201, 1202, 1203, 1204,
        1301, 1302, 1303, 1304,
        1401, 1402, 1403, 1404,
        1501, 1502, 1503, 1504
      ],
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

  console.log("🌱 Seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });