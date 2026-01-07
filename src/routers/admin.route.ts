import express from 'express';
import adminController from '../user/controllers/admin.controller.js';
import passports from '../lib/passports/index.js';
import { validateBody, validateQuery } from '../middlewares/validateRequest.js';
import {
  superAdminRegisterSchema,
  adminRegisterSchema,
  updateAdminSchema,
  updateJoinStatusSchema,
  getAdminsQuerySchema,
} from '../user/schemas/admin.schema.js';

// 슈퍼관리자 라우터
export const superAdminRouter = express.Router();
superAdminRouter.post(
  '/',
  validateBody(superAdminRegisterSchema),
  adminController.superAdminsRegister,
);

// 일반 관리자 라우터
export const adminRouter = express.Router();
adminRouter.post(
  '/',
  validateBody(adminRegisterSchema),
  adminController.adminsRegister,
);
adminRouter.get(
  '/',
  passports.jwtAuth,
  validateQuery(getAdminsQuerySchema),
  adminController.getAdmins,
);
adminRouter.patch(
  '/join-status',
  passports.jwtAuth,
  validateBody(updateJoinStatusSchema),
  adminController.updateManyJoinStatus,
);
adminRouter.patch(
  '/:id/join-status',
  passports.jwtAuth,
  validateBody(updateJoinStatusSchema),
  adminController.updateJoinStatusById,
);
adminRouter.patch(
  '/:id',
  passports.jwtAuth,
  validateBody(updateAdminSchema),
  adminController.updateAdmin,
);
adminRouter.delete(
  '/rejected',
  passports.jwtAuth,
  adminController.deleteRejectedAdmins,
);
adminRouter.delete('/:id', passports.jwtAuth, adminController.deleteAdmin);

export default adminRouter;
