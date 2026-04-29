import { useState, useEffect, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { Play, Square, Plus, Trash2, X, Check } from 'lucide-react'
import { formatDuration, formatDatetime, formatHours, nowLocalISO, formatDate } from '../utils/format'

function ManualEntryForm({ projects, onSave, onCancel }) {
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '')
  const [description, setDescription] = useState('')
  const [startTime, setStartTime] = useState(nowLocalISO())
  const [endTime, setEndTime] = useState(nowLocalISO())

  function submit(e) {
    e.preventDefault()
    const s = new Date(startTime).getTime()
    const en = new Date(endTime).getTime()
    if (!projectId || en <= s) return alert('Endzeit muss nach Startzeit liegen.')
    const duration = Math.round((en - s) / 1000)
    onSave({ projectId: Number(projectId), description: description.trim(), startTime: s, endTime: en, duration, createdAt: Date.now() })
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <label className="form-label">Projekt *</label>
        <select className="input" value={projectId} onChange={e => setProjectId(e.target.value)} required>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div>
        <label className="form-label">Beschreibung</label>
        <input className="input" value={description} onChange={e => setDescription(e.target.value)} placeholder="Was wurde gemacht?" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label className="form-label">Start</label>
          <input className="input" type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} required />
        </div>
        <div>
          <label className="form-label">Ende</label>
          <input className="input" type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} required />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}><X size={14} /> Abbrechen</button>
        <button type="submit" className="btn btn-primary btn-sm"><Check size={14} /> Eintragen</button>
      </div>
    </form>
  )
}

export default function Timer() {
  const projects = useLiveQuery(() => db.projects.orderBy('createdAt').toArray(), [])
  const recentEntries = useLiveQuery(() =>
    db.timeEntries.orderBy('createdAt').reverse().limit(30).toArray(), [])

  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [startTs, setStartTs] = useState(null)
  const [activeProject, setActiveProject] = useState('')
  const [activeDesc, setActiveDesc] = useState('')
  const [showManual, setShowManual] = useState(false)

  const intervalRef = useRef(null)

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTs) / 1000))
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running, startTs])

  function startTimer() {
    if (!activeProject) return alert('Bitte zuerst ein Projekt wählen.')
    const ts = Date.now()
    setStartTs(ts)
    setElapsed(0)
    setRunning(true)
  }

  async function stopTimer() {
    setRunning(false)
    const endTs = Date.now()
    const duration = Math.round((endTs - startTs) / 1000)
    if (duration < 5) return
    await db.timeEntries.add({
      projectId: Number(activeProject),
      description: activeDesc.trim(),
      startTime: startTs,
      endTime: endTs,
      duration,
      createdAt: Date.now(),
    })
    setElapsed(0)
    setActiveDesc('')
  }

  async function saveManual(entry) {
    await db.timeEntries.add(entry)
    setShowManual(false)
  }

  async function deleteEntry(id) {
    if (!confirm('Eintrag löschen?')) return
    await db.timeEntries.delete(id)
  }

  const projectMap = Object.fromEntries((projects || []).map(p => [p.id, p]))

  // Group entries by date
  const grouped = {}
  for (const e of recentEntries || []) {
    const d = new Date(e.startTime).toISOString().slice(0, 10)
    if (!grouped[d]) grouped[d] = []
    grouped[d].push(e)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Zeiterfassung</h1>
        <button className="btn btn-secondary btn-sm" onClick={() => setShowManual(true)}>
          <Plus size={15} /> Manuell eintragen
        </button>
      </div>

      {/* Timer card */}
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="form-label">Projekt</label>
              <select className="input" value={activeProject} onChange={e => setActiveProject(e.target.value)} disabled={running}>
                <option value="">— Projekt wählen —</option>
                {projects?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Beschreibung</label>
              <input className="input" value={activeDesc} onChange={e => setActiveDesc(e.target.value)}
                placeholder="Was machst du?" disabled={running} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{
              fontSize: 42, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
              color: running ? '#2563eb' : '#374151', letterSpacing: '-1px', minWidth: 140,
            }}>
              {formatDuration(elapsed)}
            </div>
            {!running ? (
              <button className="btn btn-primary" style={{ padding: '10px 24px', fontSize: 15 }} onClick={startTimer}>
                <Play size={18} fill="currentColor" /> Start
              </button>
            ) : (
              <button className="btn btn-danger" style={{ padding: '10px 24px', fontSize: 15, background: '#dc2626', color: '#fff' }} onClick={stopTimer}>
                <Square size={18} fill="currentColor" /> Stopp
              </button>
            )}
            {running && activeProject && projectMap[activeProject] && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: projectMap[activeProject].color }} />
                <span style={{ fontSize: 14, color: '#6b7280' }}>{projectMap[activeProject].name}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manual entry form */}
      {showManual && (
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 600 }}>Manuellen Eintrag hinzufügen</h3>
          {(projects?.length || 0) === 0
            ? <p style={{ color: '#9ca3af', fontSize: 14 }}>Bitte erst ein Projekt anlegen.</p>
            : <ManualEntryForm projects={projects} onSave={saveManual} onCancel={() => setShowManual(false)} />
          }
        </div>
      )}

      {/* Recent entries */}
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#374151' }}>Letzte Einträge</h2>
        {Object.keys(grouped).sort((a, b) => b.localeCompare(a)).map(date => {
          const dayEntries = grouped[date]
          const dayTotal = dayEntries.reduce((s, e) => s + (e.duration || 0), 0)
          return (
            <div key={date} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#6b7280' }}>
                  {formatDate(new Date(date).getTime())}
                </span>
                <span style={{ fontSize: 13, color: '#9ca3af' }}>{formatHours(dayTotal)}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {dayEntries.map(e => {
                  const proj = projectMap[e.projectId]
                  return (
                    <div key={e.id} className="card" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      {proj && <div style={{ width: 8, height: 8, borderRadius: '50%', background: proj.color, flexShrink: 0 }} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{e.description || <span style={{ color: '#9ca3af' }}>–</span>}</div>
                        <div style={{ fontSize: 12, color: '#9ca3af' }}>{proj?.name} · {formatDatetime(e.startTime)} – {new Date(e.endTime).toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                      <span style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums', color: '#374151', fontWeight: 500 }}>
                        {formatHours(e.duration)}
                      </span>
                      <button className="btn btn-danger btn-sm btn-icon" onClick={() => deleteEntry(e.id)}><Trash2 size={13} /></button>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
        {Object.keys(grouped).length === 0 && (
          <div className="card" style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>
            Noch keine Zeiteinträge vorhanden.
          </div>
        )}
      </div>
    </div>
  )
}
