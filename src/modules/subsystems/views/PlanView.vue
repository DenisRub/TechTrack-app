<template>
  <div class="card" v-if="plan">
    <div style="display: flex; justify-content: space-between; margin-bottom: 20px">
      <h2>{{ plan.name }}</h2>
      <div>
        <button class="btn btn-secondary" @click="goBack">← Назад к подсистеме</button>
        <button class="btn btn-primary" @click="editPlan">Редактировать</button>
        <button class="btn btn-danger" @click="deletePlan">Удалить</button>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-row">
        <div class="info-label">Подсистема</div>
        <div class="info-value">{{ subsystemName }}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Период</div>
        <div class="info-value">
          {{ formatDate(plan.startDate) }} — {{ formatDate(plan.endDate) }}
        </div>
      </div>
      <div class="info-row">
        <div class="info-label">Статус</div>
        <div class="info-value">{{ getStatusText(plan.status) }}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Описание</div>
        <div class="info-value">{{ plan.description || '-' }}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Дата создания</div>
        <div class="info-value">{{ plan.createdAt }}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Дата обновления</div>
        <div class="info-value">{{ plan.updatedAt }}</div>
      </div>
    </div>

    <PlanForm ref="planFormRef" @saved="refresh" />
    <ConfirmDialog ref="confirmDialog" />
  </div>
  <div v-else class="card">Загрузка...</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSubsystemsStore } from '../stores/subsystemsStore'
import PlanForm from '../components/PlanForm.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { formatDate } from '@/utils/dateUtils'

const route = useRoute()
const router = useRouter()
const store = useSubsystemsStore()
const planFormRef = ref()
const confirmDialog = ref()

const plan = ref<any>(null)
const subsystemName = ref('')

function getStatusText(status: string): string {
  const statuses: Record<string, string> = {
    pending: 'Ожидает',
    in_progress: 'В работе',
    completed: 'Выполнено',
  }
  return statuses[status] || status
}

function loadData() {
  const id = Number(route.params.id)
  plan.value = store.getPlan(id)
  if (plan.value) {
    const subsystem = store.getSubsystem(plan.value.subsystemId)
    subsystemName.value = subsystem ? subsystem.name : '-'
  }
}

function goBack() {
  if (plan.value) {
    router.push(`/subsystems/${plan.value.subsystemId}`)
  } else {
    router.back()
  }
}

function editPlan() {
  if (plan.value) {
    planFormRef.value?.open(plan.value.subsystemId, plan.value)
  }
}

async function deletePlan() {
  const ok = await confirmDialog.value?.show('Удаление', 'Удалить план?')
  if (ok && plan.value) {
    store.deletePlan(plan.value.id)
    goBack()
  }
}

function refresh() {
  loadData()
}

onMounted(() => {
  loadData()
  window.addEventListener('plan-saved', refresh)
})
</script>

<style scoped>
.info-grid {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
}
.info-row {
  display: grid;
  grid-template-columns: 180px 1fr;
  padding: 8px 0;
  border-bottom: 1px solid #e0e4e8;
}
.info-row:last-child {
  border-bottom: none;
}
.info-label {
  font-weight: 600;
  color: #2c3e50;
}
.info-value {
  color: #1a2a3a;
}
</style>
