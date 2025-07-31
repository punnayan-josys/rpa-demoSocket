# RPA Socket.IO Multi-Room Demo

A comprehensive demonstration of RPA (Robotic Process Automation) synchronization using NestJS, WebSockets, Redis, and Socket.IO with **multi-room support** for isolated communication between different client groups.

## 🚀 Features

- **Multi-Room Support**: Multiple isolated rooms for different client groups
- **Real-time Communication**: WebSocket-based real-time updates
- **Redis Queue Management**: Persistent queue management with Redis
- **Isolated Processing**: Each room has its own processing workers
- **Visual Interface**: Web-based dashboard for testing and monitoring
- **Room Switching**: Dynamic room switching for clients
- **Event Isolation**: Complete communication isolation between rooms

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Room 1        │    │   Room 2        │    │   Room 3        │
│   Clients       │    │   Clients       │    │   Clients       │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │    Socket.IO Gateway      │
                    │   (Room Management)       │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │      Redis Service        │
                    │   (Queue Management)      │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │   Playwright Workers      │
                    │   (RPA Processing)        │
                    └───────────────────────────┘
```

## 📦 Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd rpa-sync-demo
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start Redis** (make sure Redis is running):
   ```bash
   redis-server
   ```

4. **Build and start the application**:
   ```bash
   npm run build
   npm start
   ```

## 🎯 How to Test Multi-Room Isolation

### Method 1: Web Interface (Recommended)

1. **Start the server**:
   ```bash
   npm start
   ```

2. **Open the web interface**:
   Navigate to `http://localhost:3000` in your browser

3. **Test room isolation**:
   - Click "Connect All Rooms" to connect to all three rooms
   - Click "Send Steps to All Rooms" to send test steps
   - Observe that each room processes steps independently
   - Use "Get All Room Info" to see room statistics

### Method 2: Node.js Test Client

1. **Run the test client**:
   ```bash
   node test-socket.js
   ```

2. **Observe the output**:
   - Watch how clients connect to different rooms
   - See step processing in each room
   - Notice room switching demonstration
   - Observe communication isolation

### Method 3: API Testing

1. **Setup demo data**:
   ```bash
   curl -X POST http://localhost:3000/demo/setup
   ```

2. **Start workers for specific rooms**:
   ```bash
   curl -X POST http://localhost:3000/start-multi-room-workers \
     -H "Content-Type: application/json" \
     -d '[
       {"sessionId": "room-1-session-1", "roomId": "room-1"},
       {"sessionId": "room-2-session-1", "roomId": "room-2"},
       {"sessionId": "room-3-session-1", "roomId": "room-3"}
     ]'
   ```

3. **Check room status**:
   ```bash
   curl http://localhost:3000/rooms/room-1/status
   ```

## 🔧 Key Components

### 1. Events Gateway (`src/events/events.gateway.ts`)
- Manages WebSocket connections
- Handles room-based communication
- Provides room switching functionality
- Broadcasts events to specific rooms only

### 2. Redis Service (`src/redis/redis.service.ts`)
- Manages queues for each session
- Provides isolated storage per session
- Handles pending, processing, and completed steps

### 3. Playwright Service (`src/playwright/playwright.service.ts`)
- Processes RPA steps for each session
- Supports multiple workers for different rooms
- Simulates RPA automation tasks

### 4. Sync Service (`src/sync/sync.service.ts`)
- Coordinates between Redis and WebSocket events
- Handles step completion notifications
- Manages room-based event broadcasting

## 🏠 Room Management

### Room Isolation Features

1. **Separate Queues**: Each session has its own Redis queues
2. **Isolated Events**: Events are only broadcast to clients in the same room
3. **Independent Processing**: Workers process steps for specific sessions
4. **Room Switching**: Clients can switch between rooms dynamically

### Room Events

- `room_joined`: When a client joins a room
- `user_joined`: When a new user joins the room
- `user_left`: When a user leaves the room
- `step_recorded`: When a step is recorded in the room
- `step_completed`: When a step is completed
- `room_info`: Room information and client count

## 📊 Monitoring and Debugging

### Web Interface Features

- **Real-time Logs**: Live event logs for each room
- **Connection Status**: Visual connection status indicators
- **Statistics**: Total connections, steps, and events
- **Room Controls**: Individual room management

### API Endpoints

- `GET /`: Application status
- `GET /queue/:sessionId/:queueType`: Get queue contents
- `GET /rooms/:roomId/status`: Get room status
- `POST /demo/setup`: Setup demo data
- `POST /start-multi-room-workers`: Start workers for multiple rooms

## 🔍 Communication Isolation Verification

### What to Observe

1. **Room-Specific Events**: Events from one room don't appear in other rooms
2. **Independent Processing**: Steps in each room are processed separately
3. **Isolated Queues**: Redis queues are separate for each session
4. **Client Isolation**: Clients in different rooms can't see each other's activities

### Testing Scenarios

1. **Multiple Rooms**: Create multiple rooms and verify isolation
2. **Room Switching**: Move a client between rooms and verify proper event handling
3. **Concurrent Processing**: Send steps to multiple rooms simultaneously
4. **Disconnection Handling**: Test proper cleanup when clients disconnect

## 🛠️ Development

### Adding New Features

1. **New Room Events**: Add handlers in `EventsGateway`
2. **Custom Processing**: Extend `PlaywrightService` for specific RPA tasks
3. **Additional Queues**: Extend `RedisService` for new queue types
4. **UI Enhancements**: Modify the web interface in `public/index.html`

### Running in Development Mode

```bash
npm run start:dev
```

This will start the application with hot reloading enabled.

## 📝 API Documentation

### WebSocket Events

#### Client to Server
- `recordStep`: Record a new RPA step
- `joinRoom`: Switch to a different room
- `getRoomInfo`: Get information about the current room

#### Server to Client
- `room_joined`: Confirmation of room joining
- `user_joined`: Notification of new user in room
- `user_left`: Notification of user leaving room
- `step_recorded`: Notification of step recording
- `step_completed`: Notification of step completion
- `room_info`: Room information response

### HTTP Endpoints

#### GET `/`
Returns application status and welcome message.

#### POST `/start-worker/:sessionId`
Starts a worker for a specific session.

#### POST `/start-multi-room-workers`
Starts workers for multiple rooms.
```json
[
  {"sessionId": "session1", "roomId": "room1"},
  {"sessionId": "session2", "roomId": "room2"}
]
```

#### GET `/queue/:sessionId/:queueType`
Get queue contents for a session.
- `queueType`: `pending`, `completed`, or `history`

#### GET `/rooms/:roomId/status`
Get status of all sessions in a room.

#### POST `/demo/setup`
Setup demo data for testing.

## 🎉 Conclusion

This demo showcases how to implement a robust, scalable RPA synchronization system with complete communication isolation between different client groups. The multi-room architecture ensures that:

- Each room operates independently
- Communication is isolated between rooms
- Scalability is achieved through room-based separation
- Real-time updates are delivered only to relevant clients

The system is ready for production use with proper error handling, monitoring, and scalability features.
