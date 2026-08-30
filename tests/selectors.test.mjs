import assert from 'node:assert/strict';
import { PROGRAM_BY_ID, PROGRAMS, EXERCISES, QUICK_TRACKS, recommendationsFor } from '../src/data/catalog.js';
import * as S from '../src/store/selectors.js';
import { dayKey, addDays, lastNDays } from '../src/lib/dates.js';
import { formatValue, formatWithUnit } from '../src/lib/format.js';
import { haversine, formatPace, formatDuration, formatDistance, paceFromMeters, projectPath } from '../src/lib/geo.js';

let pass = 0;
const t = (name, fn) => { fn(); pass++; console.log('  ✓', name); };

t('toutes les références du catalogue existent', () => {
  for (const p of PROGRAMS)
    for (const b of p.blocks)
      for (const i of b.items) assert.ok(EXERCISES[i.ex], `${p.id} → ${i.ex}`);
  for (const q of QUICK_TRACKS) assert.ok(EXERCISES[q.ex]);
});

t('sessionItems déplie chaque série', () => {
  const p = PROGRAM_BY_ID.torse_pushpull;
  const items = S.sessionItems(p);
  const expected = p.blocks.reduce((n, b) => n + b.items.reduce((m, i) => m + (i.sets || 1), 0), 0);
  assert.equal(items.length, expected);
  assert.equal(new Set(items.map((i) => i.key)).size, items.length, 'clés uniques');
});

t('sessionRatio va de 0 à 1 et plafonne', () => {
  const p = PROGRAM_BY_ID.gainage_express;
  const items = S.sessionItems(p);
  assert.equal(S.sessionRatio(p, undefined), 0);
  const half = Object.fromEntries(items.slice(0, Math.floor(items.length / 2)).map((i) => [i.key, i.target]));
  const r = S.sessionRatio(p, { prog: half });
  assert.ok(r > 0.3 && r < 0.7, `ratio inattendu ${r}`);
  const over = Object.fromEntries(items.map((i) => [i.key, i.target * 5]));
  assert.equal(S.sessionRatio(p, { prog: over }), 1);
});

t('dayMinutes : prorata puis total quand la séance est finie', () => {
  const p = PROGRAM_BY_ID.gainage_express;
  const items = S.sessionItems(p);
  const day = S.emptyDay();
  day.sessions[p.id] = { prog: Object.fromEntries(items.map((i) => [i.key, i.target / 2])), done: false };
  assert.equal(S.dayMinutes(day), Math.round(p.minutes * 0.5));
  day.sessions[p.id].done = true;
  assert.equal(S.dayMinutes(day), p.minutes);
});

t('dayMinutes ignore les programmes inconnus', () => {
  const day = S.emptyDay();
  day.sessions.programme_supprime = { prog: { 'x|0|0|0': 10 }, done: true };
  assert.equal(S.dayMinutes(day), 0);
});

t('dayTotals cumule compteurs et séries', () => {
  const day = S.emptyDay();
  day.counters.pompes = 20;
  day.sessions.torse_pushpull = { prog: { 'pompes|0|0|0': 12, 'pompes|0|0|1': 10 }, done: false };
  assert.equal(S.dayTotals(day).pompes, 42);
});

t('dayIsActive détecte toute forme d’activité', () => {
  assert.equal(S.dayIsActive(undefined), false);
  assert.equal(S.dayIsActive(S.emptyDay()), false);
  const a = S.emptyDay(); a.counters.pompes = 0;
  assert.equal(S.dayIsActive(a), false);
  a.counters.pompes = 1;
  assert.equal(S.dayIsActive(a), true);
  const b = S.emptyDay(); b.sessions.x = { prog: {}, done: true };
  assert.equal(S.dayIsActive(b), true);
});

t('computeStreak compte les jours consécutifs, jour en cours vide toléré', () => {
  const today = new Date('2026-08-30T10:00:00');
  const days = {};
  const active = () => { const d = S.emptyDay(); d.counters.pompes = 10; return d; };
  for (let i = 1; i <= 4; i++) days[dayKey(addDays(today, -i))] = active();
  assert.equal(S.computeStreak(days, today), 4, 'aujourd’hui vide ne casse pas la série');
  days[dayKey(today)] = active();
  assert.equal(S.computeStreak(days, today), 5);
  delete days[dayKey(addDays(today, -2))];
  assert.equal(S.computeStreak(days, today), 2, 'un trou coupe la série');
  assert.equal(S.computeStreak({}, today), 0);
});

t('recommandations : échauffement en tête, pas de doublon, tous les jours couverts', () => {
  for (let i = 0; i < 14; i++) {
    for (const lvl of [1, 2, 3]) {
      const d = addDays(new Date('2026-08-30T08:00:00'), i);
      const r = recommendationsFor(d, lvl, []);
      assert.ok(r.length >= 2, `jour ${i} niveau ${lvl} : ${r.length} reco`);
      assert.equal(r[0].sport, 'echauffement');
      assert.equal(new Set(r.map((p) => p.id)).size, r.length, 'doublons');
      assert.ok(r.every(Boolean));
    }
  }
});

t('recommandations : le filtre sports est respecté', () => {
  const r = recommendationsFor(new Date('2026-08-30T08:00:00'), 2, ['course']);
  assert.ok(r.every((p) => ['course', 'echauffement'].includes(p.sport)), r.map((p) => p.sport).join(','));
});

