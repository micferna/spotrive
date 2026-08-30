import React, { memo, useCallback, useMemo, useSyncExternalStore } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, font, sportColors } from '../theme';
import { useStore, getDay, dayMinutes, sessionRatio, dayIsActive, computeStreak, dayActivities, daySteps } from '../store/store';
import { PROGRAM_BY_ID, QUICK_TRACKS, recommendationsFor } from '../data/catalog';
import { dayKey, greeting, longDate, lastNDays, dayInitial } from '../lib/dates';
import { Card, Ring, SectionTitle, Squeeze, Bar, tap } from '../components/ui';
import { TrackerRow } from '../components/Tracker';
import { ProgramCard } from '../components/ProgramCard';
import * as tracker from '../lib/tracker';
import * as stepCounter from '../lib/steps';
import { stepsToMeters } from '../lib/steps';
import { formatDistance, distanceUnit, formatDuration, formatPace, paceFromMeters } from '../lib/geo';

const GOAL_BY_LEVEL = { 1: 20, 2: 35, 3: 50 };
const STEP_GOAL_BY_LEVEL = { 1: 6000, 2: 8000, 3: 10000 };

const WeekStrip = memo(function WeekStrip({ days, todayKey }) {
  const week = useMemo(() => lastNDays(7), []);
  return (
    <View style={styles.week}>
      {week.map((d) => {
        const k = dayKey(d);
        const active = dayIsActive(days[k]);
        const isToday = k === todayKey;
        return (
          <View key={k} style={styles.weekCell}>
            <Text style={[styles.weekLabel, isToday && { color: colors.accent }]}>{dayInitial(d)}</Text>
            <View
              style={[
                styles.weekDot,
                active && { backgroundColor: colors.accent, borderColor: colors.accent },
                isToday && !active && { borderColor: colors.accent },
              ]}
            />
          </View>
        );
      })}
    </View>
  );
});

const GpsCard = memo(function GpsCard({ onPress }) {
  const live = useSyncExternalStore(tracker.subscribe, tracker.getState);
  const color = live.active ? sportColors[live.sport] : colors.cyan;
  return (
    <Squeeze onPress={() => { tap('medium'); onPress(); }} scaleTo={0.98}>
      <View style={[styles.gps, { borderColor: color + '4D' }]}>
        <LinearGradient
          colors={[color + '2E', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.gpsIcon, { backgroundColor: color + '22', borderColor: color + '55' }]}>
          <Text style={{ fontSize: 22 }}>{live.active ? (live.sport === 'marche' ? '🚶' : '🏃') : '📍'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.gpsTitle}>
            {live.active ? (live.paused ? 'Activité en pause' : 'Activité en cours') : 'Suivi GPS'}
          </Text>
          <Text style={styles.gpsSub}>
            {live.active
              ? `${formatDistance(live.distance)} ${distanceUnit(live.distance)} · ${formatDuration(tracker.elapsedMs(live) / 1000)}`
              : 'Course ou marche : distance, durée et allure mesurées automatiquement.'}
          </Text>
        </View>
        <Text style={[styles.gpsGo, { color }]}>{live.active ? 'Ouvrir' : 'Démarrer'}</Text>
      </View>
    </Squeeze>
  );
});

const StepsCard = memo(function StepsCard({ steps, goal }) {
  const sensor = useSyncExternalStore(stepCounter.subscribe, stepCounter.getState);
  const km = stepsToMeters(steps) / 1000;
  const ratio = goal ? Math.min(1, steps / goal) : 0;
  return (
    <Card style={{ paddingVertical: 16 }}>
      <View style={styles.stepsHead}>
        <View style={{ flex: 1 }}>
          <Text style={styles.stepsLabel}>PAS AUJOURD’HUI</Text>
          <Text style={styles.stepsValue}>
            {steps.toLocaleString('fr-FR')}
            <Text style={styles.stepsGoal}>{`  / ${goal.toLocaleString('fr-FR')}`}</Text>
          </Text>
        </View>
        <View style={styles.stepsRight}>
          <Text style={styles.stepsKm}>{km.toFixed(1).replace('.', ',')} km</Text>
          <Text style={styles.stepsKmLabel}>estimés</Text>
        </View>
      </View>
      <Bar ratio={ratio} color={colors.violet} height={6} />
      {sensor.available === false ? (
        <Text style={styles.stepsNote}>Aucun capteur de pas détecté sur cet appareil.</Text>
      ) : sensor.permission && sensor.permission !== 'granted' ? (
        <Text style={styles.stepsNote}>Autorise l’activité physique dans les réglages pour compter les pas.</Text>
      ) : (
        <Text style={styles.stepsNote}>Comptés par le capteur du téléphone pendant que Spotrive tourne.</Text>
      )}
    </Card>
  );
});

