/** Left menu: the portal name at the top, then one link per table. The active table is highlighted. */
export default function Sidebar({ title, subtitle, schemas, currentTable, onSelect }) {
  return (
    <div id="c2b-sidebar">
      <div className="c2b-brand">
        <h3>📈 {title}</h3>
        <p>{subtitle}</p>
      </div>
      <nav className="c2b-nav">
        {Object.entries(schemas).map(([key, s]) => (
          <div key={key} className={'c2b-nav-item' + (key === currentTable ? ' active' : '')} onClick={() => onSelect(key)}>
            {s.label}
          </div>
        ))}
      </nav>
    </div>
  );
}
