import type { NextFunction, Request, Response } from 'express';
import { Readable } from 'stream';
import type { GetResidentsDto } from '../lib/type/express/resident.index.js';
import residentsRepository from '../residents/repositories/residents.repository.js';
import residentsService from '../residents/services/residents.service.js';
import { stringify } from 'csv-stringify';
import { parse } from 'csv-parse';

class ResidentsTemplateController {
  async downloadTemplate(req: Request, res: Response) {
    try {
      // res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      // res.setHeader(
      //   'Content-Disposition',
      //   'attachment; filename=resident_template.csv',
      // );
      //res.write('\ufeff');

      const stringifier = stringify({
        header: true,
        columns: [
          { key: 'building', header: '동' },
          { key: 'unit', header: '호수' },
          { key: 'name', header: '이름' },
          { key: 'email', header: '이메일' },
          { key: 'contact', header: '연락처' },
          { key: 'isHouseholder', header: '세대주여부' },
        ],
      });

      stringifier.pipe(res);

      stringifier.write({
        building: '1',
        unit: '102',
        name: '홍길동',
        email: 'test@test.com',
        contact: "'01011111111",
        isHouseholder: 'FALSE',
      });

      stringifier.end();
    } catch (error) {
      console.error('템플릿 파일 전송 실패:', error);
      if (!res.headersSent) {
        res
          .status(500)
          .json({ message: '템플릿 파일을 불러오는데 실패했습니다' });
      }
    }
  }
  async exportResidentList(req: Request, res: Response, next: NextFunction) {
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
      next(error);
      res
        .status(500)
        .json({ message: '데이터를 내보내는 중 오류가 발생했습니다.' });
    }
  }
  async importResidentList(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: '업로드된 파일이 없습니다.' });
      }
      const userId = Number(req.user?.id);
      const results: any[] = [];
      const parser = Readable.from(req.file.buffer).pipe(
        parse({
          columns: true,
          skip_empty_lines: true,
          trim: true,
          bom: true,
        }),
      );
      for await (const record of parser) {
        results.push({
          building: Number(record['동']),
          unit: Number(record['호수']),
          name: record['이름'],
          contact: record['연락처'],
          email: record['이메일'],
          isHouseholder: record['세대주여부']?.toUpperCase() === 'TRUE',
        });
      }
      const finalResult = await residentsService.createResidents(
        userId,
        results,
      );

      res.status(200).json({
        count: finalResult.length,
        message: '명부가 성공적으로 업로드되었습니다.',
      });
    } catch (error) {
      next(error);
      res
        .status(500)
        .json({ message: '데이터 업로드 중 오류가 발생했습니다.' });
    }
  }
}

export default new ResidentsTemplateController();
