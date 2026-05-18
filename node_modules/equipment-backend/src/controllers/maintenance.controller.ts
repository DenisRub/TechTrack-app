// src/controllers/maintenance.controller.ts
import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import {
  getAllMaintenancePlans,
  getMaintenancePlanById,
  createMaintenancePlan,
  updateMaintenancePlan,
  deleteMaintenancePlan,
  getAllMaintenanceTasks,
  getMaintenanceTaskById,
  createMaintenanceTask,
  updateMaintenanceTask,
  deleteMaintenanceTask,
  addTaskToPlan,
  removeTaskFromPlan,
  generateMaintenancePlan,
} from '../services/maintenance.service.js';

// Планы ТО
export async function getMaintenancePlansController(req: AuthenticatedRequest, res: Response) {
  try {
    const plans = await getAllMaintenancePlans();
    res.json(plans);
  } catch (error: any) {
    console.error('Get maintenance plans error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
}

export async function getMaintenancePlanController(req: AuthenticatedRequest, res: Response) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const plan = await getMaintenancePlanById(id);
    
    if (!plan) {
      return res.status(404).json({ error: 'План ТО не найден' });
    }
    
    res.json(plan);
  } catch (error: any) {
    console.error('Get maintenance plan error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
}

export async function createMaintenancePlanController(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.user_id || null;
    const ipAddress = req.ip || req.socket.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;
    
    const newPlan = await createMaintenancePlan(req.body, userId, ipAddress, userAgent);
    
    res.status(201).json(newPlan);
  } catch (error: any) {
    console.error('Create maintenance plan error:', error);
    res.status(400).json({ error: error.message });
  }
}

export async function updateMaintenancePlanController(req: AuthenticatedRequest, res: Response) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = req.user?.user_id || null;
    const ipAddress = req.ip || req.socket.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;
    
    const updatedPlan = await updateMaintenancePlan(id, req.body, userId, ipAddress, userAgent);
    
    res.json(updatedPlan);
  } catch (error: any) {
    console.error('Update maintenance plan error:', error);
    res.status(400).json({ error: error.message });
  }
}

export async function deleteMaintenancePlanController(req: AuthenticatedRequest, res: Response) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = req.user?.user_id || null;
    const ipAddress = req.ip || req.socket.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;
    
    await deleteMaintenancePlan(id, userId, ipAddress, userAgent);
    
    res.json({ success: true, message: 'План ТО удалён' });
  } catch (error: any) {
    console.error('Delete maintenance plan error:', error);
    res.status(400).json({ error: error.message });
  }
}

// Задачи ТО
export async function getMaintenanceTasksController(req: AuthenticatedRequest, res: Response) {
  try {
    const { node_id, status_id, type_id } = req.query;
    const tasks = await getAllMaintenanceTasks({
      node_id: node_id as string,
      status_id: status_id ? parseInt(status_id as string) : undefined,
      type_id: type_id ? parseInt(type_id as string) : undefined,
    });
    res.json(tasks);
  } catch (error: any) {
    console.error('Get maintenance tasks error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
}

export async function getMaintenanceTaskController(req: AuthenticatedRequest, res: Response) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const task = await getMaintenanceTaskById(id);
    
    if (!task) {
      return res.status(404).json({ error: 'Задача ТО не найдена' });
    }
    
    res.json(task);
  } catch (error: any) {
    console.error('Get maintenance task error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
}

export async function createMaintenanceTaskController(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.user_id || null;
    const ipAddress = req.ip || req.socket.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;
    
    const newTask = await createMaintenanceTask(req.body, userId, ipAddress, userAgent);
    
    res.status(201).json(newTask);
  } catch (error: any) {
    console.error('Create maintenance task error:', error);
    res.status(400).json({ error: error.message });
  }
}

export async function updateMaintenanceTaskController(req: AuthenticatedRequest, res: Response) {
  try {
   const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = req.user?.user_id || null;
    const ipAddress = req.ip || req.socket.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;
    
    const updatedTask = await updateMaintenanceTask(id, req.body, userId, ipAddress, userAgent);
    
    res.json(updatedTask);
  } catch (error: any) {
    console.error('Update maintenance task error:', error);
    res.status(400).json({ error: error.message });
  }
}

export async function deleteMaintenanceTaskController(req: AuthenticatedRequest, res: Response) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = req.user?.user_id || null;
    const ipAddress = req.ip || req.socket.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;
    
    await deleteMaintenanceTask(id, userId, ipAddress, userAgent);
    
    res.json({ success: true, message: 'Задача ТО удалена' });
  } catch (error: any) {
    console.error('Delete maintenance task error:', error);
    res.status(400).json({ error: error.message });
  }
}

// Связывание задач с планами
export async function addTaskToPlanController(req: AuthenticatedRequest, res: Response) {
  try {
    const planId = Array.isArray(req.params.planId) ? req.params.planId[0] : req.params.planId;
    const taskId = Array.isArray(req.params.taskId) ? req.params.taskId[0] : req.params.taskId;
    const userId = req.user?.user_id || null;
    const ipAddress = req.ip || req.socket.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;
    
    const item = await addTaskToPlan(planId, taskId, userId, ipAddress, userAgent);
    
    if (!item) {
      return res.status(400).json({ error: 'Задача уже добавлена в план' });
    }
    
    res.status(201).json({ success: true, message: 'Задача добавлена в план' });
  } catch (error: any) {
    console.error('Add task to plan error:', error);
    res.status(400).json({ error: error.message });
  }
}

export async function removeTaskFromPlanController(req: AuthenticatedRequest, res: Response) {
  try {
    const planId = Array.isArray(req.params.planId) ? req.params.planId[0] : req.params.planId;
    const taskId = Array.isArray(req.params.taskId) ? req.params.taskId[0] : req.params.taskId;
    const userId = req.user?.user_id || null;
    const ipAddress = req.ip || req.socket.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;
    
    await removeTaskFromPlan(planId, taskId, userId, ipAddress, userAgent);
    
    res.json({ success: true, message: 'Задача удалена из плана' });
  } catch (error: any) {
    console.error('Remove task from plan error:', error);
    res.status(400).json({ error: error.message });
  }
}

// Генерация плана
export async function generateMaintenancePlanController(req: AuthenticatedRequest, res: Response) {
  try {
    const { start_date, end_date, node_ids } = req.body;
    const userId = req.user?.user_id || null;
    const ipAddress = req.ip || req.socket.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;
    
    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'Укажите даты начала и окончания плана' });
    }
    
    const result = await generateMaintenancePlan(start_date, end_date, node_ids, userId, ipAddress, userAgent);
    
    res.status(201).json(result);
  } catch (error: any) {
    console.error('Generate maintenance plan error:', error);
    res.status(400).json({ error: error.message });
  }
}