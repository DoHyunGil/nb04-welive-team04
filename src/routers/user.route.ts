import express from 'express';
import adminController from '../user/controllers/admin.controller.js';
import passports from '../lib/passports/index.js';

const router = express.Router();

router.post('/', adminController.adminsRegister);

router.get('/', passports.jwtAuth, adminController.getAdmins);

router.patch('/join-status', passports.jwtAuth, adminController.updateManyJoinStatus);

router.patch('/:id/join-status', passports.jwtAuth, adminController.updateJoinStatusById);

router.patch('/:id', passports.jwtAuth, adminController.updateAdmin);

router.delete('/rejected', passports.jwtAuth, adminController.deleteRejectedAdmins);

router.delete('/:id', passports.jwtAuth, adminController.deleteAdmin);

export default router;
