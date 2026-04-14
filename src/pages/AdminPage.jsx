import { useEffect, useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  getMealTypesWithTimeframes,
  addMealType,
  renameMealType,
  addTimeframe,
  updateTimeframe,
  deleteTimeframe
} from '../services/configService';
import {
  getEmployees,
  deleteAllEmployees,
  bulkImportEmployees
} from '../services/employeeService';
import { getSetting, setSetting } from '../services/settingsService';
import { exportSettings, importSettings } from '../services/settingsPortService';
import NukeModal from '../components/NukeModal';
import { C } from '../theme';


const s = {
  card: {
    background: '#fff',
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    padding: '18px 20px',
    marginBottom: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: C.muted,
    marginBottom: 6,
    display: 'block',
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '9px 12px',
    fontSize: 14,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    background: C.surface,
    color: C.text,
    outline: 'none',
  },
  btnPrimary: {
    padding: '9px 18px',
    fontSize: 13,
    fontWeight: 500,
    background: C.accent,
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  btnGhost: {
    padding: '7px 14px',
    fontSize: 12,
    fontWeight: 500,
    background: 'transparent',
    color: C.accent,
    border: `1px solid ${C.accentMid}`,
    borderRadius: 8,
    cursor: 'pointer',
  },
  btnDanger: {
    padding: '7px 14px',
    fontSize: 12,
    fontWeight: 500,
    background: C.dangerLight,
    color: C.danger,
    border: `1px solid #f0a0a0`,
    borderRadius: 8,
    cursor: 'pointer',
  },
  timeInput: {
    padding: '7px 10px',
    fontSize: 13,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    background: C.surface,
    color: C.text,
    outline: 'none',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: C.accent,
    paddingBottom: 8,
    borderBottom: `2px solid ${C.accentLight}`,
  },
  pill: (active) => ({
    display: 'inline-block',
    padding: '2px 10px',
    fontSize: 11,
    fontWeight: 500,
    borderRadius: 20,
    background: active ? C.accentLight : '#f0f0f0',
    color: active ? C.accent : C.muted,
  }),
};

// ─── Station Section ───────────────────────────────────────────────────────────
function StationSection({ onSetupComplete }) {
  const [value, setValue] = useState('');
  const [saved, setSaved] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    getSetting('stationNumber').then(v => setValue(v ?? ''));
  }, []);

  const handleSave = async () => {
    await setSetting('stationNumber', value.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onSetupComplete?.();
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await importSettings(file);
      alert('Configuración importada correctamente.');
    } catch (err) {
      alert('Error al importar: ' + err.message);
    }
    e.target.value = '';
  };

  return (
    <section style={{
      background: '#fff',
      border: `1px solid ${C.border}`,
      borderRadius: 12,
      padding: '18px 20px',
      flex: '1 1 260px',
      minWidth: 0,
      alignSelf: 'stretch',
      boxSizing: 'border-box',
    }}>
      <p style={{ ...s.sectionTitle, marginTop: 0, marginBottom: 16 }}>
        Estación &amp; configuración
      </p>

      {/* Two sub-groups side by side, wrap when tight */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
        <div style={{ flex: '1 1 160px', minWidth: 0 }}>
          <span style={s.label}>Número de estación</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              style={{ ...s.input, maxWidth: 160 }}
              value={value}
              onChange={e => setValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              placeholder="ej. 1"
            />
            <button style={s.btnPrimary} onClick={handleSave}>
              {saved ? '✓ Guardado' : 'Guardar'}
            </button>
          </div>
        </div>

        <div style={{ flex: '1 1 160px', minWidth: 0 }}>
          <span style={s.label}>Configuración</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={s.btnGhost} onClick={exportSettings}>Exportar</button>
            <button style={s.btnGhost} onClick={() => fileRef.current.click()}>Importar</button>
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleImport}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Danger Section ────────────────────────────────────────────────────────────
function DangerSection() {
  const [showNuke, setShowNuke] = useState(false);

  return (
    <>
      <section style={{
        background: '#fff',
        border: `1.5px solid #fca5a5`,
        borderRadius: 12,
        padding: '18px 20px',
        flex: '1 1 260px',
        minWidth: 0,
        alignSelf: 'stretch',
        boxSizing: 'border-box',
      }}>
        {/* Title */}
        <p style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#dc2626',
          paddingBottom: 8,
          borderBottom: `2px solid #fee2e2`,
          marginTop: 0,
          marginBottom: 16,
        }}>
          ⚠ Zona de peligro
        </p>

        <p style={{ margin: '0 0 14px', fontSize: 13, color: '#666', lineHeight: 1.5 }}>
          Elimina datos de esta estación de forma permanente. Útil para
          reconfigurar este equipo en otra planta o iniciar desde cero.
        </p>

        <button
          onClick={() => setShowNuke(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '9px 16px',
            background: '#fef2f2',
            border: '1.5px solid #fca5a5',
            borderRadius: 8,
            color: '#dc2626',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.2"
            strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
          Restablecer / Nueva estación
        </button>
      </section>

      {showNuke && (
        <NukeModal
          onClose={() => setShowNuke(false)}
          onDone={() => {
            setShowNuke(false);
            location.reload();
          }}
        />
      )}
    </>
  );
}

// ─── MealType section ─────────────────────────────────────────────────────────
function MealTypeSection({ onSetupComplete }) {
  const [data, setData]           = useState([]);
  const [newMealType, setNewMealType] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [draftName, setDraftName] = useState('');
  const renameInputRef = useRef();

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (editingId !== null) renameInputRef.current?.focus();
  }, [editingId]);

  const load = async () => setData(await getMealTypesWithTimeframes());

  const handleAddMealType = async () => {
    if (!newMealType.trim()) return;
    await addMealType(newMealType.trim());
    setNewMealType('');
    load();
    onSetupComplete?.();
  };

  const handleStartEdit = (type) => {
    setEditingId(type.id);
    setDraftName(type.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setDraftName('');
  };

  const handleSaveEdit = async (id) => {
    const trimmed = draftName.trim();
    if (trimmed) await renameMealType(id, trimmed);
    setEditingId(null);
    setDraftName('');
    load();
  };

  const handleAddTimeframe = async (id)       => { await addTimeframe(id);               load(); };
  const handleChange       = async (id, f, v) => { await updateTimeframe(id, { [f]: v }); load(); };
  const handleDelete       = async (id)       => { await deleteTimeframe(id);             load(); };

  return (
    <section>
      <p style={{ ...s.sectionTitle, marginTop: 0, marginBottom: 16 }}>
        Tipo de comidas &amp; tiempos
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          style={s.input}
          value={newMealType}
          onChange={e => setNewMealType(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAddMealType()}
          placeholder="Nuevo tipo de comida…"
        />
        <button style={s.btnPrimary} onClick={handleAddMealType}>Agregar</button>
      </div>

      {data.length === 0 && (
        <p style={{ fontSize: 13, color: C.muted }}>No hay tipos de comidas configurados.</p>
      )}

      {data.map(type => (
        <div key={type.id} style={s.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>

            {editingId === type.id ? (
              <>
                <input
                  ref={renameInputRef}
                  style={{ ...s.input, flex: 1, padding: '6px 10px', fontSize: 14, fontWeight: 600 }}
                  value={draftName}
                  onChange={e => setDraftName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter')  handleSaveEdit(type.id);
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                />
                <button
                  style={{ ...s.btnPrimary, padding: '6px 14px', fontSize: 12 }}
                  onClick={() => handleSaveEdit(type.id)}
                >
                  Guardar
                </button>
                <button
                  style={{ ...s.btnGhost, padding: '6px 12px', fontSize: 12 }}
                  onClick={handleCancelEdit}
                >
                  Cancelar
                </button>
              </>
            ) : (
              <>
                <span style={{ fontSize: 14, fontWeight: 600, color: C.text, flex: 1 }}>
                  {type.name}
                </span>
                <span style={s.pill(type.timeframes.length > 0)}>
                  {type.timeframes.length} tiempo{type.timeframes.length !== 1 ? 's' : ''}
                </span>
                <button
                  title="Renombrar tipo de comida"
                  onClick={() => handleStartEdit(type)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '5px 7px',
                    background: 'transparent',
                    border: `1px solid ${C.border}`,
                    borderRadius: 7,
                    cursor: 'pointer',
                    color: C.muted,
                    lineHeight: 1,
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
              </>
            )}
          </div>

          {type.timeframes.map(tf => (
            <div key={tf.id} style={{
              display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8,
              marginBottom: 8, paddingBottom: 8,
              borderBottom: `1px solid ${C.border}`,
            }}>
              <span style={{ fontSize: 11, color: C.muted }}>de</span>
              <input
                type="time"
                style={{ ...s.timeInput, flex: '1 1 80px', minWidth: 0, boxSizing: 'border-box' }}
                value={tf.start}
                onChange={e => handleChange(tf.id, 'start', e.target.value)}
              />
              <span style={{ fontSize: 11, color: C.muted }}>a</span>
              <input
                type="time"
                style={{ ...s.timeInput, flex: '1 1 80px', minWidth: 0, boxSizing: 'border-box' }}
                value={tf.end}
                onChange={e => handleChange(tf.id, 'end', e.target.value)}
              />
              <button
                style={{ ...s.btnDanger, padding: '5px 10px', flexShrink: 0 }}
                onClick={() => handleDelete(tf.id)}
              >
                Remover
              </button>
            </div>
          ))}

          <button style={s.btnGhost} onClick={() => handleAddTimeframe(type.id)}>
            + Agregar tiempo
          </button>
        </div>
      ))}
    </section>
  );
}

// ─── Employee Import section ──────────────────────────────────────────────────
const REQUIRED_COLS = ['employeeId', 'name', 'company'];

function EmployeeImportSection({ onSetupComplete }) {
  const [employees, setEmployees] = useState([]);
  const [preview, setPreview]     = useState(null);
  const [status, setStatus]       = useState('');
  const [dragging, setDragging]   = useState(false);
  const fileRef = useRef();

  useEffect(() => { loadEmployees(); }, []);

  const loadEmployees = async () => setEmployees(await getEmployees());

  const parseFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb   = XLSX.read(e.target.result, { type: 'array' });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

        const errors = [];
        if (rows.length === 0) {
          errors.push('El archivo está vacío.');
        } else {
          const missing = REQUIRED_COLS.filter(c => !(c in rows[0]));
          if (missing.length > 0)
            errors.push(`Columnas faltantes: ${missing.join(', ')}`);
        }

        setPreview({ rows, fileName: file.name, errors });
        setStatus('');
      } catch {
        setPreview({ rows: [], fileName: file.name, errors: ['No se pudo leer el archivo.'] });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFilePick = (e) => {
    const file = e.target.files[0];
    if (file) parseFile(file);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  };

  const handleImport = async () => {
    if (!preview || preview.errors.length > 0) return;
    await deleteAllEmployees();
    await bulkImportEmployees(preview.rows);
    await loadEmployees();
    setPreview(null);
    setStatus(`✓ Importados ${preview.rows.length} empleados`);
    onSetupComplete?.();
  };

  const handleClear = async () => {
    if (!window.confirm('¿Borrar todos los empleados?')) return;
    await deleteAllEmployees();
    await loadEmployees();
    setPreview(null);
    setStatus('Todos los empleados han sido borrados.');
  };

  const dropZoneStyle = {
    border: `2px dashed ${dragging ? C.accent : C.border}`,
    borderRadius: 12,
    padding: '28px 20px',
    textAlign: 'center',
    background: dragging ? C.accentLight : C.surface,
    cursor: 'pointer',
    transition: 'all 0.15s',
    marginBottom: 16,
  };

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <p style={{ ...s.sectionTitle, marginBottom: 0, marginTop: 0, borderBottom: 'none', paddingBottom: 0 }}>
          Importar Empleados
        </p>
        {employees.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={s.pill(true)}>{employees.length} empleados</span>
            <button style={s.btnDanger} onClick={handleClear}>Borrar todos</button>
          </div>
        )}
      </div>
      <div style={{ borderBottom: `2px solid ${C.accentLight}`, marginBottom: 12 }} />

      <div
        style={dropZoneStyle}
        onClick={() => fileRef.current.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <div style={{ fontSize: 28, marginBottom: 8, color: C.accentMid }}>⬆</div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: C.text }}>
          Haz click o arrastra un archivo de Excel
        </p>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: C.muted }}>
          .xlsx / .xls — columnas requeridas: <code>employeeId</code>, <code>name</code>, <code>company</code>
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls"
          style={{ display: 'none' }}
          onChange={handleFilePick}
        />
      </div>

      {preview && (
        <div style={s.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text, flex: 1 }}>
              {preview.fileName}
            </span>
            <span style={s.pill(preview.errors.length === 0)}>
              {preview.rows.length} filas
            </span>
          </div>

          {preview.errors.length > 0 ? (
            <div style={{
              background: C.dangerLight, color: C.danger,
              border: `1px solid #f0a0a0`, borderRadius: 8, padding: '10px 14px',
              fontSize: 13,
            }}>
              {preview.errors.map((e, i) => <div key={i}>⚠ {e}</div>)}
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto', marginBottom: 14 }}>
                <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: C.accentLight }}>
                      {REQUIRED_COLS.map(c => (
                        <th key={c} style={{
                          padding: '6px 10px', textAlign: 'left',
                          color: C.accent, fontWeight: 600,
                          fontSize: 11, letterSpacing: '0.06em',
                        }}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.slice(0, 5).map((row, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                        {REQUIRED_COLS.map(c => (
                          <td key={c} style={{ padding: '6px 10px', color: C.text }}>
                            {String(row[c] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.rows.length > 5 && (
                  <p style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>
                    …y {preview.rows.length - 5} filas más
                  </p>
                )}
              </div>

              {employees.length > 0 && (
                <div style={{
                  background: '#FFF8E1', border: '1px solid #FFD54F',
                  borderRadius: 8, padding: '8px 12px', fontSize: 12,
                  color: '#7a5800', marginBottom: 12,
                }}>
                  ⚠ Esto reemplazará los {employees.length} empleados existentes.
                </div>
              )}

              <button style={s.btnPrimary} onClick={handleImport}>
                {employees.length > 0 ? 'Reemplazar e importar' : 'Importar'}
              </button>
            </>
          )}
        </div>
      )}

      {status && (
        <p style={{ fontSize: 13, color: C.accent, fontWeight: 500, marginTop: 8 }}>
          {status}
        </p>
      )}

      {employees.length > 0 && !preview && (
        <div style={{ marginTop: 16 }}>
          <span style={s.label}>Empleados Actuales</span>
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
            {employees.slice(0, 8).map((emp, i) => (
              <div key={emp.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 14px',
                borderBottom: i < Math.min(employees.length, 8) - 1 ? `1px solid ${C.border}` : 'none',
                background: i % 2 === 0 ? '#fff' : C.surface,
                fontSize: 13,
              }}>
                <span style={{ color: C.muted, minWidth: 60, fontSize: 11 }}>{emp.employeeId}</span>
                <span style={{ flex: 1, fontWeight: 500, color: C.text }}>{emp.name}</span>
                <span style={{ color: C.muted, fontSize: 12 }}>{emp.company}</span>
              </div>
            ))}
            {employees.length > 8 && (
              <div style={{
                padding: '8px 14px', fontSize: 12, color: C.muted,
                background: C.surface, borderTop: `1px solid ${C.border}`,
              }}>
                + {employees.length - 8} empleados más
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminPage({ onSetupComplete }) {
  return (
    <div style={{
      padding: '28px 24px',
      fontFamily: "'DM Sans', system-ui, sans-serif",
      color: C.text,
      overflowY: 'auto', flex: 1,
    }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: C.text, letterSpacing: '-0.01em' }}>
          Configuración
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: C.muted }}>
          Configura tipos de comidas, ajustes de estación y base de datos de empleados.
        </p>
      </div>

      {/* Row 1: Station + Danger — side by side, wrap on small screens, equal height */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 24, alignItems: 'stretch' }}>
        <StationSection onSetupComplete={onSetupComplete} />
        <DangerSection />
      </div>

      {/* Row 2: Meal types + Employees — side by side, wrap on small screens, equal height */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'stretch' }}>
        <div style={{
          flex: '1 1 300px', minWidth: 0,
          background: '#fff',
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          padding: '18px 20px',
          boxSizing: 'border-box',
        }}>
          <MealTypeSection onSetupComplete={onSetupComplete} />
        </div>
        <div style={{
          flex: '1 1 300px', minWidth: 0,
          background: '#fff',
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          padding: '18px 20px',
          boxSizing: 'border-box',
        }}>
          <EmployeeImportSection onSetupComplete={onSetupComplete} />
        </div>
      </div>
    </div>
  );
}