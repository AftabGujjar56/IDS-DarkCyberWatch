const ATTACK_TYPES = [
  'BENIGN', 'DoS Hulk', 'PortScan', 'DDoS',
  'DoS GoldenEye', 'FTP-Patator', 'SSH-Patator',
  'DoS Slowloris', 'DoS Slowhttptest', 'Bot',
  'Web Attack - Brute Force', 'Web Attack - XSS',
]

const IPS = [
  '192.168.1.', '10.0.0.', '172.16.0.', '203.45.67.',
  '89.23.145.', '45.33.22.', '104.21.55.',
]

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randIp() {
  return IPS[randInt(0, IPS.length - 1)] + randInt(1, 254)
}

// Generates BENIGN-only mock events — no fake attacks
export function generateTrafficEvent() {
  return {
    id:           Date.now() + Math.random(),
    timestamp:    new Date().toISOString(),
    src_ip:       randIp(),
    dst_ip:       randIp(),
    src_port:     randInt(1024, 65535),
    dst_port:     [80, 443, 22, 21, 8080, 3306][randInt(0, 5)],
    protocol:     ['TCP', 'UDP', 'ICMP'][randInt(0, 2)],
    flow_bytes_s: randInt(100, 50000),
    flow_packets_s: randInt(1, 200),
    flow_duration:  randInt(1000, 100000),
    label:        'BENIGN',
    is_attack:    false,
    confidence:   randInt(88, 100) / 100,
  }
}

// Chart starts clean — all zeros, no fake attacks
export function generateChartData(points = 20) {
  const now = Date.now()
  return Array.from({ length: points }, (_, i) => ({
    time:    new Date(now - (points - i) * 3000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    benign:  0,
    attacks: 0,
  }))
}