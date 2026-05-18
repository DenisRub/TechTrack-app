import { getAuditLog, getEntityAuditHistory } from '../services/audit.service.js';
export async function getAuditLogController(req, res) {
    try {
        const user_id = req.query.user_id;
        const entity_type = req.query.entity_type;
        const start_date = req.query.start_date;
        const end_date = req.query.end_date;
        const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
        const offset = req.query.offset ? parseInt(req.query.offset) : undefined;
        const logs = await getAuditLog({
            user_id: user_id || undefined,
            entity_type: entity_type || undefined,
            start_date: start_date || undefined,
            end_date: end_date || undefined,
            limit,
            offset,
        });
        res.json(logs);
    }
    catch (error) {
        console.error('Get audit log error:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
}
export async function getEntityAuditHistoryController(req, res) {
    try {
        // Простое приведение к строке
        const entityType = req.params.entityType;
        const entityId = req.params.entityId;
        const history = await getEntityAuditHistory(entityType, entityId);
        res.json(history);
    }
    catch (error) {
        console.error('Get entity audit history error:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
}
