import { revenueRequest } from '../../superadmin/revenueMock';
import {
  createRevenueEntry,
  readRevenueState,
  updateRevenueEntry,
  deleteRevenueEntry,
  setRevenueConnected,
  setRevenueDemoMode,
  setRevenueConfig,
  setRevenueWarning,
  setRevenueError,
  setRevenueStats,
  setRevenueLedger,
  setRevenueTickets,
  setRevenuePayments,
  setRevenuePayouts,
  setRevenueTransfers,
  setRevenueRefunds,
  setTransferringOperator,
  setRefundBusy,
  setRefundError,
  setRevenueLoading,
  clearRevenueTransient,
} from '../slices/revenueSlice';

const adminFetch = (path, opts) => revenueRequest(path, { role: 'ADMIN', ...opts });

export const fetchSummaryStatsThunk = () => async (dispatch) => {
  const summary = await adminFetch('/admin/ledger/summary');
  dispatch(setRevenueStats({ summary }));
  return summary;
};

export const fetchLedgerThunk = (status = '') => async (dispatch) => {
  const rows = await adminFetch('/admin/ledger' + (status ? `?status=${status}` : ''));
  dispatch(setRevenueLedger(rows));
  dispatch(readRevenueState());
  return rows;
};

export const fetchPayoutsThunk = () => async (dispatch) => {
  const [payouts, transfers] = await Promise.all([
    adminFetch('/admin/payouts/summary'),
    adminFetch('/admin/payouts/transfers').catch(() => []),
  ]);
  dispatch(setRevenuePayouts(payouts));
  dispatch(setRevenueTransfers(transfers));
  return { payouts, transfers };
};

export const fetchPaymentsThunk = () => async (dispatch) => {
  const [all, ledgerRows] = await Promise.all([adminFetch('/payments'), adminFetch('/admin/ledger')]);
  const ledgered = new Set((ledgerRows || []).map((r) => r.bookingId));
  const filtered = (all || []).filter((p) => ledgered.has(p.bookingId));
  dispatch(setRevenuePayments(filtered));
  return filtered;
};

export const fetchSupportTicketsThunk = (status = '') => async (dispatch) => {
  const rows = await adminFetch('/support-ticket' + (status ? `?status=${status}` : ''));
  dispatch(setRevenueTickets(rows));
  return rows;
};

export const fetchRefundsThunk = () => async (dispatch) => {
  try {
    const [all, bookings, customers] = await Promise.all([
      adminFetch('/refunds'),
      adminFetch('/bookings'),
      adminFetch('/customers'),
    ]);
    const names = Object.fromEntries((customers || []).map((c) => [c.customerId, c.name]));
    const customerOf = Object.fromEntries((bookings || []).map((b) => [b.bookingId, names[b.customerId] || b.customerId]));
    dispatch(setRevenueRefunds({ refunds: all, customerOf }));
    dispatch(setRefundError(''));
    return { success: true, data: all };
  } catch (err) {
    const msg = 'Could not load refunds: ' + (err?.message || 'Unknown error');
    dispatch(setRefundError(msg));
    return { success: false, error: msg };
  }
};

export const initRevenueDashboardThunk = () => async (dispatch) => {
  dispatch(setRevenueLoading(true));
  try {
    const cfg = await adminFetch('/admin/revenue-config');
    dispatch(
      setRevenueConfig({
        commissionPct: cfg.commissionPct,
        convenienceFee: (cfg.convenienceFeeFlat / 100).toFixed(2),
        gatewayFeePct: cfg.gatewayFeePct,
      }),
    );
    await Promise.all([
      dispatch(fetchSummaryStatsThunk()),
      dispatch(fetchLedgerThunk('')),
      dispatch(fetchSupportTicketsThunk('')),
      dispatch(fetchPaymentsThunk()),
      dispatch(fetchPayoutsThunk()),
    ]);
    dispatch(setRevenueConnected(true));
    dispatch(setRevenueError(''));
    return { success: true };
  } catch (err) {
    dispatch(setRevenueConnected(false));
    dispatch(setRevenueError(err?.message || 'Failed to connect revenue API'));
    return { success: false, error: err?.message };
  } finally {
    dispatch(setRevenueLoading(false));
  }
};

