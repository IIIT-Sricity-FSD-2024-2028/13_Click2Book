import { Card, EmptyRow, Pill, Table, matches } from '../components/ui';

export default function Buses({ ctx }) {
  const { data, q } = ctx;
  const buses = data.vehicles.filter((v) =>
    matches(q, v.vehicleId, v.busName, v.vehicleNumber, v.vehicleType, data.providerNames[v.providerId]?.name),
  );

  return (
    <Card title="Buses" count={buses.length} id="busesCard">
      <p className="card-note">Buses belonging to suspended or unapproved operators are hidden from customer search.</p>
      <Table head={['Bus ID', 'Name', 'Operator', 'Type', 'Seats', 'Boarding → Dropping', 'Rating', 'Listed']} id="busesTable">
        {buses.length === 0 ? (
          <EmptyRow icon="🚌" message={ctx.live ? 'No buses match.' : 'Bus list needs the backend.'} />
        ) : (
          buses.map((v) => {
            const op = data.providerNames[v.providerId];
            return (
              <tr key={v.vehicleId}>
                <td className="booking-id">{v.vehicleId}</td>
                <td>
                  <strong>{v.busName || v.vehicleNumber}</strong>
                </td>
                <td>{op?.name || v.providerId}</td>
                <td>{v.vehicleType}</td>
                <td>{v.totalSeats}</td>
                <td>{v.boardingPoint ? `${v.boardingPoint} → ${v.droppingPoint}` : '—'}</td>
                <td>{v.rating ? `★ ${v.rating}` : '—'}</td>
                <td>
                  <Pill tone={op?.approved ? 'green' : 'red'}>{op?.approved ? 'Live' : 'Hidden'}</Pill>
                </td>
              </tr>
            );
          })
        )}
      </Table>
    </Card>
  );
}
