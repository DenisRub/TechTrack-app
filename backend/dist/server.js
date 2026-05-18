import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { pool, initDatabase } from './config/database.js';
import router from './routes/index.js';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
// Безопасность
app.use(helmet());
// CORS
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
}));
// Логирование
app.use(morgan('combined'));
// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Слишком много запросов, попробуйте позже' },
});
app.use('/api/', limiter);
// Парсинг JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// Middleware для установки user_id в контекст БД
app.use(async (req, res, next) => {
    const userId = req.headers['x-user-id'];
    if (userId) {
        try {
            await pool.query(`SET myapp.current_user_id = $1`, [userId]);
        }
        catch (e) {
            console.error("Ошибка установки user_id в БД", e);
        }
    }
    next();
});
// Маршруты API
app.use('/api', router);
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
app.get('/test', (req, res) => {
    res.json({ message: 'Backend is working!' });
});
// Обработка 404
app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Маршрут не найден' });
});
// Обработка ошибок
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});
// Запуск сервера
async function start() {
    try {
        await initDatabase();
        await pool.query('SELECT 1');
        console.log('✅ Database connected successfully');
        app.listen(PORT, () => {
            console.log(`🚀 Сервер запущен на порту ${PORT}`);
            console.log(`📍 Health: http://localhost:${PORT}/health`);
            console.log(`📍 API: http://localhost:${PORT}/api`);
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}
start();
// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    await pool.end();
    process.exit(0);
});
