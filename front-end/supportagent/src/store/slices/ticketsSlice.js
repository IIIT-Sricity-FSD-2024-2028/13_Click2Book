import { createSlice } from '@reduxjs/toolkit';
import { INITIAL_TICKETS } from '../../services/mockData';

const initialState = {
  items: INITIAL_TICKETS,
  selectedTicketId: null,
  resolutionTicketId: null,
  isLive: false,
  loading: false,
  error: null,
};

function ticketsEqual(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (
      a[i].id !== b[i].id ||
      a[i].status !== b[i].status ||
      a[i].updatedAt !== b[i].updatedAt ||
      a[i].resolution !== b[i].resolution
    ) {
      return false;
    }
  }
  return true;
}

const ticketsSlice = createSlice({
  name: 'tickets',
  initialState,
  reducers: {
    // CREATE
    createTicket: (state, action) => {
      const ticket = action.payload;
      if (ticket && !state.items.some((t) => t.id === ticket.id)) {
        state.items.unshift(ticket);
      }
    },
    // READ / set
    readTickets: (state, action) => {
      const next = Array.isArray(action.payload?.tickets)
        ? action.payload.tickets
        : Array.isArray(action.payload)
          ? action.payload
          : null;
      if (next && !ticketsEqual(state.items, next)) {
        state.items = next;
      }
      if (action.payload && typeof action.payload.isLive === 'boolean') {
        state.isLive = action.payload.isLive;
      }
    },
    // UPDATE
    updateTicket: (state, action) => {
      const updated = action.payload;
      if (!updated?.id) return;
      const idx = state.items.findIndex((t) => t.id === updated.id);
      if (idx >= 0) {
        state.items[idx] = { ...state.items[idx], ...updated };
      } else {
        state.items.unshift(updated);
      }
    },
    // DELETE
    deleteTicket: (state, action) => {
      const id = action.payload;
      state.items = state.items.filter((t) => t.id !== id);
      if (state.selectedTicketId === id) state.selectedTicketId = null;
      if (state.resolutionTicketId === id) state.resolutionTicketId = null;
    },
    setSelectedTicketId: (state, action) => {
      state.selectedTicketId = action.payload || null;
    },
    setResolutionTicketId: (state, action) => {
      state.resolutionTicketId = action.payload || null;
    },
    clearTicketSelections: (state) => {
      state.selectedTicketId = null;
      state.resolutionTicketId = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(
        (action) => action.type === 'tickets/fetchTickets/pending',
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        (action) => action.type === 'tickets/fetchTickets/fulfilled',
        (state, action) => {
          state.loading = false;
          if (action.payload && Array.isArray(action.payload.tickets)) {
            if (!ticketsEqual(state.items, action.payload.tickets)) {
              state.items = action.payload.tickets;
            }
            state.isLive = Boolean(action.payload.isLive);
          }
        }
      )
      .addMatcher(
        (action) => action.type === 'tickets/fetchTickets/rejected',
        (state, action) => {
          state.loading = false;
          state.error = action.payload || action.error?.message || 'Failed to load tickets';
        }
      )
      .addMatcher(
        (action) =>
          [
            'tickets/createTicket/fulfilled',
            'tickets/saveProgress/fulfilled',
            'tickets/escalateToProvider/fulfilled',
            'tickets/escalateToTech/fulfilled',
            'tickets/providerDecision/fulfilled',
            'tickets/confirmResolution/fulfilled',
          ].includes(action.type),
        (state, action) => {
          const ticket = action.payload?.ticket;
          if (ticket?.id) {
            const idx = state.items.findIndex((t) => t.id === ticket.id);
            if (idx >= 0) state.items[idx] = ticket;
            else state.items.unshift(ticket);
          }
        }
      )
      .addMatcher(
        (action) => action.type === 'tickets/deleteTicket/fulfilled',
        (state, action) => {
          const id = action.payload;
          state.items = state.items.filter((t) => t.id !== id);
          if (state.selectedTicketId === id) state.selectedTicketId = null;
          if (state.resolutionTicketId === id) state.resolutionTicketId = null;
        }
      );
  },
});

export const {
  createTicket,
  readTickets,
  updateTicket,
  deleteTicket,
  setSelectedTicketId,
  setResolutionTicketId,
  clearTicketSelections,
} = ticketsSlice.actions;

export default ticketsSlice.reducer;
