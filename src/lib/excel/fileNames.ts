export function buildUnifiedFileName(opts: {
  subjectEmployeeId: string
  subjectName: string
  role: string
  evaluatorName: string
  evaluatorId: string
  status: '임시저장' | '최종제출'
  ext: 'xlsx' | 'json'
}): string {
  const { subjectEmployeeId, subjectName, role, evaluatorName, evaluatorId, status, ext } = opts
  const roleLabel = role === 'preceptee' ? '신규간호사'
    : role === 'preceptor' ? '프리셉터'
    : role === 'educator' ? '교육전담'
    : '수간호사'

  if (role === 'preceptee') {
    return `${subjectEmployeeId}_신규간호사_${subjectName}_${status}.${ext}`
  }
  const idPart = evaluatorId ? `_${evaluatorId}` : ''
  return `${subjectEmployeeId}_${roleLabel}_${evaluatorName}${idPart}_${status}.${ext}`
}
