import { futuriseApiClient } from '../services/futurise-api.client';

async function testMethods() {
  const token = await futuriseApiClient.getValidToken();
  const BASE_URL = 'https://dlms.futurise-tech.com:4680/api/v1';

  for (const m of [0, 1, 2]) {
    console.log(`Testing method ${m}...`);
    try {
      const res = await fetch(`${BASE_URL}/meter-recharge/meter-token/0`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          meterNo: '0128260224778',
          method: m,
          subClass: 1,
          value: 0
        })
      });
      const data = await res.json() as any;
      console.log(`Method ${m} -> Code: ${data.code}, Msg: ${data.msg}, form: ${data.data?.form}, state: ${data.data?.state}`);
    } catch (e: any) {
      console.log(`Method ${m} -> Error: ${e.message}`);
    }
  }
}

testMethods();
