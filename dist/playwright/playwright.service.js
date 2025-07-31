"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaywrightService = void 0;
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../redis/redis.service");
const sync_service_1 = require("../sync/sync.service");
let PlaywrightService = class PlaywrightService {
    constructor(redisService, syncService) {
        this.redisService = redisService;
        this.syncService = syncService;
    }
    async startWorker(sessionId, roomId) {
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
    async startMultipleWorkers(roomConfigs) {
        const workers = roomConfigs.map(config => this.startWorker(config.sessionId, config.roomId));
        console.log(`Started ${workers.length} workers for different rooms`);
        await Promise.all(workers);
    }
};
PlaywrightService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService,
        sync_service_1.SyncService])
], PlaywrightService);
exports.PlaywrightService = PlaywrightService;
