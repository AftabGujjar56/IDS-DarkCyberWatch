const PYTHON_URL = process.env.PYTHON_ENGINE_URL || 'http://localhost:8000'

export async function GET() {
  try {
    const res = await fetch(`${PYTHON_URL}/health`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) throw new Error('Engine returned non-OK')
    const data = await res.json()
    return Response.json(data)
  } catch {
    return Response.json({
      status:         'offline',
      models_loaded:  false,
      uptime_seconds: 0,
      version:        '1.0.0',
      timestamp:      new Date().toISOString(),
    }, { status: 200 }) // always 200 — frontend handles offline state
  }
}
