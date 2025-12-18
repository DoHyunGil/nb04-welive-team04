import authRouter from './auth.route.js';
import adminRouter, { superAdminRouter } from './admin.route.js';
import meRouter from './me.route.js';
import complaintRouter from './complaint.route.js';
import apartmentRouter from './apartment.routes.js';
import residentsRouter from './residents.route.js';
import residentsAuthRouter from './residents.auth.route.js';
import noticeRouter from './notice.route.js';

//모든 라우터는 여기로 모여서 나가야 main에서 import를 줄일 수 있어서 편리합니다.
const routers = {
  authRouter,
  adminRouter,
  superAdminRouter,
  meRouter,
  complaintRouter,
  noticeRouter,
  apartmentRouter,
  residentsRouter,
  residentsAuthRouter,
};

Object.freeze(routers);

export default routers;
