<template>
  <div class="card">
    <div class="resources-header">
      <h2>Ресурсы</h2>
      <div class="top-buttons">
        <button class="btn btn-secondary btn-uniform" @click="openMeasurementsModal">📊 Журнал измерений</button>
        <button class="btn btn-secondary btn-uniform" @click="openAddMeasurementModal">➕ Добавить измерение</button>
        <button class="btn btn-secondary btn-uniform" @click="openAddForm">➕ Добавить ресурс</button>
      </div>
    </div>

    <!-- Блок предупреждений -->
    <div v-if="globalAlerts.length" class="alerts-section">
      <h4>⚠️ Предупреждения</h4>
      <ul>
        <li v-for="(alert, idx) in globalAlerts" :key="idx" :class="alert.type">{{ alert.message }}</li>
      </ul>
    </div>

    <div class="bottom-buttons">
      <button class="btn btn-secondary btn-uniform" @click="showFilterPanel = !showFilterPanel">🔍 Фильтрация</button>
      <button class="btn btn-secondary btn-uniform" @click="showColumnSettings = true">⚙️ Колонки</button>
      <div class="dropdown">
        <button class="btn btn-secondary btn-uniform" @click="toggleDropdown">📎 Экспорт</button>
        <div v-if="dropdownOpen" class="dropdown-menu">
          <button class="dropdown-item" @click="exportToExcelFile">Microsoft Excel (.xlsx)</button>
          <button class="dropdown-item" @click="exportToWordFile">Microsoft Word (.docx)</button>
        </div>
      </div>
    </div>

    <!-- Фильтрация -->
    <div v-if="showFilterPanel" class="filter-panel">
      <div class="filter-row">
        <input v-model="filters.name" placeholder="Наименование" class="form-control" />
        <input v-model="filters.mark" placeholder="Марка" class="form-control" />
        <input v-model="filters.registrationNumber" placeholder="Учётный №" class="form-control" />
        <input v-model="filters.nodeName" placeholder="Размещение" class="form-control" />
        <button class="btn btn-primary btn-sm" @click="applyFilters">Найти</button>
        <button class="btn btn-secondary btn-sm" @click="resetFilters">Сбросить</button>
      </div>
    </div>

    <!-- Таблица -->
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th v-for="col in visibleColumns" :key="col.key" @click="sortBy(col.key)">
              {{ col.label }}
              <span v-if="sortField === col.key">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
            </th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="res in sortedResources" :key="res.id" :class="getRowClass(res)">
            <td v-for="col in visibleColumns" :key="col.key">{{ formatCell(res, col.key) }}</td>
            <td class="actions-cell">
              <button class="btn btn-sm btn-secondary" @click="viewCard(res.id)">Просмотр</button>
              <template v-if="!res.isDeleted">
                <button v-if="canEdit" class="btn btn-sm btn-secondary" @click="editResource(res)">✏️</button>
                <button v-if="canEdit" class="btn btn-sm btn-danger" @click="deleteResource(res.id)">Списать</button>
              </template>
              <span v-else class="badge-disabled">Списан</span>
            </td>
          </tr>
          <tr v-if="sortedResources.length === 0">
            <td :colspan="visibleColumns.length + 1" style="text-align: center">Нет данных</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Настройка колонок -->
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

    <ResourceForm ref="formRef" @saved="refresh" />
    <MeasurementsModal ref="measurementsModalRef" @saved="refresh" />
    <AddMeasurementModal ref="addMeasurementModalRef" @saved="refresh" />
    <ConfirmDialog ref="confirmDialog" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useResourcesStore } from '../stores/resourcesStore';
import ResourceForm from '../components/ResourceForm.vue';
import MeasurementsModal from '../components/MeasurementsModal.vue';
import AddMeasurementModal from '../components/AddMeasurementModal.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import { exportToExcel, exportToWord } from '@/utils/exportUtils';

const router = useRouter();
const store = useResourcesStore();

const allColumns = [
  { key: 'name', label: 'Наименование' },
  { key: 'mark', label: 'Марка' },
  { key: 'registrationNumber', label: 'Учётный №' },
  { key: 'initialResource', label: 'Исходный ресурс' },
  { key: 'remainingResource', label: 'Остаточный ресурс' },
  { key: 'nodeName', label: 'Размещение' },
  { key: 'notes', label: 'Примечание' },
];
const selectedColumns = ref(allColumns.map(c => c.key));
const showColumnSettings = ref(false);
const visibleColumns = computed(() => allColumns.filter(c => selectedColumns.value.includes(c.key)));

const filters = ref({ name: '', mark: '', registrationNumber: '', nodeName: '' });
const showFilterPanel = ref(false);
const sortField = ref('name');
const sortOrder = ref<'asc' | 'desc'>('asc');
const dropdownOpen = ref(false);

const canEdit = computed(() => {
  const user = localStorage.getItem('user');
  if (!user) return false;
  const role = JSON.parse(user).role;
  return role === 'operator' || role === 'admin';
});

// Глобальные предупреждения
const globalAlerts = computed(() => {
  const alerts: { type: string; message: string }[] = [];
  for (const res of store.resources) {
    if (res.isDeleted) continue;
    if (res.timeToService !== undefined && res.timeToService < 0) {
      alerts.push({ type: 'danger', message: `${res.name}: срок до ТО просрочен!` });
    } else if (res.timeToService !== undefined && res.timeToService < 1) {
      alerts.push({ type: 'warning', message: `${res.name}: срок до ТО менее года (${res.timeToService} лет)` });
    }
    if (res.serviceLife) {
      const yearsPassed = new Date().getFullYear() - new Date(res.registrationDate).getFullYear();
      const remaining = res.serviceLife - yearsPassed;
      if (remaining < 0) {
        alerts.push({ type: 'danger', message: `${res.name}: срок службы истёк!` });
      } else if (remaining < 1) {
        alerts.push({ type: 'warning', message: `${res.name}: срок службы истекает (осталось ${remaining} лет)` });
      }
    }
    const remainingPercent = parseFloat(res.remainingResource || '0');
    if (remainingPercent <= 0) {
      alerts.push({ type: 'danger', message: `${res.name}: ресурс исчерпан!` });
    } else if (remainingPercent < 20) {
      alerts.push({ type: 'warning', message: `${res.name}: остаточный ресурс менее 20% (${remainingPercent}%)` });
    }
  }
  return alerts;
});

