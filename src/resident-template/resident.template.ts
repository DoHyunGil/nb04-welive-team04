import type { NextFunction, Request, Response } from 'express';
import { Readable } from 'stream';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import type { GetResidentsDto } from '../lib/type/express/resident.index.js';
import residentsRepository from '../residents/repositories/residents.repository.js';
import { stringify } from 'csv-stringify';

const RESIDENT_TEMPLATE_KEY = 'resident_template.csv';

const REGION = process.env.AWS_REGION || 'ap-northeast-2';
const ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || '';
const SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || '';
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || '';

if (!ACCESS_KEY_ID || !SECRET_ACCESS_KEY || !BUCKET_NAME) {
  console.warn(
    'AWS credentials or bucket name not set. S3 functionality will not work.',
  );
}

const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
});

class ResidentsTemplateController {
  async downloadTemplate(req: Request, res: Response) {
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: RESIDENT_TEMPLATE_KEY,
      });

      const s3Response = await s3Client.send(command);
      if (!s3Response.Body) {
        throw new Error('S3에서 파일을 찾을 수 없습니다.');
      }

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=resident_template.csv',
      );
      (s3Response.Body as Readable).pipe(res);
    } catch (error) {
      console.error('템플릿 파일 전송 실패:', error);
      if (!res.headersSent) {
        res
          .status(500)
          .json({ message: '템플릿 파일을 불러오는데 실패했습니다' });
      }
    }
  }
  async getResidentList(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = Number(req.user?.id);
      const dto: GetResidentsDto = req.query;
      const filters: Record<string, unknown> = {};
      if (dto.searchKeyword) {
        filters.OR = [
          { contact: { contains: dto.searchKeyword } },
          { name: { contains: dto.searchKeyword } },
        ];
      }
      if (dto.building) filters.building = Number(dto.building);
      if (dto.unit) filters.unit = Number(dto.unit);
      if (dto.isHouseholder !== undefined) {
        filters.isHouseholder = dto.isHouseholder === 'true';
      }
      if (dto.isRegistered !== undefined) {
        filters.isRegistered = dto.isRegistered === 'true';
      }
      const residents = await residentsRepository.getResidents(
        userId,
        1,
        filters,
      );
      // 3. 파일명 생성
      const d = new Date();
      const YYYYMMDD =
        d.getFullYear() +
        String(d.getMonth() + 1).padStart(2, '0') +
        String(d.getDate()).padStart(2, '0');
      const HHMMSS =
        String(d.getHours()).padStart(2, '0') +
        String(d.getMinutes()).padStart(2, '0') +
        String(d.getSeconds()).padStart(2, '0');
      const fileName = `입주민명부_${YYYYMMDD}_${HHMMSS}.csv`;
      const encodedFileName = encodeURIComponent(fileName)
        .replace(/['()]/g, escape)
        .replace(/\*/g, '%2A');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="residents.csv"; filename*=UTF-8''${encodedFileName}`,
      );
      res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
      res.write('\ufeff');

      // 4. CSV 변환 및 스트리밍
      const stringifier = stringify({
        header: true,
        columns: [
          { key: 'building', header: '동' },
          { key: 'unit', header: '호수' },
          { key: 'name', header: '이름' },
          { key: 'contact', header: '연락처' },
          { key: 'email', header: '이메일' },
          { key: 'isHouseholder', header: '세대주여부' },
        ],
      });
      stringifier.pipe(res);

      residents.forEach((resident) => {
        stringifier.write({
          building: resident.building,
          unit: resident.unit,
          name: resident.name,
          contact: resident.contact,
          email: resident.email,
          isHouseholder: resident.isHouseholder ? 'TRUE' : 'FALSE',
        });
      });

      stringifier.end();
    } catch (error) {
      console.error('CSV 내보내기 실패:', error);
      next(error);
      res
        .status(500)
        .json({ message: '데이터를 내보내는 중 오류가 발생했습니다.' });
    }
  }
}

export default new ResidentsTemplateController();
