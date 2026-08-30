import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, radius, font, sportColors } from '../theme';
import { useStore, dayMinutes, dayTotals, computeStreak, dayIsActive, getDay, dayActivities, activitySummary, stepsSummary } from '../store/store';
import { PROGRAM_BY_ID, EXERCISES, SPORT_BY_ID } from '../data/catalog';
import { dayKey, lastNDays, dayInitial, longDate, addDays } from '../lib/dates';
import { Card, SectionTitle, Bar, Empty } from '../components/ui';
import { formatWithUnit } from '../lib/format';
import { formatDistance, distanceUnit, formatDuration, formatPace } from '../lib/geo';

const Metric = memo(function Metric({ value, label, sub, color }) {
  return (
    <Card style={styles.metric}>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
      {sub ? <Text style={styles.metricSub}>{sub}</Text> : null}
    </Card>
  );
});

const WeekChart = memo(function WeekChart({ days }) {
  const week = useMemo(() => {
    const list = lastNDays(7).map((d) => {
      const k = dayKey(d);
      return { k, d, minutes: dayMinutes(getDay({ days }, k)) };
    });
    const max = Math.max(30, ...list.map((x) => x.minutes));
    return { list, max };
  }, [days]);

  return (
    <Card style={{ paddingTop: 20 }}>
      <View style={styles.chart}>
        {week.list.map((x, i) => {
          const h = Math.max(4, (x.minutes / week.max) * 110);
          const isToday = i === week.list.length - 1;
          return (
            <View key={x.k} style={styles.chartCol}>
              <Text style={styles.chartValue}>{x.minutes || ''}</Text>
              <View
                style={[
                  styles.chartBar,
                  { height: h, backgroundColor: isToday ? colors.accent : x.minutes ? colors.violet : colors.cardAlt },
                ]}
              />
              <Text style={[styles.chartLabel, isToday && { color: colors.accent }]}>{dayInitial(x.d)}</Text>
            </View>
          );
        })}
      </View>
    </Card>
  );
});

