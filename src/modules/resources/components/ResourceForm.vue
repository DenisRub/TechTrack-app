<template>
  <div class="modal-overlay" v-if="visible">
    <div class="modal-content" style="width: 700px">
      <div class="modal-header">{{ isEdit ? 'Редактирование ресурса' : 'Добавление ресурса' }}</div>

      <div class="form-row">
        <div class="form-group">
          <label>Наименование*</label>
          <input v-model="form.name" class="form-control" />
        </div>
        <div class="form-group">
          <label>Марка</label>
          <input v-model="form.mark" class="form-control" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Тип</label>
          <input v-model="form.type" class="form-control" />
        </div>
        <div class="form-group">
          <label>Дата производства</label>
          <input type="date" v-model="form.productionDate" class="form-control" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Учётный номер</label>
          <input type="number" v-model="form.registrationNumber" class="form-control" />
        </div>
        <div class="form-group">
          <label>Срок службы (лет)*</label>
          <input type="number" step="0.5" v-model="form.serviceLife" class="form-control" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Срок до ТО (лет)</label>
          <input type="number" step="0.5" v-model="form.timeToService" class="form-control" />
        </div>
        <div class="form-group">
          <label>Узел (выберите из списка)*</label>
          <select v-model="form.nodeId" class="form-control" @change="onNodeChange">
            <option :value="null">-- Выберите узел --</option>
            <option v-for="node in availableNodes" :key="node.id" :value="node.id">
              {{ node.name }} ({{ node.type === 'aggregate' ? 'Агрегат' : 'Блок' }})
            </option>
          </select>
        </div>
      </div>

      <!-- Блок автоматического расчёта -->
      <div class="calc-section">
        <div class="calc-header">
          <span class="calc-title">🤖 Автоматический расчёт временных ресурсов</span>
          <button type="button" class="btn btn-sm btn-secondary" @click="openCalcModal">
            Рассчитать
          </button>
        </div>
        <div class="calc-info" v-if="calcResult">
          <div class="calc-result">
            <span>Режим работы: {{ workHoursPerYear }} часов/год</span>
            <span>Рассчитанный остаточный ресурс: {{ calcResult.remainingYears }} лет</span>
            <span>Рассчитанный срок до ТО: {{ calcResult.timeToService }} лет</span>
          </div>
        </div>
        <div class="calc-note">
          <small
            >Расчёт выполняется на основе режима работы узла. Результат можно применить или
            отредактировать вручную.</small
          >
        </div>
      </div>

      <div class="form-group">
        <label>Примечания</label>
        <textarea v-model="form.notes" rows="2" class="form-control"></textarea>
      </div>

      <div v-if="error" class="error-text">{{ error }}</div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="close">Отмена</button>
        <button class="btn btn-primary" @click="save">Сохранить</button>
      </div>
    </div>
  </div>

  <!-- Модальное окно выбора режима работы -->
  <div class="modal-overlay" v-if="showWorkModeModal">
    <div class="modal-content" style="width: 450px">
      <div class="modal-header">Режим работы узла</div>
      <div class="form-group">
        <label>Выберите режим работы</label>
        <select v-model="workMode" class="form-control">
          <option value="8760">Круглосуточно (24/7) – 8760 часов/год</option>
          <option value="6240">Безостановочный – 6240 часов/год</option>
          <option value="4160">Две смены – 4160 часов/год</option>
          <option value="2080">Одна смена – 2080 часов/год</option>
          <option value="custom">Свой вариант</option>
        </select>
      </div>
      <div v-if="workMode === 'custom'" class="form-group">
        <label>Введите количество часов в год</label>
        <input type="number" v-model="customHours" class="form-control" />
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="closeCalcModal">Отмена</button>
        <button class="btn btn-primary" @click="calculateByWorkMode">Рассчитать</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useResourcesStore } from '../stores/resourcesStore'
import { useEquipmentStore } from '@/modules/equipment/stores/equipmentStore'

const resourcesStore = useResourcesStore()
const equipmentStore = useEquipmentStore()
const visible = ref(false)
const isEdit = ref(false)
const editId = ref<number | null>(null)
const error = ref('')
const availableNodes = ref<any[]>([])
const calcResult = ref<any>(null)
const showWorkModeModal = ref(false)
const workMode = ref('8760')
const customHours = ref(8760)
const workHoursPerYear = ref(8760)

