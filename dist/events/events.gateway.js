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
exports.EventsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const redis_service_1 = require("../redis/redis.service");
const socket_io_1 = require("socket.io");
let EventsGateway = class EventsGateway {
    constructor(redisService) {
        this.redisService = redisService;
    }
    handleConnection(client, ...args) {
        console.log('New client connected:', client.id);
        const sessionId = client.handshake.query.sessionId;
        const roomId = client.handshake.query.roomId;
        if (sessionId && roomId) {
            // Join the specific room
            client.join(roomId);
            console.log(`Client ${client.id} joined room: ${roomId} with session: ${sessionId}`);
            // Store room and session info in socket data for later use
            client.data.roomId = roomId;
            client.data.sessionId = sessionId;
            // Notify other clients in the room about new member
            client.to(roomId).emit('user_joined', {
                clientId: client.id,
                sessionId: sessionId,
                timestamp: new Date().toISOString()
            });
            // Send welcome message to the new client
            client.emit('room_joined', {
                roomId: roomId,
                sessionId: sessionId,
                clientId: client.id,
                message: `Successfully joined room ${roomId}`
            });
        }
        else {
            console.warn('Client connected without sessionId or roomId:', { sessionId, roomId });
        }
    }
    handleDisconnect(client) {
        console.log('Client disconnected:', client.id);
        const sessionId = client.data.sessionId;
        const roomId = client.data.roomId;
        if (sessionId) {
            this.redisService.clearProcessing(sessionId);
        }
        if (roomId) {
            // Notify other clients in the room about departure
            client.to(roomId).emit('user_left', {
                clientId: client.id,
                sessionId: sessionId,
                timestamp: new Date().toISOString()
            });
        }
    }
    async recordStep(client, payload) {
        const roomId = client.data.roomId;
        const sessionId = payload.sessionId;
        console.log(`Recording step in room ${roomId} for session ${sessionId}:`, payload.step);
        await this.redisService.pushToPending(sessionId, payload.step);
        // Notify all clients in the same room about the new step
        client.to(roomId).emit('step_recorded', {
            sessionId: sessionId,
            step: payload.step,
            timestamp: new Date().toISOString()
        });
    }
    async joinRoom(client, payload) {
        const { roomId, sessionId } = payload;
        // Leave current room if any
        if (client.data.roomId) {
            client.leave(client.data.roomId);
        }
        // Join new room
        client.join(roomId);
        client.data.roomId = roomId;
        client.data.sessionId = sessionId;
        console.log(`Client ${client.id} switched to room: ${roomId}`);
        client.emit('room_joined', {
            roomId: roomId,
            sessionId: sessionId,
            clientId: client.id,
            message: `Successfully joined room ${roomId}`
        });
        // Notify other clients in the room
        client.to(roomId).emit('user_joined', {
            clientId: client.id,
            sessionId: sessionId,
            timestamp: new Date().toISOString()
        });
    }
    async getRoomInfo(client) {
        const roomId = client.data.roomId;
        if (roomId) {
            const sockets = await this.server.in(roomId).fetchSockets();
            const roomInfo = {
                roomId: roomId,
                sessionId: client.data.sessionId,
                clientCount: sockets.length,
                clients: sockets.map(socket => ({
                    id: socket.id,
                    sessionId: socket.data.sessionId
                }))
            };
            client.emit('room_info', roomInfo);
        }
    }
    sendCompletionToClient(sessionId, step, roomId) {
        if (roomId) {
            // Send to all clients in the specific room
            this.server.to(roomId).emit('step_completed', {
                sessionId: sessionId,
                step: step,
                timestamp: new Date().toISOString()
            });
        }
        else {
            // Fallback to original behavior
            const client = this.server.sockets.sockets.get(sessionId);
            if (client) {
                client.emit('step_completed', step);
            }
        }
    }
};
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], EventsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('recordStep'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], EventsGateway.prototype, "recordStep", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinRoom'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], EventsGateway.prototype, "joinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('getRoomInfo'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], EventsGateway.prototype, "getRoomInfo", null);
EventsGateway = __decorate([
    (0, websockets_1.WebSocketGateway)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService])
], EventsGateway);
exports.EventsGateway = EventsGateway;
