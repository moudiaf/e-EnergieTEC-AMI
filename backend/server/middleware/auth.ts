import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'ami-sts-default-fallback-secret-CHANGE-ME';

export const requireAuth = (req: any, res: any, next: any) => {
  if (req.path === '/login' || req.originalUrl === '/api/login' || req.path === '/forgot-password' || req.originalUrl === '/api/forgot-password') return next();

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Accès refusé - Authentification requise' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token invalide ou expiré - Reconnectez-vous' });
  }
};
