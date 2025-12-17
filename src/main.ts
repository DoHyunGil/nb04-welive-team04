import express from 'express';
import cors from 'cors';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import errorHandler from './middlewares/errorHandler.js';
import routers from './routers/index.js';
import dotenv from 'dotenv';
import pollsRouter from './routers/polls.route.js';
import { initPollsScheduler } from './polls/utils/polls.scheduler.js';

dotenv.config(); // .env 파일 환경변수 적재
const app = express();

const PORT = process.env.PORT || 4000;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  }),
);

// app.use('/auth', routers.authRouter);

app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());
app.use('/api/v2/polls', pollsRouter);
app.use('/api/v2/auth', routers.authRouter);
app.use('/api/v2/users/super-admins', routers.superAdminRouter);
app.use('/api/v2/users/admins', routers.adminRouter);
app.use('/api/v2/users', routers.meRouter);
app.use('/api/v2/complaints', routers.complaintRouter);
app.use('/api/v2/notices', routers.noticeRouter);
app.use('/api/v2/residents', routers.residentsRouter);
app.use('/api/v2/users/residents', routers.residentsAuthRouter);
app.use('/api/v2/apartments', routers.apartmentRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log('server running');
  initPollsScheduler();
});

export default app;
