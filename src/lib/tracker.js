import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { haversine } from './geo';
import { sessionSteps } from './steps';

export const LOCATION_TASK = 'spotrive-location-tracking';
const SNAPSHOT_KEY = 'spotrive:activity';

// Filtres anti-bruit GPS : sans eux, une trace immobile « avance » de plusieurs
// centaines de mètres par heure.
const MAX_ACCURACY = 30;   // m — au-delà, le point est trop flou pour être utilisé
const MIN_STEP = 4;        // m — en dessous, c'est de la dérive, pas du déplacement
const MAX_STEP = 250;      // m — au-delà entre deux points, c'est un saut aberrant
const MAX_SPEED = 12;      // m/s (~43 km/h) — au-delà on n'est plus à pied

const LOCATION_OPTIONS = {
  accuracy: Location.Accuracy.BestForNavigation,
  timeInterval: 2000,
  distanceInterval: 5,
  pausesUpdatesAutomatically: false,
  showsBackgroundLocationIndicator: true,
  foregroundService: {
    notificationTitle: 'Spotrive — activité en cours',
    notificationBody: 'Mesure de la distance et de l’allure. Tu peux verrouiller l’écran.',
    notificationColor: '#C8FF43',
  },
};

const listeners = new Set();

let state = {
  active: false,
  paused: false,
  sport: 'course',
  distance: 0,        // mètres
  points: [],         // {latitude, longitude, t}
  startedAt: null,    // ms
  accumulatedMs: 0,   // temps déjà écoulé avant la pause en cours
  resumedAt: null,    // ms
  lastPoint: null,
  accuracy: null,
  error: null,
  background: false,   // permission « toujours » accordée -> écran verrouillé possible
  stepsBase: null,     // repère du podomètre au départ de la sortie
};

const emit = () => {
  state = { ...state };
  for (const l of listeners) l(state);
};

export const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const getState = () => state;

/** Temps d'activité réel, pauses déduites. */
/** Pas effectués depuis le début de la sortie, ou null si non mesurable. */
export function activitySteps(s = state) {
  if (!s.active || s.stepsBase == null) return null;
  return Math.max(0, sessionSteps() - s.stepsBase);
}

export function elapsedMs(s = state) {
  if (!s.active) return s.accumulatedMs;
  return s.accumulatedMs + (s.paused || !s.resumedAt ? 0 : Date.now() - s.resumedAt);
}

let saveTimer = null;
function persist() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const { active, paused, sport, distance, points, startedAt, accumulatedMs, resumedAt, stepsBase } = state;
    AsyncStorage.setItem(
      SNAPSHOT_KEY,
      JSON.stringify({ active, paused, sport, distance, points: points.slice(-2000), startedAt, accumulatedMs, resumedAt, stepsBase })
    ).catch(() => {});
  }, 1500);
}

/** Intègre un point GPS s'il passe les filtres. Exportée pour être testable. */
export function ingest(loc) {
  if (!state.active || state.paused) return;
  const { latitude, longitude, accuracy, speed } = loc.coords;
  const t = loc.timestamp || Date.now();
  if (accuracy != null && accuracy > MAX_ACCURACY) return;
  if (speed != null && speed > MAX_SPEED) return;

  const point = { latitude, longitude, t };
  const last = state.lastPoint;

  if (last) {
    const d = haversine(last, point);
    if (d < MIN_STEP || d > MAX_STEP) {
      state.accuracy = accuracy;
      return;
    }
    const dt = (t - last.t) / 1000;
    if (dt > 0 && d / dt > MAX_SPEED) return;
    state.distance += d;
  }

  state.lastPoint = point;
  state.points = [...state.points, point];
  state.accuracy = accuracy;
  emit();
  persist();
}

TaskManager.defineTask(LOCATION_TASK, ({ data, error }) => {
  if (error || !data?.locations) return;
  for (const loc of data.locations) ingest(loc);
});

