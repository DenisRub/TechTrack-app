import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Resource, ResourceParameter } from '../types/resourcesTypes';

function getCurrentDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Мок-данные – ресурсы
const mockResources: Resource[] = [
  {
    id: 1,
    nodeId: 1,
    nodeName: 'Пост контроля АСКРО СЗЗ №9',
    name: 'Аккумуляторная батарея',
    mark: 'Восток 12-7',
    type: 'Гелевый',
    productionDate: '2022-01-15',
    registrationDate: '2024-01-01',
    registrationNumber: 101,
    serviceLife: 5,
    lastServiceDate: '2024-01-01',
    timeToService: 0.5,
    notes: 'Требуется регулярная проверка ёмкости',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    isDeleted: false,
  },
];

// Мок-данные – параметры
const mockParameters: ResourceParameter[] = [
  { id: 1, resourceId: 1, name: 'Емкость', value: 85, unit: '%', isMain: true },
  { id: 2, resourceId: 1, name: 'Напряжение', value: 12.2, unit: 'В', isMain: false },
  { id: 3, resourceId: 1, name: 'Внутреннее сопротивление', value: 0.022, unit: 'Ом', isMain: false },
  { id: 4, resourceId: 1, name: 'Остаточный срок службы', value: 3.5, unit: 'лет', isMain: true },
];

