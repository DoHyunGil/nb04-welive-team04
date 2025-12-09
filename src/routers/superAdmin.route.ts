import express from 'express';
import adminController from '../user/controllers/admin.controller.js';

const router = express.Router();

router.post('/', adminController.superAdminsRegister);

export default router;
