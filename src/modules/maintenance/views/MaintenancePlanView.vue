<template>
  <div class="card" v-if="plan">
    <div style="display: flex; justify-content: space-between; margin-bottom: 20px">
      <h2>{{ plan.name }}</h2>
      <div>
        <button class="btn btn-secondary" @click="goBack">← Назад</button>
      </div>
    </div>

    <div class="plan-info">
      <p><strong>Период:</strong> {{ formatDate(plan.startDate) }} — {{ formatDate(plan.endDate) }}</p>
      <p v-if="plan.description"><strong>Описание:</strong> {{ plan.description }}</p>
    </div>

    <!-- Поиск и фильтры -->
    <div class="filter-panel">
      <div class="filter-row">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Поиск по всем полям..."
          class="form-control"
          style="width: 300px"
          @input="applyFilters"
        />
        <select v-model="statusFilter" class="form-control" style="width: 150px" @change="applyFilters">
          <option value="">Все статусы</option>
          <option value="pending">Ожидает</option>
          <option value="in_progress">В работе</option>
          <option value="completed">Выполнено</option>
          <option value="not_completed">Не выполнено</option>
        </select>
        <select v-model="serviceTypeFilter" class="form-control" style="width: 180px" @change="applyFilters">
          <option value="">Все типы ТО</option>
          <option value="плановое ТО">Плановое ТО</option>
          <option value="внеплановое ТО">Внеплановое ТО</option>
          <option value="капитальный ремонт">Капитальный ремонт</option>
          <option value="аварийный ремонт">Аварийный ремонт</option>
        </select>
        <button class="btn btn-secondary" @click="resetFilters">Сбросить</button>
      </div>
    </div>

        <!-- Таблица задач -->
    <table class="data-table">
      <thead>
        <tr>
          <th>№ п/п</th>
          <th @click="sortBy('nodeName')">
            Наименование оборудования
            <span class="sort-icon" v-if="sortField === 'nodeName'">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
          </th>
          <th @click="sortBy('parentName')">
            Местоположение
            <span class="sort-icon" v-if="sortField === 'parentName'">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
          </th>
          <th @click="sortBy('expiryDate')">
            Дата истечения срока ТО
            <span class="sort-icon" v-if="sortField === 'expiryDate'">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
          </th>
          <th @click="sortBy('recommendedDate')">
            Дата проведения ТО
            <span class="sort-icon" v-if="sortField === 'recommendedDate'">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
          </th>
          <th @click="sortBy('serviceType')">
            Тип обслуживания
            <span class="sort-icon" v-if="sortField === 'serviceType'">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
          </th>
          <th @click="sortBy('status')">
            Статус
            <span class="sort-icon" v-if="sortField === 'status'">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
          </th>
          <th>Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(task, index) in filteredAndSortedTasks"
          :key="task.id"
          :class="getRowClass(task)"
        >
          <td>{{ index + 1 }}</td>
          <td>
            <button class="link-btn" @click="goToNode(task.nodeId)">
              {{ task.nodeName }}
            </button>
          </td>
          <td>{{ task.parentName || '-' }}</td>
          <td>
            {{ formatDate(task.expiryDate) }}
            <span v-if="isExpiryNear(task.expiryDate, task.status)" class="warning-badge">Скоро!</span>
            <span v-if="isExpiryOverdue(task.expiryDate, task.status)" class="danger-badge">Просрочено!</span>
          </td>
          <td>
            {{ formatDate(task.recommendedDate) }}
            <span v-if="isDateNear(task.recommendedDate, task.status)" class="warning-badge">Скоро!</span>
          </td>
          <td>{{ task.serviceType }}</td>
          <td>{{ getStatusText(task.status) }}</td>
          <td>
            <button class="btn btn-sm btn-secondary" @click="openEditDateModal(task)">📅 Изменить дату</button>
            <button class="btn btn-sm btn-danger" @click="deleteTask(task.id)">🗑️ Удалить</button>
          </td>
        </tr>
        <tr v-if="filteredAndSortedTasks.length === 0">
          <td colspan="8">Нет данных</td>
        </tr>
      </tbody>
    </table>

    <!-- Кнопки действий -->
    <div class="action-bar">
      <div class="button-group">
        <div class="dropdown">
          <button class="btn btn-secondary" @click="toggleExportDropdown">📎 Экспорт плана</button>
          <div v-if="exportDropdownOpen" class="dropdown-menu">
            <button class="dropdown-item" @click="exportTasksToExcel">Excel</button>
            <button class="dropdown-item" @click="exportTasksToWord">Word</button>
          </div>
        </div>
        <button class="btn btn-secondary" @click="openChartModal">📊 График нагрузки</button>
        <button class="btn btn-primary" @click="openAddTaskForm">+ Добавить задачу</button>
      </div>
    </div>

    <!-- Модальное окно изменения даты -->
    <div class="modal-overlay" v-if="showDateModal">
      <div class="modal-content" style="width: 450px;">
        <div class="modal-header">Изменение даты проведения ТО</div>
        <div class="form-group">
          <label>Оборудование</label>
          <input :value="selectedTask?.nodeName" disabled class="form-control" />
        </div>
        <div class="form-group">
          <label>Дата истечения срока ТО</label>
          <input :value="formatDate(selectedTask?.expiryDate)" disabled class="form-control" />
        </div>
        <div class="form-group">
          <label>Новая дата</label>
          <input type="date" v-model="newDate" class="form-control" :class="{ 'invalid-date': dateError }" />
          <div v-if="dateError" class="error-text">{{ dateError }}</div>
          <div v-if="dateWarning" class="warning-text">{{ dateWarning }}</div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeDateModal">Отмена</button>
          <button class="btn btn-primary" @click="saveTaskDateWithValidation" :disabled="!!dateError">Сохранить</button>
        </div>
      </div>
    </div>

    <MaintenanceTaskForm ref="taskFormRef" @saved="refresh" />
    <ConfirmDialog ref="confirmDialog" />
    <!-- Модальное окно графика -->
    <ChartModal 
      ref="chartModalRef" 
      :plan-name="plan?.name || ''" 
      :plan-period="`${formatDate(plan?.startDate)} — ${formatDate(plan?.endDate)}`" 
      :tasks="filteredAndSortedTasks" />
  </div>
  <div v-else class="card">Загрузка...</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMaintenanceStore } from '../stores/maintenanceStore';
