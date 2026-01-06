import apartmentRepository from '../apartment/apartment.respository.js';
import type { Prisma } from 'generated/prisma/client.js';
import type {
  ApartmentIdDto,
  GetApartmentDto,
  CreateApartmentDto,
} from './dto/apartment.dto.js';

class ApartmentService {
  async getApartments(dto: GetApartmentDto) {
    const { page, limit, searchKeyword } = dto;

    const skip = (page - 1) * limit;

    let where: Prisma.ApartmentWhereInput | undefined;

    if (searchKeyword) {
      const contains = {
        contains: searchKeyword,
        mode: 'insensitive' as const,
      };

      where = {
        OR: [
          { name: contains },
          { address: contains },
          { description: contains },
          { officeNumber: contains },
        ],
      };
    }

    const apartments = await apartmentRepository.findMany(skip, limit, where);

    apartments.forEach((item) => {
      (item as any).id = String(item.id);
    });

    return {
      data: apartments,
      totalCount: apartments.length,
      page,
      limit,
      hasNext: apartments.length === limit,
    };
  }

  async getApartmentById(dto: ApartmentIdDto) {
    const { id } = dto;

    return apartmentRepository.findById(id);
  }
  async createApartment(tx: Prisma.TransactionClient, dto: CreateApartmentDto) {
    return apartmentRepository.create(
      {
        name: dto.name,
        address: dto.address,
        description: dto.description,
        officeNumber: dto.officeNumber,
        buildingNumberFrom: dto.buildingNumberFrom,
        buildingNumberTo: dto.buildingNumberTo,
        floorCountPerBuilding: dto.floorCountPerBuilding,
        unitCountPerFloor: dto.unitCountPerFloor,
        adminOf: {
          connect: { id: dto.adminOfId },
        },
      },
      tx,
    );
  }
}

export default new ApartmentService();
