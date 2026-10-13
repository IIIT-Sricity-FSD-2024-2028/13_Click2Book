import { useState } from 'react';
import { Card, EmptyRow, Modal, Pill, Table, matches } from '../components/ui';
import { adminActions, formatINR } from '../lib/adminData';

const STATUS_PILL = {
  approved: ['green', 'Approved'],
  pending: ['orange', 'Pending approval'],
  rejected: ['red', 'Rejected'],
  suspended: ['red', 'Suspended'],
};
const DOC_PILL = { VERIFIED: 'green', SUBMITTED: 'orange', REJECTED: 'red' };
const VERIFY_PILL = { VERIFIED: ['green', 'Verified'], PENDING: ['orange', 'Unverified'], REJECTED: ['red', 'Rejected'] };

/** Ask for a reason; null means the admin cancelled. */
const askReason = (text, fallback) => {
  const r = window.prompt(text, fallback);
  return r === null ? null : r.trim() || fallback;
};

function DocumentsModal({ provider, ctx, onClose }) {
  const { act, busy } = ctx;
  const review = (i, status) => {
    const note =
      status === 'REJECTED' ? askReason(`Why is "${provider.documents[i].type}" rejected?`, 'Document could not be verified') : undefined;
    if (note === null) return;
    act(`${provider.id}-doc${i}`, `${provider.documents[i].type} ${status === 'VERIFIED' ? 'verified' : 'rejected'}.`, () =>
      adminActions.reviewDocument(provider.id, i, status, note),
    );
  };
  return (
    <Modal title={`Documents — ${provider.name}`} onClose={onClose} wide>
      <p className="card-note">
        Check each document against the issuing authority, then verify or reject it. A provider can only be approved once every document is
        verified. Seeded operators carry <strong>DEMO-</strong> placeholder numbers.
      </p>
      <Table head={['Document', 'Number', 'Status', 'Note', 'Action']} id="docsTable">
        {provider.documents.length === 0 ? (
          <EmptyRow icon="📄" message="No documents submitted. Ask the operator to upload their licence, permit and GST details." />
        ) : (
          provider.documents.map((d, i) => (
            <tr key={d.type}>
              <td>
                <strong>{d.type}</strong>
              </td>
              <td>
                <code>{d.number}</code>
              </td>
              <td>
                <Pill tone={DOC_PILL[d.status]}>{d.status}</Pill>
              </td>
              <td>{d.note || '—'}</td>
              <td className="actions-cell">
                <button
                  className="action-btn btn-success"
                  disabled={busy === `${provider.id}-doc${i}` || d.status === 'VERIFIED'}
                  onClick={() => review(i, 'VERIFIED')}
                >
                  Verify
                </button>{' '}
                <button
                  className="action-btn btn-danger"
                  disabled={busy === `${provider.id}-doc${i}` || d.status === 'REJECTED'}
                  onClick={() => review(i, 'REJECTED')}
                >
                  Reject
                </button>
              </td>
            </tr>
          ))
        )}
      </Table>
    </Modal>
  );
}

