import { type Request, type Response, type NextFunction, response } from 'express';
import apartmentService from './apartment.service.js';
import createHttpError from 'http-errors';
import { NumberIdSchema } from './apartment.validator.js';

class ApartmentController {
  async getApartmentById(req: Request, res: Response) {
    try {
      const id = NumberIdSchema.parse(req.params.id);

      const apartment = await apartmentService.getApartmentById(id);

      if (!apartment) {
        throw createHttpError(404, 'Apartment not found');
      }
      
      return res.status(200).json({
        data: [apartment],
      });

    } catch (error) {
      
      console.error('아파트 조회 오류:', error);

      return res.status(500).json({
        message: '인증에 실패했습니다. 토큰이 없습니다.',
        error: 'Unauthorized',
        statusCode: 401,
      });
    }
  }

  async getApartments(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const searchKeyword = String(req.query.searchKeyword || '');

      const result = await apartmentService.getApartments(
        page,
        limit,
        searchKeyword,
      );

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default new ApartmentController();