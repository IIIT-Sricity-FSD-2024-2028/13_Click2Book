/** The "5 records" badge: how many rows the table is showing. */
export default function RecordCount({ count }) {
  return (
    <span id="c2b-recordCount">
      {count} record{count !== 1 ? 's' : ''}
    </span>
  );
}
