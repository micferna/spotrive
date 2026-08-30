// Catalogue statique : sports, exercices, programmes, recommandations.
// Tout est figé à la compilation -> aucun coût runtime, pas de fetch.

export const SPORTS = [
  { id: 'echauffement', name: 'Échauffement', emoji: '🔥', tagline: 'Préparer le corps' },
  { id: 'course', name: 'Course à pied', emoji: '🏃', tagline: 'Endurance & cardio' },
  { id: 'marche', name: 'Marche', emoji: '🚶', tagline: 'Récupération active' },
  { id: 'torse', name: 'Torse', emoji: '💪', tagline: 'Pectoraux, dos, bras' },
  { id: 'gainage', name: 'Gainage', emoji: '🧱', tagline: 'Abdos & ceinture' },
  { id: 'jambes', name: 'Jambes', emoji: '🦵', tagline: 'Cuisses & fessiers' },
  { id: 'etirement', name: 'Étirements', emoji: '🧘', tagline: 'Souplesse & retour au calme' },
];

export const SPORT_BY_ID = Object.fromEntries(SPORTS.map((s) => [s.id, s]));

// unit: reps | sec | m | km | min
export const EXERCISES = {
  // — Échauffement —
  rotation_bras: { name: 'Rotations des bras', sport: 'echauffement', unit: 'sec', tip: 'Cercles lents puis larges, épaules relâchées.' },
  montees_genoux: { name: 'Montées de genoux', sport: 'echauffement', unit: 'sec', tip: 'Buste droit, appuis dynamiques sur l’avant du pied.' },
  talons_fesses: { name: 'Talons-fesses', sport: 'echauffement', unit: 'sec', tip: 'Fréquence plutôt qu’amplitude.' },
  jumping_jack: { name: 'Jumping jacks', sport: 'echauffement', unit: 'reps', tip: 'Réception amortie, genoux souples.' },
  cercles_hanches: { name: 'Cercles de hanches', sport: 'echauffement', unit: 'sec', tip: '30 s dans chaque sens.' },
  fentes_marchees: { name: 'Fentes marchées', sport: 'echauffement', unit: 'reps', tip: 'Genou avant aligné avec la pointe de pied.' },
  pas_chasses: { name: 'Pas chassés', sport: 'echauffement', unit: 'sec', tip: 'Bassin bas, alterner les côtés.' },
  mobilite_cheville: { name: 'Mobilité chevilles', sport: 'echauffement', unit: 'sec', tip: 'Genou vers l’avant, talon collé au sol.' },

  // — Course —
  footing: { name: 'Footing endurance', sport: 'course', unit: 'min', tip: 'Allure conversationnelle : tu dois pouvoir parler.' },
  fractionne_30_30: { name: 'Fractionné 30"/30"', sport: 'course', unit: 'reps', tip: '30 s vite / 30 s trottinés. 1 rep = 1 cycle.' },
  cote: { name: 'Côtes courtes', sport: 'course', unit: 'reps', tip: '15-20 s en montée, descente en marchant.' },
  sortie_longue: { name: 'Sortie longue', sport: 'course', unit: 'km', tip: 'Rythme régulier, +10 % de distance par semaine max.' },
  allure_seuil: { name: 'Allure seuil', sport: 'course', unit: 'min', tip: 'Difficile mais tenable, respiration contrôlée.' },
  lignes_droites: { name: 'Lignes droites', sport: 'course', unit: 'reps', tip: '80 m en accélération progressive, retour au calme.' },

  // — Marche —
  marche_active: { name: 'Marche active', sport: 'marche', unit: 'min', tip: 'Pas rapides, bras qui balancent.' },
  marche_denivele: { name: 'Marche en côte', sport: 'marche', unit: 'min', tip: 'Petits pas, buste légèrement penché.' },
  pas_journee: { name: 'Pas de la journée', sport: 'marche', unit: 'reps', tip: 'Objectif quotidien, +1000 par palier.' },

  // — Torse —
  pompes: { name: 'Pompes', sport: 'torse', unit: 'reps', tip: 'Corps gainé, coudes à 45°, descente contrôlée.' },
  pompes_inclinees: { name: 'Pompes inclinées', sport: 'torse', unit: 'reps', tip: 'Mains sur une table : parfait pour progresser.' },
  pompes_diamant: { name: 'Pompes diamant', sport: 'torse', unit: 'reps', tip: 'Mains jointes sous la poitrine, cible les triceps.' },
  dips_chaise: { name: 'Dips sur chaise', sport: 'torse', unit: 'reps', tip: 'Coudes vers l’arrière, épaules basses.' },
  tractions: { name: 'Tractions', sport: 'torse', unit: 'reps', tip: 'Menton au-dessus de la barre, descente complète.' },
  rowing_serviette: { name: 'Rowing élastique / serviette', sport: 'torse', unit: 'reps', tip: 'Serre les omoplates 1 s en fin de mouvement.' },
  pike_pushup: { name: 'Pompes piquées', sport: 'torse', unit: 'reps', tip: 'Bassin haut : travaille les épaules.' },
  superman: { name: 'Superman', sport: 'torse', unit: 'sec', tip: 'Bas du dos : lève bras et jambes sans forcer la nuque.' },

  // — Gainage —
  planche: { name: 'Planche', sport: 'gainage', unit: 'sec', tip: 'Fessiers serrés, bassin en rétroversion.' },
  planche_laterale: { name: 'Planche latérale', sport: 'gainage', unit: 'sec', tip: 'Autant de temps de chaque côté.' },
  crunch: { name: 'Crunch', sport: 'gainage', unit: 'reps', tip: 'Le menton reste loin du buste.' },
  releve_jambes: { name: 'Relevés de jambes', sport: 'gainage', unit: 'reps', tip: 'Lombaires plaquées au sol.' },
  mountain_climber: { name: 'Mountain climbers', sport: 'gainage', unit: 'sec', tip: 'Bassin stable, rythme régulier.' },
  hollow_hold: { name: 'Hollow hold', sport: 'gainage', unit: 'sec', tip: 'Bas du dos collé au sol, sinon plie les genoux.' },
  russian_twist: { name: 'Russian twist', sport: 'gainage', unit: 'reps', tip: '1 rep = 1 aller-retour.' },

  // — Jambes —
  squats: { name: 'Squats', sport: 'jambes', unit: 'reps', tip: 'Talons au sol, genoux dans l’axe des pieds.' },
  fentes: { name: 'Fentes', sport: 'jambes', unit: 'reps', tip: 'Compte 1 rep par jambe.' },
  chaise_mur: { name: 'Chaise contre le mur', sport: 'jambes', unit: 'sec', tip: 'Cuisses parallèles au sol.' },
  mollets: { name: 'Extensions mollets', sport: 'jambes', unit: 'reps', tip: 'Amplitude complète, pause en haut.' },
  pont_fessier: { name: 'Pont fessier', sport: 'jambes', unit: 'reps', tip: 'Pousse dans les talons, serre en haut.' },
  squat_saute: { name: 'Squats sautés', sport: 'jambes', unit: 'reps', tip: 'Réception souple, sur l’avant du pied.' },

  // — Étirements —
  etirement_ischios: { name: 'Étirement ischios', sport: 'etirement', unit: 'sec', tip: 'Dos droit, on plie à la hanche.' },
  etirement_quadri: { name: 'Étirement quadriceps', sport: 'etirement', unit: 'sec', tip: 'Bassin en avant, genoux serrés.' },
  etirement_mollets: { name: 'Étirement mollets', sport: 'etirement', unit: 'sec', tip: 'Jambe arrière tendue, talon au sol.' },
  etirement_pecs: { name: 'Ouverture pectoraux', sport: 'etirement', unit: 'sec', tip: 'Bras contre un mur, rotation du buste.' },
  chat_vache: { name: 'Chat-vache', sport: 'etirement', unit: 'sec', tip: 'Synchronise avec la respiration.' },
  respiration: { name: 'Respiration 4-7-8', sport: 'etirement', unit: 'sec', tip: 'Inspire 4 s, bloque 7 s, souffle 8 s.' },
};

