<template>
  <div class="card" v-if="node">
    <div class="card-header">
      <h2>{{ node.name }}</h2>
      <div class="action-buttons">
        <button class="btn btn-secondary" @click="goBack">← Назад</button>
        <button v-if="canEdit" class="btn btn-primary" @click="editNode">Редактировать</button>
        <button v-if="canEdit" class="btn btn-danger" @click="deleteNode">Списать</button>
        <button v-if="canEdit" class="btn btn-secondary" @click="openMoveModal">📦 Переместить</button>
      </div>
    </div>

    <!-- Основные сведения -->
    <div class="info-grid">
      <div class="info-col">
        <div class="info-row"><strong>Марка</strong><span>{{ node.model || '-' }}</span></div>
        <div class="info-row"><strong>Наименование</strong><span>{{ node.name }}</span></div>
        <div class="info-row"><strong>Подсистема</strong><span>{{ node.subsystem || '-' }}</span></div>
        <div class="info-row"><strong>Производитель</strong><span>{{ node.manufacturer || '-' }}</span></div>
        <div class="info-row"><strong>Дата установки</strong><span>{{ formatDate(node.dateInstallation) }}</span></div>
        <div class="info-row"><strong>Состояние</strong><span>{{ node.condition || '-' }}</span></div>
        <div class="info-row"><strong>Заводской номер</strong><span>{{ node.serialNumber || '-' }}</span></div>
        <div class="info-row"><strong>Учётный номер</strong><span>{{ node.accountingNumber || '-' }}</span></div>
        <div class="info-row"><strong>Режим работы</strong><span>{{ node.operationMode || '-' }}</span></div>
      </div>
      <div class="info-col">
        <div class="info-row"><strong>Тип</strong><span>{{ node.type === 'aggregate' ? 'Агрегат' : 'Блок' }}</span></div>
        <div class="info-row"><strong>Узел</strong><span v-if="node.parentId" class="clickable-link" @click="goToParent">{{ getParentName() }}</span><span v-else>-</span></div>
        <div class="info-row"><strong>Размещение</strong><span>{{ node.location || '-' }}</span></div>
        <div class="info-row"><strong>Дата производства</strong><span>{{ formatDate(node.dateManufacture) }}</span></div>
        <div class="info-row"><strong>Ресурс</strong><span>{{ node.resource || '-' }}</span></div>
        <div class="info-row"><strong>СИ</strong><span>{{ node.isSI ? 'да' : 'нет' }}</span></div>
        <div class="info-row"><strong>Инвентарный номер</strong><span>{{ node.inventoryNumber || '-' }}</span></div>
        <div class="info-row"><strong>Агрегат</strong><span>{{ node.type === 'aggregate' ? 'да' : 'нет' }}</span></div>
      </div>
    </div>

    <!-- Параметры -->
    <div class="section">
      <h3>Параметры</h3>
      <table class="data-table" v-if="Object.keys(mainParams).length">
        <thead><tr><th>Параметр</th><th>Значение</th><th>Ед. изм.</th><th>Основной</th></tr></thead>
        <tbody>
          <tr v-for="(param, name) in mainParams" :key="name">
            <td>{{ name }}</td>
            <td>{{ param.value }}</td>
            <td>{{ param.unit || '-' }}</td>
            <td>{{ param.isMain ? '✓' : '' }}</td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty-message">Параметры не заданы</div>
    </div>

    <!-- Состав (дочерние узлы) -->
    <div v-if="node.type === 'aggregate'" class="section">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px">
        <h3>Состав (дочерние узлы)</h3>
        <button v-if="canEdit" class="btn btn-sm btn-primary" @click="openAddChildModal">+ Добавить в состав</button>
      </div>
      <table class="data-table" v-if="children.length">
        <thead>
          <tr>
            <th>Наименование</th>
            <th>Тип</th>
            <th>Производитель</th>
            <th>Марка</th>
            <th>Основные параметры</th>
            <th>Примечания</th>
            <th v-if="canEdit">Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="child in children" :key="child.id">
            <td><span class="clickable-link" @click="viewChild(child.id)">{{ child.name }}</span></td>
            <td>{{ child.type === 'aggregate' ? 'Агрегат' : 'Блок' }}</td>
            <td>{{ child.manufacturer || '-' }}</td>
            <td>{{ child.model || '-' }}</td>
            <td>{{ getMainParamsShort(child) }}</td>
            <td>{{ child.note || '-' }}</td>
            <td v-if="canEdit">
              <button class="btn btn-sm btn-danger" @click="removeChild(child.id)">Удалить из состава</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty-message">Нет дочерних узлов</div>
    </div>

  <!-- Ресурсы -->
