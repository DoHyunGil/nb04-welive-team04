import express from 'express';

import authController from '../auth/controllers/auth.controller.js';

const router = express.Router();

router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refresh);

export default router;
