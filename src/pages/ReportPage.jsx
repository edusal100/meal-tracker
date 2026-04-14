import { useEffect, useState, useMemo } from 'react';
import { getAllMeals, deleteMeal } from '../services/mealService';
import { getMealTypesWithTimeframes } from '../services/configService';
import { getEmployees } from '../services/employeeService';
import DatePickerInput from '../components/DatePickerInput';
import { getSetting } from '../services/settingsService';
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
    marginBottom: 4,
    display: 'block',
  },
  select: {
    padding: '8px 12px',
    fontSize: 13,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    background: C.surface,
    color: C.text,
    outline: 'none',
    cursor: 'pointer',
    minWidth: 130,
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
  btnDanger: {
    padding: '4px 10px',
    fontSize: 11,
    fontWeight: 500,
    background: C.dangerLight,
    color: C.danger,
    border: `1px solid #f0a0a0`,
    borderRadius: 6,
    cursor: 'pointer',
  },
  toggleBtn: (active) => ({
    padding: '7px 16px',
    fontSize: 12,
    fontWeight: 500,
    background: active ? C.accent : 'transparent',
    color: active ? '#fff' : C.muted,
    border: `1px solid ${active ? C.accent : C.border}`,
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'all 0.15s',
  }),
  btnExport: {
    padding: '7px 16px',
    fontSize: 12,
    fontWeight: 500,
    background: C.accent,
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    transition: 'opacity 0.15s',
  },
};

// ─── helpers ──────────────────────────────────────────────────────────────────
const toLocalDateStr = (isoString) =>
  new Date(isoString).toLocaleDateString('en-CA');

