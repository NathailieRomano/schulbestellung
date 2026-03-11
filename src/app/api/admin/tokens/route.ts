import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

function generateToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let token = ''
  for (let i = 0; i < 12; i++) {
    token += chars[Math.floor(Math.random() * chars.length)]
  }
  return token
}

// Generate token for a single teacher
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  // Verify admin
  const { data: session } = await supabase
    .from('bestell_settings')
    .select('value')
    .eq('key', `admin_session_${authHeader}`)
    .single()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { teacherId, bulk } = await request.json()

  if (bulk) {
    // Generate tokens for all teachers without one
    const { data: teachers } = await supabase
      .from('bestell_teachers')
      .select('id, token')
      .is('token', null)

    if (teachers && teachers.length > 0) {
      for (const t of teachers) {
        const token = generateToken()
        await supabase
          .from('bestell_teachers')
          .update({ token })
          .eq('id', t.id)
      }
    }

    return NextResponse.json({ success: true, count: teachers?.length || 0 })
  }

  if (teacherId) {
    const token = generateToken()
    await supabase
      .from('bestell_teachers')
      .update({ token })
      .eq('id', teacherId)

    return NextResponse.json({ success: true, token })
  }

  return NextResponse.json({ error: 'Missing teacherId or bulk flag' }, { status: 400 })
}
