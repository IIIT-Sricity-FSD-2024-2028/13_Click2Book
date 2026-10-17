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

import {
  getTickets,
  resolveTicket,
  deescalateTicket,
  getCustomers,
  getRefunds,
  updateRefundStatus,
  getNotifications,
  markNotificationsAsRead,
} from './services/api';
import { INITIAL_AGENTS, INITIAL_ESCALATIONS_RESOLVED } from './services/mockData';

export default function App() {
  // Determine initial tab from hash or page URL (redirect #cost-impact to #dashboard)
  const getInitialTab = () => {
    if (typeof window === 'undefined') return 'dashboard';
    const hash = window.location.hash.replace('#', '');
    if (hash === 'cost-impact') {
      window.location.hash = 'dashboard';
      return 'dashboard';
    }
    if (['dashboard', 'tickets', 'escalated', 'customers', 'refunds', 'login'].includes(hash)) {
      return hash;
    }
    const path = window.location.pathname.toLowerCase();
    if (path.includes('login.html')) return 'login';
    if (path.includes('tickets.html')) return 'tickets';
    if (path.includes('escalated.html')) return 'escalated';
    if (path.includes('revenue-impact.html')) return 'dashboard';
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window === 'undefined') return true;
    return sessionStorage.getItem('c2b_loggedIn') === 'true';
  });

  const [agent, setAgent] = useState(() => {
    if (typeof window !== 'undefined') {
      const email = sessionStorage.getItem('c2b_userEmail');
      const found = INITIAL_AGENTS.find((a) => a.email.toLowerCase() === (email || '').toLowerCase());
      if (found) return found;
    }
    return INITIAL_AGENTS[0];
  });

  const [tickets, setTickets] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [resolvedEscalations, setResolvedEscalations] = useState(INITIAL_ESCALATIONS_RESOLVED);
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Toast Helper
  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 4);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const handleDismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load Tickets
  const reloadTickets = useCallback(async () => {
    try {
      const res = await getTickets();
      setTickets(res.tickets);
      setIsLive(res.isLive);
    } catch (e) {
      console.warn('Failed to load tickets', e);
    }
  }, []);

  // Load Refunds
  const reloadRefunds = useCallback(async () => {
    try {
      const res = await getRefunds();
      setRefunds(res);
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

    // Listen for cross-tab storage changes (e.g. customer submits support ticket or cancels ticket)
    const handleStorageChange = (e) => {
      if (
        !e.key ||
        e.key.includes('refund') ||
        e.key.includes('ticket') ||
        e.key.includes('support') ||
        e.key.includes('booking')
      ) {
        reloadTickets();
        reloadRefunds();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Auto-refresh queue every 10s
    const timer = setInterval(() => {
      reloadTickets();
      reloadRefunds();
    }, 10000);

    return () => {
      clearInterval(timer);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [reloadTickets, reloadRefunds]);

  // Sync hash on tab change (redirecting cost-impact if accessed)
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
    const target = (activeTab && activeTab !== 'login') ? activeTab : 'dashboard';
    setActiveTab(target);
    showToast(`Welcome back, ${loggedAgent.name}! Support panel initialized.`, 'success');
    if (typeof window !== 'undefined' && window.location.pathname.toLowerCase().includes('login.html')) {
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 300);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out of the Support Panel?')) {
      sessionStorage.removeItem('c2b_loggedIn');
      sessionStorage.removeItem('c2b_userName');
      sessionStorage.removeItem('c2b_userEmail');
      sessionStorage.removeItem('c2b_role');
      setIsAuthenticated(false);
      setActiveTab('login');
      showToast('You have been logged out securely.', 'info');
    }
  };

  // Handle Ticket Resolution
  const handleResolveTicket = async (ticketId, notes = '') => {
    await resolveTicket(ticketId);
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? { ...t, status: 'Resolved', resolvedAt: new Date().toISOString(), resolvedBy: agent?.name || 'Support Agent' }
          : t
      )
    );
    showToast(`Ticket #${ticketId} has been resolved successfully.`, 'success');
  };

  // Handle De-escalation
  const handleDeescalateTicket = async (ticketId, notes = 'De-escalated and resolved by supervisor.') => {
    await deescalateTicket(ticketId, notes);
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? { ...t, status: 'Resolved', resolvedAt: new Date().toISOString(), resolvedBy: agent?.name || 'Support Agent' }
          : t
      )
    );
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
          resolutionNote: notes,
          resolvedDate: new Date().toISOString().split('T')[0],
        },
        ...prev,
      ]);
    }
    showToast(`Escalation #${ticketId} de-escalated and resolved.`, 'success');
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
  const escalationsCount = tickets.filter((t) => t.status === 'Escalated').length;
  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  // If not authenticated or on login tab, render Login view
  if (!isAuthenticated || activeTab === 'login') {
    return (
      <>
        <Login onLogin={handleLogin} />
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
              onResolveTicket={handleResolveTicket}
            />
          )}

          {activeTab === 'tickets' && (
            <Tickets
              tickets={tickets}
              onSelectTicket={setSelectedTicket}
              onResolveTicket={handleResolveTicket}
            />
          )}

          {activeTab === 'escalated' && (
            <EscalatedIssues
              tickets={tickets}
              resolvedEscalations={resolvedEscalations}
              onDeescalateTicket={handleDeescalateTicket}
              onSelectTicket={setSelectedTicket}
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

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onResolve={handleResolveTicket}
          onDeescalate={handleDeescalateTicket}
        />
      )}

      {/* Global Toast Alerts */}
      <Toast toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}
