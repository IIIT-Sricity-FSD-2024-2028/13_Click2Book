import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  createEscalation,
  readEscalations,
  updateEscalation,
  deleteEscalation,
} from '../slices/escalationsSlice';
import { memStorage } from '../memoryBridge';

export { createEscalation, readEscalations, updateEscalation, deleteEscalation };

export const fetchEscalationsThunk = createAsyncThunk(
  'escalations/fetchEscalations',
  async (provider, { dispatch }) => {
    let list = [];
    try {
      list = JSON.parse(memStorage.getItem('c2b_provider_escalations') || '[]');
    } catch {}

    if (list.length === 0) {
      try {
        const supportTickets = JSON.parse(memStorage.getItem('c2b_support_tickets_v2') || '[]');
        const seeded = supportTickets
          .filter((t) => t.status === 'Escalated to Service Provider' || t.status === 'Pending Approval' || t.escalation)
          .map((t) => ({
            id: t.escalation?.id || `ESC-${t.id}`,
            ticketId: t.id,
            bookingId: t.bookingId || 'B001',
            customerName: t.customer,
            complaint: t.escalation?.complaint || t.subject,
            category: t.category || 'CANCELLATION',
            amountInvolved: t.fare || 2000,
            financialImpact: t.financialImpact,
            providerId: t.providerId || provider?.id || 'P002',
            providerName: t.serviceProvider || provider?.name || 'Kiran Travels',
            requiredAction: t.escalation?.requiredAction || 'Review cancellation & approve refund settlement',
            approvalRequired: true,
            status: t.escalation?.escalationStatus || (t.status === 'Approved' ? 'Approved' : t.status === 'Rejected' ? 'Rejected' : 'Pending Approval'),
            escalatedBy: t.assignedTo || 'Support Agent',
            escalatedAt: t.escalation?.escalatedAt || t.createdAt || new Date().toISOString(),
            providerRemarks: t.escalation?.providerRemarks || '',
          }));
        if (seeded.length > 0) {
          list = seeded;
          memStorage.setItem('c2b_provider_escalations', JSON.stringify(list));
        }
      } catch {}
    }

    dispatch(readEscalations(list));
    return list;
  }
);
