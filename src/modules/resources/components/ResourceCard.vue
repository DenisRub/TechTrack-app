<template>
  <div class="card" v-if="resource">
    <div class="card-header">
      <h2>{{ resource.name }}</h2>
      <div class="header-buttons">
        <button class="btn btn-secondary" @click="goBack">← Назад</button>
        <button v-if="canEdit" class="btn btn-primary" @click="editResource">Редактировать</button>
        <button v-if="canEdit" class="btn btn-danger" @click="deleteResource">Списать</button>
        <div class="dropdown">
          <button class="btn btn-secondary" @click="toggleExportDropdown">📎 Экспорт</button>
          <div v-if="exportDropdownOpen" class="dropdown-menu">
            <button class="dropdown-item" @click="exportToExcel">Excel</button>
            <button class="dropdown-item" @click="exportToWord">Word</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Основные сведения -->
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
        <div class="info-value">{{ resource.nodeName || '-' }}</div>
        <div class="info-label">Срок службы</div>
        <div class="info-value">{{ resource.serviceLife ? resource.serviceLife + ' лет' : '-' }}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Дата регистрации</div>
        <div class="info-value">{{ resource.registrationDate }}</div>
        <div class="info-label">Учётный номер</div>
        <div class="info-value">{{ resource.registrationNumber || '-' }}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Дата последнего ТО</div>
        <div class="info-value">{{ resource.lastServiceDate || '-' }}</div>
        <div class="info-label">Срок до ТО</div>
        <div class="info-value">{{ resource.timeToService ? resource.timeToService + ' лет' : '-' }}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Исходный ресурс</div>
        <div class="info-value">{{ resource.initialResource || '-' }}</div>
        <div class="info-label">Остаточный ресурс</div>
        <div class="info-value">{{ resource.remainingResource || '-' }}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Установлен в</div>
        <div class="info-value">{{ resource.installedIn || '-' }}</div>
      </div>
    </div>

    <!-- Предупреждения -->
    <div v-if="alerts.length" class="alerts-section">
      <h4>⚠️ Предупреждения</h4>
      <ul>
        <li v-for="(alert, idx) in alerts" :key="idx" :class="alert.type">{{ alert.message }}</li>
      </ul>
    </div>

    <!-- Параметры -->
    <h3>Параметры</h3>
    <div class="table-wrapper">
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
          <tr v-for="param in parameters" :key="param.id">
            <td>{{ param.name }}</td>
            <td>{{ param.value }}</td>
            <td>{{ param.unit }}</td>
            <td>{{ param.isMain ? '✅' : '' }}</td>
          </tr>
          <tr v-if="parameters.length === 0">
            <td colspan="4">Нет параметров</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- График -->
    <div class="chart-section" v-if="hasChartData">
      <h3>Динамика изменения ресурса</h3>
      <canvas ref="chartCanvas" class="chart-canvas"></canvas>
      <div class="chart-controls">
        <select v-model="selectedParam" class="form-control">
          <option value="U">Напряжение (U), В</option>
          <option value="R">Сопротивление (R), Ом</option>
          <option value="E">Ёмкость (E), Втч</option>
          <option value="C">Ёмкость (C), мАч</option>
        </select>
      </div>
    </div>
    <div v-else class="empty-message">Нет данных для построения графика</div>

    <!-- Примечания -->
    <div class="notes-section" v-if="resource.notes">
      <h4>Примечания</h4>
      <p>{{ resource.notes }}</p>
    </div>

    <div class="text-muted">
      <small>Создан: {{ resource.createdAt }} | Обновлён: {{ resource.updatedAt }}</small>
    </div>

    <ResourceForm ref="formRef" @saved="refresh" />
    <ConfirmDialog ref="confirmDialog" />
  </div>
  <div v-else class="card">Загрузка...</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useResourcesStore } from '../stores/resourcesStore';
import ResourceForm from './ResourceForm.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import { formatDate } from '@/utils/dateUtils';
import * as XLSX from 'xlsx';

const route = useRoute();
const router = useRouter();
const store = useResourcesStore();
const formRef = ref();
const confirmDialog = ref();
const exportDropdownOpen = ref(false);
const chartCanvas = ref<HTMLCanvasElement | null>(null);
let chartInstance: any = null;
const selectedParam = ref('U');

const resource = ref<any>(null);
const parameters = ref<any[]>([]);
const measurements = ref<any[]>([]);

const canEdit = computed(() => {
  const user = localStorage.getItem('user');
  if (!user) return false;
  try {
    const role = JSON.parse(user).role;
    return role === 'operator' || role === 'admin';
  } catch { return false; }
});

const hasChartData = computed(() => measurements.value.length > 0);

