/** One stat card: a label, a number and a colour (accent, success, warning, danger, info). */
export default function StatCard({ label, value, color }) {
  return (
    <div className="c2b-stat-card">
      <span className="c2b-stat-label">{label}</span>
      <span className={`c2b-stat-value ${color || ''}`}>{value}</span>
    </div>
  );
}
