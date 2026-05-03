import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { MeasuringInstrument, Verification, FilterParams } from '@/modules/si/types/siTypes';
import { addYears } from '@/utils/dateUtils';

// Мок-данные для демонстрации
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
    nodeId: 5,
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
    nodeId: 2,
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
    nodeId: 6,
  },
  {
    id: 4,
    tabulNumber: 'СПЕ-001',
    name: 'Спектрометр СКС-03',
    verificationInterval: 1,
    lastVerificationDate: '2024-10-01',
    nextVerificationDate: addYears('2024-10-01', 1),
    status: 'в эксплуатации',
    location: 'Лаборатория №3',
    verifier: 'Московский ЦСМ',
    isDeleted: false,
    nodeId: 7,
  },
  {
    id: 5,
    tabulNumber: 'АКБ-001',
    name: 'Аккумуляторная батарея',
    verificationInterval: 3,
    lastVerificationDate: '2024-01-15',
    nextVerificationDate: addYears('2024-01-15', 3),
    status: 'в эксплуатации',
    location: 'Пост контроля АСКРО',
    verifier: 'Поверочная лаборатория',
    isDeleted: false,
    nodeId: 1,
  },
];

const mockVerifications: Verification[] = [
  {
    id: 1,
    siId: 1,
    transferDate: '2025-05-01',
    receiptDate: '2025-05-05',
    verifier: 'Самарский ЦСМ',
    result: 'годен',
  },
  {
    id: 2,
    siId: 2,
    transferDate: '2025-06-01',
    receiptDate: '2025-06-10',
    verifier: 'Саратовский ЦСМ',
    result: 'годен',
  },
  {
    id: 3,
    siId: 3,
    transferDate: '2023-11-25',
    receiptDate: '2023-12-01',
    verifier: 'Казанский ЦСМ',
    result: 'годен',
  },
];

export const useSIStore = defineStore('si', () => {
  const instruments = ref<MeasuringInstrument[]>([...mockInstruments]);
  const verifications = ref<Verification[]>([...mockVerifications]);
  const filterParams = ref<FilterParams>({});
  const isLoading = ref(false);

  const filteredInstruments = computed(() => {
    let list = instruments.value.filter((si) => !si.isDeleted);
    const params = filterParams.value;
    if (params.search) {
      const s = params.search.toLowerCase();
      list = list.filter(
        (si) => si.tabulNumber.toLowerCase().includes(s) || si.name.toLowerCase().includes(s)
      );
    }
    if (params.status) {
      list = list.filter((si) => si.status === params.status);
    }
    if (params.verifier) {
      list = list.filter((si) => si.verifier === params.verifier);
    }
    if (params.daysToVerification) {
      const today = new Date();
      list = list.filter((si) => {
        const nextDate = new Date(si.nextVerificationDate);
        const diff = (nextDate.getTime() - today.getTime()) / (1000 * 3600 * 24);
        return diff <= params.daysToVerification!;
      });
    }
    return list;
  });

  function getVerificationsForSI(siId: number): Verification[] {
    return verifications.value.filter((v) => v.siId === siId).sort((a, b) => b.id - a.id);
  }

  function addInstrument(instrument: Omit<MeasuringInstrument, 'id' | 'nextVerificationDate'>) {
    const newId = Math.max(...instruments.value.map((s) => s.id), 0) + 1;
    const nextDate = addYears(instrument.lastVerificationDate, instrument.verificationInterval);
    const newInstrument: MeasuringInstrument = {
      ...instrument,
      id: newId,
      nextVerificationDate: nextDate,
      isDeleted: false,
    };
    instruments.value.push(newInstrument);
  }

  function updateInstrument(id: number, data: Partial<MeasuringInstrument>) {
    const idx = instruments.value.findIndex((s) => s.id === id);
    if (idx === -1) return;
    const existing = instruments.value[idx];
    if (!existing) return;
    
    const updated: MeasuringInstrument = {
      id: existing.id,
      tabulNumber: data.tabulNumber ?? existing.tabulNumber,
      name: data.name ?? existing.name,
      verificationInterval: data.verificationInterval ?? existing.verificationInterval,
      lastVerificationDate: data.lastVerificationDate ?? existing.lastVerificationDate,
      nextVerificationDate: data.nextVerificationDate ?? existing.nextVerificationDate,
      status: (data.status ?? existing.status) as any,
      location: data.location ?? existing.location,
      verifier: data.verifier ?? existing.verifier,
      additionalData: data.additionalData ?? existing.additionalData,
      isDeleted: data.isDeleted ?? existing.isDeleted,
      nodeId: data.nodeId ?? existing.nodeId,
    };
    
    if (data.lastVerificationDate && data.verificationInterval) {
      updated.nextVerificationDate = addYears(data.lastVerificationDate, data.verificationInterval);
    }
    
    instruments.value[idx] = updated;
  }

  function deleteInstrument(id: number) {
  const idx = instruments.value.findIndex((s) => s.id === id);
  if (idx !== -1) {
    const instrument = instruments.value[idx];
    if (instrument) {
      instrument.isDeleted = true;
    }
  }
}

  function addVerification(ver: Omit<Verification, 'id'>) {
    const newId = Math.max(...verifications.value.map((v) => v.id), 0) + 1;
    verifications.value.push({ ...ver, id: newId });
    if (ver.result === 'годен') {
      const si = instruments.value.find((s) => s.id === ver.siId);
      if (si) {
        si.lastVerificationDate = ver.receiptDate;
        si.nextVerificationDate = addYears(ver.receiptDate, si.verificationInterval);
        si.verifier = ver.verifier;
      }
    }
  }

  function updateVerification(id: number, data: Partial<Verification>) {
    const idx = verifications.value.findIndex((v) => v.id === id);
    if (idx === -1) return;
    const existing = verifications.value[idx];
    if (!existing) return;
    verifications.value[idx] = { 
      ...existing, 
      ...data,
      id: existing.id,
    };
  }

  function deleteVerification(id: number) {
    const idx = verifications.value.findIndex((v) => v.id === id);
    if (idx !== -1) verifications.value.splice(idx, 1);
  }

  return {
    instruments: filteredInstruments,
    allInstruments: instruments,
    filterParams,
    isLoading,
    getVerificationsForSI,
    addInstrument,
    updateInstrument,
    deleteInstrument,
    addVerification,
    updateVerification,
    deleteVerification,
    setFilterParams: (params: FilterParams) => {
      filterParams.value = params;
    },
  };
});