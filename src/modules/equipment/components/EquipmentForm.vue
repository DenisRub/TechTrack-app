<template>
  <div class="modal-overlay" v-if="visible">
    <div class="modal-content" style="width: 600px;">
      <div class="modal-header">{{ isEdit ? 'Редактирование' : 'Добавление узла' }}</div>

      <div class="form-group">
        <label>Наименование*</label>
        <input v-model="form.name" class="form-control" />
      </div>

      <div class="form-group">
        <label>Тип</label>
        <select v-model="form.type" class="form-control">
          <option value="aggregate">Агрегат</option>
          <option value="block">Блок</option>
        </select>
      </div>

      <div class="form-group">
        <label>Вид узла</label>
        <select v-model="form.nodeTypeId" class="form-control" @change="onNodeTypeChange">
          <option :value="null">-- Не выбран --</option>
          <option v-for="type in store.nodeTypes" :key="type.id" :value="type.id">{{ type.name }}</option>
        </select>
      </div>

      <div class="form-group">
        <label>Местоположение</label>
        <input v-model="form.location" class="form-control" />
      </div>

      <div class="form-group">
        <label>Характеристики (JSON)</label>
        <textarea v-model="charStr" rows="3" class="form-control" placeholder='{"тип":"","чувствительность":""}'></textarea>
        <small class="text-muted">Введите валидный JSON</small>
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
import { useEquipmentStore } from '../stores/equipmentStore';

const store = useEquipmentStore();
const visible = ref(false);
const isEdit = ref(false);
const editId = ref<number | null>(null);
const error = ref('');

const form = reactive({
  name: '',
  type: 'block' as 'aggregate' | 'block',
  nodeTypeId: null as number | null,
  location: '',
  characteristics: {} as Record<string, any>,
});

const charStr = ref('{}');

function open(node?: any) {
  reset();
  if (node) {
    isEdit.value = true;
    editId.value = node.id;
    form.name = node.name;
    form.type = node.type;
    form.nodeTypeId = node.nodeTypeId ?? null;
    form.location = node.location || '';
    form.characteristics = node.characteristics || {};
    charStr.value = JSON.stringify(form.characteristics, null, 2);
  }
  visible.value = true;
}

function reset() {
  form.name = '';
  form.type = 'block';
  form.nodeTypeId = null;
  form.location = '';
  form.characteristics = {};
  charStr.value = '{}';
  error.value = '';
  isEdit.value = false;
  editId.value = null;
}

function close() { visible.value = false; }

function onNodeTypeChange() {
  const selected = store.nodeTypes.find(t => t.id === form.nodeTypeId);
  if (selected) {
    form.characteristics = JSON.parse(JSON.stringify(selected.characteristicsTemplate));
    charStr.value = JSON.stringify(form.characteristics, null, 2);
  }
}

function save() {
  if (!form.name) {
    error.value = 'Введите наименование';
    return;
  }
  try {
    form.characteristics = JSON.parse(charStr.value);
  } catch {
    error.value = 'Неверный формат JSON';
    return;
  }
  const data = {
    name: form.name,
    type: form.type,
    nodeTypeId: form.nodeTypeId,
    location: form.location,
    characteristics: form.characteristics,
    parentId: null,
  };
  if (isEdit.value && editId.value) {
    store.updateNode(editId.value, data);
  } else {
    store.addNode(data);
  }
  close();
  window.dispatchEvent(new Event('equipment-saved'));
}

defineExpose({ open });
</script>

<style scoped>
.text-muted {
  font-size: 12px;
  color: #6c757d;
}
</style>