import { useEquipmentStore } from '@/modules/equipment/stores/equipmentStore';
import { useResourcesStore } from '@/modules/resources/stores/resourcesStore';
import { useSIStore } from '@/modules/si/stores/siStore';
import MaintenanceTaskForm from '../components/MaintenanceTaskForm.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import * as exportUtils from '@/utils/exportUtils';
import * as XLSX from 'xlsx';
import ChartModal from '../components/ChartModal.vue';

const route = useRoute();
const router = useRouter();
const maintenanceStore = useMaintenanceStore();
const equipmentStore = useEquipmentStore();
const resourcesStore = useResourcesStore();
const siStore = useSIStore();
const taskFormRef = ref();
const confirmDialog = ref();

const plan = ref<any>(null);
const tasks = ref<any[]>([]);
const searchQuery = ref('');
const statusFilter = ref('');
const serviceTypeFilter = ref('');
const exportDropdownOpen = ref(false);

const sortField = ref<'nodeName' | 'parentName' | 'expiryDate' | 'recommendedDate' | 'serviceType' | 'status'>('recommendedDate');
const sortOrder = ref<'asc' | 'desc'>('asc');

const showDateModal = ref(false);
const selectedTask = ref<any>(null);
const newDate = ref('');
const dateError = ref('');
const dateWarning = ref('');

const chartModalRef = ref();

//для графика:
function openChartModal() {
  chartModalRef.value?.open();
}

