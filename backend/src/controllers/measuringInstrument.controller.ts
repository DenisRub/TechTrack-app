// src/controllers/measuringInstrument.controller.ts
import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import {
  getAllInstruments,
  getInstrumentById,
  getInstrumentCalibrationHistory,
  getInstrumentsExpiringSoon,
  getInstrumentsExpired,
  createInstrument,
  updateInstrument,
  writeOffInstrument,
  addCalibrationHistory,
} from '../services/measuringInstrument.service.js';

export async function getInstrumentsController(req: AuthenticatedRequest, res: Response) {
  try {
    const { status, search, location } = req.query;
    const instruments = await getAllInstruments({
      status: status as string,
      search: search as string,
      location: location as string,
    });
    res.json(instruments);
  } catch (error: any) {
    console.error('Get instruments error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
}

export async function getInstrumentController(req: AuthenticatedRequest, res: Response) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const instrument = await getInstrumentById(id);
    
    if (!instrument) {
      return res.status(404).json({ error: 'Средство измерения не найдено' });
    }
    
    res.json(instrument);
  } catch (error: any) {
    console.error('Get instrument error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
}

export async function getInstrumentCalibrationHistoryController(req: AuthenticatedRequest, res: Response) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const history = await getInstrumentCalibrationHistory(id);
    res.json(history);
  } catch (error: any) {
    console.error('Get calibration history error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
}

export async function getInstrumentsExpiringSoonController(req: AuthenticatedRequest, res: Response) {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const instruments = await getInstrumentsExpiringSoon(days);
    res.json(instruments);
  } catch (error: any) {
    console.error('Get expiring instruments error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
}

export async function getInstrumentsExpiredController(req: AuthenticatedRequest, res: Response) {
  try {
    const instruments = await getInstrumentsExpired();
    res.json(instruments);
  } catch (error: any) {
    console.error('Get expired instruments error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
}

export async function createInstrumentController(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.user_id || null;
    const ipAddress = req.ip || req.socket.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;
    
    const newInstrument = await createInstrument(req.body, userId, ipAddress, userAgent);
    
    res.status(201).json(newInstrument);
  } catch (error: any) {
    console.error('Create instrument error:', error);
    res.status(400).json({ error: error.message });
  }
}

export async function updateInstrumentController(req: AuthenticatedRequest, res: Response) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = req.user?.user_id || null;
    const ipAddress = req.ip || req.socket.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;
    
    const updatedInstrument = await updateInstrument(id, req.body, userId, ipAddress, userAgent);
    
    res.json(updatedInstrument);
  } catch (error: any) {
    console.error('Update instrument error:', error);
    res.status(400).json({ error: error.message });
  }
}

export async function writeOffInstrumentController(req: AuthenticatedRequest, res: Response) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = req.user?.user_id || null;
    const ipAddress = req.ip || req.socket.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;
    
    await writeOffInstrument(id, userId, ipAddress, userAgent);
    
    res.json({ success: true, message: 'Средство измерения списано' });
  } catch (error: any) {
    console.error('Write off instrument error:', error);
    res.status(400).json({ error: error.message });
  }
}

export async function addCalibrationHistoryController(req: AuthenticatedRequest, res: Response) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = req.user?.user_id || null;
    const ipAddress = req.ip || req.socket.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;
    
    const history = await addCalibrationHistory(id, req.body, userId, ipAddress, userAgent);
    
    res.status(201).json(history);
  } catch (error: any) {
    console.error('Add calibration history error:', error);
    res.status(400).json({ error: error.message });
  }
}