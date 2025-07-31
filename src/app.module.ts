import { Module } from '@nestjs/common';
import { RedisModule } from './redis/redis.module';
import { EventsModule } from './events/events.module';
import { SyncModule } from './sync/sync.module';
import { PlaywrightModule } from './playwright/playwright.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    RedisModule,
    EventsModule,
    SyncModule,
    PlaywrightModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}