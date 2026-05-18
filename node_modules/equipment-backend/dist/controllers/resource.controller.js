import { getAllResources, getResourceById, getResourcesForNode, createResource, updateResource, deleteResource, calculateResource, } from '../services/resource.service.js';
export async function getResourcesController(req, res) {
    try {
        const { node_id, search } = req.query;
        const resources = await getAllResources({
            node_id: node_id,
            search: search,
        });
        res.json(resources);
    }
    catch (error) {
        console.error('Get resources error:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
}
export async function getResourceController(req, res) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const resource = await getResourceById(id);
        if (!resource) {
            return res.status(404).json({ error: 'Ресурс не найден' });
        }
        res.json(resource);
    }
    catch (error) {
        console.error('Get resource error:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
}
export async function getResourcesForNodeController(req, res) {
    try {
        const nodeId = Array.isArray(req.params.nodeId) ? req.params.nodeId[0] : req.params.nodeId;
        const resources = await getResourcesForNode(nodeId);
        res.json(resources);
    }
    catch (error) {
        console.error('Get resources for node error:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
}
export async function createResourceController(req, res) {
    try {
        const userId = req.user?.user_id || null;
        const ipAddress = req.ip || req.socket.remoteAddress || null;
        const userAgent = req.headers['user-agent'] || null;
        const newResource = await createResource(req.body, userId, ipAddress, userAgent);
        res.status(201).json(newResource);
    }
    catch (error) {
        console.error('Create resource error:', error);
        res.status(400).json({ error: error.message });
    }
}
export async function updateResourceController(req, res) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const userId = req.user?.user_id || null;
        const ipAddress = req.ip || req.socket.remoteAddress || null;
        const userAgent = req.headers['user-agent'] || null;
        const updatedResource = await updateResource(id, req.body, userId, ipAddress, userAgent);
        res.json(updatedResource);
    }
    catch (error) {
        console.error('Update resource error:', error);
        res.status(400).json({ error: error.message });
    }
}
export async function deleteResourceController(req, res) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const userId = req.user?.user_id || null;
        const ipAddress = req.ip || req.socket.remoteAddress || null;
        const userAgent = req.headers['user-agent'] || null;
        await deleteResource(id, userId, ipAddress, userAgent);
        res.json({ success: true, message: 'Ресурс удалён' });
    }
    catch (error) {
        console.error('Delete resource error:', error);
        res.status(400).json({ error: error.message });
    }
}
export async function calculateResourceController(req, res) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const { work_hours_per_year } = req.body;
        if (!work_hours_per_year || work_hours_per_year <= 0) {
            return res.status(400).json({ error: 'Укажите корректное количество часов работы в год' });
        }
        const result = await calculateResource(id, work_hours_per_year);
        res.json(result);
    }
    catch (error) {
        console.error('Calculate resource error:', error);
        res.status(400).json({ error: error.message });
    }
}
