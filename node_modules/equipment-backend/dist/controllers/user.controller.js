import { getAllUsers, getUserById, createUser, updateUser, deleteUser, getRoles } from '../services/user.service.js';
export async function getUsersController(req, res) {
    try {
        const users = await getAllUsers();
        res.json(users);
    }
    catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
}
export async function getUserController(req, res) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const user = await getUserById(id);
        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        res.json(user);
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
}
export async function createUserController(req, res) {
    try {
        const { login, password, full_name, role_id } = req.body;
        const userId = req.user?.user_id || null;
        const ipAddress = req.ip || req.socket.remoteAddress || null;
        const userAgent = req.headers['user-agent'] || null;
        const newUser = await createUser(login, password, full_name, role_id, userId, ipAddress, userAgent);
        res.status(201).json(newUser);
    }
    catch (error) {
        console.error('Create user error:', error);
        res.status(400).json({ error: error.message });
    }
}
export async function updateUserController(req, res) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const { login, full_name, role_id, is_active } = req.body;
        const userId = req.user?.user_id || null;
        const ipAddress = req.ip || req.socket.remoteAddress || null;
        const userAgent = req.headers['user-agent'] || null;
        const updatedUser = await updateUser(id, { login, full_name, role_id, is_active }, userId, ipAddress, userAgent);
        res.json(updatedUser);
    }
    catch (error) {
        console.error('Update user error:', error);
        res.status(400).json({ error: error.message });
    }
}
export async function deleteUserController(req, res) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const userId = req.user?.user_id || null;
        const ipAddress = req.ip || req.socket.remoteAddress || null;
        const userAgent = req.headers['user-agent'] || null;
        // Нельзя удалить самого себя
        if (id === req.user?.user_id) {
            return res.status(400).json({ error: 'Нельзя удалить свою учётную запись' });
        }
        const deletedUser = await deleteUser(id, userId, ipAddress, userAgent);
        res.json({ success: true, message: 'Пользователь удалён', user: deletedUser });
    }
    catch (error) {
        console.error('Delete user error:', error);
        res.status(400).json({ error: error.message });
    }
}
export async function getRolesController(req, res) {
    try {
        const roles = await getRoles();
        res.json(roles);
    }
    catch (error) {
        console.error('Get roles error:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
}
