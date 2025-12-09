import authRouter from './auth.route.js';
import adminRouter from './user.route.js';
import superAdminRouter from './superAdmin.route.js';
import usersRouter from './users.route.js';

//모든 라우터는 여기로 모여서 나가야 main에서 import를 줄일 수 있어서 편리합니다.
const routers = { authRouter, adminRouter, superAdminRouter, usersRouter };

Object.freeze(routers);

export default routers;
