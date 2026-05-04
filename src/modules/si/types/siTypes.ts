export type InstrumentStatus = 'в эксплуатации' | 'на поверке' | 'в ремонте' | 'выведено'

export interface MeasuringInstrument {
  id: number
  tabNumber: string
  name: string
  type?: string
  verificationInterval: number
  lastVerificationDate: string
  nextVerificationDate: string
  status: InstrumentStatus
  location: string
  verifier?: string
  additionalData?: any
  isDeleted: boolean
  nodeId?: number
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
  verifier?: string
  daysToVerification?: number
}