export const UNIT_LABEL = { reps: 'reps', sec: 's', min: 'min', m: 'm', km: 'km' };
// Pas d'incrément à 1 partout : on ajuste au geste réel.
export const UNIT_STEP = { reps: 1, sec: 5, min: 1, m: 50, km: 0.5 };

const b = (title, items) => ({ title, items });
const it = (ex, target, sets = 1) => ({ ex, target, sets });

export const PROGRAMS = [
  {
    id: 'ech_express',
    title: 'Échauffement express',
    sport: 'echauffement',
    level: 1,
    minutes: 6,
    desc: 'Le minimum vital avant toute séance. Articulations et cardio en douceur.',
    blocks: [
      b('Mobilité', [it('rotation_bras', 30), it('cercles_hanches', 40), it('mobilite_cheville', 30)]),
      b('Activation', [it('montees_genoux', 30), it('talons_fesses', 30), it('jumping_jack', 20)]),
    ],
  },
  {
    id: 'ech_complet',
    title: 'Échauffement complet',
    sport: 'echauffement',
    level: 2,
    minutes: 12,
    desc: 'Avant une séance intense ou une sortie longue.',
    blocks: [
      b('Mobilité articulaire', [it('rotation_bras', 40), it('cercles_hanches', 40), it('mobilite_cheville', 40)]),
      b('Montée en température', [it('jumping_jack', 30), it('montees_genoux', 40), it('talons_fesses', 40), it('pas_chasses', 40)]),
      b('Amplitude', [it('fentes_marchees', 10), it('lignes_droites', 3)]),
    ],
  },
  {
    id: 'course_debut',
    title: 'Premiers kilomètres',
    sport: 'course',
    level: 1,
    minutes: 30,
    desc: 'Alternance course / marche pour construire le fond sans se blesser.',
    blocks: [
      b('Échauffement', [it('marche_active', 5), it('montees_genoux', 30)]),
      b('Corps de séance', [it('footing', 2, 6), it('marche_active', 1, 6)]),
      b('Retour au calme', [it('marche_active', 5), it('etirement_mollets', 40), it('etirement_ischios', 40)]),
    ],
  },
  {
    id: 'course_fractionne',
    title: 'Fractionné 30"/30"',
    sport: 'course',
    level: 3,
    minutes: 40,
    desc: 'La séance qui fait progresser la VMA. Une fois par semaine, pas plus.',
    blocks: [
      b('Échauffement', [it('footing', 15), it('lignes_droites', 4)]),
      b('Série 1', [it('fractionne_30_30', 10)]),
      b('Récupération', [it('footing', 3)]),
      b('Série 2', [it('fractionne_30_30', 10)]),
      b('Retour au calme', [it('footing', 8), it('etirement_quadri', 40), it('etirement_ischios', 40)]),
    ],
  },
  {
    id: 'course_seuil',
    title: 'Séance seuil',
    sport: 'course',
    level: 3,
    minutes: 45,
    desc: 'Repousse le seuil : allure exigeante mais maîtrisée.',
    blocks: [
      b('Échauffement', [it('footing', 15), it('lignes_droites', 3)]),
      b('Bloc seuil', [it('allure_seuil', 10, 2)]),
      b('Retour au calme', [it('footing', 10), it('etirement_mollets', 45)]),
    ],
  },
  {
    id: 'course_longue',
    title: 'Sortie longue',
    sport: 'course',
    level: 2,
    minutes: 60,
    desc: 'Le socle de l’endurance. Allure basse, durée haute.',
    blocks: [
      b('Sortie', [it('sortie_longue', 8)]),
      b('Après', [it('marche_active', 5), it('etirement_ischios', 45), it('etirement_quadri', 45)]),
    ],
  },
  {
    id: 'course_cotes',
    title: 'Côtes courtes',
    sport: 'course',
    level: 3,
    minutes: 35,
    desc: 'Puissance et foulée. Idéal pour gagner en force sans traumatisme.',
    blocks: [
      b('Échauffement', [it('footing', 12), it('montees_genoux', 30)]),
      b('Séance', [it('cote', 8)]),
      b('Retour au calme', [it('footing', 8), it('etirement_mollets', 45)]),
    ],
  },
  {
    id: 'marche_quotidienne',
    title: 'Marche quotidienne',
    sport: 'marche',
    level: 1,
    minutes: 30,
    desc: 'Le geste le plus rentable de la journée. Simple, efficace.',
    blocks: [
      b('Objectif', [it('marche_active', 30), it('pas_journee', 8000)]),
      b('Souplesse', [it('etirement_mollets', 40), it('chat_vache', 40)]),
    ],
  },
  {
    id: 'marche_denivele',
    title: 'Marche en côte',
    sport: 'marche',
    level: 2,
    minutes: 45,
    desc: 'Cardio soutenu, zéro impact pour les articulations.',
    blocks: [
      b('Séance', [it('marche_active', 10), it('marche_denivele', 25), it('marche_active', 10)]),
      b('Étirements', [it('etirement_mollets', 45), it('etirement_quadri', 45)]),
    ],
  },
  {
    id: 'torse_debut',
    title: 'Torse — Fondations',
    sport: 'torse',
    level: 1,
    minutes: 20,
    desc: 'Sans matériel. Construit la base pompes / dos / bras.',
    blocks: [
      b('Poussée', [it('pompes_inclinees', 10, 3)]),
      b('Tirage', [it('rowing_serviette', 12, 3)]),
      b('Bras', [it('dips_chaise', 8, 3)]),
      b('Dos', [it('superman', 30, 2)]),
    ],
  },
  {
    id: 'torse_pushpull',
    title: 'Torse — Push / Pull',
    sport: 'torse',
    level: 2,
    minutes: 30,
    desc: 'Équilibre poussée / tirage : le classique qui construit la carrure.',
    blocks: [
      b('Poussée', [it('pompes', 12, 4), it('pike_pushup', 8, 3)]),
      b('Tirage', [it('tractions', 6, 4), it('rowing_serviette', 12, 3)]),
      b('Finition', [it('pompes_diamant', 10, 2), it('dips_chaise', 12, 2)]),
    ],
  },
  {
    id: 'torse_intense',
    title: 'Torse — Densité',
    sport: 'torse',
    level: 3,
    minutes: 35,
    desc: 'Volume élevé, repos courts. Pour ceux qui enchaînent déjà 20 pompes.',
    blocks: [
      b('Bloc A', [it('pompes', 20, 5)]),
      b('Bloc B', [it('tractions', 8, 5)]),
      b('Bloc C', [it('pompes_diamant', 15, 3), it('dips_chaise', 15, 3)]),
      b('Gainage', [it('planche', 60, 3)]),
    ],
  },
  {
    id: 'gainage_express',
    title: 'Gainage 8 minutes',
    sport: 'gainage',
    level: 1,
    minutes: 8,
    desc: 'Court, quotidien, redoutable. À faire n’importe où.',
    blocks: [
      b('Circuit', [it('planche', 40, 3), it('planche_laterale', 30, 2), it('crunch', 15, 3)]),
    ],
  },
  {
    id: 'gainage_abdos',
    title: 'Abdos complet',
    sport: 'gainage',
    level: 2,
    minutes: 18,
    desc: 'Les quatre faisceaux : grand droit, obliques, transverse, lombaires.',
    blocks: [
      b('Antérieur', [it('crunch', 20, 3), it('releve_jambes', 12, 3)]),
      b('Obliques', [it('russian_twist', 20, 3), it('planche_laterale', 40, 2)]),
      b('Profond', [it('hollow_hold', 30, 3), it('planche', 60, 2)]),
      b('Cardio', [it('mountain_climber', 40, 2)]),
    ],
  },
  {
    id: 'jambes_base',
    title: 'Jambes — Sans matériel',
    sport: 'jambes',
    level: 2,
    minutes: 25,
    desc: 'Cuisses, fessiers, mollets. Le poids du corps suffit largement.',
    blocks: [
      b('Force', [it('squats', 20, 4), it('fentes', 12, 3)]),
      b('Fessiers', [it('pont_fessier', 20, 3)]),
      b('Endurance', [it('chaise_mur', 45, 3), it('mollets', 25, 3)]),
    ],
  },
  {
    id: 'jambes_explosif',
    title: 'Jambes — Explosivité',
    sport: 'jambes',
    level: 3,
    minutes: 25,
    desc: 'Pliométrie : puissance et foulée plus vive. Sol souple de préférence.',
    blocks: [
      b('Activation', [it('squats', 15, 2), it('montees_genoux', 30)]),
      b('Pliométrie', [it('squat_saute', 12, 4), it('fentes', 10, 3)]),
      b('Renfort', [it('mollets', 30, 3), it('pont_fessier', 20, 2)]),
    ],
  },
  {
    id: 'etirement_soir',
    title: 'Étirements du soir',
    sport: 'etirement',
    level: 1,
    minutes: 10,
    desc: 'Retour au calme, sommeil de meilleure qualité.',
    blocks: [
      b('Bas du corps', [it('etirement_ischios', 45), it('etirement_quadri', 45), it('etirement_mollets', 45)]),
      b('Haut du corps', [it('etirement_pecs', 40), it('chat_vache', 45)]),
      b('Respiration', [it('respiration', 120)]),
    ],
  },
  {
    id: 'etirement_post',
    title: 'Récupération post-séance',
    sport: 'etirement',
    level: 1,
    minutes: 8,
    desc: 'À enchaîner directement après l’effort, muscles encore chauds.',
    blocks: [
      b('Circuit', [it('etirement_mollets', 40), it('etirement_ischios', 40), it('etirement_quadri', 40), it('etirement_pecs', 40)]),
    ],
  },
];

