import { prisma } from '../../../lib/prisma.js';
import { Server } from 'http';
import app from '../../../main.js';

let server: Server;

beforeAll(async () => {
  server = app.listen(0);
  await prisma.$connect();
  await prisma.complain.deleteMany();
  await prisma.apartment.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
  await server.close();
});
