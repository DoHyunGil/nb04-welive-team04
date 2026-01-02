import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import passport from 'passport';
import { accessTokenStrategy } from './lib/passports/jwtStrategy.js';
import cookieParser from 'cookie-parser';
import errorHandler from './middlewares/errorHandler.js';
import routers from './routers/index.js';
import pollsRouter from './routers/polls.route.js';
import { initPollsScheduler } from './polls/utils/polls.scheduler.js';
import { requestLogger } from './middlewares/request-logger.js';
import './lib/passports/index.js'; // Passport 전략 등록
import { initNotificationService } from './notification/index.js';
import { getNotificationRouter } from './routers/notification.route.js';
import { sseManager } from './lib/sse.manager.js';
import { prisma } from './lib/prisma.js';

dotenv.config(); // .env 파일 환경변수 적재
const app = express();

const PORT = process.env.PORT || 4000;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  }),
);
passport.use('jwt', accessTokenStrategy);
app.use(passport.initialize());

initNotificationService(prisma);
sseManager.startHeartbeat(30000);

app.use(express.json());
app.use(cookieParser());
app.use(requestLogger);
app.use(passport.initialize());

app.use('/api/v2/polls', pollsRouter);
app.use('/api/v2/auth', routers.authRouter);
app.use('/api/v2/users/super-admins', routers.superAdminRouter);
app.use('/api/v2/users/admins', routers.adminRouter);
app.use('/api/v2/users', routers.meRouter);
app.use('/api/v2/complaints', routers.complaintRouter);
app.use('/api/v2/comments', routers.commentRouter);
app.use('/api/v2/notices', routers.noticeRouter);
app.use('/api/v2/residents', routers.residentsRouter);
app.use('/api/v2/users/residents', routers.residentsAuthRouter);
app.use('/api/v2/apartments', routers.apartmentRouter);
app.use('/api/v2/events', routers.eventRouter);
app.use('/api/v2/notifications', getNotificationRouter());

app.use(errorHandler);

process.on('SIGTERM', () => {
  sseManager.closeAll();
  prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log('server running');
  initPollsScheduler();
});

export default app;
