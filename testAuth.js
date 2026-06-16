const axios = require('axios');
const assert = require('assert');

async function testAuthFlow() {
  const api = axios.create({
    baseURL: 'http://localhost:4000/api',
    withCredentials: true,
  });

  let cookies = [];
  
  // Custom interceptor to store cookies from response
  api.interceptors.response.use(response => {
    if (response.headers['set-cookie']) {
      cookies = response.headers['set-cookie'];
    }
    return response;
  });

  // Custom interceptor to send cookies on request
  api.interceptors.request.use(config => {
    if (cookies.length > 0) {
      config.headers.Cookie = cookies.join('; ');
    }
    return config;
  });

  try {
    const email = `test${Date.now()}@test.com`;

    console.log('1. Registering user...');
    const regRes = await api.post('/auth/register', { name: 'Test User', email, password: 'password123' });
    assert(regRes.data.success === true, 'Registration failed');
    const { accessToken } = regRes.data.data;
    assert(accessToken, 'Missing access token after registration');
    
    // Auth header for next requests
    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    
    console.log('2. Accessing protected /me route...');
    const meRes = await api.get('/auth/me');
    assert(meRes.data.data.user.email === email, '/me returned wrong user');

    console.log('3. Logging out...');
    await api.post('/auth/logout');
    cookies = []; // clear cookies as client does
    api.defaults.headers.common['Authorization'] = ''; // clear token

    console.log('4. Logging in...');
    const loginRes = await api.post('/auth/login', { email, password: 'password123' });
    const newAccessToken = loginRes.data.data.accessToken;
    assert(newAccessToken, 'Missing access token after login');
    api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;

    console.log('5. Refreshing token...');
    // We send refresh token via the cookie we saved
    const refreshRes = await api.post('/auth/refresh');
    const refreshedToken = refreshRes.data.data.accessToken;
    assert(refreshedToken, 'Missing access token after refresh');
    
    console.log('ALL TESTS PASSED: Full register -> login -> refresh -> logout cycle works.');
  } catch (error) {
    console.error('Test failed:', error.response ? error.response.data : error.message);
    process.exit(1);
  }
}

testAuthFlow();
