import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { colors, radius, font, sportColors } from '../theme';
import { useStore, computeStreak } from '../store/store';
import { SPORTS, LEVELS, PROGRAMS } from '../data/catalog';
import { Card, SectionTitle, Squeeze, Toggle, Chip, tap } from '../components/ui';

export default function ProfileScreen() {
  const { state, dispatch } = useStore();
  const { level, sports, autoGps, autoGpsSport } = state.profile;

  const streak = useMemo(() => computeStreak(state.days), [state.days]);
  const trackedDays = Object.keys(state.days).length;

  const wipe = useCallback(() => {
    Alert.alert('Effacer toutes les données ?', 'Historique, compteurs et séances seront perdus. Irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Tout effacer', style: 'destructive', onPress: () => { tap('heavy'); dispatch({ type: 'wipe' }); } },
    ]);
  }, [dispatch]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Profil</Text>
      <Text style={styles.sub}>Ces réglages pilotent les recommandations quotidiennes.</Text>

      <Card style={styles.summary}>
        <View style={styles.sumCell}>
          <Text style={styles.sumValue}>{streak}</Text>
          <Text style={styles.sumLabel}>jours de suite</Text>
        </View>
        <View style={styles.sep} />
        <View style={styles.sumCell}>
          <Text style={styles.sumValue}>{trackedDays}</Text>
          <Text style={styles.sumLabel}>jours enregistrés</Text>
        </View>
        <View style={styles.sep} />
        <View style={styles.sumCell}>
          <Text style={styles.sumValue}>{PROGRAMS.length}</Text>
          <Text style={styles.sumLabel}>programmes</Text>
        </View>
      </Card>

      <SectionTitle>Niveau</SectionTitle>
      {LEVELS.map((l) => (
        <Squeeze key={l.id} onPress={() => { tap(); dispatch({ type: 'profile', payload: { level: l.id } }); }} scaleTo={0.98}>
          <View style={[styles.option, level === l.id && styles.optionActive]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.optionTitle, level === l.id && { color: colors.accent }]}>{l.name}</Text>
              <Text style={styles.optionDesc}>{l.desc}</Text>
            </View>
            <View style={[styles.radio, level === l.id && styles.radioOn]} />
          </View>
        </Squeeze>
      ))}

      <SectionTitle>Suivi GPS</SectionTitle>
      <Toggle
        value={!!autoGps}
        onChange={(v) => dispatch({ type: 'profile', payload: { autoGps: v } })}
        title="Démarrer à l’ouverture"
        desc="À chaque lancement de Spotrive, le suivi démarre tout seul. Une sortie de moins de 20 m n’est pas enregistrée."
        color={colors.cyan}
      />
      {autoGps ? (
        <View style={styles.gpsSportRow}>
          {[
            { id: 'course', label: '🏃  Course à pied' },
            { id: 'marche', label: '🚶  Marche' },
          ].map((s) => (
            <Chip
              key={s.id}
              label={s.label}
              color={sportColors[s.id]}
              active={(autoGpsSport || 'course') === s.id}
              onPress={() => { tap(); dispatch({ type: 'profile', payload: { autoGpsSport: s.id } }); }}
            />
          ))}
        </View>
      ) : null}
      <Text style={styles.hint}>
        Le suivi continue téléphone verrouillé, via une notification. Il faut pour cela autoriser la position
        sur « Toujours » quand Android le demande.
      </Text>

      <SectionTitle>Sports suivis</SectionTitle>
      <Text style={styles.hint}>
        {sports.length ? 'Seuls ces sports alimentent les recommandations.' : 'Aucun filtre : tous les sports sont proposés.'}
      </Text>
      <View style={styles.grid}>
        {SPORTS.map((s) => {
          const on = sports.includes(s.id);
          return (
            <Squeeze key={s.id} onPress={() => { tap(); dispatch({ type: 'toggleSport', id: s.id }); }} scaleTo={0.95}>
              <View
                style={[
                  styles.sportCard,
                  on && { borderColor: sportColors[s.id], backgroundColor: sportColors[s.id] + '18' },
                ]}
              >
                <Text style={{ fontSize: 22 }}>{s.emoji}</Text>
                <Text style={[styles.sportName, on && { color: colors.text }]} numberOfLines={1}>
                  {s.name}
                </Text>
                <Text style={styles.sportTag} numberOfLines={1}>
                  {s.tagline}
                </Text>
              </View>
            </Squeeze>
          );
        })}
      </View>

      <SectionTitle>Données</SectionTitle>
      <Card>
        <Text style={styles.dataText}>
          Tout est stocké sur ton téléphone, hors ligne. Aucun compte, aucun envoi sur Internet.
        </Text>
        <Squeeze onPress={wipe} scaleTo={0.97}>
          <View style={styles.danger}>
            <Text style={styles.dangerText}>Effacer toutes les données</Text>
          </View>
        </Squeeze>
      </Card>

      <Text style={styles.version}>Spotrive · v1.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 18, paddingBottom: 120, paddingTop: 8 },
  title: { ...font.h1, color: colors.text },
  sub: { ...font.small, color: colors.textDim, marginTop: 4, marginBottom: 18, lineHeight: 18 },
  summary: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18 },
  sumCell: { flex: 1, alignItems: 'center' },
  sumValue: { fontSize: 24, fontWeight: '800', color: colors.text },
  sumLabel: { ...font.small, color: colors.textDim, marginTop: 2, textAlign: 'center' },
  sep: { width: 1, height: 34, backgroundColor: colors.stroke },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.stroke,
    padding: 16,
    marginBottom: 10,
  },
  optionActive: { borderColor: colors.accent + '66', backgroundColor: colors.accent + '10' },
  optionTitle: { ...font.h3, color: colors.text },
  optionDesc: { ...font.small, color: colors.textDim, marginTop: 2 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.strokeStrong },
  radioOn: { borderColor: colors.accent, backgroundColor: colors.accent },
  hint: { ...font.small, color: colors.textDim, marginTop: 4, marginBottom: 14, lineHeight: 18 },
  gpsSportRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sportCard: {
    width: 108,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.stroke,
    padding: 12,
    gap: 4,
  },
  sportName: { ...font.small, color: colors.textMid, fontWeight: '800' },
  sportTag: { fontSize: 11, color: colors.textDim, fontWeight: '600' },
  dataText: { ...font.small, color: colors.textMid, lineHeight: 19, marginBottom: 14 },
  danger: {
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.red + '55',
    backgroundColor: colors.red + '14',
    paddingVertical: 13,
    alignItems: 'center',
  },
  dangerText: { ...font.small, color: colors.red, fontWeight: '800' },
  version: { ...font.small, color: colors.textDim, textAlign: 'center', marginTop: 28 },
});