const alerts = computed(() => {
  const result: { type: string; message: string }[] = [];
  if (!resource.value) return result;
  if (resource.value.timeToService !== undefined && resource.value.timeToService < 0) {
    result.push({ type: 'danger', message: '🔴 Срок до ТО просрочен!' });
  } else if (resource.value.timeToService !== undefined && resource.value.timeToService < 1) {
    result.push({ type: 'warning', message: `⚠️ Срок до ТО менее года (${resource.value.timeToService} лет)` });
  }
  if (resource.value.serviceLife) {
    const yearsPassed = new Date().getFullYear() - new Date(resource.value.registrationDate).getFullYear();
    const remaining = resource.value.serviceLife - yearsPassed;
    if (remaining < 0) {
      result.push({ type: 'danger', message: '🔴 Срок службы истёк!' });
    } else if (remaining < 1) {
      result.push({ type: 'warning', message: `⚠️ Срок службы истекает (осталось ${remaining} лет)` });
    }
  }
  const remainingPercent = parseFloat(resource.value.remainingResource || '0');
  if (remainingPercent <= 0) {
    result.push({ type: 'danger', message: '🔴 Ресурс исчерпан!' });
  } else if (remainingPercent < 20) {
    result.push({ type: 'warning', message: `⚠️ Остаточный ресурс менее 20% (${remainingPercent}%)` });
  }
  return result;
});

function loadData() {
  const id = Number(route.params.id);
  resource.value = store.resources.find(r => r.id === id);
  if (resource.value) {
    parameters.value = store.getParametersForResource(id);
    measurements.value = store.getMeasurementsForResource(id);
    nextTick(() => {
      renderChart();
    });
  }
}
async function renderChart() {
  if (!chartCanvas.value || measurements.value.length === 0) return;

  const sorted = [...measurements.value].sort((a, b) => new Date(a.measurementDate).getTime() - new Date(b.measurementDate).getTime());
  const labels = sorted.map(m => formatDate(m.measurementDate));
  const data = sorted.map(m => m.parameters?.[selectedParam.value] || 0);

  try {
    const { Chart, CategoryScale, LinearScale, PointElement, LineElement, LineController, Title, Tooltip, Legend } = await import('chart.js');
    
    Chart.register(
      CategoryScale,
      LinearScale,
      PointElement,
      LineElement,
      LineController,
      Title,
      Tooltip,
      Legend
    );

    if (chartInstance) chartInstance.destroy();

    const ctx = chartCanvas.value.getContext('2d');
    if (!ctx) return;

    // Принудительно задаём размер canvas перед созданием графика
    const canvas = chartCanvas.value;
    canvas.style.width = '100%';
    canvas.style.height = '300px';
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: selectedParam.value === 'U' ? 'Напряжение (В)' : selectedParam.value === 'R' ? 'Сопротивление (Ом)' : selectedParam.value === 'E' ? 'Ёмкость (Втч)' : 'Ёмкость (мАч)',
          data,
          borderColor: '#2c5f8a',
          backgroundColor: 'rgba(44,95,138,0.1)',
          tension: 0.3,
          fill: true,
          pointBackgroundColor: '#2c5f8a',
          pointBorderColor: '#fff',
          pointRadius: 5,
          pointHoverRadius: 7,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: { mode: 'index', intersect: false },
          legend: { position: 'top' }
        }
      }
    });
  } catch (error) {
    console.error('Chart error:', error);
  }
}

function exportToExcel() {
  if (!resource.value) return;
  const wsData = [
    [`Ресурс: ${resource.value.name}`], [],
    ['Параметр', 'Значение', 'Ед. изм.', 'Основной'],
    ...parameters.value.map(p => [p.name, p.value, p.unit, p.isMain ? 'Да' : 'Нет']), [],
    ['История измерений'], ['Дата', 'U, В', 'R, Ом', 'E, Втч', 'C, мАч'],
    ...measurements.value.map(m => [formatDate(m.measurementDate), m.parameters?.U || '-', m.parameters?.R || '-', m.parameters?.E || '-', m.parameters?.C || '-'])
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, resource.value.name);
  XLSX.writeFile(wb, `${resource.value.name}.xlsx`);
  exportDropdownOpen.value = false;
}

