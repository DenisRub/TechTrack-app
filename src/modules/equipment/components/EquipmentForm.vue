<template>
  <div class="modal-overlay" v-if="visible" @click.self="close">
    <div class="modal-content" style="width: 800px;">
      <div class="modal-header">{{ isEdit ? 'Редактирование узла' : 'Добавление узла' }}</div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        <!-- Левая колонка -->
        <div>
          <div class="form-group">
            <label>Наименование*</label>
            <input v-model="form.name" class="form-control" autofocus />
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
          <div class="form-group">
            <label>Заводской номер</label>
            <input v-model="form.serialNumber" class="form-control" />
          </div>
          <div class="form-group">
            <label>Инвентарный номер</label>
            <input v-model="form.inventoryNumber" class="form-control" />
          </div>
          <div class="form-group">
            <label>Учётный номер</label>
            <input v-model="form.accountingNumber" class="form-control" />
          </div>
        </div>

        <!-- Правая колонка -->
        <div>
          <div class="form-group">
            <label>Дата производства</label>
            <input type="date" v-model="form.dateManufacture" class="form-control" />
          </div>
          <div class="form-group">
            <label>Дата установки</label>
            <input type="date" v-model="form.dateInstallation" class="form-control" />
          </div>
          <div class="form-group">
            <label>Режим работы</label>
            <input v-model="form.operationMode" class="form-control" />
          </div>
          <div class="form-group">
            <label>СИ (средство измерения)</label>
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
            <textarea v-model="form.note" rows="2" class="form-control"></textarea>
          </div>
        </div>
      </div>

      <!-- Характеристики JSON -->
      <div class="form-group">
        <label>Характеристики (JSON)</label>
        <textarea
          v-model="charStr"
          rows="6"
          class="form-control"
          placeholder='{\n  "Параметр1": {"value": "значение", "unit": "ед.", "isMain": true},\n  "Параметр2": {"value": "123", "unit": "шт", "isMain": false}\n}'
        ></textarea>
        <small class="text-muted">Введите валидный JSON. Поля isMain=true будут отображаться в блоке "Параметры" карточки.</small>
      </div>

      <div v-if="error" class="error-text">{{ error }}</div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="close">Отмена</button>
        <button class="btn btn-primary" :disabled="saving" @click="save">
          {{ saving ? 'Сохранение...' : 'Сохранить' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useEquipmentStore } from '../stores/equipmentStore';

const store = useEquipmentStore();

function getCurrentDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const visible = ref(false);
const isEdit = ref(false);
const editId = ref<number | null>(null);
const error = ref('');
const saving = ref(false);

const form = reactive({
  name: '',
  type: 'block' as 'aggregate' | 'block',
  nodeTypeId: null as number | null,
  subsystem: '',
  manufacturer: '',
  model: '',
  serialNumber: '',
  inventoryNumber: '',
  accountingNumber: '',
  dateManufacture: '',
  dateInstallation: '',
  operationMode: '',
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
  form.accountingNumber = '';
  form.dateManufacture = '';
  form.dateInstallation = '';
  form.operationMode = '';
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
    form.accountingNumber = editNode.accountingNumber || '';
    form.dateManufacture = editNode.dateManufacture || '';
    form.dateInstallation = editNode.dateInstallation || '';
    form.operationMode = editNode.operationMode || '';
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
  resetForm();
}

function validate(): boolean {
  if (!form.name.trim()) {
    error.value = 'Введите наименование';
    return false;
  }
  try {
    JSON.parse(charStr.value);
  } catch {
    error.value = 'Неверный формат JSON';
    return false;
  }
  return true;
}

async function save() {
  if (!validate()) return;
  saving.value = true;
  error.value = '';

  try {
    form.characteristics = JSON.parse(charStr.value);
  } catch {
    error.value = 'Неверный формат JSON';
    saving.value = false;
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
    accountingNumber: form.accountingNumber,
    dateManufacture: form.dateManufacture,
    dateInstallation: form.dateInstallation,
    operationMode: form.operationMode,
    isSI: form.isSI,
    condition: form.condition,
    resource: form.resource,
    location: form.location,
    note: form.note,
    parentId: form.parentId,
    characteristics: form.characteristics,
  };

  if (isEdit.value && editId.value) {
    store.updateNode(editId.value, data);
  } else {
    store.addNode(data);
  }
  window.dispatchEvent(new Event('equipment-saved'));
  close();
  saving.value = false;
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