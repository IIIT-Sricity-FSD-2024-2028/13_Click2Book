import { Card, EmptyRow, Table, matches } from '../components/ui';
import { adminActions, downloadCsv } from '../lib/adminData';

export default function Customers({ ctx }) {
  const { data, q, act, busy, open, setQuery, can } = ctx;
  const customers = data.customers.filter((c) => matches(q, c.id, c.name, c.email, c.phone));

  return (
    <Card
      title="Customers"
      count={customers.length}
      id="customersCard"
      actions={
        <button
          className="action-btn btn-ghost"
          onClick={() => downloadCsv('click2book-customers.csv', customers)}
          disabled={!customers.length}
        >
          ⬇ Export CSV
        </button>
      }
    >
      <Table head={['Customer ID', 'Name', 'Email', 'Phone', 'Gender', 'Age', 'Bookings', 'Joined', 'Action']} id="customersTable">
        {customers.length === 0 ? (
          <EmptyRow icon="👤" message={ctx.live ? 'No customers match.' : 'Customer list needs the backend.'} />
        ) : (
          customers.map((c) => (
            <tr key={c.id}>
              <td className="booking-id">{c.id}</td>
              <td>
                <strong>{c.name}</strong>
              </td>
              <td>{c.email}</td>
              <td>{c.phone}</td>
              <td>{c.gender}</td>
              <td>{c.age}</td>
              <td>
                {can('bookings') ? (
                  <button
                    className="link-btn"
                    onClick={() => {
                      open('bookings');
                      setQuery(c.name);
                    }}
                  >
                    {c.bookings} booking{c.bookings !== 1 ? 's' : ''} ›
                  </button>
                ) : (
                  c.bookings
                )}
              </td>
              <td>{c.joined}</td>
              <td>
                <button
                  className="action-btn btn-danger"
                  disabled={busy === c.id}
                  onClick={() =>
                    act(
                      c.id,
                      `Customer ${c.name} removed.`,
                      () => adminActions.removeCustomer(c.id),
                      `Delete customer ${c.name} (${c.email})? This cannot be undone.`,
                    )
                  }
                >
                  Delete
                </button>
              </td>
            </tr>
          ))
        )}
      </Table>
    </Card>
  );
}
