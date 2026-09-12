import net from 'net';

const HOST = '47.90.150.122';
const PORTS_TO_CHECK = [
  80, 443, 1122, 4059, 4060, 4670, 4680, 4888, 8080, 8081, 8082, 8888, 9000, 9090
];

async function scan() {
  console.log(`Scanning ports on ${HOST}...`);
  for (const port of PORTS_TO_CHECK) {
    const isOpen = await new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(1500);
      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });
      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });
      socket.on('error', () => {
        socket.destroy();
        resolve(false);
      });
      socket.connect(port, HOST);
    });
    console.log(`Port ${port}: ${isOpen ? '🟢 OPEN' : '🔴 CLOSED / TIMEOUT'}`);
  }
}

scan();