// Dynamically load jsPDF + autotable from CDN
const loadJsPDF = () =>
  new Promise((resolve, reject) => {
    if (window.jspdf) return resolve(window.jspdf);
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = () => {
      const script2 = document.createElement('script');
      script2.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js';
      script2.onload = () => resolve(window.jspdf);
      script2.onerror = reject;
      document.head.appendChild(script2);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ReportPage() {
  const today = new Date().toLocaleDateString('en-CA');

  const [allMeals, setAllMeals]   = useState([]);
  const [mealTypes, setMealTypes] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [exporting, setExporting] = useState(false);

  const [dateRange, setDateRange]               = useState({ from: today, to: today });
  const [selectedCompany, setSelectedCompany]   = useState('all');
  const [selectedMealType, setSelectedMealType] = useState('all');
  const [reportType, setReportType]             = useState('summary');
  const [station, setStation] = useState('');

  useEffect(() => { load(); }, []);

  useEffect(() => {
    getSetting('stationNumber').then(s => setStation(s ?? '1'));
  }, []);

  const load = async () => {
    const meals = await getAllMeals();
    setAllMeals(meals);
    const types = await getMealTypesWithTimeframes();
    setMealTypes(types);
    const emps = await getEmployees();
    const cos = [...new Set(emps.map(e => e.company).filter(Boolean))].sort();
    setCompanies(cos);
  };

  const mealTypeMap = useMemo(() => {
    const map = {};
    for (const t of mealTypes) map[t.id] = t.name;
    return map;
  }, [mealTypes]);

  const filtered = useMemo(() => {
    return allMeals.filter(m => {
      const d    = toLocalDateStr(m.date);
      const from = dateRange?.from;
      const to   = dateRange?.to ?? dateRange?.from;
      if (!from || d < from || d > to) return false;
      if (selectedCompany  !== 'all' && m.company  !== selectedCompany)  return false;
      if (selectedMealType !== 'all' && String(m.mealType) !== String(selectedMealType)) return false;
      return true;
    });
  }, [allMeals, selectedCompany, selectedMealType, dateRange]);

  const summary = useMemo(() => {
    const map = {};
    for (const m of filtered) {
      const key = `${m.mealType}||${m.company ?? '—'}`;
      if (!map[key]) map[key] = { mealType: m.mealType, company: m.company ?? '—', total: 0 };
      map[key].total += 1;
    }
    const byType = {};
    for (const row of Object.values(map)) {
      if (!byType[row.mealType]) byType[row.mealType] = { mealType: row.mealType, rows: [], subtotal: 0 };
      byType[row.mealType].rows.push(row);
      byType[row.mealType].subtotal += row.total;
    }
    return Object.values(byType).sort((a, b) => a.mealType.localeCompare(b.mealType));
  }, [filtered]);

  const grandTotal = filtered.length;
  const mealName = (id) => mealTypeMap[id] ?? String(id);

  const handleDelete = async (mealId) => {
    if (!window.confirm('Delete this meal record?')) return;
    await deleteMeal(mealId);
    await load();
  };

  // ── export PDF ──
  const handleExportPDF = async () => {
    if (filtered.length === 0) return;
    setExporting(true);
    try {
      const { jsPDF } = await loadJsPDF();
      const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const pageWidth  = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const ml = 48; // margin left
      const mr = 48; // margin right

      // ── colour palette (minimal, invoice-like) ──
      const ink      = [30, 30, 30];      // near-black for headings
      const body     = [60, 60, 60];      // body text
      const muted    = [150, 150, 150];   // labels / captions
      const hairline = [220, 220, 220];   // dividers
      const rowAlt   = [249, 249, 249];   // alternate row tint
      const rowHead  = [245, 245, 245];   // table header bg

      const fromLabel     = dateRange?.from ?? today;
      const toLabel       = dateRange?.to   ?? fromLabel;
      const dateLabel     = fromLabel === toLabel ? fromLabel : `${fromLabel}  –  ${toLabel}`;
      const companyLabel  = selectedCompany  === 'all' ? 'All Companies'  : selectedCompany;
      const mealTypeLabel = selectedMealType === 'all' ? 'All Meal Types' : mealName(selectedMealType);
      const generatedAt   = new Date().toLocaleDateString('en-CA');

      // ─────────────────────────────────────────────
      // TITLE BLOCK
      // ─────────────────────────────────────────────
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(26);
      doc.setTextColor(...ink);
      doc.text('Meal Consumption Report', ml, 58);

      // Top hairline
      doc.setDrawColor(...hairline);
      doc.setLineWidth(0.5);
      doc.line(ml, 68, pageWidth - mr, 68);

      // ─────────────────────────────────────────────
      // META ROW  (Period · Company · Meal Type · Generated)
      // ─────────────────────────────────────────────
      const metaY = 90;
      const col2  = ml + 145;
      const col3  = pageWidth / 2 + 10;
      const col4  = col3 + 120;

      const drawMeta = (labelText, valueText, x, labelY, valueY) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...muted);
        doc.text(labelText.toUpperCase(), x, labelY);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(...body);
        doc.text(valueText, x, valueY);
      };

      drawMeta('Report Period', dateLabel,     ml,   metaY,      metaY + 13);
      drawMeta('Company',       companyLabel,  ml,   metaY + 32, metaY + 45);
      drawMeta('Meal Type',     mealTypeLabel, col3, metaY,      metaY + 13);
      drawMeta('Generated',     generatedAt,   col3, metaY + 32, metaY + 45);
      drawMeta('Station',       `Station ${station}`, col4, metaY + 32, metaY + 45);

      // Bottom hairline
      doc.setDrawColor(...hairline);
      doc.setLineWidth(0.5);
      doc.line(ml, metaY + 58, pageWidth - mr, metaY + 58);

      let cursorY = metaY + 78;

      // ─────────────────────────────────────────────
      // SUMMARY VIEW
      // ─────────────────────────────────────────────
      if (reportType === 'summary') {
        for (const group of summary) {
          // Meal type section label
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(...muted);
          doc.text(mealName(group.mealType).toUpperCase(), ml, cursorY);
          cursorY += 8;

          doc.autoTable({
            startY: cursorY,
            head: [['Company', 'Meals Consumed']],
            body: group.rows
              .slice()
              .sort((a, b) => a.company.localeCompare(b.company))
              .map(r => [r.company, String(r.total)]),
            foot: [['Subtotal', String(group.subtotal)]],
            styles: {
              font: 'helvetica',
              fontSize: 9.5,
              cellPadding: { top: 8, bottom: 8, left: 10, right: 10 },
              textColor: body,
              lineColor: hairline,
              lineWidth: 0.3,
            },
            headStyles: {
              fillColor: rowHead,
              textColor: muted,
              fontStyle: 'normal',
              fontSize: 8,
              halign: 'left',
            },
            footStyles: {
              fillColor: [255, 255, 255],
              textColor: ink,
              fontStyle: 'bold',
              fontSize: 9.5,
              lineColor: hairline,
              lineWidth: { top: 0.8 },
            },
            alternateRowStyles: { fillColor: rowAlt },
            columnStyles: {
              1: { halign: 'right' },
            },
            margin: { left: ml, right: mr },
            theme: 'plain',
            tableLineColor: hairline,
            tableLineWidth: 0.3,
          });

          cursorY = doc.lastAutoTable.finalY + 28;
        }

        // ── Grand total row ──
        if (cursorY > pageHeight - 80) { doc.addPage(); cursorY = 48; }

        doc.setDrawColor(...hairline);
        doc.setLineWidth(0.5);
        doc.line(ml, cursorY, pageWidth - mr, cursorY);

        cursorY += 18;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(...ink);
        doc.text('Grand Total', ml, cursorY);
        doc.text(String(grandTotal), pageWidth - mr, cursorY, { align: 'right' });

        doc.setDrawColor(...hairline);
        doc.setLineWidth(0.5);
        doc.line(ml, cursorY + 10, pageWidth - mr, cursorY + 10);

      // ─────────────────────────────────────────────
      // DETAIL VIEW
      // ─────────────────────────────────────────────
      } else {
        const rows = filtered
          .slice()
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .map(m => [
            m.employeeId,
            m.company ?? '—',
            mealName(m.mealType),
            toLocalDateStr(m.date),
            new Date(m.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          ]);

        doc.autoTable({
          startY: cursorY,
          head: [['Employee ID', 'Company', 'Meal Type', 'Date', 'Time']],
          body: rows,
          foot: [[{
            content: `Total Records: ${filtered.length}`,
            colSpan: 5,
            styles: { halign: 'right', fontStyle: 'bold', textColor: ink },
          }]],
          styles: {
            font: 'helvetica',
            fontSize: 9.5,
            cellPadding: { top: 8, bottom: 8, left: 10, right: 10 },
            textColor: body,
            lineColor: hairline,
            lineWidth: 0.3,
          },
          headStyles: {
            fillColor: rowHead,
            textColor: muted,
            fontStyle: 'normal',
            fontSize: 8,
          },
          footStyles: {
            fillColor: [255, 255, 255],
            textColor: ink,
            fontStyle: 'bold',
            lineColor: hairline,
            lineWidth: { top: 0.8 },
          },
          alternateRowStyles: { fillColor: rowAlt },
          margin: { left: ml, right: mr },
          theme: 'plain',
          tableLineColor: hairline,
          tableLineWidth: 0.3,
        });
      }

      // ─────────────────────────────────────────────
      // FOOTER — every page
      // ─────────────────────────────────────────────
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        const fY = pageHeight - 24;

        doc.setDrawColor(...hairline);
        doc.setLineWidth(0.4);
        doc.line(ml, fY - 8, pageWidth - mr, fY - 8);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...muted);
        doc.text('Confidential — For Internal Use Only', ml, fY);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - mr, fY, { align: 'right' });
      }

      // ── Save ──
      doc.save(`meal-report_${fromLabel}_to_${toLabel}.pdf`);

    } catch (err) {
      console.error('PDF export failed:', err);
      alert('PDF export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // ─── render ───────────────────────────────────────────────────────────────
  return (
    <div style={{
      padding: '28px 24px',
      fontFamily: "'DM Sans', system-ui, sans-serif",
      color: C.text,
      overflowY: 'auto', flex: 1,
    }}>
      {/* Page header */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: C.text, letterSpacing: '-0.01em' }}>
            Reporte
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: C.muted }}>
            Por dia, compañia, y tipo de comida.
          </p>
        </div>

        <button
          style={{ ...s.btnExport, opacity: filtered.length === 0 || exporting ? 0.5 : 1 }}
          onClick={handleExportPDF}
          disabled={filtered.length === 0 || exporting}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          {exporting ? 'Exportando…' : 'Exportar PDF'}
        </button>
      </div>

      {/* Filter bar */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 24,
        padding: '16px 18px', background: '#fff',
        border: `1px solid ${C.border}`, borderRadius: 12, alignItems: 'flex-end',
      }}>
        <div>
          <span style={s.label}>Fecha</span>
          <DatePickerInput value={dateRange} onChange={setDateRange} max={today} />
        </div>

        <div>
          <span style={s.label}>Compañia</span>
          <select style={s.select} value={selectedCompany} onChange={e => setSelectedCompany(e.target.value)}>
            <option value="all">Todas</option>
            {companies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <span style={s.label}>Tipo de comida</span>
          <select style={s.select} value={selectedMealType} onChange={e => setSelectedMealType(e.target.value)}>
            <option value="all">Todos</option>
            {mealTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        <div style={{ marginLeft: 'auto' }}>
          <span style={s.label}>Vista</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button style={s.toggleBtn(reportType === 'summary')} onClick={() => setReportType('summary')}>Summary</button>
            <button style={s.toggleBtn(reportType === 'detail')}  onClick={() => setReportType('detail')}>Detalle</button>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '48px 20px', color: C.muted, fontSize: 14,
          background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12,
        }}>
          No hay registros para los filtros seleccionados.
        </div>
      )}

      {/* ── SUMMARY VIEW ── */}
      {reportType === 'summary' && filtered.length > 0 && (
        <>
          {summary.map(group => (
            <div key={group.mealType} style={s.card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: C.text, flex: 1, textTransform: 'capitalize' }}>
                  {mealName(group.mealType)}
                </span>
                <span style={s.pill(true)}>{group.subtotal} total</span>
              </div>
              <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
                <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: C.accentLight }}>
                      <th style={{ padding: '7px 12px', textAlign: 'left',  color: C.accent, fontWeight: 600, fontSize: 11, letterSpacing: '0.06em' }}>Compañia</th>
                      <th style={{ padding: '7px 12px', textAlign: 'right', color: C.accent, fontWeight: 600, fontSize: 11, letterSpacing: '0.06em' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.rows.sort((a, b) => a.company.localeCompare(b.company)).map((row, i) => (
                      <tr key={i} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? '#fff' : C.surface }}>
                        <td style={{ padding: '7px 12px', color: C.text }}>{row.company}</td>
                        <td style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 600, color: C.accent }}>{row.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          <div style={{
            display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10,
            padding: '12px 18px', background: C.accentLight,
            border: `1px solid ${C.accentMid}`, borderRadius: 10,
          }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: C.accent }}>Grand total</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: C.accent }}>{grandTotal}</span>
          </div>
        </>
      )}

      {/* ── DETAIL VIEW ── */}
      {reportType === 'detail' && filtered.length > 0 && (
        <div style={s.card}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: C.accentLight }}>
                  {['Employee ID', 'Company', 'Meal type', 'Time', ''].map((h, i) => (
                    <th key={i} style={{
                      padding: '8px 12px', textAlign: i === 4 ? 'center' : 'left',
                      color: C.accent, fontWeight: 600, fontSize: 11, letterSpacing: '0.06em',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered
                  .slice()
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((m, i) => (
                    <tr key={m.id} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? '#fff' : C.surface }}>
                      <td style={{ padding: '8px 12px', color: C.muted, fontSize: 12 }}>{m.employeeId}</td>
                      <td style={{ padding: '8px 12px', color: C.text }}>{m.company ?? '—'}</td>
                      <td style={{ padding: '8px 12px' }}><span style={s.pill(true)}>{mealName(m.mealType)}</span></td>
                      <td style={{ padding: '8px 12px', color: C.muted, fontSize: 12 }}>
                        {new Date(m.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                        <button style={s.btnDanger} onClick={() => handleDelete(m.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <div style={{
            display: 'flex', justifyContent: 'flex-end',
            paddingTop: 12, marginTop: 4, borderTop: `1px solid ${C.border}`,
            fontSize: 12, color: C.muted,
          }}>
            {filtered.length} record{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
}