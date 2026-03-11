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

  // Get or create order
  let { data: order } = await supabase
    .from('bestell_orders')
    .select('*')
    .eq('teacher_id', teacher.id)
    .single()

  if (!order) {
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

  // Get settings (only public ones, NOT admin sessions)
  const { data: settings } = await supabase
    .from('bestell_settings')
    .select('*')
    .not('key', 'like', 'admin_session_%')
    .not('key', 'eq', 'admin_password')

  const settingsMap: Record<string, string> = {}
  settings?.forEach((s: { key: string; value: string }) => {
    settingsMap[s.key] = s.value
  })

  return NextResponse.json({
    teacher,
    order,
    items,
    settings: settingsMap,
  })
}
