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
exports.RedisController = void 0;
const common_1 = require("@nestjs/common");
const redis_service_1 = require("./redis.service");
let RedisController = class RedisController {
    constructor(redisService) {
        this.redisService = redisService;
    }
    // ===== REDIS STATISTICS & MONITORING =====
    async getRedisStats() {
        return await this.redisService.getRedisStats();
    }
    async getRedisHealth() {
        try {
            const stats = await this.redisService.getRedisStats();
            return {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                stats: {
                    totalKeys: stats.totalKeys,
                    pendingKeys: stats.pendingKeys,
                    processingKeys: stats.processingKeys,
                    completedKeys: stats.completedKeys,
                    historyKeys: stats.historyKeys
                }
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async getActiveSessions() {
        const sessions = await this.redisService.getActiveSessions();
        return {
            activeSessions: sessions,
            count: sessions.length,
            timestamp: new Date().toISOString()
        };
    }
    async getRoomSessions(roomId) {
        const sessions = await this.redisService.getRoomSessions(roomId);
        return {
            roomId,
            sessions,
            count: sessions.length,
            timestamp: new Date().toISOString()
        };
    }
    // ===== QUEUE OPERATIONS =====
    async getQueueContents(sessionId, queueType) {
        const contents = await this.redisService.getQueueContents(sessionId, queueType);
        return {
            sessionId,
            queueType,
            count: contents.length,
            contents: contents.map(item => JSON.parse(item)),
            timestamp: new Date().toISOString()
        };
    }
    async addToPending(sessionId, step) {
        await this.redisService.pushToPending(sessionId, step);
        return {
            message: 'Step added to pending queue',
            sessionId,
            step,
            timestamp: new Date().toISOString()
        };
    }
    async getProcessingStep(sessionId) {
        // Get the current processing step (first item in processing list)
        const processingKey = `processing_steps:${sessionId}`;
        const step = await this.redisService.client.lindex(processingKey, 0);
        return {
            sessionId,
            processingStep: step ? JSON.parse(step) : null,
            timestamp: new Date().toISOString()
        };
    }
    // ===== TESTING & DEMO OPERATIONS =====
    async setupDemo() {
        const demoRooms = ['room-1', 'room-2', 'room-3'];
        const demoSteps = [
            { action: 'click', target: '#button1', data: 'Demo step 1', timestamp: new Date().toISOString() },
            { action: 'type', target: '#input1', data: 'Demo step 2', timestamp: new Date().toISOString() },
            { action: 'scroll', target: '#section1', data: 'Demo step 3', timestamp: new Date().toISOString() },
            { action: 'wait', target: '2s', data: 'Demo step 4', timestamp: new Date().toISOString() },
            { action: 'screenshot', target: 'page', data: 'Demo step 5', timestamp: new Date().toISOString() }
        ];
        let totalSteps = 0;
        for (const roomId of demoRooms) {
            for (let i = 1; i <= 2; i++) {
                const sessionId = `${roomId}-session-${i}`;
                for (const step of demoSteps) {
                    await this.redisService.pushToPending(sessionId, Object.assign(Object.assign({}, step), { roomId: roomId, sessionId: sessionId, stepId: `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` }));
                    totalSteps++;
                }
            }
        }
        return {
            message: 'Demo data setup completed',
            rooms: demoRooms,
            sessionsPerRoom: 2,
            stepsPerSession: demoSteps.length,
            totalSteps,
            timestamp: new Date().toISOString()
        };
    }
    async simulateProcessing(body) {
        const { sessionId, stepCount = 1 } = body;
        // Simulate fetching and processing steps
        const results = [];
        for (let i = 0; i < stepCount; i++) {
            const step = await this.redisService.fetchFromPending(sessionId);
            if (step) {
                // Simulate processing time
                await new Promise(resolve => setTimeout(resolve, 1000));
                // Log completion
                await this.redisService.logCompletion(sessionId, step, i + 1);
                results.push({
                    stepNumber: i + 1,
                    step: JSON.parse(step),
                    processedAt: new Date().toISOString()
                });
            }
        }
        return {
            message: 'Processing simulation completed',
            sessionId,
            processedSteps: results.length,
            results,
            timestamp: new Date().toISOString()
        };
    }
    // ===== CLEANUP OPERATIONS =====
    async cleanupExpiredSessions() {
        const cleanedCount = await this.redisService.cleanupExpiredSessions();
        return {
            message: 'Cleanup completed',
            cleanedCount,
            timestamp: new Date().toISOString()
        };
    }
    async clearSessionData(sessionId) {
        const deletedCount = await this.redisService.clearSessionData(sessionId);
        return {
            message: `Session data cleared for ${sessionId}`,
            sessionId,
            deletedCount,
            timestamp: new Date().toISOString()
        };
    }
    async clearRoomData(roomId) {
        const deletedCount = await this.redisService.clearAllRoomData(roomId);
        return {
            message: `Room data cleared for ${roomId}`,
            roomId,
            deletedCount,
            timestamp: new Date().toISOString()
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
            totalDeleted,
            timestamp: new Date().toISOString()
        };
    }
    // ===== ADVANCED TESTING OPERATIONS =====
    async loadTest(body) {
        const { roomId, sessions, stepsPerSession } = body;
        const results = [];
        for (let i = 1; i <= sessions; i++) {
            const sessionId = `${roomId}-session-${i}`;
            const sessionResults = [];
            for (let j = 1; j <= stepsPerSession; j++) {
                const step = {
                    action: `load-test-action-${j}`,
                    target: `#element-${j}`,
                    data: `Load test data ${j}`,
                    roomId,
                    sessionId,
                    stepId: `load-test-${Date.now()}-${i}-${j}`,
                    timestamp: new Date().toISOString()
                };
                await this.redisService.pushToPending(sessionId, step);
                sessionResults.push(step);
            }
            results.push({
                sessionId,
                stepsAdded: sessionResults.length,
                steps: sessionResults
            });
        }
        return {
            message: 'Load test completed',
            roomId,
            sessionsCreated: sessions,
            totalStepsAdded: sessions * stepsPerSession,
            results,
            timestamp: new Date().toISOString()
        };
    }
    async compareRooms(rooms) {
        const roomIds = rooms ? rooms.split(',') : ['room-1', 'room-2', 'room-3'];
        const comparison = {};
        for (const roomId of roomIds) {
            const sessions = await this.redisService.getRoomSessions(roomId);
            const roomStats = {
                sessions: sessions.length,
                pendingSteps: 0,
                processingSteps: 0,
                completedSteps: 0,
                historySteps: 0
            };
            for (const sessionId of sessions) {
                const pending = await this.redisService.getQueueContents(sessionId, 'pending');
                const completed = await this.redisService.getQueueContents(sessionId, 'completed');
                const history = await this.redisService.getQueueContents(sessionId, 'history');
                roomStats.pendingSteps += pending.length;
                roomStats.completedSteps += completed.length;
                roomStats.historySteps += history.length;
                // Check processing step
                const processingKey = `processing_steps:${sessionId}`;
                const processingStep = await this.redisService.client.lindex(processingKey, 0);
                if (processingStep)
                    roomStats.processingSteps++;
            }
            comparison[roomId] = roomStats;
        }
        return {
            message: 'Room comparison completed',
            comparison,
            timestamp: new Date().toISOString()
        };
    }
    async validateArchitecture() {
        const activeSessions = await this.redisService.getActiveSessions();
        const validationResults = [];
        for (const sessionId of activeSessions) {
            const validation = {
                sessionId,
                pending: { exists: false, count: 0, type: 'list' },
                processing: { exists: false, count: 0, type: 'list' },
                completed: { exists: false, count: 0, type: 'list', capped: false },
                history: { exists: false, count: 0, type: 'sorted-set' },
                isValid: true
            };
            // Check pending queue
            const pendingKey = `pending_steps:${sessionId}`;
            const pendingExists = await this.redisService.client.exists(pendingKey);
            if (pendingExists) {
                validation.pending.exists = true;
                validation.pending.count = await this.redisService.client.llen(pendingKey);
            }
            // Check processing queue
            const processingKey = `processing_steps:${sessionId}`;
            const processingExists = await this.redisService.client.exists(processingKey);
            if (processingExists) {
                validation.processing.exists = true;
                validation.processing.count = await this.redisService.client.llen(processingKey);
            }
            // Check completed queue
            const completedKey = `completed_steps:${sessionId}`;
            const completedExists = await this.redisService.client.exists(completedKey);
            if (completedExists) {
                validation.completed.exists = true;
                validation.completed.count = await this.redisService.client.llen(completedKey);
                validation.completed.capped = validation.completed.count <= 3;
            }
            // Check history queue
            const historyKey = `history_steps:${sessionId}`;
            const historyExists = await this.redisService.client.exists(historyKey);
            if (historyExists) {
                validation.history.exists = true;
                validation.history.count = await this.redisService.client.zcard(historyKey);
            }
            // Validate architecture
            validation.isValid = validation.pending.exists &&
                validation.processing.exists &&
                validation.completed.exists &&
                validation.history.exists &&
                validation.completed.capped;
            validationResults.push(validation);
        }
        const validSessions = validationResults.filter(v => v.isValid).length;
        const totalSessions = validationResults.length;
        return {
            message: 'Architecture validation completed',
            totalSessions,
            validSessions,
            invalidSessions: totalSessions - validSessions,
            validationResults,
            timestamp: new Date().toISOString()
        };
    }
};
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RedisController.prototype, "getRedisStats", null);
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RedisController.prototype, "getRedisHealth", null);
__decorate([
    (0, common_1.Get)('sessions/active'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RedisController.prototype, "getActiveSessions", null);
__decorate([
    (0, common_1.Get)('sessions/room/:roomId'),
    __param(0, (0, common_1.Param)('roomId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RedisController.prototype, "getRoomSessions", null);
__decorate([
    (0, common_1.Get)('queue/:sessionId/:queueType'),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('queueType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], RedisController.prototype, "getQueueContents", null);
__decorate([
    (0, common_1.Post)('queue/:sessionId/pending'),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RedisController.prototype, "addToPending", null);
__decorate([
    (0, common_1.Get)('queue/:sessionId/processing'),
    __param(0, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RedisController.prototype, "getProcessingStep", null);
__decorate([
    (0, common_1.Post)('demo/setup'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RedisController.prototype, "setupDemo", null);
__decorate([
    (0, common_1.Post)('demo/simulate-processing'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RedisController.prototype, "simulateProcessing", null);
__decorate([
    (0, common_1.Post)('cleanup'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RedisController.prototype, "cleanupExpiredSessions", null);
__decorate([
    (0, common_1.Delete)('session/:sessionId'),
    __param(0, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RedisController.prototype, "clearSessionData", null);
__decorate([
    (0, common_1.Delete)('room/:roomId'),
    __param(0, (0, common_1.Param)('roomId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RedisController.prototype, "clearRoomData", null);
__decorate([
    (0, common_1.Delete)('clear-all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RedisController.prototype, "clearAllData", null);
__decorate([
    (0, common_1.Post)('test/load-test'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RedisController.prototype, "loadTest", null);
__decorate([
    (0, common_1.Get)('test/room-comparison'),
    __param(0, (0, common_1.Query)('rooms')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RedisController.prototype, "compareRooms", null);
__decorate([
    (0, common_1.Post)('test/validate-architecture'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RedisController.prototype, "validateArchitecture", null);
RedisController = __decorate([
    (0, common_1.Controller)('redis'),
    __metadata("design:paramtypes", [redis_service_1.RedisService])
], RedisController);
exports.RedisController = RedisController;
