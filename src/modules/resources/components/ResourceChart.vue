<template>
  <div class="chart-container">
    <div class="chart-header">
      <h4>Динамика изменения ресурса</h4>
      <select v-model="selectedParamId" class="form-control chart-select" @change="onParamChange">
        <option :value="null" disabled>-- Выберите параметр --</option>
        <option v-for="p in availableParams" :key="p.id" :value="p.id">
          {{ p.name }} ({{ p.unit }})
        </option>
      </select>
    </div>
    <canvas ref="chartCanvas" class="chart-canvas"></canvas>
    <div v-if="!hasData" class="chart-empty">
      Нет данных для отображения графика<br />
      <small>Добавьте параметры "Емкость", "Напряжение" или "Внутреннее сопротивление"</small>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useResourcesStore } from '../stores/resourcesStore'

const props = defineProps<{
  resourceId: number
}>()

const store = useResourcesStore()
const chartCanvas = ref<HTMLCanvasElement | null>(null)
let chartInstance: any = null
const selectedParamId = ref<number | null>(null)
const hasData = ref(false)
let ChartJS: any = null

// Получаем параметры ресурса из store
const parameters = computed(() => store.getParametersForResource(props.resourceId))

// Доступные параметры для графика (ёмкость, напряжение, сопротивление)
const availableParams = computed(() => {
  return parameters.value.filter(
    (p) => p.name === 'Емкость' || p.name === 'Напряжение' || p.name === 'Внутреннее сопротивление',
  )
})

// Мок-данные для графика (в реальном приложении – из истории измерений)
const getMockHistory = (paramName: string) => {
  const histories: Record<string, { labels: string[]; values: number[] }> = {
    Емкость: {
      labels: ['Янв 2024', 'Мар 2024', 'Май 2024', 'Июл 2024', 'Сен 2024', 'Ноя 2024', 'Янв 2025'],
      values: [95, 92, 88, 85, 82, 80, 78],
    },
    Напряжение: {
      labels: ['Янв 2024', 'Мар 2024', 'Май 2024', 'Июл 2024', 'Сен 2024', 'Ноя 2024', 'Янв 2025'],
      values: [12.5, 12.4, 12.3, 12.2, 12.1, 12.0, 11.9],
    },
    'Внутреннее сопротивление': {
      labels: ['Янв 2024', 'Мар 2024', 'Май 2024', 'Июл 2024', 'Сен 2024', 'Ноя 2024', 'Янв 2025'],
      values: [0.018, 0.019, 0.02, 0.022, 0.024, 0.026, 0.028],
    },
  }
  return histories[paramName] || { labels: [], values: [] }
}

async function loadChartLibrary() {
  if (ChartJS) return ChartJS
  try {
    const module = await import('chart.js')
    ChartJS = module
    return module
  } catch (error) {
    console.error('Не удалось загрузить chart.js:', error)
    return null
  }
}

async function renderChart() {
  if (!chartCanvas.value) return
  if (!selectedParamId.value) return

  const param = parameters.value.find((p) => p.id === selectedParamId.value)
  if (!param) {
    hasData.value = false
    return
  }

  const history = getMockHistory(param.name)
  if (history.labels.length === 0) {
    hasData.value = false
    return
  }

  hasData.value = true

  const chartModule = await loadChartLibrary()
  if (!chartModule) {
    console.error('Chart.js не загружен')
    return
  }

  const { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } =
    chartModule
  Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

  if (chartInstance) chartInstance.destroy()

  const ctx = chartCanvas.value.getContext('2d')
  if (!ctx) return

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: history.labels,
      datasets: [
        {
          label: `${param.name} (${param.unit})`,
          data: history.values,
          borderColor: '#2c5f8a',
          backgroundColor: 'rgba(44, 95, 138, 0.1)',
          tension: 0.3,
          fill: true,
          pointBackgroundColor: '#2c5f8a',
          pointBorderColor: '#fff',
          pointRadius: 5,
          pointHoverRadius: 7,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        tooltip: { mode: 'index', intersect: false },
      },
      scales: {
        y: {
          beginAtZero: false,
          title: { display: true, text: param.unit },
        },
        x: {
          title: { display: true, text: 'Дата' },
        },
      },
    },
  })
}

function onParamChange() {
  if (selectedParamId.value) {
    renderChart()
  }
}

// Следим за изменением выбранного параметра
watch(selectedParamId, () => {
  if (selectedParamId.value) renderChart()
})

// При монтировании выбираем первый доступный параметр
onMounted(async () => {
  // Исправление: безопасная проверка наличия элементов в массиве
  if (availableParams.value && availableParams.value.length > 0) {
    const firstParam = availableParams.value[0]
    if (firstParam && firstParam.id) {
      selectedParamId.value = firstParam.id
      await renderChart()
    }
  }
})
</script>

<style scoped>
.chart-container {
  margin-top: 20px;
  padding: 15px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e4e8;
}
.chart-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}
.chart-select {
  width: 250px;
}
.chart-canvas {
  width: 100%;
  height: 300px;
  min-height: 300px;
}
.chart-empty {
  text-align: center;
  padding: 60px 20px;
  color: #999;
  background: #f8f9fa;
  border-radius: 8px;
}
.chart-empty small {
  display: block;
  margin-top: 10px;
  color: #bbb;
}
</style>
