<
<template>
  <div class="card" v-if="node">
    <!-- Заголовок и кнопки управления -->
    <div class="card-header">
      <h2>{{ node.name }}</h2>
      <div class="action-buttons">
        <button class="btn btn-secondary" @click="goBack">← Назад</button>
        <button v-if="canEdit" class="btn btn-primary" @click="editNode">Редактировать</button>
        <button v-if="canEdit" class="btn btn-danger" @click="deleteNode">Списать</button>
        <button v-if="canEdit" class="btn btn-secondary" @click="openMoveModal">
          📦 Переместить
        </button>
      </div>
    </div>

    <!-- Основные сведения (две колонки) -->
    <div class="info-grid">
      <!-- Левая колонка -->
      <div class="info-col">
        <div class="info-row">
          <strong>Марка</strong><span>{{ node.model || '-' }}</span>
        </div>
        <div class="info-row">
          <strong>Наименование</strong><span>{{ node.name }}</span>
        </div>
        <div class="info-row">
          <strong>Подсистема</strong><span>{{ node.subsystem || '-' }}</span>
        </div>
        <div class="info-row">
          <strong>Производитель</strong><span>{{ node.manufacturer || '-' }}</span>
        </div>
        <div class="info-row">
          <strong>Дата установки</strong><span>{{ formatDate(node.dateInstallation) }}</span>
        </div>
        <div class="info-row">
          <strong>Состояние</strong><span>{{ node.condition || '-' }}</span>
        </div>
        <div class="info-row">
          <strong>Заводской номер</strong><span>{{ node.serialNumber || '-' }}</span>
        </div>
        <div class="info-row">
          <strong>Учетный номер</strong><span>{{ node.accountingNumber || '-' }}</span>
        </div>
        <div class="info-row">
          <strong>Режим работы</strong><span>{{ node.operationMode || '-' }}</span>
        </div>
      </div>

      <!-- Правая колонка -->
      <div class="info-col">
        <div class="info-row">
          <strong>Тип</strong><span>{{ node.type === 'aggregate' ? 'Агрегат' : 'Блок' }}</span>
        </div>
        <div class="info-row">
          <strong>Узел</strong>
          <span v-if="node.parentId" class="clickable-link" @click="goToParent">{{
            getParentName()
          }}</span>
          <span v-else>-</span>
        </div>
        <div class="info-row">
          <strong>Размещение</strong><span>{{ node.location || '-' }}</span>
        </div>
        <div class="info-row">
          <strong>Дата производства</strong><span>{{ formatDate(node.dateManufacture) }}</span>
        </div>
        <div class="info-row">
          <strong>Ресурс</strong><span>{{ node.resource || '-' }}</span>
        </div>
        <div class="info-row">
          <strong>СИ</strong><span>{{ node.isSI ? 'да' : 'нет' }}</span>
        </div>
        <div class="info-row">
          <strong>Инвентарный номер</strong><span>{{ node.inventoryNumber || '-' }}</span>
        </div>
        <div class="info-row">
          <strong>Агрегат</strong><span>{{ node.type === 'aggregate' ? 'да' : 'нет' }}</span>
        </div>
      </div>
    </div>

    <!-- Таблица параметров (характеристики с пометкой "Основной") -->
    <div class="section">
      <h3>Параметры</h3>
      <div class="table-wrapper" v-if="Object.keys(mainParams).length">
        <table class="data-table">
          <thead>
            <tr>
              <th>Параметр</th>
              <th>Значение</th>
              <th>Ед. изм.</th>
              <th>Основной</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(param, name) in mainParams" :key="name">
              <td>{{ name }}</td>
              <td>{{ param.value }}</td>
              <td>{{ param.unit || '-' }}</td>
              <td>{{ param.isMain ? '✓' : '' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="empty-message">Параметры не заданы</div>
    </div>

    <!-- Установленные узлы и ресурсы (объединённый блок) -->
    <div class="section">
      <h3>Установленные узлы и ресурсы</h3>

      <!-- Состав (дочерние узлы) – только для агрегатов -->
      <div v-if="node.type === 'aggregate' && children.length" class="subsection">
        <h4>Состав (дочерние узлы)</h4>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Наименование</th>
                <th>Тип</th>
                <th>Производитель</th>
                <th>Марка</th>
                <th>Основные параметры</th>
                <th>Примечания</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="child in children" :key="child.id">
                <td>
                  <span class="clickable-link" @click="viewChild(child.id)">{{ child.name }}</span>
                </td>
                <td>{{ child.type === 'aggregate' ? 'Агрегат' : 'Блок' }}</td>
                <td>{{ child.manufacturer || '-' }}</td>
                <td>{{ child.model || '-' }}</td>
                <td>{{ getMainParamsShort(child) }}</td>
                <td>{{ child.note || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Ресурсы -->
      <div v-if="resources.length" class="subsection">
        <h4>Ресурсы</h4>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Наименование</th>
                <th>Значение</th>
                <th>Ед. изм.</th>
                <th>Обновлено</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="res in resources" :key="res.id">
                <td>
                  <span class="clickable-link" @click="goToResource(res.id)">{{ res.name }}</span>
                </td>
                <td>{{ res.value }}</td>
                <td>{{ res.unit || '-' }}</td>
                <td>{{ formatDate(res.updatedAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="node.type !== 'aggregate' && !resources.length" class="empty-message">
        Нет установленных узлов или ресурсов
      </div>
    </div>

    <!-- История перемещений -->
    <div class="section" v-if="moveHistory.length">
      <h3>История перемещений</h3>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Дата</th>
              <th>Откуда</th>
              <th>Куда</th>
              <th>Пользователь</th>
            </tr>
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
    </div>

    <!-- Модальные окна -->
    <EquipmentForm ref="formRef" @saved="refresh" />
    <AddChildModal ref="addChildModalRef" @added="refresh" />
    <ConfirmDialog ref="confirmDialog" />

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
  </div>

  <div v-else class="card">Загрузка...</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEquipmentStore } from '../stores/equipmentStore'
import EquipmentForm from '../components/EquipmentForm.vue'
import AddChildModal from '../components/AddChildModal.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { formatDate } from '@/utils/dateUtils'

const route = useRoute()
const router = useRouter()
const store = useEquipmentStore()

// Refs
const formRef = ref()
const addChildModalRef = ref()
const confirmDialog = ref()
const node = ref<any>(null)
const children = ref<any[]>([])
const resources = ref<any[]>([])
const moveHistory = ref<any[]>([])

// Перемещение
const showMoveModal = ref(false)
const newLocation = ref('')

// Права доступа
const canEdit = computed(() => {
  const user = localStorage.getItem('user')
  if (!user) return false
  try {
    const role = JSON.parse(user).role
    return role === 'operator' || role === 'admin'
  } catch {
    return false
  }
})

// Интерфейс для характеристики
interface CharacteristicValue {
  value: string | number
  unit?: string
  isMain?: boolean
}

// Основные параметры (характеристики с флагом isMain)
const mainParams = computed(() => {
  if (!node.value?.characteristics) return {}
  const chars = node.value.characteristics as Record<string, CharacteristicValue>
  return Object.fromEntries(
    Object.entries(chars).filter(([_, val]) => val?.isMain === true),
  ) as Record<string, CharacteristicValue>
})

// Вспомогательная функция для краткого отображения основных параметров дочернего узла
function getMainParamsShort(child: any) {
  if (!child.characteristics) return ''
  const mains = Object.entries(child.characteristics)
    .filter(([_, val]: any) => val?.isMain === true)
    .map(([key, val]: any) => `${key}: ${val.value} ${val.unit || ''}`.trim())
    .join(', ')
  return mains || '-'
}

// Имя родительского узла
function getParentName() {
  if (!node.value.parentId) return '-'
  const parent = store.getNode(node.value.parentId)
  return parent ? parent.name : '-'
}

// Переход к родительскому узлу
function goToParent() {
  if (node.value && node.value.parentId) {
    router.push(`/equipment/${node.value.parentId}`)
  }
}

// Загрузка данных по id
function loadById(id: number) {
  node.value = store.getNode(id)
  if (node.value) {
    children.value = store.nodes.filter((n: any) => n.parentId === id && !n.isDeleted)
    resources.value = store.getResourcesForNode(id)
    moveHistory.value = store.getMoveHistoryForNode(id)
  }
}

// Обновление данных после сохранения
function refresh() {
  const currentId = Number(route.params.id)
  loadById(currentId)
}

// Навигация и редактирование
function goBack() {
  router.back()
}
function editNode() {
  formRef.value?.open(node.value)
}
function viewChild(id: number) {
  const childNode = store.getNode(id)
  if (childNode && childNode.isSI) {
    // Переход в модуль СИ с параметром nodeId
    router.push({ path: '/si', query: { nodeId: id.toString() } })
  } else {
    router.push(`/equipment/${id}`)
  }
}

// Переход к модулю «Ресурсы» с параметром resourceId
function goToResource(resourceId: number) {
  router.push({
    path: '/resources',
    query: { resourceId: resourceId.toString(), nodeId: node.value.id.toString() },
  })
}
function goToSI() {
  // Поиск СИ, связанного с текущим узлом, или просто переход с параметром nodeId
  router.push({ path: '/si', query: { nodeId: node.value.id.toString() } })
}
// Списание с подтверждением
async function deleteNode() {
  const ok = await confirmDialog.value?.show('Списание', 'Списать узел?')
  if (ok) {
    store.deleteNode(node.value.id)
    router.back()
  }
}

// Перемещение
function openMoveModal() {
  newLocation.value = node.value.location || ''
  showMoveModal.value = true
}
function closeMoveModal() {
  showMoveModal.value = false
}
function saveMove() {
  const oldLocation = node.value.location || ''
  if (newLocation.value !== oldLocation) {
    store.updateNode(node.value.id, { location: newLocation.value })
    store.addMoveRecord(node.value.id, oldLocation, newLocation.value)
    refresh()
  }
  closeMoveModal()
}

// Следим за изменением параметра id в маршруте
watch(
  () => route.params.id,
  (newId) => {
    if (newId) {
      loadById(Number(newId))
    }
  },
  { immediate: true },
)

// Подписка на события обновления данных
onMounted(() => {
  window.addEventListener('equipment-saved', refresh)
  window.addEventListener('resource-saved', () => {
    const id = Number(route.params.id)
    resources.value = store.getResourcesForNode(id)
  })
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
}
.info-col {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.info-row {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid #e0e4e8;
  padding-bottom: 4px;
}
.info-row strong {
  width: 160px;
}
.section {
  margin-top: 20px;
}
.subsection {
  margin-top: 16px;
  margin-left: 16px;
}
.empty-message {
  color: #999;
  font-style: italic;
  padding: 10px;
}
.clickable-link {
  cursor: pointer;
  color: #2c5f8a;
  text-decoration: underline;
}
.clickable-link:hover {
  color: #1e4566;
}
</style>