/** Demande les permissions. Le second plan est optionnel : sans lui, on suit écran allumé. */
/** Est-ce que le suivi peut continuer écran verrouillé ? */
export async function hasBackgroundPermission() {
  try {
    const { status } = await Location.getBackgroundPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/** Permission déjà accordée : permet un démarrage automatique sans popup. */
export async function canStartSilently() {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function requestPermissions() {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== 'granted') return { granted: false, background: false };
  let background = false;
  try {
    const bg = await Location.requestBackgroundPermissionsAsync();
    background = bg.status === 'granted';
  } catch {
    background = false;
  }
  return { granted: true, background };
}

export async function start(sport) {
  const perm = await requestPermissions();
  if (!perm.granted) {
    state = { ...state, error: 'permission' };
    emit();
    return { ok: false, reason: 'permission' };
  }

  const now = Date.now();
  state = {
    background: perm.background,
    stepsBase: sessionSteps(),
    active: true,
    paused: false,
    sport,
    distance: 0,
    points: [],
    startedAt: now,
    accumulatedMs: 0,
    resumedAt: now,
    lastPoint: null,
    accuracy: null,
    error: null,
  };
  emit();

  try {
    const already = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK);
    if (already) await Location.stopLocationUpdatesAsync(LOCATION_TASK);
    await Location.startLocationUpdatesAsync(LOCATION_TASK, LOCATION_OPTIONS);
  } catch (e) {
    state = { ...state, error: String(e?.message || e) };
    emit();
    return { ok: false, reason: 'start', message: state.error };
  }
  return { ok: true, background: perm.background };
}

export function pause() {
  if (!state.active || state.paused) return;
  state = { ...state, paused: true, accumulatedMs: elapsedMs(), resumedAt: null, lastPoint: null };
  emit();
  persist();
}

export function resume() {
  if (!state.active || !state.paused) return;
  state = { ...state, paused: false, resumedAt: Date.now() };
  emit();
  persist();
}

/** Arrête le suivi et renvoie le résumé de l'activité, ou null si trop courte. */
export async function stop() {
  if (!state.active) return null;
  const summary = {
    sport: state.sport,
    distance: Math.round(state.distance),
    durationSec: Math.round(elapsedMs() / 1000),
    startedAt: state.startedAt,
    steps: activitySteps() ?? 0,
    points: downsample(state.points, 300),
  };

  try {
    if (await TaskManager.isTaskRegisteredAsync(LOCATION_TASK)) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK);
    }
  } catch {
    // Le suivi s'arrête de toute façon côté état ; inutile de bloquer l'utilisateur.
  }

  state = { ...state, active: false, paused: false, resumedAt: null };
  emit();
  AsyncStorage.removeItem(SNAPSHOT_KEY).catch(() => {});
  return summary;
}

/** Réduit une trace à `max` points en gardant la forme générale. */
export function downsample(points, max) {
  if (points.length <= max) return points;
  const step = points.length / max;
  const out = [];
  for (let i = 0; i < max; i++) out.push(points[Math.floor(i * step)]);
  out.push(points[points.length - 1]);
  return out;
}

/** Reprend une activité interrompue par un redémarrage de l'app. */
export async function restore() {
  try {
    const raw = await AsyncStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return false;
    const snap = JSON.parse(raw);
    if (!snap?.active) return false;
    state = {
      ...state,
      ...snap,
      lastPoint: snap.points?.length ? snap.points[snap.points.length - 1] : null,
      background: await hasBackgroundPermission(),
    };
    emit();

    // L'app a pu être tuée : si la tâche de localisation n'est plus enregistrée,
    // l'état dirait « en cours » sans qu'aucun point n'arrive. On la relance.
    try {
      const registered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK);
      if (!registered && (await canStartSilently())) {
        await Location.startLocationUpdatesAsync(LOCATION_TASK, LOCATION_OPTIONS);
      }
    } catch {
      // Si la relance échoue, l'utilisateur voit l'activité et peut la terminer.
    }
    return true;
  } catch {
    return false;
  }
}
