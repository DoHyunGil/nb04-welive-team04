import type { Request, Response, NextFunction } from 'express';
import apartmentService from './apartment.service.js';
import createError from 'http-errors';
import type { ApartmentIdDto, GetApartmentDto } from './dto/apartment.dto.js';

class ApartmentController {
  async getApartmentById(req: Request, res: Response, next: NextFunction) {
    try {
      const dto: ApartmentIdDto = {
        id: Number(req.params.id),
      };

      const apartment = await apartmentService.getApartmentById(dto);

      if (!apartment) {
        throw createError(404, 'Apartment not found');
      }

      return res.status(200).json({
        data: apartment,
      });
    } catch (error) {
      next(error);
    }
  }

  async getApartments(req: Request, res: Response, next: NextFunction) {
    try {
      const dto: GetApartmentDto = {
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 20,
        searchKeyword: String(req.query.searchKeyword || ''),
      };

      const result = await apartmentService.getApartments(dto);

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default new ApartmentController();
