import jwt from 'jsonwebtoken';
import { db } from '../db';

async function testRearm() {
  const BASE_URL = 'http://localhost:3000';
  const METER_NO = '0128260224778';

  const adminUser = await db.prepare("SELECT * FROM users WHERE username = 'admin' OR role = 'admin' LIMIT 1").get() as any;
  const secret = process.env.JWT_SECRET || 'ami-sts-default-fallback-secret-CHANGE-ME';
  const token = jwt.sign(
    { id: adminUser.id, username: adminUser.username, role: adminUser.role },
    secret,
    { expiresIn: '1h' }
  );

  console.log('--- TEST RÉARMEMENT (MeterHz / action: close) ---');
  const res = await fetch(`${BASE_URL}/api/v1/vending2/relay-control`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      meterNo: METER_NO,
      action: 'close',
      roomName: '10'
    })
  });

  const data = await res.json() as any;
  console.log('Réponse Réarmement:', JSON.stringify(data, null, 2));

  const meter = await db.prepare("SELECT id, status, relayStatus, credit FROM meters WHERE id = ?").get(METER_NO);
  console.log('État Compteur après Réarmement :', meter);

  const audit = await db.prepare("SELECT * FROM audits WHERE action = 'VENDING2_RELAY_CLOSE' ORDER BY timestamp DESC LIMIT 1").get();
  console.log('Audit Réarmement :', audit);
}

testRearm().catch(console.error);
