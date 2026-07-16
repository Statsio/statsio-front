export type MedistatsSection = 'maladies' | 'pays' | 'soins'

/** Onglets Maladies/Pays/Soins partagés par les 3 pages liste MédiStats — évite de répéter le
 * même tableau (et de risquer un lien/label qui diverge) dans chaque composant. */
export function getMedistatsTabs(active: MedistatsSection) {
  return [
    { label: 'Vue Maladies', to: '/medistats/maladies', active: active === 'maladies' },
    { label: 'Vue Pays', to: '/medistats/pays', active: active === 'pays' },
    { label: 'Vue Soins', to: '/medistats/soins', active: active === 'soins' },
  ]
}
