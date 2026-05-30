export type Role = 'preceptee' | 'preceptor' | 'educator' | 'headNurse'

export const ROLE_LABELS: Record<Role, string> = {
  preceptee: '프리셉티',
  preceptor: '프리셉터',
  educator: '교육전담',
  headNurse: '수간호사',
}
