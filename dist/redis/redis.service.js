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
var RedisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = require("ioredis");
let RedisService = RedisService_1 = class RedisService {
    constructor() {
        this.logger = new common_1.Logger(RedisService_1.name);
        const redisConfig = {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            db: parseInt(process.env.REDIS_DB || '0'),
            maxRetriesPerRequest: 3,
            lazyConnect: true,
        };
        if (process.env.REDIS_PASSWORD) {
            redisConfig.password = process.env.REDIS_PASSWORD;
        }
        this.client = new ioredis_1.Redis(redisConfig);
        // Setup Redis event listeners for monitoring
        this.setupRedisEventListeners();
    }
    setupRedisEventListeners() {
        this.client.on('connect', () => {
            this.logger.log('Redis client connected');
        });
        this.client.on('ready', () => {
            this.logger.log('Redis client ready');
        });
        this.client.on('error', (error) => {
            this.logger.error('Redis client error:', error);
        });
        this.client.on('close', () => {
            this.logger.warn('Redis client connection closed');
        });
        this.client.on('reconnecting', () => {
            this.logger.log('Redis client reconnecting...');
        });
    }
    async pushToPending(sessionId, step) {
        try {
            const key = `pending_steps:${sessionId}`;
            await this.client.lpush(key, JSON.stringify(step));
            // Set TTL for pending steps (24 hours)
            await this.client.expire(key, 86400);
            this.logger.debug(`Pushed step to pending queue for session: ${sessionId}`);
        }
        catch (error) {
            this.logger.error(`Error pushing to pending queue for session ${sessionId}:`, error);
            throw error;
        }
    }
    async fetchFromPending(sessionId) {
        try {
            const step = await this.client.blmove(`pending_steps:${sessionId}`, `processing_steps:${sessionId}`, 'LEFT', 'RIGHT', 0);
            if (step) {
                // Set TTL for processing steps (1 hour)
                await this.client.expire(`processing_steps:${sessionId}`, 3600);
                this.logger.debug(`Fetched step from pending queue for session: ${sessionId}`);
            }
            return step ? JSON.parse(step) : null;
        }
        catch (error) {
            this.logger.error(`Error fetching from pending queue for session ${sessionId}:`, error);
            throw error;
        }
    }
    async logCompletion(sessionId, step, stepCount) {
        try {
            const completedKey = `completed_steps:${sessionId}`;
            const historyKey = `history_steps:${sessionId}`;
            // Add to completed steps (capped at 3 items as per your plan)
            await this.client.lpush(completedKey, JSON.stringify(step));
            await this.client.ltrim(completedKey, 0, 2); // Keep only last 3 items
            // Add to history with stepCount as score for ordering
            await this.client.zadd(historyKey, stepCount, JSON.stringify(step));
            // Set TTL for completed and history (7 days)
            await this.client.expire(completedKey, 604800);
            await this.client.expire(historyKey, 604800);
            this.logger.debug(`Logged completion for session: ${sessionId}, step: ${stepCount}`);
        }
        catch (error) {
            this.logger.error(`Error logging completion for session ${sessionId}:`, error);
            throw error;
        }
    }
    async clearProcessing(sessionId) {
        try {
            await this.client.lpop(`processing_steps:${sessionId}`);
            this.logger.debug(`Cleared processing step for session: ${sessionId}`);
        }
        catch (error) {
            this.logger.error(`Error clearing processing step for session ${sessionId}:`, error);
            throw error;
        }
    }
    async getQueueContents(sessionId, queueType) {
        try {
            if (queueType === 'pending') {
                return await this.client.lrange(`pending_steps:${sessionId}`, 0, -1);
            }
            else if (queueType === 'completed') {
                return await this.client.lrange(`completed_steps:${sessionId}`, 0, -1);
            }
            else if (queueType === 'history') {
                return await this.client.zrange(`history_steps:${sessionId}`, 0, -1);
            }
            return [];
        }
        catch (error) {
            this.logger.error(`Error getting queue contents for session ${sessionId}:`, error);
            return [];
        }
    }
    // Redis Maintenance Methods
    async cleanupExpiredSessions() {
        try {
            const keys = await this.client.keys('*_steps:*');
            const now = Date.now();
            let cleanedCount = 0;
            for (const key of keys) {
                const ttl = await this.client.ttl(key);
                if (ttl === -1) { // No TTL set
                    // Set TTL for keys without expiration
                    if (key.includes('pending_steps:')) {
                        await this.client.expire(key, 86400); // 24 hours
                    }
                    else if (key.includes('completed_steps:') || key.includes('history_steps:')) {
                        await this.client.expire(key, 604800); // 7 days
                    }
                    cleanedCount++;
                }
            }
            this.logger.log(`Cleanup completed: ${cleanedCount} keys processed`);
            return cleanedCount;
        }
        catch (error) {
            this.logger.error('Error during cleanup:', error);
            throw error;
        }
    }
    async getRedisStats() {
        try {
            const info = await this.client.info();
            const memory = await this.client.memory('STATS');
            const keys = await this.client.keys('*_steps:*');
            const stats = {
                totalKeys: keys.length,
                pendingKeys: keys.filter(k => k.includes('pending_steps:')).length,
                completedKeys: keys.filter(k => k.includes('completed_steps:')).length,
                historyKeys: keys.filter(k => k.includes('history_steps:')).length,
                processingKeys: keys.filter(k => k.includes('processing_steps:')).length,
                memoryUsage: memory,
                info: info,
                architecture: {
                    pending_steps: 'List - New jobs added with LPUSH',
                    processing_steps: 'List - Jobs moved from pending with BLMOVE',
                    completed_steps: 'Capped List - Latest 3 results with LPUSH + LTRIM',
                    history_steps: 'Sorted Set - Full historical log with ZADD using stepCount as score'
                }
            };
            return stats;
        }
        catch (error) {
            this.logger.error('Error getting Redis stats:', error);
            throw error;
        }
    }
    async clearSessionData(sessionId) {
        try {
            const keys = [
                `pending_steps:${sessionId}`,
                `processing_steps:${sessionId}`,
                `completed_steps:${sessionId}`,
                `history_steps:${sessionId}`
            ];
            const deletedCount = await this.client.del(...keys);
            this.logger.log(`Cleared session data for ${sessionId}: ${deletedCount} keys deleted`);
            return deletedCount;
        }
        catch (error) {
            this.logger.error(`Error clearing session data for ${sessionId}:`, error);
            throw error;
        }
    }
    async clearAllRoomData(roomId) {
        try {
            const keys = await this.client.keys(`*_steps:${roomId}-*`);
            if (keys.length > 0) {
                const deletedCount = await this.client.del(...keys);
                this.logger.log(`Cleared all data for room ${roomId}: ${deletedCount} keys deleted`);
                return deletedCount;
            }
            return 0;
        }
        catch (error) {
            this.logger.error(`Error clearing room data for ${roomId}:`, error);
            throw error;
        }
    }
    async getActiveSessions() {
        try {
            const keys = await this.client.keys('pending_steps:*');
            const sessions = keys.map(key => key.replace('pending_steps:', ''));
            return sessions;
        }
        catch (error) {
            this.logger.error('Error getting active sessions:', error);
            return [];
        }
    }
    async getRoomSessions(roomId) {
        try {
            const keys = await this.client.keys(`pending_steps:${roomId}-*`);
            const sessions = keys.map(key => key.replace('pending_steps:', ''));
            return sessions;
        }
        catch (error) {
            this.logger.error(`Error getting sessions for room ${roomId}:`, error);
            return [];
        }
    }
    async onModuleDestroy() {
        try {
            await this.client.quit();
            this.logger.log('Redis client disconnected');
        }
        catch (error) {
            this.logger.error('Error disconnecting Redis client:', error);
        }
    }
};
RedisService = RedisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], RedisService);
exports.RedisService = RedisService;
