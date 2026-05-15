<template>
  <div class="modal-overlay" v-if="visible">
    <div class="modal-content" style="width: 500px">
      <div class="modal-header">{{ isEdit ? 'Редактирование плана' : 'Добавление плана' }}</div>

      <div class="form-group">
        <label>Название*</label>
        <input type="text" v-model="form.name" class="form-control" />
      </div>

      <div class="form-group">
        <label>Дата начала*</label>
        <input type="date" v-model="form.startDate" class="form-control" />
      </div>

      <div class="form-group">
        <label>Дата окончания*</label>
        <input type="date" v-model="form.endDate" class="form-control" />
      </div>

      <div class="form-group">
        <label>Статус</label>
        <select v-model="form.status" class="form-control">
          <option value="pending">Ожидает</option>
          <option value="in_progress">В работе</option>
          <option value="completed">Выполнено</option>
        </select>
      </div>

      <div class="form-group">
        <label>Описание</label>
        <textarea v-model="form.description" rows="3" class="form-control"></textarea>
      </div>

      <div v-if="error" class="error-text">{{ error }}</div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="close">Отмена</button>
        <button class="btn btn-primary" @click="save">Сохранить</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useSubsystemsStore } from '../stores/subsystemsStore'

const store = useSubsystemsStore()
const visible = ref(false)
const isEdit = ref(false)
const editId = ref<number | null>(null)
const subsystemId = ref<number | null>(null)
const error = ref('')

const form = reactive({
  name: '',
  startDate: '',
  endDate: '',
  status: 'pending' as 'pending' | 'in_progress' | 'completed',
  description: '',
})

function getCurrentDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function reset() {
  form.name = ''
  form.startDate = getCurrentDate()
  form.endDate = getCurrentDate()
  form.status = 'pending'
  form.description = ''
  error.value = ''
  isEdit.value = false
  editId.value = null
  subsystemId.value = null
}

function open(sId: number, plan?: any) {
  reset()
  subsystemId.value = sId
  if (plan) {
    isEdit.value = true
    editId.value = plan.id
    form.name = plan.name
    form.startDate = plan.startDate
    form.endDate = plan.endDate
    form.status = plan.status
    form.description = plan.description || ''
  }
  visible.value = true
}

function close() {
  visible.value = false
}

function validate(): boolean {
  if (!form.name.trim()) {
    error.value = 'Введите название'
    return false
  }
  if (!form.startDate) {
    error.value = 'Укажите дату начала'
    return false
  }
  if (!form.endDate) {
    error.value = 'Укажите дату окончания'
    return false
  }
  error.value = ''
  return true
}

function save() {
  if (!validate() || !subsystemId.value) return

  const data = {
    subsystemId: subsystemId.value,
    name: form.name,
    startDate: form.startDate,
    endDate: form.endDate,
    status: form.status,
    description: form.description,
  }

  if (isEdit.value && editId.value) {
    store.updatePlan(editId.value, data)
  } else {
    store.addPlan(data)
  }
  close()
  window.dispatchEvent(new Event('plan-saved'))
}

defineExpose({ open })
</script>
