<template>
  <div class="card" v-if="instrument">
    <div style="display: flex; justify-content: space-between; margin-bottom: 20px">
      <h2>Карточка средства измерения</h2>
      <div>
        <button class="btn btn-secondary" @click="goBack">← Назад</button>
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

    <div style="margin-bottom: 20px">
      <h3>Основные сведения</h3>
      <table style="width: 100%; border-collapse: collapse">
        <tbody>
          <tr>
            <td style="padding: 8px 0; width: 200px"><strong>Табельный номер</strong></td>
            <td>{{ instrument.tabNumber }}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0"><strong>Наименование</strong></td>
            <td>{{ instrument.name }}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0"><strong>Межповерочный интервал</strong></td>
            <td>{{ instrument.verificationInterval }} лет</td>
          </tr>
          <tr>
            <td style="padding: 8px 0"><strong>Дата последней поверки</strong></td>
            <td>{{ lastVerificationDate ? formatDate(lastVerificationDate) : '-' }}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0"><strong>Дата следующей поверки</strong></td>
            <td>
              <template v-if="nextVerificationDate">
                {{ formatDate(nextVerificationDate) }}
                <span
                  v-if="isWarning && instrument.status !== 'выведено'"
                  style="color: #c0392b; margin-left: 10px"
                  >(менее 30 дней)</span
                >
              </template>
              <template v-else>-</template>
              <span v-if="instrument.status === 'выведено'" style="color: #999; margin-left: 10px"
                >(прибор списан)</span
              >
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0"><strong>Статус</strong></td>
            <td :class="{ 'status-disabled': instrument.status === 'выведено' }">
              {{ instrument.status }}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0"><strong>Местоположение</strong></td>
            <td>{{ instrument.location || '-' }}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0"><strong>Последний поверитель</strong></td>
            <td>{{ instrument.verifier || '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div>
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
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSIStore } from '../stores/siStore'
import type { MeasuringInstrument, Verification } from '../types/siTypes'
import SIForm from '../components/SIForm.vue'
import VerificationForm from '../components/VerificationForm.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { formatDate, getDaysUntilVerification } from '@/utils/dateUtils'

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
  const id = Number(route.params.id)
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
    router.push('/si')
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
</style>
