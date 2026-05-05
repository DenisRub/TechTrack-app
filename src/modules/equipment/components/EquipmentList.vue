<template>
  <div class="card">
    <div style="display: flex; justify-content: space-between; margin-bottom: 20px">
      <h2>Оборудование</h2>
      <div class="action-buttons">
        <button v-if="canEdit" class="btn btn-primary" @click="openForm">+ Добавить</button>
        <button class="btn btn-secondary" @click="exportToExcelFile">📎 Excel</button>
        <button class="btn btn-secondary" @click="exportToWordFile">📄 Word</button>
        <button class="btn btn-secondary" @click="showColumnSettings = true">⚙️ Колонки</button>
        <button class="btn btn-secondary" @click="openAdvancedFilter">🔍 Расш. фильтр</button>
      </div>
    </div>

    <!-- Панель быстрых фильтров -->
    <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px">
      <input
        v-model="quickFilters.search"
        type="text"
        placeholder="Поиск по наименованию"
        class="form-control"
        style="width: 250px"
        @input="applyQuickFilters"
      />
      <select v-model="quickFilters.type" class="form-control" style="width: 150px" @change="applyQuickFilters">
        <option value="">Все типы</option>
        <option value="aggregate">Агрегаты</option>
        <option value="block">Блоки</option>
      </select>
      <button class="btn btn-secondary" @click="resetFilters">Сбросить</button>
    </div>

    <!-- Таблица с динамическими колонками -->
    <table class="data-table">
      <thead>
        <tr>
          <th v-for="col in visibleCols" :key="col.key" @click="handleSort(col.key, $event)">
            {{ col.label }}
            <span v-if="getSortIcon(col.key)">{{ getSortIcon(col.key) }}</span>
          </th>
          <th>Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="node in filteredAndSortedNodes" :key="node.id">
          <td v-for="col in visibleCols" :key="col.key">{{ formatCell(node, col.key) }}</td>
          <td>
            <button class="btn btn-sm btn-secondary" @click="viewCard(node.id)">Просмотр</button>
            <button v-if="canEdit" class="btn btn-sm btn-secondary" @click="editNode(node)">✏️</button>
            <button v-if="canEdit" class="btn btn-sm btn-danger" @click="deleteNode(node.id)">Списать</button>
          </td>
        </tr>
        <tr v-if="filteredAndSortedNodes.length === 0">
          <td :colspan="visibleCols.length + 1">Нет данных</td>
        </tr>
      </tbody>
    </table>

    <!-- Модальное окно настройки колонок -->
    <div class="modal-overlay" v-if="showColumnSettings">
      <div class="modal-content">
        <div class="modal-header">Настройка колонок</div>
        <div v-for="col in allColumns" :key="col.key" style="margin-bottom: 8px;">
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
    <EquipmentForm ref="formRef" @saved="refresh" />
    <ConfirmDialog ref="confirmDialog" />
    <AdvancedFilter ref="advancedFilterRef" @apply="applyAdvancedFilters" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useEquipmentStore } from '../stores/equipmentStore';
import EquipmentForm from './EquipmentForm.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import AdvancedFilter from './AdvancedFilter.vue';
import { exportToExcel, exportToWord } from '@/utils/exportUtils';
import type { EquipmentNode } from '../types/equipmentTypes';

type SortableKey = keyof Pick<EquipmentNode, 'id' | 'name' | 'type' | 'location' | 'createdAt' | 'updatedAt'>;

const router = useRouter();
const store = useEquipmentStore();
const formRef = ref();
const confirmDialog = ref();
const advancedFilterRef = ref();


// ---------- Быстрые фильтры (поиск, тип) ----------
const quickFilters = ref({ search: '', type: '' });
function applyQuickFilters() {
  // Передаём в store для первичной фильтрации
  store.setFilterParams(quickFilters.value);
}
function resetFilters() {
  quickFilters.value = { search: '', type: '' };
  advancedConditions.value = [];
  applyQuickFilters();
}


// ---------- Расширенный фильтр (условия) ----------
const advancedConditions = ref<any[]>([]);
function openAdvancedFilter() { advancedFilterRef.value?.open(); }
function applyAdvancedFilters(conditions: any[]) {
  advancedConditions.value = conditions;
}

// ---------- Сортировка по нескольким полям ----------
const sortStack = ref<{ field: SortableKey; order: 'asc' | 'desc' }[]>([{ field: 'id', order: 'asc' }]);

function handleSort(field: string, event: MouseEvent) {
  const fieldKey = field as SortableKey;
  if (event.shiftKey) {
    // Добавляем поле в сортировку
    const existing = sortStack.value.find(s => s.field === fieldKey);
    if (existing) {
      existing.order = existing.order === 'asc' ? 'desc' : 'asc';
    } else {
      sortStack.value.push({ field: fieldKey, order: 'asc' });
    }
  } else {
    // Одиночная сортировка – заменяем стек
    const existing = sortStack.value.find(s => s.field === fieldKey);
    if (existing && sortStack.value.length === 1) {
      existing.order = existing.order === 'asc' ? 'desc' : 'asc';
    } else {
      sortStack.value = [{ field: fieldKey, order: 'asc' }];
    }
  }
}
function getSortIcon(field: string): string {
  const entry = sortStack.value.find(s => s.field === field);
  if (!entry) return '';
  return entry.order === 'asc' ? '↑' : '↓';
}

