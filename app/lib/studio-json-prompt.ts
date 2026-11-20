import type { ContentType, DatasetColumn, DatasetMeta } from '@/types/studio'
import type { ContentCategory, ContentCoverage } from '@/types/content-creation'
import { CONTENT_COVERAGE_OPTIONS } from '@/types/content-creation'
import { SUB_BRAND_OPTIONS, type SubBrand } from '@/types/sub-brand'
import type { MediaItem } from '@/api/media'

export interface PromptDataset {
  meta: DatasetMeta
  columns?: DatasetColumn[]
}

/**
 * Propriétés du document (hors corps pages/sections/blocs) — objet `properties`
 * du JSON d'import. Appliquées via le store `studio-meta` (PATCH du document).
 */
export interface StudioJsonProperties {
  title?: string
  /** Chapô affiché sous le titre + sur les cartes du catalogue. */
  description?: string | null
  /** Id d'une image de la bibliothèque de médias (miniature / couverture). `null` = retirer. */
  thumbnailMediaId?: number | null
  coverage?: ContentCoverage | null
  subBrand?: SubBrand
  /** Slugs de catégories. */
  categories?: string[]
  /** Id du bloc graphique utilisé comme mini-graphe de la carte catalogue. `null` = automatique. */
  cardBlockId?: string | null
}

export interface BuildStudioJsonPromptArgs {
  content: { title?: string; type: ContentType }
  supportsPages: boolean
  datasets: PromptDataset[]
  /** Payload courant (résultat de `studio.getPayload()` + `properties`), inséré en exemple « état actuel ». */
  currentPayload: unknown
  /** Images de la bibliothèque de médias proposables comme miniature. */
  media?: MediaItem[]
  /** Catégories éditoriales disponibles. */
  categories?: ContentCategory[]
}

const DATA_HEADER = 'config.title (titre affiché au-dessus du bloc — TOUJOURS le renseigner, court et informatif, accepte les {{jetons}} et expressions {{ AVG(col) }}), config.description (sous-titre / source / lecture du graphique, optionnel, accepte les jetons)'
const FORM_HEADER = 'config.title (= l\'intitulé de la question, OBLIGATOIRE), config.description (aide optionnelle), config.formRequired (bool)'