export default function Providers({ ctx }) {
  const { data, q, act, busy } = ctx;
  const [filter, setFilter] = useState('all');
  const [docsFor, setDocsFor] = useState(null);
  const providers = data.providers.filter((p) => (filter === 'all' || p.status === filter) && matches(q, p.id, p.name, p.email));
  // Keep the modal in sync with refreshed data
  const docsProvider = docsFor && data.providers.find((p) => p.id === docsFor);

  return (
    <>
      <Card
        title="Service Providers"
        count={providers.length}
        id="providersCard"
        actions={
          <select className="filter-select" id="providerStatusFilter" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="pending">Pending approval</option>
            <option value="approved">Approved</option>
            <option value="suspended">Suspended</option>
            <option value="rejected">Rejected</option>
          </select>
        }
      >
        <Table head={['ID', 'Operator', 'Documents', 'Status', 'Actions']} id="providersTable">
          {providers.length === 0 ? (
            <EmptyRow icon="🚌" message="No service providers match." />
          ) : (
            providers.map((p) => {
              const [tone, label] = STATUS_PILL[p.status] || ['grey', p.status];
              const [vTone, vLabel] = VERIFY_PILL[p.verificationStatus] || ['grey', p.verificationStatus];
              const reason = p.rejectionReason || p.suspensionReason;
              return (
                <tr key={p.id}>
                  <td className="booking-id">{p.id}</td>
                  <td>
                    <strong>{p.name}</strong>
                    <div className="sub-line">
                      {p.email} · joined {p.joined}
                    </div>
                  </td>
                  <td>
                    <button className="link-btn" onClick={() => setDocsFor(p.id)}>
                      <Pill tone={vTone}>{vLabel}</Pill> {p.documents.filter((d) => d.status === 'VERIFIED').length}/{p.documents.length}{' '}
                      docs ›
                    </button>
                  </td>
                  <td>
                    <Pill tone={tone}>{label}</Pill>
                    {reason && <div className="sub-line">{reason}</div>}
                  </td>
                  <td className="actions-cell">
                    {!p.approved && (
                      <button
                        className="action-btn btn-success"
                        disabled={busy === p.id}
                        title={p.verificationStatus !== 'VERIFIED' ? 'Verify all documents first' : ''}
                        onClick={() =>
                          p.verificationStatus !== 'VERIFIED'
                            ? (ctx.showToast(`Verify ${p.name}'s documents before approving.`, 'warning'), setDocsFor(p.id))
                            : act(p.id, `${p.name} approved — their buses are now bookable.`, () => adminActions.approveProvider(p.id))
                        }
                      >
                        Approve
                      </button>
                    )}{' '}
                    {p.status === 'pending' && (
                      <button
                        className="action-btn btn-danger"
                        disabled={busy === p.id}
                        onClick={() => {
                          const r = askReason(`Reason for rejecting ${p.name}:`, 'Incomplete documents');
                          if (r !== null) act(p.id, `${p.name} rejected.`, () => adminActions.rejectProvider(p.id, r));
                        }}
                      >
                        Reject
                      </button>
                    )}
                    {p.approved && (
                      <button
                        className="action-btn btn-warn"
                        disabled={busy === p.id}
                        onClick={() => {
                          const r = askReason(
                            `Why is ${p.name} being suspended? Their buses will disappear from customer search.`,
                            'Policy violation',
                          );
                          if (r !== null) act(p.id, `${p.name} suspended.`, () => adminActions.suspendProvider(p.id, r));
                        }}
                      >
                        Suspend
                      </button>
                    )}{' '}
                    <button
                      className="action-btn btn-ghost"
                      disabled={busy === p.id}
                      onClick={() =>
                        act(
                          p.id,
                          `${p.name} removed.`,
                          () => adminActions.removeProvider(p.id),
                          `Permanently remove ${p.name}? This cannot be undone.`,
                        )
                      }
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </Table>
      </Card>

      <Card title="Provider Performance" id="performanceCard">
        <p className="card-note">Built from bookings, payments and customer reviews on each operator's trips.</p>
        <Table
          head={['Operator', 'Buses', 'Trips', 'Bookings', 'Cancellation rate', 'Revenue', 'Avg rating', 'Reviews']}
          id="performanceTable"
        >
          {data.providers.length === 0 ? (
            <EmptyRow icon="📊" message="No providers yet." />
          ) : (
            [...data.providers]
              .sort((a, b) => b.revenue - a.revenue)
              .map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.name}</strong>
                  </td>
                  <td>{p.buses}</td>
                  <td>{p.trips}</td>
                  <td>{p.bookings}</td>
                  <td>
                    <span className={p.cancelRate > 0.3 ? 'txt-red' : ''}>{p.bookings ? `${Math.round(p.cancelRate * 100)}%` : '—'}</span>
                  </td>
                  <td className="amount">{formatINR(p.revenue)}</td>
                  <td>{p.rating != null ? `★ ${p.rating.toFixed(1)}` : '—'}</td>
                  <td>{p.ratings}</td>
                </tr>
              ))
          )}
        </Table>
      </Card>

      {docsProvider && <DocumentsModal provider={docsProvider} ctx={ctx} onClose={() => setDocsFor(null)} />}
    </>
  );
}
