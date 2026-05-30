export type WeekType = '4week' | '8week'

export type EvaluatorType = 'preceptor' | 'educator'

export type ChecklistItem = {
  id: string
  weekType: WeekType
  category: string
  subCategory: string
  difficulty: string
  content: string
  evaluatorType: EvaluatorType
}
