import React, { memo, useCallback, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, radius, font, sportColors } from '../theme';
import { EXERCISES, UNIT_STEP, SPORT_BY_ID } from '../data/catalog';
import { formatValue, unitLabel } from '../lib/format';
import { Bar, Squeeze, tap, success } from './ui';

/** Bouton +/- avec répétition à l'appui long (accélère progressivement). */
const StepButton = memo(function StepButton({ label, onStep, tone }) {
  const timer = useRef(null);
  const speed = useRef(320);

  const stop = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    speed.current = 320;
  }, []);

  useEffect(() => stop, [stop]);

  const repeat = useCallback(() => {
    onStep();
    speed.current = Math.max(60, speed.current * 0.75);
    timer.current = setTimeout(repeat, speed.current);
  }, [onStep]);

  return (
    <Pressable
      onPress={() => {
        tap('light');
        onStep();
      }}
      onLongPress={() => {
        tap('medium');
        repeat();
      }}
      delayLongPress={280}
      onPressOut={stop}
      hitSlop={6}
      style={({ pressed }) => [
        styles.step,
        tone === 'plus' && styles.stepPlus,
        pressed && { opacity: 0.65 },
      ]}
    >
      <Text style={[styles.stepText, tone === 'plus' && { color: colors.accentInk }]}>{label}</Text>
    </Pressable>
  );
});

/**
 * Ligne d'exercice traçable : compteur incrémental + validation d'un coup.
 * Memoïsée : dans une FlatList de 30 lignes, seule celle qui bouge se re-rend.
 */
export const TrackerRow = memo(
  function TrackerRow({ exId, value = 0, target, onChange, subtitle, compact }) {
    const ex = EXERCISES[exId];
    const unit = ex.unit;
    const step = UNIT_STEP[unit] || 1;
    const color = sportColors[ex.sport] || colors.accent;
    const ratio = target ? Math.min(1, value / target) : 0;
    const done = target ? value >= target : false;

    const bump = useCallback((d) => onChange(Math.max(0, Math.round((value + d) * 100) / 100)), [value, onChange]);
    const inc = useCallback(() => bump(step), [bump, step]);
    const dec = useCallback(() => bump(-step), [bump, step]);

    const complete = useCallback(() => {
      if (done) {
        tap('light');
        onChange(0);
      } else {
        success();
        onChange(target);
      }
    }, [done, onChange, target]);

    return (
      <View style={[styles.row, done && { borderColor: color + '55', backgroundColor: color + '0F' }]}>
        <View style={styles.rowTop}>
          <Squeeze onPress={complete} scaleTo={0.9} hitSlop={8}>
            <View style={[styles.check, done && { backgroundColor: color, borderColor: color }]}>
              {done ? (
                <Text style={styles.checkMark}>✓</Text>
              ) : (
                <Text style={styles.checkEmoji}>{SPORT_BY_ID[ex.sport]?.emoji}</Text>
              )}
            </View>
          </Squeeze>

          <View style={styles.rowInfo}>
            <Text style={styles.name} numberOfLines={1}>
              {ex.name}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {subtitle ??
                `${formatValue(value, unit)} / ${formatValue(target, unit)} ${unitLabel(unit, target)}`.trim()}
            </Text>
          </View>

          <View style={styles.steps}>
            <StepButton label="−" onStep={dec} />
            <StepButton label="+" onStep={inc} tone="plus" />
          </View>
        </View>

        {!compact && <Bar ratio={ratio} color={color} height={5} />}
      </View>
    );
  },
  (a, b) => a.value === b.value && a.target === b.target && a.exId === b.exId && a.subtitle === b.subtitle
);

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.stroke,
    padding: 12,
    marginBottom: 10,
  },
  rowTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  check: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.cardAlt,
    borderWidth: 1.5,
    borderColor: colors.strokeStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: { color: colors.accentInk, fontSize: 20, fontWeight: '900' },
  checkEmoji: { fontSize: 18 },
  rowInfo: { flex: 1, marginHorizontal: 12 },
  name: { ...font.body, color: colors.text, fontWeight: '700' },
  meta: { ...font.small, color: colors.textDim, marginTop: 2 },
  steps: { flexDirection: 'row', gap: 8 },
  step: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.stroke,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepPlus: { backgroundColor: colors.accent, borderColor: colors.accent },
  stepText: { color: colors.text, fontSize: 22, fontWeight: '800', lineHeight: 25 },
});
