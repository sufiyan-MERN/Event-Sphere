export const money = (amount) => `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.max(0, Number(amount) || 0))}`;

export const formatLongDate = (value) => new Intl.DateTimeFormat('en-IN', {
  day: 'numeric', month: 'long', year: 'numeric',
}).format(new Date(`${value}T12:00:00`));

export const formatShortDate = (value) => new Intl.DateTimeFormat('en-IN', {
  weekday: 'short', day: '2-digit', month: 'short',
}).format(new Date(`${value}T12:00:00`)).toUpperCase();

export function calculatePrice(seats, couponCode = '') {
  const ticketPrice = seats.reduce((sum, seat) => sum + seat.price, 0);
  const convenienceFee = seats.length ? 30 : 0;
  const taxes = Math.round((ticketPrice + convenienceFee) * 0.05);
  const normalized = couponCode.trim().toUpperCase();
  const discount = normalized === 'STUDENT50'
    ? Math.round(ticketPrice * 0.5)
    : normalized === 'FIRSTBOOKING'
      ? Math.round(ticketPrice * 0.1)
      : 0;
  return {
    ticketPrice,
    convenienceFee,
    taxes,
    discount,
    total: Math.max(0, ticketPrice + convenienceFee + taxes - discount),
  };
}
