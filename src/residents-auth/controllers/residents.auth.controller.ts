import type { NextFunction, Request, Response } from 'express';
import type { CreateResidentAuthBody } from 'src/lib/type/express/resident.index.js';
import ResidentsAuthService from '../services/residents.auth.service.js';
import type { GetResidentsAuthDto } from '../../lib/type/express/resident.index.js';

class ResidentsAuthController {
  async getResidentsAuth(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = Number(req.user?.id);
      const dto: GetResidentsAuthDto = req.query;
      const data = await ResidentsAuthService.getResidentsAuth(userId, dto);
      res.send(data);
    } catch (error) {
      next(error);
    }
  }
  async createResidents(req: Request, res: Response, next: NextFunction) {
    try {
      const residentData: CreateResidentAuthBody = { ...req.body };
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
