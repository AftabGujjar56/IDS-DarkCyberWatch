'use client'
import { useState, useCallback } from 'react'
import { useIDS }           from './lib/IDSContext'
import Topbar               from './components/Topbar'
import StatCard             from './components/StatCard'
import AlertsFeed           from './components/AlertsFeed'
import LiveMonitor          from './components/LiveMonitor'
import { LiveTrafficChart, AttackBreakdownChart } from './components/TrafficChart'
import { SevBadge, PageFooter } from './components/SharedUI'

const ATTACK_TYPES = [
  { value: 'DoS',          label: 'DoS',         icon: '💥', color: '#f85149' },
  { value: 'DDoS',         label: 'DDoS',         icon: '🌊', color: '#f85149' },
  { value: 'PortScan',     label: 'Port Scan',    icon: '🔍', color: '#d29922' },
  { value: 'Brute Force',  label: 'Brute Force',  icon: '🔓', color: '#d29922' },
  { value: 'Web Attack',   label: 'Web Attack',   icon: '🌐', color: '#388bfd' },
  { value: 'Infiltration', label: 'Infiltration', icon: '🕵️', color: '#bc8cff' },
  { value: 'Bot',          label: 'Bot',          icon: '🤖', color: '#3dc9b0' },
]

function SimulatePanel() {
  const { simulateAttack, isSimulating, engineStatus } = useIDS()

  const [open,       setOpen]       = useState(false)
  const [attackType, setAttackType] = useState('DoS')
  const [count,      setCount]      = useState(1)
  const [toast,      setToast]      = useState(null)

  const selected = ATTACK_TYPES.find(a => a.value === attackType) || ATTACK_TYPES[0]

  const handleLaunch = useCallback(async () => {
    setOpen(false)
    const result = await simulateAttack(attackType, count)
    if (result?.success) {
      setToast({ attackType, count: result.alerts?.length || count, isMock: result.is_mock })
      setTimeout(() => setToast(null), 5000)
    }
  }, [attackType, count, simulateAttack])

  return (
    <>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 64, right: 20, zIndex: 400,
          background: 'var(--bg-surface)', border: '1px solid rgba(248,81,73,0.4)',
          borderRadius: 8, padding: '12px 16px', minWidth: 280,
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
          animation: 'slideIn 0.2s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 15 }}>⚡</span>
            <span style={{ fontWeight: 700, fontSize: 13, color: '#f85149' }}>Attack Simulated</span>
            {toast.isMock && <span style={{ fontSize: 10, color: 'var(--amber)', background: 'rgba(210,153,34,0.1)', padding: '1px 6px', borderRadius: 3 }}>DEMO</span>}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {toast.count}× <strong style={{ color: 'var(--text-primary)' }}>{toast.attackType}</strong> flows injected
          </div>
          <div style={{ marginTop: 6, height: 3, borderRadius: 2, background: 'rgba(248,81,73,0.15)', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: '#f85149', animation: 'shrink 5s linear forwards' }}/>
          </div>
        </div>
      )}

      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setOpen(p => !p)}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: open ? 'rgba(248,81,73,0.15)' : 'rgba(248,81,73,0.08)',
            border: '1px solid rgba(248,81,73,0.35)',
            borderRadius: 6, padding: '6px 14px',
            fontSize: 13, fontWeight: 600, color: '#f85149', cursor: 'pointer',
          }}
        >⚡ Simulate Attacks</button>

        {open && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0,
            background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
            borderRadius: 10, padding: 16, width: 300, zIndex: 200,
            boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
              Simulate Attack
            </div>

            {/* Engine notice */}
            <div style={{
              fontSize: 11, padding: '6px 10px', borderRadius: 5, marginBottom: 12,
              background: engineStatus === 'online' ? 'rgba(61,201,176,0.08)' : 'rgba(210,153,34,0.08)',
              border: `1px solid ${engineStatus === 'online' ? 'rgba(61,201,176,0.2)' : 'rgba(210,153,34,0.2)'}`,
              color: engineStatus === 'online' ? 'var(--green)' : 'var(--amber)',
            }}>
              {engineStatus === 'online'
                ? '✓ Real ML — flows run through Random Forest model'
                : '⚡ Demo mode — simulated results (engine offline)'}
            </div>

            {/* Type grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginBottom: 12 }}>
              {ATTACK_TYPES.map(a => {
                const rgb = a.color === '#f85149' ? '248,81,73' : a.color === '#d29922' ? '210,153,34' : a.color === '#388bfd' ? '56,139,253' : '188,140,255'
                return (
                  <button key={a.value}
                    onClick={() => setAttackType(a.value)}
                    style={{
                      padding: '5px 8px', borderRadius: 5, fontSize: 12, fontWeight: 500,
                      textAlign: 'left', cursor: 'pointer',
                      background: attackType === a.value ? `rgba(${rgb},0.15)` : 'var(--bg-elevated)',
                      border: attackType === a.value ? `1px solid ${a.color}66` : '1px solid var(--border-subtle)',
                      color:  attackType === a.value ? a.color : 'var(--text-secondary)',
                    }}
                  >{a.icon} {a.label}</button>
                )
              })}
            </div>

            {/* Count */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 5, display: 'flex', justifyContent: 'space-between' }}>
                <span>FLOW COUNT</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{count}</span>
              </div>
              <input type="range" min={1} max={20} value={count}
                onChange={e => setCount(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#f85149' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                <span>1</span><span>20</span>
              </div>
            </div>

            <button
              onClick={handleLaunch}
              disabled={isSimulating}
              style={{
                width: '100%', padding: '8px 0', borderRadius: 6,
                background: isSimulating ? 'var(--bg-elevated)' : 'rgba(248,81,73,0.15)',
                border: '1px solid rgba(248,81,73,0.4)',
                color: isSimulating ? 'var(--text-muted)' : '#f85149',
                fontSize: 13, fontWeight: 700, cursor: isSimulating ? 'not-allowed' : 'pointer',
              }}
            >
              {isSimulating ? '⏳ Running…' : `⚡ Launch ${selected.icon} ${selected.label} ×${count}`}
            </button>
          </div>
        )}
      </div>
    </>
  )
}

