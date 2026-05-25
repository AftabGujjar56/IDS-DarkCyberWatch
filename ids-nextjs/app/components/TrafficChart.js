'use client'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

// ── Live Traffic Area Chart ───────────────────────────────────
export function LiveTrafficChart({ data = [] }) {
  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
      borderRadius: 10, padding: '14px 16px',
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
        Live Traffic
        <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8 }}>
          flows / tick
        </span>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gBenign"  x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#3dc9b0" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3dc9b0" stopOpacity={0.02}/>
            </linearGradient>
            <linearGradient id="gAttacks" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#f85149" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#f85149" stopOpacity={0.02}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
          <XAxis dataKey="time"
            tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
            axisLine={false} tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false}/>
          <Tooltip
            contentStyle={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
              borderRadius: 6, fontSize: 12,
            }}
            labelStyle={{ color: 'var(--text-secondary)' }}
          />
          <Area type="monotone" dataKey="benign"  stroke="#3dc9b0" strokeWidth={1.5} fill="url(#gBenign)"  name="Benign"  dot={false}/>
          <Area type="monotone" dataKey="attacks" stroke="#f85149" strokeWidth={1.5} fill="url(#gAttacks)" name="Attacks" dot={false}/>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Attack Breakdown — real named types, per-type colors ──────
const TYPE_COLORS = {
  'DoS Hulk':                    '#f85149',
  'DoS GoldenEye':               '#f85149',
  'DoS slowloris':                '#f85149',
  'DoS Slowhttptest':             '#f85149',
  'DDoS':                        '#ff6b6b',
  'PortScan':                    '#d29922',
  'FTP-Patator':                 '#bc8cff',
  'SSH-Patator':                 '#9a7dff',
  'Bot':                         '#3dc9b0',
  'Infiltration':                '#388bfd',
  'Web Attack – Brute Force':    '#f0883e',
  'Web Attack – XSS':            '#f0883e',
  'Web Attack – Sql Injection':  '#f0883e',
  'Heartbleed':                  '#ff4d6d',
  // Simulate types
  'DoS':                         '#f85149',
  'Brute Force':                 '#f0883e',
  'Web Attack':                  '#f0883e',
}
const FALLBACK_COLORS = ['#f85149','#d29922','#388bfd','#bc8cff','#3dc9b0','#f0883e','#ff6b6b','#9a7dff']

const DEMO_DATA = [
  { type: 'DoS Hulk',      count: 28 },
  { type: 'PortScan',      count: 21 },
  { type: 'DDoS',          count: 15 },
  { type: 'DoS GoldenEye', count: 10 },
  { type: 'FTP-Patator',   count:  7 },
]

export function AttackBreakdownChart({ data = [] }) {
  const chartData = data.length > 0 ? data.slice(0, 8) : DEMO_DATA
  const isDemo    = data.length === 0
  const maxCount  = Math.max(...chartData.map(d => d.count), 1)

  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
      borderRadius: 10, padding: '14px 16px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Top Threats</div>
        {isDemo && (
          <span style={{
            fontSize: 10, color: 'var(--amber)',
            background: 'rgba(210,153,34,0.1)', padding: '2px 7px',
            borderRadius: 4, border: '1px solid rgba(210,153,34,0.2)',
          }}>DEMO</span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {chartData.map((item, i) => {
          const color = TYPE_COLORS[item.type] || FALLBACK_COLORS[i % FALLBACK_COLORS.length]
          const pct   = (item.count / maxCount) * 100
          return (
            <div key={item.type}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{
                  fontSize: 11, color: 'var(--text-primary)', fontWeight: 500,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '78%',
                }}>{item.type}</span>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, color }}>
                  {item.count}
                </span>
              </div>
              <div style={{ height: 6, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 3, background: color,
                  width: `${pct}%`, transition: 'width 0.6s ease',
                  boxShadow: `0 0 5px ${color}55`,
                }}/>
              </div>
            </div>
          )
        })}
      </div>

      {!isDemo && (
        <div style={{
          marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--border-subtle)',
          fontSize: 11, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between',
        }}>
          <span>{chartData.length} type{chartData.length !== 1 ? 's' : ''}</span>
          <span>Total: {chartData.reduce((s, d) => s + d.count, 0)}</span>
        </div>
      )}
    </div>
  )
}