const filteredResources = computed(() => {
  let list = [...store.resources];
  const f = filters.value;
  if (f.name) list = list.filter(r => r.name.toLowerCase().includes(f.name.toLowerCase()));
  if (f.mark) list = list.filter(r => (r.mark || '').toLowerCase().includes(f.mark.toLowerCase()));
  if (f.registrationNumber) list = list.filter(r => String(r.registrationNumber || '').includes(f.registrationNumber));
  if (f.nodeName) list = list.filter(r => (r.nodeName || '').toLowerCase().includes(f.nodeName.toLowerCase()));
  return list;
});

const sortedResources = computed(() => {
  const list = [...filteredResources.value];
  // Сначала активные, потом списанные
  list.sort((a, b) => {
    if (a.isDeleted !== b.isDeleted) {
      return a.isDeleted ? 1 : -1;
    }
    let valA = a[sortField.value] || '';
    let valB = b[sortField.value] || '';
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();
    if (valA < valB) return sortOrder.value === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder.value === 'asc' ? 1 : -1;
    return 0;
  });
  return list;
});

function formatCell(res: any, key: string) {
  if (key === 'notes') return res.notes || '-';
  const value = res[key];
  return value === undefined || value === null ? '-' : value;
}

function getRowClass(res: any): string {
  if (res.isDeleted) return 'disabled-row';
  if (res.timeToService && res.timeToService < 0) return 'expired-row';
  if (res.timeToService && res.timeToService < 1) return 'warning-row';
  if (res.remainingResource && parseFloat(res.remainingResource) < 20) return 'warning-row';
  if (res.remainingResource && parseFloat(res.remainingResource) <= 0) return 'expired-row';
  return '';
}

function sortBy(field: string) {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortField.value = field;
    sortOrder.value = 'asc';
  }
}

function applyFilters() {}
function resetFilters() {
  filters.value = { name: '', mark: '', registrationNumber: '', nodeName: '' };
}
function viewCard(id: number) { router.push(`/resources/${id}`); }
function openAddForm() { formRef.value?.open(); }
function editResource(res: any) { formRef.value?.open(res); }
async function deleteResource(id: number) {
  const ok = await confirmDialog.value?.show('Списание', 'Списать ресурс?');
  if (ok) store.deleteResource(id);
}
function refresh() {}

function getExportData() {
  return sortedResources.value.map(res => ({
    'Наименование': res.name,
    'Марка': res.mark || '-',
    'Учётный №': res.registrationNumber || '-',
    'Исходный ресурс': res.initialResource || '-',
    'Остаточный ресурс': res.remainingResource || '-',
    'Размещение': res.nodeName || '-',
    'Примечание': res.notes || '-',
  }));
}

function exportToExcelFile() {
  const data = getExportData();
  if (data.length === 0) { alert('Нет данных для экспорта'); return; }
  const filename = `Ресурсы_${new Date().toISOString().slice(0, 10)}`;
  exportToExcel(data, filename);
  dropdownOpen.value = false;
}

function exportToWordFile() {
  const data = getExportData();
  if (data.length === 0) { alert('Нет данных для экспорта'); return; }
  const headers = Object.keys(data[0]);
  const filename = `Ресурсы_${new Date().toISOString().slice(0, 10)}`;
  exportToWord(data, headers, filename);
  dropdownOpen.value = false;
}

function openMeasurementsModal() { measurementsModalRef.value?.open(); }
function openAddMeasurementModal() { addMeasurementModalRef.value?.open(); }
function toggleDropdown() { dropdownOpen.value = !dropdownOpen.value; }

const formRef = ref();
const measurementsModalRef = ref();
const addMeasurementModalRef = ref();
const confirmDialog = ref();
</script>

<style scoped>
.resources-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
}
.top-buttons,
.bottom-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.btn-uniform {
  padding: 8px 16px;
  font-size: 14px;
  min-width: 160px;
  text-align: center;
}
.dropdown {
  position: relative;
}
.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  background: white;
  border: 1px solid #e0e4e8;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
.dropdown-item:hover {
  background-color: #f0f2f5;
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
}
.filter-row .form-control {
  width: auto;
  min-width: 150px;
}
.alerts-section {
  background-color: #fff3e0;
  border-left: 4px solid #e67e22;
  padding: 12px;
  margin-bottom: 20px;
  border-radius: 4px;
}
.alerts-section .danger {
  color: #c0392b;
}
.warning-row {
  background-color: #fff3e0;
}
.expired-row {
  background-color: #ffe0e0;
}
.disabled-row {
  background-color: #f0f0f0;
  color: #999;
  opacity: 0.7;
}
.disabled-row:hover {
  background-color: #e8e8e8;
}
.badge-disabled {
  display: inline-block;
  padding: 4px 8px;
  background-color: #e9ecef;
  color: #6c757d;
  border-radius: 4px;
  font-size: 12px;
}
.actions-cell {
  white-space: nowrap;
}
.actions-cell .btn {
  margin-right: 4px;
}
</style>