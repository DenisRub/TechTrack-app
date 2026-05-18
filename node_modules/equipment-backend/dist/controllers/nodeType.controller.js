import { getAllNodeTypes, getNodeTypeById, getNodeTypeTemplate, createNodeType, updateNodeType, deleteNodeType, } from '../services/nodeType.service.js';
export async function getNodeTypesController(req, res) {
    try {
        const nodeTypes = await getAllNodeTypes();
        res.json(nodeTypes);
    }
    catch (error) {
        console.error('Get node types error:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
}
export async function getNodeTypeController(req, res) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const nodeType = await getNodeTypeById(id);
        if (!nodeType) {
            return res.status(404).json({ error: 'Вид узла не найден' });
        }
        res.json(nodeType);
    }
    catch (error) {
        console.error('Get node type error:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
}
export async function getNodeTypeTemplateController(req, res) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const template = await getNodeTypeTemplate(id);
        if (!template) {
            return res.status(404).json({ error: 'Шаблон вида узла не найден' });
        }
        res.json(template);
    }
    catch (error) {
        console.error('Get node type template error:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
}
export async function createNodeTypeController(req, res) {
    try {
        const userId = req.user?.user_id || null;
        const ipAddress = req.ip || req.socket.remoteAddress || null;
        const userAgent = req.headers['user-agent'] || null;
        const newNodeType = await createNodeType(req.body, userId, ipAddress, userAgent);
        res.status(201).json(newNodeType);
    }
    catch (error) {
        console.error('Create node type error:', error);
        res.status(400).json({ error: error.message });
    }
}
export async function updateNodeTypeController(req, res) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const userId = req.user?.user_id || null;
        const ipAddress = req.ip || req.socket.remoteAddress || null;
        const userAgent = req.headers['user-agent'] || null;
        const updatedNodeType = await updateNodeType(id, req.body, userId, ipAddress, userAgent);
        res.json(updatedNodeType);
    }
    catch (error) {
        console.error('Update node type error:', error);
        res.status(400).json({ error: error.message });
    }
}
export async function deleteNodeTypeController(req, res) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const userId = req.user?.user_id || null;
        const ipAddress = req.ip || req.socket.remoteAddress || null;
        const userAgent = req.headers['user-agent'] || null;
        await deleteNodeType(id, userId, ipAddress, userAgent);
        res.json({ success: true, message: 'Вид узла удалён' });
    }
    catch (error) {
        console.error('Delete node type error:', error);
        res.status(400).json({ error: error.message });
    }
}
