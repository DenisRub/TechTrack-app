<template>
  <div class="modal-overlay" v-if="visible">
    <div class="modal-content" style="width: 650px">
      <div class="modal-header">{{ isEdit ? 'Редактирование СИ' : 'Добавление СИ' }}</div>

      <div class="form-row">
        <div class="form-group">
          <label>Наименование*</label>
          <input type="text" v-model="form.name" class="form-control" />
        </div>
        <div class="form-group">
          <label>Производитель</label>
          <input type="text" v-model="form.manufacturer" class="form-control" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Марка</label>
          <input type="text" v-model="form.model" class="form-control" />
        </div>
        <div class="form-group">
          <label>Тип</label>
          <input type="text" v-model="form.typeName" class="form-control" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Заводской номер</label>
          <input type="text" v-model="form.serialNumber" class="form-control" />
        </div>
        <div class="form-group">
          <label>Инвентарный номер</label>
          <input type="text" v-model="form.inventoryNumber" class="form-control" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Табельный номер*</label>
          <input type="text" v-model="form.tabNumber" class="form-control" />
        </div>
        <div class="form-group">
          <label>Узел (ID)</label>
          <input type="number" v-model.number="form.nodeId" class="form-control" />
        </div>
      </div>
      <div class="form-row">
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
          <label>Размещение</label>
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
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Основные параметры</label>
          <input type="text" v-model="form.mainParams" class="form-control" />
        </div>
        <div class="form-group">
          <label>Дата производства</label>
          <input type="date" v-model="form.productionDate" class="form-control" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Поверитель</label>
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
          <label>Межповерочный интервал (лет)*</label>
          <input
            type="number"
            step="0.5"
            v-model="form.verificationInterval"
            class="form-control"
          />
        </div>
      </div>

      <div class="form-group">
        <label>Примечание</label>
        <textarea v-model="form.notes" rows="2" class="form-control"></textarea>
      </div>

      <div v-if="error" class="error-text">{{ error }}</div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="close">Отмена</button>
        <button class="btn btn-primary" @click="save">Сохранить</button>
      </div>
    </div>
  </div>

  <!-- Модальные окна -->
  <div class="modal-overlay" v-if="showLocationModal">...</div>
  <div class="modal-overlay" v-if="showVerifierModal">...</div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useSIStore } from '../stores/siStore'
import type { MeasuringInstrument } from '../types/siTypes'
import { addYears } from '@/utils/dateUtils'

const store = useSIStore()
const visible = ref(false)
const isEdit = ref(false)
const editId = ref<number | null>(null)
const error = ref('')

// ========== Местоположения ==========
const locationOptions = ref<string[]>([])
const showLocationModal = ref(false)
const newLocation = ref('')
const locationError = ref('')

