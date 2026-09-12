import http from 'http';
import { futuriseApiClient } from '../services/futurise-api.client';

const HOST = '47.90.150.122';
const PORT = 4670;
const METER_NO = '0128260224778';

function request4670(path: string, method: string, headers: any, body: any): Promise<any> {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : '';
    const req = http.request({
      protocol: 'http:',
      hostname: HOST,
      port: PORT,
      path,
      method,
      headers: {
        ...headers,
        ...(body ? { 'Content-Length': Buffer.byteLength(data) } : {})
      },
      timeout: 5000
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        let parsed: any;
        try { parsed = JSON.parse(d); } catch { parsed = d.substring(0, 200); }
        resolve({ path, status: res.statusCode, headers: res.headers, data: parsed });
      });
    });
    req.on('error', err => resolve({ path, error: err.message }));
    req.on('timeout', () => { req.destroy(); resolve({ path, error: 'TIMEOUT' }); });
    if (body) req.write(data);
    req.end();
  });
}

async function test4670() {
  const token = await futuriseApiClient.getValidToken();
  console.log('Token:', token.substring(0, 25) + '...');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 1. Tester la route recharge de la Page 4 (qui est aussi sur 4670 !)
  console.log('\n--- 1. TEST ROUTE RECHARGE (Page 4 PDF) ---');
  const r1 = await request4670('/api/v1/meter-recharge/recharge/0', 'POST', headers, { meterNo: METER_NO, money: 10 });
  console.log('Recharge /api/v1/meter-recharge/recharge/0 -> Status:', r1.status, 'Data:', JSON.stringify(r1.data));

  const r2 = await request4670('/meter-recharge/recharge/0', 'POST', headers, { meterNo: METER_NO, money: 10 });
  console.log('Recharge /meter-recharge/recharge/0 -> Status:', r2.status, 'Data:', JSON.stringify(r2.data));

  // 2. Tester toutes les variations de MeterLz sur 4670
  console.log('\n--- 2. TEST VARIATIONS METERLZ SUR 4670 ---');
  const paths = [
    '/api/v1/meter-control/MeterLz',
    '/meter-control/MeterLz',
    '/api/v1/meter-control/meterlz',
    '/meter-control/meterlz',
    '/api/v1/meter/MeterLz',
    '/meter/MeterLz',
    '/api/v1/metercontrol/MeterLz',
    '/metercontrol/MeterLz',
    '/api/v1/MeterLz',
    '/MeterLz',
    '/api/v1/meter-control/MeterHz',
    '/meter-control/MeterHz',
  ];

  for (const p of paths) {
    const res = await request4670(p, 'POST', headers, { meterNo: METER_NO, RoomName: '10' });
    console.log(`[POST ${p}] -> Status: ${res.status} | Data:`, JSON.stringify(res.data));
  }
}

test4670().catch(console.error);