const ActivityRow = memo(function ActivityRow({ activity }) {
  const color = sportColors[activity.sport] || colors.accent;
  const pace = paceFromMeters(activity.distance, activity.durationSec);
  return (
    <View style={styles.actRow}>
      <View style={[styles.actIcon, { backgroundColor: color + '1F', borderColor: color + '4D' }]}>
        <Text style={{ fontSize: 17 }}>{activity.sport === 'marche' ? '🚶' : '🏃'}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.actTitle}>
          {formatDistance(activity.distance)} {distanceUnit(activity.distance)}
          <Text style={styles.actSub}>{`  ·  ${formatDuration(activity.durationSec)}`}</Text>
        </Text>
        <Text style={styles.actSub}>
          {activity.sport === 'marche' ? 'Marche' : 'Course'} · {formatPace(pace)}/km
        </Text>
      </View>
      <Text style={[styles.actTime, { color }]}>
        {new Date(activity.startedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );
});

export default function TodayScreen({ onOpenProgram, onOpenTab, onOpenActivity }) {
  const { state, dispatch } = useStore();
  const today = useMemo(() => new Date(), []);
  const key = dayKey(today);
  const day = getDay(state, key);

  const recos = useMemo(
    () => recommendationsFor(today, state.profile.level, state.profile.sports),
    [today, state.profile.level, state.profile.sports]
  );

  const minutes = useMemo(() => dayMinutes(day), [day]);
  const goal = GOAL_BY_LEVEL[state.profile.level] || 35;
  const sessionsDone = useMemo(() => Object.values(day.sessions).filter((s) => s.done).length, [day]);
  const streak = useMemo(() => computeStreak(state.days, today), [state.days, today]);

  const doneReco = recos.filter((p) => day.sessions[p.id]?.done).length;

  const onBump = useCallback(
    (ex, value) => dispatch({ type: 'setCounter', key, ex, value }),
    [dispatch, key]
  );

  const renderQuick = useCallback(
    ({ item }) => (
      <TrackerRow
        exId={item.ex}
        target={item.target}
        value={day.counters[item.ex] || 0}
        onChange={(v) => onBump(item.ex, v)}
      />
    ),
    [day.counters, onBump]
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>{greeting(today)}</Text>
          <Text style={styles.date}>{longDate(today)}</Text>
        </View>
        <View style={styles.streak}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={styles.streakNum}>{streak}</Text>
        </View>
      </View>

      <Card style={styles.hero}>
        <Ring ratio={minutes / goal} size={124} stroke={11}>
          <Text style={styles.heroNum}>{minutes}</Text>
          <Text style={styles.heroUnit}>/ {goal} min</Text>
        </Ring>
        <View style={styles.heroStats}>
          <Stat value={sessionsDone} label={sessionsDone > 1 ? 'séances' : 'séance'} color={colors.accent} />
          <Stat value={`${doneReco}/${recos.length}`} label="du programme" color={colors.violet} />
          <Stat
            value={Object.values(day.counters).filter((v) => v > 0).length}
            label="compteurs"
            color={colors.cyan}
          />
        </View>
      </Card>

      <View style={{ marginTop: 12 }}>
        <GpsCard onPress={onOpenActivity} />
      </View>

      <View style={{ marginTop: 12 }}>
        <StepsCard steps={daySteps(day)} goal={STEP_GOAL_BY_LEVEL[state.profile.level] || 8000} />
      </View>

      <WeekStrip days={state.days} todayKey={key} />

      <SectionTitle
        right={
          <Squeeze onPress={() => { tap(); onOpenTab('programs'); }}>
            <Text style={styles.link}>Tout voir</Text>
          </Squeeze>
        }
      >
        À faire aujourd’hui
      </SectionTitle>
      <Text style={styles.sectionSub}>
        Sélection adaptée à ton niveau et à la rotation de la semaine.
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.reel}
        decelerationRate="fast"
        snapToInterval={262}
        snapToAlignment="start"
      >
        {recos.map((p) => {
          const s = day.sessions[p.id];
          return (
            <ProgramCard
              key={p.id}
              program={p}
              done={s?.done}
              ratio={s ? sessionRatio(p, s) : 0}
              onPress={() => {
                tap();
                onOpenProgram(p.id);
              }}
            />
          );
        })}
      </ScrollView>

      {dayActivities(day).length ? (
        <>
          <SectionTitle>Sorties du jour</SectionTitle>
          <Card style={{ paddingVertical: 6 }}>
            {dayActivities(day).map((a) => (
              <ActivityRow key={a.id} activity={a} />
            ))}
          </Card>
        </>
      ) : null}

      <SectionTitle>Compteurs du jour</SectionTitle>
      <Text style={styles.sectionSub}>
        Appui long sur + ou − pour défiler vite. Le cercle valide d’un coup.
      </Text>

      <FlatList
        data={QUICK_TRACKS}
        renderItem={renderQuick}
        keyExtractor={(i) => i.id}
        scrollEnabled={false}
        removeClippedSubviews={false}
      />

      {sessionsDone > 0 ? (
        <>
          <SectionTitle>Séances entamées</SectionTitle>
          {Object.entries(day.sessions).map(([pid, s]) => {
            const p = PROGRAM_BY_ID[pid];
            if (!p) return null;
            return (
              <View key={pid} style={{ marginBottom: 12 }}>
                <ProgramCard
                  wide
                  program={p}
                  done={s.done}
                  ratio={sessionRatio(p, s)}
                  onPress={() => {
                    tap();
                    onOpenProgram(pid);
                  }}
                />
              </View>
            );
          })}
        </>
      ) : null}
    </ScrollView>
  );
}