// ---------- Основная логика фильтрации и сортировки ----------
const filteredAndSortedNodes = computed(() => {
  // Берём из store уже отфильтрованный по быстрым фильтрам список
  let list = [...store.nodes];

  // Применяем расширенные условия
  if (advancedConditions.value.length) {
    list = list.filter(node => {
      return advancedConditions.value.every(cond => {
        const val = (node as any)[cond.field];
        if (val === undefined || val === null) return false;
        switch (cond.operator) {
          case 'eq': return String(val).toLowerCase() === cond.value.toLowerCase();
          case 'contains': return String(val).toLowerCase().includes(cond.value.toLowerCase());
          case 'gt': return Number(val) > Number(cond.value);
          case 'lt': return Number(val) < Number(cond.value);
          default: return true;
        }
      });
    });
  }

  // Множественная сортировка
  if (sortStack.value.length) {
    list.sort((a, b) => {
      for (const sort of sortStack.value) {
        let valA: any = a[sort.field];
        let valB: any = b[sort.field];
        if (valA === undefined || valA === null) valA = '';
        if (valB === undefined || valB === null) valB = '';
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

// ---------- Остальные методы ----------
function formatCell(node: EquipmentNode, key: string) {
  if (key === 'type') return node.type === 'aggregate' ? 'Агрегат' : 'Блок';
  if (key === 'isSI') return node.isSI ? 'да' : 'нет';
  const val = (node as any)[key];
  return val ?? '-';
}
const canEdit = computed(() => {
  const user = localStorage.getItem('user');
  if (!user) return false;
  try {
    const role = JSON.parse(user).role;
    return role === 'operator' || role === 'admin';
  } catch {
    return false;
  }
});

function openForm() { formRef.value?.open(); }
function editNode(node: EquipmentNode) { formRef.value?.open(node); }
async function deleteNode(id: number) {
  const ok = await confirmDialog.value?.show('Списание', 'Списать узел?');
  if (ok) store.deleteNode(id);
}
function viewCard(id: number) { router.push(`/equipment/${id}`); }
function refresh() { applyQuickFilters(); }

// ---------- Экспорт ----------
function getExportData() {
  return store.nodes.map(n => ({
    'Подсистема': n.subsystem || '',
    'Наименование': n.name,
    'Тип': n.type === 'aggregate' ? 'Агрегат' : 'Блок',
    'Производитель': n.manufacturer || '',
    'Марка': n.model || '',
    'Зав. №': n.serialNumber || '',
    'Инв. №': n.inventoryNumber || '',
    'СИ': n.isSI ? 'да' : 'нет',
    'Состояние': n.condition || '',
    'Ресурс': n.resource || '',
    'Размещение': n.location || '',
    'Примечание': n.note || '',
  }));
}
function exportToExcelFile() {
  const data = getExportData();
  const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0');
const day = String(now.getDate()).padStart(2, '0');
const hours = String(now.getHours()).padStart(2, '0');
const minutes = String(now.getMinutes()).padStart(2, '0');
const seconds = String(now.getSeconds()).padStart(2, '0');
const filename = `Оборудование_${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
  exportToExcel(data, filename);
}
function exportToWordFile() {
  const data = getExportData();
  const headers = Object.keys(data[0] || {});
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const filename = `Оборудование_${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
  exportToWord(data, headers, filename);
}

// ---------- Настройка колонок ----------
const allColumns = [
  { key: 'subsystem', label: 'Подсистема' },
  { key: 'name', label: 'Наименование' },
  { key: 'type', label: 'Тип' },
  { key: 'manufacturer', label: 'Производитель' },
  { key: 'model', label: 'Марка' },
  { key: 'serialNumber', label: 'Зав. №' },
  { key: 'inventoryNumber', label: 'Инв. №' },
  { key: 'isSI', label: 'СИ' },
  { key: 'condition', label: 'Состояние' },
  { key: 'resource', label: 'Ресурс' },
  { key: 'location', label: 'Размещение' },
  { key: 'note', label: 'Примечание' },
];
const selectedColumns = ref(['subsystem', 'name', 'type', 'manufacturer', 'model', 'serialNumber', 'inventoryNumber', 'condition', 'location']);const showColumnSettings = ref(false);
const visibleCols = computed(() => allColumns.filter(c => selectedColumns.value.includes(c.key)));

// Инициализация
applyQuickFilters();
</script>

<style scoped>
.action-buttons {
  display: flex;
  gap: 8px;
}
</style>