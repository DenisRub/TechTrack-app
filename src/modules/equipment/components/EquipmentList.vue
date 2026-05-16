<template>
  <div class="card">
    <div style="display: flex; justify-content: space-between; margin-bottom: 20px">
      <h2>Оборудование</h2>
      <div class="button-group">
        <div class="dropdown">
          <button class="btn btn-secondary" @click="toggleDropdown">📎 Экспорт</button>
          <div v-if="dropdownOpen" class="dropdown-menu">
            <button class="dropdown-item" @click="exportToExcelFile">Microsoft Excel (.xlsx)</button>
            <button class="dropdown-item" @click="exportToWordFile">Microsoft Word (.docx)</button>
          </div>
        </div>
        <button class="btn btn-secondary" @click="showColumnSettings = true">⚙️ Колонки</button>
        <button class="btn btn-secondary" @click="showFilterPanel = !showFilterPanel">🔍 Расш. фильтр</button>
        <button v-if="canEdit" class="btn btn-primary" @click="openAddForm">+ Добавить</button>
      </div>
    </div>

    <!-- Быстрая фильтрация -->
    <div class="quick-filters">
      <input
        v-model="quickSearch"
        type="text"
        placeholder="Поиск по наименованию"
        class="form-control"
        style="width: 250px"
        @input="applyQuickFilters"
      />
      <select v-model="quickType" class="form-control" style="width: 150px" @change="applyQuickFilters">
        <option value="">Все типы</option>
        <option value="aggregate">Агрегаты</option>
        <option value="block">Блоки</option>
      </select>
      <button class="btn btn-secondary" @click="resetAllFilters">Сбросить</button>
    </div>

    <!-- Расширенная панель фильтрации -->
    <div v-if="showFilterPanel" class="filter-panel">
      <div class="filter-row">
        <select v-model="newFilter.field" class="form-control">
          <option value="">-- Выберите поле --</option>
          <option v-for="col in allColumns" :key="col.key" :value="col.key">{{ col.label }}</option>
        </select>
        <select v-model="newFilter.operator" class="form-control">
          <option value="contains">Содержит</option>
          <option value="equals">Равно</option>
          <option value="greater">Больше</option>
          <option value="less">Меньше</option>
        </select>
        <input v-model="newFilter.value" type="text" placeholder="Значение" class="form-control" />
        <button class="btn btn-primary btn-sm" @click="addFilter">Найти</button>
      </div>
      <div class="filter-list" v-if="filters.length">
        <span v-for="(f, idx) in filters" :key="idx" class="filter-tag">
          {{ getFieldLabel(f.field) }} {{ getOperatorLabel(f.operator) }} "{{ f.value }}"
          <button class="filter-remove" @click="removeFilter(idx)">✖</button>
        </span>
        <button class="btn btn-sm btn-secondary" @click="clearFilters">Сбросить все</button>
      </div>
    </div>

    <!-- Таблица -->
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th v-for="col in visibleColumns" :key="col.key" @click="sortBy(col.key)">
              {{ col.label }}
              <span v-if="sortKey === col.key">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
            </th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="node in filteredAndSortedNodes" :key="node.id" :class="{ 'disabled-row': node.isDeleted }">
            <td v-for="col in visibleColumns" :key="col.key">{{ formatCell(node, col.key) }}</td>
            <td>
              <button class="btn btn-sm btn-secondary" @click="viewCard(node.id)">Просмотр</button>
              <template v-if="!node.isDeleted">
                <button v-if="canEdit" class="btn btn-sm btn-secondary" @click="editNode(node)">✏️</button>
                <button v-if="canEdit" class="btn btn-sm btn-danger" @click="deleteNode(node.id)">Списать</button>
              </template>
              <span v-else class="badge-disabled">Списан</span>
            </td>
          </tr>
          <tr v-if="filteredAndSortedNodes.length === 0">
            <td :colspan="visibleColumns.length + 1">Нет данных</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Модальное окно настройки колонок -->
    <div class="modal-overlay" v-if="showColumnSettings">
      <div class="modal-content" style="width: 500px;">
        <div class="modal-header">Настройка колонок</div>
        <div class="column-settings-list">
          <div v-for="(colKey, idx) in columnOrder" :key="colKey" class="column-item">
            <label>
              <input
                type="checkbox"
                :value="colKey"
                v-model="selectedColumns"
                @change="saveColumnSettings"
              />
              {{ getColumnLabel(colKey) }}
            </label>
            <div class="column-actions">
              <button
                v-if="idx > 0"
                class="btn-icon"
                @click="moveColumnUp(idx)"
                title="Вверх"
              >▲</button>
              <button
                v-if="idx < columnOrder.length - 1"
                class="btn-icon"
                @click="moveColumnDown(idx)"
                title="Вниз"
              >▼</button>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="resetColumnSettings">Сбросить</button>
          <button class="btn btn-secondary" @click="showColumnSettings = false">Закрыть</button>
        </div>
      </div>
    </div>

    <EquipmentForm ref="formRef" @saved="refresh" />
    <ConfirmDialog ref="confirmDialog" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useEquipmentStore } from '../stores/equipmentStore';
