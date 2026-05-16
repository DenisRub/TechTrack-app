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
          <label>Дата регистрации*</label>
          <input type="date" v-model="form.registrationDate" class="form-control" />
        </div>
        <div class="form-group">
          <label>Учётный номер</label>
          <input type="number" v-model="form.registrationNumber" class="form-control" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Дата последнего ТО</label>
          <input type="date" v-model="form.lastServiceDate" class="form-control" />
        </div>
        <div class="form-group">
          <label>Узел</label>
          <select v-model="form.nodeId" class="form-control">
            <option :value="null">-- Выберите узел --</option>
            <option v-for="node in equipmentNodes" :key="node.id" :value="node.id">
              {{ node.name }} ({{ node.type === 'aggregate' ? 'Агрегат' : 'Блок' }})
            </option>
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Срок службы (лет)</label>
          <input type="number" step="0.5" v-model="form.serviceLife" class="form-control" />
        </div>
        <div class="form-group">
          <label>Срок до ТО (лет)</label>
          <input type="number" step="0.5" v-model="form.timeToService" class="form-control" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Исходный ресурс</label>
          <input v-model="form.initialResource" class="form-control" />
        </div>
        <div class="form-group">
          <label>Остаточный ресурс</label>
          <input v-model="form.remainingResource" class="form-control" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Установлен в</label>
          <input v-model="form.installedIn" class="form-control" />
        </div>
        <div class="form-group">
          <label>Режим работы (часов/год)</label>
          <div style="display: flex; gap: 8px">
            <input type="number" v-model="form.workHours" class="form-control" />
            <button type="button" class="btn btn-sm btn-secondary" @click="calculateByWorkMode">Рассчитать ресурс</button>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label>Примечания</label>
        <textarea v-model="form.notes" rows="2" class="form-control"></textarea>
      </div>

      <div v-if="calcResult" class="calc-result">
        <h4>Результат расчёта:</h4>
        <p>Рассчитанный остаточный ресурс: {{ calcResult }}%</p>
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
import { ref, reactive, computed, onMounted } from 'vue';
import { useResourcesStore } from '../stores/resourcesStore';
import { useEquipmentStore } from '@/modules/equipment/stores/equipmentStore';

const store = useResourcesStore();
const equipmentStore = useEquipmentStore();
const visible = ref(false);
const isEdit = ref(false);
const editId = ref<number | null>(null);
const error = ref('');
const calcResult = ref<string | null>(null);

// Получаем узлы (активные, не удалённые)
const equipmentNodes = computed(() => {
  // Пытаемся получить из активных, затем из flatList, затем фильтруем все
  if (equipmentStore.activeNodes) return equipmentStore.activeNodes;
  if (equipmentStore.flatList) return equipmentStore.flatList;
  return (equipmentStore.nodes || []).filter((n: any) => !n.isDeleted);
});

// Отладка: вывести узлы в консоль при монтировании
onMounted(() => {
  console.log('Доступные узлы для выбора в форме ресурса:', equipmentNodes.value);
});

const form = reactive({
  name: '',
  mark: '',
  type: '',
  productionDate: '',
  registrationDate: '',
  registrationNumber: null as number | null,
  lastServiceDate: '',
  nodeId: null as number | null,
  serviceLife: null as number | null,
  timeToService: null as number | null,
  initialResource: '',
  remainingResource: '',
  installedIn: '',
  notes: '',
  workHours: null as number | null,
});

function getCurrentDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function calculateByWorkMode() {
  if (!form.workHours || !form.serviceLife) {
    error.value = 'Укажите режим работы и срок службы для расчёта';
    return;
  }
  const ratedHours = form.serviceLife * 8760;
  const remainingYears = ratedHours / form.workHours;
  const remainingPercent = (remainingYears / form.serviceLife) * 100;
  calcResult.value = remainingPercent.toFixed(1);
  form.remainingResource = `${remainingPercent.toFixed(1)}%`;
}

function reset() {
  form.name = '';
  form.mark = '';
  form.type = '';
  form.productionDate = '';
  form.registrationDate = getCurrentDate();
  form.registrationNumber = null;
  form.lastServiceDate = '';
  form.nodeId = null;
  form.serviceLife = null;
  form.timeToService = null;
  form.initialResource = '';
  form.remainingResource = '';
  form.installedIn = '';
  form.notes = '';
  form.workHours = null;
  calcResult.value = null;
  error.value = '';
  isEdit.value = false;
  editId.value = null;
}

function open(resource?: any) {
  reset();
  if (resource) {
    isEdit.value = true;
    editId.value = resource.id;
    form.name = resource.name;
    form.mark = resource.mark || '';
    form.type = resource.type || '';
    form.productionDate = resource.productionDate || '';
    form.registrationDate = resource.registrationDate || getCurrentDate();
    form.registrationNumber = resource.registrationNumber || null;
    form.lastServiceDate = resource.lastServiceDate || '';
    form.nodeId = resource.nodeId || null;
    form.serviceLife = resource.serviceLife || null;
    form.timeToService = resource.timeToService || null;
    form.initialResource = resource.initialResource || '';
    form.remainingResource = resource.remainingResource || '';
    form.installedIn = resource.installedIn || '';
    form.notes = resource.notes || '';
  }
  visible.value = true;
}

function close() { visible.value = false; }

function validate(): boolean {
  if (!form.name) { error.value = 'Введите наименование'; return false; }
  if (!form.registrationDate) { error.value = 'Укажите дату регистрации'; return false; }
  error.value = '';
  return true;
}

function save() {
  if (!validate()) return;

  const node = equipmentNodes.value.find(n => n.id === form.nodeId);
  const data = {
    name: form.name,
    mark: form.mark,
    type: form.type,
    productionDate: form.productionDate,
    registrationDate: form.registrationDate,
    registrationNumber: form.registrationNumber || undefined,
    lastServiceDate: form.lastServiceDate,
    nodeId: form.nodeId,
    nodeName: node?.name || '',
    serviceLife: form.serviceLife || undefined,
    timeToService: form.timeToService || undefined,
    initialResource: form.initialResource,
    remainingResource: form.remainingResource,
    installedIn: form.installedIn,
    notes: form.notes,
    isDeleted: false,
  };

  if (isEdit.value && editId.value) {
    store.updateResource(editId.value, data);
  } else {
    store.addResource(data);
  }
  close();
  window.dispatchEvent(new Event('resource-saved'));
}

defineExpose({ open });
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
.calc-result {
  background: #e8f5e9;
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 15px;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}
</style>