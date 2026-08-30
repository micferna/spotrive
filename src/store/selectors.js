// Logique pure (aucune dépendance React) — testable en isolation.
import { PROGRAM_BY_ID, EXERCISES } from '../data/catalog';
import { dayKey, addDays } from '../lib/dates';

export const emptyDay = () => ({ counters: {}, sessions: {}, activities: [], steps: 0 });

// Une activité GPS alimente le compteur de l'exercice correspondant, pour que le
// volume et les stats montent tout seuls après une sortie.
export const ACTIVITY_EXERCISE = {
  course: { ex: 'sortie_longue', value: (a) => a.distance / 1000 },
  marche: { ex: 'marche_active', value: (a) => a.durationSec / 60 },
};

export const dayActivities = (day) => day?.activities || [];
export const daySteps = (day) => day?.steps || 0;
export const STEP_EXERCISE = 'pas_journee';

export const getDay = (state, key) => state.days[key] || emptyDay();

export function sessionItems(program) {
  const out = [];
  program.blocks.forEach((block, bi) => {
    block.items.forEach((item, ii) => {
      for (let set = 0; set < (item.sets || 1); set++) {
        out.push({
          key: `${item.ex}|${bi}|${ii}|${set}`,
          ex: item.ex,
          target: item.target,
          unit: EXERCISES[item.ex].unit,
          blockIndex: bi,
          setIndex: set,
          setCount: item.sets || 1,
        });
      }
    });
  });
  return out;
}

export function sessionRatio(program, session) {
  const items = sessionItems(program);
  if (!items.length) return 0;
  let sum = 0;
  for (const i of items) sum += Math.min(1, (session?.prog?.[i.key] || 0) / i.target);
  return sum / items.length;
}

/** Volume total par exercice sur une journée : compteurs libres + séances. */
export function dayTotals(day) {
  const totals = { ...day.counters };
  for (const a of dayActivities(day)) {
    const map = ACTIVITY_EXERCISE[a.sport];
    if (!map) continue;
    totals[map.ex] = (totals[map.ex] || 0) + map.value(a);
  }
  if (daySteps(day)) totals[STEP_EXERCISE] = (totals[STEP_EXERCISE] || 0) + daySteps(day);
  for (const s of Object.values(day.sessions)) {
    for (const [itemKey, v] of Object.entries(s.prog)) {
      if (!v) continue;
      const ex = itemKey.split('|')[0];
      totals[ex] = (totals[ex] || 0) + v;
    }
  }
  return totals;
}

/** Minutes estimées : au prorata de l'avancement réel de chaque séance. */
export function dayMinutes(day) {
  let total = 0;
  for (const a of dayActivities(day)) total += a.durationSec / 60;
  for (const [pid, s] of Object.entries(day.sessions)) {
    const prog = PROGRAM_BY_ID[pid];
    if (!prog) continue;
    total += prog.minutes * (s.done ? 1 : sessionRatio(prog, s));
  }
  return Math.round(total);
}

export function dayIsActive(day) {
  if (!day) return false;
  if (dayActivities(day).length > 0) return true;
  if (daySteps(day) > 0) return true;
  if (Object.values(day.counters).some((v) => v > 0)) return true;
  return Object.values(day.sessions).some((s) => s.done || Object.values(s.prog).some((v) => v > 0));
}

/** Jours actifs consécutifs, en tolérant que la journée en cours soit encore vide. */
export function computeStreak(days, today = new Date()) {
  let streak = 0;
  for (let i = 0; i < 400; i++) {
    const day = days[dayKey(addDays(today, -i))];
    if (dayIsActive(day)) streak++;
    else if (i > 0) break;
  }
  return streak;
}

/** Cumuls GPS sur une liste de jours : distance totale, durée, meilleure allure. */
export function activitySummary(days, keys) {
  let distance = 0;
  let durationSec = 0;
  let count = 0;
  let bestPace = 0;
  for (const k of keys) {
    for (const a of dayActivities(days[k])) {
      distance += a.distance;
      durationSec += a.durationSec;
      count++;
      if (a.sport === 'course' && a.distance > 400) {
        const pace = a.durationSec / (a.distance / 1000);
        if (!bestPace || pace < bestPace) bestPace = pace;
      }
    }
  }
  return { distance, durationSec, count, bestPace };
}

/** Total de pas sur une liste de jours, et meilleure journée. */
export function stepsSummary(days, keys) {
  let total = 0;
  let best = 0;
  let activeDays = 0;
  for (const k of keys) {
    const n = daySteps(days[k]);
    total += n;
    if (n > best) best = n;
    if (n > 0) activeDays++;
  }
  return { total, best, average: activeDays ? Math.round(total / activeDays) : 0 };
}
