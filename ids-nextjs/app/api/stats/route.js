const PYTHON_URL = process.env.PYTHON_ENGINE_URL || 'http://localhost:8000'

// Demo data — realistic attack distribution matching CICIDS2017 dataset
function getDemoStats() {
  const base = {
    total_flows:      1248,
    attacks_detected: 87,
    benign_flows:     1161,
    uptime_seconds:   3600,
    live_capture:     false,
    models_loaded:    false,
    simulated_attacks: 0,
    top_attacks: [
      { type: 'DoS Hulk',         count: 28 },
      { type: 'PortScan',         count: 21 },
      { type: 'DDoS',             count: 15 },
      { type: 'DoS GoldenEye',    count: 10 },
      { type: 'FTP-Patator',      count:  7 },
      { type: 'SSH-Patator',      count:  4 },
      { type: 'Web Attack – XSS', count:  2 },
    ],
    severity_breakdown: {
      CRITICAL: 12,
      HIGH:     31,
      MEDIUM:   29,
      LOW:      15,
    },
    recent_alerts: [],
    is_mock: true,
  }
  return base
}

export async function GET() {
  try {
    const res = await fetch(`${PYTHON_URL}/stats`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) throw new Error('bad response')
    const data = await res.json()
    return Response.json({ ...data, is_mock: false })
  } catch {
    return Response.json(getDemoStats())
  }
}
