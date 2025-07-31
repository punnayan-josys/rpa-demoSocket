const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testAPI(endpoint, method = 'GET', data = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: { 'Content-Type': 'application/json' }
    };
    if (data) config.data = data;
    
    const response = await axios(config);
    console.log(`✅ ${method} ${endpoint}:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ ${method} ${endpoint}:`, error.response?.data || error.message);
    return null;
  }
}

async function runAPITests() {
  console.log('🚀 Starting Redis API Tests...\n');

  // Test 1: Health Check
  console.log('1️⃣ Testing Redis Health...');
  await testAPI('/redis/health');
  console.log('');

  // Test 2: Setup Demo Data
  console.log('2️⃣ Setting up demo data...');
  await testAPI('/redis/demo/setup', 'POST');
  console.log('');

  // Test 3: Get Stats
  console.log('3️⃣ Getting Redis stats...');
  await testAPI('/redis/stats');
  console.log('');

  // Test 4: Get Active Sessions
  console.log('4️⃣ Getting active sessions...');
  await testAPI('/redis/sessions/active');
  console.log('');

  // Test 5: Get Room Sessions
  console.log('5️⃣ Getting room sessions...');
  await testAPI('/redis/sessions/room/room-1');
  console.log('');

  // Test 6: Add Custom Step
  console.log('6️⃣ Adding custom step...');
  await testAPI('/redis/queue/room-1-session-1/pending', 'POST', {
    action: 'custom-click',
    target: '#custom-button',
    data: 'Custom test step',
    roomId: 'room-1',
    sessionId: 'room-1-session-1',
    stepId: 'custom-step-123',
    timestamp: new Date().toISOString()
  });
  console.log('');

  // Test 7: Get Queue Contents
  console.log('7️⃣ Getting queue contents...');
  await testAPI('/redis/queue/room-1-session-1/pending');
  console.log('');

  // Test 8: Simulate Processing
  console.log('8️⃣ Simulating processing...');
  await testAPI('/redis/demo/simulate-processing', 'POST', {
    sessionId: 'room-1-session-1',
    stepCount: 2
  });
  console.log('');

  // Test 9: Room Comparison
  console.log('9️⃣ Comparing rooms...');
  await testAPI('/redis/test/room-comparison?rooms=room-1,room-2,room-3');
  console.log('');

  // Test 10: Validate Architecture
  console.log('🔟 Validating architecture...');
  await testAPI('/redis/test/validate-architecture', 'POST');
  console.log('');

  console.log('✅ All API tests completed!');
}

// Run the tests
runAPITests().catch(console.error); 