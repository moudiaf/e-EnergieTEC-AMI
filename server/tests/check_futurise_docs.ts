import http from 'http';
import https from 'https';

const HOST = '47.90.150.122';

const DOC_PATHS = [
  '/swagger-ui.html',
  '/doc.html',
  '/swagger/index.html',
  '/swagger.json',
  '/v2/api-docs',
  '/v3/api-docs',
  '/api/v1/swagger',
  '/api/v1/doc.html',
  '/apidocs'
];

async function checkDocs() {
  const ports = [
    { proto: 'http' as const, port: 1122 },
    { proto: 'http' as const, port: 4670 },
    { proto: 'https' as const, port: 4680 },
    { proto: 'https' as const, port: 443 },
    { proto: 'http' as const, port: 80 }
  ];

  for (const p of ports) {
    const lib = p.proto === 'https' ? https : http;
    for (const d of DOC_PATHS) {
      await new Promise((resolve) => {
        const req = lib.request({
          protocol: `${p.proto}:`,
          hostname: HOST,
          port: p.port,
          path: d,
          method: 'GET',
          rejectUnauthorized: false,
          timeout: 2000
        }, (res) => {
          if (res.statusCode !== 404 && res.statusCode !== 400 && res.statusCode !== 502) {
            console.log(`[${p.proto.toUpperCase()} :${p.port}${d}] -> Status: ${res.statusCode}`);
          }
          res.resume();
          resolve(true);
        });
        req.on('error', () => resolve(false));
        req.on('timeout', () => { req.destroy(); resolve(false); });
        req.end();
      });
    }
  }
}

checkDocs();