const Stat = memo(function Stat({ value, label, color }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 18, paddingBottom: 120, paddingTop: 8 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  greeting: { ...font.h1, color: colors.text },
  date: { ...font.small, color: colors.textDim, marginTop: 3 },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.stroke,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  streakEmoji: { fontSize: 15 },
  streakNum: { ...font.h3, color: colors.text },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 18, paddingVertical: 20 },
  heroNum: { ...font.num, color: colors.text },
  heroUnit: { ...font.small, color: colors.textDim, marginTop: 1 },
  heroStats: { flex: 1, gap: 14 },
  stat: {},
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { ...font.small, color: colors.textDim, marginTop: 1 },
  week: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.stroke,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  weekCell: { alignItems: 'center', gap: 8, flex: 1 },
  weekLabel: { ...font.micro, color: colors.textDim },
  weekDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.strokeStrong,
    backgroundColor: 'transparent',
  },
  sectionSub: { ...font.small, color: colors.textDim, marginBottom: 14, marginTop: -6, lineHeight: 18 },
  reel: { gap: 12, paddingRight: 6, paddingVertical: 2 },
  link: { ...font.small, color: colors.accent, fontWeight: '700' },
  gps: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
  },
  gpsIcon: { width: 46, height: 46, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  gpsTitle: { ...font.h3, color: colors.text },
  gpsSub: { ...font.small, color: colors.textDim, marginTop: 3, lineHeight: 17 },
  gpsGo: { ...font.small, fontWeight: '800' },
  actRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  actIcon: { width: 38, height: 38, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  actTitle: { ...font.body, color: colors.text, fontWeight: '800' },
  actSub: { ...font.small, color: colors.textDim, fontWeight: '600' },
  actTime: { ...font.small, fontWeight: '700' },
  stepsHead: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 },
  stepsLabel: { ...font.micro, color: colors.textDim, marginBottom: 4 },
  stepsValue: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.8 },
  stepsGoal: { ...font.small, color: colors.textDim, fontWeight: '700' },
  stepsRight: { alignItems: 'flex-end' },
  stepsKm: { ...font.h3, color: colors.violet },
  stepsKmLabel: { ...font.small, color: colors.textDim },
  stepsNote: { ...font.small, color: colors.textDim, marginTop: 9, lineHeight: 17 },
});
