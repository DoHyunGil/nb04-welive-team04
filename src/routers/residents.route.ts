import express from 'express';
import residentsController from '../residents/residents.controller.js';

const router = express.Router();

router.get('/api/v2/residents', residentsController.getResidents);
router.post('/api/v2/residents', residentsController.createResidents);

// 레지던트ID와 토큰에서 뽑아낸 관리자의 아파트 아이디가 일치하는 미들웨어 필요함
router.get('/api/v2/residents/:id', residentsController.getResidentsById);
router.patch('/api/v2/residents/:id', residentsController.updateResidents);
router.delete('/api/v2/residents/:id', residentsController.deleteResidentById);

export default router;
