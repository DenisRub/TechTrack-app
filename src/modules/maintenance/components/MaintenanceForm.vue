<template>
  <div class="modal-overlay" v-if="visible">
    <div class="modal-content" style="width: 550px;">
      <div class="modal-header">{{ isEdit ? 'Редактирование плана' : 'Создание плана ТО' }}</div>
      
      <div class="form-group">
        <label>Название плана</label>
        <input v-model="form.name" class="form-control" />
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label>Дата начала*</label>
          <input type="date" v-model="form.startDate" class="form-control" />
        </div>
        <div class="form-group">
          <label>Дата окончания*</label>
          <input type="date" v-model="form.endDate" class="form-control" />
        </div>
      </div>
      
      <div class="form-group">
        <label>Описание</label>
        <textarea v-model="form.description" rows="2" class="form-control"></textarea>
      </div>
      
      <!-- Индикатор процесса авто-генерации -->
      <div v-if="generating" class="auto-message generating">
        🔄 Анализ оборудования и формирование плана...
      </div>
      <div v-if="autoMessage" class="auto-message success">
        ✅ {{ autoMessage }}
      </div>
      
      <div v-if="error" class="error-text">{{ error }}</div>
      
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="close">Отмена</button>
        <button class="btn btn-primary" @click="save" :disabled="generating">Сохранить</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useMaintenanceStore } from '../stores/maintenanceStore';

const store = useMaintenanceStore();
const visible = ref(false);
const isEdit = ref(false);
const editId = ref<number | null>(null);
const error = ref('');
const autoMessage = ref('');
const generating = ref(false);

const form = reactive({
  name: '',
  startDate: '',
  endDate: '',
  description: '',
});

function open(plan?: any) {
  reset();
  if (plan) {
    isEdit.value = true;
    editId.value = plan.id;
    form.name = plan.name;
    form.startDate = plan.startDate;
    form.endDate = plan.endDate;
    form.description = plan.description || '';
  }
  visible.value = true;
}

function reset() {
  form.name = '';
  form.startDate = '';
  form.endDate = '';
  form.description = '';
  error.value = '';
  autoMessage.value = '';
  generating.value = false;
  isEdit.value = false;
  editId.value = null;
}

function close() {
  visible.value = false;
}

async function save() {
  if (!form.startDate || !form.endDate) {
    error.value = 'Укажите дату начала и окончания плана';
    return;
  }
  
  generating.value = true;
  autoMessage.value = '';
  error.value = '';
  
  try {
    if (isEdit.value && editId.value) {
      // Редактирование существующего плана
      await store.updatePlan(editId.value, {
        name: form.name,
        startDate: form.startDate,
        endDate: form.endDate,
        description: form.description,
      });
      autoMessage.value = 'План обновлён';
    } else {
      // Создание нового плана с авто-генерацией
      const planData = {
        name: form.name || `План ТО на ${new Date(form.startDate).getFullYear()} год`,
        startDate: form.startDate,
        endDate: form.endDate,
        description: form.description,
      };
      
      // Сохраняем план с автоматической генерацией задач
      const newPlan = await store.addPlan(planData, true);
      const tasksCount = store.getTasksForPlan(newPlan.id).length;
      autoMessage.value = `План создан! Сформировано ${tasksCount} задач(а) на обслуживание.`;
    }
    
    setTimeout(() => close(), 1500);
  } catch (err) {
    console.error('Ошибка сохранения плана:', err);
    error.value = 'Ошибка при сохранении плана';
  } finally {
    generating.value = false;
  }
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
.auto-message {
  margin: 12px 0;
  padding: 10px;
  border-radius: 6px;
  font-size: 13px;
}
.auto-message.generating {
  background-color: #e3f2fd;
  color: #1976d2;
}
.auto-message.success {
  background-color: #e8f5e9;
  color: #2e7d32;
}
</style>