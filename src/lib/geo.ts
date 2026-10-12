import type { AuthorizedLocation, GeoCheck, GeoPoint, TimeEntry } from '@/types'

/** Lo que devuelve el navegador al pedir la ubicación */
export type GeoReading = { point: GeoPoint; accuracyM: number } | 'denied' | 'unavailable'

export type LocationFlag = 'outside_location' | 'location_missing'

/** Radio por defecto al fijar una ubicación autorizada (wifi/IP en escritorio falla por decenas de metros) */
export const DEFAULT_RADIUS_M = 200

export function readBrowserLocation(timeoutMs = 10000): Promise<GeoReading> {
  if (!('geolocation' in navigator)) return Promise.resolve('unavailable')
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          point: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          accuracyM: Math.round(pos.coords.accuracy),
        }),
      (err) => resolve(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable'),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 },
    )
  })
}

/** Distancia en metros (fórmula de haversine) */
export function distanceMeters(a: GeoPoint, b: GeoPoint): number {
  const R = 6371000
  const rad = (d: number): number => (d * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return Math.round(2 * R * Math.asin(Math.sqrt(h)))
}

/** Compara la lectura con la ubicación autorizada del agente */
export function checkLocation(reading: GeoReading, authorized: AuthorizedLocation | undefined): GeoCheck {
  if (reading === 'denied' || reading === 'unavailable') {
    return { status: reading, point: null, accuracyM: null, distanceM: null }
  }
  if (!authorized) {
    return { status: 'no_reference', point: reading.point, accuracyM: reading.accuracyM, distanceM: null }
  }
  const distanceM = distanceMeters(reading.point, authorized)
  return {
    status: distanceM <= authorized.radiusM ? 'inside' : 'outside',
    point: reading.point,
    accuracyM: reading.accuracyM,
    distanceM,
  }
}

/** Banderas de ubicación de una entrada (entrada y salida). Entradas sin lectura (anteriores al GPS) no generan nada. */
export function getEntryLocationFlags(entry: TimeEntry): LocationFlag[] {
  const checks = [entry.clockInGeo, entry.clockOutGeo]
  const flags: LocationFlag[] = []
  if (checks.some((c) => c?.status === 'outside')) flags.push('outside_location')
  if (checks.some((c) => c?.status === 'denied' || c?.status === 'unavailable')) flags.push('location_missing')
  return flags
}

const fmtDistance = (m: number): string => (m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`)

/** Texto corto para la tabla: "Dentro (40 m)", "Fuera (1.2 km)", "Permiso negado" */
export function describeGeoCheck(check: GeoCheck): string {
  switch (check.status) {
    case 'inside':
      return `Dentro (${fmtDistance(check.distanceM ?? 0)})`
    case 'outside':
      return `Fuera (${fmtDistance(check.distanceM ?? 0)})`
    case 'denied':
      return 'Permiso negado'
    case 'unavailable':
      return 'Sin ubicación'
    case 'no_reference':
      return 'Sin ubicación autorizada'
  }
}
