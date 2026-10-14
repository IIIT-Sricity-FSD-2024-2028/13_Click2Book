/**
 * Search input with a live suggestions dropdown.
 *
 * `items` is the full list the page can search: { key, label, sub?, tag?, value?, fields }.
 * An item matches when any of its `fields` contains the query (case-insensitive);
 * pages pass the record's name, or its ID when it has none. Picking a suggestion puts its
 * `value` (default: `label`) into the search box, narrowing the table to it.
 *
 * Keyboard: ↑/↓ move, Enter picks (or just closes when nothing is highlighted),
 * Esc closes, Esc again clears.  
 */
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import './SearchSuggest.css';

const MAX_SUGGESTIONS = 8;

/** Wrap the first occurrence of `q` in <mark>. */
function Highlight({ text, q }) {
  const s = String(text ?? '');
  const i = q ? s.toLowerCase().indexOf(q) : -1;
  if (i < 0) return s;
  return (
    <>
      {s.slice(0, i)}
      <mark>{s.slice(i, i + q.length)}</mark>
      {s.slice(i + q.length)}
    </>
  );
}

export default function SearchSuggest({ value, onChange, items = [], placeholder = 'Search…', inputId, className = '', emptyText }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const listId = useId();

  const q = value.trim().toLowerCase();

  const { shown, total } = useMemo(() => {
    if (!q) return { shown: [], total: 0 };
    const hits = items.filter((it) => it.fields.some((f) => String(f ?? '').toLowerCase().includes(q)));
    // Exact / prefix matches on the label first, then the rest in original order.
    const rank = (it) => {
      const l = String(it.label ?? '').toLowerCase();
      return l === q ? 0 : l.startsWith(q) ? 1 : 2;
    };
    const sorted = hits.map((it, i) => [it, i]).sort((a, b) => rank(a[0]) - rank(b[0]) || a[1] - b[1]);
    return { shown: sorted.slice(0, MAX_SUGGESTIONS).map(([it]) => it), total: hits.length };
  }, [items, q]);

  useEffect(() => setActive(-1), [q]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => rootRef.current && !rootRef.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const pick = (it) => {
    onChange(String(it.value ?? it.label));
    setOpen(false);
    inputRef.current?.blur();
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((a) => (shown.length ? (a + 1) % shown.length : -1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (shown.length ? (a <= 0 ? shown.length - 1 : a - 1) : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (open && active >= 0 && shown[active]) pick(shown[active]);
      else setOpen(false);
    } else if (e.key === 'Escape') {
      if (open && q) setOpen(false);
      else onChange('');
    }
  };

  const showDropdown = open && q !== '';

  return (
    <div className={'ss-root ' + className} ref={rootRef}>
      <svg className="ss-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
      <input
        ref={inputRef}
        id={inputId}
        className="ss-input"
        type="text"
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        spellCheck={false}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {value && (
        <button
          type="button"
          className="ss-clear"
          aria-label="Clear search"
          title="Clear search"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            onChange('');
            inputRef.current?.focus();
          }}
        >
          ✕
        </button>
      )}

      {showDropdown && (
        <div className="ss-dropdown">
          <div className="ss-head">
            {total === 0 ? 'No matches' : `${total} match${total === 1 ? '' : 'es'}${total > shown.length ? ` · showing top ${shown.length}` : ''}`}
          </div>
          {total === 0 ? (
            <div className="ss-empty">{emptyText || `Nothing matches “${value.trim()}”.`}</div>
          ) : (
            <ul className="ss-list" id={listId} role="listbox">
              {shown.map((it, i) => (
                <li
                  key={it.key}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  className={'ss-item' + (i === active ? ' active' : '')}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(it)}
                >
                  <div className="ss-text">
                    <span className="ss-label">
                      <Highlight text={it.label} q={q} />
                    </span>
                    {it.sub && (
                      <span className="ss-sub">
                        <Highlight text={it.sub} q={q} />
                      </span>
                    )}
                  </div>
                  {it.tag && <span className="ss-tag">{it.tag}</span>}
                </li>
              ))}
            </ul>
          )}
          <div className="ss-foot">
            <span>
              <kbd>↑</kbd>
              <kbd>↓</kbd> navigate
            </span>
            <span>
              <kbd>Enter</kbd> select
            </span>
            <span>
              <kbd>Esc</kbd> close
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
