import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  MeasuringInstrument,
  Verification,
  FilterParams,
  InstrumentStatus,
} from '../types/siTypes'
import { addYears } from '@/utils/dateUtils'

function getCurrentDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Мок-данные для СИ
const mockInstruments: MeasuringInstrument[] = [
  {
    id: 1,
    tabNumber: 'ДКС-001',
    name: 'Дозиметр-радиометр МКС-АТ1117М',
    nodeId: 1,
    verificationInterval: 1,
    status: 'в эксплуатации',
    location: 'Лаборатория №5',
    verifier: 'Самарский ЦСМ',
    additionalData: undefined,
    isDeleted: false,
  },
  {
    id: 2,
    tabNumber: 'БДГ-045',
    name: 'Блок детектирования БДГ-01',
    nodeId: 2,
    verificationInterval: 2,
    status: 'в эксплуатации',
    location: 'Пост контроля АСКРО',
    verifier: 'Саратовский ЦСМ',
    additionalData: undefined,
    isDeleted: false,
  },
  {
    id: 3,
    tabNumber: 'РАД-112',
    name: 'Радиометр РКС-01',
    nodeId: 3,
    verificationInterval: 1,
    status: 'на поверке',
    location: 'Склад',
    verifier: '',
    additionalData: undefined,
    isDeleted: false,
  },
  {
    id: 4,
    tabNumber: 'ТЕСТ-001',
    name: 'Тестовый прибор',
    nodeId: 1,
    verificationInterval: 1,
    status: 'в ремонте',
    location: 'Ремонтная мастерская',
    verifier: '',
    additionalData: undefined,
    isDeleted: false,
  },
]

// Мок-данные для поверок
const mockVerifications: Verification[] = [
  {
    id: 1,
    siId: 1,
    transferDate: '2024-01-05',
    receiptDate: '2024-01-15',
    verifier: 'Самарский ЦСМ',
    result: 'годен',
  },
  {
    id: 2,
    siId: 2,
    transferDate: '2022-06-01',
    receiptDate: '2022-06-10',
    verifier: 'Саратовский ЦСМ',
    result: 'годен',
  },
]

export const useSIStore = defineStore('si', () => {
  const instruments = ref<MeasuringInstrument[]>([...mockInstruments])
  const verifications = ref<Verification[]>([...mockVerifications])
  const filterParams = ref<FilterParams>({ search: '', status: '' })
  const isLoading = ref(false)

  // Все не удалённые СИ
  const allInstruments = computed(() => instruments.value.filter((s) => !s.isDeleted))

  // Отфильтрованный список (поиск + статус)
  const filteredInstruments = computed(() => {
    let list = allInstruments.value
    const params = filterParams.value
    if (params.search) {
      const s = params.search.toLowerCase()
      list = list.filter(
        (si) => si.tabNumber.toLowerCase().includes(s) || si.name.toLowerCase().includes(s),
      )
    }
    if (params.status) {
      list = list.filter((si) => si.status === params.status)
    }
    return list
  })

  // ========== Работа с поверками ==========

  function getVerificationsForSI(siId: number): Verification[] {
    return verifications.value.filter((v) => v.siId === siId).sort((a, b) => b.id - a.id)
  }

  function getLastVerificationDate(siId: number): string {
    const verificationsForSI = getVerificationsForSI(siId)
    const lastGood = verificationsForSI
      .filter((v) => v.result === 'годен')
      .sort((a, b) => new Date(b.receiptDate).getTime() - new Date(a.receiptDate).getTime())[0]
    return lastGood?.receiptDate || ''
  }

  function getNextVerificationDate(siId: number): string {
    const lastDate = getLastVerificationDate(siId)
    const si = getInstrument(siId)
    if (lastDate && si?.verificationInterval) {
      return addYears(lastDate, si.verificationInterval)
    }
    return ''
  }

  // ========== CRUD операции ==========

  function getInstrument(id: number): MeasuringInstrument | undefined {
    return instruments.value.find((s) => s.id === id)
  }

  function addInstrument(instrument: Omit<MeasuringInstrument, 'id' | 'isDeleted'>) {
    const newId = Math.max(...instruments.value.map((s) => s.id), 0) + 1
    const newInstrument: MeasuringInstrument = {
      ...instrument,
      id: newId,
      isDeleted: false,
    }
    instruments.value.push(newInstrument)
    console.log(`[AUDIT] Создание СИ: "${instrument.name}" (ID ${newId})`)
  }

  function updateInstrument(id: number, data: Partial<MeasuringInstrument>) {
    const idx = instruments.value.findIndex((s) => s.id === id)
    if (idx === -1) return
    const existing = instruments.value[idx]
    if (!existing) return
    const oldName = existing.name
    instruments.value[idx] = {
      ...existing,
      ...data,
    }
    console.log(
      `[AUDIT] Редактирование СИ: ID ${id}, было: "${oldName}", стало: "${instruments.value[idx].name}"`,
    )
  }

  function writeOffInstrument(id: number) {
    const instrument = instruments.value.find((s) => s.id === id)
    if (instrument && instrument.status !== 'выведено') {
      instrument.status = 'выведено'
      console.log(`[AUDIT] Списание СИ: "${instrument.name}" (ID ${id})`)
    }
  }

  // ========== Работа с поверками (CRUD) ==========

  function addVerification(ver: Omit<Verification, 'id'>) {
    const newId = Math.max(...verifications.value.map((v) => v.id), 0) + 1
    const newVer = { ...ver, id: newId }
    verifications.value.push(newVer)
    console.log(`[AUDIT] Добавление поверки для СИ ID ${ver.siId}`)
  }

  function updateVerification(id: number, data: Partial<Verification>) {
    const idx = verifications.value.findIndex((v) => v.id === id)
    if (idx === -1) return
    const existing = verifications.value[idx]
    if (!existing) return
    verifications.value[idx] = {
      ...existing,
      ...data,
      id: existing.id,
    } as Verification
    console.log(`[AUDIT] Обновление поверки ID ${id}`)
  }

  function deleteVerification(id: number) {
    const idx = verifications.value.findIndex((v) => v.id === id)
    if (idx !== -1) {
      verifications.value.splice(idx, 1)
      console.log(`[AUDIT] Удаление поверки ID ${id}`)
    }
  }

  // ========== Фильтрация ==========

  function setFilterParams(params: Partial<FilterParams>) {
    filterParams.value = { ...filterParams.value, ...params }
  }

  return {
    instruments: filteredInstruments,
    allInstruments,
    filterParams,
    isLoading,
    verifications,
    getVerificationsForSI,
    getLastVerificationDate,
    getNextVerificationDate,
    addVerification,
    updateVerification,
    deleteVerification,
    getInstrument,
    addInstrument,
    updateInstrument,
    writeOffInstrument,
    setFilterParams,
  }
})
