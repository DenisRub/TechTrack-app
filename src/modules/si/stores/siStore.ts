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

// Мок-данные для СИ (расширенные)
const mockInstruments: MeasuringInstrument[] = [
  {
    id: 1,
    tabNumber: 'ЖБИ31244',
    name: 'Блок детектирования гамма-излучения',
    manufacturer: 'НПО «Доза»',
    model: 'ДБГ-С11Д',
    serialNumber: '311',
    inventoryNumber: '123456',
    nodeId: 1,
    nodeName: 'БОП-1ТА',
    typeId: 1,
    typeName: 'Блок детектирования',
    location: 'п.г.т. Мулловка',
    mainParams: '12 В, 50 Гц',
    verificationInterval: 1,
    status: 'в эксплуатации',
    lastVerificationDate: '2025-06-05',
    nextVerificationDate: '2026-06-05',
    transferDate: '2025-06-04',
    receiptDate: '2025-06-06',
    verifier: 'Самарский ЦСМ',
    notes: 'Требуется ежегодная поверка',
    subsystemId: 1,
    additionalData: undefined,
    isDeleted: false,
  },
  {
    id: 2,
    tabNumber: 'РАД4512',
    name: 'Радиометр РКС-01',
    manufacturer: 'НПП «Радий»',
    model: 'РКС-01',
    serialNumber: '452',
    inventoryNumber: '789012',
    nodeId: 2,
    nodeName: 'Пост радиационного контроля',
    typeId: 2,
    typeName: 'Радиометр',
    location: 'СЗЗ №2',
    mainParams: 'диапазон 0.1-1000 мкЗв/ч',
    verificationInterval: 2,
    status: 'в эксплуатации',
    lastVerificationDate: '2024-03-10',
    nextVerificationDate: '2026-03-10',
    transferDate: '2024-03-05',
    receiptDate: '2024-03-10',
    verifier: 'Саратовский ЦСМ',
    notes: 'Требуется калибровка раз в 2 года',
    subsystemId: 1,
    additionalData: undefined,
    isDeleted: false,
  },
  {
    id: 3,
    tabNumber: 'ДОЗ1212',
    name: 'Дозиметр ДКГ-07',
    manufacturer: 'ЗАО «Атомтех»',
    model: 'ДКГ-07',
    serialNumber: '078',
    inventoryNumber: '345678',
    nodeId: 3,
    nodeName: 'Пункт контроля',
    typeId: 3,
    typeName: 'Дозиметр',
    location: 'Санпропускник',
    mainParams: 'диапазон 0.01-1000 мкЗв/ч',
    verificationInterval: 1,
    status: 'на поверке',
    lastVerificationDate: '2025-01-15',
    nextVerificationDate: '2026-01-15',
    transferDate: '2025-01-10',
    receiptDate: '2025-01-15',
    verifier: 'Самарский ЦСМ',
    notes: '',
    subsystemId: 1,
    additionalData: undefined,
    isDeleted: false,
  },
  {
    id: 4,
    tabNumber: 'СПЕК8901',
    name: 'Спектрометр СКС-50',
    manufacturer: 'НПП «Доза»',
    model: 'СКС-50',
    serialNumber: '567',
    inventoryNumber: '901234',
    nodeId: 4,
    nodeName: 'Лаборатория №5',
    typeId: 4,
    typeName: 'Спектрометр',
    location: 'Лаборатория №5, ком. 12',
    mainParams: 'разрешение 7%, диапазон 0.1-10 МэВ',
    verificationInterval: 2,
    status: 'в эксплуатации',
    lastVerificationDate: '2025-02-20',
    nextVerificationDate: '2027-02-20',
    transferDate: '2025-02-15',
    receiptDate: '2025-02-20',
    verifier: 'Московский ЦСМ',
    notes: 'Высокоточный спектрометр',
    subsystemId: 1,
    additionalData: undefined,
    isDeleted: false,
  },
  {
    id: 5,
    tabNumber: 'АЗ0012',
    name: 'Анализатор жидкости АЖ-02',
    manufacturer: 'ООО «Экохим»',
    model: 'АЖ-02',
    serialNumber: '234',
    inventoryNumber: '567890',
    nodeId: 5,
    nodeName: 'Химлаборатория',
    typeId: 5,
    typeName: 'Анализатор',
    location: 'Химлаборатория, стеллаж 3',
    mainParams: 'диапазон pH 0-14',
    verificationInterval: 1,
    status: 'в ремонте',
    lastVerificationDate: '2025-06-01',
    nextVerificationDate: '2026-06-01',
    transferDate: '2025-05-25',
    receiptDate: '2025-06-01',
    verifier: 'Казанский ЦСМ',
    notes: 'Требуется ремонт блока питания',
    subsystemId: 1,
    additionalData: undefined,
    isDeleted: false,
  },
  {
    id: 6,
    tabNumber: 'ГАЗ7734',
    name: 'Газоанализатор ГАНК-4',
    manufacturer: 'ЗАО «Оптик»',
    model: 'ГАНК-4',
    serialNumber: '891',
    inventoryNumber: '123789',
    nodeId: 6,
    nodeName: 'Вентиляционная',
    typeId: 6,
    typeName: 'Газоанализатор',
    location: 'Венткамера №1',
    mainParams: 'CO2, CO, CH4',
    verificationInterval: 1,
    status: 'в эксплуатации',
    lastVerificationDate: '2025-07-10',
    nextVerificationDate: '2026-07-10',
    transferDate: '2025-07-05',
    receiptDate: '2025-07-10',
    verifier: 'Самарский ЦСМ',
    notes: '',
    subsystemId: 1,
    additionalData: undefined,
    isDeleted: false,
  },
  {
    id: 7,
    tabNumber: 'ИЗМ3344',
    name: 'Измеритель влажности ИВ-01',
    manufacturer: 'ООО «Мера»',
    model: 'ИВ-01',
    serialNumber: '456',
    inventoryNumber: '456123',
    nodeId: 7,
    nodeName: 'Склад ГСМ',
    typeId: 7,
    typeName: 'Измеритель влажности',
    location: 'Склад ГСМ, стеллаж 2',
    mainParams: '0-100%, точность 2%',
    verificationInterval: 1,
    status: 'в эксплуатации',
    lastVerificationDate: '2025-08-01',
    nextVerificationDate: '2026-08-01',
    transferDate: '2025-07-25',
    receiptDate: '2025-08-01',
    verifier: 'Поверочная лаборатория',
    notes: '',
    subsystemId: 1,
    additionalData: undefined,
    isDeleted: false,
  },
  {
    id: 8,
    tabNumber: 'ДОЗ6789',
    name: 'Дозиметр ДРГ-02',
    manufacturer: 'НПП «Доза»',
    model: 'ДРГ-02',
    serialNumber: '321',
    inventoryNumber: '789321',
    nodeId: 8,
    nodeName: 'Пост контроля АСКРО',
    typeId: 3,
    typeName: 'Дозиметр',
    location: 'АСКРО ПП№1',
    mainParams: '0.05-1000 мкЗв/ч',
    verificationInterval: 1,
    status: 'в эксплуатации',
    lastVerificationDate: '2024-12-10',
    nextVerificationDate: '2025-12-10',
    transferDate: '2024-12-05',
    receiptDate: '2024-12-10',
    verifier: 'Саратовский ЦСМ',
    notes: 'Предупреждение: поверка через 30 дней',
    subsystemId: 1,
    additionalData: undefined,
    isDeleted: false,
  },
  {
    id: 9,
    tabNumber: 'АЗ0013',
    name: 'Анализатор спектра АСП-01',
    manufacturer: 'ООО «Аналит»',
    model: 'АСП-01',
    serialNumber: '987',
    inventoryNumber: '654987',
    nodeId: 9,
    nodeName: 'Исследовательская',
    typeId: 4,
    typeName: 'Спектрометр',
    location: 'Лаборатория №3',
    mainParams: '0-100 МГц',
    verificationInterval: 2,
    status: 'в эксплуатации',
    lastVerificationDate: '2024-05-15',
    nextVerificationDate: '2026-05-15',
    transferDate: '2024-05-10',
    receiptDate: '2024-05-15',
    verifier: 'Московский ЦСМ',
    notes: '',
    subsystemId: 1,
    additionalData: undefined,
    isDeleted: false,
  },
  {
    id: 10,
    tabNumber: 'ТЕСТ001',
    name: 'Тестовый прибор',
    manufacturer: 'ООО «Тест»',
    model: 'TEST-01',
    serialNumber: '001',
    inventoryNumber: '001001',
    nodeId: 10,
    nodeName: 'Склад',
    typeId: 1,
    typeName: 'Блок детектирования',
    location: 'Склад, зона Б',
    mainParams: 'тестовый параметр',
    verificationInterval: 1,
    status: 'выведено',
    lastVerificationDate: '2024-01-01',
    nextVerificationDate: '2025-01-01',
    transferDate: '2024-01-15',
    receiptDate: '2024-01-20',
    verifier: 'Самарский ЦСМ',
    notes: 'Прибор списан',
    subsystemId: 1,
    additionalData: undefined,
    isDeleted: false,
  },
]

