import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class SyncService {
  constructor(
    private readonly redisService: RedisService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async handleStepCompletion(sessionId: string, step: any, stepCount: number, roomId?: string) {
    await this.redisService.logCompletion(sessionId, step, stepCount);
    await this.redisService.clearProcessing(sessionId);
    this.eventsGateway.sendCompletionToClient(sessionId, step, roomId);
  }
}