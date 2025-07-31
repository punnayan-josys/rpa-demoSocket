import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { SyncService } from '../sync/sync.service';

@Injectable()
export class PlaywrightService {
  constructor(
    private readonly redisService: RedisService,
    private readonly syncService: SyncService,
  ) {}

  async startWorker(sessionId: string) {
    while (true) {
      const step = await this.redisService.fetchFromPending(sessionId);
      if (step) {
        console.log(`Processing step: ${step}`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate work
        await this.syncService.handleStepCompletion(sessionId, step, 1); // Assuming stepCount is 1 for simplicity
      }
    }
  }
}