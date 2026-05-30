export type Evaluation = {
  score: number | null
  memo: string
  signerName: string
  signatureImage: string | null
  signedAt: string | null
}

export type ChecklistItemResult = {
  itemId: string
  preceptee: Evaluation
  preceptor: Evaluation
  educator: Evaluation
  headNurse: Evaluation
}

export type ChecklistSession = {
  id: string
  targetName: string
  weekType: import('./checklist').WeekType
  department: string
  startDate: string
  results: ChecklistItemResult[]
  savedAt: string
  lowScoreReason?: string
}

export const createEmptyEvaluation = (): Evaluation => ({
  score: null,
  memo: '',
  signerName: '',
  signatureImage: null,
  signedAt: null,
})
