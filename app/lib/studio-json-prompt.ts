import type { ContentType, DatasetColumn, DatasetMeta } from '@/types/studio'

export interface PromptDataset {
  meta: DatasetMeta
  columns?: DatasetColumn[]
}

export interface BuildStudioJsonPromptArgs {
  content: { title?: string; type: ContentType }
  supportsPages: boolean
  datasets: PromptDataset[]
  /** Payload courant (résultat de `studio.getPayload()`), inséré en exemple « état actuel ». */
  currentPayload: unknown
}

/** Types de blocs autorisés par type de contenu (miroir de SidebarBlocks.vue / StudioBlockCatalog.php). */
const BLOCK_GUIDE: { type: string; label: string; data: boolean; types: ContentType[]; fields: string }[] = [
  // Texte (tous types)
  { type: 'heading', label: 'Titre', data: false, types: ['statsdata', 'article', 'survey'], fields: 'config.content (HTML inline), config.headingLevel (1|2|3), config.textAlign' },
  { type: 'paragraph', label: 'Paragraphe', data: false, types: ['statsdata', 'article', 'survey'], fields: 'config.content (HTML riche), config.textAlign, config.fontSize, config.lineHeight' },
  { type: 'quote', label: 'Citation', data: false, types: ['statsdata', 'article', 'survey'], fields: 'config.content, config.textAlign' },
  { type: 'callout', label: 'Encadré', data: false, types: ['statsdata', 'article', 'survey'], fields: 'config.content, config.calloutColor (hex)' },
  // Disposition
  { type: 'layout', label: 'Disposition', data: false, types: ['statsdata', 'article', 'survey'], fields: 'config.layoutType (1-col|2-cols|3-cols|2-1-cols|1-2-cols). Conteneur : ses enfants ont zoneId "loop:<idDuBlocLayout>:<colonne>" (colonne 0-based).' },
  // Graphiques
  { type: 'bar', label: 'Barres', data: true, types: ['statsdata', 'article', 'survey'], fields: 'fieldMapping.xAxis (obligatoire, dimension), fieldMapping.yAxes (obligatoire, [colonnes numériques]), fieldMapping.series (regroupement), fieldMapping.aggregate (sum|avg|count|min|max) ou fieldMapping.aggregates ([{column,fn}]), config: stacked, showLegend, colors, orientation, barStyle (chart|progress), format, prefix, suffix' },
  { type: 'line', label: 'Lignes', data: true, types: ['statsdata', 'article', 'survey'], fields: 'fieldMapping.xAxis (obligatoire), fieldMapping.yAxes (obligatoire), fieldMapping.series, fieldMapping.aggregate/aggregates, config: smooth, showLegend, colors, lineFill, format' },
  { type: 'pie', label: 'Camembert', data: true, types: ['statsdata', 'article', 'survey'], fields: 'Mode "column" (défaut) : fieldMapping.label (colonne des parts) + fieldMapping.value (colonne numérique) + fieldMapping.aggregate. Mode "segments" (config.pieMode="segments") : fieldMapping.pieSegments ([{fn,column,label?}], fn parmi sum|avg|count|min|max|remainder)' },
  // Données
  { type: 'table', label: 'Tableau', data: true, types: ['statsdata', 'article', 'survey'], fields: 'fieldMapping.columns (obligatoire, [colonnes dans l\'ordre]), fieldMapping.columnLabels ({colonne:libellé}), fieldMapping.columnFormats ({colonne:{format,align}}), config: sortable, showPagination, pageSize, rowLimit, sortColumn, sortDirection' },
  { type: 'kpi', label: 'KPI', data: true, types: ['statsdata', 'article', 'survey'], fields: 'fieldMapping.kpiValue ([{fn,column,op?}] ex [{fn:"max",column:"prix"},{op:"-",fn:"min",column:"prix"}]) OU fieldMapping.valueColumn + fieldMapping.aggregate. fieldMapping.comparisonColumn pour un écart. config: format, prefix, suffix, comparisonLabel, trendLabel, trendDirection' },
  { type: 'record', label: 'Fiche', data: true, types: ['statsdata', 'article', 'survey'], fields: 'fieldMapping.columns (obligatoire), fieldMapping.recordTitleColumn (titre, défaut 1re colonne). Prend la 1re ligne après filtres + tri (config.sortColumn/sortDirection). config.title' },
  { type: 'related', label: 'Entités liées', data: true, types: ['statsdata', 'article', 'survey'], fields: 'fieldMapping.columns (1re = libellé de la puce, 2e optionnelle = valeur). config: title, rowLimit, sortColumn, sortDirection' },
  // Éditorial
  { type: 'image', label: 'Image', data: false, types: ['statsdata', 'article', 'survey'], fields: 'config.imageUrl, config.imageAlt, config.imageCaption, config.imageAlign, config.imageWidth (sm|md|lg|full)' },
  { type: 'video', label: 'Vidéo', data: false, types: ['statsdata', 'article', 'survey'], fields: 'config.videoUrl (YouTube/Vimeo/Dailymotion), config.videoCaption' },
  { type: 'button', label: 'Bouton', data: false, types: ['statsdata', 'article', 'survey'], fields: 'config.buttonLabel, config.buttonUrl, config.buttonVariant (primary|secondary|outline), config.buttonAlign, config.buttonSize' },
  { type: 'link-card', label: 'Carte de lien', data: false, types: ['statsdata', 'article', 'survey'], fields: 'config.linkMode (url|content|page), config.linkUrl, config.linkTitle, config.linkDescription, config.linkImage, config.linkDomain' },
  { type: 'retenir', label: 'À retenir', data: false, types: ['statsdata', 'article', 'survey'], fields: 'config.retenirTitle, config.retenirItems ([string]), config.retenirColor (violet|emerald|amber|blue)' },
  { type: 'field-grid', label: 'Grille de champs', data: false, types: ['statsdata', 'article', 'survey'], fields: 'config.fieldGridItems ([{label,value}], value accepte les jetons {{colonne}}), config.fieldGridColumns (2|3|4)' },
  { type: 'map', label: 'Carte', data: false, types: ['statsdata', 'article', 'survey'], fields: 'config.mapLat, config.mapLng (acceptent des jetons {{colonne}}), config.mapLabel' },
  // Formulaire (survey uniquement)
  { type: 'choice', label: 'Choix unique', data: false, types: ['survey'], fields: 'config.formOptions ([string]), config.formRequired' },
  { type: 'checkboxes', label: 'Cases à cocher', data: false, types: ['survey'], fields: 'config.formOptions, config.formRequired' },
  { type: 'dropdown', label: 'Liste déroulante', data: false, types: ['survey'], fields: 'config.formOptions, config.formRequired' },
  { type: 'scale', label: 'Échelle linéaire', data: false, types: ['survey'], fields: 'config.scaleMin, config.scaleMax, config.scaleMinLabel, config.scaleMaxLabel, config.formRequired' },
  { type: 'rating', label: 'Avis (étoiles)', data: false, types: ['survey'], fields: 'config.ratingMax, config.formRequired' },
  // Script
  { type: 'loop', label: 'Boucle', data: true, types: ['statsdata', 'article', 'survey'], fields: 'Conteneur. fieldMapping.loopColumn (obligatoire), fieldMapping.loopVar (défaut "item"). Enfants : zoneId "loop:<idDuBloc>:0". Variable {{item}} utilisable dans les filtres/titres des enfants. config: title, loopLimit, loopLayout' },
  { type: 'if', label: 'Condition', data: false, types: ['statsdata', 'article', 'survey'], fields: 'Conteneur. config.ifParam (nom de paramètre), config.ifOperator (=|!=|>|>=|<|<=|contains|not_contains), config.ifValue. Enfants : zoneId "loop:<idDuBloc>:0"' },
  // Spécial statsdata
  { type: 'search', label: 'Recherche', data: false, types: ['statsdata'], fields: 'fieldMapping.searchColumns ([colonnes qualifiées interrogées]), sources ([{id,datasetId}]). Au clic sur un résultat, chaque colonne de la ligne devient un paramètre {{colonne}}. config.searchPlaceholder' },
  { type: 'param', label: 'Paramètre', data: true, types: ['statsdata'], fields: 'fieldMapping.paramColumn (obligatoire), fieldMapping.paramName (défaut = paramColumn, nom simple). Écrit pageParams[paramName]. config: title, paramControl (segmented|dropdown), paramDefault, paramAllowAll' },
  // Article uniquement
  { type: 'sd-embed', label: 'Bloc Statsdata', data: false, types: ['article'], fields: 'config.sourceSlug (slug d\'un Statsdata publié), config.sourceBlockId (id du bloc réutilisé), config.showSourceLink' },
]

