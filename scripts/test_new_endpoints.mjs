import https from 'https';
import { futuriseApiClient } from '../server/services/futurise-api.client';

async function testEndpoints() {
  const token = await futuriseApiClient.getValidToken();
  const meterNo = '0128260224778';

  const agent = new https.Agent({ rejectUnauthorized: false, checkServerIdentity: () => undefined });

  async function call(method, path, body = null, params = null) {
    let urlPath = path;
    if (params) {
      const q = new URLSearchParams(params).toString();
      urlPath += '?' + q;
    }

    return new Promise((resolve) => {
      const data = body ? JSON.stringify(body) : '';
      const req = https.request({
        hostname: 'dlms.futurise-tech.com',
        port: 4680,
        path: urlPath,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
        },
        agent,
        timeout: 10000
      }, (res) => {
        let b = '';
        res.on('data', c => b += c);
        res.on('end', () => {
          resolve({ status: res.statusCode, body: b });
        });
      });
      req.on('error', e => resolve({ error: e.message }));
      if (data) req.write(data);
      req.end();
    });
  }

  console.log('--- TEST 1: GET /api/v1/meter-instantaneous-value ---');
  const res1 = await call('GET', '/api/v1/meter-instantaneous-value', null, { meterNo });
  console.log('Res 1:', res1.status, res1.body?.substring(0, 500));

  console.log('\n--- TEST 2: GET /api/v1/meter-instantaneous-value with pageIndex/pageSize ---');
  const res2 = await call('GET', '/api/v1/meter-instantaneous-value', null, { meterNo, pageIndex: 1, pageSize: 10 });
  console.log('Res 2:', res2.status, res2.body?.substring(0, 500));

  console.log('\n--- TEST 3: GET /api/v1/metervalue ---');
  const res3 = await call('GET', '/api/v1/metervalue', null, { meterNo });
  console.log('Res 3:', res3.status, res3.body?.substring(0, 500));

  console.log('\n--- TEST 4: GET /api/v1/obisListTree ---');
  const res4 = await call('GET', '/api/v1/obisListTree');
  console.log('Res 4:', res4.status, res4.body?.substring(0, 500));

  console.log('\n--- TEST 5: POST /api/v1/obis-list/read ---');
  const res5 = await call('POST', '/api/v1/obis-list/read', { meterNo, obis: '1.0.32.7.0.255' });
  console.log('Res 5:', res5.status, res5.body?.substring(0, 500));
}

testEndpoints().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
