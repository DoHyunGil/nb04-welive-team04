import express from 'express';
import adminController from '../user/controllers/admin.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/super-admins', adminController.superAdminsRegister);
router.post('/', adminController.adminsRegister);

router.get(
  '/',
  authMiddleware.authenticate,
  authMiddleware.requireSuperAdmin,
  adminController.getAdmins,
);

router.patch(
  '/join-status',
  authMiddleware.authenticate,
  authMiddleware.requireSuperAdmin,
  adminController.updateManyJoinStatus,
);

router.patch(
  '/:id/join-status',
  authMiddleware.authenticate,
  authMiddleware.requireSuperAdmin,
  adminController.updateJoinStatusById,
);

router.patch(
  '/:id',
  authMiddleware.authenticate,
  authMiddleware.requireSuperAdmin,
  adminController.updateAdmin,
);

router.delete(
  '/rejected',
  authMiddleware.authenticate,
  authMiddleware.requireSuperAdmin,
  adminController.deleteRejectedAdmins,
);

router.delete(
  '/:id',
  authMiddleware.authenticate,
  authMiddleware.requireSuperAdmin,
  adminController.deleteAdmin,
);

export default router;
