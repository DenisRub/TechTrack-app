export interface EquipmentNode {
  id: number;
  name: string;
  type: 'aggregate' | 'block';
  nodeTypeId?: number | null;   // разрешаем null
  parentId?: number | null;
  location?: string;
  characteristics: Record<string, any>;
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