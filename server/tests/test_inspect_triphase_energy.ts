import { futuriseApiClient } from '../services/futurise-api.client';
import dotenv from 'dotenv';
dotenv.config();

async function inspectTriphase() {
  const meterNo = '0128260224786';
  const token = await futuriseApiClient.getValidToken();
  const BASE_URL = process.env.FUTURISE_API_URL || 'http://47.90.150.122:4670/api';

  console.log('=== 1. /metervalue?meterNo=' + meterNo + ' ===');
  try {
    const res1 = await fetch(`${BASE_URL}/metervalue?meterNo=${meterNo}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const json1 = await res1.json();
    console.log('metervalue list:', JSON.stringify(json1, null, 2));
  } catch (e: any) {
    console.error('Err 1:', e.message);
  }

  console.log('\n=== 2. /metervalue/read for ' + meterNo + ' ===');
  try {
    const res2 = await fetch(`${BASE_URL}/metervalue/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ meterNo })
    });
    const json2 = await res2.json();
    console.log('metervalue read raw:', JSON.stringify(json2, null, 2));
  } catch (e: any) {
    console.error('Err 2:', e.message);
  }

  console.log('\n=== 3. Read OBIS 1.0.1.8.0.255 for ' + meterNo + ' ===');
  try {
    const obisRes = await futuriseApiClient.readObis(meterNo, '1.0.1.8.0.255', 'Positive Active Energy (A+)');
    console.log('OBIS 1.0.1.8.0.255:', JSON.stringify(obisRes, null, 2));
  } catch (e: any) {
    console.error('Err 3:', e.message);
  }
}

inspectTriphase();
