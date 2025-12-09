import type { NextFunction, Request, Response } from 'express';
import adminService from '../services/admin.service.js';

class AdminController {
  // 슈퍼 관리자 회원가입 API
  async superAdminsRegister(req: Request, res: Response, next: NextFunction) {
    try {
      // 1. 요청 body에서 회원가입 정보 가져오기
      const registerData = req.body;

      // 2. adminService의 superAdminRegister 함수 호출
      await adminService.superAdminRegister(registerData);

      // 3. 성공 응답 (204 No Content)
      res.status(204).json({});
    } catch (error) {
      // 에러 발생 시 에러 핸들러로 전달
      next(error);
    }
  }

  // 일반 관리자 회원가입 API
  async adminsRegister(req: Request, res: Response, next: NextFunction) {
    try {
      // 1. 요청 body에서 회원가입 정보 가져오기
      const registerData = req.body;

      // 2. adminService의 adminRegister 함수 호출
      await adminService.adminRegister(registerData);

      // 3. 성공 응답 (204 No Content)
      res.status(204).json({});
    } catch (error) {
      // 에러 발생 시 에러 핸들러로 전달
      next(error);
    }
  }

  // 관리자 목록 조회 API
  async getAdmins(req: Request, res: Response, next: NextFunction) {
    try {
      // 1. 쿼리 파라미터에서 페이지 정보 가져오기
      const pageNumber = Number(req.query.page) || 1; // page가 없으면 1
      const limitNumber = Number(req.query.limit) || 20; // limit이 없으면 20
      const searchKeyword = req.query.searchKeyword?.toString(); // 검색 키워드
      const joinStatusString = req.query.joinStatus?.toString(); // 가입 상태

      // 2. skip 계산 (몇 개를 건너뛸지)
      // 예: 1페이지면 0개, 2페이지면 20개, 3페이지면 40개 건너뛰기
      const skipCount = (pageNumber - 1) * limitNumber;

      // 3. adminService의 findAdmins 함수 호출
      const result = await adminService.findAdmins({
        searchKeyword: searchKeyword,
        joinStatusString: joinStatusString,
        skip: skipCount,
        limit: limitNumber,
      });

      // 4. 결과 반환
      res.status(200).json(result);
    } catch (error) {
      // 에러 발생 시 에러 핸들러로 전달
      next(error);
    }
  }

  // 여러 관리자의 가입 상태를 한번에 변경하는 API
  async updateManyJoinStatus(req: Request, res: Response, next: NextFunction) {
    try {
      // 1. 요청 body에서 joinStatus 가져오기
      const joinStatus = req.body.joinStatus;

      // 2. adminService의 updateManyJoinStatus 함수 호출
      const updatedCount = await adminService.updateManyJoinStatus(joinStatus);

      // 3. 결과 반환 (업데이트된 개수와 상태)
      res.json({
        updatedCount: updatedCount,
        joinStatus: joinStatus,
      });
    } catch (error) {
      // 에러 발생 시 에러 핸들러로 전달
      next(error);
    }
  }

  // 특정 관리자의 가입 상태를 변경하는 API
  async updateJoinStatusById(req: Request, res: Response, next: NextFunction) {
    try {
      // 1. URL 파라미터에서 관리자 id 가져오기
      const adminId = Number(req.params.id);

      // 2. 요청 body에서 joinStatus 가져오기
      const joinStatus = req.body.joinStatus;

      // 3. adminService의 updateJoinStatusById 함수 호출
      await adminService.updateJoinStatusById(adminId, joinStatus);

      // 4. 성공 응답 (204 No Content)
      res.status(204).json({});
    } catch (error) {
      // 에러 발생 시 에러 핸들러로 전달
      next(error);
    }
  }

  // 관리자 정보를 수정하는 API
  async updateAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      // 1. URL 파라미터에서 관리자 id 가져오기
      const adminId = Number(req.params.id);

      // 2. 요청 body에서 수정할 데이터 가져오기
      const updateData = req.body;

      // 3. adminService의 updateAdmin 함수 호출
      await adminService.updateAdmin(adminId, updateData);

      // 4. 성공 응답 (204 No Content)
      res.status(204).json({});
    } catch (error) {
      // 에러 발생 시 에러 핸들러로 전달
      next(error);
    }
  }

  // 관리자를 삭제하는 API
  async deleteAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      // 1. URL 파라미터에서 관리자 id 가져오기
      const adminId = Number(req.params.id);

      // 2. adminService의 deleteAdmin 함수 호출
      await adminService.deleteAdmin(adminId);

      // 3. 성공 응답 (204 No Content)
      res.status(204).json({});
    } catch (error) {
      // 에러 발생 시 에러 핸들러로 전달
      next(error);
    }
  }

  // 거절된 관리자들을 모두 삭제하는 API
  async deleteRejectedAdmins(_req: Request, res: Response, next: NextFunction) {
    try {
      // 1. adminService의 deleteRejectedAdmins 함수 호출
      await adminService.deleteRejectedAdmins();

      // 2. 성공 응답 (204 No Content)
      res.status(204).json({});
    } catch (error) {
      // 에러 발생 시 에러 핸들러로 전달
      next(error);
    }
  }
}

export default new AdminController();
