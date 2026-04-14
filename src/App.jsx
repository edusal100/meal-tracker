import { useEffect, useState, useRef } from 'react';
import ScanPage from './pages/ScanPage';
import ReportPage from './pages/ReportPage';
import AdminPage from './pages/AdminPage';
import { getMealTypesWithTimeframes } from './services/configService';
import { getEmployees } from './services/employeeService';
import { getSetting } from './services/settingsService';
import { C } from './theme';

const NAV = [
  {
    id: 'scan',
    label: 'Inicio',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="5" height="5" rx="1"/>
        <rect x="16" y="3" width="5" height="5" rx="1"/>
        <rect x="3" y="16" width="5" height="5" rx="1"/>
        <path d="M16 16h5v5h-5z" opacity="0.4"/>
        <path d="M11 3v4M3 11h18M11 21v-6M21 11v10"/>
      </svg>
    )
  },
  {
    id: 'report',
    label: 'Reporte',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M7 8h10M7 12h10M7 16h6"/>
      </svg>
    )
  },
  {
    id: 'admin',
    label: 'Config',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    )
  }
];

function App() {
  const [page, setPage] = useState('scan');
  const [ready, setReady] = useState(null); // null = loading, false = needs setup, true = ready
  const [showSetupModal, setShowSetupModal] = useState(false);
  const setupModalSeenRef = useRef(false);

  const checkSetup = async () => {
    const [mealTypes, employees, station] = await Promise.all([
      getMealTypesWithTimeframes(),
      getEmployees(),
      getSetting('stationNumber'),
    ]);
    const isReady = mealTypes.length > 0 && employees.length > 0 && !!station;
    setReady(isReady);
    if (!isReady && !setupModalSeenRef.current) {
      setPage('admin');
      setShowSetupModal(true);
    }
  };


  useEffect(() => {
    checkSetup();
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* Sidebar */}
      <nav style={{
        width: 64,
        flexShrink: 0,
        borderRight: '0.5px solid #e0e0e0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 16,
        gap: 4,
        background: '#fafafa'
      }}>
        {NAV.map(({ id, label, icon }) => {
          const active = page === id;
          return (
            <button
              key={id}
              onClick={() => setPage(id)}
              disabled={!ready && id !== 'admin'}
              title={label}
              style={{
                width: 48,
                height: 48,
                border: 'none',
                borderRadius: 10,
                cursor: (!ready && id !== 'admin') ? 'not-allowed' : 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                background: active ? C.accentLight : 'transparent',
                color: active ? C.accent : C.muted,
                transition: 'background 0.15s, color 0.15s',
                opacity: (!ready && id !== 'admin') ? 0.35 : 1
              }}
            >
              {icon}
              <span style={{ fontSize: 9, fontWeight: active ? 500 : 400, letterSpacing: 0.3 }}>
                {label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Page content */}
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {page === 'scan'   && <ScanPage />}
        {page === 'report' && <ReportPage />}
        {page === 'admin' && <AdminPage onSetupComplete={checkSetup} />}
      </main>

      {showSetupModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#fff', borderRadius: 14, padding: '28px 28px 24px',
            width: 400, maxWidth: '95vw', boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
            display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'center'
          }}>
            <div style={{ fontSize: 36 }}>⚙️</div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Configuración inicial requerida</h2>
            <p style={{ margin: 0, fontSize: 13, color: '#555', lineHeight: 1.6 }}>
              Antes de usar la aplicación necesitas completar la configuración de esta estación:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left' }}>
              {[
                'Asignar un número de estación',
                'Agregar al menos un tipo de comida con horario',
                'Importar la lista de empleados',
              ].map((item, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                  background: '#f9f9f9', border: '1px solid #e5e5e5',
                  borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#333'
                }}>
                  <span style={{ fontWeight: 700, color: C.accent }}>{i + 1}.</span>
                  {item}
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                setupModalSeenRef.current = true;  // ← add this
                setShowSetupModal(false);
              }}
              style={{
                padding: '10px 0', background: C.accent, color: '#fff',
                border: 'none', borderRadius: 8, fontSize: 14,
                fontWeight: 700, cursor: 'pointer', marginTop: 4
              }}
            >
              Entendido, ir a configuración
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;