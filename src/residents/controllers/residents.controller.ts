import type { NextFunction, Request, Response } from 'express';
import type {
  GetResidentsQuery,
  CreateResidentBody,
} from 'src/lib/type/express/resident.index.js';
import residentService from '../residents/residents.service.js';

class ResidentsController {
  async getResidents(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = Number(req.user!.id);
      const {
        page,
        limit,
        searchKeyword,
        building,
        unit,
        isHouseholder,
        isRegistered,
      } = req.query as GetResidentsQuery;
      const data = await residentService.getResidents(
        userId,
        page ? Number(page) : 1,
        limit ? Number(limit) : 10,
        searchKeyword,
        building,
        unit,
        isHouseholder,
        isRegistered,
      );
      res.send(data);
    } catch (error) {
      next(error);
    }
  }
  async getResidentsById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = Number(req.user!.id);
      const residentId = Number(req.params.id);
      const data = await residentService.getResidentsById(userId, residentId);
      res.send(data);
    } catch (error) {
      next(error);
    }
  }
  async createResidents(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = Number(req.user!.id);
      const residentData: CreateResidentBody = req.body;
      const data = await residentService.createResidents(userId, residentData);
      res.status(201).send(data);
    } catch (error) {
      next(error);
    }
  }
  async updateResidents(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = Number(req.user!.id);
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
      const userId = Number(req.user!.id);
      const residentId = Number(req.params.id);
      const data = await residentService.deleteResidentById(userId, residentId);
      res.send(data);
    } catch (error) {
      next(error);
    }
  }
}

export default new ResidentsController();
