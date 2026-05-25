const PYTHON_URL = process.env.PYTHON_ENGINE_URL || 'http://localhost:8000'

export async function GET() {
  // Used by frontend health check
  try {
    const res = await fetch(`${PYTHON_URL}/health`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) throw new Error('offline')
    return Response.json(await res.json())
  } catch {
    return Response.json({ status: 'offline' })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const res  = await fetch(`${PYTHON_URL}/predict`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
      signal:  AbortSignal.timeout(6000),
    })
    if (!res.ok) throw new Error(`Engine error ${res.status}`)
    return Response.json(await res.json())
  } catch (err) {
    return Response.json({ error: err.message }, { status: 503 })
  }
}
