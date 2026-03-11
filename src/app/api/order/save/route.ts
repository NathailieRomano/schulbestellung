import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(request: Request) {
  const supabase = createServiceClient()
  const body = await request.json()
  const { token, items, note, submit } = body

  // Validate teacher
  const { data: teacher, error: teacherError } = await supabase
    .from('bestell_teachers')
    .select('*')
    .eq('token', token)
    .single()

  if (teacherError || !teacher) {
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

  if (!order) {
    return NextResponse.json({ error: 'Could not create order' }, { status: 500 })
  }

  // Delete existing items
  await supabase
    .from('bestell_order_items')
    .delete()
    .eq('order_id', order.id)

  // Insert new items
  if (items && items.length > 0) {
    const orderItems = items.map((item: {
      article_number: string
      article_name: string
      category: string
      subcategory: string
      quantity: number
      note?: string
    }) => ({
      order_id: order!.id,
      article_number: item.article_number,
      article_name: item.article_name,
      category: item.category,
      subcategory: item.subcategory,
      quantity: item.quantity,
      note: item.note || null,
    }))

    const { error: insertError } = await supabase
      .from('bestell_order_items')
      .insert(orderItems)

    if (insertError) {
      return NextResponse.json({ error: 'Failed to save items' }, { status: 500 })
    }
  }

  // Update order status
  const status = submit ? 'submitted' : 'draft'
  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }
  if (submit) {
    updateData.submitted_at = new Date().toISOString()
  }

  // Save note in settings-like field or as a special item
  if (note) {
    // Save note as a special order item
    await supabase.from('bestell_order_items').insert({
      order_id: order.id,
      article_number: 'NOTE',
      article_name: 'Bemerkung',
      category: 'Notizen',
      subcategory: 'Notizen',
      quantity: 1,
      note: note,
    })
  }

  await supabase
    .from('bestell_orders')
    .update(updateData)
    .eq('id', order.id)

  return NextResponse.json({ success: true, status })
}
