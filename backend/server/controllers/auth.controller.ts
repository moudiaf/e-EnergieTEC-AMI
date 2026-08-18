import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories';
import { auditService } from '../services/audit.service';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.error('[CRITICAL] JWT_SECRET is not set in production environments! Server shutdown.');
  process.exit(1);
}
const FALLBACK_SECRET = JWT_SECRET || 'ami-sts-default-fallback-secret-CHANGE-ME';

export const AuthController = {
  async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;
      const user = await UserRepository.getByUsername(username);

      if (!user) {
        return res.status(401).json({ success: false, message: 'Identifiants invalides' });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ success: false, message: 'Identifiants invalides' });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        FALLBACK_SECRET,
        { expiresIn: '1h' }
      );
      
      await auditService.log('USER_LOGIN', `Connexion de l'utilisateur ${username}`, username);
      
      const { password: _pw, ...safeUser } = user;
      res.json({ success: true, user: safeUser, token });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Erreur lors de la connexion', error: err.message });
    }
  }
};
