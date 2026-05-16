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

<<<<<<< HEAD
// Мок-данные – узлы (точное соответствие таблице Оборудование)
const mockNodes: EquipmentNode[] = [
  // Пост контроля РО 147 (агрегат)
  {
    id: 1,
    name: 'Пост контроля РО 147',
    type: 'aggregate',
    parentId: null,
    subsystem: 'АСКРО СЗЗиЗН',
    manufacturer: 'НПП «Доза»',
    model: 'БОП1-ТA',
    serialNumber: '147',
    inventoryNumber: '12345',
    isSI: false,
    condition: 'в работе',
    resource: '10',
    location: 'п.г.т. Мулловка',
    note: '',
    parameters: '',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    isDeleted: false,
  },
  // Дочерние узлы поста 147
  {
    id: 2,
    name: 'Дозиметр гамма-излучения',
    type: 'block',
    parentId: 1,
    subsystem: '',
    manufacturer: 'НПП «Доза»',
    model: 'ДБГ-С11Д осн. исп.',
    serialNumber: '335',
    inventoryNumber: '12345',
    isSI: true,
    condition: 'в работе',
    resource: '15',
    location: 'п.г.т. Мулловка',
    note: '',
    parameters: '',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    isDeleted: false,
  },
  {
    id: 3,
    name: 'Аккумуляторная батарея',
    type: 'block',
    parentId: 1,
    subsystem: '',
    manufacturer: 'CSB',
    model: 'GP 12170',
    serialNumber: '',
    inventoryNumber: '',
    isSI: false,
    condition: 'в работе',
    resource: '5',
    location: 'п.г.т. Мулловка',
    note: '',
    parameters: '12В, 17АЧ',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    isDeleted: false,
  },
  {
    id: 4,
    name: 'Мобильный маршрутизатор',
    type: 'block',
    parentId: 1,
    subsystem: '',
    manufacturer: 'iRZ',
    model: 'RUH-2b',
    serialNumber: '',
    inventoryNumber: '',
    isSI: false,
    condition: 'в работе',
    resource: '',
    location: ' ',
    note: '',
    parameters: '3G, 2xLAN',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    isDeleted: false,
  },
  {
    id: 5,
    name: 'Встраиваемый ПК',
    type: 'block',
    parentId: 1,
    subsystem: '',
    manufacturer: 'EBOX',
    model: 'eBOX-3300A',
    serialNumber: '',
    inventoryNumber: '',
    isSI: false,
    condition: 'в работе',
    resource: '',
    location: ' ',
    note: '',
    parameters: '',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    isDeleted: false,
  },
  {
    id: 6,
    name: 'Табло светодиодное',
    type: 'block',
    parentId: 1,
    subsystem: '',
    manufacturer: 'Импульс',
    model: '715-D4S-ER2-RS485-DiBus',
    serialNumber: '',
    inventoryNumber: '',
    isSI: false,
    condition: 'в работе',
    resource: '',
    location: ' ',
    note: '',
    parameters: 'без регулировки',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    isDeleted: false,
  },
  // Пост контроля РО 121 (агрегат)
  {
    id: 7,
    name: 'Пост контроля РО 121',
    type: 'aggregate',
    parentId: null,
    subsystem: 'АСКРО СЗЗиЗН',
    manufacturer: 'НПП «Доза»',
    model: 'БОП1-ТЕ',
    serialNumber: '121',
    inventoryNumber: '12345',
    isSI: false,
    condition: 'в работе',
    resource: '10',
    location: 'УГЗ',
    note: '',
    parameters: '',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    isDeleted: false,
  },
  // Дочерние узлы поста 121
  {
    id: 8,
    name: 'Дозиметр гамма-излучения',
    type: 'block',
    parentId: 7,
    subsystem: '',
    manufacturer: 'НПП «Доза»',
    model: 'ДБГ-С11Д осн. исп.',
    serialNumber: '498',
    inventoryNumber: '12345',
    isSI: true,
    condition: 'в работе',
    resource: '15',
    location: 'УГЗ',
    note: '',
    parameters: '',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    isDeleted: false,
  },
  {
    id: 9,
    name: 'Аккумуляторная батарея',
    type: 'block',
    parentId: 7,
    subsystem: '',
    manufacturer: 'Activ',
    model: 'AC 1218',
    serialNumber: '',
    inventoryNumber: '',
    isSI: false,
    condition: 'в работе',
    resource: '5',
    location: 'УГЗ',
    note: '',
    parameters: '12В, 18АЧ',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    isDeleted: false,
  },
  {
    id: 10,
    name: 'Мобильный маршрутизатор',
    type: 'block',
    parentId: 7,
    subsystem: '',
    manufacturer: 'iRZ',
    model: 'RUH-2b',
    serialNumber: '',
    inventoryNumber: '',
    isSI: false,
    condition: 'в работе',
    resource: '',
    location: 'УГЗ',
    note: '',
    parameters: '3G, 2xLAN',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    isDeleted: false,
  },
  {
    id: 11,
    name: 'Встраиваемый ПК',
    type: 'block',
    parentId: 7,
    subsystem: '',
    manufacturer: 'EBOX',
    model: 'eBOX-3300A',
    serialNumber: '',
    inventoryNumber: '',
    isSI: false,
    condition: 'в работе',
    resource: '',
    location: 'УГЗ',
    note: '',
    parameters: '',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    isDeleted: false,
=======
// ========== МОК-ДАННЫЕ (используются только при первом запуске) ==========
const mockNodes: EquipmentNode[] = [
  {
    id: 1,
    name: 'Пост контроля АСКРО СЗЗ №9',
    type: 'aggregate',
    nodeTypeId: null,
    parentId: null,
    location: 'ПП №1',
    characteristics: {},
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    isDeleted: false,
    manufacturer: 'НПП «Доза»',
    model: 'АСКРО-СЗЗ',
    serialNumber: '001',
    inventoryNumber: 'ИНВ-001',
    condition: 'в работе',
    resource: '100%',
    note: '',
    subsystem: 'АСКРО ПП№1',
    isSI: false,
  },
  {
    id: 2,
    name: 'Блок детектирования БДГ-01 №373',
    type: 'block',
    nodeTypeId: 1,
    parentId: 1,
    location: 'ПП №1',
    characteristics: {},
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    isDeleted: false,
    manufacturer: 'НПП «Доза»',
    model: 'БДГ-01',
    serialNumber: '373',
    inventoryNumber: 'ИНВ-002',
    condition: 'в работе',
    resource: '95%',
    note: '',
    subsystem: 'АСКРО ПП№1',
    isSI: true,
  },
  {
    id: 3,
    name: 'Мобильный маршрутизатор iRZ RUH2b',
    type: 'block',
    nodeTypeId: 2,
    parentId: 1,
    location: 'ПП №1',
    characteristics: {},
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    isDeleted: false,
    manufacturer: 'iRZ',
    model: 'RUH2b',
    serialNumber: 'SN123456',
    inventoryNumber: 'ИНВ-003',
    condition: 'в работе',
    resource: '100%',
    note: '',
    subsystem: 'АСКРО ПП№1',
    isSI: false,
>>>>>>> 7f08f3931ee2e07c1174150a164d1a26ce9256b9
  },
];

const mockResources: Resource[] = [
<<<<<<< HEAD
  {
    id: 1,
    nodeId: 3,   // Аккумуляторная батарея CSB
    name: 'Исходный ресурс',
    value: '200',
    unit: 'Вт·ч',
    updatedAt: '2024-01-01',
  },
  {
    id: 2,
    nodeId: 3,
    name: 'Остаточный ресурс',
    value: '150',
    unit: 'Вт·ч',
    updatedAt: '2024-01-01',
  },
  {
    id: 3,
    nodeId: 9,   // Аккумуляторная батарея Activ
    name: 'Исходный ресурс',
    value: '215',
    unit: 'Вт·ч',
    updatedAt: '2024-01-01',
  },
  {
    id: 4,
    nodeId: 9,
    name: 'Остаточный ресурс',
    value: '172',
    unit: 'Вт·ч',
    updatedAt: '2024-01-01',
  },
  {
    id: 5,
    nodeId: 1,   // Пост контроля РО 147
    name: 'Остаточный ресурс',
    value: '1',
    unit: 'лет',
    updatedAt: '2024-01-01',
  },
];

const mockNodeTypes: NodeType[] = [
  { id: 1, name: 'Блок детектирования', characteristicsTemplate: { тип: { value: '', unit: '', isMain: true }, чувствительность: { value: '', unit: 'мкЗв/с', isMain: true }, диапазон: { value: '', unit: 'мкЗв/ч', isMain: false } }, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 2, name: 'Маршрутизатор', characteristicsTemplate: { модель: { value: '', unit: '', isMain: true }, порты: { value: '', unit: 'шт', isMain: true }, пропускная_способность: { value: '', unit: 'Мбит/с', isMain: false } }, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 3, name: 'Блок питания', characteristicsTemplate: { напряжение: { value: '', unit: 'В', isMain: true }, ток: { value: '', unit: 'А', isMain: true }, мощность: { value: '', unit: 'Вт', isMain: true } }, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  // ... остальные виды, если нужны
=======
  { id: 1, nodeId: 1, name: 'Остаточная ёмкость', value: 85, unit: '%', updatedAt: '2024-01-01' },
  { id: 2, nodeId: 2, name: 'Чувствительность', value: 95, unit: '%', updatedAt: '2024-01-01' },
];

const mockNodeTypes: NodeType[] = [
  { id: 1, name: 'Блок детектирования', characteristicsTemplate: { тип: 'гамма', чувствительность: '' }, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 2, name: 'Маршрутизатор', characteristicsTemplate: { модель: '', порты: '' }, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
>>>>>>> 7f08f3931ee2e07c1174150a164d1a26ce9256b9
];

export const useEquipmentStore = defineStore('equipment', () => {
  // Инициализация
  const nodes = ref<EquipmentNode[]>(loadFromStorage(STORAGE_KEY_NODES, mockNodes));
  const resources = ref<Resource[]>(loadFromStorage(STORAGE_KEY_RESOURCES, mockResources));
  // Исправленная инициализация nodeTypes
  const storedNodeTypes = loadFromStorage(STORAGE_KEY_NODE_TYPES, []);
  const nodeTypes = ref<NodeType[]>(storedNodeTypes.length ? storedNodeTypes : [...mockNodeTypes]);


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
      nodeId: data.nodeId !== undefined ? data.nodeId : old.nodeId,
      name: data.name !== undefined ? data.name : old.name,
      value: data.value !== undefined ? data.value : old.value,
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