// Функция для получения текущей даты в формате YYYY-MM-DD
function getCurrentDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const form = reactive({
  nodeId: null as number | null,
  name: '',
  mark: '',
  type: '',
  productionDate: '',
  registrationNumber: null as number | null,
  serviceLife: null as number | null,
  timeToService: null as number | null,
  notes: '',
  registrationDate: '' as string,
})

function loadNodes() {
  availableNodes.value = equipmentStore.nodes.filter((n: any) => !n.isDeleted)
}

function onNodeChange() {
  // Очищаем предыдущий результат расчёта при смене узла
  calcResult.value = null
}

function openCalcModal() {
  if (!form.nodeId) {
    error.value = 'Сначала выберите узел'
    return
  }
  const node = availableNodes.value.find((n) => n.id === form.nodeId)
  if (!node) return

  workMode.value = '8760'
  customHours.value = 8760
  showWorkModeModal.value = true
}

function closeCalcModal() {
  showWorkModeModal.value = false
}

function calculateByWorkMode() {
  let hours = parseInt(workMode.value)
  if (workMode.value === 'custom') hours = customHours.value
  workHoursPerYear.value = hours

  // Рассчитываем остаточный ресурс
  if (form.serviceLife) {
    const ratedHours = form.serviceLife * 8760
    const remainingYears = ratedHours / hours
    calcResult.value = {
      remainingYears: remainingYears.toFixed(2),
      timeToService: form.timeToService ? ((form.timeToService * 8760) / hours).toFixed(2) : null,
    }
  }

  showWorkModeModal.value = false
}

function applyCalcResult() {
  if (calcResult.value) {
    if (calcResult.value.remainingYears) {
      form.serviceLife = parseFloat(calcResult.value.remainingYears)
    }
    if (calcResult.value.timeToService) {
      form.timeToService = parseFloat(calcResult.value.timeToService)
    }
  }
}

function open(resource?: any) {
  reset()
  loadNodes()
  // Исправление: гарантируем, что registrationDate всегда строка
  const now = getCurrentDate()
  form.registrationDate = now
  calcResult.value = null

  if (resource) {
    isEdit.value = true
    editId.value = resource.id
    form.nodeId = resource.nodeId
    form.name = resource.name
    form.mark = resource.mark || ''
    form.type = resource.type || ''
    form.productionDate = resource.productionDate || ''
    form.registrationNumber = resource.registrationNumber || null
    form.serviceLife = resource.serviceLife || null
    form.timeToService = resource.timeToService || null
    form.notes = resource.notes || ''
    form.registrationDate = resource.registrationDate || now
  }
  visible.value = true
}

function reset() {
  form.nodeId = null
  form.name = ''
  form.mark = ''
  form.type = ''
  form.productionDate = ''
  form.registrationNumber = null
  form.serviceLife = null
  form.timeToService = null
  form.notes = ''
  form.registrationDate = ''
  error.value = ''
  isEdit.value = false
  editId.value = null
  calcResult.value = null
}

function close() {
  visible.value = false
}

function save() {
  if (!form.nodeId || !form.name) {
    error.value = 'Заполните обязательные поля (Узел и Наименование)'
    return
  }

  // Исправление: гарантируем, что registrationDate всегда строка
  const registrationDate = form.registrationDate || getCurrentDate()

  const node = availableNodes.value.find((n) => n.id === form.nodeId)
  
  
  
  
  const data = {
    nodeId: form.nodeId,
    nodeName: node?.name || '',
    name: form.name,
    mark: form.mark,
    type: form.type,
    productionDate: form.productionDate,
    registrationDate: registrationDate,
    registrationNumber: form.registrationNumber || undefined,
    serviceLife: form.serviceLife || undefined,
    timeToService: form.timeToService || undefined,
    notes: form.notes,
  }

  if (isEdit.value && editId.value) {
    resourcesStore.updateResource(editId.value, data)
  } else {
    resourcesStore.addResource(data)
  }
  close()
  window.dispatchEvent(new Event('resource-saved'))
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
.calc-section {
  background: #f0f7ff;
  border: 1px solid #c5d9e8;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 15px;
}
.calc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.calc-title {
  font-weight: 600;
  color: #2c5f8a;
}
.calc-result {
  display: flex;
  gap: 20px;
  font-size: 13px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}
.calc-result span {
  background: #e9ecef;
  padding: 2px 8px;
  border-radius: 4px;
}
.calc-note {
  font-size: 11px;
  color: #6c757d;
}
</style>