import EquipmentForm from './EquipmentForm.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import { exportToExcel as exportToExcelUtil, exportToWord as exportToWordUtil } from '@/utils/exportUtils';
import type { EquipmentNode } from '../types/equipmentTypes';

const router = useRouter();
const store = useEquipmentStore();
const formRef = ref();
const confirmDialog = ref();

// ========== Быстрые фильтры ==========
const quickSearch = ref('');
const quickType = ref('');

function applyQuickFilters() {
  // триггер обновления computed
}

// ========== Колонки ==========
const allColumns = [
  { key: 'subsystem', label: 'Подсистема' },
  { key: 'name', label: 'Наименование' },
  { key: 'parentName', label: 'Установлено в' },
  { key: 'manufacturer', label: 'Производитель' },
  { key: 'model', label: 'Марка' },
  { key: 'parameters', label: 'Параметры' },
  { key: 'serialNumber', label: 'Зав. №' },
  { key: 'inventoryNumber', label: 'Инв. №' },
  { key: 'isSI', label: 'СИ' },
  { key: 'condition', label: 'Состояние' },
  { key: 'resource', label: 'Ресурс' },
  { key: 'location', label: 'Размещение' },
  { key: 'note', label: 'Примечание' },
];

const selectedColumns = ref([
  'subsystem', 'name', 'parentName', 'manufacturer', 'model', 'parameters',
  'serialNumber', 'inventoryNumber', 'isSI', 'condition', 'resource', 'location', 'note'
]);

const showColumnSettings = ref(false);
const dropdownOpen = ref(false);

// ========== Порядок колонок и настройка ==========
const COLUMN_ORDER_KEY = 'equipment_column_order';
const allColumnKeys = allColumns.map(c => c.key);

const storedOrder = localStorage.getItem(COLUMN_ORDER_KEY);
const columnOrder = ref<string[]>(
  storedOrder ? JSON.parse(storedOrder) : [...allColumnKeys]
);

// Синхронизация с возможными новыми колонками
const existingKeys = new Set(columnOrder.value);
const missingKeys = allColumnKeys.filter(k => !existingKeys.has(k));
if (missingKeys.length) {
  columnOrder.value.push(...missingKeys);
  localStorage.setItem(COLUMN_ORDER_KEY, JSON.stringify(columnOrder.value));
}

function getColumnLabel(key: string): string {
  const col = allColumns.find(c => c.key === key);
  return col ? col.label : key;
}

function saveColumnSettings() {
  localStorage.setItem('selectedColumns', JSON.stringify(selectedColumns.value));
  localStorage.setItem(COLUMN_ORDER_KEY, JSON.stringify(columnOrder.value));
}

function moveColumnUp(idx: number) {
  if (idx === 0) return;
  const newOrder = [...columnOrder.value];
  const temp = newOrder[idx - 1] as string;
  newOrder[idx - 1] = newOrder[idx] as string;
  newOrder[idx] = temp;
  columnOrder.value = newOrder;
  saveColumnSettings();
}

function moveColumnDown(idx: number) {
  if (idx === columnOrder.value.length - 1) return;
  const newOrder = [...columnOrder.value];
  const temp = newOrder[idx + 1] as string;
  newOrder[idx + 1] = newOrder[idx] as string;
  newOrder[idx] = temp;
  columnOrder.value = newOrder;
  saveColumnSettings();
}
function resetColumnSettings() {
  selectedColumns.value = [
    'subsystem', 'name', 'parentName', 'manufacturer', 'model', 'parameters',
    'serialNumber', 'inventoryNumber', 'isSI', 'condition', 'resource', 'location', 'note'
  ];
  columnOrder.value = [...allColumnKeys];
  saveColumnSettings();
}

