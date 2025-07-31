import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService {
  private client: Redis;

  constructor() {
    this.client = new Redis(); // Initialize Redis client
  }

  async pushToPending(sessionId: string, step: any) {
    await this.client.lpush(`pending_steps:${sessionId}`, JSON.stringify(step));
  }

  async fetchFromPending(sessionId: string) {
    const step = await this.client.blmove(
      `pending_steps:${sessionId}`,
      `processing_steps:${sessionId}`,
      'LEFT',
      'RIGHT',
      0
    );
    return step ? JSON.parse(step) : null;
  }

  async logCompletion(sessionId: string, step: any, stepCount: number) {
    await this.client.lpush(`completed_steps:${sessionId}`, JSON.stringify(step));
    await this.client.ltrim(`completed_steps:${sessionId}`, 0, 2);
    await this.client.zadd(`history_steps:${sessionId}`, stepCount, JSON.stringify(step));
  }

  async clearProcessing(sessionId: string) {
    await this.client.lpop(`processing_steps:${sessionId}`);
  }

  async getQueueContents(sessionId: string, queueType: 'pending' | 'completed' | 'history') {
    if (queueType === 'pending') {
      return await this.client.lrange(`pending_steps:${sessionId}`, 0, -1);
    } else if (queueType === 'completed') {
      return await this.client.lrange(`completed_steps:${sessionId}`, 0, -1);
    } else if (queueType === 'history') {
      return await this.client.zrange(`history_steps:${sessionId}`, 0, -1);
    }
    return [];
  }
}