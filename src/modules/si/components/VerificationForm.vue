<template>
  <div class="modal-overlay" v-if="visible">
    <div class="modal-content">
      <div class="modal-header">{{ editId ? 'Редактирование поверки' : 'Добавление поверки' }}</div>

      <div class="form-group">
        <label>Дата передачи*</label>
        <input
          type="date"
          v-model="form.transferDate"
          class="form-control"
          @change="validateDates"
        />
      </div>

      <div class="form-group">
        <label>Дата получения*</label>
        <input
          type="date"
          v-model="form.receiptDate"
          class="form-control"
          @change="validateDates"
        />
      </div>

      <div class="form-group">
        <label>Поверитель*</label>
        <div style="display: flex; gap: 8px">
          <select v-model="form.verifier" class="form-control" style="flex: 1">
            <option value="">-- Выберите поверителя --</option>
            <option v-for="ver in verifierOptions" :key="ver" :value="ver">{{ ver }}</option>
          </select>
          <button type="button" class="btn btn-secondary btn-sm" @click="openAddVerifierModal">
            + Добавить
          </button>
        </div>
      </div>

      <div class="form-group">
        <label>Результат*</label>
        <select v-model="form.result" class="form-control">
          <option value="годен">Годен</option>
          <option value="не годен">Не годен</option>
        </select>
      </div>

      <!-- Сообщения об ошибках -->
      <div v-if="dateError" class="error-text" style="color: #c0392b; margin-bottom: 10px">
        {{ dateError }}
      </div>
      <div v-if="error" class="error-text">{{ error }}</div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="close">Отмена</button>
        <button class="btn btn-primary" @click="save">Сохранить</button>
      </div>
    </div>
  </div>

  <!-- Модальное окно добавления поверителя -->
  <div class="modal-overlay" v-if="showVerifierModal">
    <div class="modal-content" style="width: 400px">
      <div class="modal-header">Добавление поверителя</div>
      <div class="form-group">
        <label>Новый поверитель</label>
        <input
          type="text"
          v-model="newVerifier"
          class="form-control"
          placeholder="Например: Нижегородский ЦСМ"
        />
      </div>
      <div v-if="verifierError" class="error-text">{{ verifierError }}</div>
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="closeVerifierModal">Отмена</button>
        <button class="btn btn-primary" @click="addNewVerifier">Добавить</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useSIStore } from '../stores/siStore'
import type { Verification } from '../types/siTypes'

const store = useSIStore()
const visible = ref(false)
const siId = ref<number | null>(null)
const editId = ref<number | null>(null)
const error = ref('')
const dateError = ref('')

// Список поверителей (загружается из localStorage)
const verifierOptions = ref<string[]>([])

// Модальное окно для добавления поверителя
const showVerifierModal = ref(false)
const newVerifier = ref('')
const verifierError = ref('')

// Загрузка списка поверителей из localStorage
function loadVerifiers() {
  const saved = localStorage.getItem('si_verifiers')
  if (saved) {
    verifierOptions.value = JSON.parse(saved)
  } else {
    // Начальные поверители по умолчанию
    verifierOptions.value = [
      'Самарский ЦСМ',
      'Саратовский ЦСМ',
      'Московский ЦСМ',
      'Казанский ЦСМ',
      'Поверочная лаборатория',
    ]
    localStorage.setItem('si_verifiers', JSON.stringify(verifierOptions.value))
  }
}

// Сохранение списка поверителей в localStorage
function saveVerifiers() {
  localStorage.setItem('si_verifiers', JSON.stringify(verifierOptions.value))
}

// Открытие модального окна добавления поверителя
function openAddVerifierModal() {
  newVerifier.value = ''
  verifierError.value = ''
  showVerifierModal.value = true
}

// Закрытие модального окна
function closeVerifierModal() {
  showVerifierModal.value = false
}

// Добавление нового поверителя
function addNewVerifier() {
  const trimmed = newVerifier.value.trim()
  if (!trimmed) {
    verifierError.value = 'Введите название поверителя'
    return
  }
  if (verifierOptions.value.includes(trimmed)) {
    verifierError.value = 'Такой поверитель уже существует'
    return
  }
  verifierOptions.value.push(trimmed)
  saveVerifiers()
  form.verifier = trimmed
  closeVerifierModal()
}

const form = reactive({
  transferDate: '',
  receiptDate: '',
  verifier: '',
  result: 'годен' as 'годен' | 'не годен',
})

// ========== ВАЛИДАЦИЯ ДАТ ==========
function validateDates(): boolean {
  dateError.value = ''

  // Если одна из дат не заполнена, не проверяем
  if (!form.transferDate || !form.receiptDate) {
    return true
  }

  const transfer = new Date(form.transferDate)
  const receipt = new Date(form.receiptDate)

  // Проверяем, что дата получения не раньше даты передачи
  if (receipt < transfer) {
    dateError.value = 'Дата получения не может быть раньше даты передачи'
    return false
  }

  return true
}

function reset() {
  form.transferDate = ''
  form.receiptDate = ''
  form.verifier = ''
  form.result = 'годен'
  error.value = ''
  dateError.value = ''
  siId.value = null
  editId.value = null
}

function open(instrumentId: number, existing?: Verification) {
  reset()
  loadVerifiers()
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

function save() {
  // Проверка заполнения полей
  if (!form.transferDate) {
    error.value = 'Укажите дату передачи'
    return
  }
  if (!form.receiptDate) {
    error.value = 'Укажите дату получения'
    return
  }
  if (!form.verifier) {
    error.value = 'Укажите поверителя'
    return
  }

  // ВАЛИДАЦИЯ ДАТ
  if (!validateDates()) {
    return
  }

  const data = {
    siId: siId.value!,
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
