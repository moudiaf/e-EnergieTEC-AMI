import http from 'http';
import https from 'https';

const HOST = '47.90.150.122';

function fetchRaw(proto: 'http' | 'https', port: number, path: string = '/', method: string = 'GET'): Promise<any> {
  return new Promise((resolve) => {
    const lib = proto === 'https' ? https : http;
    const req = lib.request({
      protocol: `${proto}:`,
      hostname: HOST,
      port,
      path,
      method,
      rejectUnauthorized: false,
      timeout: 4000
    }, (res) => {
      let d = '';
      res.on('data', chunk => d += chunk);
      res.on('end', () => {
        resolve({
          proto, port, path, status: res.statusCode,
          headers: res.headers,
          body: d.substring(0, 200)
        });
      });
    });
    req.on('error', err => resolve({ proto, port, path, error: err.message }));
    req.on('timeout', () => { req.destroy(); resolve({ proto, port, path, error: 'TIMEOUT' }); });
    req.end();
  });
}

async function inspect() {
  const ports = [
    { proto: 'http' as const, port: 80 },
    { proto: 'https' as const, port: 443 },
    { proto: 'http' as const, port: 1122 },
    { proto: 'http' as const, port: 4670 },
    { proto: 'https' as const, port: 4680 },
    { proto: 'http' as const, port: 4888 }
  ];

  for (const p of ports) {
    const res = await fetchRaw(p.proto, p.port, '/');
    console.log(`[${p.proto.toUpperCase()} :${p.port}] -> Status: ${res.status || 'ERR'} | Server: ${res.headers?.server || 'N/A'} | Body: ${res.body?.replace(/\n/g, ' ')}`);
  }
}

inspect();
