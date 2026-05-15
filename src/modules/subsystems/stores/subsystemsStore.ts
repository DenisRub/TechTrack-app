import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Subsystem, SubsystemPlan } from '../types/subsystemsTypes'
import { useSIStore } from '@/modules/si/stores/siStore'
import { useEquipmentStore } from '@/modules/equipment/stores/equipmentStore'
import { useResourcesStore } from '@/modules/resources/stores/resourcesStore'
import { useMaintenanceStore } from '@/modules/maintenance/stores/maintenanceStore'

function getCurrentDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Мок-данные – подсистемы
const mockSubsystems: Subsystem[] = [
  {
    id: 1,
    name: 'СКЦ НИИАР',
    parentId: null,
    description: 'Специализированный кризисный центр',
    location: 'ПП №1',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    isDeleted: false,
  },
]

// Мок-данные – планы подсистем
const mockPlans: SubsystemPlan[] = [
  {
    id: 1,
    subsystemId: 1,
    name: 'План ТО на 2026 год',
    description: 'Годовой план',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    status: 'pending',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
    isDeleted: false,
  },
]

// Модули и их иконки
const modules = [
  { id: 'si', name: 'Средства измерения', icon: '📏' },
  { id: 'equipment', name: 'Оборудование', icon: '🖥️' },
  { id: 'resources', name: 'Ресурсы', icon: '⚡' },
  { id: 'maintenance', name: 'Обслуживание', icon: '🔧' },
]

