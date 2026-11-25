import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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

import { getSyncChannel, STORAGE_KEYS } from './services/api';
import {
  deleteSession,
  setAccountAccessError,
  fetchTicketsThunk,
  fetchRefundsThunk,
  fetchCustomersThunk,
  fetchNotificationsThunk,
  navigateTabThunk,
  showToastThunk,
} from './store/actions';

export default function App() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const activeTab = useSelector((state) => state.ui.activeTab);
  const selectedTicketId = useSelector((state) => state.tickets.selectedTicketId);
  const resolutionTicketId = useSelector((state) => state.tickets.resolutionTicketId);

  // Sync initial hash route on mount without localStorage/sessionStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.replace('#', '');
    if (hash === 'cost-impact') {
      dispatch(navigateTabThunk('dashboard'));
    } else if (['dashboard', 'tickets', 'escalated', 'customers', 'refunds'].includes(hash)) {
      dispatch(navigateTabThunk(hash));
    }
  }, [dispatch]);

  // Listen for deactivated account event from API interceptor
  useEffect(() => {
    const onDeactivated = (event) => {
      dispatch(deleteSession());
      dispatch(
        setAccountAccessError(
          event.detail?.message ||
            'Your customer support account has been deactivated by the administrator. You cannot log in. Please contact your administrator for assistance.'
        )
      );
      dispatch(navigateTabThunk('login'));
    };
    window.addEventListener('c2b_account_deactivated', onDeactivated);
    return () => window.removeEventListener('c2b_account_deactivated', onDeactivated);
  }, [dispatch]);

  // Load Initial Data & Cross-Portal Sync via Redux Thunks
  useEffect(() => {
    dispatch(fetchTicketsThunk());
    dispatch(fetchRefundsThunk());
    dispatch(fetchCustomersThunk());
    dispatch(fetchNotificationsThunk());

    let syncChannel = null;
    try {
      syncChannel = getSyncChannel();
      if (syncChannel) {
        syncChannel.onmessage = (event) => {
          const msg = event?.data;
          if (msg) {
            if (msg.type === 'NEW_CUSTOMER_TICKET') {
              dispatch(
                showToastThunk(
                  `🔔 New Ticket Received: #${msg.ticket?.requestId || msg.ticket?.id || 'Customer Query'}`,
                  'info'
                )
              );
              dispatch(fetchTicketsThunk(true));
            } else if (msg.type === 'TICKET_RESOLVED' || msg.type === 'TICKET_UPDATED') {
              dispatch(fetchTicketsThunk(true));
            }
          }
        };
      }
    } catch (_) {}

    const handleDataChanged = (e) => {
      const key = e?.detail?.key;
      if (!key || key === STORAGE_KEYS.TICKETS) {
        dispatch(fetchTicketsThunk(true));
      }
      if (!key || key === STORAGE_KEYS.REFUNDS) {
        dispatch(fetchRefundsThunk(true));
      }
    };
    window.addEventListener('c2b_data_changed', handleDataChanged);

    const handleVisibility = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        dispatch(fetchTicketsThunk(true));
        dispatch(fetchRefundsThunk(true));
      }
    };
    window.addEventListener('focus', handleVisibility);
    document.addEventListener('visibilitychange', handleVisibility);

    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (['dashboard', 'tickets', 'escalated', 'customers', 'refunds'].includes(hash)) {
        dispatch(navigateTabThunk(hash));
      }
    };
    window.addEventListener('hashchange', handleHashChange);

    const timer = setInterval(() => {
      dispatch(fetchTicketsThunk());
      dispatch(fetchRefundsThunk());
    }, 4000);

    return () => {
      clearInterval(timer);
      window.removeEventListener('c2b_data_changed', handleDataChanged);
      window.removeEventListener('focus', handleVisibility);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [dispatch]);

  if (!isAuthenticated) {
    return (
      <>
        <Login />
        <Toast />
      </>
    );
  }

  return (
    <div className="app-container">
      <Sidebar />

      <div className="main-area">
        <Header />

        <main className="content-body">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'tickets' && <Tickets />}
          {activeTab === 'escalated' && <EscalatedIssues />}
          {activeTab === 'customers' && <CustomerLookup />}
          {activeTab === 'refunds' && <Refunds />}
        </main>
      </div>

      <NotificationDrawer />
      {selectedTicketId && <TicketDetailModal />}
      {resolutionTicketId && <ResolutionWorkflowModal />}
      <Toast />
    </div>
  );
}
