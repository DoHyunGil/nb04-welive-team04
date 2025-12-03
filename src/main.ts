import express from 'express';
import cors from 'cors';
import passport from 'passport';
import errorHandler from './middlewares/errorHandler.js';
import routers from './routers/index.js';
import dotenv from 'dotenv';

dotenv.config(); // .env 파일 환경변수 적재
const app = express();

app.use(express.json());
app.use(passport.initialize());

app.use(
  cors({
    credentials: true,
  }),
);

app.use('/auth', routers.authRouter);
app.use('/complaints', routers.complaintRouter);

app.use(errorHandler);

export default app;
