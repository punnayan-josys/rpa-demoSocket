import { Module, forwardRef } from '@nestjs/common';
import { SyncService } from './sync.service';
import { EventsModule } from '../events/events.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [RedisModule, forwardRef(() => EventsModule)],
  providers: [SyncService],
  exports: [SyncService],
})
export class SyncModule {}