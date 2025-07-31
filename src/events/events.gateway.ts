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
    const sessionId = client.handshake.query.sessionId;
    // Additional logic for handling connection can be added here
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
    const sessionId = client.handshake.query.sessionId;
    // Call cleanup method in RedisService to delete all keys for that sessionId
    if (typeof sessionId === 'string') {
      this.redisService.clearProcessing(sessionId);
    } else {
      console.warn('Invalid sessionId on disconnect:', sessionId);
    }
  }

  @SubscribeMessage('recordStep')
  async recordStep(client: Socket, payload: { sessionId: string; step: any }) {
    await this.redisService.pushToPending(payload.sessionId, payload.step);
  }

  sendCompletionToClient(sessionId: string, step: any) {
    const client = this.server.sockets.sockets.get(sessionId);
    if (client) {
      client.emit('step_completed', step);
    }
  }
}