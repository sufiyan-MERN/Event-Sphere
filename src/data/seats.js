export const seatRows = [
  { label: 'A', tier: 'Silver', price: 150 },
  { label: 'B', tier: 'Silver', price: 150 },
  { label: 'C', tier: 'Gold', price: 250 },
  { label: 'D', tier: 'Gold', price: 250 },
  { label: 'E', tier: 'Premium', price: 400 },
  { label: 'F', tier: 'Premium', price: 400 },
];

export const unavailableSeats = {
  A: { 3: 'booked', 7: 'locked' },
  B: { 2: 'locked', 8: 'booked' },
  C: { 5: 'booked' },
  D: { 1: 'booked', 7: 'locked' },
  E: { 4: 'locked' },
  F: { 6: 'booked' },
};

export function seatById(id) {
  if (!id || typeof id !== 'string') return null;
  const normalized = id.trim().toUpperCase();
  const rowLabel = normalized.charAt(0);
  const number = Number(normalized.slice(1));
  if (Number.isNaN(number) || number < 1 || number > 8) return null;
  const row = seatRows.find((r) => r.label === rowLabel);
  if (!row) return null;
  return {
    id: `${rowLabel}${number}`,
    row: rowLabel,
    number,
    tier: row.tier,
    price: row.price,
  };
}
