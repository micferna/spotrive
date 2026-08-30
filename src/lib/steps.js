import { Pedometer } from 'expo-sensors';

/**
 * Podomètre. Le capteur matériel compte les pas ; on s'y abonne et on ne
 * propage que les incréments, pour que l'appelant les cumule où il veut.
 *
 * Limite assumée : Android ne donne pas l'historique des pas à une app tierce.
 * On compte donc pendant que Spotrive tourne — ce qui inclut toute la durée
 * d'une activité GPS, service de premier plan oblige, écran verrouillé compris.
 */
const listeners = new Set();

let state = {
  available: null,   // null = pas encore testé
  permission: null,
  sessionSteps: 0,   // pas comptés depuis le début de l'abonnement
};

let sub = null;
let lastRaw = 0;
let onDelta = null;

const emit = () => {
  state = { ...state };
  for (const l of listeners) l(state);
};

export const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const getState = () => state;

/** Démarre le comptage. `handleDelta(n)` reçoit chaque lot de nouveaux pas. */
export async function startCounting(handleDelta) {
  onDelta = handleDelta;
  if (sub) return state;

  let available = false;
  try {
    available = await Pedometer.isAvailableAsync();
  } catch {
    available = false;
  }
  if (!available) {
    state = { ...state, available: false };
    emit();
    return state;
  }

  try {
    const perm = await Pedometer.requestPermissionsAsync();
    state = { ...state, permission: perm.status };
    if (perm.status !== 'granted') {
      state = { ...state, available: true };
      emit();
      return state;
    }
  } catch {
    // Certaines versions n'exposent pas la permission : on tente l'abonnement.
  }

  lastRaw = 0;
  sub = Pedometer.watchStepCount((result) => {
    const raw = result?.steps ?? 0;
    // Une ré-souscription repart de zéro : on ne renvoie jamais de delta négatif.
    const delta = raw >= lastRaw ? raw - lastRaw : raw;
    lastRaw = raw;
    if (delta > 0) {
      state = { ...state, sessionSteps: state.sessionSteps + delta };
      emit();
      onDelta?.(delta);
    }
  });

  state = { ...state, available: true };
  emit();
  return state;
}

export function stopCounting() {
  sub?.remove?.();
  sub = null;
  onDelta = null;
}

/** Pas comptés depuis le début de l'abonnement — sert de repère à une activité. */
export const sessionSteps = () => state.sessionSteps;

/** Estimation de la distance à partir des pas, si le GPS n'a rien donné. */
export const stepsToMeters = (steps, heightCm = 175) => steps * (heightCm * 0.415) / 100;