// Форматирование даты YYYY-MM-DD
function formatYMD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Получить родительский агрегат для узла
function getParentName(nodeId: number): string {
  const node = equipmentStore.nodes.find((n: any) => n.id === nodeId);
  if (node && node.parentId) {
    const parent = equipmentStore.nodes.find((n: any) => n.id === node.parentId);
    return parent ? parent.name : '-';
  }
  return '-';
}

// Получить дату истечения срока ТО для узла (используя store)
function getExpiryDateFromStore(nodeId: number): string | null {
  return maintenanceStore.getExpiryDate(nodeId);
}

// Рассчитать рекомендуемую дату проведения ТО (на 10 дней раньше даты истечения)
function getRecommendedDate(expiryDate: string | null): string | null {
  if (!expiryDate) return null;
  const date = new Date(expiryDate);
  date.setDate(date.getDate() - 10);
  return formatYMD(date);
}

// Загрузка данных с обогащением
function loadData() {
  const id = Number(route.params.id);
  plan.value = maintenanceStore.allPlans?.find((p: any) => p.id === id);
  if (plan.value) {
    const rawTasks = maintenanceStore.getTasksForPlan(id);
    tasks.value = rawTasks
      .filter((t: any) => {
        const node = equipmentStore.nodes.find((n: any) => n.id === t.nodeId);
        return node && node.type === 'block' && !node.isDeleted;
      })
      .map((t: any) => {
        const expiryDate = getExpiryDateFromStore(t.nodeId);
        return {
          ...t,
          parentName: getParentName(t.nodeId),
          expiryDate: expiryDate,
          recommendedDate: t.recommendedDate || getRecommendedDate(expiryDate) || t.recommendedDate,
        };
      });
  }
}

// ========== Форматирование ==========
function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

function getStatusText(status: string): string {
  const statuses: Record<string, string> = {
    pending: 'Ожидает',
    in_progress: 'В работе',
    completed: 'Выполнено',
    not_completed: 'Не выполнено',
  };
  return statuses[status] || status;
}

// ========== Проверка дат ==========
function isDateNear(dateStr: string, status: string): boolean {
  // Если задача выполнена, не показываем предупреждение
  if (status === 'completed') return false;
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const diff = (target.getTime() - today.getTime()) / (1000 * 3600 * 24);
  return diff <= 30 && diff >= 0;
}

function isExpiryNear(dateStr: string, status: string): boolean {
  return isDateNear(dateStr, status);
}

function isExpiryOverdue(dateStr: string, status: string): boolean {
  // Если задача выполнена, не показываем предупреждение
  if (status === 'completed') return false;
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return target < today;
}

function getRowClass(task: any): string {
  // Если задача выполнена, не подсвечиваем строку
  if (task.status === 'completed') return '';
  if (task.expiryDate && isExpiryOverdue(task.expiryDate, task.status)) {
    return 'overdue-row';
  }
  if (task.expiryDate && isExpiryNear(task.expiryDate, task.status)) {
    return 'warning-row';
  }
  return '';
}

