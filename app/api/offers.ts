import { publicHttp } from '@/lib/http'
import { STATSIO_API } from '@/api/statsio-endpoints'
import type { Offer, OfferComparisonRow, OfferFeature } from '@/types/offer'

interface RawOfferFeature {
  label: string
  included: boolean
}

interface RawOffer {
  id: number
  key: string
  name: string
  tagline: string | null
  price_cents: number
  currency: string
  period: string
  cta_label: string
  cta_url: string | null
  badge_label: string | null
  is_highlighted: boolean
  is_active: boolean
  position: number
  features: RawOfferFeature[] | null
}

interface RawOfferComparisonRow {
  id: number
  label: string
  hint: string | null
  free_value: string
  premium_value: string
  position: number
}

interface RawOffersResponse {
  offers: RawOffer[]
  comparison_rows: RawOfferComparisonRow[]
}

function mapFeature(raw: RawOfferFeature): OfferFeature {
  return { label: raw.label, included: raw.included }
}

function mapOffer(raw: RawOffer): Offer {
  return {
    id: raw.id,
    key: raw.key,
    name: raw.name,
    tagline: raw.tagline,
    priceCents: raw.price_cents,
    currency: raw.currency,
    period: raw.period,
    ctaLabel: raw.cta_label,
    ctaUrl: raw.cta_url,
    badgeLabel: raw.badge_label,
    isHighlighted: raw.is_highlighted,
    isActive: raw.is_active,
    position: raw.position,
    features: (raw.features ?? []).map(mapFeature),
  }
}

function mapComparisonRow(raw: RawOfferComparisonRow): OfferComparisonRow {
  return {
    id: raw.id,
    label: raw.label,
    hint: raw.hint,
    freeValue: raw.free_value,
    premiumValue: raw.premium_value,
    position: raw.position,
  }
}

export interface OffersPayload {
  offers: Offer[]
  comparisonRows: OfferComparisonRow[]
}

export const EMPTY_OFFERS: OffersPayload = { offers: [], comparisonRows: [] }

/** Offres Freemium / Premium + tableau comparatif (page publique /offres). Endpoint public, cache serveur. */
export async function fetchOffers(): Promise<OffersPayload> {
  const { data } = await publicHttp.get<{ success: boolean; data: RawOffersResponse }>(
    STATSIO_API.offers.collection,
  )

  return {
    offers: (data.data?.offers ?? []).map(mapOffer),
    comparisonRows: (data.data?.comparison_rows ?? []).map(mapComparisonRow),
  }
}
