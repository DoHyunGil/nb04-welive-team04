import express from 'express';
import residentsController from '../residents/controllers/residents.controller.js';
import residentSchema from '../residents/residents.schema.js';
import residentTemplate from '../resident-template/resident.template.js';
import passports from '../lib/passports/index.js';

const router = express.Router();

router.get(
  '/',
  passports.jwtAuth,
  residentSchema.checkPaginationSchema,
  residentsController.getResidents,
);
router.post(
  '/',
  passports.jwtAuth,
  residentSchema.createResidentsSchema,
  residentsController.createResidents,
);

router.get(
  '/:id',
  passports.jwtAuth,
  residentSchema.checkResidentIdSchema,
  residentsController.getResidentsById,
);
router.patch(
  '/:id',
  passports.jwtAuth,
  residentSchema.updateResidentsSchema,
  residentsController.updateResidents,
);
router.delete(
  '/:id',
  passports.jwtAuth,
  residentSchema.checkResidentIdSchema,
  residentsController.deleteResidentById,
);

// 템플릿 다운로드
router.get('/file/template', residentTemplate.downloadTemplate);

// 명부 업로드
router.get('/file/import', passports.jwtAuth);

// 명부 다운로드
router.get('/file/export', passports.jwtAuth, residentTemplate.getResidentList);

export default router;
