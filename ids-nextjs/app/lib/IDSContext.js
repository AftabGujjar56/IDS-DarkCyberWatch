'use client'
import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'

const IDSContext = createContext(null)

const MAX_ALERTS  = 200
const MAX_EVENTS  = 200
const MAX_CHART   = 30

// ── Helpers ───────────────────────────────────────────────────
function classifySeverity(confidence) {
  if (confidence >= 0.98) return 'CRITICAL'
  if (confidence >= 0.95) return 'HIGH'
  if (confidence >= 0.85) return 'MEDIUM'
  return 'LOW'
}

function makeChartPoint(benign = 0, attacks = 0) {
  return {
    time:    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    benign,
    attacks,
  }
}

function emptyChart() {
  return Array.from({ length: MAX_CHART }, (_, i) => ({
    time:    new Date(Date.now() - (MAX_CHART - 1 - i) * 3000)
               .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    benign:  0,
    attacks: 0,
  }))
}

// ── Demo data generators ──────────────────────────────────────
const DEMO_ATTACK_TYPES = [
  'DoS Hulk', 'PortScan', 'DDoS', 'DoS GoldenEye',
  'FTP-Patator', 'SSH-Patator', 'Bot', 'Web Attack – XSS',
]
const INTERNAL_IPS = ['192.168.1.10','10.0.0.42','172.16.0.5','192.168.2.100','10.10.1.33','192.168.3.55']
const EXTERNAL_IPS = ['185.220.101.45','45.33.32.156','198.51.100.7','91.108.4.1','203.0.113.5','194.165.16.11']

// Generates 1–3 realistic flow events (mix of benign + occasional attack)
let _demoId = 1
function generateDemoFlows() {
  const count = Math.floor(Math.random() * 3) + 1
  // ~20% chance of an attack in each tick
  const hasAttack = Math.random() < 0.20

  return Array.from({ length: count }, (_, i) => {
    const isAttack  = hasAttack && i === 0
    const attackType = DEMO_ATTACK_TYPES[Math.floor(Math.random() * DEMO_ATTACK_TYPES.length)]

    // Protocol distribution: TCP 65%, UDP 25%, ICMP 10%
    const protoRoll = Math.random()
    const protocol  = protoRoll < 0.65 ? 'TCP' : protoRoll < 0.90 ? 'UDP' : 'ICMP'

    // ICMP has no meaningful dst_port
    const dst_port  = protocol === 'ICMP'
      ? null
      : isAttack
        ? [22, 3389, 80, 443, 21, 8080][Math.floor(Math.random() * 6)]
        : [80, 443, 53, 123, 8080][Math.floor(Math.random() * 5)]

    const confidence = isAttack
      ? +(0.87 + Math.random() * 0.12).toFixed(4)
      : +(0.90 + Math.random() * 0.09).toFixed(4)

    return {
      id:          _demoId++,
      timestamp:   new Date().toISOString(),
      src_ip:      isAttack
        ? EXTERNAL_IPS[Math.floor(Math.random() * EXTERNAL_IPS.length)]
        : INTERNAL_IPS[Math.floor(Math.random() * INTERNAL_IPS.length)],
      dst_ip:      INTERNAL_IPS[Math.floor(Math.random() * INTERNAL_IPS.length)],
      protocol,
      dst_port,
      // ← KEY FIX: label is ALWAYS the specific attack type, never 'BENIGN' for attacks
      label:       isAttack ? attackType : 'BENIGN',
      is_attack:   isAttack,
      confidence,
      bytes_fwd:   Math.floor(Math.random() * 4096) + 64,
      bytes_bwd:   Math.floor(Math.random() * 2048),
    }
  })
}

