// src/controllers/node.controller.ts
import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import {
  getAllNodes,
  getNodeById,
  getNodeTree,
  getNodeChildren,
  getNodeMovementHistory,
  createNode,
  updateNode,
  writeOffNode,
} from '../services/node.service.js';

export async function getNodesController(req: AuthenticatedRequest, res: Response) {
  try {
    const { subsystem_id, node_type_id, status, search } = req.query;
    const nodes = await getAllNodes({
      subsystem_id: subsystem_id as string,
      node_type_id: node_type_id as string,
      status: status as string,
      search: search as string,
    });
    res.json(nodes);
  } catch (error: any) {
    console.error('Get nodes error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
}

export async function getNodeController(req: AuthenticatedRequest, res: Response) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const node = await getNodeById(id);
    
    if (!node) {
      return res.status(404).json({ error: 'Узел не найден' });
    }
    
    res.json(node);
  } catch (error: any) {
    console.error('Get node error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
}

export async function getNodeTreeController(req: AuthenticatedRequest, res: Response) {
  try {
    const tree = await getNodeTree();
    res.json(tree);
  } catch (error: any) {
    console.error('Get node tree error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
}

export async function getNodeChildrenController(req: AuthenticatedRequest, res: Response) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const children = await getNodeChildren(id);
    res.json(children);
  } catch (error: any) {
    console.error('Get node children error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
}

export async function getNodeMovementHistoryController(req: AuthenticatedRequest, res: Response) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const history = await getNodeMovementHistory(id);
    res.json(history);
  } catch (error: any) {
    console.error('Get node movement history error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
}

export async function createNodeController(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.user_id || null;
    const ipAddress = req.ip || req.socket.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;
    
    const newNode = await createNode(req.body, userId, ipAddress, userAgent);
    
    res.status(201).json(newNode);
  } catch (error: any) {
    console.error('Create node error:', error);
    res.status(400).json({ error: error.message });
  }
}

export async function updateNodeController(req: AuthenticatedRequest, res: Response) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = req.user?.user_id || null;
    const ipAddress = req.ip || req.socket.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;
    
    const updatedNode = await updateNode(id, req.body, userId, ipAddress, userAgent);
    
    res.json(updatedNode);
  } catch (error: any) {
    console.error('Update node error:', error);
    res.status(400).json({ error: error.message });
  }
}

export async function writeOffNodeController(req: AuthenticatedRequest, res: Response) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = req.user?.user_id || null;
    const ipAddress = req.ip || req.socket.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;
    
    await writeOffNode(id, userId, ipAddress, userAgent);
    
    res.json({ success: true, message: 'Узел списан' });
  } catch (error: any) {
    console.error('Write off node error:', error);
    res.status(400).json({ error: error.message });
  }
}