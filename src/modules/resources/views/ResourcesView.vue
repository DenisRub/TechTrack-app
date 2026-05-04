<template>
  <div class="card">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px">
      <div style="display: flex; align-items: center; gap: 15px">
        <button v-if="nodeId" class="btn btn-secondary" @click="goBackToEquipment">← Назад к узлу</button>
        <h2 style="margin: 0">Ресурсы оборудования</h2>
      </div>
      <div class="button-group">
        <div class="dropdown">
          <button class="btn btn-secondary" @click="toggleDropdown">📎 Экспорт</button>
          <div v-if="dropdownOpen" class="dropdown-menu">
            <button class="dropdown-item" @click="handleExportToExcel">Microsoft Excel (.xlsx)</button>
            <button class="dropdown-item" @click="handleExportToWord">Microsoft Word (.docx)</button>
          </div>
        </div>
        <button class="btn btn-secondary" @click="showColumnSettings = true">⚙️ Колонки</button>
        <button class="btn btn-secondary" @click="showFilterPanel = !showFilterPanel">🔍 Фильтр</button>
        <button class="btn btn-primary" @click="openAddForm">+ Добавить ресурс</button>
      </div>
    </div>

    <!-- Панель фильтрации -->
    <div v-if="showFilterPanel" class="filter-panel">
      <div class="filter-row">
        <select v-model="newFilter.field" class="form-control">
          <option value="">-- Выберите поле --</option>
          <option value="nodeName">Узел</option>
          <option value="name">Наименование</option>
          <option value="mark">Марка</option>
          <option value="type">Тип</option>
          <option value="timeToService">Срок до ТО</option>
          <option value="remainingLife">Остаточный ресурс</option>
          <option value="status">Статус</option>
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
          {{ getFieldLabel(String(f.field)) }} {{ getOperatorLabel(f.operator) }} "{{ f.value }}"
          <button class="filter-remove" @click="removeFilter(idx)">✖</button>
        </span>
        <button class="btn btn-sm btn-secondary" @click="clearFilters">Сбросить все</button>
      </div>
    </div>

    <!-- Блок предупреждений -->
    <div v-if="alerts.length" class="alert-banner">
      <h4>⚠️ Предупреждения</h4>
      <ul>
        <li v-for="(alert, idx) in alerts" :key="idx">{{ alert }}</li>
      </ul>
    </div>

    <!-- Таблица -->
    <table class="data-table">
      <thead>
        <tr>
          <th v-for="col in visibleColumns" :key="col.key" @click="handleSort(col.key, $event)">
            {{ col.label }}
            <span v-if="getSortIcon(col.key)">{{ getSortIcon(col.key) }}</span>
          </th>
          <th>Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="res in filteredAndSortedResources" :key="res.id" :class="getStatusClass(res)">
          <td v-for="col in visibleColumns" :key="col.key">{{ formatCell(res, col.key) }}</td>
          <td>
            <button class="btn btn-sm btn-secondary" @click="viewCard(res.id)">Открыть</button>
            <button class="btn btn-sm btn-secondary" @click="editResource(res)">✏️</button>
            <button class="btn btn-sm btn-danger" @click="deleteResource(res.id)">🗑️</button>
          </td>
        </tr>
        <tr v-if="filteredAndSortedResources.length === 0">
          <td :colspan="visibleColumns.length + 1">Нет данных</td>
        </tr>
      </tbody>
    </table>

    <!-- Модальное окно настройки колонок -->
    <div class="modal-overlay" v-if="showColumnSettings">
      <div class="modal-content">
        <div class="modal-header">Настройка колонок</div>
        <div v-for="col in allColumns" :key="col.key" style="margin-bottom: 8px">
          <label>
            <input type="checkbox" v-model="selectedColumns" :value="col.key" /> {{ col.label }}
          </label>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showColumnSettings = false">Закрыть</button>
        </div>
      </div>
    </div>

    <!-- Модальные окна -->
    <ResourceForm ref="formRef" @saved="refresh" />
    <ConfirmDialog ref="confirmDialog" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useResourcesStore } from '../stores/resourcesStore';
import ResourceForm from '../components/ResourceForm.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import { exportToExcel, exportToWord } from '@/utils/exportUtils';

const route = useRoute();
const router = useRouter();
const store = useResourcesStore();
const formRef = ref();
const confirmDialog = ref();

// Определяем, перешли ли мы из карточки узла
const nodeId = route.query.nodeId ? Number(route.query.nodeId) : null;

function goBackToEquipment() {
  if (nodeId) {
    router.push(`/equipment/${nodeId}`);
  }
}

// ========== Выпадающее меню экспорта ==========
const dropdownOpen = ref(false);
function toggleDropdown() { dropdownOpen.value = !dropdownOpen.value; }

