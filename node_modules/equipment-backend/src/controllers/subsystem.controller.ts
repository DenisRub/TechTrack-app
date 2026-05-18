import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import {
  getAllSubsystems,
  getSubsystemById,
  getSubsystemTree,
  getSubsystemNodes,
  createSubsystem,
  updateSubsystem,
  deleteSubsystem,
} from '../services/subsystem.service.js';

export async function getSubsystemsController(req: AuthenticatedRequest, res: Response) {
  try {
    const subsystems = await getAllSubsystems();
    res.json(subsystems);
  } catch (error: any) {
    console.error('Get subsystems error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
}

export async function getSubsystemController(req: AuthenticatedRequest, res: Response) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const subsystem = await getSubsystemById(id);
    
    if (!subsystem) {
      return res.status(404).json({ error: 'Подсистема не найдена' });
    }
    
    res.json(subsystem);
  } catch (error: any) {
    console.error('Get subsystem error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
}

export async function getSubsystemTreeController(req: AuthenticatedRequest, res: Response) {
  try {
    const tree = await getSubsystemTree();
    res.json(tree);
  } catch (error: any) {
    console.error('Get subsystem tree error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
}

export async function getSubsystemNodesController(req: AuthenticatedRequest, res: Response) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const nodes = await getSubsystemNodes(id);
    res.json(nodes);
  } catch (error: any) {
    console.error('Get subsystem nodes error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
}

export async function createSubsystemController(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.user_id || null;
    const ipAddress = req.ip || req.socket.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;
    
    const newSubsystem = await createSubsystem(req.body, userId, ipAddress, userAgent);
    
    res.status(201).json(newSubsystem);
  } catch (error: any) {
    console.error('Create subsystem error:', error);
    res.status(400).json({ error: error.message });
  }
}

export async function updateSubsystemController(req: AuthenticatedRequest, res: Response) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = req.user?.user_id || null;
    const ipAddress = req.ip || req.socket.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;
    
    const updatedSubsystem = await updateSubsystem(id, req.body, userId, ipAddress, userAgent);
    
    res.json(updatedSubsystem);
  } catch (error: any) {
    console.error('Update subsystem error:', error);
    res.status(400).json({ error: error.message });
  }
}

export async function deleteSubsystemController(req: AuthenticatedRequest, res: Response) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = req.user?.user_id || null;
    const ipAddress = req.ip || req.socket.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;
    
    await deleteSubsystem(id, userId, ipAddress, userAgent);
    
    res.json({ success: true, message: 'Подсистема удалена' });
  } catch (error: any) {
    console.error('Delete subsystem error:', error);
    res.status(400).json({ error: error.message });
  }
}