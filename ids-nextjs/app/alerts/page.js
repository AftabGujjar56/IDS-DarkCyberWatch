'use client'
import { useState } from 'react'
import { useIDS }    from '../lib/IDSContext'
import Topbar        from '../components/Topbar'
import { SevBadge, PageFooter } from '../components/SharedUI'

const ATTACK_TYPES_LIST = [
  'DoS Hulk','DoS GoldenEye','DDoS','PortScan',
  'FTP-Patator','SSH-Patator','Bot','Web Attack – XSS',
  'Infiltration','Brute Force','Web Attack',
]

export default function AlertsPage() {
  const {
    alerts, topAttacks, severityBreak, sessionAttacks,
    simulateAttack, isSimulating, clearAlerts, engineStatus, isMock,
  } = useIDS()

  const [sevFilter,    setSevFilter]    = useState('')
  const [typeFilter,   setTypeFilter]   = useState('')
  const [expanded,     setExpanded]     = useState(null)
  const [simType,      setSimType]      = useState('DoS')
  const [showClearDlg, setShowClearDlg] = useState(false)

  // Filter alerts
  const filtered = alerts.filter(a => {
    if (sevFilter  && a.severity !== sevFilter) return false
    if (typeFilter && !a.attack_type?.toLowerCase().includes(typeFilter.toLowerCase())) return false
    return true
  })

  const handleSimulate = async () => {
    await simulateAttack(simType, 3)
  }

  const handleClear = () => {
    clearAlerts()
    setShowClearDlg(false)
    setExpanded(null)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Topbar />

      {/* Clear confirmation dialog */}
      {showClearDlg && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 500,
          background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
            borderRadius: 12, padding: '24px 28px', maxWidth: 400, width: '90%',
            boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
          }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
              Clear All Alerts?
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, lineHeight: 1.5 }}>
              This will remove <strong style={{ color: 'var(--text-primary)' }}>{alerts.length} alerts</strong> from the feed and reset the Top Threats chart and Network Status on the dashboard.
            </div>
            <div style={{
              fontSize: 12, color: 'var(--amber)', padding: '8px 10px',
              background: 'rgba(210,153,34,0.08)', border: '1px solid rgba(210,153,34,0.2)',
              borderRadius: 5, marginBottom: 16,
            }}>
              ⚠ The Reports page will still show session totals. Download a report before clearing if you need the alert details.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowClearDlg(false)} style={{
                padding: '7px 16px', borderRadius: 6, fontSize: 13, fontWeight: 500,
                background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                color: 'var(--text-secondary)', cursor: 'pointer',
              }}>Cancel</button>
              <button onClick={handleClear} style={{
                padding: '7px 16px', borderRadius: 6, fontSize: 13, fontWeight: 700,
                background: 'rgba(248,81,73,0.15)', border: '1px solid rgba(248,81,73,0.4)',
                color: '#f85149', cursor: 'pointer',
              }}>Clear Alerts</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: '20px', maxWidth: 1400, margin: '0 auto' }}>

        {/* Title row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Security Alerts</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
              {isMock ? '⚡ Demo data — ' : 'Live — '}
              {filtered.length} alert{filtered.length !== 1 ? 's' : ''} · refreshes automatically
            </p>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Simulate */}
            <select value={simType} onChange={e => setSimType(e.target.value)} style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
              borderRadius: 5, padding: '5px 10px', fontSize: 12,
              color: 'var(--text-primary)', cursor: 'pointer',
            }}>
              {['DoS','DDoS','PortScan','Brute Force','Web Attack','Infiltration','Bot'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <button onClick={handleSimulate} disabled={isSimulating} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(248,81,73,0.08)', border: '1px solid rgba(248,81,73,0.3)',
              borderRadius: 6, padding: '6px 14px', fontSize: 13, fontWeight: 600,
              color: '#f85149', cursor: isSimulating ? 'not-allowed' : 'pointer',
            }}>
              {isSimulating ? '⏳' : '⚡'} Simulate ×3
            </button>

            <div style={{ width: 1, height: 20, background: 'var(--border-default)' }}/>

            {/* Clear */}
            <button
              onClick={() => setShowClearDlg(true)}
              disabled={alerts.length === 0}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'transparent', border: '1px solid var(--border-default)',
                borderRadius: 6, padding: '6px 14px', fontSize: 13, fontWeight: 500,
                color: alerts.length === 0 ? 'var(--text-muted)' : 'var(--text-secondary)',
                cursor: alerts.length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              🗑 Clear Alerts
            </button>
          </div>
        </div>

        {/* Severity stat strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Total',    val: alerts.length,               color: 'var(--text-primary)' },
            { label: 'Critical', val: severityBreak.CRITICAL || 0, color: '#f85149' },
            { label: 'High',     val: severityBreak.HIGH     || 0, color: '#f85149' },
            { label: 'Medium',   val: severityBreak.MEDIUM   || 0, color: '#d29922' },
            { label: 'Low',      val: severityBreak.LOW      || 0, color: '#388bfd' },
          ].map(({ label, val, color }) => (
            <div key={label} style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
              borderRadius: 8, padding: '12px 16px',
            }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>{label.toUpperCase()}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color, fontFamily: 'var(--font-mono)' }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{
          display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center',
          background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
          borderRadius: 8, padding: '10px 14px',
        }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>SEVERITY:</span>
          {['', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(s => (
            <button key={s} onClick={() => setSevFilter(s)} style={{
              padding: '3px 10px', borderRadius: 4, fontSize: 12, cursor: 'pointer',
              background: sevFilter === s ? 'var(--bg-elevated)' : 'transparent',
              border: sevFilter === s ? '1px solid var(--border-default)' : '1px solid transparent',
              color: s === '' ? 'var(--text-secondary)'
                : s === 'CRITICAL' || s === 'HIGH' ? '#f85149'
                : s === 'MEDIUM' ? '#d29922' : '#388bfd',
              fontWeight: sevFilter === s ? 600 : 400,
            }}>{s || 'All'}</button>
          ))}

          <div style={{ width: 1, height: 16, background: 'var(--border-default)' }}/>

          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>TYPE:</span>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
            borderRadius: 4, padding: '3px 8px', fontSize: 12, color: 'var(--text-secondary)',
          }}>
            <option value="">All Types</option>
            {ATTACK_TYPES_LIST.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <button onClick={() => { setSevFilter(''); setTypeFilter('') }} style={{
            marginLeft: 'auto', padding: '3px 10px', borderRadius: 4, fontSize: 12,
            background: 'transparent', border: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)', cursor: 'pointer',
          }}>Reset</button>
        </div>

        {/* Alerts table */}
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
          borderRadius: 10, overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '150px 90px 140px 130px 130px 65px 75px 90px 32px',
            padding: '8px 14px', borderBottom: '1px solid var(--border-subtle)',
            fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
          }}>
            {['TIMESTAMP','SEVERITY','ATTACK TYPE','SRC IP','DST IP','PORT','PROTO','CONFIDENCE',''].map(h => (
              <span key={h}>{h}</span>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              {alerts.length === 0 ? 'No alerts yet — waiting for detections…' : 'No alerts match current filters.'}
            </div>
          ) : (
            filtered.map((a, i) => (
              <div key={`${a.id}-${i}`}>
                <div
                  onClick={() => setExpanded(expanded === i ? null : i)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '150px 90px 140px 130px 130px 65px 75px 90px 32px',
                    padding: '9px 14px',
                    borderBottom: '1px solid var(--border-subtle)',
                    fontSize: 12, cursor: 'pointer', alignItems: 'center',
                    background: a.simulated
                      ? 'rgba(248,81,73,0.03)'
                      : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                  }}
                >
                  <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                    {new Date(a.timestamp).toLocaleTimeString()}
                  </span>
                  <span><SevBadge sev={a.severity} /></span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                    {a.attack_type}
                    {a.simulated && (
                      <span style={{ fontSize: 9, color: 'var(--amber)', marginLeft: 5,
                        background: 'rgba(210,153,34,0.1)', padding: '1px 4px', borderRadius: 3 }}>
                        SIM
                      </span>
                    )}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>{a.src_ip}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>{a.dst_ip}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>{a.dst_port ?? '—'}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{a.protocol || 'TCP'}</span>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 11,
                    color: a.confidence > 0.95 ? '#f85149' : a.confidence > 0.85 ? '#d29922' : 'var(--green)',
                  }}>
                    {a.confidence != null ? `${(a.confidence * 100).toFixed(1)}%` : '—'}
                  </span>
                  <span style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: 10 }}>
                    {expanded === i ? '▲' : '▼'}
                  </span>
                </div>

                {/* Expanded detail */}
                {expanded === i && (
                  <div style={{
                    padding: '12px 20px', background: 'var(--bg-elevated)',
                    borderBottom: '1px solid var(--border-subtle)',
                    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12,
                  }}>
                    {[
                      ['Full Timestamp', new Date(a.timestamp).toLocaleString()],
                      ['Attack Type',    a.attack_type],
                      ['Confidence',     a.confidence != null ? `${(a.confidence * 100).toFixed(2)}%` : '—'],
                      ['Severity',       a.severity],
                      ['Source IP',      a.src_ip || '—'],
                      ['Destination IP', a.dst_ip || '—'],
                      ['Dst Port',       a.dst_port ?? '—'],
                      ['Protocol',       a.protocol || 'TCP'],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 2 }}>{k}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{String(v)}</div>
                      </div>
                    ))}
                    {a.simulated && (
                      <div style={{
                        gridColumn: '1 / -1', fontSize: 11, color: 'var(--amber)',
                        padding: '6px 10px', background: 'rgba(210,153,34,0.08)',
                        borderRadius: 4, border: '1px solid rgba(210,153,34,0.2)',
                      }}>
                        ⚡ Simulated flow — {engineStatus === 'online' ? 'processed through real Random Forest model' : 'generated in demo mode (engine offline)'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <PageFooter />
      </div>
    </div>
  )
}