function exportToWord() {
  if (!resource.value) return;
  let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${resource.value.name}</title><style>body{font-family:Arial;} table{border-collapse:collapse;width:100%} th,td{border:1px solid #000;padding:6px;text-align:left}</style></head><body>`;
  html += `<h1>${resource.value.name}</h1>`;
  html += `<h2>Основные сведения</h2></table>`;
  html += `<tr><th>Наименование</th><td>${resource.value.name}</td><th>Марка</th><td>${resource.value.mark || '-'}</td></tr>`;
  html += `<tr><th>Тип</th><td>${resource.value.type || '-'}</td><th>Дата производства</th><td>${resource.value.productionDate || '-'}</td></tr>`;
  html += `<tr><th>Узел</th><td>${resource.value.nodeName || '-'}</td><th>Срок службы</th><td>${resource.value.serviceLife ? resource.value.serviceLife + ' лет' : '-'}</td></tr>`;
  html += `<tr><th>Дата регистрации</th><td>${resource.value.registrationDate}</td><th>Учётный номер</th><td>${resource.value.registrationNumber || '-'}</td></tr>`;
  html += `<tr><th>Дата последнего ТО</th><td>${resource.value.lastServiceDate || '-'}</td><th>Срок до ТО</th><td>${resource.value.timeToService ? resource.value.timeToService + ' лет' : '-'}</td></tr>`;
  html += `<tr><th>Исходный ресурс</th><td>${resource.value.initialResource || '-'}</td><th>Остаточный ресурс</th><td>${resource.value.remainingResource || '-'}</td></tr>`;
  html += `<tr><th>Установлен в</th><td colspan="3">${resource.value.installedIn || '-'}</td></tr>`;
  html += `<\/table><h2>Параметры</h2><table><tr><th>Параметр</th><th>Значение</th><th>Ед. изм.</th><th>Основной</th></tr>`;
  parameters.value.forEach(p => { html += `<tr><td>${p.name}</td><td>${p.value}</td><td>${p.unit}</td><td>${p.isMain ? 'Да' : 'Нет'}</td></tr>`; });
  html += `<\/table>`;
  if (measurements.value.length) {
    html += `<h2>История измерений</h2><table><tr><th>Дата</th><th>U, В</th><th>R, Ом</th><th>E, Втч</th><th>C, мАч</th></tr>`;
    measurements.value.forEach(m => { html += `<tr><td>${formatDate(m.measurementDate)}</td><td>${m.parameters?.U || '-'}</td><td>${m.parameters?.R || '-'}</td><td>${m.parameters?.E || '-'}</td><td>${m.parameters?.C || '-'}</td></tr>`; });
    html += `<\/table>`;
  }
  html += `</body></html>`;
  const blob = new Blob([html], { type: 'application/msword' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${resource.value.name}.doc`;
  link.click();
  URL.revokeObjectURL(link);
  exportDropdownOpen.value = false;
}

function goBack() { router.back(); }
function editResource() { formRef.value?.open(resource.value); }
async function deleteResource() {
  const ok = await confirmDialog.value?.show('Списание', 'Списать ресурс?');
  if (ok) { store.deleteResource(resource.value.id); router.back(); }
}
function refresh() { loadData(); }
function toggleExportDropdown() { exportDropdownOpen.value = !exportDropdownOpen.value; }

watch(selectedParam, () => renderChart());
watch(measurements, () => renderChart(), { deep: true });

onMounted(() => {
  loadData();
  window.addEventListener('resource-saved', refresh);
});
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.header-buttons {
  display: flex;
  gap: 10px;
}
.info-grid {
  border: 1px solid #e0e4e8;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;
}
.info-row {
  display: grid;
  grid-template-columns: 150px 1fr 150px 1fr;
  border-bottom: 1px solid #e0e4e8;
}
.info-row:last-child { border-bottom: none; }
.info-label {
  background-color: #f8f9fa;
  padding: 10px 12px;
  font-weight: 500;
  border-right: 1px solid #e0e4e8;
}
.info-value { padding: 10px 12px; }
.alerts-section {
  background-color: #fff3e0;
  border-left: 4px solid #e67e22;
  padding: 12px;
  margin-bottom: 20px;
  border-radius: 4px;
}
.alerts-section .danger { color: #c0392b; }
.chart-section {
  margin-top: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}
.chart-canvas {
  width: 100%;
  height: 300px;
}
.chart-controls {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
}
.chart-controls select {
  width: 200px;
}
.empty-message {
  text-align: center;
  padding: 40px;
  color: #999;
}
.notes-section {
  margin-top: 15px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 4px;
}
.text-muted {
  color: #6c757d;
  margin-top: 15px;
}
.dropdown {
  position: relative;
  display: inline-block;
}
.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: white;
  border: 1px solid #e0e4e8;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  z-index: 100;
  min-width: 120px;
}
.dropdown-item {
  display: block;
  width: 100%;
  padding: 8px 12px;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
}
.dropdown-item:hover { background-color: #f0f2f5; }

/* ===== ДОБАВЛЕННЫЙ БЛОК ДЛЯ ОГРАНИЧЕНИЯ РАЗМЕРА ГРАФИКА ===== */
.chart-section canvas {
  max-width: 600px !important;
  height: 300px !important;
  display: block;
  margin: 0 auto;
}
</style>