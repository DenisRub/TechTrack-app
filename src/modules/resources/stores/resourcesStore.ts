import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Resource, ResourceParameter, ResourceMeasurement } from '../types/resourcesTypes';

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
    nodeName: 'Пост контроля РО 147',
    name: 'Аккумуляторная батарея',
    mark: 'GP12170',
    type: 'Гелевый',
    productionDate: '2020-01-15',
    registrationDate: '2024-01-01',
    registrationNumber: 25,
    serviceLife: 5,
    lastServiceDate: '2024-01-01',
    timeToService: 0.5,
    initialResource: '200 Втч',
    remainingResource: '150 Втч',
    installedIn: 'Пост контроля РО 147',
    notes: '',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    isDeleted: false,
  },
  {
    id: 2,
    nodeId: 2,
    nodeName: 'Пост контроля РО 121',
    name: 'Аккумуляторная батарея',
    mark: 'AC1218',
    type: 'Гелевый',
    productionDate: '2021-03-10',
    registrationDate: '2024-01-01',
    registrationNumber: 34,
    serviceLife: 5,
    lastServiceDate: '2024-01-01',
    timeToService: 1.2,
    initialResource: '215 Втч',
    remainingResource: '172 Втч',
    installedIn: 'Пост контроля РО 121',
    notes: '',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    isDeleted: false,
  },
  {
    id: 3,
    nodeId: 3,
    nodeName: 'УГЗ',
    name: 'Пост контроля РО 147',
    mark: 'БОП-ТА',
    type: 'Оборудование',
    productionDate: '2015-06-01',
    registrationDate: '2015-06-01',
    registrationNumber: 13,
    serviceLife: 10,
    lastServiceDate: '2024-01-01',
    timeToService: 1,
    initialResource: '10 лет',
    remainingResource: '1 год',
    installedIn: '',
    notes: '',
    createdAt: '2015-06-01',
    updatedAt: '2024-01-01',
    isDeleted: false,
  },
  {
    id: 4,
    nodeId: 4,
    nodeName: 'Пост контроля РО 200',
    name: 'Аккумуляторная батарея',
    mark: 'GP12170',
    type: 'Гелевый',
    productionDate: '2018-01-15',
    registrationDate: '2018-01-15',
    registrationNumber: 101,
    serviceLife: 5,
    lastServiceDate: '2022-01-01',
    timeToService: -0.5,
    initialResource: '100%',
    remainingResource: '15%',
    installedIn: 'Пост контроля РО 200',
    notes: 'Требуется срочная замена',
    createdAt: '2018-01-15',
    updatedAt: '2024-01-01',
    isDeleted: false,
  },
];

// Мок-данные – параметры
const mockParameters: ResourceParameter[] = [
  { id: 1, resourceId: 1, name: 'Напряжение', value: 12.2, unit: 'В', isMain: true },
  { id: 2, resourceId: 1, name: 'Внутреннее сопротивление', value: 0.022, unit: 'Ом', isMain: true },
  { id: 3, resourceId: 1, name: 'Ёмкость', value: 85, unit: '%', isMain: false },
  { id: 4, resourceId: 2, name: 'Напряжение', value: 12.5, unit: 'В', isMain: true },
  { id: 5, resourceId: 2, name: 'Внутреннее сопротивление', value: 0.018, unit: 'Ом', isMain: true },
  { id: 6, resourceId: 3, name: 'Напряжение', value: 220, unit: 'В', isMain: true },
  { id: 7, resourceId: 4, name: 'Напряжение', value: 12.8, unit: 'В', isMain: true },
  { id: 8, resourceId: 4, name: 'Внутреннее сопротивление', value: 0.025, unit: 'Ом', isMain: true },
  { id: 9, resourceId: 4, name: 'Ёмкость', value: 85, unit: '%', isMain: false },
];

