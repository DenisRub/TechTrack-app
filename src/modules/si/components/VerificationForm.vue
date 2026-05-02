<template>
  <div class="modal-overlay" v-if="visible">
    <div class="modal-content">
      <div class="modal-header">{{ editId ? 'Редактирование поверки' : 'Добавление поверки' }}</div>
      <div class="form-group">
        <label>Дата передачи*</label>
        <input type="date" v-model="form.transferDate" class="form-control" />
      </div>
      <div class="form-group">
        <label>Дата получения*</label>
        <input type="date" v-model="form.receiptDate" class="form-control" />
      </div>
      <div class="form-group">
        <label>Поверитель*</label>
        <input type="text" v-model="form.verifier" class="form-control" />
      </div>
      <div class="form-group">
        <label>Результат*</label>
        <select v-model="form.result" class="form-control">
          <option value="годен">Годен</option>
          <option value="не годен">Не годен</option>
        </select>
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
import type { Verification } from '../types/siTypes'

const store = useSIStore()
const visible = ref(false)
const siId = ref<number | null>(null)
const editId = ref<number | null>(null)
const error = ref('')

const form = reactive({
  transferDate: '',
  receiptDate: '',
  verifier: '',
  result: 'годен' as 'годен' | 'не годен',
})

function reset() {
  form.transferDate = ''
  form.receiptDate = ''
  form.verifier = ''
  form.result = 'годен'
  error.value = ''
  siId.value = null
  editId.value = null
}

function open(instrumentId: number, existing?: Verification) {
  reset()
  siId.value = instrumentId
  if (existing) {
    editId.value = existing.id
    form.transferDate = existing.transferDate
    form.receiptDate = existing.receiptDate
    form.verifier = existing.verifier
    form.result = existing.result
  }
  visible.value = true
}

function close() {
  visible.value = false
}

function validate(): boolean {
  if (!form.transferDate) {
    error.value = 'Укажите дату передачи'
    return false
  }
  if (!form.receiptDate) {
    error.value = 'Укажите дату получения'
    return false
  }
  if (!form.verifier) {
    error.value = 'Укажите поверителя'
    return false
  }
  error.value = ''
  return true
}

function save() {
  if (!validate() || !siId.value) return
  const data = {
    siId: siId.value,
    transferDate: form.transferDate,
    receiptDate: form.receiptDate,
    verifier: form.verifier,
    result: form.result,
  }
  if (editId.value) {
    store.updateVerification(editId.value, data)
  } else {
    store.addVerification(data)
  }
  close()
  window.dispatchEvent(new Event('verification-saved'))
}

defineExpose({ open })
</script>
