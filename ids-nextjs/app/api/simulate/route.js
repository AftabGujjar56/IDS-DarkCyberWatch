const PYTHON_URL = process.env.PYTHON_ENGINE_URL || 'http://localhost:8000'

// Demo simulate — runs client-side when engine is offline
// Returns realistic mock results so the UI still works
function demoSimulate(attackType, count) {
  const PROFILES = {
    'DoS':          { ports: [80,443,8080],     proto: 'TCP',  confMin: 0.94 },
    'PortScan':     { ports: [22,80,443,3306],  proto: 'TCP',  confMin: 0.91 },
    'Brute Force':  { ports: [22,3389,21],      proto: 'TCP',  confMin: 0.89 },
    'Web Attack':   { ports: [80,443],          proto: 'TCP',  confMin: 0.87 },
    'Infiltration': { ports: [443,4444],        proto: 'TCP',  confMin: 0.92 },
    'Bot':          { ports: [6667,1080],       proto: 'TCP',  confMin: 0.90 },
    'DDoS':         { ports: [80,443,53],       proto: 'UDP',  confMin: 0.95 },
  }
  const SRC_IPS  = ['185.220.101.45','45.33.32.156','198.51.100.7','91.108.4.1','203.0.113.5']
  const DST_IPS  = ['192.168.1.10','10.0.0.42','172.16.0.5','192.168.2.100']

  const p       = PROFILES[attackType] || PROFILES['DoS']
  const alerts  = Array.from({ length: count }, (_, i) => {
    const conf = +(p.confMin + Math.random() * (1 - p.confMin - 0.005)).toFixed(4)
    const sev  = conf > 0.98 ? 'CRITICAL' : conf > 0.95 ? 'HIGH' : conf > 0.85 ? 'MEDIUM' : 'LOW'
    return {
      id:          Date.now() / 1000 + i * 0.001,
      timestamp:   new Date().toISOString(),
      attack_type: attackType,
      src_ip:      SRC_IPS[i % SRC_IPS.length],
      dst_ip:      DST_IPS[i % DST_IPS.length],
      protocol:    p.proto,
      dst_port:    p.ports[i % p.ports.length],
      confidence:  conf,
      severity:    sev,
      simulated:   true,
    }
  })

  return {
    success:     true,
    attack_type: attackType,
    count,
    alerts,
    message:     `[Demo] Simulated ${count} ${attackType} flow(s). Start the Python engine for real ML predictions.`,
    is_mock:     true,
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { attack_type = 'DoS', count = 1 } = body

    // Try real engine first
    try {
      const res = await fetch(`${PYTHON_URL}/simulate`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ attack_type, count }),
        signal:  AbortSignal.timeout(8000),
      })
      if (!res.ok) throw new Error(`Engine error ${res.status}`)
      const data = await res.json()
      return Response.json({ ...data, is_mock: false })
    } catch {
      // Engine offline — use demo simulate
      return Response.json(demoSimulate(attack_type, count))
    }
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 400 })
  }
}
