/**
 * Les tables de référence profil (genres, tranches d'âge, CSP, situations matrimoniales…)
 * sont seedées côté back avec des clés + labels anglais génériques (voir
 * database/seeders/UserProfile/*Seeder.php côté statsio-api). On les traduit ici plutôt
 * que de modifier ces seeders, pour ne pas risquer de casser d'autres consommateurs du
 * même schéma. Fallback sur le label brut si une clé inconnue apparaît (nouvelle valeur
 * seedée côté back sans traduction ajoutée ici).
 */
const LABELS: Record<string, string> = {
  // Genres
  male: 'Homme',
  female: 'Femme',
  non_binary: 'Non-binaire',
  other: 'Autre',
  prefer_not_to_say: 'Je préfère ne pas répondre',

  // Tranches d'âge
  under_18: 'Moins de 18 ans',
  '18_24': '18-24 ans',
  '25_34': '25-34 ans',
  '35_44': '35-44 ans',
  '45_54': '45-54 ans',
  '55_64': '55-64 ans',
  '65_plus': '65 ans et plus',

  // Catégories socio-professionnelles
  manager: 'Cadre',
  professional: 'Profession libérale',
  technician: 'Technicien·ne',
  clerical: 'Employé·e',
  service: 'Employé·e (services)',
  skilled_worker: 'Ouvrier·ère qualifié·e',
  unskilled_worker: 'Ouvrier·ère',
  self_employed: 'Indépendant·e',
  student: 'Étudiant·e',
  retired: 'Retraité·e',
  unemployed: 'Sans emploi',

  // Situations matrimoniales
  single: 'Célibataire',
  in_relationship: 'En couple',
  married: 'Marié·e',
  civil_union: 'Pacsé·e',
  divorced: 'Divorcé·e',
  widowed: 'Veuf·ve',
}

export function profileLabel(key: string, fallback: string): string {
  return LABELS[key] ?? fallback
}
