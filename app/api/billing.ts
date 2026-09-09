import { apiHttp } from '@/lib/http'
import { STATSIO_API } from '@/api/statsio-endpoints'

interface BillingSessionResponse {
  success: boolean
  data: { url: string }
}

/** Démarre une session Stripe Checkout (abonnement Premium mensuel) — redirection hébergée. */
export async function startCheckoutSession(): Promise<string> {
  const { data } = await apiHttp.post<BillingSessionResponse>(STATSIO_API.billing.checkoutSession)
  return data.data.url
}

/** Ouvre le portail client Stripe (moyen de paiement, factures, annulation) — redirection hébergée. */
export async function startPortalSession(): Promise<string> {
  const { data } = await apiHttp.post<BillingSessionResponse>(STATSIO_API.billing.portalSession)
  return data.data.url
}
