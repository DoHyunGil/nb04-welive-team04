import type { Request, Response, NextFunction } from 'express';
import apartmentService from './apartment.service.js';

class ApartmentController {
  async getApartmentById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const apartment = await apartmentService.getApartmentById(id);

      if (!apartment) {
        return res.status(404).json({
          success: false,
          message: 'Apartment not found',
        });
      }

      return res.status(200).json({
        success: true,
        data: apartment,
      });
    } catch (error) {
      console.error('Error fetching apartment:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal Server Error',
      });
    }
  }
}

export const getApartments = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
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
};

export default new ApartmentController();
