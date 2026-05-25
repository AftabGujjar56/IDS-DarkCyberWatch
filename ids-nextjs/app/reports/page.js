'use client'
import { useState, useEffect } from 'react'
import { useIDS }   from '../lib/IDSContext'
import Topbar       from '../components/Topbar'
import { SevBadge, PageFooter } from '../components/SharedUI'

function formatUptime(s) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
}

export default function ReportsPage() {
  const {
    alerts, topAttacks, severityBreak,
    sessionFlows, sessionAttacks, sessionBenign,
    uptime, engineStatus, modelsLoaded, isMock,
  } = useIDS()

  // Also try to pull full report from engine (extra detail if online)
  const [engineReport, setEngineReport] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch('/api/report', { cache: 'no-store' })
        const d = await r.json()
        if (!d.is_mock) setEngineReport(d)
      } catch {}
    }
    if (engineStatus === 'online') load()
    const t = setInterval(() => { if (engineStatus === 'online') load() }, 30000)
    return () => clearInterval(t)
  }, [engineStatus])

  const detectionRate = sessionFlows > 0
    ? ((sessionAttacks / sessionFlows) * 100).toFixed(2)
    : '0.00'

  const maxAttacks = topAttacks[0]?.count || 1

  const handleExport = () => {
    const lines = [
      'DarkCyberWatch — Session Report',
      `Generated:        ${new Date().toLocaleString()}`,
      `Data source:      ${isMock ? 'Demo / Mock' : 'Live Engine'}`,
      '',
      '── Session Summary ──────────────────────────',
      `Total Flows:      ${sessionFlows}`,
      `Attacks Detected: ${sessionAttacks}`,
      `Benign Flows:     ${sessionBenign}`,
      `Detection Rate:   ${detectionRate}%`,
      `Session Uptime:   ${formatUptime(uptime)}`,
      '',
      '── Model Accuracy ────────────────────────────',
      'Binary Classifier:   99.88%  (Random Forest — benign vs attack)',
      'Multi-class:         99.48%  (Random Forest — 14 attack types)',
      'ROC-AUC Score:       1.0000',
      '',
      '── Top Attack Types ──────────────────────────',
      ...(topAttacks.length > 0
        ? topAttacks.map(a => `${a.type.padEnd(32)} ${a.count}`)
        : ['No attacks recorded this session']),
      '',
      '── Severity Breakdown ────────────────────────',
      `CRITICAL  ${severityBreak.CRITICAL || 0}`,
      `HIGH      ${severityBreak.HIGH     || 0}`,
      `MEDIUM    ${severityBreak.MEDIUM   || 0}`,
      `LOW       ${severityBreak.LOW      || 0}`,
      '',
      '── System Status ─────────────────────────────',
      `Python Engine:    ${engineStatus === 'online' ? 'Online' : 'Offline'}`,
      `ML Models:        ${modelsLoaded ? 'Loaded' : 'Not Loaded'}`,
      '',
      `── Recent Alerts (last ${Math.min(alerts.length, 20)}) ──────────────`,
      alerts.length === 0
        ? 'No alerts recorded'
        : alerts.slice(0, 20).map(a =>
            `${new Date(a.timestamp).toLocaleString().padEnd(22)}  ${a.severity.padEnd(8)}  ${a.attack_type.padEnd(22)}  ${a.src_ip}`
          ).join('\n'),
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href     = url
    link.download = `darkcyberwatch-${new Date().toISOString().slice(0,10)}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Topbar />

      <div style={{ padding: '20px', maxWidth: 1400, margin: '0 auto' }}>

        {/* Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Session Report</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
              {isMock ? '⚡ Demo data — ' : 'Live data — '}
              session totals persist until browser tab is closed
            </p>
          </div>
          <button onClick={handleExport} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
            borderRadius: 6, padding: '7px 16px', fontSize: 13, fontWeight: 600,
            color: 'var(--text-primary)', cursor: 'pointer',
          }}>
            ↓ Export .txt
          </button>
        </div>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
          {[
            { title: 'Total Flows',      val: sessionFlows.toLocaleString(),   sub: 'captured this session',         color: '#388bfd' },
            { title: 'Attacks Detected', val: sessionAttacks.toLocaleString(), sub: `${detectionRate}% detection rate`, color: '#f85149' },
            { title: 'Benign Flows',     val: sessionBenign.toLocaleString(),  sub: 'clean traffic',                  color: 'var(--green)' },
            { title: 'Session Uptime',   val: formatUptime(uptime),            sub: engineStatus === 'online' ? 'Engine connected' : 'Demo mode', color: 'var(--text-primary)' },
          ].map(({ title, val, sub, color }) => (
            <div key={title} style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
              borderRadius: 10, padding: '16px 18px',
            }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8 }}>{title.toUpperCase()}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color, fontFamily: 'var(--font-mono)', marginBottom: 4 }}>{val}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>

          {/* Top attack types horizontal bar */}
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
            borderRadius: 10, padding: '16px 18px',
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>
              Top Attack Types
            </div>
            {topAttacks.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>
                No attacks recorded this session
              </div>
            ) : topAttacks.map((a, i) => {
              const colors = ['#f85149','#d29922','#388bfd','#bc8cff','#3dc9b0','#f0883e','#ff6b6b','#9a7dff']
              const color  = colors[i % colors.length]
              return (
                <div key={a.type} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>{a.type}</span>
                    <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color, fontWeight: 700 }}>{a.count}</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 3, background: color,
                      width: `${(a.count / maxAttacks) * 100}%`,
                      transition: 'width 0.5s ease',
                      boxShadow: `0 0 5px ${color}44`,
                    }}/>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Right column: severity + model accuracy + system status */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Severity */}
            <div style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
              borderRadius: 10, padding: '16px 18px',
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
                Severity Breakdown
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  ['CRITICAL', '#f85149', severityBreak.CRITICAL || 0],
                  ['HIGH',     '#f85149', severityBreak.HIGH     || 0],
                  ['MEDIUM',   '#d29922', severityBreak.MEDIUM   || 0],
                  ['LOW',      '#388bfd', severityBreak.LOW      || 0],
                ].map(([label, color, val]) => (
                  <div key={label} style={{
                    background: 'var(--bg-elevated)', borderRadius: 8,
                    padding: '10px 12px', border: '1px solid var(--border-subtle)',
                  }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: 'var(--font-mono)' }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Model accuracy */}
            <div style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
              borderRadius: 10, padding: '16px 18px',
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
                ML Model Accuracy
              </div>
              {[
                ['Binary Classifier',  '99.88%',  'Random Forest — benign vs attack'],
                ['Multi-class',        '99.48%',  'Random Forest — 14 attack types'],
                ['ROC-AUC Score',      '1.0000',  'Area Under Curve — perfect score'],
              ].map(([label, val, desc]) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 0', borderBottom: '1px solid var(--border-subtle)',
                }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>{label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{desc}</div>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>
                    {val}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System status */}
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
          borderRadius: 10, padding: '14px 18px', marginBottom: 14,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
            System Status
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[
              ['Python Engine', engineStatus === 'online' ? 'Online' : 'Offline', engineStatus === 'online' ? 'var(--green)' : '#f85149'],
              ['ML Models',     modelsLoaded ? 'Loaded' : 'Not Loaded',           modelsLoaded ? 'var(--green)' : 'var(--amber)'],
              ['Open Alerts',   alerts.length,                                     alerts.length > 5 ? '#f85149' : alerts.length > 0 ? '#d29922' : 'var(--green)'],
              ['Data Source',   isMock ? 'Demo / Mock' : 'Live Engine',            isMock ? 'var(--amber)' : 'var(--green)'],
            ].map(([label, val, color]) => (
              <div key={label} style={{
                background: 'var(--bg-elevated)', borderRadius: 8,
                padding: '10px 12px', border: '1px solid var(--border-subtle)',
              }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 3 }}>
                  {label.toUpperCase()}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color }}>{String(val)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent alerts preview */}
        {alerts.length > 0 && (
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
            borderRadius: 10, padding: '14px 18px', marginBottom: 14,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
              Recent Alerts (last {Math.min(alerts.length, 15)})
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '130px 80px 140px 130px 130px 90px',
              padding: '6px 8px', borderBottom: '1px solid var(--border-subtle)',
              fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
            }}>
              {['TIME','SEVERITY','ATTACK TYPE','SRC IP','DST IP','CONFIDENCE'].map(h => <span key={h}>{h}</span>)}
            </div>
            {alerts.slice(0, 15).map((a, i) => (
              <div key={`${a.id}-${i}`} style={{
                display: 'grid',
                gridTemplateColumns: '130px 80px 140px 130px 130px 90px',
                padding: '7px 8px', borderBottom: '1px solid var(--border-subtle)',
                fontSize: 12, alignItems: 'center',
              }}>
                <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                  {new Date(a.timestamp).toLocaleTimeString()}
                </span>
                <span><SevBadge sev={a.severity} /></span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{a.attack_type}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>{a.src_ip}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>{a.dst_ip}</span>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
                  color: a.confidence > 0.95 ? '#f85149' : a.confidence > 0.85 ? '#d29922' : 'var(--green)',
                }}>
                  {a.confidence != null ? `${(a.confidence * 100).toFixed(1)}%` : '—'}
                </span>
              </div>
            ))}
          </div>
        )}

        <PageFooter />
      </div>
    </div>
  )
}
