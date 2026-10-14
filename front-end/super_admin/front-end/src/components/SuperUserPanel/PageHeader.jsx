/** Title and subtitle of the selected table, e.g. "Bookings" / "Manage BOOKING records". */
export default function PageHeader({ title, subtitle }) {
  return (
    <div className="c2b-topbar-left">
      <h2 id="c2b-tableTitle">{title}</h2>
      <p id="c2b-tableSubtitle">{subtitle}</p>
    </div>
  );
}
