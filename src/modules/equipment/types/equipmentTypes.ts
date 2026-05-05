export interface EquipmentNode {
  id: number;
  name: string;                 // Наименование
  type: 'aggregate' | 'block'; // Тип (агрегат/блок)
  nodeTypeId?: number | null;  // Вид узла
  parentId?: number | null;    // Родительский узел (для иерархии)
  subsystem?: string;          // Подсистема
  manufacturer?: string;       // Производитель
  model?: string;              // Марка
  serialNumber?: string;       // Заводской номер
  inventoryNumber?: string;    // Инвентарный номер
  accountingNumber?: string;   // Учетный номер
  dateManufacture?: string;    // Дата производства
  dateInstallation?: string;   // Дата установки
  operationMode?: string;      // Режим работы
  isSI?: boolean;              // СИ (да/нет)
  condition?: string;          // Состояние
  resource?: string;          // Ресурс (текст)
  location?: string;          // Размещение
  note?: string;              // Примечание
  characteristics: Record<string, any>; // Параметры (включая пометку "основной")
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export interface Resource {
  id: number;
  nodeId: number;
  name: string;
  value: string | number;
  unit?: string;
  updatedAt: string;
}
export interface NodeType {
  id: number;
  name: string;
  characteristicsTemplate: Record<string, any>; // шаблон характеристик JSON
  createdAt: string;
  updatedAt: string;
}