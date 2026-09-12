import http from 'http';

const req = http.request({
  hostname: '47.90.150.122',
  port: 4670,
  path: '/api/v1/meter-control/MeterLz',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer test'
  },
  timeout: 5000
}, (res) => {
  console.log('Status code:', res.statusCode);
  console.log('Headers:', res.headers);
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => console.log('Body:', data));
});

req.on('error', err => console.log('Socket Error:', err.message));
req.on('timeout', () => console.log('Timeout'));
req.write(JSON.stringify({ meterNo: '0128260224778', RoomName: '10' }));
req.end();
