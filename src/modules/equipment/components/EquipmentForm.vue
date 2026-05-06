<template>
  <div class="modal-overlay" v-if="visible">
    <div class="modal-content" style="width: 750px;">
      <div class="modal-header">{{ isEdit ? 'Редактирование узла' : 'Добавление узла' }}</div>


      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        <div>
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
            <label>Подсистема</label>
            <input v-model="form.subsystem" class="form-control" />
          </div>
          <div class="form-group">
            <label>Производитель</label>
            <input v-model="form.manufacturer" class="form-control" />
          </div>
          <div class="form-group">
            <label>Марка</label>
            <input v-model="form.model" class="form-control" />
          </div>
        </div>

        <div>
          <div class="form-group">
            <label>Зав. №</label>
            <input v-model="form.serialNumber" class="form-control" />
          </div>
          <div class="form-group">
            <label>Инв. №</label>
            <input v-model="form.inventoryNumber" class="form-control" />
          </div>
          <div class="form-group">
            <label>СИ</label>
            <select v-model="form.isSI" class="form-control">
              <option :value="false">нет</option>
              <option :value="true">да</option>
            </select>
          </div>
          <div class="form-group">
            <label>Состояние</label>
            <input v-model="form.condition" class="form-control" />
          </div>
          <div class="form-group">
            <label>Ресурс</label>
            <input v-model="form.resource" class="form-control" />
          </div>
          <div class="form-group">
            <label>Размещение</label>
            <input v-model="form.location" class="form-control" />
          </div>
          <div class="form-group">
            <label>Примечание</label>
            <textarea v-model="form.note" class="form-control" rows="2"></textarea>
          </div>
        </div>
      </div>

      <!-- Характеристики: textarea с валидацией JSON -->
      <div class="form-group">
        <label>Характеристики (JSON)</label>
        <textarea
          v-model="charStr"
          rows="6"
          class="form-control"
          placeholder='{\n  "Напряжение питания": {\n    "value": "220В",\n    "unit": "В",\n    "isMain": true\n  }\n}'
        ></textarea>
        <small class="text-muted">Введите валидный JSON. Используйте формат: {"параметр": {"value": "значение", "unit": "ед.", "isMain": true/false}}</small>
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
  subsystem: '',
  manufacturer: '',
  model: '',
  serialNumber: '',
  inventoryNumber: '',
  isSI: false,
  condition: '',
  resource: '',
  location: '',
  note: '',
  parentId: null as number | null,
  characteristics: {} as Record<string, any>,
});

const charStr = ref('{}');

function onNodeTypeChange() {
  const selected = store.nodeTypes.find(t => t.id === form.nodeTypeId);
  if (selected && selected.characteristicsTemplate) {
    form.characteristics = JSON.parse(JSON.stringify(selected.characteristicsTemplate));
    charStr.value = JSON.stringify(form.characteristics, null, 2);
  }
}

function resetForm() {
  form.name = '';
  form.type = 'block';
  form.nodeTypeId = null;
  form.subsystem = '';
  form.manufacturer = '';
  form.model = '';
  form.serialNumber = '';
  form.inventoryNumber = '';
  form.isSI = false;
  form.condition = '';
  form.resource = '';
  form.location = '';
  form.note = '';
  form.parentId = null;
  form.characteristics = {};
  charStr.value = '{}';
  error.value = '';
  isEdit.value = false;
  editId.value = null;
}

function open(editNode?: any, parentId?: number) {
  resetForm();
  if (editNode) {
    isEdit.value = true;
    editId.value = editNode.id;
    form.name = editNode.name || '';
    form.type = editNode.type || 'block';
    form.nodeTypeId = editNode.nodeTypeId ?? null;
    form.subsystem = editNode.subsystem || '';
    form.manufacturer = editNode.manufacturer || '';
    form.model = editNode.model || '';
    form.serialNumber = editNode.serialNumber || '';
    form.inventoryNumber = editNode.inventoryNumber || '';
    form.isSI = editNode.isSI ?? false;
    form.condition = editNode.condition || '';
    form.resource = editNode.resource || '';
    form.location = editNode.location || '';
    form.note = editNode.note || '';
    form.parentId = editNode.parentId ?? null;
    form.characteristics = editNode.characteristics || {};
    charStr.value = JSON.stringify(form.characteristics, null, 2);
  } else if (parentId) {
    form.parentId = parentId;
  }
  visible.value = true;
}

function close() {
  visible.value = false;
}

function save() {
  if (!form.name) {
    error.value = 'Введите наименование';
    return;
  }
  try {
    form.characteristics = JSON.parse(charStr.value);
  } catch {
    error.value = 'Неверный формат JSON. Проверьте синтаксис (кавычки, запятые).';
    return;
  }
  const data = {
    name: form.name,
    type: form.type,
    nodeTypeId: form.nodeTypeId,
    subsystem: form.subsystem,
    manufacturer: form.manufacturer,
    model: form.model,
    serialNumber: form.serialNumber,
    inventoryNumber: form.inventoryNumber,
    isSI: form.isSI,
    condition: form.condition,
    resource: form.resource,
    location: form.location,
    note: form.note,
    characteristics: form.characteristics,
    parentId: form.parentId,
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
.modal-content {
  max-width: 90vw;
}
</style>