function columnLine(c: DatasetColumn): string {
  const samples = (c.sampleValues ?? []).filter((v): v is string => v != null).slice(0, 4)
  const sample = samples.length ? ` — ex. ${samples.join(', ')}` : ''
  return `    - ${c.name} (${c.type}${c.nullable ? ', nullable' : ''})${sample}`
}

function datasetBlock(d: PromptDataset): string {
  const m = d.meta
  const head = `  • "${m.name}" — datasetId: ${m.id}${m.rowCount ? ` (${m.rowCount} lignes)` : ''}${m.status !== 'ready' ? ` [${m.status}]` : ''}`
  const desc = m.description ? `\n    ${m.description}` : ''
  const cols = d.columns?.length
    ? `\n    Colonnes :\n${d.columns.map(columnLine).join('\n')}`
    : '\n    (schéma non chargé)'
  return head + desc + cols
}

export function buildStudioJsonPrompt(args: BuildStudioJsonPromptArgs): string {
  const { content, supportsPages, datasets, currentPayload } = args
  const typeLabel = content.type === 'statsdata' ? 'StatsData' : content.type === 'article' ? 'Article' : 'Sondage'

  const blocksForType = BLOCK_GUIDE.filter((b) => b.types.includes(content.type))
  const blockList = blocksForType
    .map((b) => `- "${b.type}" (${b.label})${b.data ? ' — nécessite des sources de données' : ''}\n  ${b.fields}`)
    .join('\n')

  const datasetList = datasets.length
    ? datasets.map(datasetBlock).join('\n\n')
    : '  (aucune source de données rattachée à ce contenu)'

  const pagesRule = supportsPages
    ? `- "pages" : tableau. Chaque page = { id, title, slug?, description?, icon? }. Une page simple suffit : [{ "id": "default", "title": "Page 1" }]. Le multi-pages sert au fan-out d'URL (paramètres) — ne l'utilise que si demandé.`
    : `- "pages" : laisse [{ "id": "default", "title": "Page 1" }]. Ce type de contenu n'a qu'une seule page.`

  return `Tu génères le JSON d'un contenu du Studio Statsio (éditeur de pages data-journalisme).
Ta réponse doit être UNIQUEMENT le JSON final (pas de texte autour, pas de bloc \`\`\`), directement collable dans le champ d'import du Studio.

═══════════════════════════════════════════
CONTEXTE
═══════════════════════════════════════════
- Type de contenu : ${typeLabel} ("${content.type}")
- Titre actuel : ${content.title ? `"${content.title}"` : '(sans titre)'}

═══════════════════════════════════════════
STRUCTURE DU JSON
═══════════════════════════════════════════
{
  "title": "Titre du contenu",
  "pages": [ { "id": "default", "title": "Page 1" } ],
  "sections": [ Section, ... ],
  "blocks": [ Block, ... ]
}

${pagesRule}

- "sections" : blocs verticaux de la page. Chaque section :
  {
    "id": "<identifiant unique, ex. sec-intro>",
    "layout": "1-col",              // toujours "1-col" — les colonnes se font avec un bloc "layout"
    "pageId": "default",            // id d'une page (celle de "pages")
    "kicker": "<sur-titre optionnel, HTML inline>",
    "title": "<titre de section optionnel>",
    "description": "<chapô optionnel, HTML inline>",
    "theme": "default"             // default | dark | accent (optionnel)
  }

- "blocks" : chaque bloc :
  {
    "id": "<identifiant unique, ex. blk-1>",
    "type": "<un des types ci-dessous>",
    "zoneId": "<sectionId>-0",      // "-0" = 1re (et seule) colonne de la section. Dans un bloc "layout"/"loop"/"if" : "loop:<idDuBlocParent>:<colonne>"
    "sources": [ { "id": "<datasetId>", "datasetId": "<datasetId>" } ],   // uniquement pour les blocs de données
    "primarySourceId": "<datasetId>",                                    // = sources[0].id
    "fieldMapping": { ... },        // dépend du type (voir ci-dessous)
    "config": { ... },              // dépend du type
    "filters": [ { "column": "<col>", "operator": "=", "value": "x" } ]   // optionnel : =, !=, >, >=, <, <=, contains, not_contains, in, not_in (in/not_in : value = JSON '["a","b"]')
  }

RÈGLES IMPORTANTES
- Tous les "id" (pages, sections, blocs) doivent être uniques dans le document. Utilise des slugs courts et lisibles.
- Chaque bloc doit avoir un zoneId qui pointe vers une section existante : "<sectionId>-0".
- L'ordre d'affichage = l'ordre des sections dans "sections", puis l'ordre des blocs (même zoneId) dans "blocks".
- Référence de colonne : le nom nu (ex. "annee") = colonne de la source primaire. Pour une source jointe : "colonne@<sourceId>".
- Les blocs de données ("nécessite des sources") DOIVENT avoir "sources" + "primarySourceId" pointant vers un datasetId listé plus bas. N'invente jamais de datasetId ni de nom de colonne.
- Les blocs de texte / éditorial n'ont ni "sources" ni "fieldMapping" utile ({}).
- HTML inline autorisé dans kicker/title/description de section et config.content des blocs texte : <b> <i> <u> <s> <mark> <br>. Pas de listes ni de couleurs.

═══════════════════════════════════════════
BLOCS DISPONIBLES POUR CE TYPE DE CONTENU
═══════════════════════════════════════════
${blockList}

═══════════════════════════════════════════
SOURCES DE DONNÉES DISPONIBLES
═══════════════════════════════════════════
${datasetList}

═══════════════════════════════════════════
ÉTAT ACTUEL DU CONTENU (à modifier ou remplacer)
═══════════════════════════════════════════
${JSON.stringify(currentPayload, null, 2)}

═══════════════════════════════════════════
DEMANDE
═══════════════════════════════════════════
[Décris ici ce que tu veux : "Refais la page avec une intro, un KPI du prix moyen, un graphique d'évolution et un tableau détaillé", etc.]

Réponds avec le JSON complet uniquement.`
}
