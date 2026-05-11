import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const db = new Database('ami_smart_meter.db');
const BCRYPT_ROUNDS = 10;

const seedDefaultUsers = [
  { id: 'U001', username: 'admin', password: 'admin123', role: 'admin', name: 'Administrateur', associatedCustomerId: null },
  { id: 'U002', username: 'vendor', password: 'vendor123', role: 'vendor', name: 'Kiosque Vente 1', associatedCustomerId: null },
  { id: 'U003', username: 'tech', password: 'tech123', role: 'tech', name: 'Technicien Réseau', associatedCustomerId: null },
  { id: 'U004', username: 'jean', password: 'password123', role: 'customer', name: 'Jean Dupont', associatedCustomerId: 'C001' }
];

for (const u of seedDefaultUsers) {
  const hashed = bcrypt.hashSync(u.password, BCRYPT_ROUNDS);
  db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashed, u.id);
  console.log(`Updated ${u.username}`);
}
