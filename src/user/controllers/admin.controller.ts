import type { NextFunction, Request, Response } from 'express';
import adminService from '../services/admin.service.js';
import type {
  GetAdminsDto,
  UpdateJoinStatusDto,
  UpdateJoinStatusByIdDto,
  UpdateAdminDto,
  DeleteAdminDto,
} from '../types/admin.dto.js';

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
      const dto: GetAdminsDto = {
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 20,
        searchKeyword: req.query.searchKeyword?.toString(),
        joinStatusString: req.query.joinStatus?.toString(),
      };
      const result = await adminService.findAdmins(dto);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // 여러 관리자의 가입 상태를 한번에 변경하는 API
  async updateManyJoinStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const dto: UpdateJoinStatusDto = {
        joinStatus: req.body.joinStatus,
      };
      const updatedCount = await adminService.updateManyJoinStatus(dto);
      res.json({
        updatedCount,
        joinStatus: dto.joinStatus,
      });
    } catch (error) {
      next(error);
    }
  }

  // 특정 관리자의 가입 상태를 변경하는 API
  async updateJoinStatusById(req: Request, res: Response, next: NextFunction) {
    try {
      const dto: UpdateJoinStatusByIdDto = {
        id: Number(req.params.id),
        joinStatus: req.body.joinStatus,
      };
      await adminService.updateJoinStatusById(dto);
      res.status(204).json({});
    } catch (error) {
      next(error);
    }
  }

  // 관리자 정보를 수정하는 API
  async updateAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const dto: UpdateAdminDto = {
        id: Number(req.params.id),
        ...req.body,
      };
      await adminService.updateAdmin(dto);
      res.status(204).json({});
    } catch (error) {
      next(error);
    }
  }

  // 관리자를 삭제하는 API
  async deleteAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const dto: DeleteAdminDto = {
        id: Number(req.params.id),
      };
      await adminService.deleteAdmin(dto);
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
