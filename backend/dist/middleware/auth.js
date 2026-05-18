import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET must be defined in environment variables');
}
export function generateToken(user) {
    return jwt.sign(user, JWT_SECRET, {
        expiresIn: '24h'
    });
}
export function verifyToken(token) {
    try {
        const JWT_SECRET = process.env.JWT_SECRET;
        if (!JWT_SECRET)
            throw new Error('JWT_SECRET not defined');
        return jwt.verify(token, JWT_SECRET);
    }
    catch {
        return null;
    }
}
export async function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Требуется авторизация' });
    }
    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
        return res.status(401).json({ error: 'Недействительный или просроченный токен' });
    }
    // Проверяем, активен ли пользователь
    const result = await query(`SELECT u.user_id, u.is_active, r.name as role_name
     FROM equipment.users u
     JOIN equipment.roles r ON u.role_id = r.role_id
     WHERE u.user_id = $1 AND u.is_active = true`, [payload.user_id]);
    if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Пользователь неактивен или не существует' });
    }
    // Устанавливаем контекст для триггеров
    await query(`SET myapp.current_user_id = $1`, [payload.user_id]);
    req.user = payload;
    next();
}
export function requireRole(roles) {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Требуется авторизация' });
        }
        const result = await query(`SELECT r.name FROM equipment.users u
       JOIN equipment.roles r ON u.role_id = r.role_id
       WHERE u.user_id = $1`, [req.user.user_id]);
        const userRole = result.rows[0]?.name;
        if (!userRole || !roles.includes(userRole)) {
            return res.status(403).json({ error: 'Недостаточно прав для выполнения операции' });
        }
        next();
    };
}
