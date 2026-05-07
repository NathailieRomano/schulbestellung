export const dynamic = "force-dynamic"
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  const supabase = createServiceClient()
  const { token } = params

  const { data: teacher, error } = await supabase
    .from('bestell_teachers')
    .select('*')
    .eq('token', token)
    .single()

  if (error || !teacher) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
  }

  // Get settings (only public ones, NOT admin sessions)
  const { data: settings } = await supabase
    .from('bestell_settings')
    .select('*')
    .not('key', 'like', 'admin_session_%')
    .not('key', 'like', 'admin_password%')

  const settingsMap: Record<string, string> = {}
  settings?.forEach((s: { key: string; value: string }) => {
    settingsMap[s.key] = s.value
  })

  const ordersClosed = settingsMap.orders_closed === 'true'

  // Get or create order. When orders are closed, do NOT create a new empty order just because a token was opened.
  let { data: order } = await supabase
    .from('bestell_orders')
    .select('*')
    .eq('teacher_id', teacher.id)
    .single()

  if (!order && !ordersClosed) {
    const { data: newOrder } = await supabase
      .from('bestell_orders')
      .insert({ teacher_id: teacher.id, status: 'draft' })
      .select()
      .single()
    order = newOrder
  }

  // Get order items
  let items: unknown[] = []
  if (order) {
    const { data: orderItems } = await supabase
      .from('bestell_order_items')
      .select('*')
      .eq('order_id', order.id)
    items = orderItems || []
  }

  return NextResponse.json({
    teacher,
    order,
    items,
    settings: settingsMap,
  })
}
