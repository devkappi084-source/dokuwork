import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { Plus, Trash2, X, Check, Car, Hotel, Package } from 'lucide-react'
import { formatMoney, formatDate, todayISO } from '../utils/format'

const TYPE_LABELS = { travel: 'Fahrt', hotel: 'Hotel', other: 'Sonstiges' }
const TYPE_ICONS = { travel: Car, hotel: Hotel, other: Package }

function ExpenseForm({ projects, onSave, onCancel }) {
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '')
  const [type, setType] = useState('travel')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(todayISO())
  const [km, setKm] = useState('')
  const [amount, setAmount] = useState('')

  const proj = projects.find(p => p.id === Number(projectId))

  function calcAmount() {
    if (type === 'travel' && km && proj?.kmRate) {
      const calc = parseFloat(km) * (proj.kmRate || 0)
      setAmount(calc.toFixed(2))
    }
  }

  function submit(e) {
    e.preventDefault()
    if (!projectId || !amount) return
    onSave({
      projectId: Number(projectId),
      type,
      description: description.trim(),
      date,
      km: type === 'travel' ? parseFloat(km) || null : null,
      amount: parseFloat(amount) || 0,
      createdAt: Date.now(),
    })
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
          <label className="form-label">Typ</label>
          <select className="input" value={type} onChange={e => setType(e.target.value)}>
            <option value="travel">Fahrt (km)</option>
            <option value="hotel">Hotel</option>
            <option value="other">Sonstiges</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label className="form-label">Datum</label>
          <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} required />
        </div>
        {type === 'travel' ? (
          <div>
            <label className="form-label">Kilometer</label>
            <input className="input" type="number" step="0.1" min="0" value={km}
              onChange={e => setKm(e.target.value)}
              onBlur={calcAmount}
              placeholder="km" />
          </div>
        ) : (
          <div>
            <label className="form-label">Beschreibung</label>
            <input className="input" value={description} onChange={e => setDescription(e.target.value)} placeholder="z.B. Hotel Ibis Wien" />
          </div>
        )}
      </div>

      {type === 'travel' && (
        <div>
          <label className="form-label">Beschreibung (optional)</label>
          <input className="input" value={description} onChange={e => setDescription(e.target.value)} placeholder="z.B. Hinfahrt Kunde" />
        </div>
      )}

      <div>
        <label className="form-label">
          Betrag (€)
          {type === 'travel' && proj?.kmRate && km && (
            <span style={{ fontWeight: 400, color: '#6b7280', marginLeft: 6 }}>
              · {km} km × {proj.kmRate.toFixed(2)} €/km
            </span>
          )}
        </label>
        <input className="input" type="number" step="0.01" min="0" value={amount}
          onChange={e => setAmount(e.target.value)} placeholder="0,00" required />
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}><X size={14} /> Abbrechen</button>
        <button type="submit" className="btn btn-primary btn-sm"><Check size={14} /> Speichern</button>
      </div>
    </form>
  )
}

export default function Expenses() {
  const projects = useLiveQuery(() => db.projects.orderBy('createdAt').toArray(), [])
  const expenses = useLiveQuery(() => db.expenses.orderBy('date').reverse().limit(100).toArray(), [])
  const [adding, setAdding] = useState(false)
  const [filter, setFilter] = useState('all')

  const projectMap = Object.fromEntries((projects || []).map(p => [p.id, p]))

  async function saveExpense(data) {
    await db.expenses.add(data)
    setAdding(false)
  }

  async function del(id) {
    if (!confirm('Speseneintrag löschen?')) return
    await db.expenses.delete(id)
  }

  const filtered = (expenses || []).filter(e => filter === 'all' || e.type === filter)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Spesen & Kosten</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setAdding(true)}>
          <Plus size={15} /> Neuer Eintrag
        </button>
      </div>

      {adding && (
        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 600 }}>Neuer Speseneintrag</h3>
          {(projects?.length || 0) === 0
            ? <p style={{ color: '#9ca3af', fontSize: 14 }}>Bitte erst ein Projekt anlegen.</p>
            : <ExpenseForm projects={projects} onSave={saveExpense} onCancel={() => setAdding(false)} />
          }
        </div>
      )}

      {/* Filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {['all', 'travel', 'hotel', 'other'].map(t => (
          <button key={t} className={`btn btn-sm ${filter === t ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(t)}>
            {t === 'all' ? 'Alle' : TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(e => {
          const proj = projectMap[e.projectId]
          const Icon = TYPE_ICONS[e.type] || Package
          return (
            <div key={e.id} className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={16} color="#6b7280" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: 14 }}>
                  {e.description || TYPE_LABELS[e.type]}
                  {e.type === 'travel' && e.km ? ` (${e.km} km)` : ''}
                </div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>
                  {proj?.name} · {formatDate(new Date(e.date).getTime())}
                </div>
              </div>
              <span style={{ fontWeight: 600, fontSize: 15 }}>{formatMoney(e.amount)}</span>
              <button className="btn btn-danger btn-sm btn-icon" onClick={() => del(e.id)}><Trash2 size={13} /></button>
            </div>
          )
        })}
        {filtered.length === 0 && !adding && (
          <div className="card" style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>
            Keine Einträge vorhanden.
          </div>
        )}
      </div>
    </div>
  )
}
