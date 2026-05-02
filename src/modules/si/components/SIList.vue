<template>
  <div class="card">
    <div style="display: flex; justify-content: space-between; margin-bottom: 20px">
      <h2>Средства измерения</h2>
      <div class="action-buttons">
        <button v-if="canEdit" class="btn btn-primary btn-fixed" @click="openAddForm">
          + Добавить СИ
        </button>
        <button class="btn btn-secondary btn-fixed" @click="openExportDialog">📎 Экспорт</button>
      </div>
    </div>

    <!-- Панель фильтров -->
    <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px">
      <input
        v-model="filters.search"
        type="text"
        placeholder="Поиск по номеру/наименованию"
        class="form-control"
        style="width: 250px"
        @input="onSearchInput"
      />
      <select
        v-model="filters.status"
        class="form-control"
        style="width: 150px"
        @change="applyFilters"
      >
        <option value="">Все статусы</option>
        <option value="в эксплуатации">В эксплуатации</option>
        <option value="на поверке">На поверке</option>
        <option value="выведено">Выведено</option>
      </select>
      <select
        v-model="filters.verifier"
        class="form-control"
        style="width: 180px"
        @change="applyFilters"
      >
        <option value="">Все поверители</option>
        <option value="Самарский ЦСМ">Самарский ЦСМ</option>
        <option value="Саратовский ЦСМ">Саратовский ЦСМ</option>
      </select>
      <button class="btn btn-secondary" @click="resetFilters">Сбросить</button>
    </div>

    <!-- Таблица -->
    <table class="data-table">
      <thead>
        <tr>
          <th @click="sort('tabulNumber')">№ п/п</th>
          <th @click="sort('name')">Наименование</th>
          <th @click="sort('location')">Местоположение</th>
          <th @click="sort('lastVerificationDate')">Последняя поверка</th>
          <th @click="sort('nextVerificationDate')">Следующая поверка</th>
          <th @click="sort('status')">Статус</th>
          <th @click="sort('verifier')">Поверитель</th>
          <th>Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="si in sortedAndPriorityList"
          :key="si.id"
          :class="getRowClass(si)"
          :title="getTooltip(si)"
        >
          <td>{{ si.tabulNumber }}</td>
          <td>{{ si.name }}</td>
          <td>{{ si.location }}</td>
          <td>{{ formatDate(si.lastVerificationDate) }}</td>
          <td>{{ formatDate(si.nextVerificationDate) }}</td>
          <td :class="{ 'status-disabled': si.status === 'выведено' }">
            {{ si.status }}
          </td>
          <td>{{ si.verifier || '-' }}</td>
          <td>
            <button class="btn btn-sm btn-secondary" @click="viewCard(si.id)">Просмотр</button>
            <button
              v-if="canEdit && si.status !== 'выведено'"
              class="btn btn-sm btn-secondary"
              @click="editSI(si)"
            >
              ✏️
            </button>
            <button
              v-if="canEdit && si.status !== 'выведено'"
              class="btn btn-sm btn-danger"
              @click="writeOffSI(si.id)"
            >
              📝 Списать
            </button>
            <span v-if="si.status === 'выведено'" class="badge-disabled">Списан</span>
          </td>
        </tr>
        <tr v-if="sortedAndPriorityList.length === 0">
          <td colspan="8" style="text-align: center">Нет данных</td>
        </tr>
      </tbody>
    </table>

    <!-- Модальные окна -->
    <SIForm ref="siFormRef" @si-saved="refresh" />
    <VerificationForm ref="verFormRef" @verification-saved="refresh" />
    <ExportDialog ref="exportDialogRef" :data="sortedAndPriorityList" />
    <ConfirmDialog ref="confirmDialog" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSIStore } from '../stores/siStore'
import type { MeasuringInstrument, InstrumentStatus, FilterParams } from '../types/siTypes'
import SIForm from './SIForm.vue'
import VerificationForm from './VerificationForm.vue'
import ExportDialog from './ExportDialog.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { formatDate, getDaysUntilVerification } from '@/utils/dateUtils'

const router = useRouter()
const store = useSIStore()

type SortableKey = keyof Pick<
  MeasuringInstrument,
  | 'tabulNumber'
  | 'name'
  | 'location'
  | 'lastVerificationDate'
  | 'nextVerificationDate'
  | 'status'
  | 'verifier'
>

const siFormRef = ref<InstanceType<typeof SIForm>>()
const verFormRef = ref<InstanceType<typeof VerificationForm>>()
const exportDialogRef = ref<InstanceType<typeof ExportDialog>>()
const confirmDialog = ref<InstanceType<typeof ConfirmDialog>>()

const filters = ref<FilterParams>({
  search: '',
  status: '',
  verifier: '',
})

let searchTimer: ReturnType<typeof setTimeout> | null = null

const sortField = ref<SortableKey>('tabulNumber')
const sortDir = ref<'asc' | 'desc'>('asc')

const canEdit = computed(() => {
  const user = localStorage.getItem('user')
  if (!user) return false
  const role = JSON.parse(user).role
  return role === 'operator' || role === 'admin'
})

// Функция для получения количества дней до поверки
function getDaysLeft(si: MeasuringInstrument): number {
  if (si.status === 'выведено') return Infinity
  const days = getDaysUntilVerification(si.nextVerificationDate)
  return days
}

