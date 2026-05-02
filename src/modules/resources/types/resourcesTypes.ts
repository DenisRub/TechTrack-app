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
  nodeId: number;         // ID узла (к какому оборудованию относится)
  nodeName?: string;      // Название узла для отображения
  name: string;           // Наименование ресурса (Аккумуляторная батарея)
  mark?: string;          // Марка (Восток 12-7)
  type?: string;          // Тип (Гелевый)
  productionDate?: string; // Дата производства
  registrationDate: string; // Дата регистрации
  registrationNumber?: number; // Учетный номер
  serviceLife?: number;   // Срок службы (лет)
  lastServiceDate?: string; // Дата последнего ТО
  timeToService?: number; // Срок до ТО (лет)
  notes?: string;         // Примечания
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}