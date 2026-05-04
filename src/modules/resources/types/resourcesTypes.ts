// Тип для параметра ресурса (емкость, напряжение и т.д.)
export interface ResourceParameter {
  id: number;
  resourceId: number;
  name: string;           // Наименование параметра (Емкость, Напряжение)
  value: string | number;
  unit: string;           // Единица измерения (%, В, Ом, лет)
  isMain: boolean;        // Основной параметр (будет в общей таблице)
}

// Основной ресурс (аккумулятор, картридж и т.д.)
export interface Resource {
  id: number;
  nodeId: number;
  nodeName?: string;
  name: string;
  value?: string | number;   // добавим
  unit?: string;             // добавим
  mark?: string;
  type?: string;
  productionDate?: string;
registrationDate?: string;
  registrationNumber?: number;
  serviceLife?: number;
  lastServiceDate?: string;
  timeToService?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}