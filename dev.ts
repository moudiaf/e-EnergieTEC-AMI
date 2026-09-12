import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\x1b[36m%s\x1b[0m', '═══════════════════════════════════════════════════════════════');
console.log('\x1b[36m%s\x1b[0m', '  🚀 e-EnergieTEC - Démarrage du Backend (5000) & Frontend (3000)');
console.log('\x1b[36m%s\x1b[0m', '═══════════════════════════════════════════════════════════════\n');

// 1. Démarrer le Backend sur le port 5000
const backendProcess = spawn('npx', ['tsx', 'server.ts'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, PORT: '5000' }
});

// 2. Démarrer le Frontend Vite sur le port 3000
const frontendProcess = spawn('npx', ['vite'], {
  cwd: path.join(__dirname, 'frontend'),
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, PORT: '3000' }
});

const cleanup = () => {
  console.log('\n\x1b[33m%s\x1b[0m', 'Arrêt des services e-EnergieTEC...');
  backendProcess.kill();
  frontendProcess.kill();
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
