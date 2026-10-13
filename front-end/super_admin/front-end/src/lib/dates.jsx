/** "YYYY-MM-DD" in the browser's local time zone (toISOString() would use UTC and be a day behind after midnight IST). */
export function localISODate(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
