import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import * as authController from '../controllers/auth.controller.js';
import * as userController from '../controllers/user.controller.js';
import * as nodeController from '../controllers/node.controller.js';
import * as subsystemController from '../controllers/subsystem.controller.js';
import * as nodeTypeController from '../controllers/nodeType.controller.js';
import * as measuringInstrumentController from '../controllers/measuringInstrument.controller.js';
import * as resourceController from '../controllers/resource.controller.js';
import * as maintenanceController from '../controllers/maintenance.controller.js';
import * as auditController from '../controllers/audit.controller.js';
import { validateLogin, validateUser, validateNode, validateSubsystem, validateNodeType, validateMeasuringInstrument, validateCalibrationHistory, validateResource, validateMaintenancePlan, validateMaintenance, validateIdParam, } from '../middleware/validation.js';
const router = express.Router();
// Публичные маршруты
router.post('/auth/login', validateLogin, authController.loginController);
// Защищённые маршруты
router.use(authenticate);
// Аутентификация
router.get('/auth/me', authController.getCurrentUserController);
router.post('/auth/change-password', authController.changePasswordController);
// Пользователи (только для админов)
router.get('/users', requireRole(['admin']), userController.getUsersController);
router.get('/users/roles', requireRole(['admin']), userController.getRolesController);
router.get('/users/:id', requireRole(['admin']), validateIdParam, userController.getUserController);
router.post('/users', requireRole(['admin']), validateUser, userController.createUserController);
router.put('/users/:id', requireRole(['admin']), validateIdParam, userController.updateUserController);
router.delete('/users/:id', requireRole(['admin']), validateIdParam, userController.deleteUserController);
// Узлы оборудования
router.get('/nodes', nodeController.getNodesController);
router.get('/nodes/tree', nodeController.getNodeTreeController);
router.get('/nodes/:id', validateIdParam, nodeController.getNodeController);
router.get('/nodes/:id/children', validateIdParam, nodeController.getNodeChildrenController);
router.get('/nodes/:id/movement-history', validateIdParam, nodeController.getNodeMovementHistoryController);
router.post('/nodes', requireRole(['operator', 'admin']), validateNode, nodeController.createNodeController);
router.put('/nodes/:id', requireRole(['operator', 'admin']), validateIdParam, validateNode, nodeController.updateNodeController);
router.delete('/nodes/:id/write-off', requireRole(['operator', 'admin']), validateIdParam, nodeController.writeOffNodeController);
// Подсистемы
router.get('/subsystems', subsystemController.getSubsystemsController);
router.get('/subsystems/tree', subsystemController.getSubsystemTreeController);
router.get('/subsystems/:id', validateIdParam, subsystemController.getSubsystemController);
router.get('/subsystems/:id/nodes', validateIdParam, subsystemController.getSubsystemNodesController);
router.post('/subsystems', requireRole(['operator', 'admin']), validateSubsystem, subsystemController.createSubsystemController);
router.put('/subsystems/:id', requireRole(['operator', 'admin']), validateIdParam, validateSubsystem, subsystemController.updateSubsystemController);
router.delete('/subsystems/:id', requireRole(['operator', 'admin']), validateIdParam, subsystemController.deleteSubsystemController);
// Виды узлов
router.get('/node-types', nodeTypeController.getNodeTypesController);
router.get('/node-types/:id', validateIdParam, nodeTypeController.getNodeTypeController);
router.get('/node-types/:id/template', validateIdParam, nodeTypeController.getNodeTypeTemplateController);
router.post('/node-types', requireRole(['admin']), validateNodeType, nodeTypeController.createNodeTypeController);
router.put('/node-types/:id', requireRole(['admin']), validateIdParam, validateNodeType, nodeTypeController.updateNodeTypeController);
router.delete('/node-types/:id', requireRole(['admin']), validateIdParam, nodeTypeController.deleteNodeTypeController);
// Средства измерения
router.get('/instruments', measuringInstrumentController.getInstrumentsController);
router.get('/instruments/expiring', measuringInstrumentController.getInstrumentsExpiringSoonController);
router.get('/instruments/expired', measuringInstrumentController.getInstrumentsExpiredController);
router.get('/instruments/:id', validateIdParam, measuringInstrumentController.getInstrumentController);
router.get('/instruments/:id/calibration-history', validateIdParam, measuringInstrumentController.getInstrumentCalibrationHistoryController);
router.post('/instruments', requireRole(['operator', 'admin']), validateMeasuringInstrument, measuringInstrumentController.createInstrumentController);
router.put('/instruments/:id', requireRole(['operator', 'admin']), validateIdParam, validateMeasuringInstrument, measuringInstrumentController.updateInstrumentController);
router.delete('/instruments/:id/write-off', requireRole(['operator', 'admin']), validateIdParam, measuringInstrumentController.writeOffInstrumentController);
router.post('/instruments/:id/calibration', requireRole(['operator', 'admin']), validateIdParam, validateCalibrationHistory, measuringInstrumentController.addCalibrationHistoryController);
// Ресурсы
router.get('/resources', resourceController.getResourcesController);
router.get('/resources/:id', validateIdParam, resourceController.getResourceController);
router.get('/resources/by-node/:nodeId', validateIdParam, resourceController.getResourcesForNodeController);
router.post('/resources', requireRole(['operator', 'admin']), validateResource, resourceController.createResourceController);
router.put('/resources/:id', requireRole(['operator', 'admin']), validateIdParam, validateResource, resourceController.updateResourceController);
router.delete('/resources/:id', requireRole(['operator', 'admin']), validateIdParam, resourceController.deleteResourceController);
router.post('/resources/:id/calculate', requireRole(['operator', 'admin']), validateIdParam, resourceController.calculateResourceController);
// Техническое обслуживание (планы)
router.get('/maintenance/plans', maintenanceController.getMaintenancePlansController);
router.get('/maintenance/plans/:id', validateIdParam, maintenanceController.getMaintenancePlanController);
router.post('/maintenance/plans', requireRole(['operator', 'admin']), validateMaintenancePlan, maintenanceController.createMaintenancePlanController);
router.put('/maintenance/plans/:id', requireRole(['operator', 'admin']), validateIdParam, validateMaintenancePlan, maintenanceController.updateMaintenancePlanController);
router.delete('/maintenance/plans/:id', requireRole(['operator', 'admin']), validateIdParam, maintenanceController.deleteMaintenancePlanController);
router.post('/maintenance/plans/generate', requireRole(['operator', 'admin']), maintenanceController.generateMaintenancePlanController);
// Техническое обслуживание (задачи)
router.get('/maintenance/tasks', maintenanceController.getMaintenanceTasksController);
router.get('/maintenance/tasks/:id', validateIdParam, maintenanceController.getMaintenanceTaskController);
router.post('/maintenance/tasks', requireRole(['operator', 'admin']), validateMaintenance, maintenanceController.createMaintenanceTaskController);
router.put('/maintenance/tasks/:id', requireRole(['operator', 'admin']), validateIdParam, validateMaintenance, maintenanceController.updateMaintenanceTaskController);
router.delete('/maintenance/tasks/:id', requireRole(['operator', 'admin']), validateIdParam, maintenanceController.deleteMaintenanceTaskController);
// Связи планов и задач
router.post('/maintenance/plans/:planId/tasks/:taskId', requireRole(['operator', 'admin']), maintenanceController.addTaskToPlanController);
router.delete('/maintenance/plans/:planId/tasks/:taskId', requireRole(['operator', 'admin']), maintenanceController.removeTaskFromPlanController);
// Аудит (только для админов)
router.get('/audit/logs', requireRole(['admin']), auditController.getAuditLogController);
router.get('/audit/entity/:entityType/:entityId', requireRole(['admin']), auditController.getEntityAuditHistoryController);
export default router;
