<template>
  <div class="modal-overlay" v-if="visible">
    <div class="modal-content" style="width: 650px">
      <div class="modal-header">
        <h3>{{ editMode ? 'Редактирование измерения' : 'Добавление измерения' }}</h3>
      </div>
      
      <div class="form-group">
        <label>Выберите ресурс*</label>
        <select v-model="selectedResourceId" class="form-control" @change="onResourceSelect">
          <option :value="null">-- Выберите --</option>
          <option v-for="res in store.resources" :key="res.id" :value="res.id">
            {{ res.name }} ({{ res.mark }} | уч.№ {{ res.registrationNumber }})
          </option>
        </select>
      </div>
      
      <div class="form-group">
        <label>Дата измерения*</label>
        <input type="date" v-model="form.measurementDate" class="form-control" />
      </div>
      
      <!-- Параметры измерения -->
      <div v-if="selectedResource" class="params-section">
        <h4>Параметры измерения</h4>
        <div class="params-list">
          <div v-for="param in resourceParams" :key="param.id" class="param-row">
            <div class="param-info">
              <span class="param-name">{{ param.name }}</span>
              <span class="param-unit">({{ param.unit }})</span>
            </div>
            <input 
              type="number" 
              step="0.01" 
              v-model="paramValues[param.id]" 
              class="form-control param-input"
              :placeholder="`Текущее: ${param.value}`"
            />
            <label class="main-checkbox">
              <input type="checkbox" v-model="paramIsMain[param.id]" /> Основной
            </label>
          </div>
        </div>
        
        <div class="add-param-row">
          <input v-model="newParamName" placeholder="Название параметра" class="form-control" />
          <input v-model="newParamUnit" placeholder="Ед. изм." class="form-control" />
          <button class="btn btn-sm btn-secondary" @click="addNewParameter">+ Добавить параметр</button>
        </div>
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
import { ref, reactive, computed } from 'vue';
import { useResourcesStore } from '../stores/resourcesStore';

const store = useResourcesStore();
const visible = ref(false);
const editMode = ref(false);
const editId = ref<number | null>(null);
const selectedResourceId = ref<number | null>(null);
const error = ref('');

const newParamName = ref('');
const newParamUnit = ref('');

const form = reactive({
  measurementDate: '',
});

const paramValues = reactive<Record<number, number | null>>({});
const paramIsMain = reactive<Record<number, boolean>>({});

const selectedResource = computed(() => {
  if (!selectedResourceId.value) return null;
  return store.resources.find(r => r.id === selectedResourceId.value);
});

const resourceParams = computed(() => {
  if (!selectedResourceId.value) return [];
  return store.getParametersForResource(selectedResourceId.value);
});

function getCurrentDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function reset() {
  selectedResourceId.value = null;
  form.measurementDate = getCurrentDate();
  error.value = '';
  editMode.value = false;
  editId.value = null;
  newParamName.value = '';
  newParamUnit.value = '';
  
  Object.keys(paramValues).forEach(key => delete paramValues[Number(key)]);
  Object.keys(paramIsMain).forEach(key => delete paramIsMain[Number(key)]);
}

function onResourceSelect() {
  Object.keys(paramValues).forEach(key => delete paramValues[Number(key)]);
  Object.keys(paramIsMain).forEach(key => delete paramIsMain[Number(key)]);
  
  for (const param of resourceParams.value) {
    const currentValue = typeof param.value === 'number' ? param.value : parseFloat(param.value as string);
    paramValues[param.id] = isNaN(currentValue) ? null : currentValue;
    paramIsMain[param.id] = param.isMain;
  }
}

function addNewParameter() {
  if (!newParamName.value.trim()) {
    error.value = 'Введите название параметра';
    return;
  }
  if (!selectedResourceId.value) {
    error.value = 'Сначала выберите ресурс';
    return;
  }
  
  store.addParameter({
    resourceId: selectedResourceId.value,
    name: newParamName.value,
    value: 0,
    unit: newParamUnit.value,
    isMain: true,
  });
  
  newParamName.value = '';
  newParamUnit.value = '';
  error.value = '';
  onResourceSelect();
}

function updateResourceParameter(paramId: number, value: number | null, isMain: boolean) {
  if (value === null) return;
  store.updateParameter(paramId, { value: value, isMain: isMain });
}

function getParamKey(paramName: string): string {
  const keys: Record<string, string> = {
    'Напряжение': 'U',
    'Внутреннее сопротивление': 'R',
    'Ёмкость': 'E',
  };
  return keys[paramName] || paramName;
}

function open(measurement?: any) {
  reset();
  if (measurement) {
    editMode.value = true;
    editId.value = measurement.id;
    selectedResourceId.value = measurement.resourceId;
    form.measurementDate = measurement.measurementDate;
    
    setTimeout(() => {
      for (const param of resourceParams.value) {
        const measurementValue = measurement.parameters?.[getParamKey(param.name)];
        if (measurementValue !== undefined) {
          paramValues[param.id] = measurementValue;
        } else {
          const currentValue = typeof param.value === 'number' ? param.value : parseFloat(param.value as string);
          paramValues[param.id] = isNaN(currentValue) ? null : currentValue;
        }
        paramIsMain[param.id] = param.isMain;
      }
    }, 50);
  }
  visible.value = true;
}

function close() {
  visible.value = false;
}

function save() {
  if (!selectedResourceId.value) {
    error.value = 'Выберите ресурс';
    return;
  }
  if (!form.measurementDate) {
    error.value = 'Укажите дату измерения';
    return;
  }
  
  const resource = selectedResource.value;
  if (!resource) return;
  
  // Обновляем параметры в карточке ресурса
  for (const param of resourceParams.value) {
    const newValue = paramValues[param.id];
    const newIsMain = paramIsMain[param.id];
    if (newValue !== undefined && newValue !== null) {
      updateResourceParameter(param.id, newValue, newIsMain);
    } else if (param.isMain !== newIsMain) {
      store.updateParameter(param.id, { isMain: newIsMain });
    }
  }
  
  // Собираем параметры для измерения (только отмеченные как основные)
  const parameters: Record<string, any> = {};
  for (const param of resourceParams.value) {
    if (paramIsMain[param.id]) {
      const value = paramValues[param.id];
      if (value !== undefined && value !== null) {
        const key = getParamKey(param.name);
        parameters[key] = value;
      }
    }
  }
  
  const data = {
    resourceId: selectedResourceId.value,
    nodeId: resource.nodeId,
    nodeName: resource.nodeName || '',
    resourceName: resource.name,
    mark: resource.mark || '',
    registrationNumber: resource.registrationNumber,
    measurementDate: form.measurementDate,
    parameters: parameters,
  };
  
  if (editMode.value && editId.value) {
    store.updateMeasurement(editId.value, data);
  } else {
    store.addMeasurement(data);
  }
  
  close();
  window.dispatchEvent(new Event('resource-saved'));
}

defineExpose({ open });
</script>

<style scoped>
.params-section {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #e0e4e8;
}
.params-section h4 {
  margin-bottom: 15px;
  font-size: 14px;
  color: #2c3e50;
}
.params-list {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 15px;
}
.param-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 6px;
}
.param-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 5px;
}
.param-name {
  font-weight: 500;
}
.param-unit {
  font-size: 12px;
  color: #6c757d;
}
.param-input {
  width: 120px;
}
.main-checkbox {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  white-space: nowrap;
}
.add-param-row {
  display: flex;
  gap: 10px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #e0e4e8;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}
</style>