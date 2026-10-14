import StatCard from './StatCard';

/** Row of stat cards. The counts come from the table's `stats()` in lib/crudSchemas. */
export default function StatsRow({ schema }) {
  const stats = schema?.stats ? schema.stats() : [];

  return (
    <div id="c2b-statsBar">
      {stats.map((stat) => (
        <StatCard key={stat.label} label={stat.label} value={stat.value} color={stat.cls} />
      ))}
    </div>
  );
}
