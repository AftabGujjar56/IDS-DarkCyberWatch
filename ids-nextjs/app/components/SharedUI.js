'use client'

export function SevBadge({ sev }) {
  const map = {
    CRITICAL: { bg: 'rgba(248,81,73,0.18)',  color: '#f85149', border: 'rgba(248,81,73,0.4)' },
    HIGH:     { bg: 'rgba(248,81,73,0.10)',  color: '#f85149', border: 'rgba(248,81,73,0.25)' },
    MEDIUM:   { bg: 'rgba(210,153,34,0.15)', color: '#d29922', border: 'rgba(210,153,34,0.3)' },
    LOW:      { bg: 'rgba(56,139,253,0.12)', color: '#388bfd', border: 'rgba(56,139,253,0.25)' },
  }
  const s = map[sev] || map.LOW
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      letterSpacing: '0.04em', whiteSpace: 'nowrap',
    }}>{sev}</span>
  )
}

export function PageFooter() {
  return (
    <div style={{
      borderTop: '1px solid var(--border-subtle)', paddingTop: 12, marginTop: 16,
      display: 'flex', justifyContent: 'space-between',
      fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
    }}>
      <span>DarkCyberWatch v1.0.0</span>
      <span>Binary: 99.88% · Multi-class: 99.48% · ROC-AUC: 1.0000</span>
      <span>© 2026 DarkCyberWatch</span>
    </div>
  )
}
