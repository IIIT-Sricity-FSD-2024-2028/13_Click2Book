export default function DataTable({ headers, children }) {
  return (
    <div className="table-wrap">
      <table className="bookings-table">
        <thead>
          <tr>
            {headers.map((header, idx) => (
              <th key={idx}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