// Мок-данные – журнал измерений
const mockMeasurements: ResourceMeasurement[] = [
  {
    id: 1,
    resourceId: 2,
    nodeId: 2,
    nodeName: 'Пост контроля РО 121',
    resourceName: 'Аккумуляторная батарея',
    mark: 'AC1218',
    registrationNumber: 34,
    measurementDate: '2025-06-27',
    parameters: { U: 13.1, R: 12, E: 185, C: 1569 },
    createdAt: '2025-06-27',
  },
  {
    id: 2,
    resourceId: 2,
    nodeId: 2,
    nodeName: 'Пост контроля РО 121',
    resourceName: 'Аккумуляторная батарея',
    mark: 'AC1218',
    registrationNumber: 34,
    measurementDate: '2026-01-16',
    parameters: { U: 12.9, R: 15, E: 172, C: 1452 },
    createdAt: '2026-01-16',
  },
  {
    id: 3,
    resourceId: 4,
    nodeId: 4,
    nodeName: 'Пост контроля РО 200',
    resourceName: 'Аккумуляторная батарея',
    mark: 'GP12170',
    registrationNumber: 101,
    measurementDate: '2023-01-15',
    parameters: { U: 12.8, R: 0.025, E: 180, C: 1500 },
    createdAt: '2023-01-15',
  },
  {
    id: 4,
    resourceId: 4,
    nodeId: 4,
    nodeName: 'Пост контроля РО 200',
    resourceName: 'Аккумуляторная батарея',
    mark: 'GP12170',
    registrationNumber: 101,
    measurementDate: '2023-06-15',
    parameters: { U: 12.5, R: 0.030, E: 170, C: 1400 },
    createdAt: '2023-06-15',
  },
  {
    id: 5,
    resourceId: 4,
    nodeId: 4,
    nodeName: 'Пост контроля РО 200',
    resourceName: 'Аккумуляторная батарея',
    mark: 'GP12170',
    registrationNumber: 101,
    measurementDate: '2023-12-15',
    parameters: { U: 12.2, R: 0.035, E: 160, C: 1300 },
    createdAt: '2023-12-15',
  },
  {
    id: 6,
    resourceId: 4,
    nodeId: 4,
    nodeName: 'Пост контроля РО 200',
    resourceName: 'Аккумуляторная батарея',
    mark: 'GP12170',
    registrationNumber: 101,
    measurementDate: '2024-05-15',
    parameters: { U: 11.9, R: 0.040, E: 150, C: 1200 },
    createdAt: '2024-05-15',
  },
  {
    id: 7,
    resourceId: 4,
    nodeId: 4,
    nodeName: 'Пост контроля РО 200',
    resourceName: 'Аккумуляторная батарея',
    mark: 'GP12170',
    registrationNumber: 101,
    measurementDate: '2024-10-15',
    parameters: { U: 11.5, R: 0.045, E: 140, C: 1100 },
    createdAt: '2024-10-15',
  },
];

