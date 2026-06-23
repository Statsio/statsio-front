/**
 * Chemins relatifs à `API_BASE_URL` (ex. `https://host/api`), alignés sur
 * `Statsio.postman_collection.json` : `{{base_url}}/api/...` → ici sans le préfixe `/api`.
 */
export const STATSIO_API = {
  auth: {
    me: '/auth/me',
  },
  /** User → Me */
  me: '/me',
  account: {
    anonymize: '/account/anonymize',
  },
  healthcheck: '/healthcheck',
  media: {
    upload: '/media/upload',
    one: (id: string | number) => `/media/${encodeURIComponent(String(id))}`,
  },
  channels: {
    collection: '/channels',
    one: (id: string) => `/channels/${encodeURIComponent(id)}`,
    suspend: (id: string) => `/channels/${encodeURIComponent(id)}/suspend`,
    ban: (id: string) => `/channels/${encodeURIComponent(id)}/ban`,
    activate: (id: string) => `/channels/${encodeURIComponent(id)}/activate`,
    anonymize: (id: string) => `/channels/${encodeURIComponent(id)}/anonymize`,
  },
  /** OpenAPI : `POST /api/source-api/probe-connection` — test d’URL + clé Bearer (sans lier au document). */
  sourceApi: {
    probeConnection: '/source-api/probe-connection',
  },
  apiSources: {
    collection: '/api-sources',
    one: (id: string) => `/api-sources/${encodeURIComponent(id)}`,
    test: (id: string) => `/api-sources/${encodeURIComponent(id)}/test`,
    preview: (id: string) => `/api-sources/${encodeURIComponent(id)}/preview`,
  },
  datasets: {
    collection: '/datasets',
    one: (id: string) => `/datasets/${encodeURIComponent(id)}`,
    query: (id: string) => `/datasets/${encodeURIComponent(id)}/query`,
    preview: (id: string) => `/datasets/${encodeURIComponent(id)}/preview`,
    invalidateCache: (id: string) => `/datasets/${encodeURIComponent(id)}/invalidate-cache`,
    pages: (datasetId: string) => `/datasets/${encodeURIComponent(datasetId)}/pages`,
    page: (datasetId: string, pageIdOrSlug: string) =>
      `/datasets/${encodeURIComponent(datasetId)}/pages/${encodeURIComponent(pageIdOrSlug)}`,
  },
  studioContent: {
    collection: '/studio/content',
    one: (id: string) => `/studio/content/${encodeURIComponent(id)}`,
    publicCollection: '/studio/content/public',
    publicBySlug: (slug: string) => `/studio/content/public/${encodeURIComponent(slug)}`,
  },
  pages: {
    blocks: (pageId: string) => `/pages/${encodeURIComponent(pageId)}/blocks`,
    block: (pageId: string, blockId: string) =>
      `/pages/${encodeURIComponent(pageId)}/blocks/${encodeURIComponent(blockId)}`,
    reorderBlocks: (pageId: string) => `/pages/${encodeURIComponent(pageId)}/blocks/reorder`,
  },
  statsData: {
    collection: '/statsdata',
    publicCollection: '/statsdata/public',
    trashed: '/statsdata/trashed',
    /** Public show : GET by slug (render page). */
    publicOne: (slug: string) => `/statsdata/public/${encodeURIComponent(slug)}`,
    /** Document : GET show (studio), PATCH, DELETE — Postman : Create/Update/Delete document. */
    one: (documentId: string) => `/statsdata/${encodeURIComponent(documentId)}`,
    restore: (documentId: string) => `/statsdata/${encodeURIComponent(documentId)}/restore`,
    forceDelete: (documentId: string) => `/statsdata/${encodeURIComponent(documentId)}/force`,
    shares: (documentId: string) => `/statsdata/${encodeURIComponent(documentId)}/shares`,
    share: (documentId: string, userId: string) => `/statsdata/${encodeURIComponent(documentId)}/shares/${encodeURIComponent(userId)}`,
    sources: (documentId: string) => `/statsdata/${encodeURIComponent(documentId)}/sources`,
    sourcesProbe: (documentId: string) => `/statsdata/${encodeURIComponent(documentId)}/sources/probe`,
    source: (documentId: string, sourceId: string) =>
      `/statsdata/${encodeURIComponent(documentId)}/sources/${encodeURIComponent(sourceId)}`,
    sourceMappingSuggestions: (documentId: string, sourceId: string) =>
      `/statsdata/${encodeURIComponent(documentId)}/sources/${encodeURIComponent(sourceId)}/mapping-suggestions`,
    sourceSearchExternal: (documentId: string, sourceId: string) =>
      `/statsdata/${encodeURIComponent(documentId)}/sources/${encodeURIComponent(sourceId)}/search-external`,
    sourceRefresh: (documentId: string, sourceId: string) =>
      `/statsdata/${encodeURIComponent(documentId)}/sources/${encodeURIComponent(sourceId)}/refresh`,
    query: (documentId: string) => `/statsdata/${encodeURIComponent(documentId)}/query`,
    media: (documentId: string) => `/statsdata/${encodeURIComponent(documentId)}/media`,
    mediaOne: (documentId: string, mediaId: string) =>
      `/statsdata/${encodeURIComponent(documentId)}/media/${encodeURIComponent(mediaId)}`,
  },
  tv: {
    epg: (date: string) => `/tv/epg?date=${encodeURIComponent(date)}`,
    audiences: '/tv/audiences',
    broadcast: (id: number) => `/tv/broadcasts/${id}`,
    broadcastView: (id: number) => `/tv/broadcasts/${id}/view`,
    broadcastSchedule: (id: number) => `/tv/broadcasts/${id}/schedule`,
    broadcastReviews: (id: number) => `/tv/broadcasts/${id}/reviews`,
    broadcastQuestions: (id: number) => `/tv/broadcasts/${id}/questions`,
    broadcastReview: (id: number) => `/tv/broadcasts/${id}/review`,
  },
} as const
