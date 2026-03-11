export const dynamic = "force-dynamic"
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET(request: Request) {
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

  const url = new URL(request.url)
  const teacherId = url.searchParams.get('teacherId')

  if (teacherId) {
    // Get specific teacher's order
    const { data: order } = await supabase
      .from('bestell_orders')
      .select('*')
      .eq('teacher_id', teacherId)
      .single()

    if (!order) {
      return NextResponse.json({ items: [] })
    }

    const { data: items } = await supabase
      .from('bestell_order_items')
      .select('*')
      .eq('order_id', order.id)
      .order('category')
      .order('subcategory')

    return NextResponse.json({ order, items: items || [] })
  }

  // Get all orders with items
  const { data: orders } = await supabase
    .from('bestell_orders')
    .select('*, bestell_teachers(name, campus)')

  const allItems: unknown[] = []
  for (const order of orders || []) {
    const { data: items } = await supabase
      .from('bestell_order_items')
      .select('*')
      .eq('order_id', order.id)

    for (const item of items || []) {
      allItems.push({
        ...item,
        teacher_name: (order as Record<string, unknown>).bestell_teachers
          ? ((order as Record<string, unknown>).bestell_teachers as Record<string, unknown>).name
          : 'Unknown',
        campus: (order as Record<string, unknown>).bestell_teachers
          ? ((order as Record<string, unknown>).bestell_teachers as Record<string, unknown>).campus
          : 'Unknown',
        order_status: order.status,
      })
    }
  }

  // Also load ordered articles status
  const { data: orderedArticles } = await supabase
    .from('bestell_ordered_articles')
    .select('*')

  return NextResponse.json({ items: allItems, orderedArticles: orderedArticles || [] })
}
