import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

const wsCorsOrigins =
  process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()).filter(Boolean) ?? [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];

@WebSocketGateway({
  cors: {
    origin: wsCorsOrigins,
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayConnection {
  private readonly logger = new Logger(EventsGateway.name);

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    this.logger.debug(`WS client connected: ${client.id}`);
  }

  broadcastAlert(alert: unknown) {
    this.server.emit('alert:new', alert);
  }
}