export const useResourcesStore = defineStore('resources', () => {
  const resources = ref<Resource[]>([...mockResources]);
  const parameters = ref<ResourceParameter[]>([...mockParameters]);
  const measurements = ref<ResourceMeasurement[]>([...mockMeasurements]);

  // Активные ресурсы (не удалённые)
  const activeResources = computed(() => resources.value.filter(r => !r.isDeleted));

  // Основные параметры для отображения в общей таблице
  const mainParameters = computed(() => parameters.value.filter(p => p.isMain === true));

  // ========== Параметры ==========
  function getParametersForResource(resourceId: number): ResourceParameter[] {
    return parameters.value.filter(p => p.resourceId === resourceId);
  }

  function addParameter(param: Omit<ResourceParameter, 'id'>) {
    const newId = Math.max(...parameters.value.map(p => p.id), 0) + 1;
    parameters.value.push({ ...param, id: newId });
  }

  function updateParameter(id: number, data: Partial<ResourceParameter>) {
    const idx = parameters.value.findIndex(p => p.id === id);
    if (idx === -1) return;
    const existing = parameters.value[idx];
    if (!existing) return;
    parameters.value[idx] = {
      id: existing.id,
      resourceId: data.resourceId !== undefined ? data.resourceId : existing.resourceId,
      name: data.name !== undefined ? data.name : existing.name,
      value: data.value !== undefined ? data.value : existing.value,
      unit: data.unit !== undefined ? data.unit : existing.unit,
      isMain: data.isMain !== undefined ? data.isMain : existing.isMain,
    };
  }

  function deleteParameter(id: number) {
    const idx = parameters.value.findIndex(p => p.id === id);
    if (idx !== -1) parameters.value.splice(idx, 1);
  }

  // ========== Измерения (журнал) ==========
  function getMeasurementsForResource(resourceId: number): ResourceMeasurement[] {
    return measurements.value.filter(m => m.resourceId === resourceId).sort((a, b) =>
      new Date(b.measurementDate).getTime() - new Date(a.measurementDate).getTime()
    );
  }

  function addMeasurement(measurement: Omit<ResourceMeasurement, 'id' | 'createdAt'>) {
    const newId = Math.max(...measurements.value.map(m => m.id), 0) + 1;
    const now = getCurrentDate();
    const newMeasurement: ResourceMeasurement = {
      id: newId,
      resourceId: measurement.resourceId,
      nodeId: measurement.nodeId,
      nodeName: measurement.nodeName,
      resourceName: measurement.resourceName,
      mark: measurement.mark,
      registrationNumber: measurement.registrationNumber,
      measurementDate: measurement.measurementDate,
      parameters: measurement.parameters,
      createdAt: now,
    };
    measurements.value.push(newMeasurement);
    console.log(`[AUDIT] Добавлено измерение для ресурса ID ${measurement.resourceId}`);
  }

  function updateMeasurement(id: number, data: Partial<ResourceMeasurement>) {
    const idx = measurements.value.findIndex(m => m.id === id);
    if (idx === -1) return;
    const existing = measurements.value[idx];
    if (!existing) return;
    measurements.value[idx] = {
      id: existing.id,
      resourceId: data.resourceId !== undefined ? data.resourceId : existing.resourceId,
      nodeId: data.nodeId !== undefined ? data.nodeId : existing.nodeId,
      nodeName: data.nodeName !== undefined ? data.nodeName : existing.nodeName,
      resourceName: data.resourceName !== undefined ? data.resourceName : existing.resourceName,
      mark: data.mark !== undefined ? data.mark : existing.mark,
      registrationNumber: data.registrationNumber !== undefined ? data.registrationNumber : existing.registrationNumber,
      measurementDate: data.measurementDate !== undefined ? data.measurementDate : existing.measurementDate,
      parameters: data.parameters !== undefined ? data.parameters : existing.parameters,
      createdAt: existing.createdAt,
    };
  }

  function deleteMeasurement(id: number) {
    const idx = measurements.value.findIndex(m => m.id === id);
    if (idx !== -1) {
      measurements.value.splice(idx, 1);
    }
  }

  // ========== Ресурсы (CRUD) ==========
  function addResource(res: Omit<Resource, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>) {
    const newId = Math.max(...resources.value.map(r => r.id), 0) + 1;
    const now = getCurrentDate();
    resources.value.push({
      ...res,
      id: newId,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    });
  }

  function updateResource(id: number, data: Partial<Resource>) {
    const idx = resources.value.findIndex(r => r.id === id);
    if (idx === -1) return;
    const existing = resources.value[idx];
    if (!existing) return;
    resources.value[idx] = {
      id: existing.id,
      nodeId: data.nodeId !== undefined ? data.nodeId : existing.nodeId,
      nodeName: data.nodeName !== undefined ? data.nodeName : existing.nodeName,
      name: data.name !== undefined ? data.name : existing.name,
      mark: data.mark !== undefined ? data.mark : existing.mark,
      type: data.type !== undefined ? data.type : existing.type,
      productionDate: data.productionDate !== undefined ? data.productionDate : existing.productionDate,
      registrationDate: data.registrationDate !== undefined ? data.registrationDate : existing.registrationDate,
      registrationNumber: data.registrationNumber !== undefined ? data.registrationNumber : existing.registrationNumber,
      serviceLife: data.serviceLife !== undefined ? data.serviceLife : existing.serviceLife,
      lastServiceDate: data.lastServiceDate !== undefined ? data.lastServiceDate : existing.lastServiceDate,
      timeToService: data.timeToService !== undefined ? data.timeToService : existing.timeToService,
      initialResource: data.initialResource !== undefined ? data.initialResource : existing.initialResource,
      remainingResource: data.remainingResource !== undefined ? data.remainingResource : existing.remainingResource,
      installedIn: data.installedIn !== undefined ? data.installedIn : existing.installedIn,
      notes: data.notes !== undefined ? data.notes : existing.notes,
      createdAt: existing.createdAt,
      updatedAt: getCurrentDate(),
      isDeleted: data.isDeleted !== undefined ? data.isDeleted : existing.isDeleted,
    };
  }

  function deleteResource(id: number) {
    const idx = resources.value.findIndex(r => r.id === id);
    if (idx !== -1) {
      const resource = resources.value[idx];
      if (resource) resource.isDeleted = true;
    }
  }

  return {
    // Данные
    resources: activeResources,
    mainParameters,
    measurements,
    // Параметры
    getParametersForResource,
    addParameter,
    updateParameter,
    deleteParameter,
    // Измерения
    getMeasurementsForResource,
    addMeasurement,
    updateMeasurement,
    deleteMeasurement,
    // Ресурсы
    addResource,
    updateResource,
    deleteResource,
  };
});