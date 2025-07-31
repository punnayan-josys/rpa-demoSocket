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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const playwright_service_1 = require("./playwright/playwright.service");
const redis_service_1 = require("./redis/redis.service");
let AppController = class AppController {
    constructor(playwrightService, redisService) {
        this.playwrightService = playwrightService;
        this.redisService = redisService;
    }
    getHello() {
        return 'RPA Socket.IO Demo with Multi-Room Support';
    }
    async startWorker(sessionId) {
        await this.playwrightService.startWorker(sessionId);
        return { message: `Worker started for session: ${sessionId}` };
    }
    async startMultiRoomWorkers(roomConfigs) {
        await this.playwrightService.startMultipleWorkers(roomConfigs);
        return {
            message: `Started ${roomConfigs.length} workers for different rooms`,
            rooms: roomConfigs
        };
    }
    async getQueueContents(sessionId, queueType) {
        const contents = await this.redisService.getQueueContents(sessionId, queueType);
        return {
            sessionId,
            queueType,
            contents: contents.map(item => JSON.parse(item))
        };
    }
    async getRoomStatus(roomId) {
        // Get all sessions for a specific room
        const sessions = [
            `${roomId}-session-1`,
            `${roomId}-session-2`
        ];
        const roomStatus = {};
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
                    await this.redisService.pushToPending(sessionId, Object.assign(Object.assign({}, step), { roomId: roomId, timestamp: new Date().toISOString() }));
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
    async getRedisStats() {
        return await this.redisService.getRedisStats();
    }
    async getActiveSessions() {
        const sessions = await this.redisService.getActiveSessions();
        return {
            activeSessions: sessions,
            count: sessions.length
        };
    }
    async getRoomSessions(roomId) {
        const sessions = await this.redisService.getRoomSessions(roomId);
        return {
            roomId,
            sessions,
            count: sessions.length
        };
    }
    async cleanupExpiredSessions() {
        const cleanedCount = await this.redisService.cleanupExpiredSessions();
        return {
            message: 'Cleanup completed',
            cleanedCount
        };
    }
    async clearSessionData(sessionId) {
        const deletedCount = await this.redisService.clearSessionData(sessionId);
        return {
            message: `Session data cleared for ${sessionId}`,
            deletedCount
        };
    }
    async clearRoomData(roomId) {
        const deletedCount = await this.redisService.clearAllRoomData(roomId);
        return {
            message: `Room data cleared for ${roomId}`,
            deletedCount
        };
    }
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
};
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", String)
], AppController.prototype, "getHello", null);
__decorate([
    (0, common_1.Post)('start-worker/:sessionId'),
    __param(0, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "startWorker", null);
__decorate([
    (0, common_1.Post)('start-multi-room-workers'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "startMultiRoomWorkers", null);
__decorate([
    (0, common_1.Get)('queue/:sessionId/:queueType'),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('queueType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getQueueContents", null);
__decorate([
    (0, common_1.Get)('rooms/:roomId/status'),
    __param(0, (0, common_1.Param)('roomId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getRoomStatus", null);
__decorate([
    (0, common_1.Post)('demo/setup'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "setupDemo", null);
__decorate([
    (0, common_1.Get)('redis/stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getRedisStats", null);
__decorate([
    (0, common_1.Get)('redis/sessions/active'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getActiveSessions", null);
__decorate([
    (0, common_1.Get)('redis/sessions/room/:roomId'),
    __param(0, (0, common_1.Param)('roomId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getRoomSessions", null);
__decorate([
    (0, common_1.Post)('redis/cleanup'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "cleanupExpiredSessions", null);
__decorate([
    (0, common_1.Delete)('redis/session/:sessionId'),
    __param(0, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "clearSessionData", null);
__decorate([
    (0, common_1.Delete)('redis/room/:roomId'),
    __param(0, (0, common_1.Param)('roomId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "clearRoomData", null);
__decorate([
    (0, common_1.Delete)('redis/clear-all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "clearAllData", null);
AppController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [playwright_service_1.PlaywrightService,
        redis_service_1.RedisService])
], AppController);
exports.AppController = AppController;
