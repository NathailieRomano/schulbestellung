import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET(request: Request) {
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

  // Get all teachers
  const { data: teachers } = await supabase
    .from('bestell_teachers')
    .select('*')
    .order('campus')
    .order('name')

  // Get all orders with items count
  const { data: orders } = await supabase
    .from('bestell_orders')
    .select('*, bestell_order_items(count)')

  // Get settings
  const { data: settings } = await supabase
    .from('bestell_settings')
    .select('*')
    .not('key', 'like', 'admin_session_%')

  const settingsMap: Record<string, string> = {}
  settings?.forEach((s: { key: string; value: string }) => {
    settingsMap[s.key] = s.value
  })

  // Merge
  const teachersWithOrders = (teachers || []).map((t: Record<string, unknown>) => {
    const order = (orders || []).find(
      (o: Record<string, unknown>) => o.teacher_id === t.id
    )
    return {
      ...t,
      order: order
        ? {
            id: order.id,
            status: order.status,
            submitted_at: order.submitted_at,
            updated_at: order.updated_at,
            item_count: order.bestell_order_items?.[0]?.count || 0,
          }
        : null,
    }
  })

  return NextResponse.json({
    teachers: teachersWithOrders,
    settings: settingsMap,
  })
}
