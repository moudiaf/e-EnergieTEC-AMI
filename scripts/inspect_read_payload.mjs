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
  const code = await get('https://47.90.150.122/js/chunk-fd933aa0.123d5a2b.js');
  
  // Find where module "4002" or metervalue functions are called
  const callers = ['metervalue/read', 'readMeterValue', 'handleRead'];
  for (const c of callers) {
    let idx = 0;
    while ((idx = code.indexOf(c, idx)) !== -1) {
      console.log(`\n=== MATCH FOR ${c} ===`);
      console.log(code.substring(Math.max(0, idx - 300), Math.min(code.length, idx + 500)));
      idx += c.length;
    }
  }
}

main().catch(console.error);
