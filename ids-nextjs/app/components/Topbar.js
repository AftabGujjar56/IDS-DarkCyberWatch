'use client'
import { useRouter, usePathname } from 'next/navigation'
import { useIDS } from '../lib/IDSContext'

function formatUptime(s) {
  const h   = Math.floor(s / 3600)
  const m   = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
}

const NAV = [
  { label: 'Overview', path: '/'        },
  { label: 'Alerts',   path: '/alerts'  },
  { label: 'Traffic',  path: '/traffic' },
  { label: 'Reports',  path: '/reports' },
]

export default function Topbar() {
  const router   = useRouter()
  const pathname = usePathname()
  const { engineStatus, uptime } = useIDS()

  const statusColor = engineStatus === 'online'
    ? 'var(--green)'
    : engineStatus === 'offline'
      ? 'var(--red)'
      : 'var(--amber)'

  const statusLabel = engineStatus === 'online'
    ? 'Engine connected'
    : engineStatus === 'offline'
      ? 'Demo mode'
      : 'Connecting…'

  return (
    <header style={{
      height: 52, borderBottom: '1px solid var(--border-subtle)',
      background: 'var(--bg-surface)', display: 'flex', alignItems: 'center',
      padding: '0 20px', position: 'sticky', top: 0, zIndex: 100, gap: 16,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 28, height: 28,
          background: 'linear-gradient(135deg, #388bfd 0%, #8957e5 100%)',
          borderRadius: 7, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff',
        }}>D</div>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
          DarkCyberWatch
        </span>
      </div>

      <div style={{ width: 1, height: 20, background: 'var(--border-default)' }}/>

      {/* Nav buttons — router.push() keeps IDSProvider mounted = no state reset */}
      {NAV.map(({ label, path }) => {
        const active = pathname === path
        return (
          <button key={label}
            onClick={() => router.push(path)}
            style={{
              background:   active ? 'var(--bg-elevated)' : 'transparent',
              border:       active ? '1px solid var(--border-default)' : '1px solid transparent',
              borderRadius: 5, padding: '4px 12px', fontSize: 13, fontWeight: 500,
              color:  active ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer', transition: 'all 0.12s',
            }}
          >{label}</button>
        )
      })}

      {/* Right side */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Status dot */}
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: statusColor, display: 'inline-block',
            animation: 'pulse-dot 2s infinite',
          }}/>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
            {statusLabel}
          </span>
        </span>

        <div style={{ width: 1, height: 20, background: 'var(--border-default)' }}/>

        {/* Uptime — reads from shared context, same value on every page */}
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {formatUptime(uptime)}
        </span>
      </div>

      <style>{`@keyframes pulse-dot { 0%,100%{opacity:1}50%{opacity:0.4} }`}</style>
    </header>
  )
}
