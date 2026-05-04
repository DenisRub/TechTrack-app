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

// Расширенные мок-данные – ресурсы (привязаны к узлам оборудования)
const mockResources: Resource[] = [
  // Узел 1: Пост контроля АСКРО СЗЗ №9 (агрегат)
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
  // Узел 2: Блок детектирования БДГ-01 №373 (блок)
  {
    id: 2,
    nodeId: 2,
    nodeName: 'Блок детектирования БДГ-01 №373',
    name: 'Детектор гамма-излучения',
    mark: 'БДГ-01',
    type: 'Сцинтилляционный',
    productionDate: '2023-05-20',
    registrationDate: '2024-02-10',
    registrationNumber: 202,
    serviceLife: 8,
    lastServiceDate: '2024-02-10',
    timeToService: 1.2,
    notes: 'Калибровка раз в год',
    createdAt: '2024-02-10',
    updatedAt: '2024-02-10',
    isDeleted: false,
  },
  // Узел 3: Мобильный маршрутизатор iRZ RUH2b (блок)
  {
    id: 3,
    nodeId: 3,
    nodeName: 'Мобильный маршрутизатор iRZ RUH2b',
    name: 'Маршрутизатор',
    mark: 'iRZ RUH2b',
    type: 'Сотовая связь',
    productionDate: '2023-12-10',
    registrationDate: '2024-03-01',
    registrationNumber: 303,
    serviceLife: 3,
    lastServiceDate: '2024-03-01',
    timeToService: 0.3,
    notes: 'Требуется обновление прошивки',
    createdAt: '2024-03-01',
    updatedAt: '2024-03-01',
    isDeleted: false,
  },
  // Узел 4: Блок питания резервный (блок, свободный, не в составе)
  {
    id: 4,
    nodeId: 4,
    nodeName: 'Блок питания резервный',
    name: 'Блок питания',
    mark: 'MeanWell',
    type: 'Импульсный',
    productionDate: '2024-01-10',
    registrationDate: '2024-02-15',
    registrationNumber: 404,
    serviceLife: 6,
    lastServiceDate: '2024-02-15',
    timeToService: 1.5,
    notes: 'Требуется проверка выходного напряжения',
    createdAt: '2024-02-15',
    updatedAt: '2024-02-15',
    isDeleted: false,
  },
];

// Расширенные мок-данные – параметры для каждого ресурса
const mockParameters: ResourceParameter[] = [
  // Ресурс 1 (Аккумулятор)
  { id: 1, resourceId: 1, name: 'Емкость', value: 85, unit: '%', isMain: true },
  { id: 2, resourceId: 1, name: 'Напряжение', value: 12.2, unit: 'В', isMain: false },
  { id: 3, resourceId: 1, name: 'Внутреннее сопротивление', value: 0.022, unit: 'Ом', isMain: false },
  { id: 4, resourceId: 1, name: 'Остаточный срок службы', value: 3.5, unit: 'лет', isMain: true },
  // Ресурс 2 (Детектор)
  { id: 5, resourceId: 2, name: 'Эффективность регистрации', value: 92, unit: '%', isMain: true },
  { id: 6, resourceId: 2, name: 'Напряжение питания', value: 12.0, unit: 'В', isMain: false },
  { id: 7, resourceId: 2, name: 'Ток потребления', value: 0.5, unit: 'А', isMain: false },
  { id: 8, resourceId: 2, name: 'Остаточный срок службы', value: 6.5, unit: 'лет', isMain: true },
  // Ресурс 3 (Маршрутизатор)
  { id: 9, resourceId: 3, name: 'Уровень сигнала', value: 75, unit: '%', isMain: true },
  { id: 10, resourceId: 3, name: 'Трафик (мес)', value: 1250, unit: 'ГБ', isMain: false },
  { id: 11, resourceId: 3, name: 'Остаточный ресурс', value: 0.5, unit: 'лет', isMain: true },
  // Ресурс 4 (Блок питания)
  { id: 12, resourceId: 4, name: 'Выходное напряжение', value: 12.1, unit: 'В', isMain: true },
  { id: 13, resourceId: 4, name: 'Ток нагрузки', value: 2.5, unit: 'А', isMain: false },
  { id: 14, resourceId: 4, name: 'КПД', value: 88, unit: '%', isMain: true },
];