// ========== Валидация даты ==========
function validateDate(newDateStr: string, expiryDateStr: string): boolean {
  dateError.value = '';
  dateWarning.value = '';
  
  if (!newDateStr) {
    dateError.value = 'Дата не может быть пустой';
    return false;
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const newDateObj = new Date(newDateStr);
  newDateObj.setHours(0, 0, 0, 0);
  const expiryDateObj = new Date(expiryDateStr);
  expiryDateObj.setHours(0, 0, 0, 0);
  
  if (newDateObj < today) {
    dateError.value = 'Дата не может быть в прошлом!';
    return false;
  }
  
  if (newDateObj > expiryDateObj) {
    const daysDiff = Math.ceil((newDateObj.getTime() - expiryDateObj.getTime()) / (1000 * 3600 * 24));
    dateWarning.value = `⚠️ Дата проведения ТО на ${daysDiff} дней позже даты истечения срока (${formatDate(expiryDateStr)}). Рекомендуется провести ТО раньше.`;
    return true;
  }
  
  return true;
}

// ========== Модальное окно даты ==========
function openEditDateModal(task: any) {
  selectedTask.value = { ...task };
  newDate.value = task.recommendedDate;
  dateError.value = '';
  dateWarning.value = '';
  showDateModal.value = true;
}

function closeDateModal() {
  showDateModal.value = false;
  selectedTask.value = null;
  newDate.value = '';
  dateError.value = '';
  dateWarning.value = '';
}

function saveTaskDateWithValidation() {
  if (!selectedTask.value) return;
  
  const isValid = validateDate(newDate.value, selectedTask.value.expiryDate);
  if (!isValid) return;
  
  if (dateWarning.value) {
    const confirm = window.confirm(`${dateWarning.value}\n\nВы уверены, что хотите сохранить эту дату?`);
    if (!confirm) return;
  }
  
  maintenanceStore.updateTask(selectedTask.value.id, { recommendedDate: newDate.value });
  
  const taskIndex = tasks.value.findIndex(t => t.id === selectedTask.value.id);
  if (taskIndex !== -1) {
    tasks.value[taskIndex] = {
      ...tasks.value[taskIndex],
      recommendedDate: newDate.value
    };
  }
  
  closeDateModal();
}

// ========== Удаление задачи ==========
async function deleteTask(taskId: number) {
  const ok = await confirmDialog.value?.show('Удаление задачи', 'Вы уверены, что хотите удалить эту задачу из плана ТО?');
  if (ok) {
    maintenanceStore.deleteTask(taskId);
    refresh();
  }
}

// ========== Сортировка ==========
function sortBy(field: string) {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortField.value = field as any;
    sortOrder.value = 'asc';
  }
}

// ========== Фильтрация ==========
const filteredAndSortedTasks = computed(() => {
  let list = [...tasks.value];

  // Глобальный поиск по всем полям
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    list = list.filter(t => {
      // Проверяем все поля задачи
      return (
        (t.nodeName && t.nodeName.toLowerCase().includes(query)) ||
        (t.parentName && t.parentName.toLowerCase().includes(query)) ||
        (t.serviceType && t.serviceType.toLowerCase().includes(query)) ||
        (t.status && getStatusText(t.status).toLowerCase().includes(query)) ||
        (t.expiryDate && formatDate(t.expiryDate).toLowerCase().includes(query)) ||
        (t.recommendedDate && formatDate(t.recommendedDate).toLowerCase().includes(query)) ||
        (t.nodeLocation && t.nodeLocation.toLowerCase().includes(query))
      );
    });
  }
  
  // Фильтр по статусу
  if (statusFilter.value) {
    list = list.filter(t => t.status === statusFilter.value);
  }
  
  // Фильтр по типу обслуживания
  if (serviceTypeFilter.value) {
    list = list.filter(t => t.serviceType === serviceTypeFilter.value);
  }

  // Сортировка
  list.sort((a, b) => {
    let valA = a[sortField.value];
    let valB = b[sortField.value];
    if (valA < valB) return sortOrder.value === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder.value === 'asc' ? 1 : -1;
    return 0;
  });

  return list;
});

function applyFilters() {}
function resetFilters() {
  searchQuery.value = '';
  statusFilter.value = '';
  serviceTypeFilter.value = '';
}

function refresh() {
  loadData();
}

function goBack() {
  router.back();
}

function goToNode(nodeId: number) {
  router.push(`/equipment/${nodeId}`);
}

function openAddTaskForm() {
  console.log('openAddTaskForm вызван');
  if (!plan.value?.id) {
    console.error('plan.id не найден');
    return;
  }
  taskFormRef.value?.open(plan.value.id);
}

