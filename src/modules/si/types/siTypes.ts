export type InstrumentStatus = 'в эксплуатации' | 'на поверке' | 'в ремонте' | 'выведено'

export interface MeasuringInstrument {
  id: number
  tabNumber: string
  name: string
  nodeId?: number
  verificationInterval: number
  status: InstrumentStatus
  location: string
  verifier?: string
  additionalData?: any
  isDeleted: boolean
}

export interface Verification {
  id: number
  siId: number
  transferDate: string
  receiptDate: string
  verifier: string
  result: 'годен' | 'не годен'
  notes?: string
}

export interface FilterParams {
  search?: string
  status?: InstrumentStatus | ''
}
