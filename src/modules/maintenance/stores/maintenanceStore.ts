import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { MaintenancePlan, MaintenanceTask } from '../types/maintenanceTypes';
import { useEquipmentStore } from '@/modules/equipment/stores/equipmentStore';
import { useResourcesStore } from '@/modules/resources/stores/resourcesStore';
import { useSIStore } from '@/modules/si/stores/siStore';

function getCurrentDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
    isDeleted: false 
  },
  { 
    id: 2, 
    name: 'План ТО на 2025 год', 
    startDate: '2025-01-01', 
    endDate: '2025-12-31', 
    description: 'Годовой план', 
    createdAt: '2024-01-01', 
    updatedAt: '2024-01-01', 
    isDeleted: false 
  },
];

// Мок-данные – задачи ТО
const mockTasks: MaintenanceTask[] = [
  { 
    id: 1, planId: 1, nodeId: 1, nodeName: 'Пост контроля АСКРО СЗЗ №9', 
    nodeLocation: 'ПП №1', recommendedDate: '2026-05-15', 
    serviceType: 'плановое ТО', status: 'pending', notes: '' 
  },
  { 
    id: 2, planId: 1, nodeId: 2, nodeName: 'Блок детектирования БДГ-01 №373', 
    nodeLocation: 'ПП №1', recommendedDate: '2026-09-30', 
    serviceType: 'плановое ТО', status: 'pending', notes: '' 
  },
  { 
    id: 3, planId: 1, nodeId: 3, nodeName: 'Мобильный маршрутизатор iRZ RUH2b', 
    nodeLocation: 'ПП №1', recommendedDate: '2026-03-20', 
    serviceType: 'внеплановое ТО', status: 'completed', 
    completedDate: '2026-03-18', notes: '' 
  },
  { 
    id: 4, planId: 2, nodeId: 1, nodeName: 'Пост контроля АСКРО СЗЗ №9', 
    nodeLocation: 'ПП №1', recommendedDate: '2025-06-10', 
    serviceType: 'плановое ТО', status: 'completed', 
    completedDate: '2025-06-05', notes: '' 
  },
];