export const refreshRevenueDashboardThunk = (ledgerFilter = '') => async (dispatch) => {
  await Promise.all([
    dispatch(fetchSummaryStatsThunk()),
    dispatch(fetchPaymentsThunk()),
    dispatch(fetchLedgerThunk(ledgerFilter)),
    dispatch(fetchPayoutsThunk()),
  ]);
};

export const saveRevenueConfigThunk = (config) => async (dispatch) => {
  dispatch(setRevenueWarning(''));
  try {
    const supportCostWeights = { cancellation: 0, complaint: 0, sos: 0, lost_and_found: 0, dispute: 0 };
    const json = await adminFetch('/admin/revenue-config', {
      method: 'POST',
      raw: true,
      body: {
        commissionPct: parseFloat(config.commissionPct),
        convenienceFeeFlat: Math.round(parseFloat(config.convenienceFee) * 100),
        gatewayFeePct: parseFloat(config.gatewayFeePct),
        supportCostWeights,
      },
    });
    if (!json.success) throw new Error(json.message || 'Save failed');
    if (json.warning) dispatch(setRevenueWarning('⚠ ' + json.warning));
    await dispatch(fetchSummaryStatsThunk());
    return { success: true };
  } catch (err) {
    return { success: false, error: err?.message || 'Save failed' };
  }
};

export const transferPayoutThunk = (providerId, ledgerFilter = '') => async (dispatch) => {
  dispatch(setTransferringOperator(providerId));
  try {
    await adminFetch(`/admin/payouts/${providerId}/transfer`, { method: 'POST' });
    await Promise.all([dispatch(fetchPayoutsThunk()), dispatch(fetchLedgerThunk(ledgerFilter))]);
    return { success: true };
  } catch (err) {
    return { success: false, error: err?.message || 'Transfer failed' };
  } finally {
    dispatch(setTransferringOperator(''));
  }
};

export const resolveSupportTicketThunk = (ticketId, ticketFilter = '') => async (dispatch) => {
  try {
    await adminFetch(`/support-ticket/${ticketId}/resolve`, { method: 'PATCH' });
    dispatch(
      updateRevenueEntry({
        kind: 'tickets',
        idField: 'ticketId',
        idValue: ticketId,
        updates: { status: 'resolved' },
      }),
    );
    await Promise.all([dispatch(fetchSupportTicketsThunk(ticketFilter)), dispatch(fetchSummaryStatsThunk())]);
    return { success: true };
  } catch (err) {
    return { success: false, error: err?.message || 'Failed to resolve ticket' };
  }
};

export const processRefundThunk = (bookingId, status, adminId = 'SUPER_ADMIN') => async (dispatch) => {
  dispatch(setRefundBusy(bookingId));
  try {
    await adminFetch(`/refunds/booking/${bookingId}/process`, {
      method: 'PATCH',
      body: { adminId, refundStatus: status },
    });
    dispatch(
      updateRevenueEntry({
        kind: 'refunds',
        idField: 'bookingId',
        idValue: bookingId,
        updates: { refundStatus: status, adminId },
      }),
    );
    await Promise.all([dispatch(fetchRefundsThunk()), dispatch(fetchPaymentsThunk())]);
    return { success: true };
  } catch (err) {
    return { success: false, error: err?.message || 'Failed to update refund' };
  } finally {
    dispatch(setRefundBusy(''));
  }
};

export {
  createRevenueEntry,
  updateRevenueEntry,
  deleteRevenueEntry,
  setRevenueConfig,
  setRevenueDemoMode,
  clearRevenueTransient,
};