// ========== Настройка колонок ==========
const allColumns = [
  { key: 'nodeName', label: 'Узел' },
  { key: 'name', label: 'Наименование' },
  { key: 'mark', label: 'Марка' },
  { key: 'type', label: 'Тип' },
  { key: 'timeToService', label: 'Срок до ТО' },
  { key: 'remainingLife', label: 'Остаточный ресурс' },
  { key: 'status', label: 'Статус' },
  { key: 'nodeId', label: 'ID узла' },
];
const selectedColumns = ref(['nodeName', 'name', 'mark', 'type', 'timeToService', 'remainingLife', 'status']);
const showColumnSettings = ref(false);
const visibleColumns = computed(() => allColumns.filter((c) => selectedColumns.value.includes(c.key)));

// ========== Сортировка ==========
type SortItem = { field: string; order: 'asc' | 'desc' };
const sortStack = ref<SortItem[]>([{ field: 'nodeName', order: 'asc' }]);

function handleSort(field: string, event: MouseEvent) {
  if (event.shiftKey) {
    const existing = sortStack.value.find((s) => s.field === field);
    if (existing) existing.order = existing.order === 'asc' ? 'desc' : 'asc';
    else sortStack.value.push({ field, order: 'asc' });
  } else {
    const existing = sortStack.value.find((s) => s.field === field);
    if (existing && sortStack.value.length === 1) existing.order = existing.order === 'asc' ? 'desc' : 'asc';
    else sortStack.value = [{ field, order: 'asc' }];
  }
}

function getSortIcon(field: string): string {
  const entry = sortStack.value.find((s) => s.field === field);
  if (!entry) return '';
  return entry.order === 'asc' ? '↑' : '↓';
}

// ========== Фильтр ==========
const showFilterPanel = ref(false);
const filters = ref<{ field: string; operator: string; value: string }[]>([]);
const newFilter = ref({ field: '' as string, operator: 'contains', value: '' });

function getFieldLabel(field: string): string {
  const found = allColumns.find((c) => c.key === field);
  return found ? found.label : field;
}
function getOperatorLabel(op: string): string {
  const labels: Record<string, string> = { contains: 'содержит', equals: 'равно', greater: 'больше', less: 'меньше' };
  return labels[op] || op;
}

function addFilter() {
  if (!newFilter.value.field || !newFilter.value.value) return;
  filters.value.push({ ...newFilter.value });
  newFilter.value = { field: '', operator: 'contains', value: '' };
}
function removeFilter(idx: number) { filters.value.splice(idx, 1); }
function clearFilters() { filters.value = []; }

// ========== Вычисляемые значения ==========
function getRemainingLifeValue(res: any): number {
  const param = store.getParametersForResource(res.id).find((p) => p.name === 'Остаточный срок службы');
  return param ? parseFloat(param.value as string) : -1;
}
function getStatusTextValue(res: any): string {
  const remaining = getRemainingLifeValue(res);
  if (remaining < 0) return 'Нет данных';
  if (remaining < 1) return 'Критический';
  if (remaining < 2) return 'Внимание';
  return 'Норма';
}

