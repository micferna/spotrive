import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, font, sportColors } from '../theme';
import { PROGRAM_BY_ID, EXERCISES, SPORT_BY_ID, LEVELS } from '../data/catalog';
import { useStore, getDay, sessionItems, sessionRatio } from '../store/store';
import { dayKey } from '../lib/dates';
import { formatValue, unitLabel } from '../lib/format';
import { Bar, Squeeze, tap, success } from '../components/ui';
import { TrackerRow } from '../components/Tracker';

const REST_SECONDS = 60;

/** Minuteur de repos — un seul interval, arrêté dès qu'il atteint zéro. */
function useRestTimer() {
  const [left, setLeft] = useState(0);
  const ref = useRef(null);

  const stop = useCallback(() => {
    if (ref.current) clearInterval(ref.current);
    ref.current = null;
    setLeft(0);
  }, []);

  const start = useCallback(
    (seconds = REST_SECONDS) => {
      if (ref.current) clearInterval(ref.current);
      setLeft(seconds);
      ref.current = setInterval(() => {
        setLeft((v) => {
          if (v <= 1) {
            clearInterval(ref.current);
            ref.current = null;
            success();
            return 0;
          }
          return v - 1;
        });
      }, 1000);
    },
    []
  );

  useEffect(() => () => ref.current && clearInterval(ref.current), []);
  return { left, start, stop };
}

