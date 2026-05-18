import { login, changePassword } from '../services/auth.service.js';
export async function loginController(req, res) {
    try {
        const { login: userLogin, password } = req.body;
        const ipAddress = req.ip || req.socket.remoteAddress || null;
        const userAgent = req.headers['user-agent'] || null;
        const result = await login(userLogin, password, ipAddress, userAgent);
        if (!result.success) {
            return res.status(401).json({ error: result.error });
        }
        res.json({
            success: true,
            token: result.token,
            user: result.user,
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
}
export async function changePasswordController(req, res) {
    try {
        const { oldPassword, newPassword } = req.body;
        const userId = req.user?.user_id;
        const ipAddress = req.ip || req.socket.remoteAddress || null;
        const userAgent = req.headers['user-agent'] || null;
        if (!userId) {
            return res.status(401).json({ error: 'Неавторизован' });
        }
        if (!oldPassword || !newPassword) {
            return res.status(400).json({ error: 'Укажите старый и новый пароль' });
        }
        if (newPassword.length < 3) {
            return res.status(400).json({ error: 'Новый пароль должен быть не менее 3 символов' });
        }
        const result = await changePassword(userId, oldPassword, newPassword, ipAddress, userAgent);
        if (!result.success) {
            return res.status(400).json({ error: result.error });
        }
        res.json({ success: true, message: 'Пароль успешно изменён' });
    }
    catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
}
export async function getCurrentUserController(req, res) {
    try {
        res.json({ user: req.user });
    }
    catch (error) {
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
}
