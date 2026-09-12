import http from 'http';
import { futuriseApiClient } from '../services/futurise-api.client';

async function testWithRealToken() {
  const token = await futuriseApiClient.getValidToken();
  console.log('Valid token:', token.substring(0, 30) + '...');

  const endpoints = [
    { port: 4670, path: '/api/v1/meter-control/MeterLz' },
    { port: 4670, path: '/api/v1/meter-control/MeterHz' },
    { port: 1122, path: '/api/v1/meter-control/MeterLz' },
    { port: 1122, path: '/api/v1/meter-control/MeterHz' },
    { port: 4680, path: '/api/v1/meter-control/MeterLz', proto: 'https' },
    { port: 4680, path: '/api/v1/meter-control/MeterHz', proto: 'https' },
  ];

  const body = JSON.stringify({ meterNo: '0128260224778', RoomName: '10' });

  for (const ep of endpoints) {
    const proto = ep.proto || 'http';
    const lib = proto === 'https' ? await import('https') : http;

    const res = await new Promise<any>((resolve) => {
      const req = lib.request({
        protocol: `${proto}:`,
        hostname: '47.90.150.122',
        port: ep.port,
        path: ep.path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Length': Buffer.byteLength(body)
        },
        rejectUnauthorized: false,
        timeout: 6000
      }, (r) => {
        let d = '';
        r.on('data', c => d += c);
        r.on('end', () => resolve({ status: r.statusCode, body: d }));
      });
      req.on('error', e => resolve({ error: e.message }));
      req.write(body);
      req.end();
    });

    console.log(`[${proto.toUpperCase()} :${ep.port}${ep.path}] -> Status: ${res.status} | Body: ${res.body || res.error}`);
  }
}

testWithRealToken();