export default function SessionScreen({ programId, onBack }) {
  const { state, dispatch } = useStore();
  const program = PROGRAM_BY_ID[programId];
  const key = dayKey();
  const day = getDay(state, key);
  const session = day.sessions[programId];
  const rest = useRestTimer();
  const insets = useSafeAreaInsets();

  const color = sportColors[program.sport] || colors.accent;
  const items = useMemo(() => sessionItems(program), [program]);
  const ratio = useMemo(() => sessionRatio(program, session), [program, session]);
  const doneCount = items.filter((i) => (session?.prog?.[i.key] || 0) >= i.target).length;

  const rows = useMemo(() => {
    const out = [];
    program.blocks.forEach((block, bi) => {
      out.push({ type: 'block', id: `b${bi}`, title: block.title, index: bi });
      block.items.forEach((item, ii) => {
        out.push({ type: 'tip', id: `t${bi}-${ii}`, ex: item.ex });
        const sets = item.sets || 1;
        for (let s = 0; s < sets; s++) {
          out.push({
            type: 'set',
            id: `${item.ex}|${bi}|${ii}|${s}`,
            ex: item.ex,
            target: item.target,
            set: s + 1,
            sets,
          });
        }
      });
    });
    return out;
  }, [program]);

  const setValue = useCallback(
    (itemKey, value) => dispatch({ type: 'setItem', key, pid: programId, itemKey, value }),
    [dispatch, key, programId]
  );

  const finish = useCallback(() => {
    success();
    dispatch({ type: 'finishSession', key, pid: programId });
    onBack();
  }, [dispatch, key, programId, onBack]);

  const reset = useCallback(() => {
    Alert.alert('Réinitialiser la séance ?', 'Toute la progression du jour sur cette séance sera effacée.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Réinitialiser',
        style: 'destructive',
        onPress: () => {
          tap('heavy');
          dispatch({ type: 'resetSession', key, pid: programId });
        },
      },
    ]);
  }, [dispatch, key, programId]);

  const renderItem = useCallback(
    ({ item }) => {
      if (item.type === 'block') {
        return (
          <View style={styles.blockHead}>
            <View style={[styles.blockDot, { backgroundColor: color }]} />
            <Text style={styles.blockTitle}>{item.title}</Text>
          </View>
        );
      }
      if (item.type === 'tip') {
        const ex = EXERCISES[item.ex];
        return (
          <View style={styles.tip}>
            <Text style={styles.tipText}>
              <Text style={{ color: colors.textMid, fontWeight: '800' }}>{ex.name} · </Text>
              {ex.tip}
            </Text>
          </View>
        );
      }
      const value = session?.prog?.[item.id] || 0;
      const unit = EXERCISES[item.ex].unit;
      return (
        <TrackerRow
          exId={item.ex}
          target={item.target}
          value={value}
          onChange={(v) => {
            setValue(item.id, v);
            if (v >= item.target && value < item.target && item.set < item.sets) rest.start();
          }}
          subtitle={`Série ${item.set}/${item.sets} · ${formatValue(value, unit)} / ${formatValue(
            item.target,
            unit
          )} ${unitLabel(unit, item.target)}`.trim()}
        />
      );
    },
    [color, session, setValue, rest]
  );

  const header = (
    <View style={styles.header}>
      <View style={styles.navRow}>
        <Squeeze onPress={() => { tap(); onBack(); }} scaleTo={0.9} hitSlop={10}>
          <View style={styles.backBtn}>
            <Text style={styles.backText}>‹</Text>
          </View>
        </Squeeze>
        <Squeeze onPress={reset} scaleTo={0.94} hitSlop={10}>
          <Text style={styles.resetText}>Réinitialiser</Text>
        </Squeeze>
      </View>

      <View style={styles.heroCard}>
        <LinearGradient
          colors={[color + '30', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.sportLine}>
          {SPORT_BY_ID[program.sport]?.emoji}  {SPORT_BY_ID[program.sport]?.name} ·{' '}
          {LEVELS.find((l) => l.id === program.level)?.name} · {program.minutes} min
        </Text>
        <Text style={styles.title}>{program.title}</Text>
        <Text style={styles.desc}>{program.desc}</Text>
        <View style={{ marginTop: 16 }}>
          <Bar ratio={ratio} color={color} height={7} />
          <Text style={styles.progressText}>
            {doneCount} / {items.length} séries validées · {Math.round(ratio * 100)} %
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={rows}
        renderItem={renderItem}
        keyExtractor={(i) => i.id}
        ListHeaderComponent={header}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        initialNumToRender={12}
        windowSize={9}
        removeClippedSubviews
      />

      {rest.left > 0 ? (
        <View style={[styles.restWrap, { bottom: 92 + insets.bottom }]} pointerEvents="box-none">
          <Squeeze onPress={rest.stop} scaleTo={0.97}>
            <View style={[styles.rest, { borderColor: color + '66' }]}>
              <Text style={[styles.restNum, { color }]}>{rest.left}s</Text>
              <Text style={styles.restLabel}>Repos — appuie pour passer</Text>
            </View>
          </Squeeze>
        </View>
      ) : null}

      <View style={[styles.footer, { bottom: Math.max(insets.bottom, 16) + 10 }]}>
        <Squeeze onPress={finish} scaleTo={0.97}>
          <View style={[styles.cta, { backgroundColor: session?.done ? colors.cardAlt : color }]}>
            <Text style={[styles.ctaText, session?.done && { color: colors.textMid }]}>
              {session?.done ? 'Séance terminée ✓' : 'Terminer la séance'}
            </Text>
          </View>
        </Squeeze>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 18, paddingBottom: 160, paddingTop: 4 },
  header: { marginBottom: 10 },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.stroke,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: colors.text, fontSize: 28, lineHeight: 30, fontWeight: '700', marginTop: -3 },
  resetText: { ...font.small, color: colors.textDim, fontWeight: '700' },
  heroCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.stroke,
    padding: 18,
    overflow: 'hidden',
  },
  sportLine: { ...font.micro, color: colors.textMid, marginBottom: 8 },
  title: { ...font.h1, color: colors.text, fontSize: 26 },
  desc: { ...font.small, color: colors.textDim, marginTop: 6, lineHeight: 19, fontWeight: '500' },
  progressText: { ...font.small, color: colors.textMid, marginTop: 8 },
  blockHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, marginBottom: 10 },
  blockDot: { width: 8, height: 8, borderRadius: 4 },
  blockTitle: { ...font.h3, color: colors.text },
  tip: { paddingHorizontal: 2, paddingBottom: 8 },
  tipText: { ...font.small, color: colors.textDim, lineHeight: 18, fontWeight: '500' },
  restWrap: { position: 'absolute', left: 18, right: 18 },
  rest: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  restNum: { ...font.h2 },
  restLabel: { ...font.small, color: colors.textDim, marginTop: 2 },
  footer: { position: 'absolute', left: 18, right: 18 },
  cta: { borderRadius: radius.md, paddingVertical: 17, alignItems: 'center' },
  ctaText: { ...font.h3, color: colors.accentInk },
});
