/** Reflète la shape réelle de l'API BDPM medicaments-api.giygas.dev (endpoints v1). */

export interface MedicamentComposition {
  denominationSubstance: string
  dosage: string
  referenceDosage: string
  natureComposant: string
}

export interface MedicamentPresentation {
  cip13: number
  libelle: string
  statusAdministratif: string
  etatComercialisation: string
  agreement: string
  tauxRemboursement: string
  prix: number
}

export interface Medicament {
  cis: number
  elementPharmaceutique: string
  formePharmaceutique: string
  voiesAdministration: string[]
  statusAutorisation: string
  etatComercialisation: string
  dateAMM: string
  titulaire: string
  composition: MedicamentComposition[]
  presentation: MedicamentPresentation[] | null
  conditions: string[] | null
}

export interface GenericGroupComposition {
  elementPharmaceutique: string
  substance: string
  dosage: string
}

export interface GenericGroupMedicament {
  cis: number
  elementPharmaceutique: string
  formePharmaceutique: string
  type: 'Princeps' | 'Générique' | string
  composition: GenericGroupComposition[]
}

export interface GenericGroup {
  groupID: number
  libelle: string
  medicaments: GenericGroupMedicament[]
}

/** Tendance des ventes (Open Medic) d'un médicament, agrégée sur tous ses CIP13. */
export interface MedicamentVentesTrend {
  value: number
  year: number
  trend: { year: number; value: number }[]
}

export interface TopVenteMedicament {
  cip13: string
  label: string | null
  boxes: number
  cis: number | null
}
