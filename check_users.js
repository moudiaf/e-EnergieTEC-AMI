import Database from 'better-sqlite3';

const db = new Database('ami_smart_meter.db');
const users = db.prepare('SELECT id, username, password FROM users').all();
console.log(JSON.stringify(users, null, 2));
