import { UNIT_LABEL } from '../data/catalog';

export function formatValue(v, unit) {
  if (unit === 'km') return (Math.round(v * 10) / 10).toString().replace('.', ',');
  if (unit === 'sec' && v >= 60) {
    const m = Math.floor(v / 60);
    const s = Math.round(v % 60);
    return s ? `${m}′${String(s).padStart(2, '0')}` : `${m}′`;
  }
  return Math.round(v).toLocaleString('fr-FR');
}

export const unitLabel = (unit, v) => {
  if (unit === 'sec' && v >= 60) return '';
  return UNIT_LABEL[unit] || '';
};

export const formatWithUnit = (v, unit) => `${formatValue(v, unit)}${unitLabel(unit, v) ? ' ' + unitLabel(unit, v) : ''}`;
