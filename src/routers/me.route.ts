import express from 'express';
import userController from '../user/controllers/user.controller.js';
import passports from '../lib/passports/index.js';
import { upload } from '../lib/multer.js';

const router = express.Router();

// 프로필 이미지 수정
router.patch(
  '/me/avatar',
  passports.jwtAuth,
  upload.single('avatarImage'),
  userController.updateAvatar,
);

// 프로필 이미지 삭제
router.delete('/me/avatar', passports.jwtAuth, userController.deleteAvatar);

// 비밀번호 변경
router.patch('/me/password', passports.jwtAuth, userController.updatePassword);

export default router;
