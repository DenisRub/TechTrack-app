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
        <option value="в ремонте">В ремонте</option>
        <option value="выведено">Выведено</option>
      </select>
      <button class="btn btn-secondary" @click="resetFilters">Сбросить</button>
    </div>

    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th @click="sort('id')">№ п/п</th>
            <th @click="sort('tabNumber')">Табельный номер</th>
            <th @click="sort('name')">Наименование</th>
            <th @click="sort('location')">Местоположение</th>
            <th @click="sort('lastVerificationDate')">Последняя поверка</th>
            <th @click="sort('nextVerificationDate')">Следующая поверка</th>
            <th @click="sort('status')">Статус</th>
            <th>Действия</th>
          </tr>
        </thead>

        <tr v-for="si in sortedList" :key="si.id" :class="getRowClass(si)" :title="getTooltip(si)">
          <td>{{ si.id }}</td>
          <td>{{ si.tabNumber }}</td>
          <td>{{ si.name }}</td>
          <td>{{ si.location || '-' }}</td>
          <td>
            {{ getLastVerificationDate(si.id) ? formatDate(getLastVerificationDate(si.id)) : '-' }}
          </td>
          <td>
            {{ getNextVerificationDate(si.id) ? formatDate(getNextVerificationDate(si.id)) : '-' }}
          </td>
          <td>{{ si.status }}</td>
          <td class="actions-cell">
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

        <tr v-if="sortedList.length === 0">
          <td colspan="8" style="text-align: center">Нет данных</td>
        </tr>
      </table>
    </div>

    <SIForm ref="siFormRef" @si-saved="refresh" />
    <VerificationForm ref="verFormRef" @verification-saved="refresh" />
    <ExportDialog ref="exportDialogRef" :data="sortedList" />
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

type SortableKey =
  | 'id'
  | 'tabNumber'
  | 'name'
  | 'location'
  | 'status'
  | 'lastVerificationDate'
  | 'nextVerificationDate'

const siFormRef = ref<InstanceType<typeof SIForm>>()
const verFormRef = ref<InstanceType<typeof VerificationForm>>()
const exportDialogRef = ref<InstanceType<typeof ExportDialog>>()
const confirmDialog = ref<InstanceType<typeof ConfirmDialog>>()

const filters = ref<FilterParams>({ search: '', status: '' })
let searchTimer: ReturnType<typeof setTimeout> | null = null
const sortField = ref<SortableKey>('tabNumber')
const sortDir = ref<'asc' | 'desc'>('asc')

const canEdit = computed(() => {
  const user = localStorage.getItem('user')
  if (!user) return false
  const role = JSON.parse(user).role
  return role === 'operator' || role === 'admin'
})

function getLastVerificationDate(id: number): string {
  return store.getLastVerificationDate(id)
}

function getNextVerificationDate(id: number): string {
  return store.getNextVerificationDate(id)
}

function getDaysLeft(si: MeasuringInstrument): number {
  if (si.status === 'выведено') return Infinity
  const nextDate = getNextVerificationDate(si.id)
  if (!nextDate) return Infinity
  const days = getDaysUntilVerification(nextDate)
  return days
}

function getPriority(si: MeasuringInstrument): number {
  if (si.status === 'выведено') return 3
  const daysLeft = getDaysLeft(si)
  if (daysLeft < 0) return 0
  if (daysLeft <= 30) return 1
  return 2
}

const sortedList = computed(() => {
  let list = [...store.instruments]

  list.sort((a, b) => {
    const priorityA = getPriority(a)
    const priorityB = getPriority(b)
    if (priorityA !== priorityB) {
      return priorityA - priorityB
    }

    const field = sortField.value
    let valA: string | number = ''
    let valB: string | number = ''

    if (field === 'id') {
      valA = a.id
      valB = b.id
    } else if (field === 'tabNumber') {
      valA = a.tabNumber || ''
      valB = b.tabNumber || ''
    } else if (field === 'name') {
      valA = a.name || ''
      valB = b.name || ''
    } else if (field === 'location') {
      valA = a.location || ''
      valB = b.location || ''
    } else if (field === 'status') {
      valA = a.status || ''
      valB = b.status || ''
    } else if (field === 'lastVerificationDate') {
      valA = getLastVerificationDate(a.id) || ''
      valB = getLastVerificationDate(b.id) || ''
    } else if (field === 'nextVerificationDate') {
      valA = getNextVerificationDate(a.id) || ''
      valB = getNextVerificationDate(b.id) || ''
    }

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

function sort(field: SortableKey) {
  if (sortField.value === field) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDir.value = 'asc'
  }
}

function applyFilters() {
  store.setFilterParams({
    search: filters.value.search,
    status: filters.value.status as InstrumentStatus | '',
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
  filters.value = { search: '', status: '' }
  if (searchTimer) {
    clearTimeout(searchTimer)
    searchTimer = null
  }
  applyFilters()
}

function getRowClass(si: MeasuringInstrument): string {
  if (si.status === 'выведено') return 'disabled-row'
  const days = getDaysLeft(si)
  if (days < 0) return 'expired-row'
  if (days <= 30) return 'warning-row'
  return ''
}

function getDaysWord(days: number): string {
  const lastDigit = days % 10
  const lastTwoDigits = days % 100
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return 'дней'
  if (lastDigit === 1) return 'день'
  if (lastDigit >= 2 && lastDigit <= 4) return 'дня'
  return 'дней'
}

function getTooltip(si: MeasuringInstrument): string {
  if (si.status === 'выведено') {
    return 'Прибор списан, не используется'
  }
  const days = getDaysLeft(si)
  const nextDate = getNextVerificationDate(si.id)
  if (!nextDate) {
    return 'Поверки ещё не проводились'
  }
  if (days < 0) {
    const overdueDays = Math.abs(days)
    return `Поверка просрочена на ${overdueDays} ${getDaysWord(overdueDays)}! Необходимо срочно отправить на поверку!`
  }
  if (days <= 30) {
    return `До окончания срока поверки осталось ${days} ${getDaysWord(days)}. Рекомендуется запланировать поверку.`
  }
  return `Следующая поверка через ${days} ${getDaysWord(days)}`
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
    'Списание средства измерения',
    'Вы уверены, что хотите списать это средство измерения?\n\nПосле списания прибор будет перемещён в конец списка и исключён из активных операций.',
  )
  if (ok) {
    store.writeOffInstrument(id)
  }
}

function refresh() {
  applyFilters()
}

function openExportDialog() {
  const enrichedData = sortedList.value.map((si) => ({
    ...si,
    lastVerificationDate: getLastVerificationDate(si.id),
    nextVerificationDate: getNextVerificationDate(si.id),
  }))
  exportDialogRef.value?.open(enrichedData)
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
.warning-row {
  background-color: #fff3e0;
}
.warning-row:hover {
  background-color: #ffe8c7;
}
.expired-row {
  background-color: #ffe0e0;
}
.expired-row:hover {
  background-color: #ffd0d0;
}
.disabled-row {
  background-color: #f0f0f0;
  color: #999;
  opacity: 0.7;
}
.disabled-row:hover {
  background-color: #e8e8e8;
}
</style>
