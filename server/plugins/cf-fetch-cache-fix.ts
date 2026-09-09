// Le runtime Cloudflare Workers rejette le champ `cache` d'un RequestInit
// (« The 'cache' field on 'RequestInitializerDict' is not implemented. »).
// Pendant le SSR, le shim `node:http` de workerd — utilisé par l'adaptateur HTTP d'axios —
// passe systématiquement ce champ, ce qui fait échouer *tous* les appels API côté serveur
// (les pages SSR se rendent alors sans données). On le retire à la source, sur le fetch global.
export default defineNitroPlugin(() => {
  const original = globalThis.fetch

  if ((original as unknown as { __cacheStripped?: boolean }).__cacheStripped) return

  const patched = ((input: RequestInfo | URL, init?: RequestInit) => {
    if (init && 'cache' in init) {
      const { cache: _drop, ...rest } = init
      return original(input, rest)
    }

    // axios peut aussi passer directement un objet Request porteur de `.cache` :
    // on le reconstruit sans ce champ (workerd n'accepte que la valeur par défaut).
    if (typeof Request !== 'undefined' && input instanceof Request && input.cache && input.cache !== 'default') {
      return original(
        new Request(input.url, {
          method: input.method,
          headers: input.headers,
          body: input.body,
          redirect: input.redirect,
          referrer: input.referrer,
          referrerPolicy: input.referrerPolicy,
          integrity: input.integrity,
          keepalive: input.keepalive,
          signal: input.signal,
          ...(input.body ? { duplex: 'half' } : {}),
          // `cache` volontairement omis
        } as RequestInit),
        init,
      )
    }

    return original(input, init)
  }) as typeof fetch

  ;(patched as unknown as { __cacheStripped: boolean }).__cacheStripped = true
  globalThis.fetch = patched
})
