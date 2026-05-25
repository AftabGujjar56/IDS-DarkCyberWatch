'use client'

export default function StatCard({ title, value, sub, accent = 'blue', icon, trend }) {
  const palette = {
    blue:   { color: 'var(--blue)',   dim: 'var(--blue-dim)'   },
    green:  { color: 'var(--green)',  dim: 'var(--green-dim)'  },
    red:    { color: 'var(--red)',    dim: 'var(--red-dim)'    },
    amber:  { color: 'var(--amber)',  dim: 'var(--amber-dim)'  },
    purple: { color: 'var(--purple)', dim: 'var(--purple-dim)' },
  }
  const p = palette[accent] || palette.blue

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius)',
      padding: '20px 20px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      transition: 'border-color 0.2s',
      cursor: 'default',
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-default)'}
    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
    >
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontSize: 12, fontWeight: 500,
          color: 'var(--text-secondary)',
          letterSpacing: '0.01em',
        }}>
          {title}
        </span>
        <div style={{
          width: 28, height: 28,
          background: p.dim,
          borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14,
        }}>
          {icon}
        </div>
      </div>

      {/* Value */}
      <div>
        <div style={{
          fontSize: 26, fontWeight: 700,
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-mono)',
          letterSpacing: '-0.02em',
          animation: 'count-up 0.3s ease',
          lineHeight: 1,
        }}>
          {value}
        </div>
        {sub && (
          <div style={{
            fontSize: 12, color: 'var(--text-muted)',
            marginTop: 6, fontWeight: 400,
          }}>
            {sub}
          </div>
        )}
      </div>

      {/* Bottom accent line */}
      <div style={{
        height: 2, borderRadius: 1,
        background: `linear-gradient(90deg, ${p.color} 0%, transparent 100%)`,
        opacity: 0.5,
        marginTop: 'auto',
      }}/>
    </div>
  )
}
