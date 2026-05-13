<template>
  <div>
    <div class="resource-header">
      <h3>Ресурсы</h3>
      <div class="resource-actions">
        <button class="btn btn-sm btn-secondary" @click="goToResources">📊 Полный учёт</button>
        <button v-if="canEdit" class="btn btn-sm btn-primary" @click="$emit('add')">+ Добавить ресурс</button>
      </div>
    </div>

    <table class="data-table" v-if="resources.length">
      <thead>
        <tr>
          <th>Наименование</th>
          <th>Значение</th>
          <th>Ед. изм.</th>
          <th>Обновлено</th>
          <th v-if="canEdit">Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="res in resources" :key="res.id">
          <td>{{ res.name }}</td>
          <td>{{ res.value }}</td>
          <td>{{ res.unit || '-' }}</td>
          <td>{{ formatDate(res.updatedAt) }}</td>
          <td v-if="canEdit">
            <button class="btn btn-sm btn-secondary" @click="$emit('edit', res)">✏️</button>
            <button class="btn btn-sm btn-danger" @click="deleteResource(res.id)">🗑️</button>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-else class="empty-message">Ресурсы не добавлены</div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useEquipmentStore } from '../stores/equipmentStore';
import { formatDate } from '@/utils/dateUtils';

const props = defineProps<{ nodeId: number }>();
const emit = defineEmits(['add', 'edit']);
const router = useRouter();
const store = useEquipmentStore();

// Триггер для принудительного обновления (на случай, если computed не срабатывает)
const updateKey = ref(0);

const resources = computed(() => {
  // Принудительно пересчитываем при изменении updateKey
  updateKey.value;
  return store.getResourcesForNode(props.nodeId);
});

const canEdit = computed(() => {
  const user = localStorage.getItem('user');
  if (!user) return false;
  const role = JSON.parse(user).role;
  return role === 'operator' || role === 'admin';
});

function goToResources() {
  router.push({ path: '/resources', query: { nodeId: props.nodeId.toString() } });
}

async function deleteResource(id: number) {
  if (confirm('Удалить ресурс?')) {
    store.deleteResource(id);
    window.dispatchEvent(new Event('resource-saved'));
  }
}

// Слушаем событие обновления ресурсов
function handleResourceSaved() {
  updateKey.value++;
}
onMounted(() => {
  window.addEventListener('resource-saved', handleResourceSaved);
});
onUnmounted(() => {
  window.removeEventListener('resource-saved', handleResourceSaved);
});
</script>

<style scoped>
.resource-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.resource-actions {
  display: flex;
  gap: 8px;
}
.empty-message {
  color: #999;
  font-style: italic;
  padding: 10px;
}
</style>