export const useSubsystemsStore = defineStore('subsystems', () => {
  const subsystems = ref<Subsystem[]>([...mockSubsystems])
  const plans = ref<SubsystemPlan[]>([...mockPlans])
  const isLoading = ref(false)

  const activeSubsystems = computed(() => subsystems.value.filter((s) => !s.isDeleted))

  // ========== РАБОТА С ПЛАНАМИ ==========
  function getPlan(id: number): SubsystemPlan | undefined {
    return plans.value.find((p) => p.id === id)
  }

  function getPlansForSubsystem(subsystemId: number): SubsystemPlan[] {
    return plans.value.filter((p) => p.subsystemId === subsystemId && !p.isDeleted)
  }

  function addPlan(data: Omit<SubsystemPlan, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>) {
    const newId = Math.max(...plans.value.map((p) => p.id), 0) + 1
    const now = getCurrentDate()
    plans.value.push({
      id: newId,
      subsystemId: data.subsystemId,
      name: data.name,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    })
  }

  function updatePlan(id: number, data: Partial<SubsystemPlan>) {
    const idx = plans.value.findIndex((p) => p.id === id)
    if (idx === -1) return
    const existing = plans.value[idx]
    if (!existing) return

    plans.value[idx] = {
      id: existing.id,
      subsystemId: data.subsystemId !== undefined ? data.subsystemId : existing.subsystemId,
      name: data.name !== undefined ? data.name : existing.name,
      description: data.description !== undefined ? data.description : existing.description,
      startDate: data.startDate !== undefined ? data.startDate : existing.startDate,
      endDate: data.endDate !== undefined ? data.endDate : existing.endDate,
      status: data.status !== undefined ? data.status : existing.status,
      createdAt: existing.createdAt,
      updatedAt: getCurrentDate(),
      isDeleted: data.isDeleted !== undefined ? data.isDeleted : existing.isDeleted,
    }
  }

  function deletePlan(id: number) {
    const idx = plans.value.findIndex((p) => p.id === id)
    if (idx !== -1 && plans.value[idx]) {
      plans.value[idx].isDeleted = true
    }
  }

  // ========== ПОЛУЧЕНИЕ СОДЕРЖИМОГО ==========
  function getModuleContent(subsystemId: number, moduleId: string): any[] {
    const content: any[] = []

    switch (moduleId) {
      case 'si':
        const siStore = useSIStore()
        const siList = siStore.allInstruments.filter((si: any) => si.subsystemId === subsystemId)
        siList.forEach((si: any) => {
          content.push({
            id: `si_${si.id}`,
            entityId: si.id,
            name: si.name,
            type: 'si',
            status: si.status,
          })
        })
        break

      case 'equipment':
        const equipmentStore = useEquipmentStore()
        const eqList = equipmentStore.allNodes.filter((eq: any) => eq.subsystem === subsystemId)
        eqList.forEach((eq: any) => {
          content.push({
            id: `equipment_${eq.id}`,
            entityId: eq.id,
            name: eq.name,
            type: 'equipment',
            status: eq.isDeleted ? 'списано' : 'активно',
          })
        })
        break

      case 'resources':
        const resourcesStore = useResourcesStore()
        const resList = resourcesStore.resources.filter(
          (res: any) => res.subsystemId === subsystemId,
        )
        resList.forEach((res: any) => {
          content.push({
            id: `resource_${res.id}`,
            entityId: res.id,
            name: res.name,
            type: 'resource',
          })
        })
        break

      case 'maintenance':
        const planList = plans.value.filter((p) => p.subsystemId === subsystemId)
        planList.forEach((plan: any) => {
          content.push({
            id: `maintenance_${plan.id}`,
            entityId: plan.id,
            name: plan.name,
            type: 'maintenance',
            status: plan.status,
          })
        })
        break
    }

    return content
  }

  // Дерево подсистем с содержимым
  const treeWithContent = computed(() => {
    const build = (parentId: number | null): any[] => {
      return activeSubsystems.value
        .filter((s) => s.parentId === parentId)
        .map((s) => ({
          id: s.id,
          name: s.name,
          type: 'subsystem',
          children: [
            ...build(s.id),
            ...modules.map((module) => ({
              id: `module_${module.id}_${s.id}`,
              name: module.name,
              icon: module.icon,
              type: 'module',
              moduleId: module.id,
              subsystemId: s.id,
              children: getModuleContent(s.id, module.id).map((content) => ({
                id: content.id,
                name: content.name,
                type: 'content',
                contentType: content.type,
                entityId: content.entityId,
                status: content.status,
              })),
            })),
          ],
        }))
    }
    return build(null)
  })

  // ========== CRUD ПОДСИСТЕМ ==========
  function getSubsystem(id: number): Subsystem | undefined {
    return subsystems.value.find((s) => s.id === id)
  }

  function addSubsystem(data: Omit<Subsystem, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>) {
    const newId = Math.max(...subsystems.value.map((s) => s.id), 0) + 1
    const now = getCurrentDate()
    subsystems.value.push({
      id: newId,
      name: data.name,
      parentId: data.parentId ?? null,
      description: data.description,
      location: data.location,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    })
  }

  function updateSubsystem(id: number, data: Partial<Subsystem>) {
    const idx = subsystems.value.findIndex((s) => s.id === id)
    if (idx === -1) return
    const existing = subsystems.value[idx]
    if (!existing) return

    subsystems.value[idx] = {
      id: existing.id,
      name: data.name !== undefined ? data.name : existing.name,
      parentId: data.parentId !== undefined ? data.parentId : existing.parentId,
      description: data.description !== undefined ? data.description : existing.description,
      location: data.location !== undefined ? data.location : existing.location,
      createdAt: existing.createdAt,
      updatedAt: getCurrentDate(),
      isDeleted: data.isDeleted !== undefined ? data.isDeleted : existing.isDeleted,
    }
  }

  function deleteSubsystem(id: number) {
    const idx = subsystems.value.findIndex((s) => s.id === id)
    if (idx !== -1 && subsystems.value[idx]) {
      subsystems.value[idx].isDeleted = true
    }
  }

  return {
    // Данные
    subsystems: activeSubsystems,
    tree: treeWithContent,
    plans,
    modules,
    // Геттеры
    getSubsystem,
    getPlan,
    getPlansForSubsystem,
    // CRUD подсистем
    addSubsystem,
    updateSubsystem,
    deleteSubsystem,
    // CRUD планов (ДОБАВЛЕНО)
    addPlan,
    updatePlan,
    deletePlan,
  }
})
