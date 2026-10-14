import StatusBadge from './StatusBadge';
import RowActions from './RowActions';

/** How one cell is shown: a badge for statuses, ₹ for amounts, stars for ratings, bold for the ID. */
function CellValue({ col, value, isPk }) {
  if (col.includes('status') || col === 'gender') return <StatusBadge value={value} />;
  if (col.endsWith('_amount') || col === 'amount') {
    return value != null ? '₹' + Number(value).toFixed(2) : '—';
  }
  if (col === 'rating') return value ? '★'.repeat(Number(value)) : '—';
  if (isPk) return <span style={{ fontWeight: 700, color: '#0B2447' }}>{value ?? '—'}</span>;
  return value ?? '—';
}

/** The records table: one column per field, plus edit / delete buttons on each row. */
export default function DataTable({ schema, records, onEdit, onDelete }) {
  return (
    <div className="c2b-table-wrap">
      <table id="c2b-dataTable">
        <thead>
          <tr>
            {schema.columns.map((col) => (
              <th key={col}>{col.replace(/_/g, ' ')}</th>
            ))}
            <th />
          </tr>
        </thead>
        <tbody>
          {records.map((record, i) => {
            const pk = record[schema.pkField];
            return (
              <tr key={`${pk}-${i}`}>
                {schema.columns.map((col) => (
                  <td key={col}>
                    <CellValue col={col} value={record[col]} isPk={col === schema.pkField} />
                  </td>
                ))}
                <td>
                  <RowActions readOnly={schema.readOnly} onEdit={() => onEdit(pk)} onDelete={() => onDelete(pk)} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
