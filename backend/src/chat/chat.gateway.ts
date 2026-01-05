import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface Message {
    text: string;
}

interface UserPayload {
    id: string;
    username: string;
    users: string[];
}

interface MessagePayload {
    id: number;
    text: string;
    username: string;
    timestamp: string;
}

interface TypingPayload {
    username: string;
    isTyping: boolean;
}

@WebSocketGateway({
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
    },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server!: Server;

    private connectedUsers = new Map<string, string>();

    handleConnection(client: Socket): void {
        console.log(`✅ User connected: ${client.id}`);
    }

    handleDisconnect(client: Socket): void {
        const username = this.connectedUsers.get(client.id);
        console.log(`❌ User disconnected: ${username || client.id}`);

        this.connectedUsers.delete(client.id);

        // Notify all users about the disconnection
        const payload: UserPayload = {
            id: client.id,
            username: username || 'Unknown',
            users: Array.from(this.connectedUsers.values()),
        };
        this.server.emit('user:left', payload);
    }

    @SubscribeMessage('user:join')
    handleUserJoin(
        @ConnectedSocket() client: Socket,
        @MessageBody() username: string,
    ): void {
        this.connectedUsers.set(client.id, username);
        console.log(`👤 ${username} joined the chat`);

        // Notify all users about the new user
        const payload: UserPayload = {
            id: client.id,
            username: username,
            users: Array.from(this.connectedUsers.values()),
        };
        this.server.emit('user:joined', payload);
    }

    @SubscribeMessage('message:send')
    handleMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: Message,
    ): void {
        const username = this.connectedUsers.get(client.id) || 'Anonymous';
        console.log(`💬 Message from ${username}: ${data.text}`);

        // Broadcast message to all connected clients
        const payload: MessagePayload = {
            id: Date.now(),
            text: data.text,
            username: username,
            timestamp: new Date().toISOString(),
        };
        this.server.emit('message:receive', payload);
    }

    @SubscribeMessage('user:typing')
    handleTyping(
        @ConnectedSocket() client: Socket,
        @MessageBody() isTyping: boolean,
    ): void {
        const username = this.connectedUsers.get(client.id);
        if (username) {
            const payload: TypingPayload = {
                username: username,
                isTyping: isTyping,
            };
            client.broadcast.emit('user:typing', payload);
        }
    }
}