export const useMaintenanceStore = defineStore('maintenance', () => {
  const plans = ref<MaintenancePlan[]>([...mockPlans]);
  const tasks = ref<MaintenanceTask[]>([...mockTasks]);
  const tasksHistory = ref<MaintenanceTask[]>([...mockTasks]);

  // Активные планы (не удалённые), отсортированные по близости к текущей дате
  const activePlans = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return plans.value
      .filter(p => !p.isDeleted)
      .sort((a, b) => {
        const dateA = new Date(a.startDate);
        dateA.setHours(0, 0, 0, 0);
        const dateB = new Date(b.startDate);
        dateB.setHours(0, 0, 0, 0);
        const diffA = Math.abs(dateA.getTime() - today.getTime());
        const diffB = Math.abs(dateB.getTime() - today.getTime());
        return diffA - diffB;
      });
  });

  // Все планы (включая удалённые)
  const allPlans = computed(() => plans.value);

  // Задачи для конкретного плана
  function getTasksForPlan(planId: number): MaintenanceTask[] {
    return tasks.value
      .filter(t => t.planId === planId)
      .sort((a, b) => new Date(a.recommendedDate).getTime() - new Date(b.recommendedDate).getTime());
  }

  // ========== Функции для автоматического расчёта ==========

  // Форматирование даты в строку YYYY-MM-DD
  function formatYMD(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Получить дату истечения срока ТО для узла
  function getExpiryDate(nodeId: number): string | null {
    const equipmentStore = useEquipmentStore();
    const resourcesStore = useResourcesStore();
    const siStore = useSIStore();
    
    let lastDate: Date | null = null;
    let maxInterval = 0;

    // 1. Проверяем СИ
    const siList = siStore.instruments.filter((si: any) => si.nodeId === nodeId);
    for (const si of siList) {
      if (si.lastVerificationDate) {
        const date = new Date(si.lastVerificationDate);
        if (!lastDate || date > lastDate) lastDate = date;
        maxInterval = Math.max(maxInterval, si.verificationInterval);
      }
    }

    // 2. Проверяем ресурсы
    const resources = resourcesStore.resources.filter((r: any) => r.nodeId === nodeId);
    for (const res of resources) {
      if (res.lastServiceDate) {
        const date = new Date(res.lastServiceDate);
        if (!lastDate || date > lastDate) lastDate = date;
      }
      if (res.timeToService && res.timeToService > maxInterval) {
        maxInterval = res.timeToService;
      }
    }

    // 3. Проверяем оборудование
    const node = equipmentStore.nodes.find((n: any) => n.id === nodeId);
    if (node && node.updatedAt) {
      const date = new Date(node.updatedAt);
      if (!lastDate || date > lastDate) lastDate = date;
    }

    if (lastDate && maxInterval > 0) {
      const expiryDate = new Date(lastDate);
      expiryDate.setFullYear(expiryDate.getFullYear() + maxInterval);
      return formatYMD(expiryDate);
    }
    return null;
  }

  // Получить рекомендуемую дату проведения ТО (на 10 дней раньше даты истечения)
  function getRecommendedFromExpiry(expiryDate: string | null): string | null {
    if (!expiryDate) return null;
    const date = new Date(expiryDate);
    date.setDate(date.getDate() - 10);
    return formatYMD(date);
  }

  // Определение типа обслуживания
  function determineServiceType(factors: {
    timeToService: number | null;
    remainingLife: number | null;
    nextVerificationDate: string | null;
  }): MaintenanceTask['serviceType'] {
    const { timeToService, remainingLife, nextVerificationDate } = factors;
    
    if (nextVerificationDate) {
      const nextDate = new Date(nextVerificationDate);
      const today = new Date();
      const daysToVerification = (nextDate.getTime() - today.getTime()) / (1000 * 3600 * 24);
      if (daysToVerification <= 30) {
        return 'аварийный ремонт';
      }
    }
    
    if (timeToService && timeToService < 0.5) {
      return 'капитальный ремонт';
    }
    
    if (remainingLife && remainingLife < 1) {
      return 'внеплановое ТО';
    }
    
    return 'плановое ТО';
  }

  // Генерация примечаний к задаче
  function generateTaskNotes(factors: {
    timeToService: number | null;
    remainingLife: number | null;
    nextVerificationDate: string | null;
    lastServiceDate: string | null;
  }): string {
    const notes = [];
    
    if (factors.timeToService && factors.timeToService < 1) {
      notes.push(`⚠️ Срок до ТО: ${factors.timeToService} лет`);
    }
    if (factors.remainingLife && factors.remainingLife < 2) {
      notes.push(`📊 Остаточный ресурс: ${factors.remainingLife} лет`);
    }
    if (factors.nextVerificationDate) {
      notes.push(`🔧 Следующая поверка СИ: ${factors.nextVerificationDate}`);
    }
    if (factors.lastServiceDate) {
      notes.push(`🛠️ Последнее ТО: ${factors.lastServiceDate}`);
    }
    
    return notes.join(' | ');
  }

  // Форматирование даты в строку YYYY-MM-DD
  function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Расчёт рекомендуемой даты ТО
  function calculateRecommendedDate(
    start: Date, 
    end: Date, 
    factors: {
      timeToService: number | null;
      remainingLife: number | null;
      nextVerificationDate: string | null;
      lastServiceDate: string | null;
    }
  ): string | null {
    const { timeToService, remainingLife, nextVerificationDate, lastServiceDate } = factors;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let targetDate: Date | null = null;
    
    // Приоритет 1: Срок до ТО из ресурсов
    if (timeToService && timeToService > 0 && timeToService < 5) {
      targetDate = new Date(today);
      targetDate.setMonth(today.getMonth() + Math.round(timeToService * 12));
    }
    // Приоритет 2: Остаточный ресурс
    else if (remainingLife && remainingLife > 0 && remainingLife < 3) {
      targetDate = new Date(today);
      targetDate.setMonth(today.getMonth() + Math.round(remainingLife * 12));
    }
    // Приоритет 3: Дата следующей поверки СИ
    else if (nextVerificationDate) {
      targetDate = new Date(nextVerificationDate);
      if (!isNaN(targetDate.getTime())) {
        const daysToVerification = (targetDate.getTime() - today.getTime()) / (1000 * 3600 * 24);
        if (daysToVerification <= 60 && daysToVerification > 0) {
          targetDate.setMonth(targetDate.getMonth() - 1);
        }
      } else {
        targetDate = null;
      }
    }
    // Приоритет 4: Последнее ТО было давно (более года)
    else if (lastServiceDate) {
      const lastDate = new Date(lastServiceDate);
      if (!isNaN(lastDate.getTime())) {
        const monthsSince = (today.getTime() - lastDate.getTime()) / (1000 * 3600 * 24 * 30);
        if (monthsSince > 12) {
          targetDate = new Date(today);
          targetDate.setMonth(today.getMonth() + 3);
        }
      }
    }
    
    // Если не удалось определить дату, ставим в середину планового периода
    if (!targetDate || isNaN(targetDate.getTime())) {
      targetDate = new Date(start);
      const midMonth = start.getMonth() + Math.floor((end.getMonth() - start.getMonth()) / 2);
      targetDate.setMonth(midMonth);
    }
    
    if (isNaN(targetDate.getTime())) {
      return null;
    }
    
    // Ограничиваем дату в пределах планового периода
    if (targetDate < start) targetDate = start;
    if (targetDate > end) targetDate = end;
    
    return formatDate(targetDate);
  }

  // Генерация автоматического плана
  function generateAutoPlan(startDate: string, endDate: string, year?: number): Omit<MaintenancePlan, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'> {
    const yearNum = year || new Date(startDate).getFullYear();
    const planName = `План ТО на ${yearNum} год (автоматический)`;
    
    return {
      name: planName,
      startDate,
      endDate,
      description: `Автоматически сформированный план технического обслуживания на ${yearNum} год на основе анализа ресурсов, СИ и истории ТО.`,
    };
  }

  // Генерация задач для плана
  function generateTasksForPlan(planId: number, startDateStr: string, endDateStr: string): Omit<MaintenanceTask, 'id'>[] {
    const equipmentStore = useEquipmentStore();
    const resourcesStore = useResourcesStore();
    const siStore = useSIStore();
    
    const tasksList: Omit<MaintenanceTask, 'id'>[] = [];
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    
    console.log('=== Генерация плана ТО ===');
    console.log('Период:', startDateStr, '-', endDateStr);
    
    // Получаем ВСЕ блоки (не агрегаты)
    const allBlocks = equipmentStore.nodes.filter((n: any) => !n.isDeleted && n.type === 'block');
    console.log('Всего блоков:', allBlocks.length);
    
    for (const block of allBlocks) {
      console.log(`\n--- Обработка блока: ${block.name} (ID: ${block.id}) ---`);
      
      // Получаем дату истечения срока ТО
      const expiryDate = getExpiryDate(block.id);
      console.log(`  Дата истечения срока ТО: ${expiryDate || 'не определена'}`);
      
      // Рассчитываем рекомендуемую дату проведения ТО (на 10 дней раньше)
      const recommendedFromExpiry = getRecommendedFromExpiry(expiryDate);
      
      // Проверяем ресурсы узла
      let timeToService: number | null = null;
      let remainingLife: number | null = null;
      
      const resourceData = resourcesStore.resources.find((r: any) => r.nodeId === block.id);
      if (resourceData) {
        if (resourceData.timeToService !== undefined && resourceData.timeToService !== null) {
          timeToService = resourceData.timeToService;
        }
        if (resourceData.serviceLife !== undefined && resourceData.serviceLife !== null) {
          remainingLife = resourceData.serviceLife;
        }
      }
      
      const resourceParams = resourcesStore.getParametersForResource(block.id);
      for (const param of resourceParams) {
        let paramValue = '';
        if (param.value !== undefined && param.value !== null) {
          paramValue = String(param.value);
        }
        const parsed = parseFloat(paramValue);
        if (!isNaN(parsed)) {
          if (param.name === 'Срок до ТО' || param.name === 'timeToService') {
            timeToService = parsed;
          }
          if (param.name === 'Остаточный ресурс' || param.name === 'remainingLife' || param.name === 'Остаточный срок службы') {
            remainingLife = parsed;
          }
        }
      }
      
      // Проверяем СИ
      let nextVerificationDate: string | null = null;
      const siList = siStore.instruments.filter((si: any) => si.nodeId === block.id);
      if (siList.length > 0 && siList[0]) {
        nextVerificationDate = siList[0].nextVerificationDate;
        console.log(`  Найдено СИ, следующая поверка: ${nextVerificationDate}`);
      }
      
      // Проверяем историю ТО
      let lastServiceDate: string | null = null;
      const existingTasks = tasksHistory.value.filter(t => t.nodeId === block.id);
      const completedTasks = existingTasks.filter(t => t.status === 'completed');
      if (completedTasks.length > 0) {
        const lastTask = completedTasks.sort((a, b) => 
          new Date(b.completedDate || b.recommendedDate).getTime() - new Date(a.completedDate || a.recommendedDate).getTime()
        )[0];
        if (lastTask) {
          lastServiceDate = lastTask.completedDate || lastTask.recommendedDate;
          console.log(`  Последнее ТО: ${lastServiceDate}`);
        }
      }
      
      // Определяем, нужно ли включать блок в план
      let shouldInclude = false;
      let recommendedDate: string | null = recommendedFromExpiry;
      let serviceType: MaintenanceTask['serviceType'] = 'плановое ТО';
      let notes: string = '';
      
      if (expiryDate) {
        const expiryDateObj = new Date(expiryDate);
        const today = new Date();
        const daysToExpiry = (expiryDateObj.getTime() - today.getTime()) / (1000 * 3600 * 24);
        
        if (daysToExpiry <= 365) {
          shouldInclude = true;
          recommendedDate = recommendedFromExpiry;
          serviceType = determineServiceType({ timeToService, remainingLife, nextVerificationDate });
          notes = `⏰ Срок ТО истекает ${formatDate(expiryDateObj)}`;
          console.log(`  ВКЛЮЧЁН по дате истечения срока ТО (${Math.floor(daysToExpiry)} дней)`);
        }
      } else if (timeToService !== null && timeToService < 2) {
        shouldInclude = true;
        serviceType = timeToService < 0.5 ? 'капитальный ремонт' : 'плановое ТО';
        notes = `⚠️ Срок до ТО: ${timeToService} лет`;
        console.log(`  ВКЛЮЧЁН по сроку до ТО (${timeToService} < 2)`);
      } else if (remainingLife !== null && remainingLife < 2) {
        shouldInclude = true;
        serviceType = remainingLife < 1 ? 'внеплановое ТО' : 'плановое ТО';
        notes = `📊 Остаточный ресурс: ${remainingLife} лет`;
        console.log(`  ВКЛЮЧЁН по остаточному ресурсу (${remainingLife} < 2)`);
      } else if (nextVerificationDate) {
        const nextDate = new Date(nextVerificationDate);
        const today = new Date();
        const daysToVerification = (nextDate.getTime() - today.getTime()) / (1000 * 3600 * 24);
        if (daysToVerification <= 180) {
          shouldInclude = true;
          recommendedDate = nextVerificationDate;
          serviceType = daysToVerification <= 30 ? 'аварийный ремонт' : 'плановое ТО';
          notes = `🔧 Следующая поверка СИ: ${nextVerificationDate}`;
          console.log(`  ВКЛЮЧЁН по поверке СИ (через ${Math.floor(daysToVerification)} дней)`);
        }
      } else if (lastServiceDate) {
        const lastDate = new Date(lastServiceDate);
        const yearsSince = (new Date().getTime() - lastDate.getTime()) / (1000 * 3600 * 24 * 365);
        if (yearsSince > 1.5) {
          shouldInclude = true;
          serviceType = yearsSince > 2.5 ? 'капитальный ремонт' : 'плановое ТО';
          notes = `🛠️ Последнее ТО: ${lastServiceDate} (прошло ${Math.floor(yearsSince)} лет)`;
          console.log(`  ВКЛЮЧЁН по давности ТО (${Math.floor(yearsSince)} > 1.5 лет)`);
        }
      } else if (resourceParams.length > 0 || resourceData !== undefined || siList.length > 0) {
        shouldInclude = true;
        serviceType = 'плановое ТО';
        notes = 'Плановое техническое обслуживание';
        console.log(`  ВКЛЮЧЁН по наличию ресурсов/СИ`);
      }
      
      if (shouldInclude && recommendedDate) {
        const recDate = new Date(recommendedDate);
        if (recDate >= start && recDate <= end) {
          tasksList.push({
            planId,
            nodeId: block.id,
            nodeName: block.name,
            nodeLocation: block.location || '',
            recommendedDate,
            serviceType,
            status: 'pending',
            notes: notes,
          });
          console.log(`  ✅ ЗАДАЧА ДОБАВЛЕНА: ${block.name} на ${recommendedDate}`);
        } else {
          console.log(`  ⏭️ Дата ${recommendedDate} вне планового периода`);
        }
      } else {
        console.log(`  ❌ НЕ ВКЛЮЧЁН`);
      }
    }
    
    tasksList.sort((a, b) => new Date(a.recommendedDate).getTime() - new Date(b.recommendedDate).getTime());
    console.log(`\n=== ИТОГО ЗАДАЧ: ${tasksList.length} ===`);
    return tasksList;
  }

  // ========== CRUD Планы ==========
  function addPlan(plan: Omit<MaintenancePlan, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>, autoGenerateTasks: boolean = false) {
    const newId = Math.max(...plans.value.map(p => p.id), 0) + 1;
    const now = getCurrentDate();
    const newPlan = { ...plan, id: newId, createdAt: now, updatedAt: now, isDeleted: false };
    plans.value.push(newPlan);
    
    if (autoGenerateTasks) {
      const tasksList = generateTasksForPlan(newId, plan.startDate, plan.endDate);
      for (const task of tasksList) {
        addTask(task);
      }
    }
    
    return newPlan;
  }

  function updatePlan(id: number, data: Partial<MaintenancePlan>) {
    const idx = plans.value.findIndex(p => p.id === id);
    if (idx === -1) return;
    const plan = plans.value[idx];
    if (!plan) return;
    plans.value[idx] = { ...plan, ...data, updatedAt: getCurrentDate() };
  }

  function deletePlan(id: number) {
    const idx = plans.value.findIndex(p => p.id === id);
    if (idx === -1) return;
    const plan = plans.value[idx];
    if (!plan) return;
    plan.isDeleted = true;
  }

  // ========== CRUD Задачи ==========
  function addTask(task: Omit<MaintenanceTask, 'id'>) {
    const newId = Math.max(...tasks.value.map(t => t.id), 0) + 1;
    tasks.value.push({ ...task, id: newId });
  }

  function updateTask(id: number, data: Partial<MaintenanceTask>) {
    const idx = tasks.value.findIndex(t => t.id === id);
    if (idx === -1) return;
    const existing = tasks.value[idx];
    if (!existing) return;
    tasks.value[idx] = { ...existing, ...data };
  }

  function deleteTask(id: number) {
    const idx = tasks.value.findIndex(t => t.id === id);
    if (idx !== -1) {
      tasks.value.splice(idx, 1);
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
  };
});