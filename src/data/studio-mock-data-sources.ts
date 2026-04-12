import { newStudioBlockId } from '@/types/studio-document'
import type { StudioDataSource } from '@/types/studio-data-source'

/** Sources fictives pour le studio (remplacées par l’API plus tard). */
export function createMockStudioDataSources(): StudioDataSource[] {
  return [
    {
      id: 'src-manual-demo',
      kind: 'manual',
      name: 'Saisie manuelle (démo)',
      rows: [
        ['Ville', 'IPC %', 'Année'],
        ['Paris', '2,4', '2025'],
        ['Lyon', '2,1', '2025'],
        ['Marseille', '2,0', '2025'],
        ['Toulouse', '1,9', '2025'],
      ],
    },
    {
      id: 'src-file-demo',
      kind: 'file',
      name: 'Export ventes (CSV fictif)',
      fileName: 'ventes_trimestre_q1.csv',
      format: 'csv',
      previewRows: [
        ['Région', 'CA (k€)', 'Croissance'],
        ['Île-de-France', '1280', '4,2'],
        ['Auvergne-Rhône-Alpes', '940', '3,1'],
        ['Nouvelle-Aquitaine', '720', '2,8'],
        ['Occitanie', '610', '2,5'],
      ],
    },
    {
      id: 'src-api-demo',
      kind: 'api',
      name: 'API baromètre (mock)',
      url: 'https://api.statsio.example/v1/barometre',
      authHeaderName: 'X-API-Key',
      apiKeyPreview: 'sk_demo_••••••••',
      previewRecords: [
        { mois: 'Jan', indice: 102.4, confiance: 0.78 },
        { mois: 'Fév', indice: 103.1, confiance: 0.81 },
        { mois: 'Mar', indice: 101.9, confiance: 0.76 },
        { mois: 'Avr', indice: 104.2, confiance: 0.83 },
      ],
    },
  ]
}

export function createEmptyManualSource(): StudioDataSource {
  return {
    id: `src_${newStudioBlockId()}`,
    kind: 'manual',
    name: 'Nouvelle grille',
    rows: [
      ['Colonne A', 'Colonne B', 'Colonne C'],
      ['', '', ''],
      ['', '', ''],
    ],
  }
}

export function createMockFileSource(): StudioDataSource {
  return {
    id: `src_file_${newStudioBlockId()}`,
    kind: 'file',
    name: 'Import fichier (fictif)',
    fileName: 'donnees.csv',
    format: 'csv',
    previewRows: [
      ['Série', 'Valeur'],
      ['A', '10'],
      ['B', '20'],
    ],
  }
}

export function createMockApiSource(): StudioDataSource {
  return {
    id: `src_api_${newStudioBlockId()}`,
    kind: 'api',
    name: 'Nouvelle API (fictive)',
    url: 'https://api.example.com/series',
    authHeaderName: 'Authorization',
    apiKeyPreview: '',
    previewRecords: [{ label: 'Point 1', value: 1 }],
  }
}
