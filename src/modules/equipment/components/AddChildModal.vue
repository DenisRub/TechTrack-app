<template>
  <div class="modal-overlay" v-if="visible">
    <div class="modal-content">
      <div class="modal-header">Добавление в состав</div>
      <div class="form-group">
        <label>Выберите узел</label>
        <select v-model="selectedChildId" class="form-control">
          <option :value="null">-- Выберите --</option>
          <option v-for="node in availableNodes" :key="node.id" :value="node.id">
            {{ node.name }} ({{ node.type === 'aggregate' ? 'Агрегат' : 'Блок' }})
          </option>
        </select>
      </div>
      <div v-if="error" class="error-text">{{ error }}</div>
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="close">Отмена</button>
        <button class="btn btn-primary" @click="add">Добавить</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useEquipmentStore } from '../stores/equipmentStore';

const store = useEquipmentStore();
const visible = ref(false);
const parentId = ref<number | null>(null);
const selectedChildId = ref<number | null>(null);
const error = ref('');

const availableNodes = computed(() => {
  if (!parentId.value) return [];
  // Все узлы, которые не удалены, не являются родителем и не уже в составе
  const existingChildIds = store.nodes.filter(n => n.parentId === parentId.value).map(n => n.id);
  return store.nodes.filter(n => 
    !n.isDeleted && 
    n.id !== parentId.value && 
    !existingChildIds.includes(n.id)
  );
});

function open(pId: number) {
  parentId.value = pId;
  selectedChildId.value = null;
  error.value = '';
  visible.value = true;
}
function close() { visible.value = false; }
function add() {
  if (!selectedChildId.value) {
    error.value = 'Выберите узел';
    return;
  }
  const success = store.addChild(parentId.value!, selectedChildId.value);
  if (success) {
    close();
    window.dispatchEvent(new Event('equipment-saved'));
  } else {
    error.value = 'Не удалось добавить узел (проверьте циклы или совместимость)';
  }
}
defineExpose({ open });
</script>