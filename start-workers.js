const { PlaywrightService } = require('./dist/playwright/playwright.service');
const { RedisService } = require('./dist/redis/redis.service');
const { SyncService } = require('./dist/sync/sync.service');
const { EventsGateway } = require('./dist/events/events.gateway');

// This script demonstrates how to start multiple workers for different rooms
async function startMultiRoomWorkers() {
  console.log('🚀 Starting Multi-Room RPA Workers Demo...\n');

  // Initialize services (in a real app, this would be done by NestJS DI)
  const redisService = new RedisService();
  const eventsGateway = new EventsGateway(redisService);
  const syncService = new SyncService(redisService, eventsGateway);
  const playwrightService = new PlaywrightService(redisService, syncService);

  // Define room configurations
  const roomConfigs = [
    { sessionId: 'room-1-session-1', roomId: 'room-1' },
    { sessionId: 'room-1-session-2', roomId: 'room-1' },
    { sessionId: 'room-2-session-1', roomId: 'room-2' },
    { sessionId: 'room-2-session-2', roomId: 'room-2' },
    { sessionId: 'room-3-session-1', roomId: 'room-3' },
    { sessionId: 'room-3-session-2', roomId: 'room-3' }
  ];

  console.log('📋 Room Configurations:');
  roomConfigs.forEach(config => {
    console.log(`   - Session: ${config.sessionId} | Room: ${config.roomId}`);
  });

  console.log('\n🔄 Starting workers for each room...\n');

  try {
    // Start workers for all rooms
    await playwrightService.startMultipleWorkers(roomConfigs);
  } catch (error) {
    console.error('❌ Error starting workers:', error);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down workers...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down workers...');
  process.exit(0);
});

// Start the workers
startMultiRoomWorkers().catch(console.error); 