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

    <!-- Поиск и фильтры для задач -->
    <div class="filter-panel">
      <div class="filter-row">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Поиск по агрегату"
          class="form-control"
          style="width: 250px"
          @input="applyFilters"
        />
        <select v-model="statusFilter" class="form-control" style="width: 150px" @change="applyFilters">
          <option value="">Все статусы</option>
          <option value="pending">Ожидает</option>
          <option value="in_progress">В работе</option>
          <option value="completed">Выполнено</option>
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

    <!-- Таблица агрегатов (задач ТО) -->
    <table class="data-table">
      <thead>
        <tr>
          <th @click="sortBy('nodeName')">Агрегат</th>
          <th @click="sortBy('nodeLocation')">Местоположение</th>
          <th @click="sortBy('recommendedDate')">Рекомендуемая дата ТО</th>
          <th @click="sortBy('serviceType')">Тип обслуживания</th>
          <th @click="sortBy('status')">Статус</th>
          <th>Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="task in filteredAndSortedTasks"
          :key="task.id"
          :class="{ 'warning-row': isDateNear(task.recommendedDate) }"
        >
          <td>
            <button class="link-btn" @click="goToNode(task.nodeId)">
              {{ task.nodeName }}
            </button>
          </td>
          <td>{{ task.nodeLocation || '-' }}</td>
          <td>
            {{ formatDate(task.recommendedDate) }}
            <span v-if="isDateNear(task.recommendedDate)" class="warning-badge">Скоро!</span>
          </td>
          <td>{{ task.serviceType }}</td>
          <td>{{ getStatusText(task.status) }}</td>
          <td>
            <button class="btn btn-sm btn-secondary" @click="openEditDateModal(task)">📅 Изменить дату</button>
          </td>
        </tr>
        <tr v-if="filteredAndSortedTasks.length === 0">
          <td colspan="6">Нет данных</td>
        </tr>
      </tbody>
    </table>

    <!-- Кнопка добавления задачи и экспорта -->
    <div class="action-bar">
      <div class="button-group">
        <div class="dropdown">
          <button class="btn btn-secondary" @click="toggleExportDropdown">📎 Экспорт плана</button>
          <div v-if="exportDropdownOpen" class="dropdown-menu">
            <button class="dropdown-item" @click="exportTasksToExcel">Excel</button>
            <button class="dropdown-item" @click="exportTasksToWord">Word</button>
          </div>
        </div>
        <button class="btn btn-primary" @click="openAddTaskForm">+ Добавить задачу</button>
      </div>
    </div>

    <!-- Модальное окно изменения даты (только одно!) -->
    <div class="modal-overlay" v-if="showDateModal">
      <div class="modal-content" style="width: 450px;">
        <div class="modal-header">Изменение даты ТО</div>
        <div class="form-group">
          <label>Агрегат</label>
          <input :value="selectedTask?.nodeName" disabled class="form-control" />
        </div>
        <div class="form-group">
          <label>Текущая рекомендованная дата</label>
          <input :value="formatDate(selectedTask?.recommendedDate)" disabled class="form-control" />
        </div>
        <div class="form-group">
          <label>Новая дата ТО*</label>
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

    <!-- Модальные окна -->
    <MaintenanceTaskForm ref="taskFormRef" @saved="refresh" />
    <ConfirmDialog ref="confirmDialog" />
  </div>
  <div v-else class="card">Загрузка...</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMaintenanceStore } from '../stores/maintenanceStore';
import MaintenanceTaskForm from './MaintenanceTaskForm.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import * as exportUtils from '@/utils/exportUtils';

const route = useRoute();
const router = useRouter();
const store = useMaintenanceStore();
const taskFormRef = ref();
const confirmDialog = ref();

const plan = ref<any>(null);
const tasks = ref<any[]>([]);
const searchQuery = ref('');
const statusFilter = ref('');
const serviceTypeFilter = ref('');
const exportDropdownOpen = ref(false);

// Сортировка
const sortField = ref<'nodeName' | 'nodeLocation' | 'recommendedDate' | 'serviceType' | 'status'>('recommendedDate');
const sortOrder = ref<'asc' | 'desc'>('asc');

// Модалка изменения даты
const showDateModal = ref(false);
const selectedTask = ref<any>(null);
const newDate = ref('');
const dateError = ref('');
const dateWarning = ref('');

