import fs from 'fs';
import https from 'https';

const agent = new https.Agent({ rejectUnauthorized: false, checkServerIdentity: () => undefined });

async function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { agent, timeout: 30000 }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(d));
    }).on('error', reject);
  });
}

async function main() {
  console.log('Fetching chunk to inspect meter-instantaneous-value...');
  const code = await get('https://47.90.150.122/js/chunk-fd933aa0.123d5a2b.js');
  
  const targets = ['meter-instantaneous-value', 'obis-list/read', 'metervalue/batch-read'];
  for (const t of targets) {
    console.log(`\n=================== ${t} ===================`);
    let idx = 0;
    while ((idx = code.indexOf(t, idx)) !== -1) {
      console.log(code.substring(Math.max(0, idx - 200), Math.min(code.length, idx + 300)));
      idx += t.length;
    }
  }
}

main().catch(console.error);
