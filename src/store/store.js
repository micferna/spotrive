import React, { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { emptyDay } from './selectors';

const STORAGE_KEY = 'spotrive:v1';

const initialState = {
  ready: false,
  profile: { level: 2, sports: [], onboarded: false, autoGps: false, autoGpsSport: 'course' },
  // days[YYYY-MM-DD] = { counters: {exId: n}, sessions: {pid: {prog:{}, done, at}} }
  days: {},
};

function withDay(state, key, fn) {
  const day = state.days[key] || emptyDay();
  const next = fn(day);
  return { ...state, days: { ...state.days, [key]: next } };
}

function reducer(state, action) {
  switch (action.type) {
    case 'hydrate':
      return { ...state, ...action.payload, ready: true };

    case 'ready':
      return { ...state, ready: true };

    case 'profile':
      return { ...state, profile: { ...state.profile, ...action.payload } };

    case 'toggleSport': {
      const s = state.profile.sports;
      const sports = s.includes(action.id) ? s.filter((x) => x !== action.id) : [...s, action.id];
      return { ...state, profile: { ...state.profile, sports } };
    }

    case 'bump': {
      const { key, ex, delta } = action;
      return withDay(state, key, (day) => {
        const cur = day.counters[ex] || 0;
        const value = Math.max(0, Math.round((cur + delta) * 100) / 100);
        return { ...day, counters: { ...day.counters, [ex]: value } };
      });
    }

    case 'setCounter':
      return withDay(state, action.key, (day) => ({
        ...day,
        counters: { ...day.counters, [action.ex]: Math.max(0, action.value) },
      }));

    case 'setItem': {
      const { key, pid, itemKey, value } = action;
      return withDay(state, key, (day) => {
        const s = day.sessions[pid] || { prog: {}, done: false, at: null };
        return {
          ...day,
          sessions: { ...day.sessions, [pid]: { ...s, prog: { ...s.prog, [itemKey]: Math.max(0, value) } } },
        };
      });
    }

    case 'addSteps':
      return withDay(state, action.key, (day) => ({
        ...day,
        steps: (day.steps || 0) + action.delta,
      }));

    case 'addActivity':
      return withDay(state, action.key, (day) => ({
        ...day,
        activities: [...(day.activities || []), action.activity],
      }));

    case 'removeActivity':
      return withDay(state, action.key, (day) => ({
        ...day,
        activities: (day.activities || []).filter((a) => a.id !== action.id),
      }));

    case 'finishSession':
      return withDay(state, action.key, (day) => {
        const s = day.sessions[action.pid] || { prog: {}, done: false, at: null };
        return { ...day, sessions: { ...day.sessions, [action.pid]: { ...s, done: true, at: Date.now() } } };
      });

    case 'resetSession':
      return withDay(state, action.key, (day) => {
        const sessions = { ...day.sessions };
        delete sessions[action.pid];
        return { ...day, sessions };
      });

    case 'wipe':
      return { ...initialState, ready: true, profile: { ...initialState.profile, onboarded: true } };

    default:
      return state;
  }
}

const StoreCtx = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const timer = useRef(null);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!alive) return;
        if (!raw) return dispatch({ type: 'ready' });
        try {
          const data = JSON.parse(raw);
          dispatch({ type: 'hydrate', payload: { profile: { ...initialState.profile, ...data.profile }, days: data.days || {} } });
        } catch {
          dispatch({ type: 'ready' });
        }
      })
      .catch(() => alive && dispatch({ type: 'ready' }));
    return () => {
      alive = false;
    };
  }, []);

  // Écriture différée : on ne bloque jamais le thread JS pendant qu'on tape sur +.
  useEffect(() => {
    if (!state.ready) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ profile: state.profile, days: state.days })).catch(() => {});
    }, 400);
    return () => timer.current && clearTimeout(timer.current);
  }, [state.profile, state.days, state.ready]);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export const useStore = () => useContext(StoreCtx);

export * from './selectors';
