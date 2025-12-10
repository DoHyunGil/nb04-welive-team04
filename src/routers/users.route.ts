import express from 'express';
import multer from 'multer';
import path from 'path';
import userController from '../user/controllers/user.controller.js';
import passports from '../lib/passports/index.js';

const router = express.Router();

// multer 설정 - 파일 업로드 처리
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (_req, file, cb) => {
    // 파일명을 유니크하게 만들기 위해 타임스탬프 추가
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${uniqueSuffix}${ext}`);
  },
});

// 파일 필터 - 이미지만 허용
const fileFilter = (
  _req: express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('이미지 파일만 업로드 가능합니다. (jpeg, png, gif, webp)'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB 제한
  },
});

// 프로필 이미지 수정
router.patch(
  '/me/avatar',
  passports.jwtAuth,
  upload.single('avatar'),
  userController.updateAvatar,
);

// 비밀번호 변경
router.patch('/me/password', passports.jwtAuth, userController.updatePassword);

export default router;
