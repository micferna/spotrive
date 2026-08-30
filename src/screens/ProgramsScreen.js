import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView } from 'react-native';
import { colors, font, radius } from '../theme';
import { PROGRAMS, SPORTS, LEVELS, SPORT_BY_ID } from '../data/catalog';
import { useStore, getDay, sessionRatio } from '../store/store';
import { dayKey } from '../lib/dates';
import { Chip, SectionTitle, Empty, tap } from '../components/ui';
import { ProgramCard } from '../components/ProgramCard';

export default function ProgramsScreen({ onOpenProgram }) {
  const { state } = useStore();
  const [sport, setSport] = useState(null);
  const [level, setLevel] = useState(null);
  const key = dayKey();
  const day = getDay(state, key);

  const data = useMemo(
    () =>
      PROGRAMS.filter((p) => (!sport || p.sport === sport) && (!level || p.level === level)).sort(
        (a, b) => a.level - b.level || a.minutes - b.minutes
      ),
    [sport, level]
  );

  const renderItem = useCallback(
    ({ item }) => {
      const s = day.sessions[item.id];
      return (
        <View style={{ marginBottom: 12 }}>
          <ProgramCard
            wide
            program={item}
            done={s?.done}
            ratio={s ? sessionRatio(item, s) : 0}
            onPress={() => {
              tap();
              onOpenProgram(item.id);
            }}
          />
        </View>
      );
    },
    [day.sessions, onOpenProgram]
  );

  const header = (
    <View>
      <Text style={styles.title}>Programmes</Text>
      <Text style={styles.sub}>{PROGRAMS.length} séances prêtes à l’emploi, sans matériel ou presque.</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip label="Tous" active={!sport} onPress={() => { tap(); setSport(null); }} />
        {SPORTS.map((s) => (
          <Chip
            key={s.id}
            label={`${s.emoji}  ${s.name}`}
            active={sport === s.id}
            onPress={() => { tap(); setSport(sport === s.id ? null : s.id); }}
          />
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip small label="Tous niveaux" active={!level} onPress={() => { tap(); setLevel(null); }} />
        {LEVELS.map((l) => (
          <Chip
            key={l.id}
            small
            label={l.name}
            active={level === l.id}
            onPress={() => { tap(); setLevel(level === l.id ? null : l.id); }}
          />
        ))}
      </ScrollView>

      <SectionTitle>
        {sport ? SPORT_BY_ID[sport].name : 'Toutes les séances'}
        {data.length ? ` · ${data.length}` : ''}
      </SectionTitle>
    </View>
  );

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={data}
      renderItem={renderItem}
      keyExtractor={(i) => i.id}
      ListHeaderComponent={header}
      ListEmptyComponent={
        <Empty emoji="🔎" title="Aucune séance" text="Change de filtre pour retrouver des programmes." />
      }
      showsVerticalScrollIndicator={false}
      initialNumToRender={6}
      windowSize={7}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 18, paddingBottom: 120, paddingTop: 8 },
  title: { ...font.h1, color: colors.text },
  sub: { ...font.small, color: colors.textDim, marginTop: 4, marginBottom: 18, lineHeight: 18 },
  chips: { gap: 8, paddingBottom: 10, paddingRight: 6 },
});
