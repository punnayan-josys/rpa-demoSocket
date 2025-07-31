import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { PlaywrightService } from './playwright/playwright.service';
import { RedisService } from './redis/redis.service';

@Controller()
export class AppController {
  constructor(
    private readonly playwrightService: PlaywrightService,
    private readonly redisService: RedisService,
  ) {}

  @Get()
  getHello(): string {
    return 'RPA Socket.IO Demo with Multi-Room Support';
  }

  @Post('start-worker/:sessionId')
  async startWorker(@Param('sessionId') sessionId: string) {
    await this.playwrightService.startWorker(sessionId);
    return { message: `Worker started for session: ${sessionId}` };
  }

  @Post('start-multi-room-workers')
  async startMultiRoomWorkers(@Body() roomConfigs: Array<{ sessionId: string; roomId: string }>) {
    await this.playwrightService.startMultipleWorkers(roomConfigs);
    return { 
      message: `Started ${roomConfigs.length} workers for different rooms`,
      rooms: roomConfigs 
    };
  }

  @Get('queue/:sessionId/:queueType')
  async getQueueContents(
    @Param('sessionId') sessionId: string,
    @Param('queueType') queueType: 'pending' | 'completed' | 'history'
  ) {
    const contents = await this.redisService.getQueueContents(sessionId, queueType);
    return {
      sessionId,
      queueType,
      contents: contents.map(item => JSON.parse(item))
    };
  }

  @Get('rooms/:roomId/status')
  async getRoomStatus(@Param('roomId') roomId: string) {
    // Get all sessions for a specific room
    const sessions = [
      `${roomId}-session-1`,
      `${roomId}-session-2`
    ];

    const roomStatus: Record<string, any> = {};
    
    for (const sessionId of sessions) {
      roomStatus[sessionId] = {
        pending: await this.redisService.getQueueContents(sessionId, 'pending'),
        completed: await this.redisService.getQueueContents(sessionId, 'completed'),
        history: await this.redisService.getQueueContents(sessionId, 'history')
      };
    }

    return {
      roomId,
      sessions: roomStatus
    };
  }

  @Post('demo/setup')
  async setupDemo() {
    // Setup demo rooms with sample data
    const demoRooms = ['room-1', 'room-2', 'room-3'];
    const demoSteps = [
      { action: 'click', target: '#button1', data: 'Demo step 1' },
      { action: 'type', target: '#input1', data: 'Demo step 2' },
      { action: 'scroll', target: '#section1', data: 'Demo step 3' }
    ];

    for (const roomId of demoRooms) {
      for (let i = 1; i <= 2; i++) {
        const sessionId = `${roomId}-session-${i}`;
        for (const step of demoSteps) {
          await this.redisService.pushToPending(sessionId, {
            ...step,
            roomId: roomId,
            timestamp: new Date().toISOString()
          });
        }
      }
    }

    return {
      message: 'Demo setup completed',
      rooms: demoRooms,
      sessionsPerRoom: 2,
      stepsPerSession: demoSteps.length
    };
  }

  // Redis Maintenance Endpoints

  @Get('redis/stats')
  async getRedisStats() {
    return await this.redisService.getRedisStats();
  }

  @Get('redis/sessions/active')
  async getActiveSessions() {
    const sessions = await this.redisService.getActiveSessions();
    return {
      activeSessions: sessions,
      count: sessions.length
    };
  }

  @Get('redis/sessions/room/:roomId')
  async getRoomSessions(@Param('roomId') roomId: string) {
    const sessions = await this.redisService.getRoomSessions(roomId);
    return {
      roomId,
      sessions,
      count: sessions.length
    };
  }

  @Post('redis/cleanup')
  async cleanupExpiredSessions() {
    const cleanedCount = await this.redisService.cleanupExpiredSessions();
    return {
      message: 'Cleanup completed',
      cleanedCount
    };
  }

  @Delete('redis/session/:sessionId')
  async clearSessionData(@Param('sessionId') sessionId: string) {
    const deletedCount = await this.redisService.clearSessionData(sessionId);
    return {
      message: `Session data cleared for ${sessionId}`,
      deletedCount
    };
  }

  @Delete('redis/room/:roomId')
  async clearRoomData(@Param('roomId') roomId: string) {
    const deletedCount = await this.redisService.clearAllRoomData(roomId);
    return {
      message: `Room data cleared for ${roomId}`,
      deletedCount
    };
  }

  @Delete('redis/clear-all')
  async clearAllData() {
    const activeSessions = await this.redisService.getActiveSessions();
    let totalDeleted = 0;

    for (const sessionId of activeSessions) {
      const deletedCount = await this.redisService.clearSessionData(sessionId);
      totalDeleted += deletedCount;
    }

    return {
      message: 'All data cleared',
      sessionsProcessed: activeSessions.length,
      totalDeleted
    };
  }
}