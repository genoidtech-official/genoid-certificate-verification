const http = require('http');

const PORT = 3000;
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'YourStrongPassword@2026';

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const headers = {
      'Content-Type': 'application/json',
    };
    if (data) {
      headers['Content-Length'] = Buffer.byteLength(data);
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request({
      hostname: 'localhost',
      port: PORT,
      path,
      method,
      headers
    }, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            body: JSON.parse(responseData)
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            body: responseData
          });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (data) {
      req.write(data);
    }
    req.end();
  });
}

async function runTests() {
  console.log('Starting API Tests...');
  try {
    // 1. Admin Login
    console.log('\n--- Test 1: Admin Login ---');
    const loginRes = await request('POST', '/api/admin/login', {
      username: ADMIN_USERNAME,
      password: ADMIN_PASSWORD
    });
    console.log('Status Code:', loginRes.statusCode);
    console.log('Response:', loginRes.body);

    if (loginRes.statusCode !== 200 || !loginRes.body.success) {
      throw new Error('Admin login failed');
    }
    const token = loginRes.body.token;

    // 2. Add Certificate
    console.log('\n--- Test 2: Add Certificate ---');
    const certId = 'TEST-' + Date.now();
    const certData = {
      certificateId: certId,
      candidateName: 'Test Student',
      dateOfIssue: new Date().toISOString(),
      courseName: 'Full Stack Development',
      duration: '3 Months',
      signatoryName: 'Jane Doe',
      signatoryDesig: 'Director'
    };
    const addRes = await request('POST', '/api/admin/certificates', certData, token);
    console.log('Status Code:', addRes.statusCode);
    console.log('Response:', addRes.body);

    if (addRes.statusCode !== 201 || !addRes.body.success) {
      throw new Error('Add certificate failed');
    }

    // 3. Verify Certificate
    console.log('\n--- Test 3: Verify Certificate ---');
    const verifyRes = await request('POST', '/api/verify', {
      certificateId: certId
    });
    console.log('Status Code:', verifyRes.statusCode);
    console.log('Response:', verifyRes.body);

    if (verifyRes.statusCode !== 200 || !verifyRes.body.success) {
      throw new Error('Verify certificate failed');
    }

    // 4. Get Public Settings
    console.log('\n--- Test 4: Get Public Settings ---');
    const settingsRes = await request('GET', '/api/verify/settings');
    console.log('Status Code:', settingsRes.statusCode);
    console.log('Response:', settingsRes.body);

    if (settingsRes.statusCode !== 200 || !settingsRes.body.success) {
      throw new Error('Get public settings failed');
    }

    console.log('\n✅ All tests passed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Tests failed:', err.message);
    process.exit(1);
  }
}

runTests();
