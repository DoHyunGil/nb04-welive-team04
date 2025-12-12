// import type { NextFunction, Request, Response } from 'express';
// import authService from '../services/auth.service.js';

// class AuthController {
//   async login(req: Request, res: Response, next: NextFunction) {
//     //여기서 Service로 필요한 데이터를 매개변수로 넘겨준 다음에
//     //서비스에서 필요한 데이터를 반환받아서 res로 send까지만 처리해주면 됩니다.

//     //try-catch는 상위 블록에서 적용하면 하위 함수에도 적용되니까 여기서만 작성해주셔도 충분합니다.
//     try {
//       //여기서 Service로 필요한 데이터를 매개변수로 넘겨준 다음에
//       //서비스에서 필요한 데이터를 반환받아서 res로 send까지만 처리해주면 됩니다.
//       const data = authService.login();
//       res.send(data);
//     } catch (error) {
//       next(error); //전역 에러 핸들러로 넘기기 위해서 next(error)를 쓸거에요.
//     }
//   }
//   async logout(req: Request, res: Response, next: NextFunction) {}
//   async refresh(req: Request, res: Response, next: NextFunction) {}
// }

// export default new AuthController();
