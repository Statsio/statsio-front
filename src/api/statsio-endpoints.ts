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
    /** Document : GET show (studio), PATCH, DELETE — Postman : Create/Update/Delete document. */
    one: (documentId: string) => `/statsdata/${encodeURIComponent(documentId)}`,
    sources: (documentId: string) => `/statsdata/${encodeURIComponent(documentId)}/sources`,
    sourcesProbe: (documentId: string) => `/statsdata/${encodeURIComponent(documentId)}/sources/probe`,
    source: (documentId: string, sourceId: string) =>
      `/statsdata/${encodeURIComponent(documentId)}/sources/${encodeURIComponent(sourceId)}`,
  },
} as const