// Валидация даты
function validateDate(newDateStr: string, oldRecommendedDate: string): boolean {
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
  const recommendedDateObj = new Date(oldRecommendedDate);
  recommendedDateObj.setHours(0, 0, 0, 0);
  
  // Проверка: дата не может быть в прошлом
  if (newDateObj < today) {
    dateError.value = 'Дата не может быть в прошлом! Выберите сегодняшнюю или будущую дату.';
    return false;
  }
  
  // Проверка: если дата позже рекомендованной (дедлайна)
  if (newDateObj > recommendedDateObj) {
    const daysDiff = Math.ceil((newDateObj.getTime() - recommendedDateObj.getTime()) / (1000 * 3600 * 24));
    dateWarning.value = `⚠️ Внимание! Вы устанавливаете дату ТО на ${daysDiff} дней позже рекомендованной (${formatDate(oldRecommendedDate)}). Рекомендуется провести ТО вовремя или раньше.`;
    return true;
  }
  
  return true;
}

function openEditDateModal(task: any) {
  selectedTask.value = task;
  newDate.value = task.recommendedDate;
  dateError.value = '';
  dateWarning.value = '';
  showDateModal.value = true;
}

function closeDateModal() {
  showDateModal.value = false;
  selectedTask.value = null;
  dateError.value = '';
  dateWarning.value = '';
}

function saveTaskDateWithValidation() {
  if (!selectedTask.value) return;
  
  // Валидация даты
  const isValid = validateDate(newDate.value, selectedTask.value.recommendedDate);
  if (!isValid) return;
  
  // Если есть предупреждение, показываем подтверждение
  if (dateWarning.value) {
    const confirm = window.confirm(
      `${dateWarning.value}\n\nВы уверены, что хотите сохранить эту дату?`
    );
    if (!confirm) return;
  }
  
  // Сохраняем изменения
  store.updateTask(selectedTask.value.id, { recommendedDate: newDate.value });
  
  // Обновляем список задач
  refresh();
  closeDateModal();
}

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
  };
  return statuses[status] || status;
}

function isDateNear(dateStr: string): boolean {
  const today = new Date();
  const target = new Date(dateStr);
  const diff = (target.getTime() - today.getTime()) / (1000 * 3600 * 24);
  return diff <= 30 && diff >= 0;
}

function sortBy(field: string) {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortField.value = field as any;
    sortOrder.value = 'asc';
  }
}

const filteredAndSortedTasks = computed(() => {
  let list = [...tasks.value];

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(t => t.nodeName.toLowerCase().includes(q));
  }

  if (statusFilter.value) {
    list = list.filter(t => t.status === statusFilter.value);
  }

  if (serviceTypeFilter.value) {
    list = list.filter(t => t.serviceType === serviceTypeFilter.value);
  }

  list.sort((a, b) => {
    let valA = a[sortField.value];
    let valB = b[sortField.value];
    if (valA < valB) return sortOrder.value === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder.value === 'asc' ? 1 : -1;
    return 0;
  });

  return list;
});

function loadData() {
  const id = Number(route.params.id);
  plan.value = store.allPlans.find((p: any) => p.id === id);
  if (plan.value) {
    tasks.value = store.getTasksForPlan(id);
  }
}

function applyFilters() {}

function resetFilters() {
  searchQuery.value = '';
  statusFilter.value = '';
  serviceTypeFilter.value = '';
}

function goBack() {
  router.back();
}

function goToNode(nodeId: number) {
  router.push(`/equipment/${nodeId}`);
}

function openAddTaskForm() {
  taskFormRef.value?.open(plan.value.id);
}

function refresh() {
  loadData();
}

// Экспорт задач
function getTasksExportData() {
  return filteredAndSortedTasks.value.map(t => ({
    'Агрегат': t.nodeName,
    'Местоположение': t.nodeLocation || '-',
    'Рекомендуемая дата ТО': formatDate(t.recommendedDate),
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
  const filename = `${plan.value.name.replace(/\s/g, '_')}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`;
  exportUtils.exportToExcel(data, filename);
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
  const filename = `${plan.value.name.replace(/\s/g, '_')}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`;
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
  text-decoration: underline;
}
.link-btn:hover {
  color: #1e4566;
}
.warning-row {
  background-color: #fff3e0;
}
.warning-badge {
  background-color: #e67e22;
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
</style>