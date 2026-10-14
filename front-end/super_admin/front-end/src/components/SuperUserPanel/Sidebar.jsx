import { useNavigate } from 'react-router-dom';

/**
 * Left menu: the portal name at the top, then one link per table. The active table is highlighted.
 * `links` ([{ label, to }]) adds entries above the tables that open other pages.
 */
export default function Sidebar({ title, subtitle, schemas, currentTable, onSelect, links = [] }) {
  const navigate = useNavigate();
  return (
    <div id="c2b-sidebar">
      <div className="c2b-brand">
        <h3>📈 {title}</h3>
        <p>{subtitle}</p>
      </div>
      <nav className="c2b-nav">
        {links.map((l) => (
          <div key={l.to} className="c2b-nav-item c2b-nav-link" onClick={() => navigate(l.to)}>
            {l.label}
          </div>
        ))}
        {Object.entries(schemas).map(([key, s]) => (
          <div key={key} className={'c2b-nav-item' + (key === currentTable ? ' active' : '')} onClick={() => onSelect(key)}>
            {s.label}
          </div>
        ))}
      </nav>
    </div>
  );
}
