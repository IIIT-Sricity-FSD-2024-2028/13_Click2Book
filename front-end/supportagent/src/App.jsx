import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Tickets from './components/Tickets';
import EscalatedIssues from './components/EscalatedIssues';
import CustomerLookup from './components/CustomerLookup';
import Refunds from './components/Refunds';
import NotificationDrawer from './components/NotificationDrawer';
import Toast from './components/Toast';
import Login from './components/Login';
import TicketDetailModal from './components/TicketDetailModal';
import ResolutionWorkflowModal from './components/ResolutionWorkflowModal';

import {
  getTickets,
  resolveTicket,
  deescalateTicket,
  saveTicketProgress,
  escalateToServiceProvider,
  escalateToTechnicalTeam,
  updateServiceProviderResponse,
  confirmTicketResolution,
  getCustomers,
  getRefunds,
  updateRefundStatus,
  getNotifications,
  markNotificationsAsRead,
  getSyncChannel,
  STORAGE_KEYS,
} from './services/api';
import { INITIAL_AGENTS, INITIAL_TICKETS, INITIAL_REFUNDS, INITIAL_ESCALATIONS_RESOLVED } from './services/mockData';

export default function App() {
  // Determine initial tab from hash or page URL
  const getInitialTab = () => {
    if (typeof window === 'undefined') return 'dashboard';
    const loggedIn =
      sessionStorage.getItem('c2b_loggedIn') === 'true' ||
      localStorage.getItem('c2b_loggedIn') === 'true';

    const hash = window.location.hash.replace('#', '');
    if (hash === 'cost-impact') {
      window.location.hash = 'dashboard';
      return 'dashboard';
    }
    if (hash === 'login') {
      if (loggedIn) {
        window.location.hash = 'dashboard';
        return 'dashboard';
      }
      return 'login';
    }
    if (['dashboard', 'tickets', 'escalated', 'customers', 'refunds'].includes(hash)) {
      return hash;
    }
    const path = window.location.pathname.toLowerCase();
    if (path.includes('login.html')) return loggedIn ? 'dashboard' : 'login';
    if (path.includes('tickets.html')) return 'tickets';
    if (path.includes('escalated.html')) return 'escalated';
    if (path.includes('revenue-impact.html')) return 'dashboard';
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [accountAccessError, setAccountAccessError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window === 'undefined') return true;
    return (
      sessionStorage.getItem('c2b_loggedIn') === 'true' ||
      localStorage.getItem('c2b_loggedIn') === 'true'
    );
  });

  const [agent, setAgent] = useState(() => {
    if (typeof window !== 'undefined') {
      const email =
        sessionStorage.getItem('c2b_userEmail') ||
        localStorage.getItem('c2b_userEmail');
      const found = INITIAL_AGENTS.find((a) => a.email.toLowerCase() === (email || '').toLowerCase());
      if (found) return found;
    }
    return INITIAL_AGENTS[0];
  });

  useEffect(() => {
    const onDeactivated = (event) => {
      setIsAuthenticated(false);
      setAccountAccessError(event.detail?.message || 'Your customer support account has been deactivated by the administrator. You cannot log in. Please contact your administrator for assistance.');
      setActiveTab('login');
      window.location.hash = 'login';
    };
    window.addEventListener('c2b_account_deactivated', onDeactivated);
    return () => window.removeEventListener('c2b_account_deactivated', onDeactivated);
  }, []);

  const [tickets, setTickets] = useState(() => {
    try {
      const local = localStorage.getItem('c2b_support_tickets_v2') || localStorage.getItem('c2b_support_tickets');
      if (local) return JSON.parse(local);
    } catch (_) {}
    return INITIAL_TICKETS;
  });
  const [customers, setCustomers] = useState(() => getCustomers());
  const [refunds, setRefunds] = useState(() => {
    try {
      const local = localStorage.getItem('c2b_support_refunds_v2') || localStorage.getItem('c2b_support_refunds');
      if (local) return JSON.parse(local);
    } catch (_) {}
    return INITIAL_REFUNDS;
  });
  const [resolvedEscalations, setResolvedEscalations] = useState(INITIAL_ESCALATIONS_RESOLVED);
  const [notifications, setNotifications] = useState(() => getNotifications());
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [resolutionTicket, setResolutionTicket] = useState(null); // Active ticket in Structured Resolution Workflow
  const [toasts, setToasts] = useState([]);

  // Toast Helper
  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 4);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const handleDismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load Tickets with deep check to avoid redundant re-renders
  const reloadTickets = useCallback(async () => {
    try {
      const res = await getTickets();
      if (res && Array.isArray(res.tickets)) {
        setTickets((prev) => {
          if (Array.isArray(prev) && prev.length === res.tickets.length) {
            let unchanged = true;
            for (let i = 0; i < prev.length; i++) {
              if (
                prev[i].id !== res.tickets[i].id ||
                prev[i].status !== res.tickets[i].status ||
                prev[i].updatedAt !== res.tickets[i].updatedAt ||
                prev[i].resolution !== res.tickets[i].resolution
              ) {
                unchanged = false;
                break;
              }
            }
            if (unchanged) return prev;
          }
          return res.tickets;
        });
        setIsLive(res.isLive);
      }
    } catch (e) {
      console.warn('Failed to load tickets', e);
    }
  }, []);

  // Load Refunds with deep check
  const reloadRefunds = useCallback(async () => {
    try {
      const res = await getRefunds();
      if (Array.isArray(res)) {
        setRefunds((prev) => {
          if (Array.isArray(prev) && prev.length === res.length) {
            let unchanged = true;
            for (let i = 0; i < prev.length; i++) {
              if (prev[i].refundId !== res[i].refundId || prev[i].status !== res[i].status) {
                unchanged = false;
                break;
              }
            }
            if (unchanged) return prev;
          }
          return res;
        });
      }
    } catch (e) {
      console.warn('Failed to load refunds', e);
    }
  }, []);

  // Load Initial Data & Sync
  useEffect(() => {
    reloadTickets();
    reloadRefunds();
    setCustomers(getCustomers());
    setNotifications(getNotifications());

    // 1. Real-time Cross-Portal BroadcastChannel listener (0ms latency across ports 5176 & 5173)
    let syncChannel = null;
    try {
      syncChannel = getSyncChannel();
      if (syncChannel) {
        syncChannel.onmessage = (event) => {
          const msg = event?.data;
          if (msg) {
            if (msg.type === 'NEW_CUSTOMER_TICKET') {
              showToast(`🔔 New Ticket Received: #${msg.ticket?.requestId || msg.ticket?.id || 'Customer Query'}`, 'info');
              reloadTickets();
            } else if (msg.type === 'TICKET_RESOLVED' || msg.type === 'TICKET_UPDATED') {
              reloadTickets();
            }
          }
        };
      }
    } catch (_) {}

    // 2. Targeted internal data change listener (avoids infinite loops)
    const handleDataChanged = (e) => {
      const key = e?.detail?.key;
      if (!key || key === STORAGE_KEYS.TICKETS) {
        reloadTickets();
      }
      if (!key || key === STORAGE_KEYS.REFUNDS) {
        reloadRefunds();
      }
    };
    window.addEventListener('c2b_data_changed', handleDataChanged);

    // 3. Tab visibility / focus sync: immediately refresh whenever support agent focuses tab
    const handleVisibility = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        reloadTickets();
        reloadRefunds();
      }
    };
    window.addEventListener('focus', handleVisibility);
    document.addEventListener('visibilitychange', handleVisibility);

    // 4. Hash navigation listener
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (['dashboard', 'tickets', 'escalated', 'customers', 'refunds'].includes(hash)) {
        setActiveTab(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);

    // 5. Clean, fast background poll every 4 seconds
    const timer = setInterval(() => {
      reloadTickets();
      reloadRefunds();
    }, 4000);

    return () => {
      clearInterval(timer);
      window.removeEventListener('c2b_data_changed', handleDataChanged);
      window.removeEventListener('focus', handleVisibility);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [reloadTickets, reloadRefunds, showToast]);

  // Sync hash on tab change
  const handleTabChange = (tabId) => {
    const valid = tabId === 'cost-impact' ? 'dashboard' : tabId;
    setActiveTab(valid);
    if (typeof window !== 'undefined') {
      window.location.hash = valid;
    }
  };

  // Handle Login
  const handleLogin = (loggedAgent) => {
    setAgent(loggedAgent);
    setIsAuthenticated(true);
    setActiveTab('dashboard');
    showToast(`Welcome back, ${loggedAgent?.name || 'Support Agent'}! Support Desk initialized.`, 'success');
    if (typeof window !== 'undefined') {
      if (window.location.pathname.toLowerCase().includes('login.html')) {
        try {
          window.location.assign('index.html#dashboard');
        } catch (_) {
          window.location.href = 'index.html#dashboard';
        }
      } else {
        window.location.hash = 'dashboard';
      }
    }
  };

  // Handle Logout
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out of the Support Panel?')) {
      sessionStorage.removeItem('c2b_loggedIn');
      sessionStorage.removeItem('c2b_userName');
      sessionStorage.removeItem('c2b_userEmail');
      sessionStorage.removeItem('c2b_loggedInId');
      sessionStorage.removeItem('c2b_role');
      sessionStorage.removeItem('c2b_sessionVersion');
      localStorage.removeItem('c2b_loggedIn');
      localStorage.removeItem('c2b_userName');
      localStorage.removeItem('c2b_userEmail');
      localStorage.removeItem('c2b_loggedInId');
      localStorage.removeItem('c2b_role');
      localStorage.removeItem('c2b_sessionVersion');
      setIsAuthenticated(false);
      setActiveTab('login');
      if (typeof window !== 'undefined') {
        window.location.hash = 'login';
      }
      showToast('You have been logged out securely.', 'info');
    }
  };

  // ── STRUCTURED RESOLUTION WORKFLOW HANDLERS ──

  // Open Structured Resolution Workflow
  const handleOpenResolutionModal = (ticket) => {
    // If ticket was clicked from details modal, close detail modal and open workflow modal
    setSelectedTicket(null);
    setResolutionTicket(ticket);
  };

  // Save in-progress verification checklist and notes
  const handleSaveTicketProgress = async (ticketId, data) => {
    const res = await saveTicketProgress(ticketId, data, agent?.name || 'Support Agent');
    if (res.success) {
      await reloadTickets();
      if (resolutionTicket && resolutionTicket.id === ticketId) {
        setResolutionTicket(res.ticket);
      }
      showToast(`Verification progress saved for ticket #${ticketId}.`, 'success');
    }
  };

  // Escalate to Service Provider
  const handleEscalateToProvider = async (ticketId, escalationData) => {
    const res = await escalateToServiceProvider(ticketId, escalationData, agent?.name || 'Support Agent');
    if (res.success) {
      await reloadTickets();
      if (resolutionTicket && resolutionTicket.id === ticketId) {
        setResolutionTicket(res.ticket);
      }
      showToast(
        `Ticket #${ticketId} escalated to Service Provider (${res.escalation.providerName}) with financial loss breakdown.`,
        'success'
      );
    }
  };

  // Escalate to Technical Support Team
  const handleEscalateToTech = async (ticketId, techData) => {
    const res = await escalateToTechnicalTeam(ticketId, techData, agent?.name || 'Support Agent');
    if (res.success) {
      await reloadTickets();
      if (resolutionTicket && resolutionTicket.id === ticketId) {
        setResolutionTicket(res.ticket);
      }
      showToast(`Ticket #${ticketId} escalated to ${techData.escalationLevel}. Severity: ${techData.severity}.`, 'success');
    }
  };

  // Service Provider Decision (Approve / Reject)
  const handleProviderDecision = async (ticketId, decision, remarks = '') => {
    const res = await updateServiceProviderResponse(ticketId, decision, remarks, agent?.name || 'Operator Desk');
    if (res.success) {
      await reloadTickets();
      if (resolutionTicket && resolutionTicket.id === ticketId) {
        setResolutionTicket(res.ticket);
      }
      showToast(`Service Provider recorded decision: ${decision} for ticket #${ticketId}.`, decision === 'Approved' ? 'success' : 'error');
    }
  };

  // Confirm Final Resolution
  const handleConfirmResolution = async (ticketId, resolutionData) => {
    const res = await confirmTicketResolution(ticketId, resolutionData, agent?.name || 'Support Agent');
    if (res.success) {
      await reloadTickets();
      await reloadRefunds();

      // Add to resolved escalations history if it had escalations
      const target = tickets.find((t) => t.id === ticketId);
      if (target) {
        setResolvedEscalations((prev) => [
          {
            id: target.id,
            customer: target.customer,
            bookingId: target.bookingId || 'B001',
            subject: target.subject,
            priority: target.priority,
            status: 'Resolved',
            resolvedBy: agent?.name || 'Support Agent',
            resolutionNote: resolutionData.remarks,
            resolvedDate: new Date().toISOString().split('T')[0],
          },
          ...prev,
        ]);
      }

      setResolutionTicket(null);
      showToast(`✓ Ticket #${ticketId} resolved successfully after full procedure verification!`, 'success');
    } else {
      showToast(res.error || 'Cannot resolve ticket: mandatory verification steps are incomplete.', 'error');
    }
  };

  // Handle De-escalation
  const handleDeescalateTicket = async (ticketId, notes = 'De-escalated and resolved by supervisor.') => {
    const target = tickets.find((t) => t.id === ticketId);
    if (target) {
      handleOpenResolutionModal(target);
    }
  };

  // Handle Refund update
  const handleUpdateRefundStatus = async (refundId, status) => {
    try {
      const updated = await updateRefundStatus(refundId, status);
      setRefunds(updated);
      showToast(`Refund ${refundId} marked as ${status}.`, 'success');
    } catch (e) {
      showToast(`Failed to update refund: ${e.message}`, 'error');
    }
  };

  // Mark all notifications read
  const handleMarkAllRead = () => {
    const updated = markNotificationsAsRead();
    setNotifications(updated);
    showToast('All notifications marked as read.', 'info');
  };

  // Count active stats
  const openCount = tickets.filter((t) => t.status === 'Open').length;
  const escalationsCount = tickets.filter(
    (t) =>
      t.status === 'Escalated' ||
      t.status === 'Escalated to Service Provider' ||
      t.status === 'Escalated to Technical Team' ||
      t.status === 'Pending Approval'
  ).length;
  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  // If not authenticated, render Login view
  if (!isAuthenticated) {
    return (
      <>
        <Login onLogin={handleLogin} initialError={accountAccessError} />
        <Toast toasts={toasts} onDismiss={handleDismissToast} />
      </>
    );
  }

  return (
    <div className="app-container">
      {/* Collapsible Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        agent={agent}
        onLogout={handleLogout}
        openTicketsCount={openCount}
        escalationsCount={escalationsCount}
      />

      {/* Main Content Area */}
      <div className="main-area">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          isLive={isLive}
          unreadCount={unreadNotifsCount}
          onToggleNotifications={() => setIsNotifOpen(!isNotifOpen)}
          agent={agent}
        />

        {/* View Content Body */}
        <main className="content-body">
          {activeTab === 'dashboard' && (
            <Dashboard
              tickets={tickets}
              onSelectTicket={setSelectedTicket}
              onNavigate={handleTabChange}
              onResolveTicket={handleOpenResolutionModal}
            />
          )}

          {activeTab === 'tickets' && (
            <Tickets
              tickets={tickets}
              onSelectTicket={setSelectedTicket}
              onResolveTicket={handleOpenResolutionModal}
            />
          )}

          {activeTab === 'escalated' && (
            <EscalatedIssues
              tickets={tickets}
              resolvedEscalations={resolvedEscalations}
              onDeescalateTicket={handleDeescalateTicket}
              onSelectTicket={setSelectedTicket}
              onProviderDecision={handleProviderDecision}
              onOpenResolutionModal={handleOpenResolutionModal}
            />
          )}

          {activeTab === 'customers' && (
            <CustomerLookup
              customers={customers}
              onSelectCustomer={(c) => {
                showToast(`Viewing passenger record for ${c.name}`, 'info');
              }}
            />
          )}

          {activeTab === 'refunds' && (
            <Refunds
              refunds={refunds}
              onUpdateStatus={handleUpdateRefundStatus}
            />
          )}
        </main>
      </div>

      {/* Slide-over Notifications */}
      <NotificationDrawer
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        notifications={notifications}
        onMarkAllRead={handleMarkAllRead}
      />

      {/* Read-only Ticket Detail Modal */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onResolve={handleOpenResolutionModal}
          onDeescalate={handleOpenResolutionModal}
          onOpenResolutionWorkflow={handleOpenResolutionModal}
        />
      )}

      {/* Structured Resolution & Escalation Workflow Modal */}
      {resolutionTicket && (
        <ResolutionWorkflowModal
          ticket={resolutionTicket}
          onClose={() => setResolutionTicket(null)}
          onSaveProgress={handleSaveTicketProgress}
          onEscalateToProvider={handleEscalateToProvider}
          onEscalateToTech={handleEscalateToTech}
          onProviderDecision={handleProviderDecision}
          onConfirmResolution={handleConfirmResolution}
          agentName={agent?.name || 'Support Agent'}
        />
      )}

      {/* Global Toast Alerts */}
      <Toast toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}
