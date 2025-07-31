import { Controller, Get, Param } from '@nestjs/common';
import { RedisService } from './redis/redis.service';

@Controller('session')
export class AppController {
  constructor(private readonly redisService: RedisService) {}

  @Get(':sessionId/pending')
  async getPending(@Param('sessionId') sessionId: string) {
    return this.redisService.getQueueContents(sessionId, 'pending');
  }

  @Get(':sessionId/completed')
  async getCompleted(@Param('sessionId') sessionId: string) {
    return this.redisService.getQueueContents(sessionId, 'completed');
  }

  @Get(':sessionId/history')
  async getHistory(@Param('sessionId') sessionId: string) {
    return this.redisService.getQueueContents(sessionId, 'history');
  }
}