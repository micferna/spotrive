import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, font, sportColors } from '../theme';
import { SPORTS, LEVELS } from '../data/catalog';
import { useStore } from '../store/store';
import { Squeeze, tap, success } from '../components/ui';

export default function OnboardingScreen() {
  const { state, dispatch } = useStore();
  const [step, setStep] = useState(0);
  const { level, sports } = state.profile;

  const next = () => {
    tap();
    if (step === 0) return setStep(1);
    success();
    dispatch({ type: 'profile', payload: { onboarded: true } });
  };

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={[colors.accent + '1A', 'transparent']}
        style={styles.glow}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.logo}>SPOTRIVE</Text>

        {step === 0 ? (
          <>
            <Text style={styles.title}>Quel est ton niveau ?</Text>
            <Text style={styles.sub}>
              Il détermine l’intensité des séances proposées chaque jour. Tu pourras le changer à tout moment.
            </Text>
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
          </>
        ) : (
          <>
            <Text style={styles.title}>Tes sports</Text>
            <Text style={styles.sub}>
              Choisis ce qui t’intéresse, ou ne coche rien pour recevoir un peu de tout.
            </Text>
            <View style={styles.grid}>
              {SPORTS.map((s) => {
                const on = sports.includes(s.id);
                return (
                  <Squeeze key={s.id} onPress={() => { tap(); dispatch({ type: 'toggleSport', id: s.id }); }} scaleTo={0.95}>
                    <View style={[styles.sportCard, on && { borderColor: sportColors[s.id], backgroundColor: sportColors[s.id] + '18' }]}>
                      <Text style={{ fontSize: 24 }}>{s.emoji}</Text>
                      <Text style={[styles.sportName, on && { color: colors.text }]}>{s.name}</Text>
                      <Text style={styles.sportTag}>{s.tagline}</Text>
                    </View>
                  </Squeeze>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Squeeze onPress={next} scaleTo={0.97}>
          <View style={styles.cta}>
            <Text style={styles.ctaText}>{step === 0 ? 'Continuer' : 'Commencer'}</Text>
          </View>
        </Squeeze>
        <View style={styles.dots}>
          {[0, 1].map((i) => (
            <View key={i} style={[styles.dot, step === i && { backgroundColor: colors.accent, width: 20 }]} />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  glow: { position: 'absolute', top: 0, left: 0, right: 0, height: 320 },
  content: { paddingHorizontal: 22, paddingTop: 40, paddingBottom: 40 },
  logo: { ...font.micro, color: colors.accent, letterSpacing: 3, marginBottom: 30 },
  title: { ...font.h1, color: colors.text, fontSize: 32 },
  sub: { ...font.body, color: colors.textDim, marginTop: 10, marginBottom: 28, lineHeight: 21 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.stroke,
    padding: 18,
    marginBottom: 12,
  },
  optionActive: { borderColor: colors.accent + '66', backgroundColor: colors.accent + '10' },
  optionTitle: { ...font.h3, color: colors.text },
  optionDesc: { ...font.small, color: colors.textDim, marginTop: 3 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.strokeStrong },
  radioOn: { borderColor: colors.accent, backgroundColor: colors.accent },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sportCard: {
    width: 108,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.stroke,
    padding: 14,
    gap: 4,
  },
  sportName: { ...font.small, color: colors.textMid, fontWeight: '800' },
  sportTag: { fontSize: 11, color: colors.textDim, fontWeight: '600' },
  footer: { paddingHorizontal: 22, paddingBottom: 30, gap: 16 },
  cta: { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 17, alignItems: 'center' },
  ctaText: { ...font.h3, color: colors.accentInk },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.strokeStrong },
});
