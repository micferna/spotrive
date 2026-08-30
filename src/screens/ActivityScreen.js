import React, { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import Svg, { Polyline, Circle } from 'react-native-svg';
import { colors, radius, font, sportColors } from '../theme';
import * as tracker from '../lib/tracker';
import * as stepCounter from '../lib/steps';
import { formatDistance, distanceUnit, formatDuration, formatPace, paceFromMeters, projectPath } from '../lib/geo';
import { useStore } from '../store/store';
import { dayKey } from '../lib/dates';
import { Squeeze, tap, success } from '../components/ui';

const SPORTS = [
  { id: 'course', label: 'Course à pied', emoji: '🏃' },
  { id: 'marche', label: 'Marche', emoji: '🚶' },
];

const PATH_W = 320;
const PATH_H = 150;

/** Trace GPS en direct — un simple polyline SVG, sans carte ni clé d'API. */
function PathPreview({ points, color }) {
  const projected = useMemo(() => projectPath(points, PATH_W, PATH_H), [points]);
  if (!projected) {
    return (
      <View style={[styles.path, styles.pathEmpty]}>
        <Text style={styles.pathHint}>La trace apparaîtra après les premiers mètres.</Text>
      </View>
    );
  }
  const last = projected[projected.length - 1];
  return (
    <View style={styles.path}>
      <Svg width="100%" height={PATH_H} viewBox={`0 0 ${PATH_W} ${PATH_H}`}>
        <Polyline
          points={projected.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <Circle cx={projected[0].x} cy={projected[0].y} r={5} fill={colors.textDim} />
        <Circle cx={last.x} cy={last.y} r={6} fill={color} />
      </Svg>
    </View>
  );
}

export default function ActivityScreen({ onBack }) {
  const { dispatch } = useStore();
  const insets = useSafeAreaInsets();
  const state = useSyncExternalStore(tracker.subscribe, tracker.getState);
  const [sport, setSport] = useState('course');
  const [tick, setTick] = useState(0);
  const [starting, setStarting] = useState(false);

  const active = state.active;
  const color = sportColors[active ? state.sport : sport];

  // Le chrono avance même sans nouveau point GPS.
  useEffect(() => {
    if (!active || state.paused) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [active, state.paused]);

  // Écran maintenu allumé uniquement en repli : si la permission « toujours »
  // est accordée, le service de premier plan suffit et on laisse l'écran s'éteindre.
  useEffect(() => {
    const fallback = active && !state.background;
    if (fallback) activateKeepAwakeAsync('spotrive-activity').catch(() => {});
    else deactivateKeepAwake('spotrive-activity').catch(() => {});
    return () => deactivateKeepAwake('spotrive-activity').catch(() => {});
  }, [active, state.background]);

  const elapsed = tracker.elapsedMs(state) / 1000;
  useSyncExternalStore(stepCounter.subscribe, stepCounter.getState); // re-rend à chaque lot de pas
  const liveSteps = tracker.activitySteps(state);
  const pace = paceFromMeters(state.distance, elapsed);
  const speed = elapsed > 0 ? (state.distance / 1000 / (elapsed / 3600)) : 0;

  const onStart = useCallback(async () => {
    tap('medium');
    setStarting(true);
    const res = await tracker.start(sport);
    setStarting(false);
    if (!res.ok) {
      Alert.alert(
        res.reason === 'permission' ? 'Localisation refusée' : 'Impossible de démarrer',
        res.reason === 'permission'
          ? 'Spotrive a besoin de ta position pour mesurer la distance. Autorise la localisation dans les réglages Android, puis réessaie.'
          : res.message || 'Le service de localisation n’a pas démarré.'
      );
      return;
    }
    success();
    if (!res.background) {
      Alert.alert(
        'Autoriser « Toujours » pour verrouiller l’écran',
        'Android n’a accordé la position que pendant l’utilisation de l’app. Le suivi marche, mais l’écran doit rester allumé.\n\nPour pouvoir verrouiller ton téléphone en courant : Réglages → Autorisations → Position → « Toujours autoriser ».',
        [
          { text: 'Plus tard', style: 'cancel' },
          { text: 'Ouvrir les réglages', onPress: () => Linking.openSettings() },
        ]
      );
    }
  }, [sport]);

  const onStop = useCallback(() => {
    Alert.alert('Terminer l’activité ?', 'La distance et la durée seront enregistrées dans ta journée.', [
      { text: 'Continuer', style: 'cancel' },
      {
        text: 'Terminer',
        onPress: async () => {
          const summary = await tracker.stop();
          if (!summary) return onBack();
          if (summary.distance < 20) {
            Alert.alert('Activité trop courte', 'Moins de 20 mètres parcourus : rien n’a été enregistré.');
            return onBack();
          }
          success();
          dispatch({
            type: 'addActivity',
            key: dayKey(new Date(summary.startedAt)),
            activity: { id: `a${summary.startedAt}`, ...summary },
          });
          onBack();
        },
      },
    ]);
  }, [dispatch, onBack]);

  const leave = useCallback(() => {
    if (active) {
      Alert.alert('Activité en cours', 'Le suivi continue en arrière-plan. Tu peux revenir depuis l’accueil.', [
        { text: 'OK', onPress: onBack },
      ]);
      return;
    }
    onBack();
  }, [active, onBack]);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 150 + insets.bottom }]}>
        <View style={styles.navRow}>
          <Squeeze onPress={() => { tap(); leave(); }} scaleTo={0.9} hitSlop={10}>
            <View style={styles.backBtn}>
              <Text style={styles.backText}>‹</Text>
            </View>
          </Squeeze>
          <View style={styles.gpsRow}>
            <View
              style={[
                styles.gpsDot,
                { backgroundColor: !active ? colors.textDim : state.accuracy == null ? colors.orange : colors.green },
              ]}
            />
            <Text style={styles.gpsText}>
              {!active ? 'GPS en veille' : state.accuracy == null ? 'Recherche du signal…' : `±${Math.round(state.accuracy)} m`}
            </Text>
          </View>
        </View>

        {!active ? (
          <View style={styles.sportRow}>
            {SPORTS.map((s) => (
              <Squeeze key={s.id} onPress={() => { tap(); setSport(s.id); }} scaleTo={0.96}>
                <View
                  style={[
                    styles.sportBtn,
                    sport === s.id && { borderColor: sportColors[s.id], backgroundColor: sportColors[s.id] + '1C' },
                  ]}
                >
                  <Text style={{ fontSize: 22 }}>{s.emoji}</Text>
                  <Text style={[styles.sportLabel, sport === s.id && { color: colors.text }]}>{s.label}</Text>
                </View>
              </Squeeze>
            ))}
          </View>
        ) : (
          <Text style={[styles.liveTag, { color }]}>
            {SPORTS.find((s) => s.id === state.sport)?.emoji} {state.paused ? 'EN PAUSE' : 'EN COURS'}
          </Text>
        )}

        <View style={styles.hero}>
          <Text style={[styles.distance, { color }]}>{formatDistance(state.distance)}</Text>
          <Text style={styles.distanceUnit}>{distanceUnit(state.distance)}</Text>
        </View>

        <View style={styles.stats}>
          <Stat label="Durée" value={formatDuration(elapsed)} />
          <Stat label={state.sport === 'marche' && active ? 'Vitesse' : 'Allure'}
                value={state.sport === 'marche' && active ? `${speed.toFixed(1).replace('.', ',')} km/h` : formatPace(pace)} />
          <Stat label="Pas" value={liveSteps == null ? '—' : liveSteps.toLocaleString('fr-FR')} />
        </View>

        <PathPreview points={state.points} color={color} />

        <Text style={styles.note}>
          {active
            ? state.background
              ? 'Tu peux verrouiller ton téléphone et le mettre en poche : la mesure continue via la notification Spotrive.'
              : 'Position autorisée seulement « pendant l’utilisation » : garde l’écran allumé, sinon la mesure s’arrête.'
            : 'À la fin, la distance alimente automatiquement tes compteurs et tes statistiques.'}
        </Text>
      </ScrollView>

      <View style={[styles.footer, { bottom: Math.max(insets.bottom, 16) + 10 }]}>
        {!active ? (
          <Squeeze onPress={onStart} scaleTo={0.97} disabled={starting}>
            <View style={[styles.cta, { backgroundColor: color }]}>
              <Text style={styles.ctaText}>{starting ? 'Démarrage…' : 'Démarrer'}</Text>
            </View>
          </Squeeze>
        ) : (
          <View style={styles.footerRow}>
            <View style={{ flex: 1 }}>
              <Squeeze onPress={() => { tap(); state.paused ? tracker.resume() : tracker.pause(); }} scaleTo={0.96}>
                <View style={[styles.cta, styles.ctaSecondary]}>
                  <Text style={[styles.ctaText, { color: colors.text }]}>{state.paused ? 'Reprendre' : 'Pause'}</Text>
                </View>
              </Squeeze>
            </View>
            <View style={{ flex: 1 }}>
              <Squeeze onPress={onStop} scaleTo={0.96}>
                <View style={[styles.cta, { backgroundColor: color }]}>
                  <Text style={styles.ctaText}>Terminer</Text>
                </View>
              </Squeeze>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const Stat = ({ label, value }) => (
  <View style={styles.stat}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 18, paddingTop: 4 },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  backBtn: {
    width: 40, height: 40, borderRadius: 14, backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.stroke, alignItems: 'center', justifyContent: 'center',
  },
  backText: { color: colors.text, fontSize: 28, lineHeight: 30, fontWeight: '700', marginTop: -3 },
  gpsRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  gpsDot: { width: 8, height: 8, borderRadius: 4 },
  gpsText: { ...font.small, color: colors.textMid },
  sportRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  sportBtn: {
    width: 150, backgroundColor: colors.card, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.stroke, padding: 14, gap: 6,
  },
  sportLabel: { ...font.small, color: colors.textMid, fontWeight: '800' },
  liveTag: { ...font.micro, letterSpacing: 2, marginBottom: 6 },
  hero: { alignItems: 'center', marginTop: 26, marginBottom: 22 },
  distance: { fontSize: 82, fontWeight: '800', letterSpacing: -3, lineHeight: 88 },
  distanceUnit: { ...font.h3, color: colors.textDim, marginTop: -4 },
  stats: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 22 },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { ...font.h2, color: colors.text },
  statLabel: { ...font.small, color: colors.textDim, marginTop: 2 },
  path: {
    height: PATH_H, backgroundColor: colors.card, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.stroke, overflow: 'hidden',
  },
  pathEmpty: { alignItems: 'center', justifyContent: 'center' },
  pathHint: { ...font.small, color: colors.textDim },
  note: { ...font.small, color: colors.textDim, marginTop: 16, lineHeight: 18, textAlign: 'center' },
  footer: { position: 'absolute', left: 18, right: 18 },
  footerRow: { flexDirection: 'row', gap: 10 },
  cta: { borderRadius: radius.md, paddingVertical: 17, alignItems: 'center' },
  ctaSecondary: { backgroundColor: colors.cardAlt, borderWidth: 1, borderColor: colors.stroke },
  ctaText: { ...font.h3, color: colors.accentInk },
});
