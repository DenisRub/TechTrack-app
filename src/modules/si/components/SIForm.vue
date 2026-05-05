<template>
  <div class="modal-overlay" v-if="visible">
    <div class="modal-content">
      <div class="modal-header">{{ isEdit ? 'Редактирование СИ' : 'Добавление СИ' }}</div>

      <!-- Табельный номер -->
      <div class="form-group">
        <label>Табельный номер*</label>
        <input type="text" v-model="form.tabNumber" class="form-control" />
      </div>

      <!-- Наименование -->
      <div class="form-group">
        <label>Наименование*</label>
        <input type="text" v-model="form.name" class="form-control" />
      </div>

      <!-- Местоположение -->
      <div class="form-group">
        <label>Местоположение</label>
        <div style="display: flex; gap: 8px">
          <select v-model="form.location" class="form-control" style="flex: 1">
            <option value="">-- Выберите местоположение --</option>
            <option v-for="loc in locationOptions" :key="loc" :value="loc">{{ loc }}</option>
          </select>
          <button type="button" class="btn btn-secondary btn-sm" @click="openAddLocationModal">
            + Добавить
          </button>
        </div>
      </div>

      <!-- Межповерочный интервал -->
      <div class="form-group">
        <label>Межповерочный интервал (лет)*</label>
        <input type="number" step="0.5" v-model="form.verificationInterval" class="form-control" />
      </div>

      <!-- Статус -->
      <div class="form-group">
        <label>Статус</label>
        <select v-model="form.status" class="form-control">
          <option value="в эксплуатации">В эксплуатации</option>
          <option value="на поверке">На поверке</option>
          <option value="в ремонте">В ремонте</option>
          <option value="выведено">Выведено</option>
        </select>
      </div>

      <div v-if="error" class="error-text">{{ error }}</div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="close">Отмена</button>
        <button class="btn btn-primary" @click="save">Сохранить</button>
      </div>
    </div>
  </div>

  <!-- Модальное окно добавления местоположения -->
  <div class="modal-overlay" v-if="showLocationModal">
    <div class="modal-content" style="width: 400px">
      <div class="modal-header">Добавление местоположения</div>
      <div class="form-group">
        <label>Новое местоположение</label>
        <input
          type="text"
          v-model="newLocation"
          class="form-control"
          placeholder="Например: Лаборатория №6"
        />
      </div>
      <div v-if="locationError" class="error-text">{{ locationError }}</div>
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="closeLocationModal">Отмена</button>
        <button class="btn btn-primary" @click="addNewLocation">Добавить</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useSIStore } from '../stores/siStore'
import type { MeasuringInstrument } from '../types/siTypes'

const store = useSIStore()
const visible = ref(false)
const isEdit = ref(false)
const editId = ref<number | null>(null)
const error = ref('')

// Список местоположений (загружается из localStorage)
const locationOptions = ref<string[]>([])

// Модальное окно для добавления местоположения
const showLocationModal = ref(false)
const newLocation = ref('')
const locationError = ref('')

// Загрузка списка местоположений из localStorage
function loadLocations() {
  const saved = localStorage.getItem('si_locations')
  if (saved) {
    locationOptions.value = JSON.parse(saved)
  } else {
    // Начальные местоположения по умолчанию
    locationOptions.value = [
      'Лаборатория №5',
      'Пост контроля АСКРО',
      'Склад',
      'Лаборатория №3',
      'Ремонтная мастерская',
    ]
    localStorage.setItem('si_locations', JSON.stringify(locationOptions.value))
  }
}

// Сохранение списка местоположений в localStorage
function saveLocations() {
  localStorage.setItem('si_locations', JSON.stringify(locationOptions.value))
}

// Открытие модального окна добавления местоположения
function openAddLocationModal() {
  newLocation.value = ''
  locationError.value = ''
  showLocationModal.value = true
}

// Закрытие модального окна
function closeLocationModal() {
  showLocationModal.value = false
}

// Добавление нового местоположения
function addNewLocation() {
  const trimmed = newLocation.value.trim()
  if (!trimmed) {
    locationError.value = 'Введите название местоположения'
    return
  }
  if (locationOptions.value.includes(trimmed)) {
    locationError.value = 'Такое местоположение уже существует'
    return
  }
  locationOptions.value.push(trimmed)
  saveLocations()
  form.location = trimmed
  closeLocationModal()
}

const form = reactive<{
  tabNumber: string
  name: string
  verificationInterval: number
  status: 'в эксплуатации' | 'на поверке' | 'в ремонте' | 'выведено'
  location: string
}>({
  tabNumber: '',
  name: '',
  verificationInterval: 1,
  status: 'в эксплуатации',
  location: '',
})

// Функция для получения текущей даты в формате YYYY-MM-DD
function getCurrentDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Функция для получения последней даты поверки из истории
function getLastVerificationDate(siId?: number): string {
  if (!siId) {
    return '' // Пустая строка вместо текущей даты
  }

  const verifications = store.getVerificationsForSI(siId)
  const lastGoodVerification = verifications
    .filter((v) => v.result === 'годен')
    .sort((a, b) => new Date(b.receiptDate).getTime() - new Date(a.receiptDate).getTime())[0]

  if (lastGoodVerification && lastGoodVerification.receiptDate) {
    return lastGoodVerification.receiptDate
  }

  return '' // Пустая строка, если нет поверок
}

function resetForm() {
  form.tabNumber = ''
  form.name = ''
  form.verificationInterval = 1
  form.status = 'в эксплуатации'
  form.location = ''
  error.value = ''
  isEdit.value = false
  editId.value = null
}

function open(editItem?: MeasuringInstrument) {
  resetForm()
  if (editItem) {
    isEdit.value = true
    editId.value = editItem.id
    form.tabNumber = editItem.tabNumber
    form.name = editItem.name
    form.verificationInterval = editItem.verificationInterval
    form.status = editItem.status
    form.location = editItem.location || ''
  }
  visible.value = true
}

function close() {
  visible.value = false
}

function validate(): boolean {
  if (!form.tabNumber) {
    error.value = 'Введите табельный номер'
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
  if (!form.location) {
    error.value = 'Выберите местоположение'
    return false
  }
  error.value = ''
  return true
}

function save() {
  if (!validate()) return

  // Получаем дату последней поверки автоматически из истории
  const lastVerificationDate = getLastVerificationDate(editId.value || undefined)

  const data = {
    tabNumber: form.tabNumber,
    name: form.name,
    verificationInterval: form.verificationInterval,
    lastVerificationDate: lastVerificationDate,
    status: form.status,
    location: form.location,
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

// Загружаем список местоположений при монтировании компонента
onMounted(() => {
  loadLocations()
})

defineExpose({ open })
</script>
