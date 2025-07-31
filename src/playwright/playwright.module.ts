import { Module } from '@nestjs/common';
import { PlaywrightService } from './playwright.service';
import { RedisModule } from '../redis/redis.module';
import { SyncModule } from '../sync/sync.module';

@Module({
  imports: [RedisModule, SyncModule],
  providers: [PlaywrightService],
  exports: [PlaywrightService],
})
export class PlaywrightModule {}