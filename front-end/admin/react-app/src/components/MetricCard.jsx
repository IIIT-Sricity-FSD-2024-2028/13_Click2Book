export default function MetricCard({ label, value, delta, accent }) {
  return (
    <div className="stat-card" style={accent ? { borderTop: `3px solid ${accent}` } : undefined}>
      <div className="stat-body">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {delta && <div className="stat-delta">{delta}</div>}
      </div>
    </div>
  );
}
