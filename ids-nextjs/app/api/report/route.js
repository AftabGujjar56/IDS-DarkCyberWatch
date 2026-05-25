const PYTHON_URL = process.env.PYTHON_ENGINE_URL || 'http://localhost:8000'

function getDemoReport() {
  return {
    generated_at:     new Date().toISOString(),
    uptime_seconds:   7200,
    total_flows:      3847,
    attacks_detected: 213,
    benign_flows:     3634,
    detection_rate:   5.54,
    top_attacks: [
      { type: 'DoS Hulk',          count: 72 },
      { type: 'PortScan',          count: 58 },
      { type: 'DDoS',              count: 41 },
      { type: 'DoS GoldenEye',     count: 22 },
      { type: 'FTP-Patator',       count: 11 },
      { type: 'SSH-Patator',       count:  6 },
      { type: 'Web Attack – XSS',  count:  3 },
    ],
    severity_breakdown: {
      CRITICAL: 28,
      HIGH:     91,
      MEDIUM:   72,
      LOW:      22,
    },
    live_capture:  false,
    models_loaded: false,
    recent_alerts: [],
    model_accuracy: {
      binary:     '99.88%',
      multiclass: '99.48%',
      roc_auc:    '1.0000',
    },
    is_mock: true,
  }
}

export async function GET() {
  try {
    const res = await fetch(`${PYTHON_URL}/report`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) throw new Error('bad response')
    const data = await res.json()
    return Response.json({ ...data, is_mock: false })
  } catch {
    return Response.json(getDemoReport())
  }
}
