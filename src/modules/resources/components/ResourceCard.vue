<template>
  <div class="card" v-if="resource">
    <div style="display: flex; justify-content: space-between; margin-bottom: 20px">
      <h2>{{ resource.name }}</h2>
      <div>
        <button class="btn btn-secondary" @click="goBack">← Назад</button>
        <button v-if="canEdit" class="btn btn-primary" @click="editResource">Редактировать</button>
        <button v-if="canEdit" class="btn btn-danger" @click="deleteResource">Удалить</button>
      </div>
    </div>

    <!-- Основные сведения по макету -->
    <div class="info-grid">
      <div class="info-row">
        <div class="info-label">Наименование</div>
        <div class="info-value">{{ resource.name }}</div>
        <div class="info-label">Марка</div>
        <div class="info-value">{{ resource.mark || '-' }}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Тип</div>
        <div class="info-value">{{ resource.type || '-' }}</div>
        <div class="info-label">Дата производства</div>
        <div class="info-value">{{ resource.productionDate || '-' }}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Узел</div>
        <div class="info-value">{{ resource.nodeName || `ID: ${resource.nodeId}` }}</div>
        <div class="info-label">Срок службы</div>
        <div class="info-value">
          {{ resource.serviceLife ? resource.serviceLife + ' лет' : '-' }}
        </div>
      </div>
      <div class="info-row">
        <div class="info-label">Дата регистрации</div>
        <div class="info-value">{{ resource.registrationDate }}</div>
        <div class="info-label">Учётный номер</div>
        <div class="info-value">{{ resource.registrationNumber || '-' }}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Дата ТО</div>
        <div class="info-value">{{ resource.lastServiceDate || '-' }}</div>
        <div class="info-label">Срок до ТО</div>
        <div class="info-value">
          {{ resource.timeToService ? resource.timeToService + ' лет' : '-' }}
        </div>
      </div>
    </div>

    <!-- Таблица параметров с обёрткой -->
    <h3 style="margin-top: 20px">Параметры</h3>
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>Параметр</th>
            <th>Значение</th>
            <th>Ед. изм.</th>
            <th>Основной</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="param in parameters" :key="param.id">
            <td>{{ param.name }}</td>
            <td>{{ param.value }}</td>
            <td>{{ param.unit }}</td>
            <td>{{ param.isMain ? '✅' : '' }}</td>
            <td>
              <button class="btn btn-sm btn-secondary" @click="editParam(param)">✏️</button>
              <button class="btn btn-sm btn-danger" @click="deleteParam(param.id)">🗑️</button>
            </td>
          </tr>
          <tr v-if="parameters.length === 0">
            <td colspan="5">Нет параметров</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Форма добавления параметра -->
    <div class="add-param-section">
      <h4>Добавить параметр</h4>
      <div class="param-form">
        <input v-model="newParam.name" placeholder="Наименование" class="form-control" />
        <input v-model="newParam.value" placeholder="Значение" class="form-control" />
        <input v-model="newParam.unit" placeholder="Ед. изм." class="form-control" />
        <label class="checkbox-label">
          <input type="checkbox" v-model="newParam.isMain" /> Основной
        </label>
        <button class="btn btn-primary btn-sm" @click="addParameter">+ Добавить</button>
      </div>
    </div>

    <!-- График изменения ресурса -->
    <ResourceChart v-if="resource && parameters.length > 0" :resource-id="resource.id" />

    <!-- Примечания -->
    <div class="notes-section" v-if="resource.notes">
      <h4>Примечания</h4>
      <p>{{ resource.notes }}</p>
    </div>

    <div class="text-muted" style="margin-top: 15px">
      <small>Создан: {{ resource.createdAt }} | Обновлён: {{ resource.updatedAt }}</small>
    </div>

    <!-- Модальные окна -->
    <ResourceForm ref="formRef" @saved="refresh" />
    <ConfirmDialog ref="confirmDialog" />
  </div>
  <div v-else class="card">
    <p>Загрузка...</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useResourcesStore } from '../stores/resourcesStore'
import ResourceForm from './ResourceForm.vue'
import ResourceChart from './ResourceChart.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const route = useRoute()
const router = useRouter()
const store = useResourcesStore()
const formRef = ref()
const confirmDialog = ref()

const resource = ref<any>(null)
const parameters = ref<any[]>([])

const canEdit = computed(() => {
  const user = localStorage.getItem('user')
  if (!user) return false
  const role = JSON.parse(user).role
  return role === 'operator' || role === 'admin'
})

const newParam = ref({ name: '', value: '', unit: '', isMain: false })

function load() {
  const id = Number(route.params.id)
  resource.value = store.resources.find((r) => r.id === id)
  if (resource.value) {
    parameters.value = store.getParametersForResource(id)
  }
}

function goBack() {
  router.back()
}
function editResource() {
  formRef.value?.open(resource.value)
}
async function deleteResource() {
  const ok = await confirmDialog.value?.show('Удаление', 'Удалить ресурс?')
  if (ok) {
    store.deleteResource(resource.value.id)
    router.back()
  }
}

function addParameter() {
  if (!newParam.value.name || !newParam.value.value) return
  store.addParameter({
    resourceId: resource.value.id,
    name: newParam.value.name,
    value: newParam.value.value,
    unit: newParam.value.unit,
    isMain: newParam.value.isMain,
  })
  newParam.value = { name: '', value: '', unit: '', isMain: false }
  refresh()
}

function editParam(param: any) {
  const newValue = prompt('Новое значение:', param.value)
  if (newValue !== null && newValue !== param.value) {
    store.updateParameter(param.id, { ...param, value: newValue })
    refresh()
  }
}

async function deleteParam(id: number) {
  const ok = await confirmDialog.value?.show('Удаление', 'Удалить параметр?')
  if (ok) {
    store.deleteParameter(id)
    refresh()
  }
}

function refresh() {
  load()
}

onMounted(() => {
  load()
  window.addEventListener('resource-saved', refresh)
})
</script>

<style scoped>
.info-grid {
  border: 1px solid #e0e4e8;
  border-radius: 8px;
  overflow: hidden;
}
.info-row {
  display: grid;
  grid-template-columns: 150px 1fr 150px 1fr;
  border-bottom: 1px solid #e0e4e8;
}
.info-row:last-child {
  border-bottom: none;
}
.info-label {
  background-color: #f8f9fa;
  padding: 10px 12px;
  font-weight: 500;
  border-right: 1px solid #e0e4e8;
}
.info-value {
  padding: 10px 12px;
}
.param-form {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  margin: 15px 0;
}
.param-form .form-control {
  width: auto;
  min-width: 120px;
}
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
}
.add-param-section {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #e0e4e8;
}
.notes-section {
  margin-top: 15px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 4px;
}
.text-muted {
  color: #6c757d;
}
</style>
