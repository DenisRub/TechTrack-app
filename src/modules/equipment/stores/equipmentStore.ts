import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { EquipmentNode, Resource, NodeType } from '../types/equipmentTypes';

function getCurrentDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Мок-данные – узлы
const mockNodes: EquipmentNode[] = [
  { id: 1, name: 'Пост контроля АСКРО СЗЗ №9', type: 'aggregate', nodeTypeId: null, parentId: null, location: 'ПП №1', characteristics: {}, createdAt: '2024-01-01', updatedAt: '2024-01-01', isDeleted: false },
  { id: 2, name: 'Блок детектирования БДГ-01 №373', type: 'block', nodeTypeId: 1, parentId: 1, location: 'ПП №1', characteristics: {}, createdAt: '2024-01-01', updatedAt: '2024-01-01', isDeleted: false },
  { id: 3, name: 'Мобильный маршрутизатор iRZ RUH2b', type: 'block', nodeTypeId: 2, parentId: 1, location: 'ПП №1', characteristics: {}, createdAt: '2024-01-01', updatedAt: '2024-01-01', isDeleted: false },
  { id: 4, name: 'Блок питания резервный', type: 'block', nodeTypeId: 3, parentId: null, location: 'Склад', characteristics: {}, createdAt: '2024-01-01', updatedAt: '2024-01-01', isDeleted: false },
];

// Мок-данные – ресурсы
const mockResources: Resource[] = [
  { id: 1, nodeId: 1, name: 'Остаточная ёмкость', value: 85, unit: '%', updatedAt: '2024-01-01' },
];

// Мок-данные – виды узлов
const mockNodeTypes: NodeType[] = [
  { id: 1, name: 'Блок детектирования', characteristicsTemplate: { тип: '', чувствительность: '', диапазон: '' }, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 2, name: 'Маршрутизатор', characteristicsTemplate: { модель: '', порты: '', протоколы: '' }, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 3, name: 'Блок питания', characteristicsTemplate: { напряжение: '', ток: '', мощность: '' }, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
];

export const useEquipmentStore = defineStore('equipment', () => {
  // ========== Основные данные ==========
  const nodes = ref<EquipmentNode[]>([...mockNodes]);
  const resources = ref<Resource[]>([...mockResources]);
  const nodeTypes = ref<NodeType[]>([...mockNodeTypes]);

  // ========== Фильтрация ==========
  const filterParams = ref({ search: '', type: '' });

  const flatList = computed(() => nodes.value.filter(n => !n.isDeleted));

  const filteredNodes = computed(() => {
    let list = flatList.value;
    const { search, type } = filterParams.value;
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(n => n.name.toLowerCase().includes(s));
    }
    if (type) list = list.filter(n => n.type === type);
    return list;
  });

  const tree = computed(() => {
    const build = (parentId: number | null): any[] => {
      return flatList.value
        .filter(n => n.parentId === parentId)
        .map(n => ({ ...n, children: build(n.id) }));
    };
    return build(null);
  });

  // ========== Журнал действий ==========
  const auditLog = ref<{ timestamp: string; user: string; action: string; details: string }[]>([]);
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
    console.log(`[AUDIT] ${action}: ${details} (${user})`);
  }

  // ========== Узлы (CRUD) ==========
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
    logAction('Редактирование узла', `Узел ID ${id}, было: "${oldName}", стало: "${nodes.value[idx].name}"`);
  }

  function deleteNode(id: number) {
    const node = nodes.value.find(n => n.id === id);
    if (node && !node.isDeleted) {
      node.isDeleted = true;
      logAction('Списание узла', `Узел "${node.name}" (ID ${id}) помечен как удалённый`);
    }
  }

  // ========== Перемещения ==========
  const moveHistory = ref<{ id: number; nodeId: number; fromLocation: string; toLocation: string; date: string; userId: string }[]>([]);
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
    logAction('Перемещение узла', `Узел ${nodeId} перемещён из "${fromLocation}" в "${toLocation}"`);
  }
  function getMoveHistoryForNode(nodeId: number) {
    return moveHistory.value.filter(h => h.nodeId === nodeId).sort((a, b) => b.id - a.id);
  }

  // ========== Комплектация и её история ==========
  const compositionHistory = ref<{ id: number; parentId: number; childId: number; action: 'add' | 'remove'; date: string; userId?: string }[]>([]);
  function addCompositionRecord(parentId: number, childId: number, action: 'add' | 'remove') {
    let user = 'anonymous';
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try { user = JSON.parse(userStr).login || 'anonymous'; } catch {}
    }
    compositionHistory.value.push({
      id: compositionHistory.value.length + 1,
      parentId,
      childId,
      action,
      date: getCurrentDate(),
      userId: user,
    });
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
      addCompositionRecord(parentId, childId, 'remove');
      logAction('Удаление из состава', `Узел "${child.name}" (ID ${childId}) удалён из агрегата ID ${parentId}`);
    }
  }

  // ========== Ресурсы ==========
  function getResourcesForNode(nodeId: number): Resource[] {
    return resources.value.filter(r => r.nodeId === nodeId);
  }
  function addResource(res: Omit<Resource, 'id'>) {
    const newId = Math.max(...resources.value.map(r => r.id), 0) + 1;
    resources.value.push({ ...res, id: newId, updatedAt: getCurrentDate() });
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
    logAction('Редактирование ресурса', `Ресурс ID ${id} для узла ID ${old.nodeId}`);
  }
  function deleteResource(id: number) {
    const res = resources.value.find(r => r.id === id);
    if (!res) return;
    const idx = resources.value.indexOf(res);
    resources.value.splice(idx, 1);
    logAction('Удаление ресурса', `Ресурс "${res.name}" (ID ${id}) удалён`);
  }

  // ========== Виды узлов (Node Types) ==========
  function getNodeTypes(): NodeType[] {
    return nodeTypes.value;
  }
  function addNodeType(type: Omit<NodeType, 'id' | 'createdAt' | 'updatedAt'>) {
    const newId = Math.max(...nodeTypes.value.map(t => t.id), 0) + 1;
    const now = getCurrentDate();
    nodeTypes.value.push({ ...type, id: newId, createdAt: now, updatedAt: now });
  }
function updateNodeType(id: number, data: Partial<NodeType>) {
  const idx = nodeTypes.value.findIndex(t => t.id === id);
  if (idx === -1) return;
  const existing = nodeTypes.value[idx];
  if (!existing) return; // защита от undefined
  nodeTypes.value[idx] = {
    id: existing.id,
    name: data.name ?? existing.name,
    characteristicsTemplate: data.characteristicsTemplate ?? existing.characteristicsTemplate,
    createdAt: existing.createdAt,
    updatedAt: getCurrentDate(),
  };
}
  function deleteNodeType(id: number) {
    const idx = nodeTypes.value.findIndex(t => t.id === id);
    if (idx !== -1) nodeTypes.value.splice(idx, 1);
  }

  // ========== Фильтрация ==========
  function setFilterParams(params: Partial<typeof filterParams.value>) {
    filterParams.value = { ...filterParams.value, ...params };
  }

  return {
    // Данные
    nodes: filteredNodes,
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