'use client'
import { useState } from 'react'

const ATTACK_TYPES = [
  'DoS Hulk', 'DDoS', 'PortScan', 'FTP-Patator',
  'SSH-Patator', 'DoS GoldenEye', 'DoS Slowloris',
  'Bot', 'Web Attack - XSS',
]

const SEV_COLOR = { HIGH: '#f85149', MEDIUM: '#d29922', LOW: '#388bfd' }

export default function SimulateButton({ onResult }) {
  const [open,       setOpen]       = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [selected,   setSelected]   = useState('DoS Hulk')
  const [srcIp,      setSrcIp]      = useState('10.0.0.1')
  const [lastResult, setLastResult] = useState(null)

  const simulate = async () => {
    setLoading(true)
    setLastResult(null)
    try {
      const r = await fetch('/api/simulate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ attack_type: selected, src_ip: srcIp, count: 1 }),
      })
      const d = await r.json()
      setLastResult(d)
      if (onResult) onResult(d)
    } catch (e) {
      setLastResult({ success: false, error: e.message })
    }
    setLoading(false)
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background:   'rgba(248,81,73,0.12)',
          border:       '1px solid rgba(248,81,73,0.4)',
          borderRadius: 6,
          padding:      '7px 14px',
          fontSize:     13,
          fontWeight:   600,
          color:        '#f85149',
          cursor:       'pointer',
          display:      'flex',
          alignItems:   'center',
          gap:          6,
          transition:   'all 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,81,73,0.2)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(248,81,73,0.12)'}
      >
        ⚡ Simulate Attack
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position:   'absolute',
          top:        '110%',
          right:      0,
          width:      280,
          background: 'var(--bg-elevated)',
          border:     '1px solid var(--border-default)',
          borderRadius: 8,
          padding:    16,
          zIndex:     200,
          boxShadow:  '0 8px 32px rgba(0,0,0,0.4)',
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
            Inject Simulated Attack
          </div>

          {/* Attack type */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>ATTACK TYPE</div>
            <select
              value={selected}
              onChange={e => setSelected(e.target.value)}
              style={{
                width:        '100%',
                background:   'var(--bg-surface)',
                border:       '1px solid var(--border-default)',
                borderRadius: 5,
                padding:      '6px 10px',
                fontSize:     13,
                color:        'var(--text-primary)',
                cursor:       'pointer',
              }}
            >
              {ATTACK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Source IP */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>SOURCE IP</div>
            <input
              value={srcIp}
              onChange={e => setSrcIp(e.target.value)}
              style={{
                width:        '100%',
                background:   'var(--bg-surface)',
                border:       '1px solid var(--border-default)',
                borderRadius: 5,
                padding:      '6px 10px',
                fontSize:     13,
                color:        'var(--text-primary)',
                fontFamily:   'var(--font-mono)',
                boxSizing:    'border-box',
              }}
            />
          </div>

          {/* Fire button */}
          <button
            onClick={simulate}
            disabled={loading}
            style={{
              width:        '100%',
              background:   loading ? 'rgba(248,81,73,0.08)' : 'rgba(248,81,73,0.15)',
              border:       '1px solid rgba(248,81,73,0.5)',
              borderRadius: 5,
              padding:      '8px 0',
              fontSize:     13,
              fontWeight:   600,
              color:        '#f85149',
              cursor:       loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Injecting...' : '⚡ Fire Attack'}
          </button>

          {/* Result */}
          {lastResult && (
            <div style={{
              marginTop:    10,
              padding:      '8px 10px',
              background:   lastResult.success ? 'rgba(248,81,73,0.08)' : 'rgba(56,139,253,0.08)',
              border:       `1px solid ${lastResult.success ? 'rgba(248,81,73,0.3)' : 'rgba(56,139,253,0.3)'}`,
              borderRadius: 5,
              fontSize:     12,
            }}>
              {lastResult.success ? (
                <>
                  <div style={{ color: '#f85149', fontWeight: 600, marginBottom: 2 }}>
                    ⚠ {lastResult.attack_type} injected
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    Severity: <span style={{ color: SEV_COLOR[lastResult.severity] }}>{lastResult.severity}</span>
                    {' · '}Confidence: {(lastResult.confidence * 100).toFixed(1)}%
                  </div>
                </>
              ) : (
                <div style={{ color: 'var(--text-muted)' }}>
                  Engine offline — start FastAPI to use this feature
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => setOpen(false)}
            style={{
              marginTop:  8,
              width:      '100%',
              background: 'transparent',
              border:     'none',
              color:      'var(--text-muted)',
              fontSize:   12,
              cursor:     'pointer',
              padding:    4,
            }}
          >
            Close
          </button>
        </div>
      )}
    </div>
  )
}
