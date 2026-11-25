import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  getTickets,
  saveTicketProgress,
  escalateToServiceProvider,
  escalateToTechnicalTeam,
  updateServiceProviderResponse,
  confirmTicketResolution,
  deescalateTicket,
} from '../../services/api';
import {
  createTicket,
  readTickets,
  updateTicket,
  deleteTicket,
  setSelectedTicketId,
  setResolutionTicketId,
  clearTicketSelections,
} from '../slices/ticketsSlice';
import {
  createEscalation,
  updateEscalation,
  addResolvedEscalation,
} from '../slices/escalationsSlice';
import { fetchRefundsThunk } from './refundActions';
import { showToastThunk } from './uiActions';

export {
  createTicket,
  readTickets,
  updateTicket,
  deleteTicket,
  setSelectedTicketId,
  setResolutionTicketId,
  clearTicketSelections,
};

export const fetchTicketsThunk = createAsyncThunk(
  'tickets/fetchTickets',
  async (forceRefresh = false, { rejectWithValue }) => {
    try {
      const res = await getTickets(forceRefresh);
      return res;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch tickets');
    }
  }
);

export const createTicketThunk = createAsyncThunk(
  'tickets/createTicket',
  async (ticketData, { dispatch }) => {
    const newTicket = {
      id: ticketData.id || `TKT-${Date.now().toString().slice(-5)}`,
      status: 'Open',
      createdAt: new Date().toISOString(),
      ...ticketData,
    };
    dispatch(createTicket(newTicket));
    return { ticket: newTicket };
  }
);

export const saveTicketProgressThunk = createAsyncThunk(
  'tickets/saveProgress',
  async ({ ticketId, data }, { getState, dispatch, rejectWithValue }) => {
    const agentName = getState().auth.agent?.name || 'Support Agent';
    const res = await saveTicketProgress(ticketId, data, agentName);
    if (!res.success) {
      return rejectWithValue(res.message || 'Failed to save progress');
    }
    await dispatch(fetchTicketsThunk(true));
    dispatch(showToastThunk(`Verification progress saved for ticket #${ticketId}.`, 'success'));
    return res;
  }
);

export const escalateToProviderThunk = createAsyncThunk(
  'tickets/escalateToProvider',
  async ({ ticketId, escalationData }, { getState, dispatch, rejectWithValue }) => {
    const agentName = getState().auth.agent?.name || 'Support Agent';
    const res = await escalateToServiceProvider(ticketId, escalationData, agentName);
    if (!res.success) {
      return rejectWithValue(res.message || 'Failed to escalate to provider');
    }
    if (res.escalation) {
      dispatch(createEscalation(res.escalation));
    }
    await dispatch(fetchTicketsThunk(true));
    dispatch(
      showToastThunk(
        `Ticket #${ticketId} escalated to Service Provider (${res.escalation.providerName}) with financial loss breakdown.`,
        'success'
      )
    );
    return res;
  }
);

export const escalateToTechThunk = createAsyncThunk(
  'tickets/escalateToTech',
  async ({ ticketId, techData }, { getState, dispatch, rejectWithValue }) => {
    const agentName = getState().auth.agent?.name || 'Support Agent';
    const res = await escalateToTechnicalTeam(ticketId, techData, agentName);
    if (!res.success) {
      return rejectWithValue(res.message || 'Failed to escalate to tech team');
    }
    await dispatch(fetchTicketsThunk(true));
    dispatch(
      showToastThunk(
        `Ticket #${ticketId} escalated to ${techData.escalationLevel}. Severity: ${techData.severity}.`,
        'success'
      )
    );
    return res;
  }
);

export const providerDecisionThunk = createAsyncThunk(
  'tickets/providerDecision',
  async ({ ticketId, decision, remarks = '' }, { getState, dispatch, rejectWithValue }) => {
    const responderName = getState().auth.agent?.name || 'Operator Desk';
    const res = await updateServiceProviderResponse(ticketId, decision, remarks, responderName);
    if (!res.success) {
      return rejectWithValue(res.message || 'Failed to record provider decision');
    }
    dispatch(updateEscalation({ ticketId, status: decision, providerRemarks: remarks }));
    await dispatch(fetchTicketsThunk(true));
    await dispatch(fetchRefundsThunk(true));
    dispatch(
      showToastThunk(
        `Service Provider recorded decision: ${decision} for ticket #${ticketId}.`,
        decision === 'Approved' ? 'success' : 'error'
      )
    );
    return res;
  }
);

export const confirmResolutionThunk = createAsyncThunk(
  'tickets/confirmResolution',
  async ({ ticketId, resolutionData }, { getState, dispatch, rejectWithValue }) => {
    const state = getState();
    const agentName = state.auth.agent?.name || 'Support Agent';
    const target = state.tickets.items.find((t) => t.id === ticketId);
    const res = await confirmTicketResolution(ticketId, resolutionData, agentName);
    if (!res.success) {
      dispatch(
        showToastThunk(
          res.error || 'Cannot resolve ticket: mandatory verification steps are incomplete.',
          'error'
        )
      );
      return rejectWithValue(res.error || 'Resolution validation failed');
    }

    await dispatch(fetchTicketsThunk(true));
    await dispatch(fetchRefundsThunk(true));

    if (target) {
      dispatch(
        addResolvedEscalation({
          id: target.id,
          customer: target.customer,
          bookingId: target.bookingId || 'B001',
          subject: target.subject,
          priority: target.priority,
          status: 'Resolved',
          resolvedBy: agentName,
          resolutionNote: resolutionData.remarks,
          resolvedDate: new Date().toISOString().split('T')[0],
        })
      );
    }

    dispatch(setResolutionTicketId(null));
    dispatch(
      showToastThunk(
        `✓ Ticket #${ticketId} resolved successfully after full procedure verification!`,
        'success'
      )
    );
    return res;
  }
);

export const deescalateTicketThunk = createAsyncThunk(
  'tickets/deescalateTicket',
  async ({ ticketId, note }, { dispatch }) => {
    const res = await deescalateTicket(ticketId, note);
    await dispatch(fetchTicketsThunk(true));
    return res;
  }
);

export const deleteTicketThunk = createAsyncThunk(
  'tickets/deleteTicket',
  async (ticketId) => ticketId
);
