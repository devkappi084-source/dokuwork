import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { Plus, Download, Trash2, X, Check, FileText } from 'lucide-react'
import { formatDate, formatMoney, formatHours, todayISO } from '../utils/format'
import { generateInvoicePDF } from '../utils/pdf'

function InvoiceForm({ projects, onSave, onCancel }) {
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState(todayISO())
  const [number, setNumber] = useState(`RE-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`)

  function submit(e) {
    e.preventDefault()
    if (!projectId || !dateFrom || !dateTo) return
    onSave({ projectId: Number(projectId), dateFrom, dateTo, number, issuedAt: todayISO() })
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label className="form-label">Projekt *</label>
          <select className="input" value={projectId} onChange={e => setProjectId(e.target.value)} required>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Rechnungsnummer</label>
          <input className="input" value={number} onChange={e => setNumber(e.target.value)} required />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label className="form-label">Zeitraum von</label>
          <input className="input" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} required />
        </div>
        <div>
          <label className="form-label">Zeitraum bis</label>
          <input className="input" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} required />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}><X size={14} /> Abbrechen</button>
        <button type="submit" className="btn btn-primary btn-sm"><Check size={14} /> Erstellen & PDF</button>
      </div>
    </form>
  )
}

function InvoiceSummary({ invoice, project, timeEntries, expenses }) {
  const totalSeconds = timeEntries.reduce((s, e) => s + (e.duration || 0), 0)
  const totalTime = (totalSeconds / 3600) * (project?.hourlyRate || 0)
  const totalExp = expenses.reduce((s, e) => s + (e.amount || 0), 0)
  const grand = totalTime + totalExp

  return (
    <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4, display: 'flex', gap: 16 }}>
      <span>{timeEntries.length} Zeiteinträge ({formatHours(totalSeconds)})</span>
      <span>{expenses.length} Spesen</span>
      <span style={{ fontWeight: 600, color: '#111827' }}>{formatMoney(grand)}</span>
    </div>
  )
}

export default function Invoices() {
  const projects = useLiveQuery(() => db.projects.orderBy('createdAt').toArray(), [])
  const invoices = useLiveQuery(() => db.invoices.orderBy('issuedAt').reverse().toArray(), [])
  const timeEntries = useLiveQuery(() => db.timeEntries.toArray(), [])
  const expenses = useLiveQuery(() => db.expenses.toArray(), [])
  const [adding, setAdding] = useState(false)

  const projectMap = Object.fromEntries((projects || []).map(p => [p.id, p]))

  function getEntriesForInvoice(inv) {
    const from = new Date(inv.dateFrom).getTime()
    const to = new Date(inv.dateTo + 'T23:59:59').getTime()
    const te = (timeEntries || []).filter(e => e.projectId === inv.projectId && e.startTime >= from && e.startTime <= to)
    const ex = (expenses || []).filter(e => e.projectId === inv.projectId && new Date(e.date).getTime() >= from && new Date(e.date).getTime() <= to)
    return { te, ex }
  }

  async function createInvoice({ projectId, dateFrom, dateTo, number, issuedAt }) {
    const { te, ex } = getEntriesForInvoice({ projectId, dateFrom, dateTo })
    const project = projectMap[projectId]
    if (!project) return alert('Projekt nicht gefunden.')

    const doc = generateInvoicePDF({ project, timeEntries: te, expenses: ex, invoice: { number, dateFrom, dateTo, issuedAt } })
    doc.save(`Rechnung_${number}.pdf`)

    await db.invoices.add({ projectId, number, dateFrom, dateTo, issuedAt, createdAt: Date.now() })
    setAdding(false)
  }

  async function downloadInvoice(inv) {
    const { te, ex } = getEntriesForInvoice(inv)
    const project = projectMap[inv.projectId]
    if (!project) return alert('Projekt nicht mehr vorhanden.')
    const doc = generateInvoicePDF({ project, timeEntries: te, expenses: ex, invoice: inv })
    doc.save(`Rechnung_${inv.number}.pdf`)
  }

  async function del(id) {
    if (!confirm('Rechnungseintrag löschen? Die PDF-Datei bleibt bei dir gespeichert.')) return
    await db.invoices.delete(id)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Rechnungen</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setAdding(true)}>
          <Plus size={15} /> Neue Rechnung
        </button>
      </div>

      {adding && (
        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 600 }}>Rechnung erstellen</h3>
          {(projects?.length || 0) === 0
            ? <p style={{ color: '#9ca3af', fontSize: 14 }}>Bitte erst ein Projekt anlegen.</p>
            : <InvoiceForm projects={projects} onSave={createInvoice} onCancel={() => setAdding(false)} />
          }
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {invoices?.map(inv => {
          const proj = projectMap[inv.projectId]
          const { te, ex } = getEntriesForInvoice(inv)
          return (
            <div key={inv.id} className="card" style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FileText size={17} color="#2563eb" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>
                    {inv.number}
                    {proj && (
                      <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 400, color: '#6b7280' }}>
                        · {proj.name}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                    {formatDate(new Date(inv.dateFrom).getTime())} – {formatDate(new Date(inv.dateTo).getTime())}
                    {' · '}ausgestellt {formatDate(new Date(inv.issuedAt).getTime())}
                  </div>
                  {proj && <InvoiceSummary invoice={inv} project={proj} timeEntries={te} expenses={ex} />}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => downloadInvoice(inv)}>
                    <Download size={14} /> PDF
                  </button>
                  <button className="btn btn-danger btn-sm btn-icon" onClick={() => del(inv.id)}><Trash2 size={13} /></button>
                </div>
              </div>
            </div>
          )
        })}
        {invoices?.length === 0 && !adding && (
          <div className="card" style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>
            Noch keine Rechnungen erstellt.
          </div>
        )}
      </div>
    </div>
  )
}
