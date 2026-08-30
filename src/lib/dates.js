export const dayKey = (d = new Date()) => {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export const addDays = (d, n) => {
  const c = new Date(d.getTime());
  c.setDate(c.getDate() + n);
  return c;
};

const DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const DAYS_SHORT = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

export const dayName = (d) => DAYS[d.getDay()];
export const dayInitial = (d) => DAYS_SHORT[d.getDay()];
export const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
export const longDate = (d) => capitalize(`${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`);

export const greeting = (d = new Date()) => {
  const h = d.getHours();
  if (h < 6) return 'Bonne nuit';
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
};

/** Les 7 derniers jours, du plus ancien au plus récent. */
export const lastNDays = (n, from = new Date()) =>
  Array.from({ length: n }, (_, i) => addDays(from, i - n + 1));
