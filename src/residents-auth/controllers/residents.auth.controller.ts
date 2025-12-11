import type { NextFunction, Request, Response } from 'express';
import type {
  GetResidentsAuthQuery,
  CreateResidentAuthBody,
} from 'src/lib/type/express/resident.index.js';
import ResidentsAuthService from '../services/residents.auth.service.js';

class ResidentsAuthController {
  async getResidentsAuth(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = Number(req.user!.id);
      const { page, limit, searchKeyword, joinStatus, building, unit } =
        req.query as GetResidentsAuthQuery;
      const data = await ResidentsAuthService.getResidentsAuth(
        userId,
        page ? Number(page) : 1,
        limit ? Number(limit) : 10,
        searchKeyword,
        joinStatus,
        building,
        unit,
      );
      res.send(data);
    } catch (error) {
      next(error);
    }
  }
  async createResidents(req: Request, res: Response, next: NextFunction) {
    try {
      const residentData: CreateResidentAuthBody = req.body;
      const data = await ResidentsAuthService.createResidentsAuth(residentData);
      res.status(201).send(data);
    } catch (error) {
      next(error);
    }
  }
  async updateResidents(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = Number(req.user!.id);
      const residentId = Number(req.params.id);
      const data = await ResidentsAuthService.approveResidentsAuth(
        userId,
        residentId,
      );
      res.status(201).send(data);
    } catch (error) {
      next(error);
    }
  }
}

export default new ResidentsAuthController();
