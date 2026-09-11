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
  { type: 'layout', label: 'Disposition', data: false, types: ['statsdata', 'article', 'survey'], fields: 'Conteneur pur mise en page (2 à 4 colonnes côte à côte) — pas de fieldMapping. config.layoutType (1-col|2-cols|3-cols|2-1-cols|1-2-cols) fixe le nombre de colonnes. Ses enfants ont zoneId "loop:<idDuBlocLayout>:<colonne>" (colonne 0-based, une zone par colonne).' },
  // Graphiques
  { type: 'bar', label: 'Barres', data: true, types: ['statsdata', 'article', 'survey'], fields: 'fieldMapping.xAxis (obligatoire, dimension), fieldMapping.yAxes (obligatoire, [colonnes numériques]), fieldMapping.series (regroupement en séries), fieldMapping.aggregate (sum|avg|count|min|max, défaut sum) OU fieldMapping.aggregates ([{column,fn}], prioritaire, un agrégat par colonne), fieldMapping.calcColumns ([{id,label,operands:[{column|value,op?:+|-|*|/}]}] — colonnes calculées par ligne, référencées "calc:<id>" comme xAxis/yAxes/series/filtre), fieldMapping.columnLabels ({colonne:libellé}), fieldMapping.valueLabels ({colonne:{valeurBrute:libellé}}). config: stacked, showLegend, colors ([hex]), seriesLimit (garde-fou nb de séries), logScale, orientation (vertical|horizontal), barStyle (chart|progress), showValueLabels, sortColumn, sortDirection (asc|desc), trendLabel + trendDirection (up|down, pastille de tendance libre), markRules ([{when:positive|negative|gt|lt|top|bottom|above-ref|below-ref, value?, color}] — couleur conditionnelle des barres, série unique), referenceExpression + referenceLabel (ligne de référence horizontale calculée, ex. "AVG(prix@7)"), format (number|percent|currency), prefix, suffix' },
  { type: 'line', label: 'Lignes', data: true, types: ['statsdata', 'article', 'survey'], fields: 'fieldMapping.xAxis (obligatoire, souvent temporel), fieldMapping.yAxes (obligatoire), fieldMapping.series, fieldMapping.aggregate/aggregates, fieldMapping.calcColumns, fieldMapping.columnLabels, fieldMapping.valueLabels. config: smooth, showLegend, colors, seriesLimit, logScale, showValueLabels, sortColumn, sortDirection, trendLabel + trendDirection, trendExpression (valeur de la pastille de tendance calculée, ex. "AVG(prix@7) - MIN(prix@7)"), lineFill (remplissage sous la courbe, série unique), referenceExpression + referenceLabel, format, prefix, suffix' },
  { type: 'pie', label: 'Camembert', data: true, types: ['statsdata', 'article', 'survey'], fields: 'Mode "column" (config.pieMode absent ou "column", défaut) : fieldMapping.label (colonne des parts) + fieldMapping.value (colonne numérique) + fieldMapping.aggregate. Mode "segments" (config.pieMode="segments") : fieldMapping.pieSegments ([{fn,column,label?}], fn parmi sum|avg|count|min|max|remainder — "remainder" = complément des autres parts, ex. « Non admis » ; column accepte "calc:<id>"). fieldMapping.calcColumns, fieldMapping.valueLabels (renomme les parts). config: showLegend, colors, format, prefix, suffix' },
  // Données
  { type: 'table', label: 'Tableau', data: true, types: ['statsdata', 'article', 'survey'], fields: 'fieldMapping.columns (obligatoire, [colonnes dans l\'ordre]), fieldMapping.columnLabels ({colonne:libellé}), fieldMapping.valueLabels ({colonne:{valeurBrute:libellé}}), fieldMapping.columnFormats ({colonne:{format:text|number|percent|currency|mono, align:left|center|right}}), fieldMapping.computedColumns ([{name,expression}] — colonne dérivée, expression = {col} valeur de ligne + agrégats FN(col@id)), fieldMapping.cellRules ([{column, when:positive|negative|top|bottom|=|!=|>|>=|<|<=|contains|not_contains, value? (requis sauf positive/negative/top/bottom), color, bold?}] — mise en forme conditionnelle des cellules). config: sortable, showPagination, pageSize, rowLimit, sortColumn, sortDirection, distinctColumn (dédoublonne sur une colonne)' },
  { type: 'kpi', label: 'KPI', data: true, types: ['statsdata', 'article', 'survey'], fields: 'fieldMapping.kpiValue ([{fn,column,op?}] ex [{fn:"max",column:"prix"},{op:"-",fn:"min",column:"prix"}] = MAX(prix) − MIN(prix)) OU fieldMapping.valueColumn + fieldMapping.aggregate. fieldMapping.calcColumns. fieldMapping.comparisonValue (même forme que kpiValue, valeur de comparaison combinée) OU fieldMapping.comparisonColumn (legacy, colonne unique). config: format, prefix, suffix, comparisonFormat (percent|number|currency), comparisonLabel (accepte {{jetons}}, ex. "vs 2020"), trendLabel, trendDirection, valueExpression (expression calculée remplaçant la colonne, ex. "AVG(prix@7) * 50", prioritaire sur kpiValue/valueColumn)' },
  { type: 'record', label: 'Fiche', data: true, types: ['statsdata', 'article', 'survey'], fields: 'fieldMapping.columns (obligatoire), fieldMapping.recordTitleColumn (titre, défaut 1re colonne), fieldMapping.columnLabels, fieldMapping.valueLabels. Prend la 1re ligne après filtres + tri (config.sortColumn/sortDirection — tri croissant = min, décroissant = max). config.title' },
  { type: 'related', label: 'Entités liées', data: true, types: ['statsdata', 'article', 'survey'], fields: 'fieldMapping.columns (1re = libellé de la puce, 2e optionnelle = valeur), fieldMapping.valueLabels. config: title, rowLimit, sortColumn, sortDirection. Sur une page fan-out, chaque puce lie automatiquement vers la page de sa valeur.' },
  { type: 'map', label: 'Carte', data: true, types: ['statsdata', 'article', 'survey'], fields: 'Coordonnées : soit fieldMapping.latColumn + fieldMapping.lngColumn, soit fieldMapping.mapPointColumn (colonne unique "lat, lon" / WKT / GeoJSON) + fieldMapping.mapPointOrder (latlng|lnglat, défaut latlng). fieldMapping.mapTitleColumn (titre de la fiche de survol), fieldMapping.columns (colonnes libellé/valeur de la fiche), fieldMapping.columnLabels, fieldMapping.valueLabels, fieldMapping.mapColorColumn (couleur des points par catégorie), fieldMapping.mapSizeColumn (taille des points, numérique), fieldMapping.cellRules ([{column, when, value?, color}] — couleur conditionnelle des marqueurs, PRIORITAIRE sur mapColorColumn). config: title, mapBasemap (clair|plan|sombre|couleur|aerien|relief), mapMarkerColor (hex, ignoré si mapColorColumn/cellRules), mapAutoFit (bool, défaut true), mapHeight (px, défaut 360)' },
  // Éditorial
  { type: 'image', label: 'Image', data: false, types: ['statsdata', 'article', 'survey'], fields: 'config.imageUrl, config.imageAlt, config.imageCaption, config.imageAlign, config.imageWidth (sm|md|lg|full)' },
  { type: 'video', label: 'Vidéo', data: false, types: ['statsdata', 'article', 'survey'], fields: 'config.videoUrl (YouTube/Vimeo/Dailymotion), config.videoCaption' },
  { type: 'button', label: 'Bouton', data: false, types: ['statsdata', 'article', 'survey'], fields: 'config.buttonLabel, config.buttonUrl, config.buttonVariant (primary|secondary|outline), config.buttonAlign, config.buttonSize (sm|md|lg)' },
  { type: 'link-card', label: 'Carte de lien', data: false, types: ['statsdata', 'article', 'survey'], fields: 'config.linkMode (url|content|page, défaut url) choisit la cible : "url" → config.linkUrl (externe) ; "content" → config.linkContentType (article|statsdata|survey) + config.linkContentSlug (contenu publié du site) ; "page" → config.linkPageId (une page du Statsdata en cours d\'édition). Affichage : config.linkTitle, config.linkDescription, config.linkImage, config.linkDomain.' },
  { type: 'retenir', label: 'À retenir', data: false, types: ['statsdata', 'article', 'survey'], fields: 'config.retenirTitle, config.retenirItems ([string]), config.retenirColor (violet|emerald|amber|blue)' },
  { type: 'field-grid', label: 'Grille de champs', data: false, types: ['statsdata', 'article', 'survey'], fields: 'config.fieldGridItems ([{label,value}], value accepte les jetons {{colonne}} et expressions), config.fieldGridColumns (2|3|4)' },
  // Formulaire (survey uniquement)
  { type: 'choice', label: 'Choix unique', data: false, types: ['survey'], fields: 'config.formOptions ([string]), config.formRequired' },
  { type: 'checkboxes', label: 'Cases à cocher', data: false, types: ['survey'], fields: 'config.formOptions, config.formRequired' },
  { type: 'dropdown', label: 'Liste déroulante', data: false, types: ['survey'], fields: 'config.formOptions, config.formRequired' },
  { type: 'scale', label: 'Échelle linéaire', data: false, types: ['survey'], fields: 'config.scaleMin, config.scaleMax, config.scaleMinLabel, config.scaleMaxLabel, config.formRequired' },
  { type: 'rating', label: 'Avis (étoiles)', data: false, types: ['survey'], fields: 'config.ratingMax, config.formRequired' },
  // Script
  { type: 'loop', label: 'Boucle (= "for" — répète pour chaque valeur)', data: true, types: ['statsdata', 'article', 'survey'], fields: 'Conteneur qui répète ses blocs enfants une fois par valeur DISTINCTE de fieldMapping.loopColumn (obligatoire), comme un for-each. fieldMapping.loopVar (défaut "item") nomme la variable exposée aux enfants : {{item}} (ou {{<loopVar>}}) est utilisable dans leurs filtres, titres et textes pour représenter l\'itération courante. Enfants : zoneId "loop:<idDuBloc>:0". config: title, loopLimit (garde-fou nb d\'itérations), loopLayout (1-col|2-cols|3-cols — disposition des itérations). Scripts imbriqués (loop dans if, if dans loop…) autorisés ; INTERDITS à l\'intérieur d\'un script : search, param, et les blocs de formulaire (choice/checkboxes/dropdown/scale/rating).' },
  { type: 'if', label: 'Condition', data: false, types: ['statsdata', 'article', 'survey'], fields: 'Conteneur qui n\'affiche ses blocs enfants QUE si une condition sur les paramètres de page est vraie. fieldMapping : aucun. config.ifConditions = [{ param, operator, value }] (param = nom d\'un paramètre de page, operator parmi = != > >= < <= contains not_contains, value accepte des jetons {{autre_param}}). config.ifMatch = "all" (ET, défaut) ou "any" (OU) combine les clauses de ifConditions. Enfants : zoneId "loop:<idDuBloc>:0". Import JSON uniquement (hors chat) : config.ifBranches = [{conditions:[...], match:"all"|"any"}, ...] permet plusieurs branches "Sinon si" (mêmes clauses qu\'une condition simple), puis une dernière branche { conditions: [], match:"all", else: true } en "Sinon" — SEULE la première branche qui matche s\'affiche. Enfants d\'une branche N : zoneId "loop:<idDuBloc>:N". Scripts imbriqués autorisés ; mêmes interdictions que "loop" (pas de search/param/formulaire à l\'intérieur).' },
  // Spécial statsdata
  { type: 'search', label: 'Recherche', data: false, types: ['statsdata'], fields: 'sources ([{id,datasetId}]) + primarySourceId comme un bloc de données classique (une seule source recommandée). fieldMapping.searchColumns (obligatoire, [colonnes qualifiées interrogées], recherche multi-mots). fieldMapping.searchAltColumns (optionnel, colonnes de recherche "OU" secondaires, exclues de l\'URL et de l\'affichage). fieldMapping.resultTitleParts / fieldMapping.resultDescParts ([{ref, label?, prefix?, suffix?}], optionnel) composent le titre et les lignes "label : valeur" de chaque résultat — à défaut le premier élément de searchColumns sert de titre. config.resultTitleSeparator (séparateur entre parties du titre, défaut espace), config.searchPlaceholder, config.heroButton + config.heroButtonLabel (bouton d\'accès rapide dans le hero de la page publique). Au clic sur un résultat, TOUTES les colonnes de la ligne deviennent des paramètres de page {{colonne}} (les blocs qui filtrent dessus se rechargent) ET un paramètre technique caché à fan-out est géré automatiquement pour l\'URL indexable (/statsdata/{slug}/{valeur}) — inutile de le déclarer dans "pages".' },
  { type: 'param', label: 'Paramètre', data: true, types: ['statsdata'], fields: 'fieldMapping.paramColumn (obligatoire), fieldMapping.paramName (défaut = paramColumn, nom simple). Écrit pageParams[paramName]. config: title, paramControl (segmented|dropdown), paramDefault, paramAllowAll (bool, ajoute une option "Tout" qui vide le paramètre), paramAllLabel (libellé de cette option, défaut "Tout"), heroButton + heroButtonLabel (bouton d\'accès rapide dans le hero public)' },
  // Article uniquement
  { type: 'sd-embed', label: 'Bloc Statsdata', data: false, types: ['article'], fields: 'config.sourceSlug (slug d\'un Statsdata publié), config.sourceBlockId (id du bloc réutilisé), config.showSourceLink (bool, défaut true, affiche le lien « Ouvrir le Statsdata complet »)' },
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
    ? `- "pages" : tableau. Chaque page = { id, title, slug?, description?, icon?, params? }. Une page simple suffit : [{ "id": "default", "title": "Page 1" }]. Le multi-pages sert au fan-out d'URL (paramètres) — ne l'utilise que si demandé. "params" ([{ name, column?, datasetId?, defaultValue?, fanOut? }]) déclare une variable {{name}} pilotable par un bloc "param" ou "search" posé sur cette page ; fanOut:true publie une page indexable par valeur (/slug/{valeur}).`
    : `- "pages" : laisse [{ "id": "default", "title": "Page 1" }]. Ce type de contenu n'a qu'une seule page.`

  const searchSection = content.type === 'statsdata'
    ? `

═══════════════════════════════════════════
RECHERCHE / PARAMÈTRE + GARDE-FOU "if" (IMPORTANT)
═══════════════════════════════════════════
Un bloc "search" ou "param" alimente des jetons {{colonne}} / {{paramName}} qui n'ont
AUCUNE valeur tant que le visiteur n'a pas cherché / choisi une valeur (sauf sur une
page fan-out ouverte directement via son URL /slug/{valeur}, où le paramètre est déjà
rempli par l'URL). Un bloc de données qui filtre sur un jeton non résolu ignore ce
filtre plutôt que d'afficher une erreur : SANS garde-fou, il affiche donc silencieusement
TOUT le dataset (ou une fiche non pertinente) avant toute recherche — ce n'est presque
jamais l'intention voulue.

RÈGLE : chaque fois que tu poses un bloc "search" ou "param" et que d'autres blocs de la
MÊME page filtrent sur le(s) paramètre(s) qu'il pilote, entoure ces blocs dépendants d'un
bloc "if" (même zone/section que sans le if — ses enfants vivent dans sa zone
"loop:<idDuBlocIf>:0") avec :
  "config": { "ifConditions": [{ "param": "<nom_du_paramètre>", "operator": "!=", "value": "" }] }
Ainsi les blocs ne s'affichent qu'une fois une recherche / un choix effectué. Si plusieurs
paramètres sont requis (ex. deux blocs "param" combinés), ajoute une clause par paramètre
et "ifMatch": "all" (toutes les clauses, défaut) ou "any" (au moins une).`
    : ''

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
    "layout": "1-col",              // toujours "1-col" — les colonnes côte à côte se font avec un bloc "layout"
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
    "zoneId": "<sectionId>-0",      // "-0" = 1re (et seule) colonne de la section. Dans un bloc conteneur ("layout"/"loop"/"if") : "loop:<idDuBlocParent>:<branche>" (branche = colonne pour "layout", 0 pour "loop", index de branche pour "if")
    "sources": [ { "id": "<datasetId>", "datasetId": "<datasetId>" } ],   // uniquement pour les blocs de données (voir "— nécessite des sources de données" ci-dessous)
    "primarySourceId": "<datasetId>",                                    // = sources[0].id
    "fieldMapping": { ... },        // dépend du type (voir ci-dessous)
    "config": { ... },              // dépend du type
    "filters": [ { "column": "<col>", "operator": "=", "value": "x" } ]   // optionnel : =, !=, >, >=, <, <=, contains, not_contains, in, not_in (in/not_in : value = JSON '["a","b"]')
  }

