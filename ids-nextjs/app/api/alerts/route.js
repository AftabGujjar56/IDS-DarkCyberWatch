const PYTHON_URL = process.env.PYTHON_ENGINE_URL || 'http://localhost:8000'

const DEMO_IPS  = ['192.168.1.10','10.0.0.42','172.16.0.5','192.168.2.100','10.10.1.33']
const EXT_IPS   = ['203.0.113.5','198.51.100.7','185.220.101.45','45.33.32.156','91.108.4.1']
const DEMO_ATTACKS = [
  { type: 'DoS Hulk',          sev: 'HIGH',     conf: 0.9812 },
  { type: 'PortScan',          sev: 'MEDIUM',   conf: 0.9341 },
  { type: 'DDoS',              sev: 'CRITICAL', conf: 0.9923 },
  { type: 'DoS GoldenEye',     sev: 'HIGH',     conf: 0.9654 },
  { type: 'FTP-Patator',       sev: 'MEDIUM',   conf: 0.8876 },
  { type: 'SSH-Patator',       sev: 'MEDIUM',   conf: 0.9102 },
  { type: 'Web Attack – XSS',  sev: 'LOW',      conf: 0.8543 },
  { type: 'Bot',               sev: 'HIGH',     conf: 0.9411 },
]

function makeDemoAlerts(count = 20) {
  return Array.from({ length: count }, (_, i) => {
    const atk  = DEMO_ATTACKS[i % DEMO_ATTACKS.length]
    const d    = new Date(Date.now() - i * 47000)
    return {
      id:          d.getTime() / 1000,
      timestamp:   d.toISOString(),
      attack_type: atk.type,
      src_ip:      EXT_IPS[i % EXT_IPS.length],
      dst_ip:      DEMO_IPS[i % DEMO_IPS.length],
      protocol:    i % 3 === 0 ? 'UDP' : 'TCP',
      dst_port:    [80, 443, 22, 3389, 8080, 53][i % 6],
      confidence:  atk.conf,
      severity:    atk.sev,
    }
  })
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const limit      = parseInt(searchParams.get('limit') || '50')
  const severity   = searchParams.get('severity') || ''
  const attackType = searchParams.get('attack_type') || ''

  try {
    const params = new URLSearchParams({ limit })
    if (severity)   params.set('severity', severity)
    if (attackType) params.set('attack_type', attackType)

    const res = await fetch(`${PYTHON_URL}/alerts?${params}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) throw new Error('bad response')
    const data = await res.json()
    return Response.json({ ...data, is_mock: false })
  } catch {
    let alerts = makeDemoAlerts(50)
    if (severity)   alerts = alerts.filter(a => a.severity === severity.toUpperCase())
    if (attackType) alerts = alerts.filter(a => a.attack_type.toLowerCase().includes(attackType.toLowerCase()))
    return Response.json({ alerts: alerts.slice(0, limit), count: alerts.length, is_mock: true })
  }
}
