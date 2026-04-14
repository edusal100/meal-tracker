import { useState, useRef, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const C = {
  accent:      '#534AB7',
  accentLight: '#EEEDFE',
  accentMid:   '#AFA9EC',
  border:      '#e8e6f0',
  surface:     '#fafaf9',
  text:        '#1a1a2e',
  muted:       '#888',
};

// Inject hover + range fill styles once
const STYLE_ID = 'rdp-custom-styles';
if (!document.getElementById(STYLE_ID)) {
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = `
    .rdp-day:not(.rdp-day_disabled):not(.rdp-day_selected):hover {
      background: ${C.accentLight} !important;
      color: ${C.accent} !important;
    }
    .rdp-day_range_middle {
      background: ${C.accentLight} !important;
      color: ${C.accent} !important;
      border-radius: 0 !important;
    }
    .rdp-day_range_start,
    .rdp-day_range_end {
      background: ${C.accent} !important;
      color: #fff !important;
      border-radius: 8px !important;
    }
  `;
  document.head.appendChild(el);
}

const pickerStyles = {
  root: {
    fontFamily: "'DM Sans', system-ui, sans-serif",
    fontSize: 13,
    color: C.text,
    margin: 0,
  },
  months: { display: 'flex' },
  month:  { width: '100%' },
  caption: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 4px',
    marginBottom: 8,
  },
  caption_label: {
    fontSize: 13,
    fontWeight: 600,
    color: C.text,
    letterSpacing: '0.01em',
    textTransform: 'capitalize',
  },
  nav: { display: 'flex', gap: 4 },
  nav_button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderRadius: 8,
    border: `1px solid ${C.border}`,
    background: '#fff',
    cursor: 'pointer',
    color: C.muted,
    padding: 0,
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  head_cell: {
    fontSize: 11,
    fontWeight: 600,
    color: C.muted,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    padding: '4px 0',
    textAlign: 'center',
    width: 36,
  },
  cell: { textAlign: 'center', padding: '2px 0' },
  day: {
    width: 34,
    height: 34,
    borderRadius: 8,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: 13,
    color: C.text,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.12s, color 0.12s',
  },
  day_selected: {
    background: C.accent,
    color: '#fff',
    fontWeight: 600,
    borderRadius: 8,
  },
  day_today: {
    fontWeight: 700,
    color: C.accent,
  },
  day_outside: { color: C.muted, opacity: 0.4 },
  day_disabled: { color: C.muted, opacity: 0.3, cursor: 'default' },
};

// Props:
//   value    — { from: 'YYYY-MM-DD', to: 'YYYY-MM-DD' } or null
//   onChange — called with { from, to } (both YYYY-MM-DD), or { from, to: null } while picking
//   max      — 'YYYY-MM-DD' string (optional)
export default function DatePickerInput({ value, onChange, max, style }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const today   = new Date();
  const maxDate = max ? parseISO(max) : undefined;

  // Convert string values → Date for DayPicker
  const range = {
    from: value?.from ? parseISO(value.from) : undefined,
    to:   value?.to   ? parseISO(value.to)   : undefined,
  };

  const handleSelect = (r) => {
    if (!r) return;
    const from = r.from ? format(r.from, 'yyyy-MM-dd') : null;
    const to   = r.to   ? format(r.to,   'yyyy-MM-dd') : null;
    onChange({ from, to });
    // close if both ends set (range) OR single day click (from === to or only from)
    if (r.to || (r.from && !r.to)) {
        // if user clicked same day as start, it's a single day — close
        // if to is set, range is complete — close
        const isComplete = r.to ? true : isSameDay(r.from, range.from ?? r.from);
        if (isComplete) setOpen(false);
    }
    };

  // Label
  const todayStr = format(today, 'yyyy-MM-dd');
  const fmt = (d) => {
    const iso = format(parseISO(d), 'yyyy-MM-dd');
    return iso === todayStr
      ? `Hoy`
      : format(parseISO(d), 'd MMM', { locale: es });
  };

  const label = !value?.from
    ? 'Seleccionar fecha'
    : !value.to || value.from === value.to
      ? fmt(value.from)
      : `${fmt(value.from)} — ${fmt(value.to)}`;

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>

      {/* Trigger */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          padding: '8px 12px',
          fontSize: 13,
          border: `1px solid ${open ? C.accentMid : C.border}`,
          borderRadius: 8,
          background: open ? C.accentLight : C.surface,
          color: C.text,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          minWidth: 180,
          userSelect: 'none',
          transition: 'border 0.15s, background 0.15s',
          ...style,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke={open ? C.accent : C.muted}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0 }}>
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <path d="M16 2v4M8 2v4M3 10h18"/>
        </svg>
        <span style={{ flex: 1, textTransform: 'capitalize' }}>{label}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke={C.muted} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </div>

      {/* Popover */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          zIndex: 100,
          background: '#fff',
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          padding: '14px 16px',
          boxShadow: '0 4px 24px rgba(83,74,183,0.10), 0 1px 4px rgba(0,0,0,0.06)',
          minWidth: 260,
        }}>
          <DayPicker
            mode="range"
            selected={range}
            onSelect={handleSelect}
            disabled={maxDate ? { after: maxDate } : undefined}
            locale={es}
            styles={pickerStyles}
          />
        </div>
      )}
    </div>
  );
}