const visibleColumns = computed(() => {
  return columnOrder.value
    .filter(key => selectedColumns.value.includes(key))
    .map(key => allColumns.find(c => c.key === key)!)
    .filter(Boolean);
});

// ========== Сортировка ==========
const sortKey = ref('id');
const sortOrder = ref<'asc' | 'desc'>('asc');

function sortBy(key: string) {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortOrder.value = 'asc';
  }
}

// ========== Расширенный фильтр ==========
const showFilterPanel = ref(false);
const filters = ref<{ field: string; operator: string; value: string }[]>([]);
const newFilter = ref({ field: '', operator: 'contains', value: '' });

function getFieldLabel(field: string): string {
  const found = allColumns.find(c => c.key === field);
  return found ? found.label : field;
}
function getOperatorLabel(op: string): string {
  const labels: Record<string, string> = {
    contains: 'содержит',
    equals: 'равно',
    greater: 'больше',
    less: 'меньше',
  };
  return labels[op] || op;
}

function addFilter() {
  if (!newFilter.value.field || !newFilter.value.value) return;
  filters.value.push({ ...newFilter.value });
  newFilter.value = { field: '', operator: 'contains', value: '' };
}
function removeFilter(idx: number) { filters.value.splice(idx, 1); }
function clearFilters() { filters.value = []; }

function resetAllFilters() {
  quickSearch.value = '';
  quickType.value = '';
  filters.value = [];
  sortKey.value = 'id';
  sortOrder.value = 'asc';
  applyQuickFilters();
}

// ========== Вспомогательные функции ==========
function getParentName(node: EquipmentNode): string {
  if (!node.parentId) return '';
  const parent = store.getNode(node.parentId);
  return parent ? parent.name : '';
}

// ========== Получение значения поля для узла (используется в фильтрации) ==========
function getNodeFieldValue(node: any, field: string): any {
  switch (field) {
    case 'subsystem': return node.subsystem || '';
    case 'type': return node.type === 'aggregate' ? 'Агрегат' : 'Блок';
    case 'manufacturer': return node.manufacturer || '';
    case 'model': return node.model || '';
    case 'serialNumber': return node.serialNumber || '';
    case 'inventoryNumber': return node.inventoryNumber || '';
    case 'isSI': return node.isSI ? 'Да' : 'Нет';
    case 'condition': return node.condition || '';
    case 'resource': return node.resource || '';
    case 'location': return node.location || '';
    case 'note': return node.note || '';
    case 'parentName': return getParentName(node);
    case 'parameters': return node.parameters || '';
    default: return (node as any)[field] || '';
  }
}

// ========== Фильтрация и сортировка данных ==========
const filteredAndSortedNodes = computed(() => {
  let list = [...store.allNodes];

  // Быстрые фильтры
  if (quickSearch.value) {
    const s = quickSearch.value.toLowerCase();
    list = list.filter(n => n.name.toLowerCase().includes(s));
  }
  if (quickType.value) {
    list = list.filter(n => n.type === quickType.value);
  }

  // Расширенные фильтры
  for (const filter of filters.value) {
    list = list.filter(node => {
      let value = getNodeFieldValue(node, filter.field);
      if (value === undefined || value === null) value = '';
      const strValue = String(value).toLowerCase();
      const filterValue = filter.value.toLowerCase();

      switch (filter.operator) {
        case 'contains': return strValue.includes(filterValue);
        case 'equals': return strValue === filterValue;
        case 'greater': return parseFloat(strValue) > parseFloat(filterValue);
        case 'less': return parseFloat(strValue) < parseFloat(filterValue);
        default: return true;
      }
    });
  }

  // Сортировка: списанные в конец, затем по полю sortKey
  list.sort((a, b) => {
    if (a.isDeleted !== b.isDeleted) {
      return a.isDeleted ? 1 : -1;
    }
    let valA = getNodeFieldValue(a, sortKey.value);
    let valB = getNodeFieldValue(b, sortKey.value);
    if (valA === undefined || valA === null) valA = '';
    if (valB === undefined || valB === null) valB = '';
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();
    if (valA < valB) return sortOrder.value === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder.value === 'asc' ? 1 : -1;
    return 0;
  });

  return list;
});

function formatCell(node: EquipmentNode, key: string): string {
  if (key === 'type') return node.type === 'aggregate' ? 'Агрегат' : 'Блок';
  if (key === 'isSI') return node.isSI ? 'да' : 'нет';
  if (key === 'parentName') return getParentName(node);
  if (key === 'parameters') return node.parameters || '-';
  const val = (node as any)[key];
  return val ?? '-';
}