<div class="section">
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px">
    <h3>Ресурсы</h3>
    <div>
      <button class="btn btn-sm btn-secondary" @click="goToResources">📊 Полный учёт ресурсов</button>
      <button v-if="canEdit" class="btn btn-sm btn-primary" @click="openAddResourceForm">+ Добавить ресурс</button>
    </div>
  </div>
  <div v-if="resources.length">
    <table class="data-table">
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
            <button class="btn btn-sm btn-secondary" @click="editResource(res)">✏️</button>
            <button class="btn btn-sm btn-danger" @click="deleteResource(res.id)">🗑️</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <div v-else class="empty-message">Ресурсы не добавлены</div>
</div>
<!-- История перемещений -->
<div v-if="moveHistory.length" class="section">
  <h3>История перемещений</h3>
  <table class="data-table">
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
</div>
    <!-- История комплектаций -->
    <div class="section" v-if="compositionHistory.length">
      <h3>История комплектаций</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>Дата</th>
            <th>Действие</th>
            <th>Узел</th>
            <th>Пользователь</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="rec in compositionHistory" :key="rec.id">
            <td>{{ rec.date }}</td>
            <td>{{ rec.action === 'add' ? '➕ Добавлен в состав' : '➖ Удалён из состава' }}</td>
            <td>{{ getChildName(rec.childId) }} (ID {{ rec.childId }})</td>
            <td>{{ rec.userId || '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    

    <!-- Модальные окна -->
    <EquipmentForm ref="formRef" @saved="refresh" />
    <AddChildModal ref="addChildModalRef" @added="refresh" />
    <ConfirmDialog ref="confirmDialog" />
    <ResourceForm ref="resourceFormRef" @saved="refresh" />

    <!-- Модальное окно перемещения -->
    <div class="modal-overlay" v-if="showMoveModal">
      <div class="modal-content">
        <div class="modal-header">Перемещение узла</div>
        <div class="form-group"><label>Новое местоположение</label><input v-model="newLocation" class="form-control" /></div>
        <div class="modal-footer"><button class="btn btn-secondary" @click="closeMoveModal">Отмена</button><button class="btn btn-primary" @click="saveMove">Переместить</button></div>
      </div>
    </div>
  </div>
  <div v-else class="card">Загрузка...</div>
</template>


<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useEquipmentStore } from '../stores/equipmentStore';
import EquipmentForm from '../components/EquipmentForm.vue';
import AddChildModal from '../components/AddChildModal.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import ResourceForm from '../components/ResourceForm.vue';
import { formatDate } from '@/utils/dateUtils';

const route = useRoute();
const router = useRouter();
const store = useEquipmentStore();

const formRef = ref();
const addChildModalRef = ref();
const confirmDialog = ref();
const resourceFormRef = ref();
const node = ref<any>(null);
const children = ref<any[]>([]);
const resources = ref<any[]>([]);
const moveHistory = ref<any[]>([]);
const compositionHistory = ref<any[]>([]);
const showMoveModal = ref(false);
const newLocation = ref('');

const canEdit = computed(() => {
  const user = localStorage.getItem('user');
  if (!user) return false;
  const role = JSON.parse(user).role;
  return role === 'operator' || role === 'admin';
});

interface CharacteristicValue {
  value: string | number;
  unit?: string;
  isMain?: boolean;
}

const mainParams = computed(() => {
  if (!node.value?.characteristics) return {};
  const chars = node.value.characteristics as Record<string, CharacteristicValue>;
  return Object.fromEntries(Object.entries(chars).filter(([_, val]) => val?.isMain === true));
});

function getMainParamsShort(child: any) {
  if (!child.characteristics) return '';
  const mains = Object.entries(child.characteristics)
    .filter(([_, val]: any) => val?.isMain === true)
    .map(([key, val]: any) => `${key}: ${val.value} ${val.unit || ''}`.trim())
    .join(', ');
  return mains || '-';
}

function getParentName() {
  if (!node.value.parentId) return '-';
  const parent = store.getNode(node.value.parentId);
  return parent ? parent.name : '-';
}

function goToParent() {
  if (node.value && node.value.parentId) {
    router.push(`/equipment/${node.value.parentId}`);
  }
}

function getChildName(childId: number): string {
  const childNode = store.getNode(childId);
  return childNode ? childNode.name : `Узел ${childId}`;
}

function loadById(id?: number) {
  const targetId = id ?? Number(route.params.id);
  node.value = store.getNode(targetId);
  if (node.value) {
    children.value = store.nodes.filter((n: any) => n.parentId === targetId && !n.isDeleted);
    resources.value = store.getResourcesForNode(targetId);
    moveHistory.value = store.getMoveHistoryForNode(targetId);      // ✅
    compositionHistory.value = store.getCompositionHistoryForNode(targetId); // ✅
  }
}

function refresh() {
  loadById();
}

function goBack() {
  router.push('/equipment');
}

function editNode() {
  formRef.value?.open(node.value);
}

function viewChild(id: number) {
  const childNode = store.getNode(id);
  if (childNode && childNode.isSI) {
    router.push({ path: '/si', query: { nodeId: id.toString() } });
  } else {
    router.push(`/equipment/${id}`);
  }
}

async function deleteNode() {
  const ok = await confirmDialog.value?.show('Списание', 'Списать узел?');
  if (ok) {
    store.deleteNode(node.value.id);
    router.push('/equipment');
  }
}

function openMoveModal() {
  newLocation.value = node.value.location || '';
  showMoveModal.value = true;
}
function closeMoveModal() {
  showMoveModal.value = false;
}
function saveMove() {
  const oldLocation = node.value.location || '';
  if (newLocation.value !== oldLocation) {
    store.updateNode(node.value.id, { location: newLocation.value });
    store.addMoveRecord(node.value.id, oldLocation, newLocation.value);
    refresh();
  }
  closeMoveModal();
}

function openAddChildModal() {
  if (node.value) {
    addChildModalRef.value?.open(node.value.id);
  }
}
async function removeChild(childId: number) {
  const ok = await confirmDialog.value?.show('Удаление из состава', 'Удалить узел из состава?');
  if (ok) {
    store.removeChild(node.value.id, childId);
    refresh();
  }
}

function openAddResourceForm() {
  if (node.value) {
    resourceFormRef.value?.open(node.value.id);
  }
}
function goToResources() {
  router.push({ path: '/resources', query: { nodeId: node.value.id.toString() } });
}
async function editResource(res: any) {
  resourceFormRef.value?.open(node.value.id, res);
}
async function deleteResource(id: number) {
  if (confirm('Удалить ресурс?')) {
    store.deleteResource(id);
    refresh();
  }
}

watch(() => route.params.id, (newId) => { if (newId) loadById(Number(newId)); }, { immediate: true });
onMounted(() => {
  loadById();
  window.addEventListener('equipment-saved', refresh);
  window.addEventListener('resource-saved', refresh);
  window.addEventListener('open-add-resource', openAddResourceForm);
});
onUnmounted(() => {
  window.removeEventListener('equipment-saved', refresh);
  window.removeEventListener('resource-saved', refresh);
  window.removeEventListener('open-add-resource', openAddResourceForm);
});
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; background: #f8f9fa; padding: 16px; border-radius: 8px; }
.info-col { display: flex; flex-direction: column; gap: 12px; }
.info-row { display: flex; justify-content: space-between; border-bottom: 1px solid #e0e4e8; padding-bottom: 4px; }
.info-row strong { width: 160px; }
.section { margin-top: 20px; }
.empty-message { color: #999; font-style: italic; padding: 10px; }
.clickable-link { cursor: pointer; color: #2c5f8a; text-decoration: underline; }
.clickable-link:hover { color: #1e4566; }
</style>