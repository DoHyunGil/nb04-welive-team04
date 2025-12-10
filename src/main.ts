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
    credentials: true,
  }),
);

app.use('/auth', routers.authRouter);
app.use('/api/v2/apartments', routers.apartmentRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log('server running');
});
