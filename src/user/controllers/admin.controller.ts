import type { NextFunction, Request, Response } from 'express';
import adminService from '../services/admin.service.js';

class AdminController {
  // 슈퍼 관리자 회원가입 API
  async superAdminsRegister(req: Request, res: Response, next: NextFunction) {
    try {
      await adminService.superAdminRegister(req.body);
      res.status(204).json({});
    } catch (error) {
      next(error);
    }
  }

  // 일반 관리자 회원가입 API
  async adminsRegister(req: Request, res: Response, next: NextFunction) {
    try {
      await adminService.adminRegister(req.body);
      res.status(204).json({});
    } catch (error) {
      next(error);
    }
  }

  // 관리자 목록 조회 API
  async getAdmins(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.findAdmins({
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 20,
        searchKeyword: req.query.searchKeyword?.toString(),
        joinStatusString: req.query.joinStatus?.toString(),
      });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // 여러 관리자의 가입 상태를 한번에 변경하는 API
  async updateManyJoinStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const updatedCount = await adminService.updateManyJoinStatus(req.body.joinStatus);
      res.json({
        updatedCount,
        joinStatus: req.body.joinStatus,
      });
    } catch (error) {
      next(error);
    }
  }

  // 특정 관리자의 가입 상태를 변경하는 API
  async updateJoinStatusById(req: Request, res: Response, next: NextFunction) {
    try {
      await adminService.updateJoinStatusById(Number(req.params.id), req.body.joinStatus);
      res.status(204).json({});
    } catch (error) {
      next(error);
    }
  }

  // 관리자 정보를 수정하는 API
  async updateAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      await adminService.updateAdmin(Number(req.params.id), req.body);
      res.status(204).json({});
    } catch (error) {
      next(error);
    }
  }

  // 관리자를 삭제하는 API
  async deleteAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      await adminService.deleteAdmin(Number(req.params.id));
      res.status(204).json({});
    } catch (error) {
      next(error);
    }
  }

  // 거절된 관리자들을 모두 삭제하는 API
  async deleteRejectedAdmins(_req: Request, res: Response, next: NextFunction) {
    try {
      await adminService.deleteRejectedAdmins();
      res.status(204).json({});
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminController();
