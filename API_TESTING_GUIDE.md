# Redis API Testing Guide

## 🚀 Quick Start

### 1. Start the Server
```bash
npm run build
npm start
```

### 2. Test with Postman
1. Import the Postman collection: `postman/RPA_Redis_Testing.postman_collection.json`
2. Set the base URL variable to: `http://localhost:3000`
3. Start testing with the organized folders

### 3. Test with Node.js Script
```bash
node test-apis.js
```

## 📋 API Categories

### 🔍 Health & Monitoring
- **GET** `/redis/health` - Check Redis health
- **GET** `/redis/stats` - Get comprehensive statistics
- **GET** `/redis/sessions/active` - List active sessions
- **GET** `/redis/sessions/room/{roomId}` - Get room sessions

### 📋 Queue Operations
- **GET** `/redis/queue/{sessionId}/{queueType}` - Get queue contents
- **POST** `/redis/queue/{sessionId}/pending` - Add step to pending
- **GET** `/redis/queue/{sessionId}/processing` - Get processing step

### 🎬 Demo & Testing
- **POST** `/redis/demo/setup` - Setup demo data
- **POST** `/redis/demo/simulate-processing` - Simulate processing
- **POST** `/redis/test/load-test` - Load testing
- **GET** `/redis/test/room-comparison` - Compare rooms
- **POST** `/redis/test/validate-architecture` - Validate architecture

### 🧹 Cleanup Operations
- **POST** `/redis/cleanup` - Cleanup expired sessions
- **DELETE** `/redis/session/{sessionId}` - Clear session data
- **DELETE** `/redis/room/{roomId}` - Clear room data
- **DELETE** `/redis/clear-all` - Clear all data

## 🔧 Testing Scenarios

### Scenario 1: Basic Operations
```bash
# 1. Setup demo data
curl -X POST http://localhost:3000/redis/demo/setup

# 2. Check health
curl http://localhost:3000/redis/health

# 3. Get stats
curl http://localhost:3000/redis/stats

# 4. Get active sessions
curl http://localhost:3000/redis/sessions/active
```

### Scenario 2: Multi-Room Testing
```bash
# 1. Setup demo data
curl -X POST http://localhost:3000/redis/demo/setup

# 2. Add steps to different rooms
curl -X POST http://localhost:3000/redis/queue/room-1-session-1/pending \
  -H "Content-Type: application/json" \
  -d '{"action":"click","target":"#room1","data":"Room 1 step"}'

curl -X POST http://localhost:3000/redis/queue/room-2-session-1/pending \
  -H "Content-Type: application/json" \
  -d '{"action":"type","target":"#room2","data":"Room 2 step"}'

# 3. Compare rooms
curl "http://localhost:3000/redis/test/room-comparison?rooms=room-1,room-2,room-3"
```

### Scenario 3: Load Testing
```bash
# 1. Clear all data
curl -X DELETE http://localhost:3000/redis/clear-all

# 2. Load test
curl -X POST http://localhost:3000/redis/test/load-test \
  -H "Content-Type: application/json" \
  -d '{"roomId":"room-1","sessions":5,"stepsPerSession":20}'

# 3. Monitor performance
curl http://localhost:3000/redis/stats
```

### Scenario 4: Architecture Validation
```bash
# 1. Setup demo data
curl -X POST http://localhost:3000/redis/demo/setup

# 2. Simulate processing
curl -X POST http://localhost:3000/redis/demo/simulate-processing \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"room-1-session-1","stepCount":3}'

# 3. Validate architecture
curl -X POST http://localhost:3000/redis/test/validate-architecture
```

## 📊 Expected Responses

### Healthy System
```json
{
  "status": "healthy",
  "timestamp": "2025-07-31T10:00:00.000Z",
  "stats": {
    "totalKeys": 24,
    "pendingKeys": 6,
    "processingKeys": 6,
    "completedKeys": 6,
    "historyKeys": 6
  }
}
```

