import { useState } from 'react';

const INPUT_TYPES = { number: 'number', date: 'date', time: 'time' };
const FULL_WIDTH_FIELDS = ['comment', 'description'];

function initialValues(fields, record) {
  return Object.fromEntries(fields.map((field) => {
    const fallback = field.type === 'select' ? field.options[0] : '';
    return [field.key, record?.[field.key] ?? fallback];
  }));
}

// Converts raw input strings to the stored shape: '' -> null, numbers cast.
function toRecord(fields, values) {
  return Object.fromEntries(fields.map((field) => {
    const raw = String(values[field.key] ?? '').trim();
    if (raw === '') return [field.key, null];
    return [field.key, field.type === 'number' ? Number(raw) : raw];
  }));
}

export default function RecordModal({ schema, record, onClose, onSave, onInvalid, remote = false, saving = false }) {
  const isEdit = record !== null;
  // The backend assigns IDs to new records.
  const autoId = (key) => remote && !isEdit && key === schema.pkField;
  const [values, setValues] = useState(() => initialValues(schema.fields, record));

  const setValue = (key, value) => setValues((current) => ({ ...current, [key]: value }));

  const save = (event) => {
    event.preventDefault();
    const data = toRecord(schema.fields, values);
    const missing = schema.fields.find((field) => (
      field.required && !((isEdit || autoId(field.key)) && field.key === schema.pkField) && data[field.key] == null
    ));
    if (missing) {
      onInvalid(`"${missing.label}" is required.`);
      document.getElementById(`c2bf_${missing.key}`)?.focus();
      return;
    }
    onSave(data);
  };

  return (
    <div id="c2b-modalOverlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <form className="c2b-modal" onSubmit={save} noValidate>
        <div className="c2b-modal-header">
          <h3>{isEdit ? 'Edit' : 'Add'} {schema.label} Record</h3>
          <button type="button" className="c2b-btn-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="c2b-modal-body">
          <div className="c2b-form">
            {schema.fields.map((field) => {
              const id = `c2bf_${field.key}`;
              const common = {
                id,
                name: field.key,
                value: values[field.key],
                required: field.required && !autoId(field.key),
                disabled: (isEdit || autoId(field.key)) && field.key === schema.pkField,
                ...(autoId(field.key) ? { placeholder: 'Assigned by backend' } : {}),
                onChange: (event) => setValue(field.key, event.target.value),
              };
              return (
                <div key={field.key} className={`c2b-form-field${FULL_WIDTH_FIELDS.includes(field.key) ? ' full' : ''}`}>
                  <label htmlFor={id}>{field.label}{field.required ? ' *' : ''}</label>
                  {field.type === 'select' ? (
                    <select {...common}>
                      {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  ) : (
                    <input
                      {...common}
                      type={INPUT_TYPES[field.type] || 'text'}
                      placeholder={field.label}
                      step={field.type === 'number' ? '0.01' : undefined}
                      min={field.type === 'number' ? '0' : undefined}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="c2b-modal-footer">
          <button type="button" className="c2b-btn c2b-btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="c2b-btn c2b-btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Record'}</button>
        </div>
      </form>
    </div>
  );
}