RÈGLES IMPORTANTES
- Tous les "id" (pages, sections, blocs) doivent être uniques dans le document. Utilise des slugs courts et lisibles.
- Chaque bloc doit avoir un zoneId qui pointe vers une section existante ("<sectionId>-0") ou un conteneur existant ("loop:<idDuBloc>:<branche>").
- L'ordre d'affichage = l'ordre des sections dans "sections", puis l'ordre des blocs (même zoneId) dans "blocks".
- Référence de colonne : le nom nu (ex. "annee") = colonne de la source primaire. Pour une source jointe : "colonne@<sourceId>". Une colonne calculée (fieldMapping.calcColumns) se référence "calc:<id>".
- "fieldMapping.columnLabels" ({ "colonne": "libellé" }) renomme un CHAMP (en-tête, légende, titre d'axe). "fieldMapping.valueLabels" ({ "colonne": { "valeurBrute": "libellé" } }) renomme les VALEURS affichées d'un champ (ex. { "sexe": { "M": "Hommes", "F": "Femmes" } }) — affichage seulement, la valeur brute reste la clé pour les filtres/agrégats. Valable pour bar/line/pie/table/record/related/map.
- Les blocs de données ("nécessite des sources") DOIVENT avoir "sources" + "primarySourceId" pointant vers un datasetId listé plus bas. N'invente jamais de datasetId ni de nom de colonne.
- Les blocs de texte / éditorial n'ont ni "sources" ni "fieldMapping" utile ({}).
- HTML inline autorisé dans kicker/title/description de section et config.content des blocs texte : <b> <i> <u> <s> <mark> <br>. Pas de listes ni de couleurs.
${searchSection}

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
