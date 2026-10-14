/**
 * Add Record, Reset DB, and Logout buttons. On the Super Admin page
 * (`alwaysOpen`) the last button logs out; elsewhere it closes the panel.
 */
export default function HeaderActions({ onAdd, onReset, alwaysOpen, onLogout, onClosePanel }) {
  return (
    <>
      <button className="c2b-btn c2b-btn-primary" onClick={onAdd}>
        + Add Record
      </button>
      <button className="c2b-btn c2b-btn-danger" onClick={onReset}>
        ⚠ Reset DB
      </button>
      {alwaysOpen ? (
        <button className="c2b-btn c2b-btn-ghost" id="c2b-logout" onClick={onLogout}>
          ⎋ Logout
        </button>
      ) : (
        <button className="c2b-btn-close" title="Close Panel" onClick={onClosePanel}>
          ✕
        </button>
      )}
    </>
  );
}
