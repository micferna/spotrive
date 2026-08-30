import React, { memo, useCallback, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Easing, Platform } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { colors, radius, font, shadow } from '../theme';

export const tap = (style = 'light') => {
  if (Platform.OS === 'web') return;
  const map = {
    light: Haptics.ImpactFeedbackStyle.Light,
    medium: Haptics.ImpactFeedbackStyle.Medium,
    heavy: Haptics.ImpactFeedbackStyle.Heavy,
  };
  Haptics.impactAsync(map[style]).catch(() => {});
};

export const success = () => {
  if (Platform.OS === 'web') return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
};

/** Pression avec retour d'échelle — animation 100 % sur le thread natif. */
export const Squeeze = memo(function Squeeze({ children, onPress, style, scaleTo = 0.96, disabled, hitSlop }) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = useCallback(
    (v) => Animated.spring(scale, { toValue: v, useNativeDriver: true, speed: 40, bounciness: 6 }).start(),
    [scale]
  );
  return (
    <Pressable
      onPressIn={() => !disabled && to(scaleTo)}
      onPressOut={() => to(1)}
      onPress={onPress}
      disabled={disabled}
      hitSlop={hitSlop}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
});

export const Card = memo(function Card({ children, style, tint }) {
  return <View style={[styles.card, tint && { borderColor: tint + '33' }, style]}>{children}</View>;
});

export const Chip = memo(function Chip({ label, active, color = colors.accent, onPress, small }) {
  return (
    <Squeeze onPress={onPress} scaleTo={0.94}>
      <View
        style={[
          styles.chip,
          small && styles.chipSmall,
          active && { backgroundColor: color, borderColor: color },
        ]}
      >
        <Text
          style={[
            styles.chipText,
            small && { fontSize: 12 },
            active && { color: colors.accentInk },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
    </Squeeze>
  );
});

/** Barre de progression fine, animée en largeur (layout animé -> on garde des barres courtes). */
export const Bar = memo(function Bar({ ratio, color = colors.accent, height = 6, track = colors.cardAlt }) {
  const w = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(w, {
      toValue: Math.max(0, Math.min(1, ratio)),
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [ratio, w]);
  const width = w.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  return (
    <View style={[styles.barTrack, { height, borderRadius: height, backgroundColor: track }]}>
      <Animated.View style={{ width, height, borderRadius: height, backgroundColor: color }} />
    </View>
  );
});

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Anneau de progression SVG. */
export const Ring = memo(function Ring({ size = 132, stroke = 12, ratio = 0, color = colors.accent, children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: Math.max(0, Math.min(1, ratio)),
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [ratio, anim]);
  const offset = anim.interpolate({ inputRange: [0, 1], outputRange: [c, 0] });
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.cardAlt} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={{ alignItems: 'center' }}>{children}</View>
    </View>
  );
});

export const Toggle = memo(function Toggle({ value, onChange, title, desc, color = colors.accent }) {
  return (
    <Squeeze onPress={() => { tap(); onChange(!value); }} scaleTo={0.98}>
      <View style={[styles.toggleRow, value && { borderColor: color + '66', backgroundColor: color + '10' }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.toggleTitle, value && { color }]}>{title}</Text>
          {desc ? <Text style={styles.toggleDesc}>{desc}</Text> : null}
        </View>
        <View style={[styles.track, value && { backgroundColor: color }]}>
          <View style={[styles.knob, value && { alignSelf: 'flex-end', backgroundColor: colors.accentInk }]} />
        </View>
      </View>
    </Squeeze>
  );
});

export const SectionTitle = memo(function SectionTitle({ children, right }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{children}</Text>
      {right}
    </View>
  );
});

export const Empty = memo(function Empty({ emoji, title, text }) {
  return (
    <View style={styles.empty}>
      <Text style={{ fontSize: 34, marginBottom: 10 }}>{emoji}</Text>
      <Text style={[font.h3, { color: colors.text, marginBottom: 4 }]}>{title}</Text>
      <Text style={[font.small, { color: colors.textDim, textAlign: 'center' }]}>{text}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.stroke,
    padding: 16,
    ...shadow.soft,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.stroke,
  },
  chipSmall: { paddingHorizontal: 10, paddingVertical: 6 },
  chipText: { color: colors.textMid, fontSize: 13, fontWeight: '700' },
  barTrack: { width: '100%', overflow: 'hidden' },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 26,
  },
  sectionTitle: { ...font.h2, color: colors.text },
  empty: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 30 },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.card, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.stroke, padding: 16, marginBottom: 10,
  },
  toggleTitle: { ...font.h3, color: colors.text },
  toggleDesc: { ...font.small, color: colors.textDim, marginTop: 3, lineHeight: 17 },
  track: {
    width: 50, height: 30, borderRadius: 15, backgroundColor: colors.cardAlt,
    borderWidth: 1, borderColor: colors.strokeStrong, padding: 3, justifyContent: 'center',
  },
  knob: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.textDim },
});
