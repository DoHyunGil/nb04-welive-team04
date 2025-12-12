import express from 'express';
import cors from 'cors';
import passport from 'passport';
import errorHandler from './middlewares/errorHandler.js';
import routers from './routers/index.js';
import dotenv from 'dotenv';

dotenv.config(); // .env 파일 환경변수 적재
const app = express();

const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(passport.initialize());

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  }),
);

app.use('/api/v2/auth', routers.authRouter);
app.use('/api/v2/users/super-admins', routers.superAdminRouter);
app.use('/api/v2/users/admins', routers.adminRouter);
app.use('/api/v2/users', routers.meRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log('server running');
});

export default app;