// ── Provider ──────────────────────────────────────────────────
export function IDSProvider({ children }) {
  // ── Core state ─────────────────────────────────────────────
  const [engineStatus,    setEngineStatus]    = useState('checking')
  const [modelsLoaded,    setModelsLoaded]    = useState(false)
  const [alerts,          setAlerts]          = useState([])
  const [events,          setEvents]          = useState([])
  const [chartData,       setChartData]       = useState(emptyChart)
  const [topAttacks,      setTopAttacks]      = useState([])
  const [severityBreak,   setSeverityBreak]   = useState({ CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 })
  const [sessionFlows,    setSessionFlows]    = useState(0)
  const [sessionAttacks,  setSessionAttacks]  = useState(0)
  const [sessionBenign,   setSessionBenign]   = useState(0)
  const [uptime,          setUptime]          = useState(0)
  const [isMock,          setIsMock]          = useState(false)
  const [isSimulating,    setIsSimulating]    = useState(false)
  const [lastSimResult,   setLastSimResult]   = useState(null)

  // For live capture deduplication
  const lastSeenId = useRef(-1)

  // ── Derived stats ──────────────────────────────────────────
  // topAttacks & severityBreak are recomputed from alerts array
  useEffect(() => {
    const typeCounts = {}
    const sevCounts  = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 }

    for (const a of alerts) {
      // Only count real attacks (not BENIGN slipping through)
      if (!a.attack_type || a.attack_type === 'BENIGN') continue
      typeCounts[a.attack_type] = (typeCounts[a.attack_type] || 0) + 1
      const s = a.severity || 'LOW'
      if (s in sevCounts) sevCounts[s]++
    }

    const top = Object.entries(typeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    setTopAttacks(top)
    setSeverityBreak(sevCounts)
  }, [alerts])

  // ── Ingest new flows (shared logic for demo + live) ────────
  const ingestFlows = useCallback((newFlows) => {
    if (!newFlows.length) return

    const newAttacks = newFlows.filter(e => e.is_attack && e.label !== 'BENIGN')
    const newBenign  = newFlows.filter(e => !e.is_attack)

    // Update event list
    setEvents(prev => [...newFlows, ...prev].slice(0, MAX_EVENTS))

    // Update session counters
    setSessionFlows(n   => n + newFlows.length)
    setSessionAttacks(n => n + newAttacks.length)
    setSessionBenign(n  => n + newBenign.length)

    // Build new alerts from attack events
    if (newAttacks.length > 0) {
      const newAlerts = newAttacks.map(e => ({
        id:          e.id,
        timestamp:   e.timestamp,
        // ← KEY FIX: use e.label (the specific attack type), never fall back to 'BENIGN'
        attack_type: e.label !== 'BENIGN' ? e.label : (e.attack_type || 'Unknown'),
        src_ip:      e.src_ip,
        dst_ip:      e.dst_ip,
        protocol:    e.protocol,
        dst_port:    e.dst_port,
        confidence:  e.confidence,
        severity:    classifySeverity(e.confidence),
        simulated:   e.simulated || false,
      }))
      setAlerts(prev => [...newAlerts, ...prev].slice(0, MAX_ALERTS))
    }

    // Chart point
    setChartData(prev => [
      ...prev.slice(1),
      makeChartPoint(newBenign.length, newAttacks.length),
    ])
  }, [])

  // ── Engine health check ────────────────────────────────────
  useEffect(() => {
    const check = async () => {
      try {
        const r = await fetch('/api/health', { cache: 'no-store' })
        const d = await r.json()
        const online = d.status === 'online'
        setEngineStatus(online ? 'online' : 'offline')
        setModelsLoaded(d.models_loaded || false)
        setIsMock(!online)
      } catch {
        setEngineStatus('offline')
        setIsMock(true)
      }
    }
    check()
    const t = setInterval(check, 15000)
    return () => clearInterval(t)
  }, [])

  // ── Demo ticker (engine offline) ──────────────────────────
  useEffect(() => {
    if (engineStatus !== 'offline') return
    const t = setInterval(() => {
      ingestFlows(generateDemoFlows())
    }, 2500)
    return () => clearInterval(t)
  }, [engineStatus, ingestFlows])

  // ── Live traffic poll (engine online) ─────────────────────
  useEffect(() => {
    if (engineStatus !== 'online') return

    const poll = async () => {
      try {
        const r = await fetch('/api/traffic', { cache: 'no-store' })
        if (!r.ok) return
        const d = await r.json()
        const liveEvents = d.events || []
        if (!liveEvents.length) return

        const newEvents = lastSeenId.current === -1
          ? liveEvents
          : liveEvents.filter(e => e.id > lastSeenId.current)

        if (!newEvents.length) return
        lastSeenId.current = Math.max(...newEvents.map(e => e.id))
        ingestFlows(newEvents)
      } catch {}
    }

    const t = setInterval(poll, 2000)
    return () => clearInterval(t)
  }, [engineStatus, ingestFlows])

  // ── Uptime counter ─────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setUptime(u => u + 1), 1000)
    return () => clearInterval(t)
  }, [])

  // ── Simulate attack ────────────────────────────────────────
  const simulateAttack = useCallback(async (attackType, count) => {
    setIsSimulating(true)
    try {
      const r = await fetch('/api/simulate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ attack_type: attackType, count }),
      })
      const d = await r.json()
      setLastSimResult(d)

      if (d.success && d.alerts?.length > 0) {
        // Inject as events (is_attack=true, label=attackType)
        const fakeEvents = d.alerts.map(a => ({
          id:         a.id,
          timestamp:  a.timestamp,
          src_ip:     a.src_ip,
          dst_ip:     a.dst_ip,
          protocol:   a.protocol,
          dst_port:   a.dst_port,
          label:      a.attack_type,   // ← specific type, never BENIGN
          is_attack:  true,
          confidence: a.confidence,
          simulated:  true,
        }))
        ingestFlows(fakeEvents)
      }
      return d
    } catch (err) {
      const errResult = { success: false, message: `Error: ${err.message}` }
      setLastSimResult(errResult)
      return errResult
    } finally {
      setIsSimulating(false)
    }
  }, [ingestFlows])

  // ── Clear alerts (for Clear button) ───────────────────────
  const clearAlerts = useCallback(() => {
    setAlerts([])
    // Note: sessionFlows/sessionBenign/sessionAttacks kept intentionally
    // so the report still reflects total session activity
  }, [])

  // ── Computed values ────────────────────────────────────────
  const attackPct     = sessionFlows > 0 ? ((sessionAttacks / sessionFlows) * 100).toFixed(1) : '0.0'
  const networkStatus = alerts.length > 5 ? 'Under Attack' : alerts.length > 0 ? 'Elevated' : 'Normal'

  const value = {
    // Status
    engineStatus, modelsLoaded, isMock, uptime,
    // Data
    alerts, events, chartData, topAttacks, severityBreak,
    // Session counters
    sessionFlows, sessionAttacks, sessionBenign,
    // Derived
    attackPct, networkStatus,
    // Actions
    simulateAttack, clearAlerts,
    isSimulating, lastSimResult,
  }

  return <IDSContext.Provider value={value}>{children}</IDSContext.Provider>
}

export function useIDS() {
  const ctx = useContext(IDSContext)
  if (!ctx) throw new Error('useIDS must be used within IDSProvider')
  return ctx
}
