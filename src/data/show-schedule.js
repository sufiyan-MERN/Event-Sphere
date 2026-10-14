export function isCalendarDate(dateStr) {
  if (typeof dateStr !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
}

export function availableShowDates(item) {
  if (!item) return [];
  const baseDate = item.date || '2026-10-10';
  if (item.kind === 'movie') {
    const [y, m, d] = baseDate.split('-').map(Number);
    const dates = [];
    for (let i = 0; i < 3; i++) {
      const dt = new Date(Date.UTC(y, m - 1, d + i));
      const yr = dt.getUTCFullYear();
      const mo = String(dt.getUTCMonth() + 1).padStart(2, '0');
      const da = String(dt.getUTCDate()).padStart(2, '0');
      dates.push(`${yr}-${mo}-${da}`);
    }
    return dates;
  }
  return [baseDate];
}

export const movieShowTimes = ['10:00 AM', '1:30 PM', '4:30 PM', '7:30 PM'];

export function availableShowTimes(item, date) {
  if (!item) return [];
  if (item.kind === 'movie') {
    return movieShowTimes;
  }
  return [item.time || '7:30 PM'];
}