export default function StatsScreen() {
  const { state } = useStore();
  const today = useMemo(() => new Date(), []);

  const steps = useMemo(() => stepsSummary(state.days, lastNDays(30, today).map(dayKey)), [state.days, today]);

  const gps = useMemo(() => activitySummary(state.days, lastNDays(30, today).map(dayKey)), [state.days, today]);

  const summary = useMemo(() => {
    const days30 = lastNDays(30, today);
    let minutes = 0;
    let sessions = 0;
    let activeDays = 0;
    const bySport = {};
    const byExercise = {};

    for (const d of days30) {
      const day = state.days[dayKey(d)];
      if (!day) continue;
      if (dayIsActive(day)) activeDays++;
      minutes += dayMinutes(day);
      for (const [pid, s] of Object.entries(day.sessions)) {
        const p = PROGRAM_BY_ID[pid];
        if (!p) continue;
        if (s.done) sessions++;
        bySport[p.sport] = (bySport[p.sport] || 0) + p.minutes * (s.done ? 1 : 0.5);
      }
      for (const [ex, v] of Object.entries(dayTotals(day))) {
        if (!EXERCISES[ex] || !v) continue;
        byExercise[ex] = (byExercise[ex] || 0) + v;
      }
    }

    const sports = Object.entries(bySport).sort((a, b) => b[1] - a[1]);
    const sportTotal = sports.reduce((s, [, v]) => s + v, 0) || 1;
    const top = Object.entries(byExercise)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    return { minutes: Math.round(minutes), sessions, activeDays, sports, sportTotal, top };
  }, [state.days, today]);

  const history = useMemo(() => {
    const out = [];
    for (let i = 0; i < 45 && out.length < 20; i++) {
      const d = addDays(today, -i);
      const day = state.days[dayKey(d)];
      if (!day) continue;
      for (const [pid, s] of Object.entries(day.sessions)) {
        if (!s.done || !PROGRAM_BY_ID[pid]) continue;
        out.push({ id: `${dayKey(d)}-${pid}`, date: d, program: PROGRAM_BY_ID[pid] });
      }
      for (const a of dayActivities(day)) {
        out.push({
          id: `${dayKey(d)}-${a.id}`,
          date: d,
          activity: a,
          title: `${a.sport === 'marche' ? 'Marche' : 'Course'} · ${formatDistance(a.distance)} ${distanceUnit(a.distance)}`,
          sport: a.sport,
          right: formatDuration(a.durationSec),
        });
      }
    }
    return out;
  }, [state.days, today]);

  const streak = useMemo(() => computeStreak(state.days, today), [state.days, today]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Progrès</Text>
      <Text style={styles.sub}>Ce que tu as réellement fait, sur les 30 derniers jours.</Text>

      <View style={styles.metrics}>
        <Metric value={streak} label="jours de suite" color={colors.accent} />
        <Metric value={summary.sessions} label="séances finies" color={colors.violet} />
      </View>
      <View style={styles.metrics}>
        <Metric value={summary.minutes} label="minutes cumulées" color={colors.cyan} />
        <Metric value={`${summary.activeDays}/30`} label="jours actifs" color={colors.orange} />
      </View>

      {gps.count ? (
        <View style={styles.metrics}>
          <Metric
            value={`${formatDistance(gps.distance)} ${distanceUnit(gps.distance)}`}
            label="parcourus au GPS"
            sub={`${gps.count} ${gps.count > 1 ? 'sorties' : 'sortie'} · ${formatDuration(gps.durationSec)}`}
            color={colors.green}
          />
          <Metric
            value={gps.bestPace ? formatPace(gps.bestPace) : '—'}
            label="meilleure allure"
            sub="par kilomètre, en course"
            color={colors.pink}
          />
        </View>
      ) : null}

      {steps.total ? (
        <View style={styles.metrics}>
          <Metric
            value={steps.total.toLocaleString('fr-FR')}
            label="pas comptés"
            sub={`moyenne ${steps.average.toLocaleString('fr-FR')} / jour actif`}
            color={colors.violet}
          />
          <Metric
            value={steps.best.toLocaleString('fr-FR')}
            label="meilleure journée"
            sub="en nombre de pas"
            color={colors.cyan}
          />
        </View>
      ) : null}

      <SectionTitle>Cette semaine</SectionTitle>
      <WeekChart days={state.days} />

      <SectionTitle>Répartition par sport</SectionTitle>
      {summary.sports.length ? (
        <Card>
          {summary.sports.map(([sport, v], i) => (
            <View key={sport} style={[styles.sportRow, i > 0 && { marginTop: 14 }]}>
              <View style={styles.sportHead}>
                <Text style={styles.sportName}>
                  {SPORT_BY_ID[sport]?.emoji}  {SPORT_BY_ID[sport]?.name}
                </Text>
                <Text style={styles.sportVal}>{Math.round((v / summary.sportTotal) * 100)} %</Text>
              </View>
              <Bar ratio={v / summary.sportTotal} color={sportColors[sport]} height={6} />
            </View>
          ))}
        </Card>
      ) : (
        <Empty emoji="📊" title="Rien à afficher" text="Lance une séance : les stats se remplissent toutes seules." />
      )}

      <SectionTitle>Volume par exercice</SectionTitle>
      {summary.top.length ? (
        <Card>
          {summary.top.map(([ex, v], i) => (
            <View key={ex} style={[styles.volRow, i > 0 && styles.volBorder]}>
              <Text style={styles.volName} numberOfLines={1}>
                {EXERCISES[ex].name}
              </Text>
              <Text style={[styles.volValue, { color: sportColors[EXERCISES[ex].sport] }]}>
                {formatWithUnit(v, EXERCISES[ex].unit)}
              </Text>
            </View>
          ))}
        </Card>
      ) : (
        <Empty emoji="🏋️" title="Pas encore de volume" text="Utilise les compteurs de l’accueil pour commencer." />
      )}

      <SectionTitle>Historique</SectionTitle>
      {history.length ? (
        <Card>
          {history.map((h, i) => (
            <View key={h.id} style={[styles.volRow, i > 0 && styles.volBorder]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.volName} numberOfLines={1}>
                  {h.program ? h.program.title : h.title}
                </Text>
                <Text style={styles.histDate}>{longDate(h.date)}</Text>
              </View>
              <Text style={[styles.volValue, { color: sportColors[h.program ? h.program.sport : h.sport] }]}>
                {h.program ? `${h.program.minutes} min` : h.right}
              </Text>
            </View>
          ))}
        </Card>
      ) : (
        <Empty emoji="🗓️" title="Historique vide" text="Termine ta première séance pour la voir apparaître ici." />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 18, paddingBottom: 120, paddingTop: 8 },
  title: { ...font.h1, color: colors.text },
  sub: { ...font.small, color: colors.textDim, marginTop: 4, marginBottom: 18, lineHeight: 18 },
  metrics: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  metric: { flex: 1, paddingVertical: 18 },
  metricValue: { fontSize: 30, fontWeight: '800', letterSpacing: -1 },
  metricLabel: { ...font.small, color: colors.textMid, marginTop: 2 },
  metricSub: { ...font.small, color: colors.textDim },
  chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 160 },
  chartCol: { flex: 1, alignItems: 'center', gap: 6 },
  chartValue: { ...font.micro, color: colors.textDim },
  chartBar: { width: 20, borderRadius: 8 },
  chartLabel: { ...font.micro, color: colors.textDim },
  sportRow: {},
  sportHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 },
  sportName: { ...font.small, color: colors.text, fontWeight: '700' },
  sportVal: { ...font.small, color: colors.textMid },
  volRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 11, gap: 12 },
  volBorder: { borderTopWidth: 1, borderTopColor: colors.stroke },
  volName: { ...font.body, color: colors.text, flexShrink: 1 },
  volValue: { ...font.body, fontWeight: '800' },
  histDate: { ...font.small, color: colors.textDim, marginTop: 2 },
});
