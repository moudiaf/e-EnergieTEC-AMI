import { db } from '../db';

async function cols() {
  const cols = await db.prepare('PRAGMA table_info(meters)').all() as any[];
  console.log('Columns of meters:', cols.map((c: any) => c.name));
  const sample = await db.prepare('SELECT * FROM meters LIMIT 1').get();
  console.log('Sample meter:', sample);
}

cols();