export const useResourcesStore = defineStore('resources', () => {
  const resources = ref<Resource[]>([...mockResources]);
  const parameters = ref<ResourceParameter[]>([...mockParameters]);

  const activeResources = computed(() => resources.value.filter(r => !r.isDeleted));
  const mainParameters = computed(() => parameters.value.filter(p => p.isMain));

  function getParametersForResource(resourceId: number): ResourceParameter[] {
    return parameters.value.filter(p => p.resourceId === resourceId);
  }

  function getRemainingLife(resourceId: number): number | null {
    const params = getParametersForResource(resourceId);
    const lifeParam = params.find(p => p.name === 'Остаточный срок службы' || p.name === 'Остаточный ресурс');
    if (lifeParam) {
      return typeof lifeParam.value === 'number' ? lifeParam.value : parseFloat(lifeParam.value as string);
    }
    return null;
  }

  // Дополнительная функция для получения параметра по имени (для графиков)
  function getParameterValue(resourceId: number, paramName: string): number | null {
    const param = parameters.value.find(p => p.resourceId === resourceId && p.name === paramName);
    return param ? (typeof param.value === 'number' ? param.value : parseFloat(param.value as string)) : null;
  }

  // ========== Автоматический расчёт ==========
  function calculateRemainingYears(ratedHours: number, workHoursPerYear: number): number {
    return parseFloat((ratedHours / workHoursPerYear).toFixed(2));
  }

  function updateResourceByWorkMode(resourceId: number, nodeId: number, workHoursPerYear: number) {
    const resource = resources.value.find(r => r.id === resourceId);
    if (!resource) return false;

    const ratedHours = (resource.serviceLife || 5) * 8760;
    const remainingYears = calculateRemainingYears(ratedHours, workHoursPerYear);
    
    const existingParam = parameters.value.find(p => p.resourceId === resourceId && (p.name === 'Остаточный срок службы' || p.name === 'Остаточный ресурс'));
    const paramName = resource.name === 'Маршрутизатор' ? 'Остаточный ресурс' : 'Остаточный срок службы';
    
    if (existingParam) {
      updateParameter(existingParam.id, { value: remainingYears });
    } else {
      addParameter({
        resourceId,
        name: paramName,
        value: remainingYears,
        unit: 'лет',
        isMain: true,
      });
    }
    
    if (resource.timeToService) {
      const newTimeToService = Math.max(0, resource.timeToService - (workHoursPerYear / 8760));
      updateResource(resourceId, { timeToService: parseFloat(newTimeToService.toFixed(2)) });
    }
    return true;
  }

  // ========== CRUD ==========
  function addResource(res: Omit<Resource, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>) {
    const newId = Math.max(...resources.value.map(r => r.id), 0) + 1;
    const now = getCurrentDate();
    resources.value.push({ ...res, id: newId, createdAt: now, updatedAt: now, isDeleted: false });
  }

  function updateResource(id: number, data: Partial<Resource>) {
    const idx = resources.value.findIndex(r => r.id === id);
    if (idx === -1) return;
    const existing = resources.value[idx];
    if (!existing) return;
    resources.value[idx] = {
      ...existing,
      ...data,
      updatedAt: getCurrentDate(),
    };
  }

 function deleteResource(id: number) {
  const resource = resources.value.find(r => r.id === id);
  if (resource) {
    resource.isDeleted = true;
  }
}

  // ========== Параметры ==========
  function addParameter(param: Omit<ResourceParameter, 'id'>) {
    const newId = Math.max(...parameters.value.map(p => p.id), 0) + 1;
    parameters.value.push({ ...param, id: newId });
  }

  function updateParameter(id: number, data: Partial<ResourceParameter>) {
    const idx = parameters.value.findIndex(p => p.id === id);
    if (idx === -1) return;
    const existing = parameters.value[idx];
    if (!existing) return;
    parameters.value[idx] = { ...existing, ...data };
  }

  function deleteParameter(id: number) {
    const idx = parameters.value.findIndex(p => p.id === id);
    if (idx !== -1) parameters.value.splice(idx, 1);
  }

  return {
    resources: activeResources,
    mainParameters,
    getParametersForResource,
    getRemainingLife,
    getParameterValue,
    addResource,
    updateResource,
    deleteResource,
    addParameter,
    updateParameter,
    deleteParameter,
    calculateRemainingYears,
    updateResourceByWorkMode,
  };
});