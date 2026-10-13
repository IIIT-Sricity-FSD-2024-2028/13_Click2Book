import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Tickets from './components/Tickets';
import EscalatedIssues from './components/EscalatedIssues';
import CostImpact from './components/CostImpact';
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
  getCostTickets,
  createManualCostTicket,
  resolveCostTicket,
  getCustomers,
  getRefunds,
  updateRefundStatus,
  getNotifications,
  markNotificationsAsRead,
} from './services/api';
import { INITIAL_AGENTS, INITIAL_ESCALATIONS_RESOLVED } from './services/mockData';

export default function App() {
  // Determine initial tab from hash or page URL
  const getInitialTab = () => {
    if (typeof window === 'undefined') return 'dashboard';
    const hash = window.location.hash.replace('#', '');
    if (['dashboard', 'tickets', 'escalated', 'cost-impact', 'customers', 'refunds', 'login'].includes(hash)) {
      return hash;
    }
    const path = window.location.pathname.toLowerCase();
    if (path.includes('login.html')) return 'login';
    if (path.includes('tickets.html')) return 'tickets';
    if (path.includes('escalated.html')) return 'escalated';
    if (path.includes('revenue-impact.html')) return 'cost-impact';
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
  const [costTickets, setCostTickets] = useState([]);
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

  // Load Cost Tickets
  const reloadCostTickets = useCallback(async () => {
    try {
      const res = await getCostTickets();
      setCostTickets(res.data);
    } catch (e) {
      console.warn('Failed to load cost tickets', e);
    }
  }, []);

  // Load Initial Data
  useEffect(() => {
    reloadTickets();
    reloadCostTickets();
    setCustomers(getCustomers());
    setRefunds(getRefunds());
    setNotifications(getNotifications());

    // Auto-refresh queue every 15s
    const timer = setInterval(() => {
      reloadTickets();
    }, 15000);

    return () => clearInterval(timer);
  }, [reloadTickets, reloadCostTickets]);

  // Sync hash on tab change
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (typeof window !== 'undefined') {
      window.location.hash = tabId;
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

  // Handle Cost Ticket creation
  const handleCreateCostTicket = async (payload) => {
    const res = await createManualCostTicket(payload);
    setCostTickets((prev) => [res.ticket, ...prev]);
    showToast(`Manual support ticket created for booking ${payload.bookingId}.`, 'success');
  };

  // Handle Cost Ticket resolve
  const handleResolveCostTicket = async (ticketId) => {
    await resolveCostTicket(ticketId);
    setCostTickets((prev) =>
      prev.map((t) => (t.ticketId === ticketId ? { ...t, status: 'resolved' } : t))
    );
    showToast(`Cost liability for ticket ${ticketId} resolved.`, 'success');
  };

  // Handle Refund update
  const handleUpdateRefundStatus = (refundId, status) => {
    const updated = updateRefundStatus(refundId, status);
    setRefunds(updated);
    showToast(`Refund ${refundId} marked as ${status}.`, 'success');
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

          {activeTab === 'cost-impact' && (
            <CostImpact
              costTickets={costTickets}
              onCreateCostTicket={handleCreateCostTicket}
              onResolveCostTicket={handleResolveCostTicket}
              onRefresh={reloadCostTickets}
              isLive={isLive}
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