// Функция для определения приоритета сортировки
function getPriority(si: MeasuringInstrument): number {
  // Приоритет 0: критичные (менее 30 дней)
  // Приоритет 1: нормальные (больше 30 дней)
  // Приоритет 2: списанные
  if (si.status === 'выведено') return 2
  const daysLeft = getDaysLeft(si)
  if (daysLeft <= 30) return 0
  return 1
}

// Сортировка с приоритетами: критичные → нормальные → списанные
const sortedAndPriorityList = computed(() => {
  let list = [...store.instruments]

  // Сначала сортируем по приоритету
  list.sort((a, b) => {
    const priorityA = getPriority(a)
    const priorityB = getPriority(b)
    if (priorityA !== priorityB) {
      return priorityA - priorityB
    }

    // Внутри одной группы сортируем по убыванию критичности (чем меньше дней, тем выше)
    if (priorityA === 0) {
      const daysA = getDaysLeft(a)
      const daysB = getDaysLeft(b)
      return daysA - daysB
    }

    // Для нормальных и списанных — по выбранному полю
    const field = sortField.value
    let valA = a[field]
    let valB = b[field]

    if (valA === undefined || valA === null) valA = ''
    if (valB === undefined || valB === null) valB = ''

    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortDir.value === 'asc' ? valA - valB : valB - valA
    }

    const strA = String(valA).toLowerCase()
    const strB = String(valB).toLowerCase()
    if (strA < strB) return sortDir.value === 'asc' ? -1 : 1
    if (strA > strB) return sortDir.value === 'asc' ? 1 : -1
    return 0
  })

  return list
})

// Функция для получения класса строки
function getRowClass(si: MeasuringInstrument): string {
  if (si.status === 'выведено') return 'disabled-row'
  const daysLeft = getDaysLeft(si)
  if (daysLeft <= 30 && daysLeft >= 0) return 'warning-row'
  if (daysLeft < 0) return 'expired-row'
  return ''
}

// Функция для получения всплывающей подсказки
function getTooltip(si: MeasuringInstrument): string {
  if (si.status === 'выведено') {
    return 'Прибор списан, не используется'
  }
  const daysLeft = getDaysLeft(si)
  if (daysLeft < 0) {
    const overdueDays = Math.abs(daysLeft)
    return `Поверка просрочена на ${overdueDays} ${getDaysWord(overdueDays)}! Необходимо срочно отправить на поверку!`
  }
  if (daysLeft <= 30) {
    return `До окончания срока поверки осталось ${daysLeft} ${getDaysWord(daysLeft)}. Рекомендуется запланировать поверку.`
  }
  return `Следующая поверка через ${daysLeft} ${getDaysWord(daysLeft)}`
}

// Склонение слова "день"
function getDaysWord(days: number): string {
  const lastDigit = days % 10
  const lastTwoDigits = days % 100
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return 'дней'
  if (lastDigit === 1) return 'день'
  if (lastDigit >= 2 && lastDigit <= 4) return 'дня'
  return 'дней'
}

// Функция сортировки (используется для пользовательского клика)
function sort(field: SortableKey) {
  if (sortField.value === field) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDir.value = 'asc'
  }
}

// Применение фильтров
function applyFilters() {
  store.setFilterParams({
    search: filters.value.search,
    status: filters.value.status as InstrumentStatus | '',
    verifier: filters.value.verifier,
  })
}

function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer)
  const searchText = filters.value.search
  if (!searchText || searchText.length < 2) {
    applyFilters()
    return
  }
  searchTimer = setTimeout(() => {
    applyFilters()
    searchTimer = null
  }, 300)
}

function resetFilters() {
  filters.value = { search: '', status: '', verifier: '' }
  if (searchTimer) {
    clearTimeout(searchTimer)
    searchTimer = null
  }
  applyFilters()
}

function viewCard(id: number) {
  router.push(`/si/${id}`)
}

function openAddForm() {
  siFormRef.value?.open()
}

function editSI(si: MeasuringInstrument) {
  siFormRef.value?.open(si)
}

async function writeOffSI(id: number) {
  const ok = await confirmDialog.value?.show(
    'Списание',
    'Вы уверены, что хотите списать это средство измерения?',
  )
  if (ok) {
    store.writeOffInstrument(id)
  }
}

function refresh() {
  applyFilters()
}

function openExportDialog() {
  exportDialogRef.value?.open(sortedAndPriorityList.value)
}

onMounted(() => {
  applyFilters()
})
</script>

<style scoped>
.action-buttons {
  display: flex;
  gap: 10px;
}

.btn-fixed {
  min-width: 140px;
  text-align: center;
}

.status-disabled {
  color: #999;
  font-style: italic;
}

.badge-disabled {
  display: inline-block;
  padding: 4px 8px;
  background-color: #e9ecef;
  color: #6c757d;
  border-radius: 4px;
  font-size: 12px;
}

/* Строка с предупреждением (менее 30 дней) */
.warning-row {
  background-color: #fff3e0;
}

.warning-row:hover {
  background-color: #ffe8c7;
}

/* Строка с просроченной поверкой */
.expired-row {
  background-color: #ffe0e0;
}

.expired-row:hover {
  background-color: #ffd0d0;
}

/* Строка со списанным прибором */
.disabled-row {
  background-color: #f0f0f0;
  color: #999;
  opacity: 0.7;
}

.disabled-row:hover {
  background-color: #e8e8e8;
}
</style>
