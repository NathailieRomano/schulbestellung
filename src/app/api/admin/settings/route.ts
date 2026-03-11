export const dynamic = "force-dynamic"
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  // Verify admin session
  const { data: session } = await supabase
    .from('bestell_settings')
    .select('value')
    .eq('key', `admin_session_${authHeader}`)
    .single()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { key, value } = await request.json()

  if (!key || typeof key !== 'string') {
    return NextResponse.json({ error: 'Invalid key' }, { status: 400 })
  }

  // Upsert setting
  const { error } = await supabase
    .from('bestell_settings')
    .upsert({ key, value: value || '' }, { onConflict: 'key' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
