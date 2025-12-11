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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
