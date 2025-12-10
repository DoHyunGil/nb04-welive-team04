import apartmentRepository from '../apartment/apartment.respository.js';

class ApartmentService {
  async getApartments(page: number, limit: number, searchKeyword?: string) {
    const skip = (page - 1) * limit;

    const [apartments, totalCount] = await Promise.all([
      apartmentRepository.findMany(skip, limit, searchKeyword),
      apartmentRepository.count(searchKeyword),
    ]);

    return {
      data: apartments,
      totalCount,
      page,
      limit,
      hasNext: page * limit < totalCount,
    };
  }

  async getApartmentById(id: number) {
    return apartmentRepository.findById(id);
  }
}

export default new ApartmentService();