// ========== Фильтрация и сортировка данных ==========
const filteredAndSortedResources = computed(() => {
  let list = [...store.resources];

  // Фильтры
  for (const filter of filters.value) {
    list = list.filter((res) => {
      let value: any;
      if (filter.field === 'remainingLife') value = getRemainingLifeValue(res);
      else if (filter.field === 'status') value = getStatusTextValue(res);
      else if (filter.field === 'nodeId') value = res.nodeId;
      else value = (res as any)[filter.field] || '';
      const filterValue = filter.value.toLowerCase();
      const strValue = String(value).toLowerCase();
      switch (filter.operator) {
        case 'contains': return strValue.includes(filterValue);
        case 'equals': return strValue === filterValue;
        case 'greater': return parseFloat(strValue) > parseFloat(filterValue);
        case 'less': return parseFloat(strValue) < parseFloat(filterValue);
        default: return true;
      }
    });
  }

  // Добавляем фильтр по nodeId из URL (если есть)
  if (nodeId) {
    list = list.filter(res => res.nodeId === nodeId);
  }

  // Сортировка
  if (sortStack.value.length) {
    list.sort((a, b) => {
      for (const sort of sortStack.value) {
        let valA: any, valB: any;
        if (sort.field === 'remainingLife') {
          valA = getRemainingLifeValue(a);
          valB = getRemainingLifeValue(b);
        } else if (sort.field === 'status') {
          valA = getStatusTextValue(a);
          valB = getStatusTextValue(b);
        } else {
          valA = (a as any)[sort.field] || '';
          valB = (b as any)[sort.field] || '';
        }
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        if (valA < valB) return sort.order === 'asc' ? -1 : 1;
        if (valA > valB) return sort.order === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }
  return list;
});

function formatCell(res: any, key: string): string {
  if (key === 'remainingLife') {
    const val = getRemainingLifeValue(res);
    return val >= 0 ? `${val} лет` : '-';
  }
  if (key === 'status') return getStatusTextValue(res);
  if (key === 'timeToService') return res.timeToService ? `${res.timeToService} лет` : '-';
  return res[key] || '-';
}

function getRemainingLife(res: any): string {
  const val = getRemainingLifeValue(res);
  return val >= 0 ? `${val} лет` : '-';
}
function getStatusText(res: any): string {
  const remaining = getRemainingLifeValue(res);
  if (remaining < 0) return 'Нет данных';
  if (remaining < 1) return 'Критический';
  if (remaining < 2) return 'Внимание';
  return 'Норма';
}
function getStatusClass(res: any): string {
  const status = getStatusText(res);
  if (status === 'Критический') return 'row-critical';
  if (status === 'Внимание') return 'row-warning';
  return '';
}

// Предупреждения
const alerts = computed(() => {
  const result: string[] = [];
  for (const res of store.resources) {
    if (res.timeToService && res.timeToService < 1) {
      result.push(`⚠️ ${res.nodeName} – ${res.name}: срок до ТО менее года (${res.timeToService} лет)`);
    }
    const remaining = getRemainingLife(res);
    if (remaining !== '-') {
      const years = parseFloat(remaining);
      if (years < 1) result.push(`🔴 ${res.nodeName} – ${res.name}: остаточный ресурс менее года (${remaining})`);
      else if (years < 2) result.push(`🟡 ${res.nodeName} – ${res.name}: остаточный ресурс менее 2 лет (${remaining})`);
    }
  }
  return result;
});

// Автоматический расчёт
function calculateAllResources() {
  for (const res of store.resources) {
    if (res.serviceLife && res.registrationDate) {
      const yearsPassed = new Date().getFullYear() - new Date(res.registrationDate).getFullYear();
      const remaining = Math.max(0, res.serviceLife - yearsPassed);
      const existingParam = store.getParametersForResource(res.id).find(p => p.name === 'Остаточный срок службы');
      if (existingParam) {
        store.updateParameter(existingParam.id, { value: remaining.toFixed(1) });
      } else {
        store.addParameter({
          resourceId: res.id,
          name: 'Остаточный срок службы',
          value: remaining.toFixed(1),
          unit: 'лет',
          isMain: true,
        });
      }
    }
  }
}

// Экспорт
function getExportData() {
  return filteredAndSortedResources.value.map((res) => ({
    Узел: res.nodeName || `ID: ${res.nodeId}`,
    Наименование: res.name,
    Марка: res.mark || '',
    Тип: res.type || '',
    'Срок до ТО': res.timeToService ? `${res.timeToService} лет` : '',
    'Остаточный ресурс': getRemainingLife(res),
    Статус: getStatusText(res),
  }));
}

function handleExportToExcel() {
  const data = getExportData();
  if (data.length === 0) { alert('Нет данных для экспорта'); return; }
  const filename = `Ресурсы_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`;
  exportToExcel(data, filename);
  dropdownOpen.value = false;
}

function handleExportToWord() {
  const data = getExportData();
  if (data.length === 0) { alert('Нет данных для экспорта'); return; }
  const firstItem = data[0];
  if (!firstItem) return;
  const headers = Object.keys(firstItem);
  const filename = `Ресурсы_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`;
  exportToWord(data, headers, filename);
  dropdownOpen.value = false;
}

// CRUD
function openAddForm() { formRef.value?.open(); }
function editResource(res: any) { formRef.value?.open(res); }
async function deleteResource(id: number) {
  const ok = await confirmDialog.value?.show('Удаление', 'Удалить ресурс?');
  if (ok) store.deleteResource(id);
}
function viewCard(id: number) { router.push(`/resources/${id}`); }
function refresh() { calculateAllResources(); }

function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (!target.closest('.dropdown')) dropdownOpen.value = false;
}

onMounted(() => {
  calculateAllResources();
  document.addEventListener('click', handleClickOutside);
});
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
/* все стили остаются без изменений, они уже есть в вашем коде */
.button-group { display: flex; gap: 10px; flex-wrap: wrap; position: relative; }
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
.alert-banner {
  background-color: #fff3e0;
  border-left: 4px solid #e67e22;
  padding: 12px;
  margin-bottom: 20px;
  border-radius: 4px;
}
.alert-banner ul { margin: 8px 0 0 20px; }
.row-critical { background-color: #ffe0e0; }
.row-warning { background-color: #fff3e0; }
</style>