// Мок-данные для поверок (расширенные)
const mockVerifications: Verification[] = [
  {
    id: 1,
    siId: 1,
    transferDate: '2025-06-04',
    receiptDate: '2025-06-06',
    verifier: 'Самарский ЦСМ',
    result: 'годен',
  },
  {
    id: 2,
    siId: 2,
    transferDate: '2024-03-05',
    receiptDate: '2024-03-10',
    verifier: 'Саратовский ЦСМ',
    result: 'годен',
  },
  {
    id: 3,
    siId: 3,
    transferDate: '2025-01-10',
    receiptDate: '2025-01-15',
    verifier: 'Самарский ЦСМ',
    result: 'годен',
  },
  {
    id: 4,
    siId: 4,
    transferDate: '2025-02-15',
    receiptDate: '2025-02-20',
    verifier: 'Московский ЦСМ',
    result: 'годен',
  },
  {
    id: 5,
    siId: 5,
    transferDate: '2025-05-25',
    receiptDate: '2025-06-01',
    verifier: 'Казанский ЦСМ',
    result: 'годен',
  },
  {
    id: 6,
    siId: 6,
    transferDate: '2025-07-05',
    receiptDate: '2025-07-10',
    verifier: 'Самарский ЦСМ',
    result: 'годен',
  },
  {
    id: 7,
    siId: 7,
    transferDate: '2025-07-25',
    receiptDate: '2025-08-01',
    verifier: 'Поверочная лаборатория',
    result: 'годен',
  },
  {
    id: 8,
    siId: 8,
    transferDate: '2024-12-05',
    receiptDate: '2024-12-10',
    verifier: 'Саратовский ЦСМ',
    result: 'годен',
  },
  {
    id: 9,
    siId: 9,
    transferDate: '2024-05-10',
    receiptDate: '2024-05-15',
    verifier: 'Московский ЦСМ',
    result: 'годен',
  },
  {
    id: 10,
    siId: 10,
    transferDate: '2024-01-15',
    receiptDate: '2024-01-20',
    verifier: 'Самарский ЦСМ',
    result: 'годен',
  },
  {
    id: 11,
    siId: 1,
    transferDate: '2024-06-01',
    receiptDate: '2024-06-05',
    verifier: 'Самарский ЦСМ',
    result: 'годен',
  },
  {
    id: 12,
    siId: 2,
    transferDate: '2022-03-01',
    receiptDate: '2022-03-08',
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

  // Отфильтрованный список
  const filteredInstruments = computed(() => {
    let list = allInstruments.value
    const params = filterParams.value
    if (params.search) {
      const s = params.search.toLowerCase()
      list = list.filter(
        (si) =>
          si.name.toLowerCase().includes(s) ||
          si.tabNumber.toLowerCase().includes(s) ||
          si.manufacturer?.toLowerCase().includes(s) ||
          si.model?.toLowerCase().includes(s),
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
