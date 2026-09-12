import { futuriseApiClient } from '../services/futurise-api.client';
import http from 'http';
import https from 'https';

const METER_NO = '0128260224778';

function sendReq(proto: 'http' | 'https', host: string, port: number, path: string, token: string, body: any): Promise<any> {
  return new Promise((resolve) => {
    const data = JSON.stringify(body);
    const lib = proto === 'https' ? https : http;
    const req = lib.request({
      protocol: `${proto}:`,
      hostname: host,
      port,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(data)
      },
      rejectUnauthorized: false,
      timeout: 6000
    }, (res) => {
      let d = '';
      res.on('data', chunk => d += chunk);
      res.on('end', () => {
        let parsed: any;
        try { parsed = JSON.parse(d); } catch { parsed = d.substring(0, 150); }
        resolve({ proto, host, port, path, status: res.statusCode, data: parsed });
      });
    });

    req.on('error', (err) => {
      resolve({ proto, host, port, path, error: err.message });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ proto, host, port, path, error: 'TIMEOUT' });
    });

    req.write(data);
    req.end();
  });
}

async function deepProbe() {
  console.log('--- 1. Récupération du token valide ---');
  const token = await futuriseApiClient.getValidToken();
  console.log('Token obtenu :', token.substring(0, 30) + '...');

  const targets = [
    // 1. Port 4680 HTTPS (dlms.futurise-tech.com)
    { proto: 'https' as const, host: 'dlms.futurise-tech.com', port: 4680 },
    // 2. Port 4680 HTTPS (47.90.150.122)
    { proto: 'https' as const, host: '47.90.150.122', port: 4680 },
    // 3. Port 1122 HTTP (47.90.150.122)
    { proto: 'http' as const, host: '47.90.150.122', port: 1122 },
    // 4. Port 4670 HTTP (47.90.150.122)
    { proto: 'http' as const, host: '47.90.150.122', port: 4670 },
  ];

  const paths = [
    '/api/v1/meter-control/MeterLz',
    '/api/v1/meter-control/MeterHz',
    '/api/v1/meter-control/meterLz',
    '/api/v1/meter-control/meterlz',
    '/meter-control/MeterLz',
    '/meter-control/MeterHz',
  ];

  const body = { meterNo: METER_NO, RoomName: '10' };

  for (const t of targets) {
    console.log(`\n=== Testing Target: ${t.proto}://${t.host}:${t.port} ===`);
    for (const p of paths) {
      const res = await sendReq(t.proto, t.host, t.port, p, token, body);
      if (res.error) {
        console.log(`❌ [${p}] Error: ${res.error}`);
      } else {
        const is200 = res.status === 200;
        const mark = is200 ? '🟢 BINGO 200 OK' : `HTTP ${res.status}`;
        console.log(`${mark} [${p}] -> Response:`, JSON.stringify(res.data));
      }
    }
  }
}

deepProbe().catch(console.error);
