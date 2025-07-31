import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { RedisService } from '../redis/redis.service';
import { Socket, Server } from 'socket.io';

@WebSocketGateway()
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;

  constructor(private readonly redisService: RedisService) {}

  handleConnection(client: Socket, ...args: any[]) {
    console.log('New client connected:', client.id);
    const sessionId = client.handshake.query.sessionId as string;
    const roomId = client.handshake.query.roomId as string;
    
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
    } else {
      console.warn('Client connected without sessionId or roomId:', { sessionId, roomId });
    }
  }

  handleDisconnect(client: Socket) {
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

  @SubscribeMessage('recordStep')
  async recordStep(client: Socket, payload: { sessionId: string; step: any }) {
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

  @SubscribeMessage('joinRoom')
  async joinRoom(client: Socket, payload: { roomId: string; sessionId: string }) {
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

  @SubscribeMessage('getRoomInfo')
  async getRoomInfo(client: Socket) {
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

  sendCompletionToClient(sessionId: string, step: any, roomId?: string) {
    if (roomId) {
      // Send to all clients in the specific room
      this.server.to(roomId).emit('step_completed', {
        sessionId: sessionId,
        step: step,
        timestamp: new Date().toISOString()
      });
    } else {
      // Fallback to original behavior
      const client = this.server.sockets.sockets.get(sessionId);
      if (client) {
        client.emit('step_completed', step);
      }
    }
  }
}