/** Types de blocs autorisés par type de contenu (miroir de lib/studio-palette.ts / StudioBlockCatalog.php). */
const BLOCK_GUIDE: { type: string; label: string; data: boolean; types: ContentType[]; fields: string }[] = [
  // Texte (tous types)
  { type: 'heading', label: 'Titre', data: false, types: ['statsdata', 'article', 'survey'], fields: 'config.content (texte du titre, HTML inline), config.headingLevel (1|2|3, défaut 2 — préfère les titres de SECTION à ce bloc), config.textAlign (left|center|right)' },
  { type: 'paragraph', label: 'Paragraphe', data: false, types: ['statsdata', 'article', 'survey'], fields: 'config.content (HTML riche : <p>, <b>, <i>, <u>, <s>, <mark>, <a href>, <ul>/<ol>/<li>, <br> ; accepte {{jetons}} et expressions {{ AVG(prix) : 2 }}), config.textAlign (left|center|right|justify), config.fontSize (px), config.lineHeight' },
  { type: 'quote', label: 'Citation', data: false, types: ['statsdata', 'article', 'survey'], fields: 'config.content (texte de la citation), config.textAlign' },
  { type: 'callout', label: 'Encadré', data: false, types: ['statsdata', 'article', 'survey'], fields: 'config.content (HTML riche), config.calloutColor (hex, ex. "#7c3aed")' },
  // Disposition
  { type: 'layout', label: 'Disposition (colonnes)', data: false, types: ['statsdata', 'article', 'survey'], fields: 'Conteneur de mise en page : place 2 à 3 blocs côte à côte (ex. 3 KPI sur une ligne, un graphique + un texte). Pas de sources ni de fieldMapping. config.layoutType : "2-cols" (50/50) | "3-cols" (3 × 33 %) | "2-1-cols" (66/33) | "1-2-cols" (33/66) | "1-col". Ses enfants ont zoneId "loop:<idDuBlocLayout>:<colonne>" (colonne 0-based : 0, 1, 2).' },
  // Graphiques
  { type: 'bar', label: 'Barres', data: true, types: ['statsdata', 'article', 'survey'], fields: `${DATA_HEADER}. fieldMapping.xAxis (OBLIGATOIRE, dimension / catégorie), fieldMapping.yAxes (OBLIGATOIRE, [colonnes numériques], une série par colonne), fieldMapping.series (optionnel : colonne de regroupement → une série par valeur distincte), fieldMapping.aggregate (sum|avg|count|min|max, défaut sum) OU fieldMapping.aggregates ([{column,fn}], prioritaire, un agrégat par colonne de yAxes), fieldMapping.calcColumns, fieldMapping.columnLabels (renomme les séries / axes), fieldMapping.valueLabels. config : orientation (vertical|horizontal — horizontal conseillé pour de longs libellés ou un classement), barStyle (chart|progress — "progress" = liste de barres de progression), stacked (bool, barres empilées), showLegend (bool), showValueLabels (bool, valeurs affichées sur les barres), colors ([hex] dans l'ordre des séries), seriesLimit (nb max de séries), logScale (bool), sortColumn + sortDirection (asc|desc — trier par la mesure pour un classement), rowLimit (nb max de catégories, ex. top 10), trendLabel + trendDirection (up|down, pastille libre dans l'en-tête), markRules ([{when:positive|negative|gt|lt|top|bottom|above-ref|below-ref, value?, color}] — couleur conditionnelle des barres, série unique), referenceExpression + referenceLabel (ligne de référence horizontale calculée, ex. "AVG(prix)" / "Moyenne"), format (number|percent|currency), prefix, suffix (ex. " €", " %")` },
  { type: 'line', label: 'Lignes / courbes', data: true, types: ['statsdata', 'article', 'survey'], fields: `${DATA_HEADER}. fieldMapping.xAxis (OBLIGATOIRE, souvent une date / année), fieldMapping.yAxes (OBLIGATOIRE), fieldMapping.series, fieldMapping.aggregate/aggregates, fieldMapping.calcColumns, fieldMapping.columnLabels, fieldMapping.valueLabels. config : smooth (bool, courbe lissée), lineFill (bool, aire sous la courbe — série unique), showLegend, colors, seriesLimit, logScale, showValueLabels, sortColumn (mets la colonne de xAxis) + sortDirection ("asc" pour un ordre chronologique), trendLabel + trendDirection, trendExpression (valeur calculée de la pastille, ex. "MAX(prix) - MIN(prix)"), referenceExpression + referenceLabel, format, prefix, suffix` },
  { type: 'pie', label: 'Camembert / donut', data: true, types: ['statsdata', 'article', 'survey'], fields: `${DATA_HEADER}. Mode "column" (config.pieMode absent ou "column", défaut) : fieldMapping.label (colonne des parts) + fieldMapping.value (colonne numérique) + fieldMapping.aggregate. Mode "segments" (config.pieMode = "segments") : fieldMapping.pieSegments ([{fn, column, label?}], fn parmi sum|avg|count|min|max|remainder — "remainder" = complément des autres parts ; column accepte "calc:<id>"). fieldMapping.calcColumns, fieldMapping.valueLabels (renomme les parts). config : showLegend, colors, rowLimit (nb max de parts), markRules, format, prefix, suffix. À réserver à ≤ 6 parts.` },
  // Données
  { type: 'table', label: 'Tableau', data: true, types: ['statsdata', 'article', 'survey'], fields: `${DATA_HEADER}. fieldMapping.columns (OBLIGATOIRE, [colonnes dans l'ordre d'affichage]), fieldMapping.columnLabels (en-têtes lisibles — TOUJOURS les renseigner), fieldMapping.valueLabels, fieldMapping.columnFormats ({colonne:{format:text|number|percent|currency|mono, align:left|center|right, bold?, italic?}}), fieldMapping.computedColumns ([{name, expression}] — colonne dérivée ajoutée en fin de tableau ; expression = {col} valeur de la ligne + agrégats, ex. "{prix} - AVG(prix)"), fieldMapping.cellRules ([{conditions:[{column, when, value?}], color, bold?}] — when parmi positive|negative|top|bottom|=|!=|>|>=|<|<=|contains|not_contains ; mise en forme conditionnelle). config : sortable (bool), showPagination (bool), pageSize (lignes par page), rowLimit, sortColumn + sortDirection (tri initial), distinctColumn (dédoublonne sur une colonne)` },
  { type: 'kpi', label: 'Chiffre clé (KPI)', data: true, types: ['statsdata', 'article', 'survey'], fields: `config.title (= libellé du chiffre, ex. "Prix moyen du gazole" — OBLIGATOIRE), config.description (précision sous le chiffre). Valeur : fieldMapping.kpiValue ([{fn, column, op?}], ex. [{fn:"max",column:"prix"},{op:"-",fn:"min",column:"prix"}] = MAX(prix) − MIN(prix)) OU fieldMapping.valueColumn + fieldMapping.aggregate OU config.valueExpression (expression, ex. "AVG(prix) * 50", prioritaire). Comparaison optionnelle : fieldMapping.comparisonValue (même forme que kpiValue) + "comparisonFilters" (filtres du bloc appliqués à la valeur de comparaison, ex. année précédente) ; config.comparisonFormat (percent|number|currency), config.comparisonLabel (ex. "vs 2020", accepte {{jetons}}). config : format, prefix, suffix, trendLabel, trendDirection (up|down). fieldMapping.calcColumns. Astuce : 3 KPI côte à côte dans un bloc "layout" 3-cols.` },
  { type: 'record', label: 'Fiche', data: true, types: ['statsdata', 'article', 'survey'], fields: `${DATA_HEADER}. Affiche UNE ligne (la 1re après filtres + tri) sous forme de fiche. fieldMapping.columns (OBLIGATOIRE), fieldMapping.recordTitleColumn (titre de la fiche, défaut 1re colonne), fieldMapping.columnLabels, fieldMapping.valueLabels. config.sortColumn + config.sortDirection (asc = la ligne min, desc = la ligne max). Idéal pour « la station la moins chère » ou le résultat d'une recherche.` },
  { type: 'related', label: 'Entités liées', data: true, types: ['statsdata', 'article', 'survey'], fields: `${DATA_HEADER}. Liste de puces. fieldMapping.columns (1re = libellé de la puce, 2e optionnelle = valeur), fieldMapping.valueLabels. config : rowLimit, sortColumn, sortDirection. Sur une page à fan-out, chaque puce lie automatiquement vers la page de sa valeur.` },
  { type: 'map', label: 'Carte', data: true, types: ['statsdata', 'article', 'survey'], fields: `${DATA_HEADER}. Coordonnées : fieldMapping.latColumn + fieldMapping.lngColumn, OU fieldMapping.mapPointColumn (colonne unique "lat, lon" / WKT / GeoJSON) + fieldMapping.mapPointOrder (latlng|lnglat, défaut latlng). fieldMapping.mapTitleColumn (titre de la fiche de survol), fieldMapping.columns (lignes de la fiche de survol), fieldMapping.columnLabels, fieldMapping.valueLabels, fieldMapping.mapColorColumn (couleur par catégorie), fieldMapping.mapSizeColumn (taille, numérique), fieldMapping.mapSizeRules ([{conditions:[{column,when,value?}], size}]), fieldMapping.cellRules ([{conditions:[...], color}] — couleur conditionnelle, prioritaire sur mapColorColumn). config : mapBasemap (clair|plan|sombre|couleur|aerien|relief), mapMarkerColor (hex), mapAutoFit (bool, défaut true), mapHeight (px, défaut 360), rowLimit (nb max de points)` },
  // Éditorial
  { type: 'image', label: 'Image', data: false, types: ['statsdata', 'article', 'survey'], fields: 'config.imageUrl (URL absolue) OU config.imageMediaId (id de la bibliothèque de médias, voir liste plus bas), config.imageAlt (OBLIGATOIRE pour l\'accessibilité), config.imageCaption, config.imageAlign (left|center|right), config.imageWidth (sm|md|lg|full)' },
  { type: 'video', label: 'Vidéo', data: false, types: ['statsdata', 'article', 'survey'], fields: 'config.videoUrl (YouTube / Vimeo / Dailymotion), config.videoCaption' },
  { type: 'button', label: 'Bouton', data: false, types: ['statsdata', 'article', 'survey'], fields: 'config.buttonLabel, config.buttonUrl, config.buttonVariant (primary|secondary|outline), config.buttonAlign (left|center|right), config.buttonSize (sm|md|lg)' },
  { type: 'link-card', label: 'Carte de lien', data: false, types: ['statsdata', 'article', 'survey'], fields: 'config.linkMode (url|content|page, défaut url) : "url" → config.linkUrl (externe) ; "content" → config.linkContentType (article|statsdata|survey) + config.linkContentSlug ; "page" → config.linkPageId (id d\'une page de CE document — utile pour renvoyer vers une autre page). Affichage : config.linkTitle, config.linkDescription, config.linkImage (URL), config.linkDomain.' },
  { type: 'retenir', label: 'À retenir', data: false, types: ['statsdata', 'article', 'survey'], fields: 'config.retenirTitle (ex. "À retenir"), config.retenirItems ([string] — 3 à 5 points clés, accepte {{jetons}} et expressions), config.retenirColor (violet|emerald|amber|blue)' },
  { type: 'field-grid', label: 'Grille de champs', data: false, types: ['statsdata', 'article', 'survey'], fields: 'config.title, config.fieldGridItems ([{label, value}], value accepte les jetons {{colonne}} et expressions {{ MAX(prix) }}), config.fieldGridColumns (2|3|4)' },
  // Formulaire (survey uniquement)
  { type: 'choice', label: 'Choix unique', data: false, types: ['survey'], fields: `${FORM_HEADER}, config.formOptions ([string], ≥ 2 options)` },
  { type: 'checkboxes', label: 'Cases à cocher (choix multiple)', data: false, types: ['survey'], fields: `${FORM_HEADER}, config.formOptions ([string])` },
  { type: 'dropdown', label: 'Liste déroulante', data: false, types: ['survey'], fields: `${FORM_HEADER}, config.formOptions ([string])` },
  { type: 'scale', label: 'Échelle linéaire', data: false, types: ['survey'], fields: `${FORM_HEADER}, config.scaleMin (ex. 1), config.scaleMax (ex. 5 ou 10), config.scaleMinLabel, config.scaleMaxLabel` },
  { type: 'rating', label: 'Avis (étoiles)', data: false, types: ['survey'], fields: `${FORM_HEADER}, config.ratingMax (défaut 5)` },
  { type: 'number', label: 'Nombre', data: false, types: ['survey'], fields: `${FORM_HEADER}, config.formUnit (unité affichée, ex. "€"), config.formMin, config.formMax` },
  { type: 'text-answer', label: 'Réponse libre', data: false, types: ['survey'], fields: `${FORM_HEADER}, config.formLongAnswer (bool, true = zone longue, false = champ court)` },
  // Script
  { type: 'loop', label: 'Boucle (for-each)', data: true, types: ['statsdata', 'article', 'survey'], fields: 'Conteneur qui répète ses blocs enfants une fois par valeur DISTINCTE de fieldMapping.loopColumn (OBLIGATOIRE). fieldMapping.loopVar (défaut "item") : {{item}} (ou {{<loopVar>}}) est utilisable dans les filtres, titres et textes des enfants. Enfants : zoneId "loop:<idDuBloc>:0". config : title, loopLimit (nb max d\'itérations), loopLayout (1-col|2-cols|3-cols). Scripts imbriqués autorisés ; INTERDITS dans un script : search, param, et les blocs de formulaire.' },
  { type: 'if', label: 'Condition', data: false, types: ['statsdata', 'article', 'survey'], fields: 'Conteneur qui n\'affiche ses enfants QUE si une condition sur les paramètres de page est vraie. Pas de fieldMapping. config.ifConditions = [{ param, operator, value }] (param = nom d\'un paramètre de page, operator parmi = != > >= < <= contains not_contains, value accepte des {{jetons}}), config.ifMatch = "all" (ET, défaut) | "any" (OU). Enfants : zoneId "loop:<idDuBloc>:0". Plusieurs branches : config.ifBranches = [{conditions:[...], match:"all"|"any"}, ..., { conditions: [], match:"all", else: true }] — seule la 1re branche vraie s\'affiche ; enfants de la branche N : zoneId "loop:<idDuBloc>:N". Mêmes interdictions que "loop".' },
  // Spécial statsdata
  { type: 'search', label: 'Recherche', data: false, types: ['statsdata'], fields: 'sources + primarySourceId comme un bloc de données (une seule source recommandée). fieldMapping.searchColumns (OBLIGATOIRE, colonnes interrogées, recherche multi-mots), fieldMapping.searchAltColumns (optionnel, colonnes secondaires « OU »), fieldMapping.resultTitleParts / fieldMapping.resultDescParts ([{ref, label?, prefix?, suffix?}]) composent le titre et les lignes « label : valeur » de chaque résultat. config : title, searchPlaceholder, resultTitleSeparator (défaut espace), heroButton (bool) + heroButtonLabel (bouton d\'accès rapide dans le hero public). Au clic sur un résultat, TOUTES les colonnes de la ligne deviennent des paramètres {{colonne}} ET un paramètre caché de fan-out est géré automatiquement (URL /statsdata/{slug}/{valeur}) — inutile de le déclarer dans "pages[].params".' },
  { type: 'param', label: 'Paramètre (sélecteur)', data: true, types: ['statsdata'], fields: 'Contrôle (pastilles ou liste) qui écrit un paramètre de page. fieldMapping.paramColumn (OBLIGATOIRE, ses valeurs distinctes = options), fieldMapping.paramName (nom du paramètre, défaut = paramColumn ; sans espaces). config : title, paramControl (segmented|dropdown — dropdown au-delà de ~6 valeurs), paramDefault (valeur initiale — conseillé pour que la page ne soit jamais vide), paramAllowAll (bool, option « Tout ») + paramAllLabel, heroButton + heroButtonLabel. Les autres blocs de la page filtrent ensuite avec { "column": "carburant", "operator": "=", "value": "{{carburant}}" }.' },
  // Article uniquement
  { type: 'sd-embed', label: 'Bloc Statsdata', data: false, types: ['article'], fields: 'Réutilise un bloc d\'un Statsdata publié. config.sourceSlug (slug du Statsdata), config.sourceBlockId (id du bloc), config.sourceParams ({param: valeur} optionnel), config.showSourceLink (bool, défaut true)' },
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

function pagesSection(type: ContentType, supportsPages: boolean): string {
  if (!supportsPages) {
    return `- "pages" : laisse [{ "id": "default", "title": "Page 1" }]. Ce type de contenu n'a qu'UNE seule page :
  structure le contenu avec plusieurs SECTIONS à la place.`
  }
  return `- "pages" : un ${type === 'statsdata' ? 'StatsData' : 'document'} est découpé en PAGES, affichées comme des onglets
  sur la page publique (et listées dans le sommaire). FAIS PLUSIEURS PAGES dès que le sujet s'y prête
  (en pratique 2 à 5) : une page = un angle / une question. Exemple de découpage :
    1. "Vue d'ensemble" (chiffres clés, tendance générale, à retenir)
    2. "Évolution" ou "Dans le temps" (courbes, comparaison d'années)
    3. "Par territoire" / "Par catégorie" (carte, classements, tableau détaillé)
    4. "Rechercher" / "Fiche" (bloc recherche ou paramètre + fiche détaillée)
    5. "Méthodologie & sources" (texte, définitions, limites des données)
  Une seule page n'est acceptable que si le sujet est vraiment très court.

  Structure d'une page :
  {
    "id": "<identifiant unique, ex. "vue-ensemble">",   // la 1re page affichée par défaut = la 1re du tableau
    "title": "<titre de l'onglet, court : 1 à 3 mots>",
    "slug": "<segment d'URL optionnel, ex. "evolution">",
    "description": "<résumé optionnel de la page>",
    "icon": "<emoji optionnel affiché devant l'onglet, ex. "📈">",
    "params": [ PageParam, ... ]                       // optionnel, voir ci-dessous
  }

  PageParam = { "name": "<nom du jeton, sans espaces>", "label"?: "<libellé>", "column"?: "<colonne source des valeurs>",
                "datasetId"?: "<datasetId>", "defaultValue"?: "<valeur initiale>", "fanOut"?: true|false }
  Un paramètre déclare une variable {{name}} utilisable dans les filtres / titres / textes des blocs de
  CETTE page. Il est piloté par un bloc "param" (qui le déclare automatiquement — inutile de le répéter
  ici) ou par une valeur par défaut. fanOut:true publie une page indexable par valeur (/slug/{valeur}).
  N'écris JAMAIS "canvas" dans une page : l'ordre des sections suffit.`
}

function propertiesSection(args: BuildStudioJsonPromptArgs): string {
  const { content, media = [], categories = [] } = args
  const images = media.filter((m) => m.type?.startsWith('image'))
  const mediaList = images.length
    ? images.slice(0, 40).map((m) => `    - id ${m.id} : ${m.url}`).join('\n')
    : '    (bibliothèque vide — n\'écris pas "thumbnailMediaId")'
  const categoryList = categories.length
    ? categories.map((c) => `    - "${c.slug}" — ${c.name}${c.sub_brand && c.sub_brand !== 'all' ? ` (domaine ${c.sub_brand})` : ''}`).join('\n')
    : '    (liste indisponible — n\'écris pas "categories")'
  const coverage = CONTENT_COVERAGE_OPTIONS.map((o) => `"${o.value}"`).join(' | ')
  const subBrands = SUB_BRAND_OPTIONS.map((o) => `"${o.value}" (${o.label})`).join(' | ')
  const cardRule = content.type === 'statsdata'
    ? `\n    "cardBlockId": "<id d'un bloc bar/line/pie de ce JSON>",   // mini-graphe de la carte catalogue (optionnel, défaut = 1er graphique)`
    : ''

  return `- "properties" (À PLACER EN PREMIER) : les propriétés du contenu, affichées dans le hero de la page
  publique, sur les cartes du catalogue et dans les moteurs de recherche.
  {
    "title": "<titre du contenu — accrocheur, informatif, 50-80 caractères, sans point final>",
    "description": "<CHAPÔ : 1 à 3 phrases (150-300 caractères, max 2000) qui résument l'enjeu et ce que le lecteur va découvrir. Texte brut, pas de HTML>",
    "thumbnailMediaId": <id numérique d'une image de la liste ci-dessous — miniature / image de couverture ; omets le champ pour garder l'image actuelle>,
    "coverage": ${coverage},   // échelle géographique du sujet
    "subBrand": ${subBrands},   // domaine de publication
    "categories": ["<slug>", ...]${cardRule}   // 1 à 3 slugs pris dans la liste ci-dessous, cohérents avec subBrand
  }
  Tous les champs sont optionnels : un champ absent n'est pas modifié. Ne mets JAMAIS d'URL d'image dans
  "thumbnailMediaId".

  Images de la bibliothèque (pour "thumbnailMediaId" et le bloc "image" via config.imageMediaId) :
${mediaList}

  Catégories disponibles :
${categoryList}`
}

export function buildStudioJsonPrompt(args: BuildStudioJsonPromptArgs): string {
  const { content, supportsPages, datasets, currentPayload } = args
  const typeLabel = content.type === 'statsdata' ? 'StatsData' : content.type === 'article' ? 'Article' : 'Sondage'

  const blocksForType = BLOCK_GUIDE.filter((b) => b.types.includes(content.type))
  const blockList = blocksForType
    .map((b) => `- "${b.type}" (${b.label})${b.data ? ' — BLOC DE DONNÉES : nécessite "sources" + "primarySourceId"' : ''}\n  ${b.fields}`)
    .join('\n\n')

  const datasetList = datasets.length
    ? datasets.map(datasetBlock).join('\n\n')
    : '  (aucune source de données rattachée à ce contenu — n\'utilise que des blocs de texte / éditoriaux)'

  const searchSection = content.type === 'statsdata'
    ? `

═══════════════════════════════════════════
RECHERCHE / PARAMÈTRE + GARDE-FOU "if" (IMPORTANT)
═══════════════════════════════════════════
Un bloc "search" ou "param" alimente des jetons {{colonne}} / {{paramName}} qui n'ont AUCUNE valeur
tant que le visiteur n'a pas cherché / choisi (sauf sur une page fan-out ouverte via son URL, ou si
"paramDefault" est défini). Un bloc qui filtre sur un jeton non résolu IGNORE ce filtre : sans
garde-fou, il afficherait tout le dataset avant toute recherche.

RÈGLE : si d'autres blocs de la MÊME page filtrent sur un paramètre piloté par un bloc "search" (ou un
"param" sans paramDefault), place-les dans un bloc "if" (ses enfants : zoneId "loop:<idDuBlocIf>:0") :
  "config": { "ifConditions": [{ "param": "<nom_du_paramètre>", "operator": "!=", "value": "" }] }
Plusieurs paramètres requis → une clause par paramètre + "ifMatch": "all".
Mets les blocs "search" et "param" dans une section en HAUT de la page qu'ils pilotent.`
    : ''

  const surveyHint = content.type === 'survey'
    ? `\n- Sondage : chaque bloc de formulaire = une question. Regroupe les questions par thème en sections (titre de section = thème). Ajoute une section d'introduction (paragraphe) qui explique le but et la durée estimée.`
    : ''

  return `Tu es un data-journaliste expert et tu génères le JSON d'un contenu du Studio Statsio (éditeur de pages
de data-journalisme). Ta réponse doit être UNIQUEMENT le JSON final (pas de texte autour, pas de bloc \`\`\`),
directement collable dans le champ d'import du Studio. Le JSON doit être valide (guillemets doubles, pas de
commentaires, pas de virgule finale) — les commentaires // ci-dessous ne sont là que pour t'expliquer.

═══════════════════════════════════════════
CONTEXTE
═══════════════════════════════════════════
- Type de contenu : ${typeLabel} ("${content.type}")
- Titre actuel : ${content.title ? `"${content.title}"` : '(sans titre)'}

═══════════════════════════════════════════
STRUCTURE DU JSON (dans cet ordre)
═══════════════════════════════════════════
{
  "properties": { ... },               // propriétés du contenu (titre, chapô, miniature, catégories…)
  "pages":      [ Page, ... ],         // onglets du document
  "sections":   [ Section, ... ],      // sections de chaque page
  "blocks":     [ Block, ... ]         // blocs de chaque section
}

${propertiesSection(args)}

${pagesSection(content.type, supportsPages)}

- "sections" : bandes verticales d'une page, chacune avec un en-tête éditorial. Une page compte en général
  2 à 5 sections. Structure :
  {
    "id": "<identifiant unique, ex. "sec-evolution-prix">",
    "layout": "1-col",              // TOUJOURS "1-col" — les colonnes côte à côte se font avec un bloc "layout"
    "pageId": "<id d'une page de "pages">",
    "kicker": "<sur-titre court optionnel, ex. "Évolution">",
    "title": "<titre de la section, ex. "Le gazole a pris 40 % en deux ans">",
    "description": "<chapô de section optionnel : 1-2 phrases de contexte / lecture>",
    "theme": "default"              // default | dark | accent — "accent"/"dark" pour 1 section forte max par page
  }
  Le titre de section est la vraie hiérarchie de la page (il alimente le sommaire) : préfère un titre de
  section informatif (une affirmation tirée des données) à un bloc "heading".
  HTML inline autorisé dans kicker / title / description : <b> <i> <u> <s> <mark> <br> + {{jetons}}.

- "blocks" : chaque bloc :
  {
    "id": "<identifiant unique, ex. "blk-kpi-prix-moyen">",
    "type": "<un des types listés plus bas>",
    "zoneId": "<sectionId>-0",      // section parente ("-0" = toujours "-0"). Dans un conteneur ("layout" / "loop" / "if") : "loop:<idDuBlocParent>:<n>" (n = colonne pour "layout", 0 pour "loop", n° de branche pour "if")
    "sources": [ { "id": "<datasetId>", "datasetId": "<datasetId>" } ],   // blocs de données uniquement
    "primarySourceId": "<datasetId>",                                    // = sources[0].id
    "joins": [ ... ],               // optionnel, multi-sources (voir plus bas)
    "fieldMapping": { ... },        // dépend du type ({} pour les blocs de texte)
    "config": { ... },              // dépend du type — dont "title" et "description" (en-tête du bloc)
    "filters": [ { "column": "<col>", "operator": "=", "value": "x" } ],   // optionnel (ET implicite)
    "filterGroups": [ { "conditions": [ Filtre, ... ], "match": "all"|"any" } ],   // optionnel, prioritaire sur "filters" — logique ET/OU
    "filtersMatch": "all"|"any",    // combine les groupes entre eux (défaut all)
    "comparisonFilters": [ Filtre, ... ]   // KPI uniquement : filtres de la valeur de comparaison
  }
  Filtre = { "column", "operator", "value" } ; operator parmi = != > >= < <= contains not_contains in not_in
  (in / not_in : value = chaîne JSON d'un tableau, ex. "[\\"2023\\",\\"2024\\"]"). value accepte {{param}}.

═══════════════════════════════════════════
RÈGLES IMPORTANTES
═══════════════════════════════════════════
- Tous les "id" (pages, sections, blocs) sont uniques dans le document : slugs courts et lisibles.
- Chaque section pointe vers une page existante ; chaque bloc vers une section existante ("<sectionId>-0")
  ou un conteneur existant ("loop:<idDuBloc>:<n>").
- Ordre d'affichage = ordre des pages, puis des sections dans "sections", puis des blocs (même zoneId)
  dans "blocks". Un bloc enfant d'un conteneur doit apparaître APRÈS son conteneur.
- TITRES DES BLOCS : chaque graphique (bar/line/pie), tableau, carte, fiche et KPI a un "config.title" clair
  (ce que montre le bloc, avec l'unité et la période si utile, ex. "Prix moyen du gazole par mois (€/L)"),
  et de préférence un "config.description" (lecture ou source, ex. "Moyenne nationale, toutes stations").
- Colonnes : le nom nu (ex. "annee") = colonne de la source primaire ; "colonne@<sourceId>" = colonne d'une
  autre source du bloc ; "calc:<id>" = colonne calculée (fieldMapping.calcColumns). Respecte EXACTEMENT les
  noms (casse, accents, espaces) listés dans les sources. N'invente JAMAIS de datasetId ni de colonne.
- Choisis les colonnes selon leur type : xAxis / series / label = texte, date ou entier catégoriel ;
  yAxes / value / valueColumn = numérique (integer / float). "count" fonctionne sur n'importe quelle colonne.
- fieldMapping.columnLabels ({ "colonne": "Libellé" }) renomme un CHAMP (en-tête, légende, axe) — mets des
  libellés lisibles plutôt que les noms techniques. fieldMapping.valueLabels ({ "colonne": { "M": "Hommes" } })
  renomme des VALEURS à l'affichage (la valeur brute reste la clé des filtres).
- fieldMapping.calcColumns = [{ "id", "label", "operands": [{ "column" | "value", "op"?: "+"|"-"|"*"|"/" }] }]
  (calcul par ligne, avant agrégation ; le 1er opérande n'a pas de "op").
- Multi-sources : "sources" liste plusieurs { id, datasetId } et "joins" = [{ "leftSourceId", "leftColumn",
  "rightSourceId", "rightColumn", "type": "inner"|"left"|"union"|"union_all" }]. Une seule source suffit le
  plus souvent.
- Jetons et expressions dans les textes, titres, kicker, retenirItems, fieldGridItems :
    {{param}}                         valeur d'un paramètre de page / variable de boucle
    {{ AVG(prix) }}                   agrégat sur la source primaire (AVG | SUM | MIN | MAX | COUNT)
    {{ AVG(prix@<datasetId>) }}       agrégat sur une source précise
    {{ MAX(prix) - MIN(prix) : 2 }}   arithmétique + nombre de décimales après ":"
    {{ AVG(prix | carburant = Gazole & annee >= 2020) }}   agrégat filtré ($nom = valeur d'un paramètre)
    {{ AVG("prix moyen") }}           colonne avec espaces / accents entre guillemets
  Les paragraphes peuvent ainsi citer des chiffres réels calculés. N'écris pas de chiffre « en dur » que
  tu ne peux pas déduire des données.
- Les blocs de texte / éditoriaux n'ont pas de "sources" et ont "fieldMapping": {}.
- Varie les visualisations (KPI, courbe, barres, carte, tableau) et alterne avec du texte d'analyse :
  chaque section = un message, illustré par 1 à 3 blocs de données + un court paragraphe de lecture.
- Termine le contenu par une section « Méthodologie » / « Sources » (texte) quand c'est pertinent.${surveyHint}${searchSection}

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
[Décris ici ce que tu veux : sujet, angle, public, pages souhaitées… ex. « Refais le StatsData en 3 pages :
vue d'ensemble avec 3 KPI et la tendance, évolution par carburant, carte des stations les moins chères »]

Réponds avec le JSON complet uniquement, en commençant par "properties".`
}

const COVERAGE_VALUES = new Set(CONTENT_COVERAGE_OPTIONS.map((o) => o.value))
const SUB_BRAND_VALUES = new Set(SUB_BRAND_OPTIONS.map((o) => o.value))

/**
 * Extrait et valide l'objet `properties` d'un JSON d'import. Les champs invalides
 * sont ignorés (jamais bloquants) ; un champ absent n'est pas renvoyé. Accepte
 * aussi le `title` racine historique (`properties.title` prioritaire).
 */
export function extractImportProperties(raw: unknown): StudioJsonProperties {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const root = raw as Record<string, unknown>
  const p = (root.properties && typeof root.properties === 'object' && !Array.isArray(root.properties)
    ? root.properties
    : {}) as Record<string, unknown>
  const out: StudioJsonProperties = {}

  const title = typeof p.title === 'string' && p.title.trim() ? p.title : root.title
  if (typeof title === 'string' && title.trim()) out.title = title.trim()

  if (p.description === null) out.description = null
  else if (typeof p.description === 'string') out.description = p.description.trim().slice(0, 2000) || null

  if (p.thumbnailMediaId === null) out.thumbnailMediaId = null
  else {
    const id = typeof p.thumbnailMediaId === 'string' ? Number(p.thumbnailMediaId) : p.thumbnailMediaId
    if (typeof id === 'number' && Number.isInteger(id) && id > 0) out.thumbnailMediaId = id
  }

  if (p.coverage === null) out.coverage = null
  else if (typeof p.coverage === 'string' && COVERAGE_VALUES.has(p.coverage as ContentCoverage)) {
    out.coverage = p.coverage as ContentCoverage
  }

  if (typeof p.subBrand === 'string' && SUB_BRAND_VALUES.has(p.subBrand as SubBrand)) {
    out.subBrand = p.subBrand as SubBrand
  }

  if (Array.isArray(p.categories)) {
    out.categories = p.categories
      .filter((c): c is string => typeof c === 'string' && !!c.trim())
      .map((c) => c.trim().slice(0, 50))
  }

  if (p.cardBlockId === null) out.cardBlockId = null
  else if (typeof p.cardBlockId === 'string' && p.cardBlockId.trim()) out.cardBlockId = p.cardBlockId.trim().slice(0, 64)

  return out
}
