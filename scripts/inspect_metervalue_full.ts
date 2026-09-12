import https from 'https';
import { futuriseApiClient } from '../server/services/futurise-api.client';

async function main() {
  const token = await futuriseApiClient.getValidToken();
  const meterNo = '0128260224778';
  const agent = new https.Agent({ rejectUnauthorized: false, checkServerIdentity: () => undefined });

  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'dlms.futurise-tech.com',
      port: 4680,
      path: `/api/v1/metervalue?meterNo=${meterNo}&pageSize=10&pageIndex=1`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      agent,
      timeout: 10000
    }, (res) => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        const json = JSON.parse(b);
        console.log('=== METIVALUE RECORD FOR METER ===');
        console.log(JSON.stringify(json, null, 2));
        resolve(null);
      });
    });
    req.end();
  });
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
