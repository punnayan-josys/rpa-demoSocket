import { Module, forwardRef } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { RedisModule } from '../redis/redis.module';
import { SyncModule } from '../sync/sync.module';

@Module({
  imports: [RedisModule, forwardRef(() => SyncModule)],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule {}