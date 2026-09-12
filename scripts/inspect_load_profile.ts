import https from 'https';
import { futuriseApiClient } from '../server/services/futurise-api.client';

async function main() {
  const token = await futuriseApiClient.getValidToken();
  const meterNo = '0128260224778';
  const agent = new https.Agent({ rejectUnauthorized: false, checkServerIdentity: () => undefined });

  async function get(path) {
    return new Promise((resolve) => {
      https.get(`https://dlms.futurise-tech.com:4680${path}`, {
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
          try { resolve({ status: res.statusCode, data: JSON.parse(b) }); }
          catch { resolve({ status: res.statusCode, body: b }); }
        });
      }).on('error', e => resolve({ error: e.message }));
    });
  }

  console.log('--- GET /api/v1/electricity-meter ---');
  const resMeter: any = await get(`/api/v1/electricity-meter?meterNo=${meterNo}`);
  console.log('Electricity meter full object:', JSON.stringify(resMeter.data?.data?.list?.[0], null, 2));

  console.log('\n--- GET /api/v1/load-profile-one ---');
  const resLoad = await get(`/api/v1/load-profile-one?meterNo=${meterNo}&pageSize=5&pageIndex=1`);
  console.log('Load profile one:', JSON.stringify(resLoad, null, 2).substring(0, 1000));
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
