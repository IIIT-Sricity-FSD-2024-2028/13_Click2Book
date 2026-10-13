/**
 * System-wide announcement + maintenance notice set by the Super Admin.
 * Shown as a floating card so it never shifts a page's own layout.
 * Settings are re-fetched on every navigation, so changes appear on the
 * next page the user opens.
 */
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { loadPlatformSettings, usePlatformSettings } from '../lib/platformSettings';
import './PlatformBanner.css';

/** Which audience a path belongs to (admin pages see the preview in Settings instead). */
function audienceOf(path) {
  if (path.startsWith('/admin')) return null;
  if (path.startsWith('/provider')) return 'PROVIDER';
  if (path.startsWith('/support')) return 'SUPPORT';
  return 'CUSTOMER';
}

const ICON = { info: '📣', warning: '⚠️', success: '✅' };

export default function PlatformBanner() {
  const { pathname } = useLocation();
  const settings = usePlatformSettings();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('c2b_dismissedAnnouncement') || '';
    } catch {
      return '';
    }
  });

  useEffect(() => {
    loadPlatformSettings(true);
  }, [pathname]);

  const audience = audienceOf(pathname);
  if (!audience) return null;

  const { announcement, announcementLevel, audience: target } = settings.notifications;
  const showAnnouncement = announcement && (target === 'ALL' || target === audience) && dismissed !== announcement;
  const showMaintenance = settings.security.maintenanceMode && audience === 'CUSTOMER';
  if (!showAnnouncement && !showMaintenance) return null;

  const dismiss = () => {
    setDismissed(announcement);
    try {
      sessionStorage.setItem('c2b_dismissedAnnouncement', announcement);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="c2b-platform-banners" role="status" aria-live="polite">
      {showMaintenance && (
        <div className="c2b-banner maintenance" id="maintenanceBanner">
          <span>🛠️</span>
          <span>
            <strong>Scheduled maintenance.</strong> New bookings and sign-ups are paused for now — existing tickets are not affected.
          </span>
        </div>
      )}
      {showAnnouncement && (
        <div className={`c2b-banner ${announcementLevel}`} id="announcementBanner">
          <span>{ICON[announcementLevel] || '📣'}</span>
          <span>{announcement}</span>
          <button onClick={dismiss} aria-label="Dismiss announcement">
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
