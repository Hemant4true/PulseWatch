const axios = require('axios');
const assert = require('assert');

async function testMonitorsFlow() {
  const api = axios.create({
    baseURL: 'http://localhost:4000/api',
    withCredentials: true,
  });

  let cookies = [];
  api.interceptors.response.use(response => {
    if (response.headers['set-cookie']) cookies = response.headers['set-cookie'];
    return response;
  });
  api.interceptors.request.use(config => {
    if (cookies.length > 0) config.headers.Cookie = cookies.join('; ');
    return config;
  });

  try {
    const email = `test${Date.now()}@test.com`;
    console.log('1. Registering...');
    const regRes = await api.post('/auth/register', { name: 'Test User', email, password: 'password123' });
    api.defaults.headers.common['Authorization'] = `Bearer ${regRes.data.data.accessToken}`;
    
    console.log('2. Testing connection...');
    const testRes = await api.post('/monitors/test', { url: 'https://example.com', method: 'GET' });
    assert(testRes.data.success === true, 'Test connection failed');
    assert(testRes.data.data.status === 'UP', 'Example.com should be UP');

    console.log('3. Creating monitor...');
    const createRes = await api.post('/monitors', { name: 'Test Monitor', url: 'https://example.com', interval: 5 });
    assert(createRes.data.success === true, 'Monitor creation failed');
    const monitorId = createRes.data.data.id;

    console.log('4. Fetching monitors list...');
    const listRes = await api.get('/monitors');
    assert(listRes.data.data.length > 0, 'Monitor list empty');
    
    console.log('5. Bulk pause monitor...');
    await api.post('/monitors/bulk', { ids: [monitorId], action: 'pause' });
    
    console.log('ALL TESTS PASSED: Monitor CRUD flow works.');
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error.response ? error.response.data : error.message);
    process.exit(1);
  }
}

setTimeout(testMonitorsFlow, 3000); // Wait for server to start
