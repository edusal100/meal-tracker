import { useState } from 'react';
import { nukeData } from '../services/nukeService';
import { C } from '../theme';

const WARNING_ICON = (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
    stroke="#dc2626" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const ITEMS = [
  {
    key: 'mealTypes',
    label: 'Tipos de comida y horarios',
    sublabel: 'Elimina todos los tipos de comida, horarios y número de estación',
  },
  {
    key: 'mealRecords',
    label: 'Registros de comidas',
    sublabel: 'Elimina todo el historial de escaneos y comidas registradas',
  },
  {
    key: 'employees',
    label: 'Empleados',
    sublabel: 'Elimina toda la base de datos de empleados',
  },
];

export default function NukeModal({ onClose, onDone }) {
  const [checked, setChecked] = useState({ mealTypes: true, mealRecords: true, employees: true });
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const toggle = (key) => setChecked(prev => ({ ...prev, [key]: !prev[key] }));
  const anyChecked = Object.values(checked).some(Boolean);
  const CONFIRM_WORD = 'ELIMINAR';

  const handleDelete = async () => {
    if (confirmText !== CONFIRM_WORD) return;
    setLoading(true);
    try {
      await nukeData(checked);
      onDone();
    } finally {
      setLoading(false);
    }
  };

  return (
    // Backdrop
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000
      }}
    >
      {/* Modal box */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 14, padding: '28px 28px 24px',
          width: 420, maxWidth: '95vw', boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          display: 'flex', flexDirection: 'column', gap: 20
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' }}>
          {WARNING_ICON}
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111' }}>
            Restablecer estación
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: '#dc2626', fontWeight: 600 }}>
            ⚠ ADVERTENCIA: Esta acción no se puede deshacer
          </p>
          <p style={{ margin: 0, fontSize: 13, color: '#555' }}>
            Selecciona qué datos deseas eliminar permanentemente. Útil para configurar esta PC como una nueva estación.
          </p>
        </div>

        {/* Checkboxes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ITEMS.map(({ key, label, sublabel }) => (
            <label
              key={key}
              style={{
                display: 'flex', gap: 12, alignItems: 'flex-start',
                background: checked[key] ? '#fef2f2' : '#f9f9f9',
                border: `1.5px solid ${checked[key] ? '#fca5a5' : '#e5e5e5'}`,
                borderRadius: 8, padding: '10px 12px', cursor: 'pointer',
                transition: 'background 0.15s, border-color 0.15s'
              }}
            >
              <input
                type="checkbox"
                checked={checked[key]}
                onChange={() => toggle(key)}
                style={{ marginTop: 2, accentColor: '#dc2626', width: 16, height: 16, cursor: 'pointer' }}
              />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{label}</div>
                <div style={{ fontSize: 12, color: '#777', marginTop: 2 }}>{sublabel}</div>
              </div>
            </label>
          ))}
        </div>

        {/* Confirm step */}
        {!confirming ? (
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1, padding: '9px 0', border: '1.5px solid #e0e0e0',
                borderRadius: 8, background: '#fff', cursor: 'pointer',
                fontSize: 13, fontWeight: 600, color: '#555'
              }}
            >
              Cancelar
            </button>
            <button
              disabled={!anyChecked}
              onClick={() => setConfirming(true)}
              style={{
                flex: 1, padding: '9px 0', border: 'none',
                borderRadius: 8, background: anyChecked ? '#dc2626' : '#f5c6c6',
                cursor: anyChecked ? 'pointer' : 'not-allowed',
                fontSize: 13, fontWeight: 700, color: '#fff'
              }}
            >
              Continuar
            </button>
          </div>
        ) : (
          /* Final confirmation */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ margin: 0, fontSize: 13, color: '#555', textAlign: 'center' }}>
              Escribe <strong style={{ color: '#dc2626' }}>{CONFIRM_WORD}</strong> para confirmar:
            </p>
            <input
              autoFocus
              value={confirmText}
              onChange={e => setConfirmText(e.target.value.toUpperCase())}
              placeholder={CONFIRM_WORD}
              style={{
                padding: '8px 12px', borderRadius: 8, fontSize: 14, fontWeight: 600,
                border: `1.5px solid ${confirmText === CONFIRM_WORD ? '#dc2626' : '#e0e0e0'}`,
                outline: 'none', textAlign: 'center', letterSpacing: 2, color: '#111'
              }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => { setConfirming(false); setConfirmText(''); }}
                style={{
                  flex: 1, padding: '9px 0', border: '1.5px solid #e0e0e0',
                  borderRadius: 8, background: '#fff', cursor: 'pointer',
                  fontSize: 13, fontWeight: 600, color: '#555'
                }}
              >
                Atrás
              </button>
              <button
                disabled={confirmText !== CONFIRM_WORD || loading}
                onClick={handleDelete}
                style={{
                  flex: 1, padding: '9px 0', border: 'none',
                  borderRadius: 8,
                  background: confirmText === CONFIRM_WORD ? '#dc2626' : '#f5c6c6',
                  cursor: confirmText === CONFIRM_WORD ? 'pointer' : 'not-allowed',
                  fontSize: 13, fontWeight: 700, color: '#fff'
                }}
              >
                {loading ? 'Eliminando...' : 'Eliminar todo'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}