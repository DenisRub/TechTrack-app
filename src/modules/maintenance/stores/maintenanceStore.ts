import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { MaintenancePlan, MaintenanceTask } from '../types/maintenanceTypes'
import { useEquipmentStore } from '@/modules/equipment/stores/equipmentStore'
import { useResourcesStore } from '@/modules/resources/stores/resourcesStore'
import { useSIStore } from '@/modules/si/stores/siStore'

function getCurrentDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatYMD(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDate(date: Date): string {
  return formatYMD(date)
}

// Мок-данные – планы-графики
const mockPlans: MaintenancePlan[] = [
  {
    id: 1,
    name: 'План ТО на 2026 год',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    description: 'Годовой план технического обслуживания',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
    isDeleted: false,
    subsystemId: 1,
  },
  {
    id: 2,
    name: 'План ТО на 2025 год',
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    description: 'Годовой план',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    isDeleted: false,
    subsystemId: 1,
  },
]

// Мок-данные – задачи ТО
const mockTasks: MaintenanceTask[] = [
  {
    id: 1,
    planId: 1,
    nodeId: 1,
    nodeName: 'Пост контроля АСКРО СЗЗ №9',
    nodeLocation: 'ПП №1',
    recommendedDate: '2026-05-15',
    serviceType: 'плановое ТО',
    status: 'pending',
    notes: '',
  },
  {
    id: 2,
    planId: 1,
    nodeId: 2,
    nodeName: 'Блок детектирования БДГ-01 №373',
    nodeLocation: 'ПП №1',
    recommendedDate: '2026-09-30',
    serviceType: 'плановое ТО',
    status: 'pending',
    notes: '',
  },
  {
    id: 3,
    planId: 1,
    nodeId: 3,
    nodeName: 'Мобильный маршрутизатор iRZ RUH2b',
    nodeLocation: 'ПП №1',
    recommendedDate: '2026-03-20',
    serviceType: 'внеплановое ТО',
    status: 'completed',
    completedDate: '2026-03-18',
    notes: '',
  },
  {
    id: 4,
    planId: 2,
    nodeId: 1,
    nodeName: 'Пост контроля АСКРО СЗЗ №9',
    nodeLocation: 'ПП №1',
    recommendedDate: '2025-06-10',
    serviceType: 'плановое ТО',
    status: 'completed',
    completedDate: '2025-06-05',
    notes: '',
  },
  {
    id: 5,
    planId: 1,
    nodeId: 5,
    nodeName: 'Датчик температуры',
    nodeLocation: 'Площадка, наружный блок',
    recommendedDate: '2026-07-15',
    serviceType: 'модернизация',
    status: 'pending',
    notes: 'Замена датчика на новую модель',
  },
  {
    id: 6,
    planId: 1,
    nodeId: 11,
    nodeName: 'Сервер БД',
    nodeLocation: 'СКЦ, стойка 2',
    recommendedDate: '2026-08-10',
    serviceType: 'текущий ремонт',
    status: 'pending',
    notes: 'Замена термопасты, чистка от пыли',
  },
]

export const useMaintenanceStore = defineStore('maintenance', () => {
  const plans = ref<MaintenancePlan[]>([...mockPlans])
  const tasks = ref<MaintenanceTask[]>([...mockTasks])
  const tasksHistory = ref<MaintenanceTask[]>([...mockTasks])

  // Активные планы (не удалённые), отсортированные по близости к текущей дате
  const activePlans = computed(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return plans.value
      .filter((p) => !p.isDeleted)
      .sort((a, b) => {
        const dateA = new Date(a.startDate)
        dateA.setHours(0, 0, 0, 0)
        const dateB = new Date(b.startDate)
        dateB.setHours(0, 0, 0, 0)
        const diffA = Math.abs(dateA.getTime() - today.getTime())
        const diffB = Math.abs(dateB.getTime() - today.getTime())
        return diffA - diffB
      })
  })

  // Все планы (включая удалённые)
  const allPlans = computed(() => plans.value)

  // Задачи для конкретного плана
  function getTasksForPlan(planId: number): MaintenanceTask[] {
    return tasks.value
      .filter((t) => t.planId === planId)
      .sort((a, b) => new Date(a.recommendedDate).getTime() - new Date(b.recommendedDate).getTime())
  }

  // ========== Функции для автоматического расчёта ==========

  // Получить дату истечения срока ТО для узла
  function getExpiryDate(nodeId: number): string | null {
    const equipmentStore = useEquipmentStore()
    const resourcesStore = useResourcesStore()
    const siStore = useSIStore()

    let lastDateObj: Date | null = null
    let maxInterval = 0

    // 1. Проверяем СИ
    const siList = siStore.instruments.filter((si: any) => si.nodeId === nodeId)
    for (const si of siList) {
      const lastVerificationDate = siStore.getLastVerificationDate(si.id)
      if (lastVerificationDate) {
        const date = new Date(lastVerificationDate)
        if (!lastDateObj || date > lastDateObj) lastDateObj = date
        maxInterval = Math.max(maxInterval, si.verificationInterval)
      }
    }

    // 2. Проверяем ресурсы
    const resources = resourcesStore.resources.filter((r: any) => r.nodeId === nodeId)
    for (const res of resources) {
      if (res.lastServiceDate) {
        const date = new Date(res.lastServiceDate)
        if (!lastDateObj || date > lastDateObj) lastDateObj = date
      }
      if (res.timeToService && res.timeToService > maxInterval) {
        maxInterval = res.timeToService
      }
    }

    // 3. Проверяем оборудование
    const node = equipmentStore.nodes.find((n: any) => n.id === nodeId)
    if (node && node.updatedAt) {
      const date = new Date(node.updatedAt)
      if (!lastDateObj || date > lastDateObj) lastDateObj = date
    }

    if (lastDateObj && maxInterval > 0) {
      const expiryDate = new Date(lastDateObj)
      expiryDate.setFullYear(expiryDate.getFullYear() + maxInterval)
      return formatYMD(expiryDate)
    }
    return null
  }

  // Получить рекомендуемую дату проведения ТО (на 10 дней раньше даты истечения)
  function getRecommendedFromExpiry(expiryDate: string | null): string | null {
    if (!expiryDate) return null
    const date = new Date(expiryDate)
    date.setDate(date.getDate() - 10)
    return formatYMD(date)
  }

  // Генерация автоматического плана
  function generateAutoPlan(
    startDate: string,
    endDate: string,
    year?: number,
  ): Omit<MaintenancePlan, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'> {
    const yearNum = year || new Date(startDate).getFullYear()
    const planName = `План ТО на ${yearNum} год (автоматический)`

    return {
      name: planName,
      startDate,
      endDate,
      description: `Автоматически сформированный план технического обслуживания на ${yearNum} год на основе анализа ресурсов, СИ и истории ТО.`,
      subsystemId: 0,
    }
  }

  // Генерация задач для плана
  function generateTasksForPlan(
    planId: number,
    startDateStr: string,
    endDateStr: string,
  ): Omit<MaintenanceTask, 'id'>[] {
    const equipmentStore = useEquipmentStore()
    const resourcesStore = useResourcesStore()
    const siStore = useSIStore()

    const tasksList: Omit<MaintenanceTask, 'id'>[] = []
    const start = new Date(startDateStr)
    const end = new Date(endDateStr)

    // Получаем ВСЕ блоки (не агрегаты)
    const allBlocks = equipmentStore.nodes.filter((n: any) => !n.isDeleted && n.type === 'block')

    for (const block of allBlocks) {
      // Получаем дату истечения срока ТО
      const expiryDate = getExpiryDate(block.id)

      // Если дата истечения определена
      if (expiryDate) {
        const expiryDateObj = new Date(expiryDate)

        // Проверяем, попадает ли дата истечения в диапазон плана
        if (expiryDateObj >= start && expiryDateObj <= end) {
          // Рассчитываем рекомендуемую дату проведения ТО (на 10 дней раньше)
          const recommendedFromExpiry = getRecommendedFromExpiry(expiryDate)
          let serviceType: MaintenanceTask['serviceType'] = 'плановое ТО'
          let notes = `⏰ Срок ТО истекает ${formatDate(expiryDateObj)}`

          tasksList.push({
            planId,
            nodeId: block.id,
            nodeName: block.name,
            nodeLocation: block.location || '',
            recommendedDate: recommendedFromExpiry || expiryDate,
            serviceType,
            status: 'pending',
            notes: notes,
          })
        }
      } else {
        // Если дата истечения не определена, проверяем другие критерии
        let timeToService: number | null = null
        let remainingLife: number | null = null

        const resourceData = resourcesStore.resources.find((r: any) => r.nodeId === block.id)
        if (resourceData) {
          if (resourceData.timeToService !== undefined && resourceData.timeToService !== null) {
            timeToService = resourceData.timeToService
          }
          if (resourceData.serviceLife !== undefined && resourceData.serviceLife !== null) {
            remainingLife = resourceData.serviceLife
          }
        }

        const resourceParams = resourcesStore.getParametersForResource(block.id)
        for (const param of resourceParams) {
          let paramValue = ''
          if (param.value !== undefined && param.value !== null) {
            paramValue = String(param.value)
          }
          const parsed = parseFloat(paramValue)
          if (!isNaN(parsed)) {
            if (param.name === 'Срок до ТО' || param.name === 'timeToService') {
              timeToService = parsed
            }
            if (
              param.name === 'Остаточный ресурс' ||
              param.name === 'remainingLife' ||
              param.name === 'Остаточный срок службы'
            ) {
              remainingLife = parsed
            }
          }
        }

        // Проверяем СИ
        let nextVerificationDate: string | null = null
        const siList = siStore.instruments.filter((si: any) => si.nodeId === block.id)
        if (siList.length > 0 && siList[0]) {
          nextVerificationDate = siStore.getNextVerificationDate(siList[0].id)
        }

        // Проверяем историю ТО
        let lastServiceDate: string | null = null
        const existingTasks = tasksHistory.value.filter((t) => t.nodeId === block.id)
        const completedTasks = existingTasks.filter((t) => t.status === 'completed')
        if (completedTasks.length > 0) {
          const lastTask = completedTasks.sort(
            (a, b) =>
              new Date(b.completedDate || b.recommendedDate).getTime() -
              new Date(a.completedDate || a.recommendedDate).getTime(),
          )[0]
          if (lastTask) {
            lastServiceDate = lastTask.completedDate || lastTask.recommendedDate
          }
        }

        // Определяем, нужно ли включать блок в план
        let shouldInclude = false
        let recommendedDate: string | null = null
        let serviceType: MaintenanceTask['serviceType'] = 'плановое ТО'
        let notes: string = ''

        if (timeToService !== null && timeToService < 2) {
          shouldInclude = true
          serviceType = timeToService < 0.5 ? 'капитальный ремонт' : 'плановое ТО'
          notes = `⚠️ Срок до ТО: ${timeToService} лет`
          const midDate = new Date(start)
          midDate.setMonth(start.getMonth() + Math.floor((end.getMonth() - start.getMonth()) / 2))
          recommendedDate = formatYMD(midDate)
        } else if (remainingLife !== null && remainingLife < 2) {
          shouldInclude = true
          serviceType = remainingLife < 1 ? 'внеплановое ТО' : 'плановое ТО'
          notes = `📊 Остаточный ресурс: ${remainingLife} лет`
          const midDate = new Date(start)
          midDate.setMonth(start.getMonth() + Math.floor((end.getMonth() - start.getMonth()) / 2))
          recommendedDate = formatYMD(midDate)
        } else if (nextVerificationDate) {
          const nextDate = new Date(nextVerificationDate)
          if (nextDate >= start && nextDate <= end) {
            shouldInclude = true
            recommendedDate = nextVerificationDate
            serviceType = 'плановое ТО'
            notes = `🔧 Следующая поверка СИ: ${nextVerificationDate}`
          } else if (nextDate < start) {
            shouldInclude = true
            recommendedDate = startDateStr
            serviceType = 'плановое ТО'
            notes = `🔧 Требуется поверка СИ (была ${nextVerificationDate})`
          }
        } else if (lastServiceDate) {
          const lastDate = new Date(lastServiceDate)
          const yearsSince = (new Date().getTime() - lastDate.getTime()) / (1000 * 3600 * 24 * 365)
          if (yearsSince > 1.5) {
            shouldInclude = true
            serviceType = yearsSince > 2.5 ? 'капитальный ремонт' : 'плановое ТО'
            notes = `🛠️ Последнее ТО: ${lastServiceDate} (прошло ${Math.floor(yearsSince)} лет)`
            const midDate = new Date(start)
            midDate.setMonth(start.getMonth() + Math.floor((end.getMonth() - start.getMonth()) / 2))
            recommendedDate = formatYMD(midDate)
          }
        }

        if (shouldInclude && recommendedDate) {
          tasksList.push({
            planId,
            nodeId: block.id,
            nodeName: block.name,
            nodeLocation: block.location || '',
            recommendedDate,
            serviceType,
            status: 'pending',
            notes: notes,
          })
        }
      }
    }

    tasksList.sort(
      (a, b) => new Date(a.recommendedDate).getTime() - new Date(b.recommendedDate).getTime(),
    )
    return tasksList
  }

  // ========== CRUD Планы ==========
  function addPlan(
    plan: Omit<MaintenancePlan, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>,
    autoGenerateTasks: boolean = false,
  ) {
    const newId = Math.max(...plans.value.map((p) => p.id), 0) + 1
    const now = getCurrentDate()
    const newPlan = { ...plan, id: newId, createdAt: now, updatedAt: now, isDeleted: false }
    plans.value.push(newPlan)

    if (autoGenerateTasks) {
      const tasksList = generateTasksForPlan(newId, plan.startDate, plan.endDate)
      for (const task of tasksList) {
        addTask(task)
      }
    }

    return newPlan
  }

  function updatePlan(id: number, data: Partial<MaintenancePlan>) {
    const idx = plans.value.findIndex((p) => p.id === id)
    if (idx === -1) return
    const plan = plans.value[idx]
    if (!plan) return
    plans.value[idx] = { ...plan, ...data, updatedAt: getCurrentDate() }
  }

  function deletePlan(id: number) {
    const idx = plans.value.findIndex((p) => p.id === id)
    if (idx === -1) return
    const plan = plans.value[idx]
    if (!plan) return
    plan.isDeleted = true
  }

  // ========== CRUD Задачи ==========
  function addTask(task: Omit<MaintenanceTask, 'id'>) {
    const newId = Math.max(...tasks.value.map((t) => t.id), 0) + 1
    tasks.value.push({ ...task, id: newId })
  }

  function updateTask(id: number, data: Partial<MaintenanceTask>) {
    const idx = tasks.value.findIndex((t) => t.id === id)
    if (idx === -1) return
    const existing = tasks.value[idx]
    if (!existing) return
    tasks.value[idx] = { ...existing, ...data }
  }

  function deleteTask(id: number) {
    const idx = tasks.value.findIndex((t) => t.id === id)
    if (idx !== -1) {
      tasks.value.splice(idx, 1)
    }
  }

  return {
    // Данные
    plans: activePlans,
    allPlans,
    tasks,
    tasksHistory,
    // Методы планов
    getTasksForPlan,
    addPlan,
    updatePlan,
    deletePlan,
    // Методы задач
    addTask,
    updateTask,
    deleteTask,
    // Методы автоматического расчёта
    generateAutoPlan,
    generateTasksForPlan,
    getExpiryDate,
    getRecommendedFromExpiry,
  }
})
