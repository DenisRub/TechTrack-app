<template>
  <div class="modal-overlay" v-if="visible">
    <div class="modal-content">
      <div class="modal-header">{{ isEdit ? 'Редактирование СИ' : 'Добавление СИ' }}</div>
      <div class="form-group">
        <label>Табульный номер*</label>
        <input type="text" v-model="form.tabulNumber" class="form-control" />
      </div>
      <div class="form-group">
        <label>Наименование/тип*</label>
        <input type="text" v-model="form.name" class="form-control" />
      </div>
      <div class="form-group">
        <label>Межповерочный интервал (лет)*</label>
        <input type="number" step="0.5" v-model="form.verificationInterval" class="form-control" />
      </div>
      <div class="form-group">
        <label>Дата последней поверки*</label>
        <input type="date" v-model="form.lastVerificationDate" class="form-control" />
      </div>
      <div class="form-group">
        <label>Статус</label>
        <select v-model="form.status" class="form-control">
          <option value="в эксплуатации">В эксплуатации</option>
          <option value="на поверке">На поверке</option>
          <option value="выведено">Выведено</option>
        </select>
      </div>
      <div class="form-group">
        <label>Местоположение</label>
        <input type="text" v-model="form.location" class="form-control" />
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
import { useSIStore } from '../stores/siStore'
import type { MeasuringInstrument } from '../types/siTypes'

const store = useSIStore()
const visible = ref(false)
const isEdit = ref(false)
const editId = ref<number | null>(null)
const error = ref('')

const form = reactive<{
  tabulNumber: string
  name: string
  verificationInterval: number
  lastVerificationDate: string
  status: 'в эксплуатации' | 'на поверке' | 'выведено'
  location: string
  verifier: string
}>({
  tabulNumber: '',
  name: '',
  verificationInterval: 1,
  lastVerificationDate: '',
  status: 'в эксплуатации',
  location: '',
  verifier: '',
})

function resetForm() {
  form.tabulNumber = ''
  form.name = ''
  form.verificationInterval = 1
  form.lastVerificationDate = ''
  form.status = 'в эксплуатации'
  form.location = ''
  form.verifier = ''
  error.value = ''
  isEdit.value = false
  editId.value = null
}

function open(editItem?: MeasuringInstrument) {
  resetForm()
  if (editItem) {
    isEdit.value = true
    editId.value = editItem.id
    form.tabulNumber = editItem.tabulNumber
    form.name = editItem.name
    form.verificationInterval = editItem.verificationInterval
    form.lastVerificationDate = editItem.lastVerificationDate
    form.status = editItem.status
    form.location = editItem.location
    form.verifier = editItem.verifier || ''
  }
  visible.value = true
}

function close() {
  visible.value = false
}

function validate(): boolean {
  if (!form.tabulNumber) {
    error.value = 'Введите табульный номер'
    return false
  }
  if (!form.name) {
    error.value = 'Введите наименование'
    return false
  }
  if (!form.verificationInterval || form.verificationInterval <= 0) {
    error.value = 'Интервал должен быть >0'
    return false
  }
  if (!form.lastVerificationDate) {
    error.value = 'Укажите дату последней поверки'
    return false
  }
  error.value = ''
  return true
}

function save() {
  if (!validate()) return
  const data = {
    tabulNumber: form.tabulNumber,
    name: form.name,
    verificationInterval: form.verificationInterval,
    lastVerificationDate: form.lastVerificationDate,
    status: form.status,
    location: form.location,
    verifier: form.verifier,
    isDeleted: false,
  }
  if (isEdit.value && editId.value) {
    store.updateInstrument(editId.value, data)
  } else {
    store.addInstrument(data)
  }
  close()
  window.dispatchEvent(new Event('si-saved'))
}

defineExpose({ open })
</script>
