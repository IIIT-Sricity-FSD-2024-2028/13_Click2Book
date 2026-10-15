import React from 'react';

export default function DataTable({ headers = [], children, emptyText = 'No records found.' }) {
  const count = React.Children.count(children);
  return (
    <div
      className="table-wrap"
      style={{
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        overflowX: 'auto',
        marginTop: '12px'
      }}
    >
      <table className="bookings-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            {headers.map((header, index) => (
              <th
                key={index}
                style={{
                  padding: '14px 18px',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#64748b'
                }}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {count === 0 ? (
            <tr>
              <td
                colSpan={headers.length || 1}
                style={{
                  textAlign: 'center',
                  padding: '40px 16px',
                  color: '#94a3b8',
                  fontSize: '14px',
                  fontWeight: 500
                }}
              >
                {emptyText}
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}
