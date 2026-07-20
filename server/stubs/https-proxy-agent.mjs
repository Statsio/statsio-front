// Stub pour https-proxy-agent sur le runtime Cloudflare Workers.
//
// axios importe `https-proxy-agent` de façon statique et inconditionnelle dans son adaptateur
// HTTP Node (lib/adapters/http.js), qui entraîne avec lui `agent-base` puis `debug`. Le bundle
// server Nitro (preset cloudflare_module) embarque donc cette chaîne même si l'app ne configure
// jamais de proxy HTTP(S) — et l'interop CJS/ESM de `debug` casse dans ce bundle, provoquant un
// crash au chargement du module (`lf.default is not a function`) sur *toute* requête SSR.
// Ce module ne devrait jamais être réellement instancié sur Workers (pas de var d'env
// HTTP(S)_PROXY, pas de config `proxy` sur nos instances axios) : si ça arrivait quand même,
// on préfère une erreur explicite à un crash cryptique.
export default class HttpsProxyAgentStub {
  constructor() {
    throw new Error('https-proxy-agent is not supported on the Cloudflare Workers runtime')
  }
}