export default function Dashboard() {
  const {
    alerts, events, chartData, topAttacks, severityBreak,
    sessionFlows, sessionAttacks, sessionBenign,
    attackPct, networkStatus, isMock,
  } = useIDS()

  // Threats today = total attacks in current session (same as sessionAttacks)
  const threatsToday = sessionAttacks

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Topbar />

      <div style={{ padding: '20px', maxWidth: 1400, margin: '0 auto' }}>

        {/* Title row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              Network Overview
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
              Real-time intrusion detection · Random Forest · CICIDS2017
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isMock && (
              <div style={{
                fontSize: 12, fontWeight: 500, color: 'var(--amber)',
                background: 'rgba(210,153,34,0.08)', border: '1px solid rgba(210,153,34,0.25)',
                padding: '6px 12px', borderRadius: 5,
              }}>
                ⚡ Demo mode — start FastAPI on :8000 for live data
              </div>
            )}
            <SimulatePanel />
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 14 }}>
          <StatCard title="Total Flows"      value={sessionFlows.toLocaleString()}   sub="this session"                accent="blue"  icon="📡"/>
          <StatCard title="Attacks Detected" value={sessionAttacks.toLocaleString()} sub={`${attackPct}% of traffic`}  accent="red"   icon="🚨"/>
          <StatCard title="Benign Flows"     value={sessionBenign.toLocaleString()}  sub="clean traffic"               accent="green" icon="✓"/>
          <StatCard title="Threats Today"    value={threatsToday.toLocaleString()}   sub="this session"                accent="amber" icon="🛡"/>
          <StatCard
            title="Network Status"
            value={networkStatus}
            sub={alerts.length > 0 ? `${alerts.length} open alerts` : 'All systems normal'}
            accent={alerts.length > 5 ? 'red' : alerts.length > 0 ? 'amber' : 'green'}
            icon={alerts.length > 5 ? '⚠' : alerts.length > 0 ? '◐' : '●'}
          />
        </div>

        {/* Severity breakdown */}
        {(severityBreak.CRITICAL + severityBreak.HIGH + severityBreak.MEDIUM + severityBreak.LOW) > 0 && (
          <div style={{
            marginBottom: 14, padding: '9px 14px',
            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
            borderRadius: 8, display: 'flex', alignItems: 'center', gap: 18,
          }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>SEVERITY</span>
            {[
              ['CRITICAL', '#f85149', severityBreak.CRITICAL],
              ['HIGH',     '#f85149', severityBreak.HIGH],
              ['MEDIUM',   '#d29922', severityBreak.MEDIUM],
              ['LOW',      '#388bfd', severityBreak.LOW],
            ].map(([label, color, val]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: color }}/>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{val}</span>
              </div>
            ))}
          </div>
        )}

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 12 }}>
          <LiveTrafficChart data={chartData} />
          <AttackBreakdownChart data={topAttacks} />
        </div>

        {/* Tables */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <AlertsFeed alerts={alerts} />
          <LiveMonitor events={events} />
        </div>

        <PageFooter />
      </div>

      <style>{`
        @keyframes slideIn { from { transform: translateX(20px); opacity: 0 } to { transform: none; opacity: 1 } }
        @keyframes shrink  { from { width: 100% } to { width: 0% } }
      `}</style>
    </div>
  )
}
