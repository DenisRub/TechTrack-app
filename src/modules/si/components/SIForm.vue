<template>
  <div class="modal-overlay" v-if="visible">
    <div class="modal-content">
      <div class="modal-header">{{ isEdit ? 'Редактирование СИ' : 'Добавление СИ' }}</div>

      <div class="form-group">
        <label>Табельный номер*</label>
        <input type="text" v-model="form.tabNumber" class="form-control" />
      </div>

      <div class="form-group">
        <label>Наименование*</label>
        <input type="text" v-model="form.name" class="form-control" />
      </div>

      <div class="form-group">
        <label>Тип</label>
        <input type="text" v-model="form.type" class="form-control" />
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
          <option value="в ремонте">В ремонте</option>
          <option value="выведено">Выведено</option>
        </select>
      </div>

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
  type: string
  verificationInterval: number
  lastVerificationDate: string
  status: 'в эксплуатации' | 'на поверке' | 'в ремонте' | 'выведено'
  location: string
  verifier: string
}>({
  tabNumber: '',
  name: '',
  type: '',
  verificationInterval: 1,
  lastVerificationDate: '',
  status: 'в эксплуатации',
  location: '',
  verifier: '',
})

function resetForm() {
  form.tabNumber = ''
  form.name = ''
  form.type = ''
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
    form.tabNumber = editItem.tabNumber
    form.name = editItem.name
    form.type = editItem.type || ''
    form.verificationInterval = editItem.verificationInterval
    form.lastVerificationDate = editItem.lastVerificationDate
    form.status = editItem.status
    form.location = editItem.location || ''
    form.verifier = editItem.verifier || ''
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
  if (!form.lastVerificationDate) {
    error.value = 'Укажите дату последней поверки'
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
  const data = {
    tabNumber: form.tabNumber,
    name: form.name,
    type: form.type,
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

// Загружаем список местоположений при монтировании компонента
onMounted(() => {
  loadLocations()
})

defineExpose({ open })
</script>
