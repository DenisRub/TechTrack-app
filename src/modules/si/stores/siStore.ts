import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { MeasuringInstrument, Verification, FilterParams } from '../types/siTypes'
import { addYears } from '@/utils/dateUtils'

// Мок-данные
const mockInstruments: MeasuringInstrument[] = [
  {
    id: 1,
    tabulNumber: 'ДКС-001',
    name: 'Дозиметр-радиометр МКС-АТ1117М',
    verificationInterval: 1,
    lastVerificationDate: '2025-05-05',
    nextVerificationDate: addYears('2025-05-05', 1),
    status: 'в эксплуатации',
    location: 'Лаборатория №5',
    verifier: 'Самарский ЦСМ',
    isDeleted: false,
  },
  {
    id: 2,
    tabulNumber: 'БДГ-045',
    name: 'Блок детектирования БДГ-01',
    verificationInterval: 2,
    lastVerificationDate: '2025-06-10',
    nextVerificationDate: addYears('2025-06-10', 2),
    status: 'в эксплуатации',
    location: 'Пост контроля АСКРО',
    verifier: 'Саратовский ЦСМ',
    isDeleted: false,
  },
  {
    id: 3,
    tabulNumber: 'РАД-112',
    name: 'Радиометр РКС-01',
    verificationInterval: 1,
    lastVerificationDate: '2023-12-01',
    nextVerificationDate: addYears('2023-12-01', 1),
    status: 'на поверке',
    location: 'Склад',
    verifier: '',
    isDeleted: false,
  },
]

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
    transferDate: '2025-06-10',
    receiptDate: '2025-10-10',
    verifier: 'Саратовский ЦСМ',
    result: 'годен',
  },
]

export const useSIStore = defineStore('si', () => {
  const instruments = ref<MeasuringInstrument[]>([...mockInstruments])
  const verifications = ref<Verification[]>([...mockVerifications])
  const filterParams = ref<FilterParams>({})
  const isLoading = ref(false)

  const filteredInstruments = computed(() => {
    let list = instruments.value.filter((si) => !si.isDeleted)
    const params = filterParams.value
    if (params.search) {
      const s = params.search.toLowerCase()
      list = list.filter(
        (si) => si.tabulNumber.toLowerCase().includes(s) || si.name.toLowerCase().includes(s),
      )
    }
    if (params.status) {
      list = list.filter((si) => si.status === params.status)
    }
    if (params.verifier) {
      list = list.filter((si) => si.verifier === params.verifier)
    }
    if (params.daysToVerification) {
      const today = new Date()
      list = list.filter((si) => {
        const diff =
          (new Date(si.nextVerificationDate).getTime() - today.getTime()) / (1000 * 3600 * 24)
        return diff <= params.daysToVerification!
      })
    }
    return list
  })

  function getVerificationsForSI(siId: number): Verification[] {
    return verifications.value.filter((v) => v.siId === siId).sort((a, b) => b.id - a.id)
  }

  function addInstrument(instrument: Omit<MeasuringInstrument, 'id' | 'nextVerificationDate'>) {
    const newId = Math.max(...instruments.value.map((s) => s.id), 0) + 1
    const nextDate = addYears(instrument.lastVerificationDate, instrument.verificationInterval)
    instruments.value.push({
      ...instrument,
      id: newId,
      nextVerificationDate: nextDate,
      isDeleted: false,
    })
  }

  function updateInstrument(id: number, data: Partial<MeasuringInstrument>) {
    const index = instruments.value.findIndex((s) => s.id === id)
    if (index === -1) return

    const item = instruments.value[index]
    if (!item) return

    if (data.tabulNumber !== undefined) item.tabulNumber = data.tabulNumber
    if (data.name !== undefined) item.name = data.name
    if (data.verificationInterval !== undefined)
      item.verificationInterval = data.verificationInterval
    if (data.lastVerificationDate !== undefined)
      item.lastVerificationDate = data.lastVerificationDate
    if (data.nextVerificationDate !== undefined)
      item.nextVerificationDate = data.nextVerificationDate
    if (data.status !== undefined) item.status = data.status
    if (data.location !== undefined) item.location = data.location
    if (data.verifier !== undefined) item.verifier = data.verifier
    if (data.additionalData !== undefined) item.additionalData = data.additionalData
    if (data.isDeleted !== undefined) item.isDeleted = data.isDeleted

    const lastDate = data.lastVerificationDate ?? item.lastVerificationDate
    const interval = data.verificationInterval ?? item.verificationInterval
    if (lastDate && interval) {
      item.nextVerificationDate = addYears(lastDate, interval)
    }
  }

  function deleteInstrument(id: number) {
    const index = instruments.value.findIndex((s) => s.id === id)
    if (index !== -1 && instruments.value[index]) {
      instruments.value[index].isDeleted = true
    }
  }

  function addVerification(ver: Omit<Verification, 'id'>) {
    const newId = Math.max(...verifications.value.map((v) => v.id), 0) + 1
    verifications.value.push({ ...ver, id: newId })
    if (ver.result === 'годен') {
      const si = instruments.value.find((s) => s.id === ver.siId)
      if (si && !si.isDeleted) {
        si.lastVerificationDate = ver.receiptDate
        si.nextVerificationDate = addYears(ver.receiptDate, si.verificationInterval)
        si.verifier = ver.verifier
      }
    }
  }

  function updateVerification(id: number, data: Partial<Verification>) {
    const index = verifications.value.findIndex((v) => v.id === id)
    if (index === -1) return

    const item = verifications.value[index]
    if (!item) return

    if (data.siId !== undefined) item.siId = data.siId
    if (data.transferDate !== undefined) item.transferDate = data.transferDate
    if (data.receiptDate !== undefined) item.receiptDate = data.receiptDate
    if (data.verifier !== undefined) item.verifier = data.verifier
    if (data.result !== undefined) item.result = data.result
    if (data.notes !== undefined) item.notes = data.notes
  }

  function writeOffInstrument(id: number) {
    const index = instruments.value.findIndex((s) => s.id === id)
    if (index !== -1 && instruments.value[index]) {
      instruments.value[index].status = 'выведено'
      instruments.value[index].isDeleted = false
    }
  }

  function deleteVerification(id: number) {
    const index = verifications.value.findIndex((v) => v.id === id)
    if (index !== -1) verifications.value.splice(index, 1)
  }

  return {
    instruments: filteredInstruments,
    allInstruments: instruments,
    filterParams,
    isLoading,
    getVerificationsForSI,
    addInstrument,
    updateInstrument,
    writeOffInstrument,
    deleteInstrument,
    addVerification,
    updateVerification,
    deleteVerification,
    setFilterParams: (params: FilterParams) => {
      filterParams.value = params
    },
  }
})
