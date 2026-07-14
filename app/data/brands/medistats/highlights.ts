export type MedistatsHighlight = {
  eyebrow: string
  title: string
  statValue: string
  statLabel: string
  description: string
  to: string
}

export const medistatsHighlights: MedistatsHighlight[] = [
  {
    eyebrow: 'Épidémiologie & pathologies',
    title: 'Grippe saisonnière',
    statValue: '1 240',
    statLabel: 'pathologies suivies',
    description: "Courbes d'incidence et comparaisons géographiques pour chaque maladie référencée.",
    to: '/medistats/maladies',
  },
  {
    eyebrow: 'Pharmacologie & traitements',
    title: 'Paracétamol',
    statValue: '14 800',
    statLabel: 'médicaments référencés',
    description: 'Comparez les traitements et suivez les tendances de prescription par région.',
    to: '/medistats/medicaments',
  },
  {
    eyebrow: 'Offre de soins',
    title: 'Urgences — Île-de-France',
    statValue: '3 100',
    statLabel: 'établissements suivis',
    description: "Densité de l'offre de soins, délais et taux d'occupation des hôpitaux et cliniques.",
    to: '/medistats/services',
  },
]
