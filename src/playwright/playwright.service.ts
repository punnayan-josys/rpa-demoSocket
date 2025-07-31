import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { SyncService } from '../sync/sync.service';

@Injectable()
export class PlaywrightService {
  constructor(
    private readonly redisService: RedisService,
    private readonly syncService: SyncService,
  ) {}

  async startWorker(sessionId: string, roomId?: string) {
    console.log(`Starting worker for session ${sessionId} in room ${roomId || 'default'}`);
    
    while (true) {
      const step = await this.redisService.fetchFromPending(sessionId);
      if (step) {
        console.log(`Processing step in room ${roomId || 'default'} for session ${sessionId}: ${JSON.stringify(step)}`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate work
        await this.syncService.handleStepCompletion(sessionId, step, 1, roomId); // Pass roomId for room-based communication
      }
    }
  }

  // Method to start multiple workers for different rooms
  async startMultipleWorkers(roomConfigs: Array<{ sessionId: string; roomId: string }>) {
    const workers = roomConfigs.map(config => 
      this.startWorker(config.sessionId, config.roomId)
    );
    
    console.log(`Started ${workers.length} workers for different rooms`);
    await Promise.all(workers);
  }
}