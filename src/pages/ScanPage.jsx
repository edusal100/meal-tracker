import { useState, useEffect } from 'react';
import { db } from '../db/db';
import ScanInput from '../components/ScanInput';
import { addMeal } from '../services/mealService';
import { getMealTypeByTime } from '../utils/mealTypeHelper';
import { getSetting } from '../services/settingsService';
import { C } from '../theme';


const DAY_NAMES   = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const tick = () => setNow(new Date());
    const msToNextMinute = (60 - new Date().getSeconds()) * 1000 - new Date().getMilliseconds();
    const timeout = setTimeout(() => {
      tick();
      const interval = setInterval(tick, 60_000);
      return () => clearInterval(interval);
    }, msToNextMinute);
    return () => clearTimeout(timeout);
  }, []);
  return now;
}

export default function ScanPage() {
  const now = useClock();
  const [activeMealType, setActiveMealType] = useState(undefined);
  const [message, setMessage]               = useState(null);
  const [station, setStation] = useState('');

  useEffect(() => {
    let live = true;
    getMealTypeByTime().then(mt => {
      if (live) setActiveMealType(mt ?? '');
    });
    return () => { live = false; };
  }, [now]);

  useEffect(() => {
    getSetting('stationNumber').then(s => setStation(s ?? '1'));
  }, []);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [message]);

  const handleScan = async (employeeId) => {
    setMessage(null);

    const employee = await db.employees
      .where('employeeId')
      .equals(employeeId)
      .first();

    if (!employee) {
      setMessage({
        type: 'error',
        text: '❌ Empleado no encontrado',
        sub: 'Verifica el ID e intenta de nuevo. Registro no guardado.',
      });
      return;
    }

    const mealType = await getMealTypeByTime();
    if (!mealType) {
      setMessage({
        type: 'warn',
        text: '🕐 Fuera de Servicio',
        sub: 'No hay comida activa en este horario. Registro no guardado.',
      });
      return;
    }

    const result = await addMeal(employee, mealType);
    if (!result.success) {
      setMessage({
        type: 'warn',
        text: `⚠️ ${employee.name} ya fue registrado`,
        sub: `Ya se registró "${mealType.name}" hoy. Registro no guardado.`,
      });
      return;
    }

    setMessage({
      type: 'success',
      text: `¡Buen Provecho, ${employee.name}!`,
      sub: mealType.name,
    });
  };

  const raw = now.getHours();
  const hh  = ((raw % 12) || 12).toString().padStart(2, '0');
  const mm  = now.getMinutes().toString().padStart(2, '0');
  const ampm = raw < 12 ? 'AM' : 'PM';
  const dayName = DAY_NAMES[now.getDay()];
  const dateStr = `${dayName}, ${now.getDate()} de ${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;

  const msgPalette = {
    success: { bg: C.accentLight, fg: C.accent,  bd: `1px solid ${C.accentMid}` },
    warn:    { bg: C.warnBg,      fg: C.warnFg, bd: `1px solid ${C.warnBorder}` },
    error:   { bg: C.dangerLight,  fg: C.danger,  bd: '1px solid #f0a0a0' },
  };

  return (
    <div style={{        height: '100%',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',       // horizontal center only
        fontFamily: "'DM Sans', system-ui, sans-serif",
        color: C.text,
        background: C.surface,
      }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: 640,
        height: '100%',                 // fill the parent
        padding: '24px 32px',
        boxSizing: 'border-box',
        gap: 20,
      }}>

        {/* ── Clock card ── */}
        <div style={{
          flex: 1,                        // ← grows to fill remaining space
          minHeight: 0,                   //
          width: '100%',
          background: '#fff',
          border: `1px solid ${C.border}`,
          borderRadius: 24,
          padding: '40px 32px 36px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}>
          {station && (
            <div style={{
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: C.accentMid,
            }}>
              Estación {station}
            </div>
          )}
          <div style={{ fontSize: 18, color: C.muted, letterSpacing: '0.03em' }}>
            {dateStr}
          </div>

          <div style={{
            fontSize: 96,
            fontWeight: 700,
            letterSpacing: '-0.04em',
            color: C.text,
            lineHeight: 1,
            marginTop: 8,
          }}>
            {hh}<span style={{ color: C.accentMid, fontWeight: 200 }}>:</span>{mm}
            <span style={{ fontSize: 36, fontWeight: 300, color: C.muted, marginLeft: 8 }}>{ampm}</span>
          </div>

          {activeMealType !== undefined && (
            activeMealType && activeMealType.name ? (
              <div style={{
                marginTop: 18,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 28px',
                borderRadius: 999,
                background: C.accentLight,
                border: `1px solid ${C.accentMid}`,
                fontSize: 20,
                fontWeight: 700,
                color: C.accent,
                textTransform: 'capitalize',
                letterSpacing: '0.01em',
              }}>
                <span style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: C.accent, display: 'inline-block',
                }} />
                {activeMealType.name}
              </div>
            ) : (
              <div style={{
                marginTop: 18,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 28px',
                borderRadius: 999,
                background: C.surface,
                border: `1px solid ${C.border}`,
                fontSize: 20,
                fontWeight: 600,
                color: C.muted,
              }}>
                <span style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: C.muted, display: 'inline-block',
                  opacity: 0.35,
                }} />
                Fuera de Servicio
              </div>
            )
          )}
        </div>

        {/* ── Scan card ── */}
        <div style={{
          flexShrink: 0,
          width: '100%',
          background: '#fff',
          border: `1px solid ${C.border}`,
          borderRadius: 24,
          padding: '32px 36px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}>
          <div style={{
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: C.accent,
            paddingBottom: 16,
            marginBottom: 20,
            borderBottom: `2px solid ${C.accentLight}`,
            textAlign: 'center',
          }}>
            Escanear empleado
          </div>

          {/* ScanInput inherits container width; styles inside it may need
              adjustment in the component itself for kiosk sizing */}
          <ScanInput onScan={handleScan} />
        </div>

        {/* Always rendered — holds space whether message exists or not */}
        <div style={{
          flexShrink: 0,
          width: '100%',
          height: 110,                    // fixed — adjust to fit your longest message
          borderRadius: 20,
          padding: '0 36px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          boxSizing: 'border-box',
          ...(message ? {
            background: msgPalette[message.type].bg,
            border: msgPalette[message.type].bd,
            color: msgPalette[message.type].fg,
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          } : {
            background: 'transparent',
            border: '1px solid transparent',
          }),
        }}>
          {message && (
            <>
              <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.2 }}>
                {message.text}
              </div>
              {message.sub && (
                <div style={{ marginTop: 8, fontSize: 16, opacity: 0.75, fontWeight: 500 }}>
                  {message.sub}
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}