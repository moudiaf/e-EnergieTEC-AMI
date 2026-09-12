import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'ami-sts-default-fallback-secret-CHANGE-ME';

export const requireAuth = (req: any, res: any, next: any) => {
  const path = req.path || '';
  const originalUrl = req.originalUrl || '';

  // Public bypassed routes
  if (
    path === '/login' || 
    path === '/auth/login' || 
    path === '/kms/generate-token' ||
    originalUrl.startsWith('/api/login') || 
    originalUrl.startsWith('/api/auth/login') ||
    originalUrl.startsWith('/api/kms/generate-token') ||
    originalUrl.startsWith('/api/public')
  ) {
    return next();
  }

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

export const requireRole = (allowedRoles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ error: 'Accès refusé - Profil non identifié' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: `Accès interdit - Rôle [${req.user.role}] non autorisé pour cette opération` });
    }
    next();
  };
};
