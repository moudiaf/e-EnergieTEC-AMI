import http from 'http';
import https from 'https';
import dotenv from 'dotenv';
import { futuriseApiClient } from '../services/futurise-api.client';

dotenv.config();

const USERNAME = process.env.FUTURISE_USERNAME || 'eEnergietec';
const PASSWORD = process.env.FUTURISE_PASSWORD || '111111';
const METER_NO = '0128260224778';

function request(proto: 'http' | 'https', host: string, port: number, path: string, method: string, headers: any, body: any): Promise<any> {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : '';
    const lib = proto === 'https' ? https : http;
    const req = lib.request({
      protocol: `${proto}:`,
      hostname: host,
      port,
      path,
      method,
      headers: {
        ...headers,
        ...(body ? { 'Content-Length': Buffer.byteLength(data) } : {})
      },
      rejectUnauthorized: false,
      timeout: 8000
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        let parsed: any;
        try { parsed = JSON.parse(d); } catch { parsed = d.substring(0, 300); }
        resolve({ status: res.statusCode, headers: res.headers, data: parsed });
      });
    });
    req.on('error', err => resolve({ error: err.message }));
    req.on('timeout', () => { req.destroy(); resolve({ error: 'TIMEOUT' }); });
    if (body) req.write(data);
    req.end();
  });
}

async function run() {
  console.log('=== TEST EXACT CONFORME AU DOCUMENT PDF FOURNI PAR L\'UTILISATEUR ===\n');

  // Étape 1 : Obtenir le token valide via le client officiel
  console.log('[1] Récupération du token via authentification officielle...');
  const token = await futuriseApiClient.getValidToken();
  console.log('Token obtenu :', token.substring(0, 40) + '...');

  // Étape 2 : Tester Meter Read sur 1122 (Page 12 PDF)
  console.log('\n[2] Test Meter Read sur 1122 (Page 12 PDF)...');
  const readRes = await request('http', '47.90.150.122', 1122, '/api/v1/metervalue/read', 'POST', {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }, {
    meterNo: METER_NO
  });
  console.log('Read 1122 -> Status:', readRes.status, 'Data:', JSON.stringify(readRes.data));

  // Étape 3 : Tester Remote Control (MeterLz) sur les ports avec ce token
  console.log('\n[3] Test Remote Control MeterLz (Page 17 & 18 PDF)...');
  const endpoints = [
    { proto: 'http' as const, host: '47.90.150.122', port: 4670, path: '/api/v1/meter-control/MeterLz' },
    { proto: 'http' as const, host: '47.90.150.122', port: 1122, path: '/api/v1/meter-control/MeterLz' },
    { proto: 'https' as const, host: '47.90.150.122', port: 4680, path: '/api/v1/meter-control/MeterLz' },
    { proto: 'http' as const, host: '47.90.150.122', port: 80, path: '/api/v1/meter-control/MeterLz' },
    { proto: 'https' as const, host: '47.90.150.122', port: 443, path: '/api/v1/meter-control/MeterLz' },
  ];

  for (const ep of endpoints) {
    const lzRes = await request(ep.proto, ep.host, ep.port, ep.path, 'POST', {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }, {
      meterNo: METER_NO,
      RoomName: '10'
    });

    console.log(`[${ep.proto.toUpperCase()} ${ep.host}:${ep.port}${ep.path}] -> Status: ${lzRes.status} | Data:`, JSON.stringify(lzRes.data));
  }
}

run();