// ========== Экспорт ==========
function getTasksExportData() {
  return filteredAndSortedTasks.value.map((t, idx) => ({
    '№ п/п': idx + 1,
    'Наименование оборудования': t.nodeName,
    'Местоположение': t.parentName || '-',
    'Дата истечения срока ТО': formatDate(t.expiryDate),
    'Дата проведения ТО': formatDate(t.recommendedDate),
    'Тип обслуживания': t.serviceType,
    'Статус': getStatusText(t.status),
  }));
}

function exportTasksToExcel() {
  const data = getTasksExportData();
  if (data.length === 0) {
    alert('Нет данных для экспорта');
    return;
  }
  
  // Создаём массив строк для Excel (массив массивов)
  const excelRows = [];
  
  // 1. Строка с названием плана
  excelRows.push([`${plan.value.name}`]);
  
  // 2. Пустая строка для отступа
  excelRows.push([]);
  
  // 3. Заголовки таблицы
  excelRows.push([
    '№ п/п', 
    'Наименование оборудования', 
    'Местоположение', 
    'Дата истечения срока ТО', 
    'Дата проведения ТО', 
    'Тип обслуживания', 
    'Статус'
  ]);
  
  // 4. Данные таблицы
  data.forEach(row => {
    excelRows.push([
      row['№ п/п'],
      row['Наименование оборудования'],
      row['Местоположение'],
      row['Дата истечения срока ТО'],
      row['Дата проведения ТО'],
      row['Тип обслуживания'],
      row['Статус']
    ]);
  });
  
  // Создаём Excel файл
  const ws = XLSX.utils.aoa_to_sheet(excelRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'План ТО');
  
  const filename = `${plan.value.name.replace(/\s/g, '_')}.xlsx`;
  XLSX.writeFile(wb, filename);
  
  exportDropdownOpen.value = false;
}

function exportTasksToWord() {
  const data = getTasksExportData();
  if (data.length === 0) {
    alert('Нет данных для экспорта');
    return;
  }
  const firstItem = data[0];
  if (!firstItem) return;
  const headers = Object.keys(firstItem);
  const filename = `${plan.value.name.replace(/\s/g, '_')}`;
  exportUtils.exportToWord(data, headers, filename);
  exportDropdownOpen.value = false;
}

function toggleExportDropdown() {
  exportDropdownOpen.value = !exportDropdownOpen.value;
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (!target.closest('.dropdown')) {
    exportDropdownOpen.value = false;
  }
}

onMounted(() => {
  loadData();
  document.addEventListener('click', handleClickOutside);
  window.addEventListener('plan-saved', refresh);
  window.addEventListener('task-saved', refresh);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('plan-saved', refresh);
  window.removeEventListener('task-saved', refresh);
});
</script>

<style scoped>
.plan-info {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
}
.plan-info p {
  margin: 4px 0;
}
.action-bar {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
.button-group {
  display: flex;
  gap: 10px;
  position: relative;
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
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  z-index: 100;
  min-width: 150px;
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
  align-items: center;
}
.link-btn {
  background: none;
  border: none;
  color: #2c5f8a;
  cursor: pointer;
  font-size: 15px;
  text-align: left;
}
.link-btn:hover {
  color: #1e4566;
}
.warning-row {
  background-color: #fff3e0;
}
.overdue-row {
  background-color: #ffe0e0;
}
.warning-badge {
  background-color: #e67e22;
  color: white;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 10px;
  margin-left: 8px;
}
.danger-badge {
  background-color: #c0392b;
  color: white;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 10px;
  margin-left: 8px;
}
.invalid-date {
  border-color: #c0392b !important;
  background-color: #ffe0e0;
}
.warning-text {
  color: #e67e22;
  font-size: 12px;
  margin-top: 4px;
  background-color: #fff3e0;
  padding: 6px;
  border-radius: 4px;
}
.error-text {
  color: #c0392b;
  font-size: 12px;
  margin-top: 4px;
}
.sort-icon {
  margin-left: 5px;
  font-size: 12px;
  color: #2c5f8a;
}
.status-not-completed {
  color: #c0392b;
  font-weight: 500;
}
</style>