t('recommandations stables pour une même date', () => {
  const d = new Date('2026-09-02T08:00:00');
  assert.deepEqual(recommendationsFor(d, 2).map((p) => p.id), recommendationsFor(d, 2).map((p) => p.id));
});

t('dates : clés au format ISO local, semaine de 7 jours finissant aujourd’hui', () => {
  assert.equal(dayKey(new Date(2026, 0, 5)), '2026-01-05');
  const w = lastNDays(7, new Date(2026, 7, 30));
  assert.equal(w.length, 7);
  assert.equal(dayKey(w[6]), '2026-08-30');
  assert.equal(dayKey(w[0]), '2026-08-24');
});

t('formatage des valeurs', () => {
  assert.equal(formatValue(45, 'sec'), '45');
  assert.equal(formatValue(90, 'sec'), '1′30');
  assert.equal(formatValue(120, 'sec'), '2′');
  assert.equal(formatValue(5.25, 'km'), '5,3');
  assert.equal(formatWithUnit(12, 'reps'), '12 reps');
});

t('haversine : distances connues', () => {
  const paris = { latitude: 48.8566, longitude: 2.3522 };
  assert.equal(Math.round(haversine(paris, paris)), 0);
  // 0,01 degré de latitude ~ 1111 m, quelle que soit la longitude
  assert.ok(Math.abs(haversine(paris, { ...paris, latitude: 48.8666 }) - 1111) < 5);
  // Paris -> Lyon ~ 392 km
  const lyon = { latitude: 45.7640, longitude: 4.8357 };
  assert.ok(Math.abs(haversine(paris, lyon) / 1000 - 392) < 5);
});

t('allure et distance : formats et cas limites', () => {
  assert.equal(formatPace(0), '—');
  assert.equal(formatPace(NaN), '—');
  assert.equal(formatPace(7200), '—', 'une allure absurde ne s’affiche pas');
  assert.equal(formatPace(330), "5'30\"");
  assert.equal(formatDistance(850), '850');
  assert.equal(formatDistance(5432), '5,43');
  assert.equal(formatDuration(59), '0:59');
  assert.equal(formatDuration(3725), '1:02:05');
  assert.equal(paceFromMeters(10, 60), 0, 'sous 20 m, pas d’allure calculée');
  assert.equal(Math.round(paceFromMeters(1000, 300)), 300);
});

t('projection de trace : proportions gardées, nord en haut', () => {
  assert.equal(projectPath([], 100, 100), null);
  assert.equal(projectPath([{ latitude: 1, longitude: 1 }], 100, 100), null);
  const pts = [
    { latitude: 48.85, longitude: 2.35 },
    { latitude: 48.86, longitude: 2.35 },
  ];
  const proj = projectPath(pts, 200, 100);
  assert.equal(proj.length, 2);
  assert.ok(proj[1].y < proj[0].y, 'le point le plus au nord est plus haut');
  for (const p of proj) {
    assert.ok(p.x >= 0 && p.x <= 200 && p.y >= 0 && p.y <= 100, 'point hors cadre');
  }
});

t('activités GPS : volume, minutes et cumuls', () => {
  const day = S.emptyDay();
  day.activities = [
    { id: 'a', sport: 'course', distance: 5200, durationSec: 1800, startedAt: 1 },
    { id: 'b', sport: 'marche', distance: 2000, durationSec: 1500, startedAt: 2 },
  ];
  assert.equal(S.dayTotals(day).sortie_longue, 5.2, 'la course remplit le compteur en km');
  assert.equal(S.dayTotals(day).marche_active, 25, 'la marche remplit le compteur en minutes');
  assert.equal(S.dayMinutes(day), 55);
  assert.equal(S.dayIsActive(day), true);
  const sum = S.activitySummary({ k: day }, ['k']);
  assert.equal(sum.distance, 7200);
  assert.equal(sum.count, 2);
  assert.equal(Math.round(sum.bestPace), 346);
});

t('activités : un jour sans le champ reste lisible (données d’avant la mise à jour)', () => {
  const legacy = { counters: { pompes: 10 }, sessions: {} };
  assert.deepEqual(S.dayActivities(legacy), []);
  assert.equal(S.dayTotals(legacy).pompes, 10);
  assert.equal(S.dayMinutes(legacy), 0);
  assert.equal(S.dayIsActive(legacy), true);
});

t('pas : alimentent le compteur du jour et les cumuls', () => {
  const day = S.emptyDay();
  day.steps = 7400;
  assert.equal(S.daySteps(day), 7400);
  assert.equal(S.dayTotals(day).pas_journee, 7400);
  assert.equal(S.dayIsActive(day), true, 'marcher suffit à rendre la journée active');

  const days = { a: { ...S.emptyDay(), steps: 6000 }, b: { ...S.emptyDay(), steps: 10000 }, c: S.emptyDay() };
  const sum = S.stepsSummary(days, ['a', 'b', 'c', 'inconnu']);
  assert.equal(sum.total, 16000);
  assert.equal(sum.best, 10000);
  assert.equal(sum.average, 8000, 'la moyenne ignore les jours sans pas');
  assert.deepEqual(S.stepsSummary({}, ['x']), { total: 0, best: 0, average: 0 });
});

t('pas : un compteur manuel et le capteur se cumulent sans s’écraser', () => {
  const day = S.emptyDay();
  day.counters.pas_journee = 2000;
  day.steps = 5000;
  assert.equal(S.dayTotals(day).pas_journee, 7000);
});

console.log(`\n${pass} tests OK`);
