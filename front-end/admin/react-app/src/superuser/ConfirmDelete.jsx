export default function ConfirmDelete({ pkField, pkValue, onCancel, onConfirm }) {
  return (
    <div id="c2b-confirmOverlay" onClick={(event) => event.target === event.currentTarget && onCancel()}>
      <div className="c2b-confirm-box" role="alertdialog" aria-labelledby="c2b-confirmTitle">
        <div className="c2b-confirm-icon">🗑️</div>
        <h3 id="c2b-confirmTitle">Delete Record?</h3>
        <p>Delete {pkField} = "{String(pkValue)}"? This action cannot be undone.</p>
        <div className="c2b-confirm-actions">
          <button type="button" className="c2b-btn c2b-btn-ghost" onClick={onCancel}>Cancel</button>
          <button type="button" className="c2b-btn c2b-btn-danger" onClick={onConfirm}>Yes, Delete</button>
        </div>
      </div>
    </div>
  );
}
