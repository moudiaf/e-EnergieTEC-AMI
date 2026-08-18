import { db } from '../db';
import { User } from './types';

export const UserRepository = {
  async getAll(): Promise<User[]> {
    return await db.prepare("SELECT id, username, role, name, associatedCustomerId FROM users").all() as User[];
  },
  async getByUsername(username: string): Promise<User | undefined> {
    return await db.prepare("SELECT * FROM users WHERE username = ?").get(username) as User | undefined;
  },
  async getById(id: string): Promise<User | undefined> {
    return await db.prepare("SELECT * FROM users WHERE id = ?").get(id) as User | undefined;
  },
  async insert(u: User): Promise<void> {
    await db.prepare(`
      INSERT INTO users (id, username, password, role, name, associatedCustomerId)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(u.id, u.username, u.password || '', u.role, u.name, u.associatedCustomerId);
  },
  async delete(id: string): Promise<void> {
    await db.prepare("DELETE FROM users WHERE id = ?").run(id);
  }
};