### Redis Stats
```json
{
  "totalKeys": 24,
  "pendingKeys": 6,
  "processingKeys": 6,
  "completedKeys": 6,
  "historyKeys": 6,
  "architecture": {
    "pending_steps": "List - New jobs added with LPUSH",
    "processing_steps": "List - Jobs moved from pending with BLMOVE",
    "completed_steps": "Capped List - Latest 3 results with LPUSH + LTRIM",
    "history_steps": "Sorted Set - Full historical log with ZADD using stepCount as score"
  }
}
```

### Architecture Validation
```json
{
  "message": "Architecture validation completed",
  "totalSessions": 6,
  "validSessions": 6,
  "invalidSessions": 0,
  "validationResults": [
    {
      "sessionId": "room-1-session-1",
      "pending": {"exists": true, "count": 5, "type": "list"},
      "processing": {"exists": true, "count": 1, "type": "list"},
      "completed": {"exists": true, "count": 3, "type": "list", "capped": true},
      "history": {"exists": true, "count": 5, "type": "sorted-set"},
      "isValid": true
    }
  ]
}
```

## 🎯 Postman Collection Features

### Organized Folders
- **🔍 Redis Health & Monitoring** - Health checks and statistics
- **📋 Queue Operations** - Queue management and inspection
- **🎬 Demo & Testing** - Demo setup and testing scenarios
- **🧹 Cleanup Operations** - Data cleanup and maintenance
- **🔧 Multi-Room Testing** - Room-specific testing

### Pre-configured Requests
- All requests include proper headers
- Sample request bodies for POST requests
- Environment variables for easy configuration
- Detailed descriptions for each endpoint

### Testing Workflows
1. **Quick Start**: Import collection → Setup demo → Test health
2. **Full Testing**: Run through all folders systematically
3. **Load Testing**: Use load test endpoint with different parameters
4. **Architecture Validation**: Validate Redis structure integrity

## 🔍 Monitoring & Debugging

### Key Metrics to Monitor
- **Total Keys**: Overall system load
- **Pending Keys**: Jobs waiting to be processed
- **Processing Keys**: Jobs currently being processed
- **Completed Keys**: Recently completed jobs
- **History Keys**: Historical job records

### Common Issues & Solutions

#### Issue: Redis Connection Failed
```bash
# Check if Redis is running
redis-cli ping

# Check Redis logs
redis-cli info server
```

#### Issue: No Active Sessions
```bash
# Setup demo data
curl -X POST http://localhost:3000/redis/demo/setup

# Check active sessions
curl http://localhost:3000/redis/sessions/active
```

#### Issue: Architecture Validation Failed
```bash
# Clear all data and start fresh
curl -X DELETE http://localhost:3000/redis/clear-all

# Setup demo data
curl -X POST http://localhost:3000/redis/demo/setup

# Validate architecture
curl -X POST http://localhost:3000/redis/test/validate-architecture
```

## 🚀 Performance Testing

### Load Test Parameters
```json
{
  "roomId": "room-1",
  "sessions": 10,
  "stepsPerSession": 50
}
```

### Expected Performance
- **Small Load**: 100 steps (2 sessions × 50 steps) - < 1 second
- **Medium Load**: 500 steps (10 sessions × 50 steps) - < 3 seconds
- **Large Load**: 1000 steps (20 sessions × 50 steps) - < 5 seconds

### Memory Usage Monitoring
```bash
# Check Redis memory usage
curl http://localhost:3000/redis/stats | jq '.memoryUsage'

# Monitor memory over time
watch -n 5 'curl -s http://localhost:3000/redis/stats | jq ".memoryUsage"'
```

## 📝 Best Practices

### Testing Order
1. **Health Check** - Ensure system is running
2. **Setup Demo** - Create test data
3. **Basic Operations** - Test core functionality
4. **Load Testing** - Test performance
5. **Validation** - Ensure data integrity
6. **Cleanup** - Clean up test data

### Data Management
- Always start with fresh data for consistent testing
- Use cleanup operations to prevent data accumulation
- Monitor memory usage during load testing
- Validate architecture after major operations

### Error Handling
- Check response status codes
- Monitor error messages in responses
- Use health check to verify system status
- Validate data consistency after operations

This comprehensive testing guide ensures you can thoroughly test and validate the Redis architecture for your multi-room RPA system! 