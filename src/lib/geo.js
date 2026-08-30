const R = 6371000; // rayon terrestre moyen, en mètres
const rad = (d) => (d * Math.PI) / 180;

/** Distance haversine entre deux points {latitude, longitude}, en mètres. */
export function haversine(a, b) {
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const lat1 = rad(a.latitude);
  const lat2 = rad(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export const formatDistance = (m) => {
  if (m < 1000) return `${Math.round(m)}`;
  return (m / 1000).toFixed(2).replace('.', ',');
};

export const distanceUnit = (m) => (m < 1000 ? 'm' : 'km');

export function formatDuration(sec) {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(r)}` : `${m}:${pad(r)}`;
}

/** Allure en secondes/km -> "5'30"". Renvoie "—" tant que la mesure n'a pas de sens. */
export function formatPace(secPerKm) {
  if (!secPerKm || !isFinite(secPerKm) || secPerKm <= 0 || secPerKm > 3600) return '—';
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return s === 60 ? `${m + 1}'00"` : `${m}'${String(s).padStart(2, '0')}"`;
}

export const paceFromMeters = (meters, seconds) => (meters > 20 ? seconds / (meters / 1000) : 0);

/**
 * Projette une trace GPS dans une boîte en pixels, en gardant les proportions.
 * Renvoie null si le tracé est trop court pour être dessiné.
 */
export function projectPath(points, width, height, pad = 10) {
  if (!points || points.length < 2) return null;
  let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity;
  for (const p of points) {
    if (p.latitude < minLat) minLat = p.latitude;
    if (p.latitude > maxLat) maxLat = p.latitude;
    if (p.longitude < minLon) minLon = p.longitude;
    if (p.longitude > maxLon) maxLon = p.longitude;
  }
  // À nos latitudes, un degré de longitude est plus court qu'un degré de latitude.
  const kx = Math.cos(rad((minLat + maxLat) / 2));
  const spanX = Math.max((maxLon - minLon) * kx, 1e-9);
  const spanY = Math.max(maxLat - minLat, 1e-9);
  const scale = Math.min((width - pad * 2) / spanX, (height - pad * 2) / spanY);
  const offX = (width - spanX * scale) / 2;
  const offY = (height - spanY * scale) / 2;
  return points.map((p) => ({
    x: offX + (p.longitude - minLon) * kx * scale,
    y: height - (offY + (p.latitude - minLat) * scale), // y inversé : nord en haut
  }));
}
