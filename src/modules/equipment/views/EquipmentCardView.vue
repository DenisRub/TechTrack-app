<template>
  <div class="card" v-if="node">
    <div style="display: flex; justify-content: space-between; margin-bottom: 20px">
      <h2>{{ node.name }}</h2>
      <div>
        <button class="btn btn-secondary" @click="goBack">← Назад</button>
        <button v-if="canEdit" class="btn btn-primary" @click="editNode">Редактировать</button>
        <button v-if="canEdit" class="btn btn-danger" @click="deleteNode">Списать</button>
        <button v-if="canEdit" class="btn btn-secondary" @click="openMoveModal">📦 Переместить</button>
        <button class="btn btn-secondary" @click="goToResources">📊 Ресурсы</button>
        <button class="btn btn-secondary" @click="goToSI">📏 СИ</button>
      </div>
    </div>

    <!-- Основные сведения -->
    <table style="width: 100%">
      <tr><td style="width: 200px"><strong>ID</strong></td><td>{{ node.id }}</td></tr>
      <tr><td><strong>Тип</strong></td><td>{{ node.type === 'aggregate' ? 'Агрегат' : 'Блок' }}</td></tr>
      <tr><td><strong>Местоположение</strong></td><td>{{ node.location || '-' }}</td></tr>
      <tr><td><strong>Характеристики</strong></td><td><pre>{{ JSON.stringify(node.characteristics, null, 2) }}</pre></td></tr>
      <tr><td><strong>Дата создания</strong></td><td>{{ node.createdAt }}</td></tr>
      <tr><td><strong>Дата обновления</strong></td><td>{{ node.updatedAt }}</td></tr>
    </table>

    <!-- Состав (только для агрегатов) -->
    <div v-if="node.type === 'aggregate'" style="margin-top: 20px">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px">
        <h3>Состав</h3>
        <button v-if="canEdit" class="btn btn-sm btn-primary" @click="openAddChildModal">+ Добавить в состав</button>
      </div>
      <table class="data-table" v-if="children.length">
        <thead>
          <tr><th>ID</th><th>Наименование</th><th>Тип</th><th>Действия</th></tr>
        </thead>
        <tbody>
          <tr v-for="child in children" :key="child.id">
            <td>{{ child.id }}</td>
            <td>{{ child.name }}</td>
            <td>{{ child.type === 'aggregate' ? 'Агрегат' : 'Блок' }}</td>
            <td>
              <button class="btn btn-sm btn-secondary" @click="viewChild(child.id)">Открыть</button>
              <button v-if="canEdit" class="btn btn-sm btn-danger" @click="removeChild(child.id)">Удалить из состава</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty-message">Нет дочерних узлов</div>
    </div>

    <!-- Ресурсы -->
    <ResourceList :nodeId="node.id" />

    <!-- История перемещений -->
    <div style="margin-top: 20px">
      <h3>История перемещений</h3>
      <table class="data-table" v-if="moveHistory.length">
        <thead>
          <tr><th>Дата</th><th>Откуда</th><th>Куда</th><th>Пользователь</th></tr>
        </thead>
        <tbody>
          <tr v-for="rec in moveHistory" :key="rec.id">
            <td>{{ rec.date }}</td>
            <td>{{ rec.fromLocation || '-' }}</td>
            <td>{{ rec.toLocation }}</td>
            <td>{{ rec.userId || '-' }}</td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty-message">История перемещений пуста</div>
    </div>

    <!-- Модальное окно перемещения -->
    <div class="modal-overlay" v-if="showMoveModal">
      <div class="modal-content">
        <div class="modal-header">Перемещение узла</div>
        <div class="form-group">
          <label>Новое местоположение (текст)</label>
          <input v-model="newLocation" class="form-control" />
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeMoveModal">Отмена</button>
          <button class="btn btn-primary" @click="saveMove">Переместить</button>
        </div>
      </div>
    </div>

    <!-- Модальные окна -->
    <EquipmentForm ref="formRef" @saved="refresh" />
    <AddChildModal ref="addChildModalRef" @added="refresh" />
    <ConfirmDialog ref="confirmDialog" />
  </div>
  <div v-else class="card">Загрузка...</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useEquipmentStore } from '../stores/equipmentStore';
import EquipmentForm from '../components/EquipmentForm.vue';
import AddChildModal from '../components/AddChildModal.vue';
import ResourceList from '../components/ResourceList.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';

const route = useRoute();
const router = useRouter();
const store = useEquipmentStore();

const formRef = ref();
const addChildModalRef = ref();
const confirmDialog = ref();

const node = ref<any>(null);
const children = ref<any[]>([]);
const moveHistory = ref<any[]>([]);
const showMoveModal = ref(false);
const newLocation = ref('');

const canEdit = computed(() => {
  const user = localStorage.getItem('user');
  if (!user) return false;
  try {
    const role = JSON.parse(user).role;
    return role === 'operator' || role === 'admin';
  } catch {
    return false;
  }
});

function load() {
  const id = Number(route.params.id);
  node.value = store.getNode(id);
  if (node.value) {
    children.value = store.nodes.filter((n: any) => n.parentId === id && !n.isDeleted);
    moveHistory.value = store.getMoveHistoryForNode(id);
  }
}

function goBack() { router.back(); }
function editNode() { formRef.value?.open(node.value); }
async function deleteNode() {
  const ok = await confirmDialog.value?.show('Списание', 'Списать узел?');
  if (ok) {
    store.deleteNode(node.value.id);
    router.back();
  }
}
function openAddChildModal() { addChildModalRef.value?.open(node.value.id); }
function viewChild(id: number) { router.push(`/equipment/${id}`); }
async function removeChild(childId: number) {
  const ok = await confirmDialog.value?.show('Удаление из состава', 'Удалить узел из состава?');
  if (ok) store.removeChild(node.value.id, childId);
}
function refresh() { load(); }

// Перемещение
function openMoveModal() {
  newLocation.value = node.value.location || '';
  showMoveModal.value = true;
}
function closeMoveModal() { showMoveModal.value = false; }
function saveMove() {
  const oldLocation = node.value.location || '';
  if (newLocation.value !== oldLocation) {
    store.updateNode(node.value.id, { location: newLocation.value });
    store.addMoveRecord(node.value.id, oldLocation, newLocation.value);
    refresh();
  }
  closeMoveModal();
}

// Переход к модулям
function goToResources() {
  router.push(`/resources?nodeId=${node.value.id}`);
}

function goToSI() {
  router.push(`/si?nodeId=${node.value.id}`);
}

onMounted(() => {
  load();
  window.addEventListener('equipment-saved', refresh);
  window.addEventListener('resource-saved', refresh);
});
</script>

<style scoped>
pre { background: #f8f9fa; padding: 8px; border-radius: 4px; font-size: 12px; }
.empty-message { color: #999; font-style: italic; padding: 10px; }
</style>