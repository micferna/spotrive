import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, font, sportColors, shadow } from '../theme';
import { SPORT_BY_ID, LEVELS } from '../data/catalog';
import { Bar, Squeeze } from './ui';

export const ProgramCard = memo(function ProgramCard({ program, ratio = 0, done, onPress, wide }) {
  const color = sportColors[program.sport] || colors.accent;
  const sport = SPORT_BY_ID[program.sport];
  const level = LEVELS.find((l) => l.id === program.level);

  return (
    <Squeeze onPress={onPress} scaleTo={0.975}>
      <View style={[styles.card, wide && { width: '100%' }, { borderColor: color + '30' }]}>
        <LinearGradient
          colors={[color + '26', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.head}>
          <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color + '55' }]}>
            <Text style={{ fontSize: 20 }}>{sport?.emoji}</Text>
          </View>
          {done ? (
            <View style={[styles.done, { backgroundColor: color }]}>
              <Text style={styles.doneText}>TERMINÉ</Text>
            </View>
          ) : (
            <Text style={[styles.minutes, { color }]}>{program.minutes} min</Text>
          )}
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {program.title}
        </Text>
        <Text style={styles.desc} numberOfLines={2}>
          {program.desc}
        </Text>

        <View style={styles.tags}>
          <Text style={styles.tag}>{sport?.name}</Text>
          <View style={styles.dot} />
          <Text style={styles.tag}>{level?.name}</Text>
        </View>

        {ratio > 0 && !done ? (
          <View style={{ marginTop: 12 }}>
            <Bar ratio={ratio} color={color} height={5} />
            <Text style={[styles.tag, { marginTop: 6, color }]}>{Math.round(ratio * 100)} % effectué</Text>
          </View>
        ) : null}
      </View>
    </Squeeze>
  );
});

const styles = StyleSheet.create({
  card: {
    width: 250,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
    ...shadow.soft,
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  badge: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  minutes: { ...font.small, fontWeight: '800' },
  done: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  doneText: { ...font.micro, color: colors.accentInk },
  title: { ...font.h3, color: colors.text, marginBottom: 5 },
  desc: { ...font.small, color: colors.textDim, lineHeight: 18, fontWeight: '500' },
  tags: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
  tag: { ...font.small, color: colors.textMid, fontWeight: '700' },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.textDim },
});
