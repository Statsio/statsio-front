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
  statsData: {
    collection: '/statsdata',
    publicCollection: '/statsdata/public',
    /** Public show : GET by slug (render page). */
    publicOne: (slug: string) => `/statsdata/public/${encodeURIComponent(slug)}`,
    /** Document : GET show (studio), PATCH, DELETE — Postman : Create/Update/Delete document. */
    one: (documentId: string) => `/statsdata/${encodeURIComponent(documentId)}`,
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
  },
} as const
