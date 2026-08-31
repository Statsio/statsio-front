import { describe, it, expect } from 'vitest'
import {
  CHANNEL_KIND_STYLE,
  CHANNEL_PACE_STYLE,
  channelKindLabel,
  channelPostIcon,
  channelPostKindLabel,
} from './channel-catalog-display'

describe('channel-catalog-display', () => {
  it('exposes a style for every channel kind', () => {
    expect(CHANNEL_KIND_STYLE.redaction.label).toBe('RÉDACTION')
    expect(CHANNEL_KIND_STYLE.institution.label).toBe('INSTITUTION')
    expect(CHANNEL_KIND_STYLE.independant.label).toBe('INDÉPENDANT')
    expect(channelKindLabel('redaction')).toBe('RÉDACTION')
  })

  it('exposes a label + dot for every publication pace', () => {
    expect(CHANNEL_PACE_STYLE.jour.short).toBe('Quotidien')
    expect(CHANNEL_PACE_STYLE.semaine.short).toBe('Hebdo')
    expect(CHANNEL_PACE_STYLE.mois.short).toBe('Mensuel')
  })

  it('maps content types to a "dernières parutions" icon and label', () => {
    expect(channelPostKindLabel('statsdata')).toBe('Statsdata')
    expect(channelPostKindLabel('survey')).toBe('Sondage')
    expect(channelPostKindLabel('article')).toBe('Article')
    expect(channelPostIcon('statsdata')).toBe('▤')
    expect(channelPostIcon('article')).toBe('✎')
  })
})
