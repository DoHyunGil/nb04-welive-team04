// src/poll/utils/polls.scheduler.ts
import cron from 'node-cron';
import pollsService from '../services/polls.service.js';

export function initPollsScheduler(): void {
  cron.schedule('* * * * *', async () => {
    try {
      console.log('[스케줄러] 투표 상태 업데이트 시작...');
      const result = await pollsService.updatePollStatuses();
      console.log('[스케줄러] 투표 상태 업데이트 완료:', result);
    } catch (error) {
      console.error('[스케줄러] 투표 상태 업데이트 실패:', error);
    }
  });

  console.log('✅ 투표 상태 스케줄러가 시작되었습니다. (매 분마다 실행)');
}
