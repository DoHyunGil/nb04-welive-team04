import express from 'express';
import cors from 'cors';
import passport from 'passport';

const app = express();

const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(passport.initialize());

app.use(
  cors({
    credentials: true,
  }),
);
