# NestJS Socket.IO Backend Guide

## 🏗️ Architecture Overview

Your `ChatGateway` is a **WebSocket Gateway** in NestJS that handles real-time bidirectional communication using Socket.IO.

```
Frontend (Socket.IO Client) ←→ ChatGateway (Socket.IO Server) ←→ All Connected Clients
```

---

## 🔧 Key Decorators & Their Purpose

### 1. `@WebSocketGateway()` (Line 34-39)
```typescript
@WebSocketGateway({
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
    },
})
```
- **Creates a WebSocket server** that listens for connections
- **CORS config**: Only allows connections from `localhost:3000` (your frontend)
- Without this decorator, NestJS doesn't know this class handles WebSockets

---

### 2. `@WebSocketServer()` (Line 41-42)
```typescript
@WebSocketServer()
server!: Server;
```
- **Injects the Socket.IO Server instance** into your class
- Gives you access to emit events to **all clients** or specific rooms
- The `server` object has methods like `.emit()` to broadcast events

---

### 3. `@SubscribeMessage('event-name')` (Lines 65, 82, 100)
```typescript
@SubscribeMessage('message:send')
handleMessage(...) { }
```
- **Listens for a specific event** from the client
- When client does `socket.emit('message:send', data)`, this method runs
- Event naming convention: `namespace:action` (e.g., `user:join`, `message:send`)

---

### 4. `@MessageBody()` and `@ConnectedSocket()`
```typescript
handleMessage(
    @ConnectedSocket() client: Socket,  // The specific client who sent this
    @MessageBody() data: Message,        // The payload sent with the event
)
```
- `@ConnectedSocket()` - The individual socket connection (the sender)
- `@MessageBody()` - Extracts the data payload from the event

---

## 🔄 Lifecycle Hooks

### `OnGatewayConnection` / `OnGatewayDisconnect`
```typescript
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    handleConnection(client: Socket): void { }    // Called when a client connects
    handleDisconnect(client: Socket): void { }   // Called when a client disconnects
}
```
These are **lifecycle interfaces** that let you react to connection events.

---

## 📤 Emitting Events - 3 Methods

| Method | What it does | Code Example |
|--------|--------------|--------------|
| `this.server.emit()` | Broadcast to **ALL** clients | `this.server.emit('user:joined', payload)` |
| `client.emit()` | Send to **only the sender** | `client.emit('welcome', data)` |
| `client.broadcast.emit()` | Send to **everyone EXCEPT sender** | `client.broadcast.emit('user:typing', payload)` |

---

## 🗺️ Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Client Actions                                  │
├─────────────────────────────────────────────────────────────────────────┤
│  socket.emit('user:join', username)        →  @SubscribeMessage('user:join')     
│  socket.emit('message:send', {text:'Hi'})  →  @SubscribeMessage('message:send')  
│  socket.emit('user:typing', true)          →  @SubscribeMessage('user:typing')   
├─────────────────────────────────────────────────────────────────────────┤
│                          Server Responses                                │
├─────────────────────────────────────────────────────────────────────────┤
│  server.emit('user:joined', payload)       ←  Broadcast to ALL           
│  server.emit('message:receive', payload)   ←  Broadcast to ALL           
│  client.broadcast.emit('user:typing')      ←  Broadcast to ALL except sender 
│  server.emit('user:left', payload)         ←  When someone disconnects   
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 💾 State Management

```typescript
private connectedUsers = new Map<string, string>();  // socket.id → username
```
- **Tracks who's online** using a `Map`
- Key: `client.id` (unique socket identifier)
- Value: username
- Updated on join/disconnect

---

## 📝 Quick Reference

| Frontend Event | Backend Handler | Backend Response Event |
|----------------|-----------------|------------------------|
| `user:join` | `handleUserJoin()` | `user:joined` (to all) |
| `message:send` | `handleMessage()` | `message:receive` (to all) |
| `user:typing` | `handleTyping()` | `user:typing` (to others) |
| *(disconnect)* | `handleDisconnect()` | `user:left` (to all) |
