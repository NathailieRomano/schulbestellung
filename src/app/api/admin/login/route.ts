import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  const { password } = await request.json()
  const supabase = createServiceClient()

  const { data: setting } = await supabase
    .from('bestell_settings')
    .select('value')
    .eq('key', 'admin_password_hash')
    .single()

  if (!setting) {
    return NextResponse.json({ error: 'Not configured' }, { status: 500 })
  }

  const valid = await bcrypt.compare(password, setting.value)
  if (!valid) {
    return NextResponse.json({ error: 'Wrong password' }, { status: 401 })
  }

  // Simple session token
  const sessionToken = crypto.randomUUID()

  // Store in settings
  await supabase.from('bestell_settings').upsert({
    key: `admin_session_${sessionToken}`,
    value: new Date().toISOString(),
  })

  return NextResponse.json({ token: sessionToken })
}
