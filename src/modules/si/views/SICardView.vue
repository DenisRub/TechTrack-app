<template>
  <div class="card" v-if="instrument">
    <div style="display: flex; justify-content: space-between; margin-bottom: 20px">
      <h2>Средства измерения</h2>
      <div>
        <!-- Кнопка "Назад" показываем только если не в режиме подсистемы -->
        <button v-if="!isEmbedded" class="btn btn-secondary" @click="goBack">← Назад</button>
        <button v-if="canEdit" class="btn btn-primary" @click="editInstrument">
          Редактировать
        </button>
        <button
          v-if="canEdit && instrument.status !== 'выведено'"
          class="btn btn-danger"
          @click="writeOffInstrument"
        >
          Списать
        </button>
      </div>
    </div>

    <!-- Детальная карточка в 2 колонки -->
    <div class="card-detail-grid">
      <div class="detail-col">
        <div class="detail-row">
          <div class="detail-label">Тип</div>
          <div class="detail-value">{{ instrument.typeName || '-' }}</div>
          <div class="detail-label">Марка</div>
          <div class="detail-value">{{ instrument.model || '-' }}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Производитель</div>
          <div class="detail-value">{{ instrument.manufacturer || '-' }}</div>
          <div class="detail-label">Дата производства</div>
          <div class="detail-value">{{ instrument.productionDate || '-' }}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Узел</div>
          <div class="detail-value">{{ instrument.nodeName || '-' }}</div>
          <div class="detail-label">Статус</div>
          <div
            class="detail-value"
            :class="{ 'status-disabled': instrument.status === 'выведено' }"
          >
            {{ instrument.status || '-' }}
          </div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Размещение</div>
          <div class="detail-value">{{ instrument.location || '-' }}</div>
          <div class="detail-label">Основные параметры</div>
          <div class="detail-value">{{ instrument.mainParams || '-' }}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Дата сдачи в поверку</div>
          <div class="detail-value">{{ formatDate(instrument.transferDate) || '-' }}</div>
          <div class="detail-label">Дата получения из поверки</div>
          <div class="detail-value">{{ formatDate(instrument.receiptDate) || '-' }}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Дата последней поверки</div>
          <div class="detail-value">
            {{ lastVerificationDate ? formatDate(lastVerificationDate) : '-' }}
          </div>
          <div class="detail-label">Дата следующей поверки</div>
          <div class="detail-value">
            <template v-if="nextVerificationDate">
              {{ formatDate(nextVerificationDate) }}
              <span v-if="isWarning && instrument.status !== 'выведено'" class="warning-badge"
                >(менее 30 дней)</span
              >
            </template>
            <template v-else>-</template>
          </div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Межповерочный интервал</div>
          <div class="detail-value">{{ instrument.verificationInterval }} год(а)</div>
          <div class="detail-label">Поверитель</div>
          <div class="detail-value">{{ instrument.verifier || '-' }}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Табельный номер</div>
          <div class="detail-value">{{ instrument.tabNumber || '-' }}</div>
          <div class="detail-label">Примечание</div>
          <div class="detail-value">{{ instrument.notes || '-' }}</div>
        </div>
      </div>
    </div>

    <!-- История поверок -->
    <div style="margin-top: 20px">
      <div
        style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        "
      >
        <h3>История поверок</h3>
        <button
          v-if="canEdit && instrument.status !== 'выведено'"
          class="btn btn-primary btn-sm"
          @click="openAddVerification"
        >
          + Добавить поверку
        </button>
      </div>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Дата передачи</th>
              <th>Дата получения</th>
              <th>Поверитель</th>
              <th>Результат</th>
              <th v-if="canEdit">Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="v in verifications" :key="v.id">
              <td>{{ formatDate(v.transferDate) }}</td>
              <td>{{ formatDate(v.receiptDate) }}</td>
              <td>{{ v.verifier }}</td>
              <td :class="{ 'result-bad': v.result === 'не годен' }">{{ v.result }}</td>
              <td v-if="canEdit">
                <button class="btn btn-sm btn-secondary" @click="editVerification(v)">✏️</button>
              </td>
            </tr>
            <tr v-if="verifications.length === 0">
              <td colspan="5" style="text-align: center">Нет записей о поверках</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <SIForm ref="siFormRef" @si-saved="refresh" />
    <VerificationForm ref="verFormRef" @verification-saved="refresh" />
    <ConfirmDialog ref="confirmDialog" />
  </div>
  <div v-else class="card">
    <p>Загрузка...</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSIStore } from '../stores/siStore'
