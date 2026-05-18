import jwt from 'jsonwebtoken';

const SECRET = 'my-secret-key-12345';

export function generateToken(user: any): string {
  return jwt.sign(user, SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): any | null {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

export async function authenticate(req: any, res: any, next: any) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Требуется авторизация' });
    }
    
    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    
    if (!payload) {
      return res.status(401).json({ error: 'Недействительный токен' });
    }
    
    req.user = payload;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: 'Внутренняя ошибка' });
  }
}

export function requireRole(roles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Требуется авторизация' });
    }
    next();
  };
}