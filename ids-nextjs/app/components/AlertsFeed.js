'use client'
import { useRef, useEffect } from 'react'

const SEV = {
  HIGH:   { bg: 'rgba(248,81,73,0.08)',   text: '#f85149', badge: 'rgba(248,81,73,0.15)'  },
  MEDIUM: { bg: 'rgba(210,153,34,0.06)',  text: '#d29922', badge: 'rgba(210,153,34,0.15)' },
  LOW:    { bg: 'rgba(56,139,253,0.06)',  text: '#388bfd', badge: 'rgba(56,139,253,0.15)' },
}

function AlertRow({ alert, isNew }) {
  const s = SEV[alert.severity] || SEV.LOW
  const time = new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '64px 1fr 110px 60px 58px',
      gap: 8,
      padding: '9px 16px',
      background: isNew ? s.bg : 'transparent',
      borderBottom: '1px solid var(--border-subtle)',
      animation: isNew ? 'slide-down 0.25s ease' : undefined,
      alignItems: 'center',
      transition: 'background 0.4s',
    }}>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
        {time}
      </span>
      <span style={{ fontSize: 13, fontWeight: 500, color: s.text }}>
        {alert.attack_type}
      </span>
      <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
        {alert.src_ip}
      </span>
      <span style={{
        fontSize: 10, fontWeight: 600,
        color: s.text,
        background: s.badge,
        padding: '2px 7px', borderRadius: 4,
        textAlign: 'center', letterSpacing: '0.04em',
      }}>
        {alert.severity}
      </span>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textAlign: 'right' }}>
        {(alert.confidence * 100).toFixed(1)}%
      </span>
    </div>
  )
}

export default function AlertsFeed({ alerts }) {
  const ref = useRef(null)

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius)',
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: alerts.length > 0 ? 'var(--red)' : 'var(--green)',
            animation: 'pulse-dot 2s infinite',
          }}/>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
            Threat Alerts
          </span>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 500,
          color: alerts.length > 0 ? 'var(--red)' : 'var(--text-muted)',
          background: alerts.length > 0 ? 'var(--red-dim)' : 'transparent',
          padding: '2px 8px', borderRadius: 4,
        }}>
          {alerts.length > 0 ? `${alerts.length} active` : 'Clear'}
        </span>
      </div>

      {/* Column labels */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '64px 1fr 110px 60px 58px',
        gap: 8, padding: '7px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        fontSize: 11, color: 'var(--text-muted)',
        fontWeight: 500, letterSpacing: '0.03em',
      }}>
        <span>TIME</span><span>THREAT</span><span>SOURCE</span><span>SEV.</span><span style={{textAlign:'right'}}>CONF.</span>
      </div>

      {/* Rows */}
      <div ref={ref} style={{ overflowY: 'auto', maxHeight: 270 }}>
        {alerts.length === 0 ? (
          <div style={{
            padding: '40px 16px', textAlign: 'center',
            color: 'var(--text-muted)', fontSize: 13,
          }}>
            No threats detected
          </div>
        ) : alerts.map((a, i) => (
          <AlertRow key={a.id} alert={a} isNew={i < 3} />
        ))}
      </div>
    </div>
  )
}
