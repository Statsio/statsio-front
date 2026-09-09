import { describe, it, expect } from 'vitest'
import { parseLatLng } from './geo-point'

describe('parseLatLng', () => {
  it('parse "lat, lon" (data.gouv geo_point_2d)', () => {
    expect(parseLatLng('48.8566, 2.3522')).toEqual([48.8566, 2.3522])
    expect(parseLatLng('48.8566;2.3522')).toEqual([48.8566, 2.3522])
    expect(parseLatLng('48.8566 2.3522')).toEqual([48.8566, 2.3522])
  })

  it('respecte l\'ordre lnglat demandé', () => {
    expect(parseLatLng('2.3522, 48.8566', 'lnglat')).toEqual([48.8566, 2.3522])
  })

  it('parse le WKT POINT(lon lat) quel que soit l\'ordre demandé', () => {
    expect(parseLatLng('POINT(2.3522 48.8566)')).toEqual([48.8566, 2.3522])
    expect(parseLatLng('point (2.3522 48.8566)', 'latlng')).toEqual([48.8566, 2.3522])
  })

  it('parse un tableau / une string JSON GeoJSON [lon, lat]', () => {
    expect(parseLatLng([2.3522, 48.8566])).toEqual([48.8566, 2.3522])
    expect(parseLatLng('[2.3522, 48.8566]')).toEqual([48.8566, 2.3522])
  })

  it('parse un objet { lat, lon }', () => {
    expect(parseLatLng({ lat: 48.8566, lon: 2.3522 })).toEqual([48.8566, 2.3522])
    expect(parseLatLng('{"latitude":48.8566,"longitude":2.3522}')).toEqual([48.8566, 2.3522])
  })

  it('corrige une latitude hors bornes en inversant la paire', () => {
    // "lng, lat" fourni sans préciser l'ordre : lat=120 impossible → inversion
    expect(parseLatLng('120.5, 45.2')).toEqual([45.2, 120.5])
  })

  it('renvoie null sur une valeur inexploitable', () => {
    expect(parseLatLng('')).toBeNull()
    expect(parseLatLng(null)).toBeNull()
    expect(parseLatLng('Paris')).toBeNull()
    expect(parseLatLng('48.85')).toBeNull()
  })
})
