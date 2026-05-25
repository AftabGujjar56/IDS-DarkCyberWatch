const PYTHON_URL = process.env.PYTHON_ENGINE_URL || 'http://localhost:8000'

const DEMO_IPS  = ['192.168.1.10','10.0.0.42','172.16.0.5','192.168.2.100','10.10.1.33','192.168.3.55']
const EXT_IPS   = ['203.0.113.5','198.51.100.7','185.220.101.45','45.33.32.156','8.8.8.8','1.1.1.1']
const PROTOCOLS = ['TCP','TCP','TCP','UDP','ICMP']
const LABELS    = ['BENIGN','BENIGN','BENIGN','BENIGN','DoS Hulk','PortScan','DDoS','FTP-Patator']

let _demoCounter = 1000

function makeDemoEvents(count = 30) {
  return Array.from({ length: count }, (_, i) => {
    const label    = LABELS[Math.floor(Math.random() * LABELS.length)]
    const isAttack = label !== 'BENIGN'
    const d        = new Date(Date.now() - i * 3200)
    return {
      id:         (_demoCounter++ ),
      timestamp:  d.toISOString(),
      src_ip:     isAttack ? EXT_IPS[i % EXT_IPS.length] : DEMO_IPS[i % DEMO_IPS.length],
      dst_ip:     DEMO_IPS[(i + 2) % DEMO_IPS.length],
      protocol:   PROTOCOLS[i % PROTOCOLS.length],
      dst_port:   [80, 443, 22, 3389, 53, 8080, 21][i % 7],
      label,
      is_attack:  isAttack,
      confidence: isAttack ? +(0.88 + Math.random() * 0.11).toFixed(4) : +(0.91 + Math.random() * 0.08).toFixed(4),
      bytes_fwd:  Math.floor(Math.random() * 4096) + 64,
      bytes_bwd:  Math.floor(Math.random() * 2048),
    }
  })
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '100')

  try {
    const res = await fetch(`${PYTHON_URL}/traffic?limit=${limit}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) throw new Error('bad response')
    const data = await res.json()
    return Response.json({ ...data, is_mock: false })
  } catch {
    const events = makeDemoEvents(Math.min(limit, 50))
    return Response.json({
      events,
      count:        events.length,
      live_capture: false,
      is_mock:      true,
    })
  }
}