import type { MeasuringInstrument, Verification } from '../types/siTypes'
import SIForm from '../components/SIForm.vue'
import VerificationForm from '../components/VerificationForm.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { formatDate, getDaysUntilVerification } from '@/utils/dateUtils'

// Пропсы для встраивания в правую панель
const props = defineProps<{
  id?: number // ID для прямой загрузки (без маршрута)
  embedded?: boolean // Режим встраивания (скрывает кнопку "Назад")
}>()

const route = useRoute()
const router = useRouter()
const store = useSIStore()
const siFormRef = ref<InstanceType<typeof SIForm>>()
const verFormRef = ref<InstanceType<typeof VerificationForm>>()
const confirmDialog = ref<InstanceType<typeof ConfirmDialog>>()

const instrument = ref<MeasuringInstrument | null>(null)
const verifications = ref<Verification[]>([])
const lastVerificationDate = ref('')
const nextVerificationDate = ref('')

// Режим встраивания (если передан пропс embedded, то не показываем кнопку "Назад")
const isEmbedded = computed(() => props.embedded === true)

const canEdit = computed(() => {
  const user = localStorage.getItem('user')
  if (!user) return false
  const role = JSON.parse(user).role
  return role === 'operator' || role === 'admin'
})

const isWarning = computed(() => {
  if (!instrument.value || instrument.value.status === 'выведено') return false
  if (!nextVerificationDate.value) return false
  const days = getDaysUntilVerification(nextVerificationDate.value)
  return days <= 30 && days >= 0
})

function loadData() {
  // Определяем ID: из пропса или из маршрута
  const id = props.id || Number(route.params.id)
  if (!id) return

  instrument.value = store.allInstruments.find((s: MeasuringInstrument) => s.id === id) || null
  if (instrument.value) {
    verifications.value = store.getVerificationsForSI(id)
    lastVerificationDate.value = store.getLastVerificationDate(id)
    nextVerificationDate.value = store.getNextVerificationDate(id)
  }
}

function goBack() {
  router.push('/si')
}

function editInstrument() {
  if (instrument.value) {
    siFormRef.value?.open(instrument.value)
  }
}

async function writeOffInstrument() {
  if (!instrument.value) return
  const ok = await confirmDialog.value?.show(
    'Списание средства измерения',
    'Вы уверены, что хотите списать это средство измерения?\n\nПосле списания прибор будет исключён из активных операций.',
  )
  if (ok) {
    store.writeOffInstrument(instrument.value.id)
    // Если в режиме встраивания, не делаем редирект
    if (!isEmbedded.value) {
      router.push('/si')
    } else {
      loadData() // просто обновляем данные
    }
  }
}

function openAddVerification() {
  if (instrument.value) {
    verFormRef.value?.open(instrument.value.id)
  }
}

function editVerification(v: Verification) {
  if (instrument.value) {
    verFormRef.value?.open(instrument.value.id, v)
  }
}

function refresh() {
  loadData()
}

// Следим за изменением пропса id
watch(
  () => props.id,
  () => {
    loadData()
  },
  { immediate: true },
)

// Следим за изменением маршрута
watch(
  () => route.params.id,
  () => {
    if (!props.id) loadData()
  },
)

onMounted(() => {
  loadData()
  window.addEventListener('si-saved', refresh)
  window.addEventListener('verification-saved', refresh)
})
</script>

<style scoped>
.status-disabled {
  color: #999;
  font-style: italic;
}
.result-bad {
  color: #c0392b;
  font-weight: 500;
}
.card-detail-grid {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
}
.detail-col {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.detail-row {
  display: grid;
  grid-template-columns: 180px 1fr 180px 1fr;
  gap: 16px;
  align-items: baseline;
}
.detail-label {
  font-weight: 600;
  color: #2c3e50;
}
.detail-value {
  color: #1a2a3a;
}
@media (max-width: 768px) {
  .detail-row {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
}
</style>
