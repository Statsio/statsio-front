export function computePasswordStrength(password: string): number {
  if (!password) return 0

  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  return score
}

export const PASSWORD_STRENGTH_COLORS = ['#e5342b', '#f59e0b', '#3b82f6', '#10b981']
export const PASSWORD_STRENGTH_LABELS = ['Très faible', 'Faible', 'Correct', 'Solide']
