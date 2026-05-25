'use client'
import { useState, useMemo } from 'react'
import { useIDS }  from '../lib/IDSContext'
import Topbar      from '../components/Topbar'
import { LiveTrafficChart } from '../components/TrafficChart'
import { PageFooter } from '../components/SharedUI'

export default function TrafficPage() {
  const { events, chartData, sessionFlows, sessionAttacks, sessionBenign, engineStatus, isMock } = useIDS()

  const [showAttacks, setShowAttacks] = useState(true)
  const [showBenign,  setShowBenign]  = useState(true)
  const [protoFilter, setProtoFilter] = useState('')

  // Protocol counts computed from all events (not filtered)
  const protoCounts = useMemo(() => {
    const counts = { TCP: 0, UDP: 0, ICMP: 0, OTHER: 0 }
    for (const e of events) {
      const p = e.protocol?.toUpperCase()
      if (p === 'TCP' || p === 'UDP' || p === 'ICMP') counts[p]++
      else counts.OTHER++
    }
    return counts
  }, [events])

  const filtered = useMemo(() => events.filter(e => {
    if (!showAttacks && e.is_attack)  return false
    if (!showBenign  && !e.is_attack) return false
    if (protoFilter) {
      if (e.protocol?.toUpperCase() !== protoFilter) return false
    }
    return true
  }), [events, showAttacks, showBenign, protoFilter])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Topbar />

      <div style={{ padding: '20px', maxWidth: 1400, margin: '0 auto' }}>

        {/* Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Live Traffic Monitor</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
              {isMock ? '⚡ Demo data — ' : 'Live capture — '}
              {sessionFlows.toLocaleString()} total flows · {filtered.length} showing
            </p>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 12,
            color: engineStatus === 'online' ? 'var(--green)' : 'var(--amber)',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%', background: 'currentColor',
              display: 'inline-block', animation: 'pulse-dot 1.5s infinite',
            }}/>
            {engineStatus === 'online' ? 'Live capture active' : 'Demo — simulated traffic'}
          </div>
        </div>

        {/* Stat cards — 6 columns including ICMP */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Total Flows', val: sessionFlows.toLocaleString(),  color: 'var(--text-primary)' },
            { label: 'Attacks',     val: sessionAttacks.toLocaleString(), color: '#f85149' },
            { label: 'Benign',      val: sessionBenign.toLocaleString(),  color: 'var(--green)' },
            { label: 'TCP',         val: protoCounts.TCP.toLocaleString(),  color: '#388bfd' },
            { label: 'UDP',         val: protoCounts.UDP.toLocaleString(),  color: '#bc8cff' },
            { label: 'ICMP',        val: protoCounts.ICMP.toLocaleString(), color: '#3dc9b0' },
          ].map(({ label, val, color }) => (
            <div key={label} style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
              borderRadius: 8, padding: '10px 14px',
            }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 3 }}>{label.toUpperCase()}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color, fontFamily: 'var(--font-mono)' }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div style={{ marginBottom: 14 }}>
          <LiveTrafficChart data={chartData} />
        </div>

        {/* Filters */}
        <div style={{
          display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center',
          background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
          borderRadius: 8, padding: '10px 14px',
        }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>SHOW:</span>
          {[
            { label: '🔴 Attacks', active: showAttacks, toggle: () => setShowAttacks(p => !p) },
            { label: '🟢 Benign',  active: showBenign,  toggle: () => setShowBenign(p => !p) },
          ].map(({ label, active, toggle }) => (
            <button key={label} onClick={toggle} style={{
              padding: '3px 10px', borderRadius: 4, fontSize: 12, cursor: 'pointer',
              background: active ? 'var(--bg-elevated)' : 'transparent',
              border: active ? '1px solid var(--border-default)' : '1px solid transparent',
              color: active ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: active ? 600 : 400,
            }}>{label}</button>
          ))}

          <div style={{ width: 1, height: 16, background: 'var(--border-default)' }}/>

          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>PROTOCOL:</span>
          {['', 'TCP', 'UDP', 'ICMP'].map(p => (
            <button key={p || 'all'} onClick={() => setProtoFilter(p)} style={{
              padding: '3px 10px', borderRadius: 4, fontSize: 12, cursor: 'pointer',
              background: protoFilter === p ? 'var(--bg-elevated)' : 'transparent',
              border: protoFilter === p ? '1px solid var(--border-default)' : '1px solid transparent',
              color: protoFilter === p ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: protoFilter === p ? 600 : 400,
            }}>{p || 'All'}</button>
          ))}

          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>
            Showing {filtered.length} of {events.length}
          </span>
        </div>

        {/* Traffic table */}
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
          borderRadius: 10, overflow: 'hidden',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '130px 160px 130px 130px 65px 65px 75px 90px',
            padding: '8px 14px', borderBottom: '1px solid var(--border-subtle)',
            fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
          }}>
            {['TIMESTAMP','STATUS / TYPE','SRC IP','DST IP','PORT','PROTO','BYTES','CONFIDENCE'].map(h => (
              <span key={h}>{h}</span>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              {events.length === 0 ? 'No traffic events yet — waiting for data…' : 'No events match current filters.'}
            </div>
          ) : (
            filtered.slice(0, 150).map((e, i) => (
              <div key={`${e.id}-${i}`} style={{
                display: 'grid',
                gridTemplateColumns: '130px 160px 130px 130px 65px 65px 75px 90px',
                padding: '7px 14px',
                borderBottom: '1px solid var(--border-subtle)',
                fontSize: 12, alignItems: 'center',
                background: e.is_attack ? 'rgba(248,81,73,0.03)' : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
              }}>
                <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                  {new Date(e.timestamp).toLocaleTimeString()}
                </span>

                {/* Status badge with attack type */}
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 4,
                  display: 'inline-block', maxWidth: '100%',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  background: e.is_attack ? 'rgba(248,81,73,0.12)' : 'rgba(61,201,176,0.10)',
                  color: e.is_attack ? '#f85149' : 'var(--green)',
                  border: `1px solid ${e.is_attack ? 'rgba(248,81,73,0.25)' : 'rgba(61,201,176,0.2)'}`,
                }}>
                  {e.is_attack ? `⚡ ${e.label}` : '✓ BENIGN'}
                </span>

                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>{e.src_ip}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>{e.dst_ip}</span>

                {/* ICMP shows — for port (no port concept in ICMP) */}
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                  {e.protocol?.toUpperCase() === 'ICMP' ? '—' : (e.dst_port ?? '—')}
                </span>

                {/* Protocol badge with distinct colors */}
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 3,
                  background: e.protocol === 'TCP' ? 'rgba(56,139,253,0.1)' : e.protocol === 'UDP' ? 'rgba(188,140,255,0.1)' : 'rgba(61,201,176,0.1)',
                  color:      e.protocol === 'TCP' ? '#388bfd' : e.protocol === 'UDP' ? '#bc8cff' : '#3dc9b0',
                  border: `1px solid ${e.protocol === 'TCP' ? 'rgba(56,139,253,0.2)' : e.protocol === 'UDP' ? 'rgba(188,140,255,0.2)' : 'rgba(61,201,176,0.2)'}`,
                }}>{e.protocol || 'TCP'}</span>

                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                  {e.bytes_fwd != null ? `${e.bytes_fwd}B` : '—'}
                </span>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 11,
                  color: e.confidence > 0.95 ? '#f85149' : e.confidence > 0.85 ? '#d29922' : 'var(--green)',
                }}>
                  {e.confidence != null ? `${(e.confidence * 100).toFixed(1)}%` : '—'}
                </span>
              </div>
            ))
          )}
        </div>

        <PageFooter />
      </div>
      <style>{`@keyframes pulse-dot { 0%,100%{opacity:1}50%{opacity:0.4} }`}</style>
    </div>
  )
}
