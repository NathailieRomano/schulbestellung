import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(request: Request) {
  const { token } = await request.json()
  if (!token) {
    return NextResponse.json({ valid: false }, { status: 401 })
  }

  const supabase = createServiceClient()
  const { data } = await supabase
    .from('bestell_settings')
    .select('value')
    .eq('key', `admin_session_${token}`)
    .single()

  if (!data) {
    return NextResponse.json({ valid: false }, { status: 401 })
  }

  return NextResponse.json({ valid: true })
}