// ========== Права доступа ==========
const canEdit = computed(() => {
  const user = localStorage.getItem('user');
  if (!user) return false;
  const role = JSON.parse(user).role;
  return role === 'operator' || role === 'admin';
});

// ========== CRUD ==========
function openAddForm() { formRef.value?.open(); }
function editNode(node: any) { formRef.value?.open(node); }
async function deleteNode(id: number) {
  const ok = await confirmDialog.value?.show('Списание', 'Списать узел?');
  if (ok) store.deleteNode(id);
}
function viewCard(id: number) { router.push(`/equipment/${id}`); }
function refresh() { /* реактивно */ }

// ========== Экспорт ==========
function getExportData() {
  return filteredAndSortedNodes.value.map(node => {
    const row: any = {};
    for (const col of visibleColumns.value) {
      row[col.label] = getNodeFieldValue(node, col.key);
    }
    return row;
  });
}

function getExportTitle(): string {
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return `Оборудование (от ${dateStr})`;
}

function exportToExcelFile() {
  const data = getExportData();
  if (data.length === 0) {
    alert('Нет данных для экспорта');
    return;
  }
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const filename = `Оборудование_${dateStr}`;
  const title = getExportTitle();
  exportToExcelUtil(data, filename, title);
  dropdownOpen.value = false;
}

function exportToWordFile() {
  const data = getExportData();
  if (data.length === 0) {
    alert('Нет данных для экспорта');
    return;
  }
  const headers = Object.keys(data[0] || {});
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const filename = `Оборудование_${dateStr}`;
  const title = getExportTitle();
  exportToWordUtil(data, headers, filename, title);
  dropdownOpen.value = false;
}

function toggleDropdown() { dropdownOpen.value = !dropdownOpen.value; }
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (!target.closest('.dropdown')) dropdownOpen.value = false;
}

// Загрузка сохранённых настроек колонок при монтировании
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  const savedSelected = localStorage.getItem('selectedColumns');
  if (savedSelected) {
    try {
      const parsed = JSON.parse(savedSelected);
      if (Array.isArray(parsed)) selectedColumns.value = parsed;
    } catch (e) {}
  }
  const savedOrder = localStorage.getItem(COLUMN_ORDER_KEY);
  if (savedOrder) {
    try {
      const parsed = JSON.parse(savedOrder);
      if (Array.isArray(parsed)) columnOrder.value = parsed;
    } catch (e) {}
  }
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.table-wrapper {
  overflow-x: auto;
  overflow-y: visible;
  width: 100%;
  margin-bottom: 1rem;
  border-radius: 8px;
}
.data-table {
  min-width: 1400px;
  width: 100%;
  white-space: nowrap;
  border-collapse: collapse;
}
.card {
  overflow-x: hidden;
}
.button-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  position: relative;
}
.dropdown { position: relative; }
.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  background: white;
  border: 1px solid #e0e4e8;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  z-index: 100;
  min-width: 220px;
}
.dropdown-item {
  display: block;
  width: 100%;
  padding: 8px 12px;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
}
.dropdown-item:hover { background-color: #f0f2f5; }
.quick-filters {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  align-items: center;
}
.filter-panel {
  background: #f8f9fa;
  border: 1px solid #e0e4e8;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
}
.filter-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}
.filter-row .form-control { width: auto; min-width: 150px; }
.filter-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.filter-tag {
  background: #e9ecef;
  padding: 4px 8px;
  border-radius: 16px;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.filter-remove {
  background: none;
  border: none;
  cursor: pointer;
  color: #c0392b;
  font-weight: bold;
}
.disabled-row {
  background-color: #f0f0f0;
  color: #999;
  opacity: 0.7;
}
.badge-disabled {
  display: inline-block;
  padding: 4px 8px;
  background-color: #e9ecef;
  color: #6c757d;
  border-radius: 4px;
  font-size: 12px;
}
.column-settings-list {
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 15px;
}
.column-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  border-bottom: 1px solid #e0e4e8;
}
.column-item label {
  flex: 1;
  cursor: pointer;
}
.column-actions {
  display: flex;
  gap: 4px;
}
.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  padding: 2px 6px;
  border-radius: 4px;
}
.btn-icon:hover {
  background-color: #e9ecef;
}
</style>