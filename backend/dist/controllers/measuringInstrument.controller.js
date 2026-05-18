import { getAllInstruments, getInstrumentById, getInstrumentCalibrationHistory, getInstrumentsExpiringSoon, getInstrumentsExpired, createInstrument, updateInstrument, writeOffInstrument, addCalibrationHistory, } from '../services/measuringInstrument.service.js';
export async function getInstrumentsController(req, res) {
    try {
        const { status, search, location } = req.query;
        const instruments = await getAllInstruments({
            status: status,
            search: search,
            location: location,
        });
        res.json(instruments);
    }
    catch (error) {
        console.error('Get instruments error:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
}
export async function getInstrumentController(req, res) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const instrument = await getInstrumentById(id);
        if (!instrument) {
            return res.status(404).json({ error: 'Средство измерения не найдено' });
        }
        res.json(instrument);
    }
    catch (error) {
        console.error('Get instrument error:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
}
export async function getInstrumentCalibrationHistoryController(req, res) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const history = await getInstrumentCalibrationHistory(id);
        res.json(history);
    }
    catch (error) {
        console.error('Get calibration history error:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
}
export async function getInstrumentsExpiringSoonController(req, res) {
    try {
        const days = parseInt(req.query.days) || 30;
        const instruments = await getInstrumentsExpiringSoon(days);
        res.json(instruments);
    }
    catch (error) {
        console.error('Get expiring instruments error:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
}
export async function getInstrumentsExpiredController(req, res) {
    try {
        const instruments = await getInstrumentsExpired();
        res.json(instruments);
    }
    catch (error) {
        console.error('Get expired instruments error:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
}
export async function createInstrumentController(req, res) {
    try {
        const userId = req.user?.user_id || null;
        const ipAddress = req.ip || req.socket.remoteAddress || null;
        const userAgent = req.headers['user-agent'] || null;
        const newInstrument = await createInstrument(req.body, userId, ipAddress, userAgent);
        res.status(201).json(newInstrument);
    }
    catch (error) {
        console.error('Create instrument error:', error);
        res.status(400).json({ error: error.message });
    }
}
export async function updateInstrumentController(req, res) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const userId = req.user?.user_id || null;
        const ipAddress = req.ip || req.socket.remoteAddress || null;
        const userAgent = req.headers['user-agent'] || null;
        const updatedInstrument = await updateInstrument(id, req.body, userId, ipAddress, userAgent);
        res.json(updatedInstrument);
    }
    catch (error) {
        console.error('Update instrument error:', error);
        res.status(400).json({ error: error.message });
    }
}
export async function writeOffInstrumentController(req, res) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const userId = req.user?.user_id || null;
        const ipAddress = req.ip || req.socket.remoteAddress || null;
        const userAgent = req.headers['user-agent'] || null;
        await writeOffInstrument(id, userId, ipAddress, userAgent);
        res.json({ success: true, message: 'Средство измерения списано' });
    }
    catch (error) {
        console.error('Write off instrument error:', error);
        res.status(400).json({ error: error.message });
    }
}
export async function addCalibrationHistoryController(req, res) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const userId = req.user?.user_id || null;
        const ipAddress = req.ip || req.socket.remoteAddress || null;
        const userAgent = req.headers['user-agent'] || null;
        const history = await addCalibrationHistory(id, req.body, userId, ipAddress, userAgent);
        res.status(201).json(history);
    }
    catch (error) {
        console.error('Add calibration history error:', error);
        res.status(400).json({ error: error.message });
    }
}
