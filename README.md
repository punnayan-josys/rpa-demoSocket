# rpa-sync-demo

## Overview
The `rpa-sync-demo` project is a NestJS application that demonstrates the use of WebSockets and Redis for managing asynchronous tasks. It allows clients to send steps to be processed, which are managed in different queues in Redis.

## Features
- WebSocket communication for real-time updates.
- Redis as a message broker to manage task queues.
- HTTP endpoints to inspect the state of the queues.

## Project Structure
```
rpa-sync-demo
├── src
│   ├── app.controller.ts        # Handles incoming HTTP requests and provides endpoints for queue inspection.
│   ├── app.module.ts            # Root module that imports all necessary modules.
│   ├── main.ts                  # Entry point of the application.
│   ├── redis
│   │   ├── redis.module.ts      # Module that encapsulates RedisService.
│   │   └── redis.service.ts     # Service that interacts with Redis for queue management.
│   ├── events
│   │   ├── events.gateway.ts     # WebSocket gateway for handling client connections and messages.
│   │   └── events.module.ts      # Module that provides the EventsGateway.
│   ├── sync
│   │   ├── sync.service.ts       # Service that orchestrates the completion logic of tasks.
│   │   └── sync.module.ts        # Module that provides the SyncService.
│   ├── playwright
│   │   ├── playwright.service.ts  # Background worker service that processes tasks.
│   │   └── playwright.module.ts   # Module that provides the PlaywrightService.
├── package.json                  # npm configuration file with dependencies and scripts.
├── tsconfig.json                 # TypeScript configuration file.
└── README.md                     # Project documentation.
```

## Installation
To set up the project, follow these steps:

1. Install the NestJS CLI if you haven't already:
   ```
   npm i -g @nestjs/cli
   ```

2. Clone the repository:
   ```
   git clone <repository-url>
   cd rpa-sync-demo
   ```

3. Install the dependencies:
   ```
   npm install
   ```

## Running the Application
To start the application in development mode, run:
```
npm run start:dev
```

## Usage
- Connect to the WebSocket server and send `recordStep` events to process tasks.
- Use the following HTTP endpoints to inspect the state of the queues:
  - `GET /session/:sessionId/pending` - Get pending steps for a session.
  - `GET /session/:sessionId/completed` - Get completed steps for a session.
  - `GET /session/:sessionId/history` - Get history of steps for a session.

## License
This project is licensed under the MIT License.