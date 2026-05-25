'use client'
import { useRef } from 'react'

const PROTO_COLOR = { TCP: 'var(--blue)', UDP: 'var(--amber)', ICMP: 'var(--purple)' }

function Row({ event, isNew }) {
  const time = new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const isAttack = event.is_attack

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '64px 110px 110px 44px 44px 1fr 58px',
      gap: 8,
      padding: '8px 16px',
      borderBottom: '1px solid var(--border-subtle)',
      background: isNew && isAttack ? 'rgba(248,81,73,0.05)' : 'transparent',
      animation: isNew ? 'fade-in 0.25s ease' : undefined,
      alignItems: 'center',
      fontSize: 12,
    }}>
      <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{time}</span>
      <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{event.src_ip}</span>
      <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{event.dst_ip}</span>
      <span style={{ color: PROTO_COLOR[event.protocol] || 'var(--text-secondary)', fontWeight: 500, fontSize: 11 }}>{event.protocol}</span>
      <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{event.dst_port}</span>
      <span style={{
        fontWeight: isAttack ? 600 : 400,
        color: isAttack ? 'var(--red)' : 'var(--green)',
        fontSize: 12,
      }}>
        {isAttack ? `⚠ ${event.label}` : 'Clean'}
      </span>
      <span style={{
        color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
        fontSize: 11, textAlign: 'right',
      }}>
        {(event.confidence * 100).toFixed(1)}%
      </span>
    </div>
  )
}

export default function LiveMonitor({ events }) {
  const ref = useRef(null)

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius)',
      overflow: 'hidden',
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
            background: 'var(--green)',
            animation: 'pulse-dot 1.5s infinite',
          }}/>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
            Live Traffic
          </span>
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {events.length} flows
        </span>
      </div>

      {/* Column labels */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '64px 110px 110px 44px 44px 1fr 58px',
        gap: 8, padding: '7px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        fontSize: 11, color: 'var(--text-muted)',
        fontWeight: 500, letterSpacing: '0.03em',
      }}>
        <span>TIME</span><span>SRC</span><span>DST</span>
        <span>PROTO</span><span>PORT</span><span>STATUS</span>
        <span style={{textAlign:'right'}}>CONF.</span>
      </div>

      <div ref={ref} style={{ overflowY: 'auto', maxHeight: 270 }}>
        {events.length === 0 ? (
          <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            Awaiting traffic...
          </div>
        ) : events.map((e, i) => (
          <Row key={e.id} event={e} isNew={i < 5} />
        ))}
      </div>
    </div>
  )
}
