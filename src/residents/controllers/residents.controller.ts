import type { NextFunction, Request, Response } from 'express';
import type { CreateResidentBody } from 'src/lib/type/express/resident.index.js';
import residentService from '../services/residents.service.js';
import type { GetResidentsDto } from '../../lib/type/express/resident.index.js';

class ResidentsController {
  async getResidents(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = Number(req.user?.id);
      const dto: GetResidentsDto = req.query;
      const data = await residentService.getResidents(userId, dto);
      res.send(data);
    } catch (error) {
      next(error);
    }
  }
  async getResidentsById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = Number(req.user?.id);
      const residentId = Number(req.params.id);
      console.log(residentId);
      const data = await residentService.getResidentsById(userId, residentId);
      res.send(data);
    } catch (error) {
      next(error);
    }
  }
  async createResidents(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = Number(req.user?.id);
      const residentData: CreateResidentBody = req.body;
      const data = await residentService.createResidents(userId, residentData);
      res.status(201).send({ data: data });
      console.log(data);
    } catch (error) {
      next(error);
    }
  }
  async updateResidents(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = Number(req.user?.id || 1);
      const residentData: Partial<CreateResidentBody> = req.body;
      const residentId = Number(req.params.id);
      const data = await residentService.updateResidents(
        userId,
        residentId,
        residentData,
      );
      res.status(201).send(data);
    } catch (error) {
      next(error);
    }
  }
  async deleteResidentById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = Number(req.user?.id || 1);
      const residentId = Number(req.params.id);
      const data = await residentService.deleteResidentById(userId, residentId);
      res.send(data);
    } catch (error) {
      next(error);
    }
  }
}

export default new ResidentsController();
