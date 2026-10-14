export const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function money(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

export function displayDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-IN');
}

export function humanize(value) {
  return String(value).replace('_', ' ');
}
