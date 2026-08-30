import React, { useCallback, useState } from 'react';
import { View, StyleSheet, Animated, ActivityIndicator, BackHandler, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from './src/theme';
import { StoreProvider, useStore } from './src/store/store';
import { TabBar } from './src/components/TabBar';
import TodayScreen from './src/screens/TodayScreen';
import ProgramsScreen from './src/screens/ProgramsScreen';
import StatsScreen from './src/screens/StatsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SessionScreen from './src/screens/SessionScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import ActivityScreen from './src/screens/ActivityScreen';
import * as tracker from './src/lib/tracker';
import * as steps from './src/lib/steps';
import { dayKey } from './src/lib/dates';

function Root() {
  const { state, dispatch } = useStore();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState('today');
  const [programId, setProgramId] = useState(null);
  const [activityOpen, setActivityOpen] = useState(false);

  const openProgram = useCallback((id) => setProgramId(id), []);
  const closeProgram = useCallback(() => setProgramId(null), []);
  const openActivity = useCallback(() => setActivityOpen(true), []);
  const closeActivity = useCallback(() => setActivityOpen(false), []);

  // Au lancement : on récupère une activité interrompue, sinon on démarre le suivi
  // automatiquement si l'utilisateur l'a demandé — sans ouvrir l'écran de force,
  // la carte de l'accueil suffit à montrer que ça tourne.
  // Podomètre : le capteur matériel compte, on cumule dans la journée en cours.
  React.useEffect(() => {
    if (!state.ready) return;
    steps.startCounting((delta) => dispatch({ type: 'addSteps', key: dayKey(), delta }));
    return () => steps.stopCounting();
  }, [state.ready, dispatch]);

  const autoGps = state.profile.autoGps;
  const autoGpsSport = state.profile.autoGpsSport;
  React.useEffect(() => {
    if (!state.ready) return;
    let cancelled = false;
    (async () => {
      const resumed = await tracker.restore();
      if (cancelled || resumed || !autoGps) return;
      if (tracker.getState().active) return;
      // Pas de popup de permission au démarrage : on ne lance que si c'est déjà accordé.
      if (!(await tracker.canStartSilently())) return;
      if (!cancelled) await tracker.start(autoGpsSport || 'course');
    })();
    return () => {
      cancelled = true;
    };
  }, [state.ready, autoGps, autoGpsSport]);

  // Le bouton retour Android ferme la séance avant de quitter l'app.
  React.useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (activityOpen) {
        setActivityOpen(false);
        return true;
      }
      if (programId) {
        closeProgram();
        return true;
      }
      if (tab !== 'today') {
        setTab('today');
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [programId, tab, activityOpen, closeProgram]);

  if (!state.ready) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!state.profile.onboarded) {
    return (
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <OnboardingScreen />
      </SafeAreaView>
    );
  }

  if (activityOpen) {
    return (
      <SafeAreaView style={styles.flex} edges={['top']}>
        <ActivityScreen onBack={closeActivity} />
      </SafeAreaView>
    );
  }

  if (programId) {
    return (
      <SafeAreaView style={styles.flex} edges={['top']}>
        <SessionScreen programId={programId} onBack={closeProgram} />
      </SafeAreaView>
    );
  }

  // Les panneaux sont en position absolue : Yoga ignore le padding du parent pour
  // ces enfants-là, donc l'inset haut se donne directement sur `top`.
  return (
    <View style={styles.flex}>
      {/* Les onglets restent montés : on garde le scroll et l'état de chaque écran. */}
      <Pane visible={tab === 'today'} top={insets.top}>
        <TodayScreen onOpenProgram={openProgram} onOpenTab={setTab} onOpenActivity={openActivity} />
      </Pane>
      <Pane visible={tab === 'programs'} top={insets.top}>
        <ProgramsScreen onOpenProgram={openProgram} />
      </Pane>
      <Pane visible={tab === 'stats'} top={insets.top}>
        <StatsScreen />
      </Pane>
      <Pane visible={tab === 'profile'} top={insets.top}>
        <ProfileScreen />
      </Pane>
      <TabBar active={tab} onChange={setTab} bottomInset={insets.bottom} />
    </View>
  );
}

/** Onglet monté mais retiré du flux quand il est caché : zéro re-render au changement. */
function Pane({ visible, top = 0, children }) {
  const [mounted, setMounted] = useState(visible);
  React.useEffect(() => {
    if (visible) setMounted(true);
  }, [visible]);
  if (!mounted) return null;
  return (
    <View style={[StyleSheet.absoluteFill, { top }]} pointerEvents={visible ? 'auto' : 'none'}>
      <Animated.View style={[styles.flex, { opacity: visible ? 1 : 0 }]} collapsable={false}>
        {children}
      </Animated.View>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <View style={styles.flex}>
        <StoreProvider>
          <Root />
        </StoreProvider>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  loader: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
});
