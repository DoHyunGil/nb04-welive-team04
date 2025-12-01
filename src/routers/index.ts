import authRouter from './auth.route.js';

//모든 라우터는 여기로 모여서 나가야 main에서 import를 줄일 수 있어서 편리합니다.
const routers = { authRouter };

Object.freeze(routers);

export default routers;