function loadLocations() {
  const saved = localStorage.getItem('si_locations')
  if (saved) {
    locationOptions.value = JSON.parse(saved)
  } else {
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

function saveLocations() {
  localStorage.setItem('si_locations', JSON.stringify(locationOptions.value))
}

function openAddLocationModal() {
  newLocation.value = ''
  locationError.value = ''
  showLocationModal.value = true
}

function closeLocationModal() {
  showLocationModal.value = false
}

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

// ========== Поверители ==========
const verifierOptions = ref<string[]>([])
const showVerifierModal = ref(false)
const newVerifier = ref('')
const verifierError = ref('')

function loadVerifiers() {
  const saved = localStorage.getItem('si_verifiers')
  if (saved) {
    verifierOptions.value = JSON.parse(saved)
  } else {
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

function saveVerifiers() {
  localStorage.setItem('si_verifiers', JSON.stringify(verifierOptions.value))
}

function openAddVerifierModal() {
  newVerifier.value = ''
  verifierError.value = ''
  showVerifierModal.value = true
}

function closeVerifierModal() {
  showVerifierModal.value = false
}

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

// ========== Дата и расчёты ==========
function getCurrentDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function calculateNextVerificationDate(lastDate: string | undefined, interval: number): string {
  if (!lastDate || !interval) return ''
  return addYears(lastDate, interval)
}

// ========== Форма ==========
const form = reactive({
  name: '',
  manufacturer: '',
  model: '',
  typeName: '',
  serialNumber: '',
  inventoryNumber: '',
  tabNumber: '',
  nodeId: undefined as number | undefined,
  condition: '',
  status: 'в эксплуатации' as 'в эксплуатации' | 'на поверке' | 'в ремонте' | 'выведено',
  location: '',
  mainParams: '',
  verificationInterval: 1,
  nextVerificationDate: '',
  notes: '',
  lastVerificationDate: '',
  productionDate: '',
  verifier: '',
})

function resetForm() {
  form.name = ''
  form.manufacturer = ''
  form.model = ''
  form.typeName = ''
  form.serialNumber = ''
  form.inventoryNumber = ''
  form.tabNumber = ''
  form.nodeId = undefined
  form.status = 'в эксплуатации'
  form.location = ''
  form.mainParams = ''
  form.verificationInterval = 1
  form.nextVerificationDate = ''
  form.notes = ''
  form.lastVerificationDate = ''
  form.productionDate = ''
  form.verifier = ''
  error.value = ''
  isEdit.value = false
  editId.value = null
}

function open(editItem?: MeasuringInstrument) {
  resetForm()
  loadLocations()
  loadVerifiers()
  const now = getCurrentDate()
  form.lastVerificationDate = now

  if (editItem) {
    isEdit.value = true
    editId.value = editItem.id
    form.name = editItem.name || ''
    form.manufacturer = editItem.manufacturer || ''
    form.model = editItem.model || ''
    form.typeName = editItem.typeName || ''
    form.serialNumber = editItem.serialNumber || ''
    form.inventoryNumber = editItem.inventoryNumber || ''
    form.tabNumber = editItem.tabNumber || ''
    form.nodeId = editItem.nodeId || undefined
    form.status = editItem.status
    form.location = editItem.location || ''
    form.mainParams = editItem.mainParams || ''
    form.verificationInterval = editItem.verificationInterval
    form.notes = editItem.notes || ''
    form.lastVerificationDate = editItem.lastVerificationDate || now
    form.productionDate = editItem.productionDate || ''
    form.verifier = editItem.verifier || ''
    form.nextVerificationDate = calculateNextVerificationDate(
      form.lastVerificationDate,
      form.verificationInterval,
    )
  } else {
    form.nextVerificationDate = calculateNextVerificationDate(now, form.verificationInterval)
  }

  visible.value = true
}

function close() {
  visible.value = false
}

function validate(): boolean {
  if (!form.name) {
    error.value = 'Введите наименование'
    return false
  }
  if (!form.tabNumber) {
    error.value = 'Введите табельный номер'
    return false
  }
  if (!form.verificationInterval || form.verificationInterval <= 0) {
    error.value = 'Межповерочный интервал должен быть больше 0'
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

  const calculatedNextDate = calculateNextVerificationDate(
    form.lastVerificationDate,
    form.verificationInterval,
  )

  const data = {
    name: form.name,
    manufacturer: form.manufacturer,
    model: form.model,
    typeName: form.typeName,
    serialNumber: form.serialNumber,
    inventoryNumber: form.inventoryNumber,
    tabNumber: form.tabNumber,
    nodeId: form.nodeId,
    status: form.status,
    location: form.location,
    mainParams: form.mainParams,
    verificationInterval: form.verificationInterval,
    nextVerificationDate: calculatedNextDate,
    notes: form.notes,
    lastVerificationDate: form.lastVerificationDate,
    productionDate: form.productionDate,
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

<style scoped>
.form-row {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
}
.form-row .form-group {
  flex: 1;
}
.text-muted {
  font-size: 12px;
  color: #6c757d;
  display: block;
  margin-top: 4px;
}
.modal-content {
  max-width: 90%;
}
</style>
