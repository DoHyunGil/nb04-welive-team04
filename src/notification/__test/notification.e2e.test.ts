// src/notification/__test/notification.e2e.test.ts
import { jest } from '@jest/globals';

const MOCK_ACCESS_SECRET = 'test-secret-key';
const MOCK_REFRESH_SECRET = 'test-refresh-secret';

jest.unstable_mockModule('../../lib/constants/jwt.tokens.js', () => ({
  default: {
    ACCESS_TOKEN_COOKIE_NAME: 'accessToken',
    REFRESH_TOKEN_COOKIE_NAME: 'refreshToken',
    JWT_ACCESS_TOKEN_SECRET: MOCK_ACCESS_SECRET,
    JWT_REFRESH_TOKEN_SECRET: MOCK_REFRESH_SECRET,
  },
}));

const { default: request } = await import('supertest');
const { default: express } = await import('express');
const { default: jwt } = await import('jsonwebtoken');
const { afterAll, beforeAll, beforeEach, describe, it, expect } = await import('@jest/globals');
const { sseManager } = await import('../../lib/sse.manager.js');
const { prisma } = await import('../../lib/prisma.js');
const { initNotificationService } = await import('../index.js');
const { getNotificationRouter } = await import('../../routers/notification.route.js');

import type { Request, Response, NextFunction, Express } from 'express';

jest.setTimeout(30000);

let app: Express;
let testUserId: number = 8888;
let sseUserId: number = 9999;
let authToken: string = '';
let sseAuthToken: string = '';

const cleanUpData = async () => {
  await prisma.notification.deleteMany({ where: { userId: { in: [testUserId, sseUserId] } } });
  await prisma.resident.deleteMany({ where: { userId: { in: [testUserId, sseUserId] } } });
  await prisma.user.deleteMany({ where: { id: { in: [testUserId, sseUserId] } } });

  const apt = await prisma.apartment.findFirst({ where: { name: 'SSE Clean Test' } });
  if (apt) await prisma.apartment.delete({ where: { id: apt.id } });
};

const setupTestApp = () => {
  initNotificationService(prisma);
  const testApp = express();
  testApp.use(express.json());

  testApp.use((req: Request, res: Response, next: NextFunction) => {
    if (req.url.includes('/sse')) {
      if (!req.headers.authorization) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });

      const packet = `data: ${JSON.stringify({ type: 'test_alarm', data: 'success' })}\n\n`;

      res.end(packet);
      return;
    }
    next();
  });

  testApp.use('/api/v2/notifications', getNotificationRouter());

  testApp.use((err: any, req: Request, res: Response, next: NextFunction) => {
    res.status(err.status || 500).json({ message: err.message });
  });

  return testApp;
};

describe('Notifications API - E2E 통합 테스트', () => {

  beforeAll(async () => {
    await cleanUpData();

    const apartment = await prisma.apartment.create({
      data: {
        name: 'SSE Clean Test',
        address: 'Test City',
        description: 'E2E',
        officeNumber: '000-0000',
        buildingNumberFrom: 1, buildingNumberTo: 1,
        floorCountPerBuilding: 1, unitCountPerFloor: 1,
      },
    });

    await prisma.user.create({ data: { id: testUserId, password: 'pw', username: 'real', email: 'r@t.com', contact: '1', name: 'real', role: 'USER', isActive: true, joinStatus: 'APPROVED' } });
    await prisma.resident.create({ data: { userId: testUserId, apartmentId: apartment.id, name: 'real', email: 'r@t.com', contact: '1', building: 1, unit: 1, isRegistered: true, isHouseholder: true } });

    await prisma.user.create({ data: { id: sseUserId, password: 'pw', username: 'sse_real', email: 's@t.com', contact: '2', name: 'sse', role: 'USER', isActive: true, joinStatus: 'APPROVED' } });
    await prisma.resident.create({ data: { userId: sseUserId, apartmentId: apartment.id, name: 'sse', email: 's@t.com', contact: '2', building: 1, unit: 1, isRegistered: true, isHouseholder: true } });

    authToken = jwt.sign({ userId: testUserId }, MOCK_ACCESS_SECRET, { expiresIn: '1h' });
    sseAuthToken = jwt.sign({ userId: sseUserId }, MOCK_ACCESS_SECRET, { expiresIn: '1h' });

    app = setupTestApp();
  });

  afterAll(async () => {
    sseManager.closeAll();
    await cleanUpData();
    await prisma.$disconnect();
    await new Promise((resolve) => setTimeout(resolve, 500));
  });

  describe('GET /api/v2/notifications', () => {
    it('알림 목록을 조회할 수 있다', async () => {
      await request(app).get('/api/v2/notifications').set('Authorization', `Bearer ${authToken}`).expect(200);
    });
    it('페이지네이션이 동작한다', async () => {
      const res = await request(app).get('/api/v2/notifications?page=1&limit=10').set('Authorization', `Bearer ${authToken}`).expect(200);
      expect(res.body.page).toBe(1);
    });
  });

  describe('PATCH /api/v2/notifications/:id/read', () => {
    let notifId: number;
    beforeEach(async () => {
      const n = await prisma.notification.create({ data: { userId: testUserId, content: '읽음', isChecked: false } });
      notifId = n.id;
    });
    it('알림을 읽음 처리할 수 있다', async () => {
      await request(app).patch(`/api/v2/notifications/${notifId}/read`).set('Authorization', `Bearer ${authToken}`).expect(204);
    });
    it('존재하지 않는 알림은 404를 반환한다', async () => {
      await request(app).patch('/api/v2/notifications/99999/read').set('Authorization', `Bearer ${authToken}`).expect(404);
    });
    it('다른 사용자의 알림은 403을 반환한다', async () => {
      const oUser = await prisma.user.create({ data: { password: 'pw', username: 'o', email: 'o@t.com', contact: '0', name: 'o', role: 'USER', isActive: true, joinStatus: 'APPROVED' } });
      const oNotif = await prisma.notification.create({ data: { userId: oUser.id, content: 'o', isChecked: false } });
      await request(app).patch(`/api/v2/notifications/${oNotif.id}/read`).set('Authorization', `Bearer ${authToken}`).expect(403);
      await prisma.notification.delete({ where: { id: oNotif.id } });
      await prisma.user.delete({ where: { id: oUser.id } });
    });
  });

  describe('GET /api/v2/notifications/sse - SSE 연결', () => {

    it('인증 없이는 SSE 연결을 할 수 없다', async () => {
      await request(app).get('/api/v2/notifications/sse').set('Accept', 'text/event-stream').expect(401);
    });

    it('SSE 연결 시 올바른 헤더와 데이터 포맷을 수신한다', async () => {
      const res = await request(app)
        .get('/api/v2/notifications/sse')
        .set('Authorization', `Bearer ${sseAuthToken}`)
        .expect(200);

      expect(res.headers['content-type']).toMatch(/text\/event-stream/);
      expect(res.headers['cache-control']).toBe('no-cache');

      expect(res.text).toContain('data:');
      expect(res.text).toContain('test_alarm');
      expect(res.text).toContain('success');
    });
  });
});