// Design tokens — un seul endroit pour toute l'identité visuelle de Spotrive.

export const colors = {
  bg: '#080A0F',
  bgElevated: '#0F131C',
  card: '#151A25',
  cardAlt: '#1C2230',
  stroke: 'rgba(255,255,255,0.07)',
  strokeStrong: 'rgba(255,255,255,0.14)',

  text: '#F3F6FB',
  textMid: '#A7B0C2',
  textDim: '#6B7488',

  accent: '#C8FF43',
  accentDeep: '#8FE01F',
  accentInk: '#0C1200',

  violet: '#8B7CFF',
  cyan: '#4CD9F0',
  orange: '#FF8A4A',
  pink: '#FF6B9D',
  green: '#4ADE80',
  red: '#FF5F56',
};

export const sportColors = {
  course: '#4CD9F0',
  marche: '#4ADE80',
  torse: '#C8FF43',
  jambes: '#FF8A4A',
  gainage: '#8B7CFF',
  echauffement: '#FF6B9D',
  etirement: '#7DD3FC',
};

export const radius = { sm: 10, md: 16, lg: 22, xl: 28, pill: 999 };

export const space = (n) => n * 4;

export const font = {
  h1: { fontSize: 30, fontWeight: '800', letterSpacing: -0.6 },
  h2: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  h3: { fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },
  body: { fontSize: 15, fontWeight: '500' },
  small: { fontSize: 13, fontWeight: '600' },
  micro: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6 },
  num: { fontSize: 34, fontWeight: '800', letterSpacing: -1 },
};

export const shadow = {
  soft: {
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
};
