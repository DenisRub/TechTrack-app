<template>
  <div class="modal-overlay" v-if="visible">
    <div class="modal-content" style="width: 500px;">
      <div class="modal-header">{{ isEdit ? 'Редактирование задачи' : 'Добавление задачи ТО' }}</div>
      
      <div class="form-group">
        <label>Агрегат*</label>
        <select v-model="form.nodeId" class="form-control">
          <option :value="null">-- Выберите агрегат --</option>
          <option v-for="node in availableNodes" :key="node.id" :value="node.id">
            {{ node.name }} ({{ node.type === 'aggregate' ? 'Агрегат' : 'Блок' }})
          </option>
        </select>
      </div>
      
      <div class="form-group">
        <label>Рекомендуемая дата ТО*</label>
        <input type="date" v-model="form.recommendedDate" class="form-control" />
      </div>
      
      <div class="form-group">
        <label>Тип обслуживания*</label>
        <select v-model="form.serviceType" class="form-control">
          <option value="плановое ТО">Плановое ТО</option>
          <option value="внеплановое ТО">Внеплановое ТО</option>
          <option value="капитальный ремонт">Капитальный ремонт</option>
          <option value="аварийный ремонт">Аварийный ремонт</option>
        </select>
      </div>
      
      <div class="form-group">
        <label>Статус</label>
        <select v-model="form.status" class="form-control">
          <option value="pending">Ожидает</option>
          <option value="in_progress">В работе</option>
          <option value="completed">Выполнено</option>
        </select>
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
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
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

const form = reactive({
  nodeId: null as number | null,
  recommendedDate: '',
  serviceType: 'плановое ТО' as const,
  status: 'pending' as const,
  notes: '',
});

function loadNodes() {
  availableNodes.value = equipmentStore.nodes.filter((n: any) => !n.isDeleted && n.type === 'aggregate');
}

function open(pId: number, task?: any) {
  loadNodes();
  planId.value = pId;
  reset();
  
  if (task) {
    isEdit.value = true;
    editId.value = task.id;
    form.nodeId = task.nodeId;
    form.recommendedDate = task.recommendedDate;
    form.serviceType = task.serviceType;
    form.status = task.status;
    form.notes = task.notes || '';
  }
  visible.value = true;
}

function reset() {
  form.nodeId = null;
  form.recommendedDate = new Date().toISOString().split('T')[0];
  form.serviceType = 'плановое ТО';
  form.status = 'pending';
  form.notes = '';
  error.value = '';
  isEdit.value = false;
  editId.value = null;
}

function close() {
  visible.value = false;
}

function save() {
  if (!form.nodeId || !form.recommendedDate) {
    error.value = 'Заполните обязательные поля';
    return;
  }
  
  const node = availableNodes.value.find(n => n.id === form.nodeId);
  const data = {
    planId: planId.value!,
    nodeId: form.nodeId,
    nodeName: node?.name || '',
    nodeLocation: node?.location || '',
    recommendedDate: form.recommendedDate,
    serviceType: form.serviceType,
    status: form.status,
    notes: form.notes,
  };
  
  if (isEdit.value && editId.value) {
    maintenanceStore.updateTask(editId.value, data);
  } else {
    maintenanceStore.addTask(data);
  }
  
  close();
  window.dispatchEvent(new Event('task-saved'));
}

defineExpose({ open });
</script>