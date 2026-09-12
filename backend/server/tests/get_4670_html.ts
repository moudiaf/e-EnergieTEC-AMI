import http from 'http';

http.get('http://47.90.150.122:4670/', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Full HTML on 4670:', data));
});
