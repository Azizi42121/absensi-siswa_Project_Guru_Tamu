const http = require('http');

async function testAllRoutes() {
  console.log('🧪 Automated HTTP Route Verification');

  // Helper for requests
  function request(urlPath, options = {}) {
    return new Promise((resolve, reject) => {
      const opts = {
        hostname: 'localhost',
        port: 3000,
        path: urlPath,
        method: options.method || 'GET',
        headers: options.headers || {},
      };

      const req = http.request(opts, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, data }));
      });
      req.on('error', reject);
      if (options.body) req.write(options.body);
      req.end();
    });
  }

  // Helper for Form Login
  async function login(username, password) {
    const postData = `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
    const res = await request('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
      body: postData,
    });
    const cookie = res.headers['set-cookie'] ? res.headers['set-cookie'][0].split(';')[0] : '';
    return cookie;
  }

  // 1. Test Unauthenticated Access Redirect
  const anonRes = await request('/admin/dashboard');
  console.log('Anon -> /admin/dashboard status:', anonRes.status, anonRes.headers.location === '/auth/login' ? 'OK (Redirected)' : 'FAIL');

  // 2. Test Admin Login & Routes
  const adminCookie = await login('admin', 'password123');
  console.log('Admin Cookie acquired:', !!adminCookie);

  const adminDash = await request('/admin/dashboard', { headers: { Cookie: adminCookie } });
  console.log('/admin/dashboard status:', adminDash.status);

  const adminAudit = await request('/admin/audit', { headers: { Cookie: adminCookie } });
  console.log('/admin/audit status:', adminAudit.status);

  // 3. Test Guru Mapel Login & Routes
  const guruCookie = await login('gurumapel', 'password123');
  const guruDash = await request('/guru/dashboard', { headers: { Cookie: guruCookie } });
  console.log('/guru/dashboard status:', guruDash.status);

  const guruAtt = await request('/guru/attendance/1', { headers: { Cookie: guruCookie } });
  console.log('/guru/attendance/1 status:', guruAtt.status);

  const guruRecap = await request('/guru/monthly-recap', { headers: { Cookie: guruCookie } });
  console.log('/guru/monthly-recap status:', guruRecap.status);

  // 4. Test Siswa Login & Routes
  const siswaCookie = await login('siswa', 'password123');
  const siswaDash = await request('/siswa/dashboard', { headers: { Cookie: siswaCookie } });
  console.log('/siswa/dashboard status:', siswaDash.status);
  console.log('Contains Warning Alert:', siswaDash.data.includes('PERINGATAN KRITIS'));

  // 5. Test 403 Access Denial for Siswa accessing Admin
  const forbiddenRes = await request('/admin/dashboard', { headers: { Cookie: siswaCookie } });
  console.log('Siswa -> /admin/dashboard status:', forbiddenRes.status, '(Expected 403)');

  console.log('✅ ALL HTTP ROUTE TESTS COMPLETED!');
}

testAllRoutes().catch(console.error);
