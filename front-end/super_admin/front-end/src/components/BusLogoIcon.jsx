/** The Click2Book bus mark. `windows` adds the three window panes used in the portal sidebars. */
export default function BusLogoIcon({ size = 20, windows = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="8" width="20" height="12" rx="3" fill="white" opacity=".9" />
      <rect x="5" y="5" width="14" height="5" rx="2" fill="white" opacity=".6" />
      <circle cx="6.5" cy="20" r="1.5" fill="#f97316" />
      <circle cx="17.5" cy="20" r="1.5" fill="#f97316" />
      {windows && (
        <>
          <rect x="7" y="11" width="3" height="3" rx=".5" fill="#1e3a5f" opacity=".6" />
          <rect x="11" y="11" width="3" height="3" rx=".5" fill="#1e3a5f" opacity=".6" />
          <rect x="15" y="11" width="3" height="3" rx=".5" fill="#1e3a5f" opacity=".6" />
        </>
      )}
    </svg>
  );
}