export const useResourcesStore = defineStore('resources', () => {
  const resources = ref<Resource[]>([...mockResources]);
  const parameters = ref<ResourceParameter[]>([...mockParameters]);

  // Активные ресурсы (не удалённые)
  const activeResources = computed<Resource[]>(() => {
    return resources.value.filter(r => !r.isDeleted);
  });

  // Основные параметры для отображения в общей таблице
  const mainParameters = computed<ResourceParameter[]>(() => {
    return parameters.value.filter(p => p.isMain === true);
  });

  // Получить параметры для конкретного ресурса
  function getParametersForResource(resourceId: number): ResourceParameter[] {
    return parameters.value.filter(p => p.resourceId === resourceId);
  }

  // Получить остаточный срок службы ресурса
  function getRemainingLife(resourceId: number): number | null {
    const params = getParametersForResource(resourceId);
    const lifeParam = params.find(p => p.name === 'Остаточный срок службы');
    if (lifeParam) {
      return typeof lifeParam.value === 'number' ? lifeParam.value : parseFloat(lifeParam.value as string);
    }
    return null;
  }

  // ========== Автоматический расчёт ресурса по режиму работы ==========
  
  /**
   * Рассчитать оставшийся ресурс в годах на основе режима работы узла
   * @param ratedHours - Номинальный ресурс в часах (например, 5000 часов для АКБ)
   * @param workHoursPerYear - Режим работы в часах в год (8760 для 24/7, 2080 для 5/8)
   * @returns Оставшийся ресурс в годах
   */
  function calculateRemainingYears(ratedHours: number, workHoursPerYear: number): number {
    const remainingYears = ratedHours / workHoursPerYear;
    return parseFloat(remainingYears.toFixed(2));
  }

  /**
   * Обновить ресурс на основе режима работы узла
   * @param resourceId - ID ресурса
   * @param nodeId - ID узла (для получения режима работы)
   * @param workHoursPerYear - Режим работы в часах в год
   */
  function updateResourceByWorkMode(resourceId: number, nodeId: number, workHoursPerYear: number) {
    const resource = resources.value.find(r => r.id === resourceId);
    if (!resource) return false;

    // Получаем номинальный ресурс (срок службы в часах)
    const ratedHours = (resource.serviceLife || 5) * 8760; // по умолчанию 5 лет * 8760 часов
    
    // Рассчитываем оставшийся ресурс в годах
    const remainingYears = calculateRemainingYears(ratedHours, workHoursPerYear);
    
    // Обновляем или создаём параметр "Остаточный срок службы"
    const existingParam = parameters.value.find(p => p.resourceId === resourceId && p.name === 'Остаточный срок службы');
    
    if (existingParam) {
      updateParameter(existingParam.id, { value: remainingYears });
    } else {
      addParameter({
        resourceId,
        name: 'Остаточный срок службы',
        value: remainingYears,
        unit: 'лет',
        isMain: true,
      });
    }
    
    // Обновляем срок до ТО, если применимо
    if (resource.timeToService) {
      const newTimeToService = Math.max(0, resource.timeToService - (workHoursPerYear / 8760));
      updateResource(resourceId, { timeToService: parseFloat(newTimeToService.toFixed(2)) });
    }
    
    return true;
  }

  /**
   * Автоматический расчёт для всех ресурсов узла
   * @param nodeId - ID узла
   * @param workHoursPerYear - Режим работы в часах в год
   */
  function calculateAllResourcesForNode(nodeId: number, workHoursPerYear: number) {
    const nodeResources = resources.value.filter(r => r.nodeId === nodeId && !r.isDeleted);
    let calculatedCount = 0;
    
    for (const res of nodeResources) {
      if (updateResourceByWorkMode(res.id, nodeId, workHoursPerYear)) {
        calculatedCount++;
      }
    }
    
    return calculatedCount;
  }

  // ========== Базовые CRUD операции ==========

  // Добавить ресурс
  function addResource(res: Omit<Resource, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>) {
    const newId = Math.max(...resources.value.map(r => r.id), 0) + 1;
    const now = getCurrentDate();
    resources.value.push({ ...res, id: newId, createdAt: now, updatedAt: now, isDeleted: false });
  }

  // Обновить ресурс
  function updateResource(id: number, data: Partial<Resource>) {
    const idx = resources.value.findIndex(r => r.id === id);
    if (idx === -1) return;
    const existing = resources.value[idx];
    if (!existing) return;
    resources.value[idx] = {
      id: existing.id,
      nodeId: data.nodeId ?? existing.nodeId,
      nodeName: data.nodeName ?? existing.nodeName,
      name: data.name ?? existing.name,
      mark: data.mark ?? existing.mark,
      type: data.type ?? existing.type,
      productionDate: data.productionDate ?? existing.productionDate,
      registrationDate: data.registrationDate ?? existing.registrationDate,
      registrationNumber: data.registrationNumber ?? existing.registrationNumber,
      serviceLife: data.serviceLife ?? existing.serviceLife,
      lastServiceDate: data.lastServiceDate ?? existing.lastServiceDate,
      timeToService: data.timeToService ?? existing.timeToService,
      notes: data.notes ?? existing.notes,
      createdAt: existing.createdAt,
      updatedAt: getCurrentDate(),
      isDeleted: data.isDeleted ?? existing.isDeleted,
    };
  }

  // Удалить ресурс (soft delete)
  function deleteResource(id: number) {
    const idx = resources.value.findIndex(r => r.id === id);
    if (idx !== -1) {
      const resource = resources.value[idx];
      if (resource) {
        resource.isDeleted = true;
      }
    }
  }

  // ========== Параметры ==========

  // Добавить параметр
  function addParameter(param: Omit<ResourceParameter, 'id'>) {
    const newId = Math.max(...parameters.value.map(p => p.id), 0) + 1;
    parameters.value.push({ ...param, id: newId });
  }

  // Обновить параметр
  function updateParameter(id: number, data: Partial<ResourceParameter>) {
    const idx = parameters.value.findIndex(p => p.id === id);
    if (idx === -1) return;
    const existing = parameters.value[idx];
    if (!existing) return;
    parameters.value[idx] = {
      id: existing.id,
      resourceId: data.resourceId ?? existing.resourceId,
      name: data.name ?? existing.name,
      value: data.value ?? existing.value,
      unit: data.unit ?? existing.unit,
      isMain: data.isMain ?? existing.isMain,
    };
  }

  // Удалить параметр
  function deleteParameter(id: number) {
    const idx = parameters.value.findIndex(p => p.id === id);
    if (idx !== -1) {
      parameters.value.splice(idx, 1);
    }
  }

  return {
    // Данные
    resources: activeResources,
    mainParameters,
    // Методы ресурсов
    getParametersForResource,
    getRemainingLife,
    addResource,
    updateResource,
    deleteResource,
    // Методы параметров
    addParameter,
    updateParameter,
    deleteParameter,
    // Методы автоматического расчёта
    calculateRemainingYears,
    updateResourceByWorkMode,
    calculateAllResourcesForNode,
  };
});