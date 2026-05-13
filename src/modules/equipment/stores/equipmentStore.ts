import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { EquipmentNode, Resource, NodeType } from '../types/equipmentTypes';

// Ключи для localStorage
const STORAGE_KEY_NODES = 'equipment_nodes';
const STORAGE_KEY_RESOURCES = 'equipment_resources';
const STORAGE_KEY_NODE_TYPES = 'equipment_node_types';
const STORAGE_KEY_MOVE_HISTORY = 'equipment_move_history';
const STORAGE_KEY_COMPOSITION_HISTORY = 'equipment_composition_history';
const STORAGE_KEY_AUDIT_LOG = 'equipment_audit_log';

function loadFromStorage<T>(key: string, defaultValue: T): T {
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error(`Ошибка загрузки ${key} из localStorage`, e);
    }
  }
  return defaultValue;
}

function saveToStorage<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

function getCurrentDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ========== МОК-ДАННЫЕ (используются только при первом запуске) ==========
const mockNodes: EquipmentNode[] = [ /* ... ваш массив ... */ ];
const mockResources: Resource[] = [ /* ... */ ];
const mockNodeTypes: NodeType[] = [ /* ... */ ];

export const useEquipmentStore = defineStore('equipment', () => {
  // ========== ИНИЦИАЛИЗАЦИЯ С ЛОКАЛЬНЫМ ХРАНИЛИЩЕМ ==========
  const nodes = ref<EquipmentNode[]>(loadFromStorage(STORAGE_KEY_NODES, mockNodes));
  const resources = ref<Resource[]>(loadFromStorage(STORAGE_KEY_RESOURCES, mockResources));
  const nodeTypes = ref<NodeType[]>(loadFromStorage(STORAGE_KEY_NODE_TYPES, mockNodeTypes));
  const moveHistory = ref<{ id: number; nodeId: number; fromLocation: string; toLocation: string; date: string; userId: string }[]>(
    loadFromStorage(STORAGE_KEY_MOVE_HISTORY, [])
  );
  const compositionHistory = ref<{ id: number; parentId: number; childId: number; action: 'add' | 'remove'; date: string; userId?: string }[]>(
    loadFromStorage(STORAGE_KEY_COMPOSITION_HISTORY, [])
  );
  const auditLog = ref<{ timestamp: string; user: string; action: string; details: string }[]>(
    loadFromStorage(STORAGE_KEY_AUDIT_LOG, [])
  );

  // ========== ВСПОМОГАТЕЛЬНЫЕ ВЫЧИСЛЯЕМЫЕ СВОЙСТВА ==========
  const allNodes = computed(() => nodes.value);
  const activeNodes = computed(() => nodes.value.filter(n => !n.isDeleted));
  const flatList = computed(() => activeNodes.value);

  const filterParams = ref({ search: '', type: '' });
  const filteredNodes = computed(() => {
    let list = activeNodes.value;
    const { search, type } = filterParams.value;
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(n => n.name.toLowerCase().includes(s));
    }
    if (type) {
      list = list.filter(n => n.type === type);
    }
    return list;
  });

  const tree = computed(() => {
    const build = (parentId: number | null): any[] => {
      return activeNodes.value
        .filter(n => n.parentId === parentId)
        .map(n => ({ ...n, children: build(n.id) }));
    };
    return build(null);
  });

  // ========== ЖУРНАЛИРОВАНИЕ ==========
  function logAction(action: string, details: string) {
    let user = 'anonymous';
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try { user = JSON.parse(userStr).login || 'anonymous'; } catch { /* ignore */ }
    }
    auditLog.value.push({
      timestamp: new Date().toISOString(),
      user,
      action,
      details,
    });
    saveToStorage(STORAGE_KEY_AUDIT_LOG, auditLog.value);
    console.log(`[AUDIT] ${action}: ${details} (${user})`);
  }

  // ========== УЗЛЫ (CRUD) С СОХРАНЕНИЕМ ==========
  function getNode(id: number): EquipmentNode | undefined {
    return nodes.value.find(n => n.id === id);
  }

  function addNode(node: Omit<EquipmentNode, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>) {
    const newId = Math.max(...nodes.value.map(n => n.id), 0) + 1;
    const now = getCurrentDate();
    const newNode: EquipmentNode = {
      ...node,
      id: newId,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    };
    nodes.value.push(newNode);
    saveToStorage(STORAGE_KEY_NODES, nodes.value);
    logAction('Создание узла', `Узел "${node.name}" (ID ${newId})`);
  }

  function updateNode(id: number, data: Partial<EquipmentNode>) {
    const idx = nodes.value.findIndex(n => n.id === id);
    if (idx === -1) return;
    const existing = nodes.value[idx];
    if (!existing) return;
    const oldName = existing.name;
    nodes.value[idx] = {
      ...existing,
      ...data,
      updatedAt: getCurrentDate(),
    };
    saveToStorage(STORAGE_KEY_NODES, nodes.value);
    logAction('Редактирование узла', `Узел ID ${id}, было: "${oldName}", стало: "${nodes.value[idx].name}"`);
  }

  function deleteNode(id: number) {
    const node = nodes.value.find(n => n.id === id);
    if (node && !node.isDeleted) {
      node.isDeleted = true;
      saveToStorage(STORAGE_KEY_NODES, nodes.value);
      logAction('Списание узла', `Узел "${node.name}" (ID ${id}) помечен как удалённый`);
    }
  }

  // ========== ПЕРЕМЕЩЕНИЯ ==========
  function addMoveRecord(nodeId: number, fromLocation: string, toLocation: string) {
    let user = 'anonymous';
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try { user = JSON.parse(userStr).login || 'anonymous'; } catch {}
    }
    const newId = moveHistory.value.length + 1;
    moveHistory.value.push({
      id: newId,
      nodeId,
      fromLocation: fromLocation || '',
      toLocation: toLocation || '',
      date: getCurrentDate(),
      userId: user,
    });
    saveToStorage(STORAGE_KEY_MOVE_HISTORY, moveHistory.value);
    logAction('Перемещение узла', `Узел ${nodeId} перемещён из "${fromLocation}" в "${toLocation}"`);
  }

  function getMoveHistoryForNode(nodeId: number) {
    return moveHistory.value.filter(h => h.nodeId === nodeId).sort((a, b) => b.id - a.id);
  }

  // ========== КОМПЛЕКТАЦИЯ И ЕЁ ИСТОРИЯ ==========
  function addCompositionRecord(parentId: number, childId: number, action: 'add' | 'remove') {
    let user = 'anonymous';
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try { user = JSON.parse(userStr).login || 'anonymous'; } catch {}
    }
    const newId = compositionHistory.value.length + 1;
    compositionHistory.value.push({
      id: newId,
      parentId,
      childId,
      action,
      date: getCurrentDate(),
      userId: user,
    });
    saveToStorage(STORAGE_KEY_COMPOSITION_HISTORY, compositionHistory.value);
    logAction('Изменение комплектации', `${action === 'add' ? 'Добавление' : 'Удаление'} узла ${childId} ${action === 'add' ? 'в' : 'из'} агрегата ${parentId}`);
  }

  function getCompositionHistoryForNode(nodeId: number) {
    return compositionHistory.value.filter(h => h.parentId === nodeId || h.childId === nodeId);
  }

  function isDescendant(ancestorId: number, descendantId: number): boolean {
    let currentId = descendantId;
    while (currentId) {
      const current = nodes.value.find(n => n.id === currentId);
      if (!current) break;
      if (current.parentId === ancestorId) return true;
      currentId = current.parentId ?? 0;
    }
    return false;
  }

  function addChild(parentId: number, childId: number): boolean {
    if (parentId === childId) {
      console.warn('Нельзя добавить узел в самого себя');
      return false;
    }
    if (isDescendant(childId, parentId)) {
      console.warn('Нельзя добавить узел, так как это создаст цикл');
      return false;
    }
    const child = nodes.value.find(n => n.id === childId);
    if (child && child.parentId !== parentId) {
      const oldParent = child.parentId;
      child.parentId = parentId;
      saveToStorage(STORAGE_KEY_NODES, nodes.value);
      addCompositionRecord(parentId, childId, 'add');
      logAction('Добавление в состав', `Узел "${child.name}" (ID ${childId}) добавлен в агрегат ID ${parentId} (был в ${oldParent ?? 'корне'})`);
      return true;
    }
    return false;
  }

  function removeChild(parentId: number, childId: number) {
    const child = nodes.value.find(n => n.id === childId);
    if (child && child.parentId === parentId) {
      child.parentId = null;
      saveToStorage(STORAGE_KEY_NODES, nodes.value);
      addCompositionRecord(parentId, childId, 'remove');
      logAction('Удаление из состава', `Узел "${child.name}" (ID ${childId}) удалён из агрегата ID ${parentId}`);
    }
  }

  // ========== РЕСУРСЫ ==========
  function getResourcesForNode(nodeId: number): Resource[] {
    return resources.value.filter(r => r.nodeId === nodeId);
  }

  function addResource(res: Omit<Resource, 'id'>) {
    const newId = Math.max(...resources.value.map(r => r.id), 0) + 1;
    resources.value.push({ ...res, id: newId, updatedAt: getCurrentDate() });
    saveToStorage(STORAGE_KEY_RESOURCES, resources.value);
    logAction('Добавление ресурса', `Ресурс "${res.name}" для узла ID ${res.nodeId}`);
  }

  function updateResource(id: number, data: Partial<Resource>) {
    const idx = resources.value.findIndex(r => r.id === id);
    if (idx === -1) return;
    const old = resources.value[idx];
    if (!old) return;
    resources.value[idx] = {
      id: old.id,
      nodeId: data.nodeId ?? old.nodeId,
      name: data.name ?? old.name,
      value: data.value ?? old.value,
      unit: data.unit !== undefined ? data.unit : old.unit,
      updatedAt: getCurrentDate(),
    };
    saveToStorage(STORAGE_KEY_RESOURCES, resources.value);
    logAction('Редактирование ресурса', `Ресурс ID ${id} для узла ID ${old.nodeId}`);
  }

  function deleteResource(id: number) {
    const res = resources.value.find(r => r.id === id);
    if (!res) return;
    const idx = resources.value.indexOf(res);
    resources.value.splice(idx, 1);
    saveToStorage(STORAGE_KEY_RESOURCES, resources.value);
    logAction('Удаление ресурса', `Ресурс "${res.name}" (ID ${id}) удалён`);
  }

  // ========== ВИДЫ УЗЛОВ ==========
  function getNodeTypes(): NodeType[] {
    return nodeTypes.value;
  }

  function addNodeType(type: Omit<NodeType, 'id' | 'createdAt' | 'updatedAt'>) {
    const newId = Math.max(...nodeTypes.value.map(t => t.id), 0) + 1;
    const now = getCurrentDate();
    nodeTypes.value.push({ ...type, id: newId, createdAt: now, updatedAt: now });
    saveToStorage(STORAGE_KEY_NODE_TYPES, nodeTypes.value);
  }

  function updateNodeType(id: number, data: Partial<NodeType>) {
    const idx = nodeTypes.value.findIndex(t => t.id === id);
    if (idx === -1) return;
    const existing = nodeTypes.value[idx];
    if (!existing) return;
    nodeTypes.value[idx] = {
      id: existing.id,
      name: data.name ?? existing.name,
      characteristicsTemplate: data.characteristicsTemplate ?? existing.characteristicsTemplate,
      createdAt: existing.createdAt,
      updatedAt: getCurrentDate(),
    };
    saveToStorage(STORAGE_KEY_NODE_TYPES, nodeTypes.value);
  }

  function deleteNodeType(id: number) {
    const idx = nodeTypes.value.findIndex(t => t.id === id);
    if (idx !== -1) nodeTypes.value.splice(idx, 1);
    saveToStorage(STORAGE_KEY_NODE_TYPES, nodeTypes.value);
  }

  // ========== ФИЛЬТРАЦИЯ ==========
  function setFilterParams(params: Partial<typeof filterParams.value>) {
    filterParams.value = { ...filterParams.value, ...params };
  }

  // ========== ЭКСПОРТ ==========
  return {
    // Данные
    nodes: filteredNodes,
    allNodes,
    activeNodes,
    flatList,
    tree,
    resources,
    auditLog,
    moveHistory,
    compositionHistory,
    nodeTypes,
    // Методы узлов
    getNode,
    addNode,
    updateNode,
    deleteNode,
    addChild,
    removeChild,
    // Перемещения
    addMoveRecord,
    getMoveHistoryForNode,
    // Комплектация
    getCompositionHistoryForNode,
    // Ресурсы
    getResourcesForNode,
    addResource,
    updateResource,
    deleteResource,
    // Виды узлов
    getNodeTypes,
    addNodeType,
    updateNodeType,
    deleteNodeType,
    // Фильтрация
    setFilterParams,
    // Журнал
    logAction,
  };
});