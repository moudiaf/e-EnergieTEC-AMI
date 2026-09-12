import { futuriseApiClient } from '../services/futurise-api.client';

async function test() {
  console.log('--- TEST METER TOKEN SUBCLASS 1 (CLEAR CREDIT) ---');
  try {
    const res = await futuriseApiClient.meterToken('0128260224778', 1, 0);
    console.log('Result SubClass 1 (ClearCredit):', JSON.stringify(res, null, 2));
  } catch (err: any) {
    console.error('Error:', err.message);
  }
}

test();
