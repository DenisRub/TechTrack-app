import { useSIStore } from '@/modules/si/stores/siStore'
import type { MeasuringInstrument, Verification } from '@/types'

export const useApi = () => {
  const store = useSIStore()

  return {
    // Получение отфильтрованного списка СИ
    getInstruments: () => store.instruments,

    // Получение одного СИ по id
    getInstrument: (id: number): MeasuringInstrument | undefined => {
      // store.allInstruments уже является массивом (не ref)
      return store.allInstruments.find((s: MeasuringInstrument) => s.id === id)
    },

    // Получение истории поверок
    getVerifications: (siId: number): Verification[] => store.getVerificationsForSI(siId),

    // Создание СИ
    createInstrument: (data: Omit<MeasuringInstrument, 'id' | 'nextVerificationDate'>) => {
      store.addInstrument(data)
    },

    // Обновление СИ
    updateInstrument: (id: number, data: Partial<MeasuringInstrument>) => {
      store.updateInstrument(id, data)
    },

    // Удаление СИ
    deleteInstrument: (id: number) => {
      store.deleteInstrument(id)
    },

    // Добавление поверки
    createVerification: (data: Omit<Verification, 'id'>) => {
      store.addVerification(data)
    },

    // Обновление поверки
    updateVerification: (id: number, data: Partial<Verification>) => {
      store.updateVerification(id, data)
    },

    // Удаление поверки
    deleteVerification: (id: number) => {
      store.deleteVerification(id)
    },
  }
}
