<template>
  <div class="modal-overlay" v-if="visible">
    <div class="modal-content" style="width: 500px;">
      <div class="modal-header">{{ isEdit ? 'Редактирование задачи' : 'Добавление задачи ТО' }}</div>
      
      <div class="form-group">
        <label>Оборудование*</label>
        <select v-model="formData.nodeId" class="form-control">
          <option :value="null">-- Выберите оборудование --</option>
          <option v-for="node in availableNodes" :key="node.id" :value="node.id">
            {{ node.name }} ({{ node.type === 'aggregate' ? 'Агрегат' : 'Блок' }})
          </option>
        </select>
      </div>
      
      <div class="form-group">
        <label>Рекомендуемая дата ТО*</label>
        <input type="date" v-model="formData.recommendedDate" class="form-control" />
      </div>
      
      <div class="form-group">
        <label>Тип обслуживания*</label>
        <select v-model="formData.serviceType" class="form-control">
          <option value="плановое ТО">Плановое ТО</option>
          <option value="внеплановое ТО">Внеплановое ТО</option>
          <option value="капитальный ремонт">Капитальный ремонт</option>
          <option value="аварийный ремонт">Аварийный ремонт</option>
        </select>
      </div>
      
      <div class="form-group">
        <label>Статус</label>
        <select v-model="formData.status" class="form-control">
          <option value="pending">Ожидает</option>
          <option value="in_progress">В работе</option>
          <option value="completed">Выполнено</option>
          <option value="not_completed">Не выполнено</option>
        </select>
      </div>
      
      <div class="form-group">
        <label>Примечания</label>
        <textarea v-model="formData.notes" rows="2" class="form-control"></textarea>
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
import { ref, reactive } from 'vue';
import { useMaintenanceStore } from '../stores/maintenanceStore';
import { useEquipmentStore } from '@/modules/equipment/stores/equipmentStore';

const maintenanceStore = useMaintenanceStore();
const equipmentStore = useEquipmentStore();
const visible = ref(false);
const isEdit = ref(false);
const editId = ref<number | null>(null);
const planId = ref<number | null>(null);
const error = ref('');
const availableNodes = ref<any[]>([]);

// Форма с данными
const formData = reactive({
  nodeId: null as number | null,
  recommendedDate: '',
  serviceType: 'плановое ТО' as const,
  status: 'pending' as const,
  notes: '',
});

// Функция для получения текущей даты в формате YYYY-MM-DD
function getCurrentDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Загрузка доступного оборудования (только блоки, не агрегаты)
function loadNodes() {
  availableNodes.value = equipmentStore.nodes.filter((n: any) => !n.isDeleted && n.type === 'block');
  console.log('Загружено оборудование для задачи:', availableNodes.value.length);
}

function open(pId: number, task?: any) {
  console.log('open вызван, planId:', pId, 'task:', task);
  loadNodes();
  planId.value = pId;
  reset();
  
  if (task) {
    isEdit.value = true;
    editId.value = task.id;
    formData.nodeId = task.nodeId;
    formData.recommendedDate = task.recommendedDate;
    formData.serviceType = task.serviceType;
    formData.status = task.status;
    formData.notes = task.notes || '';
    console.log('Редактирование задачи:', task);
  }
  visible.value = true;
}

function reset() {
  formData.nodeId = null;
  formData.recommendedDate = getCurrentDate();
  formData.serviceType = 'плановое ТО';
  formData.status = 'pending';
  formData.notes = '';
  error.value = '';
  isEdit.value = false;
  editId.value = null;
}

function close() {
  visible.value = false;
}

function save() {
  console.log('save вызван, formData:', formData);
  
  if (!formData.nodeId) {
    error.value = 'Выберите оборудование';
    return;
  }
  if (!formData.recommendedDate) {
    error.value = 'Укажите рекомендуемую дату ТО';
    return;
  }
  
  const node = availableNodes.value.find(n => n.id === formData.nodeId);
  if (!node) {
    error.value = 'Оборудование не найдено';
    return;
  }
  
  const data = {
    planId: planId.value!,
    nodeId: formData.nodeId,
    nodeName: node.name,
    nodeLocation: node.location || '',
    recommendedDate: formData.recommendedDate,
    serviceType: formData.serviceType,
    status: formData.status,
    notes: formData.notes || '',
  };
  
  console.log('Сохраняемые данные:', data);
  
  if (isEdit.value && editId.value) {
    maintenanceStore.updateTask(editId.value, data);
    console.log('Задача обновлена');
  } else {
    maintenanceStore.addTask(data);
    console.log('Задача добавлена');
  }
  
  close();
  window.dispatchEvent(new Event('task-saved'));
}

defineExpose({ open });
</script>