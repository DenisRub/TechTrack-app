<template>
  <div style="margin-top: 20px">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px">
      <h3>Ресурсы</h3>
      <button v-if="canEdit" class="btn btn-sm btn-primary" @click="openAddForm">+ Добавить ресурс</button>
    </div>
    <table class="data-table" v-if="resources.length">
      <thead>
        <tr><th>Наименование</th><th>Значение</th><th>Ед. изм.</th><th>Обновлено</th><th>Действия</th></tr>
      </thead>
      <tbody>
        <tr v-for="res in resources" :key="res.id">
          <td>{{ res.name }}</td>
          <td>{{ res.value }}</td>
          <td>{{ res.unit || '-' }}</td>
          <td>{{ res.updatedAt }}</td>
          <td>
            <button class="btn btn-sm btn-secondary" @click="editResource(res)">✏️</button>
            <button class="btn btn-sm btn-danger" @click="deleteResource(res.id)">🗑️</button>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-else class="empty-message">Ресурсы не добавлены</div>

    <!-- Модальное окно для ресурса -->
    <div class="modal-overlay" v-if="showResourceForm">
      <div class="modal-content">
        <div class="modal-header">{{ isEdit ? 'Редактирование' : 'Добавление ресурса' }}</div>
        <div class="form-group"><label>Наименование</label><input v-model="resourceForm.name" class="form-control" /></div>
        <div class="form-group"><label>Значение</label><input v-model="resourceForm.value" class="form-control" /></div>
        <div class="form-group"><label>Единица измерения</label><input v-model="resourceForm.unit" class="form-control" /></div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeResourceForm">Отмена</button>
          <button class="btn btn-primary" @click="saveResource">Сохранить</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useResourcesStore } from '@/modules/resources/stores/resourcesStore'; // единый store

const props = defineProps<{ nodeId: number }>();
const store = useResourcesStore();

// Получаем ресурсы, привязанные к текущему узлу
const resources = computed(() => store.resources.filter(r => r.nodeId === props.nodeId));

const canEdit = computed(() => {
  const user = localStorage.getItem('user');
  if (!user) return false;
  const role = JSON.parse(user).role;
  return role === 'operator' || role === 'admin';
});

const showResourceForm = ref(false);
const isEdit = ref(false);
const editId = ref<number | null>(null);
const resourceForm = ref({ name: '', value: '', unit: '' });

function openAddForm() {
  isEdit.value = false;
  editId.value = null;
  resourceForm.value = { name: '', value: '', unit: '' };
  showResourceForm.value = true;
}
function editResource(res: any) {
  isEdit.value = true;
  editId.value = res.id;
  resourceForm.value = { name: res.name, value: res.value, unit: res.unit || '' };
  showResourceForm.value = true;
}
async function deleteResource(id: number) {
  if (confirm('Удалить ресурс?')) store.deleteResource(id);
}
function closeResourceForm() { showResourceForm.value = false; }
function saveResource() {
  const now = new Date().toISOString().split('T')[0]; // всегда строка
  const data = {
    nodeId: props.nodeId,
    name: resourceForm.value.name,
    value: resourceForm.value.value,
    unit: resourceForm.value.unit,
    registrationDate: now, // теперь точно string
  };
  if (isEdit.value && editId.value) {
    store.updateResource(editId.value, data);
  } else {
    store.addResource(data);
  }
  closeResourceForm();
}
</script>

<style scoped>
.empty-message { color: #999; font-style: italic; padding: 10px; }
</style>