export const PROGRAM_BY_ID = Object.fromEntries(PROGRAMS.map((p) => [p.id, p]));

export const LEVELS = [
  { id: 1, name: 'Débutant', desc: 'Je (re)commence en douceur' },
  { id: 2, name: 'Intermédiaire', desc: 'Je m’entraîne régulièrement' },
  { id: 3, name: 'Confirmé', desc: 'Je cherche la performance' },
];

// Rotation hebdomadaire : chaque jour a une dominante, on évite d'enchaîner
// deux fois le même groupe musculaire.
const WEEK_FOCUS = [
  ['etirement', 'marche'],       // dimanche — récup
  ['torse', 'gainage'],          // lundi
  ['course', 'etirement'],       // mardi
  ['jambes', 'gainage'],         // mercredi
  ['course', 'etirement'],       // jeudi
  ['torse', 'gainage'],          // vendredi
  ['course', 'marche'],          // samedi
];

/**
 * Recommandations du jour : échauffement + 1 à 2 séances selon la rotation,
 * filtrées par niveau et par sports suivis.
 */
export function recommendationsFor(date, level = 2, sports = null) {
  const focus = WEEK_FOCUS[date.getDay()];
  const active = sports && sports.length ? new Set(sports) : null;
  const picked = [];

  const pick = (sport) => {
    if (active && !active.has(sport)) return null;
    const pool = PROGRAMS.filter((p) => p.sport === sport);
    if (!pool.length) return null;
    // Le plus proche du niveau, puis stable d'un jour à l'autre pour la même date.
    const sorted = pool.slice().sort((a, c) => Math.abs(a.level - level) - Math.abs(c.level - level));
    const near = sorted.filter((p) => Math.abs(p.level - level) === Math.abs(sorted[0].level - level));
    return near[date.getDate() % near.length];
  };

  const warm = pick('echauffement') || PROGRAM_BY_ID[level >= 3 ? 'ech_complet' : 'ech_express'];
  picked.push(warm);
  for (const s of focus) {
    const p = pick(s);
    if (p && !picked.includes(p)) picked.push(p);
  }
  if (picked.length < 3) {
    const filler = PROGRAMS.find((p) => !picked.includes(p) && p.level <= level && (!active || active.has(p.sport)));
    if (filler) picked.push(filler);
  }
  return picked;
}

// Compteurs rapides de l'écran d'accueil — le geste « je coche / j'incrémente ».
export const QUICK_TRACKS = [
  { id: 'pompes', ex: 'pompes', target: 50 },
  { id: 'squats', ex: 'squats', target: 60 },
  { id: 'planche', ex: 'planche', target: 180 },
  { id: 'sortie_longue', ex: 'sortie_longue', target: 5 },
  { id: 'marche_active', ex: 'marche_active', target: 30 },
  { id: 'tractions', ex: 'tractions', target: 20 },
];
