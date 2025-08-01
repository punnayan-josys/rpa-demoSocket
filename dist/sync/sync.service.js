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
exports.SyncService = void 0;
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../redis/redis.service");
const events_gateway_1 = require("../events/events.gateway");
let SyncService = class SyncService {
    constructor(redisService, eventsGateway) {
        this.redisService = redisService;
        this.eventsGateway = eventsGateway;
    }
    async handleStepCompletion(sessionId, step, stepCount, roomId) {
        await this.redisService.logCompletion(sessionId, step, stepCount);
        await this.redisService.clearProcessing(sessionId);
        this.eventsGateway.sendCompletionToClient(sessionId, step, roomId);
    }
};
SyncService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService,
        events_gateway_1.EventsGateway])
], SyncService);
exports.SyncService = SyncService;
