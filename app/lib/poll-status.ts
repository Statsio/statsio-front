export interface PollStatus {
  label: string
  closed: boolean
  urgent: boolean
}

/**
 * Statut d'ouverture d'un sondage. Sans `response_deadline`, un sondage reste
 * ouvert indéfiniment — on affiche alors depuis quand il l'est (basé sur
 * `created_at`) plutôt qu'un faux compte à rebours.
 */
export function getPollStatus(poll: { response_deadline?: string | null; created_at?: string }): PollStatus {
  if (poll.response_deadline) {
    const diffDays = Math.ceil((new Date(poll.response_deadline).getTime() - Date.now()) / 86_400_000)

    if (diffDays <= 0) return { label: 'Clôturé', closed: true, urgent: false }
    if (diffDays === 1) return { label: 'Ferme dans 1j', closed: false, urgent: true }
    return { label: `Ferme dans ${diffDays}j`, closed: false, urgent: diffDays <= 3 }
  }

  if (!poll.created_at) return { label: 'Ouvert', closed: false, urgent: false }

  const days = Math.floor((Date.now() - new Date(poll.created_at).getTime()) / 86_400_000)

  if (days <= 0) return { label: "Ouvert depuis aujourd'hui", closed: false, urgent: false }
  if (days === 1) return { label: 'Ouvert depuis 1j', closed: false, urgent: false }
  if (days < 30) return { label: `Ouvert depuis ${days}j`, closed: false, urgent: false }
  if (days < 365) return { label: `Ouvert depuis ${Math.floor(days / 30)} mois`, closed: false, urgent: false }

  const years = Math.floor(days / 365)
  return { label: `Ouvert depuis ${years} an${years > 1 ? 's' : ''}`, closed: false, urgent: false }
}
