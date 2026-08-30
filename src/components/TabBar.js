import React, { memo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { colors, radius, font } from '../theme';
import { Squeeze, tap } from './ui';

export const TABS = [
  { id: 'today', label: 'Aujourd’hui', icon: '◎' },
  { id: 'programs', label: 'Séances', icon: '≡' },
  { id: 'stats', label: 'Progrès', icon: '◧' },
  { id: 'profile', label: 'Profil', icon: '◍' },
];

export const TabBar = memo(function TabBar({ active, onChange, bottomInset = 0 }) {
  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(bottomInset, 10) }]}>
      <View style={styles.bar}>
        {TABS.map((t) => {
          const on = t.id === active;
          return (
            <View key={t.id} style={styles.item}>
              <Squeeze
                scaleTo={0.9}
                onPress={() => {
                  if (!on) tap();
                  onChange(t.id);
                }}
              >
                <View style={styles.itemInner}>
                  <Text style={[styles.icon, on && { color: colors.accent }]}>{t.icon}</Text>
                  <Text style={[styles.label, on && { color: colors.accent }]} numberOfLines={1}>
                    {t.label}
                  </Text>
                </View>
              </Squeeze>
            </View>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    backgroundColor: Platform.OS === 'android' ? colors.bg : 'transparent',
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.stroke,
    paddingVertical: 10,
  },
  item: { flex: 1 },
  itemInner: { alignItems: 'center', gap: 3, paddingHorizontal: 2 },
  icon: { fontSize: 18, color: colors.textDim },
  label: { ...font.micro, color: colors.textDim, fontSize: 10, letterSpacing: 0.2 },
});
