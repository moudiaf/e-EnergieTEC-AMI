import https from 'https';
import fs from 'fs';

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
  console.log('Downloading chunk-fd933aa0.123d5a2b.js...');
  const code = await get('https://47.90.150.122/js/chunk-fd933aa0.123d5a2b.js');
  console.log('Downloaded size:', code.length);

  // Search for all occurrences of /api/v1/
  const regex = /\/api\/v1\/[a-zA-Z0-9_\-\/]+/g;
  const matches = new Set(code.match(regex));
  console.log('=== ALL /api/v1/ ENDPOINTS IN FUTURISE PORTAL ===');
  Array.from(matches).sort().forEach(m => console.log(m));
}

main().catch(console.error);
