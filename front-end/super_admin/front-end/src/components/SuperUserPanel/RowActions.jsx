/** Edit (pencil) and delete (bin) buttons for one row, or a "read-only" label. */
export default function RowActions({ readOnly, onEdit, onDelete }) {
  return (
    <div className="c2b-td-actions">
      {readOnly ? (
        <span className="c2b-ro-badge">read-only</span>
      ) : (
        <>
          <button className="c2b-btn-icon edit" title="Edit" onClick={onEdit}>
            ✏️
          </button>
          <button className="c2b-btn-icon trash" title="Delete" onClick={onDelete}>
            🗑️
          </button>
        </>
      )}
    </div>
  );
}
