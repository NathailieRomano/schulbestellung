export const dynamic = "force-dynamic"
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

  // Build new items list
  const newItems: Record<string, unknown>[] = []

  if (items && items.length > 0) {
    for (const item of items as {
      article_number: string
      article_name: string
      category: string
      subcategory: string
      quantity: number
      quantity_personal?: number
      quantity_stock?: number
      note?: string
    }[]) {
      newItems.push({
        order_id: order.id,
        article_number: item.article_number,
        article_name: item.article_name,
        category: item.category,
        subcategory: item.subcategory,
        quantity: (item.quantity_personal || 0) + (item.quantity_stock || 0) || item.quantity,
        quantity_personal: item.quantity_personal ?? item.quantity ?? 0,
        quantity_stock: item.quantity_stock ?? 0,
        note: item.note || null,
      })
    }
  }

  if (note) {
    newItems.push({
      order_id: order.id,
      article_number: 'NOTE',
      article_name: 'Bemerkung',
      category: 'Notizen',
      subcategory: 'Notizen',
      quantity: 1,
      quantity_personal: 0,
      quantity_stock: 0,
      note: note,
    })
  }

  // SAFE SAVE STRATEGY:
  // 1. Insert new items first (get IDs back)
  // 2. Only if insert succeeds → delete old items (by excluding new IDs)
  // This way: if insert fails, old data remains intact. No data loss possible.

  if (newItems.length > 0) {
    const { data: inserted, error: insertError } = await supabase
      .from('bestell_order_items')
      .insert(newItems)
      .select('id')

    if (insertError || !inserted) {
      console.error('Insert failed:', insertError)
      return NextResponse.json(
        { error: 'Speichern fehlgeschlagen. Bitte nochmals versuchen.' },
        { status: 500 }
      )
    }

    // Delete old items (everything for this order EXCEPT what we just inserted)
    const newIds = inserted.map((r: { id: string }) => r.id)
    await supabase
      .from('bestell_order_items')
      .delete()
      .eq('order_id', order.id)
      .not('id', 'in', `(${newIds.join(',')})`)
  } else {
    // Empty order — delete all items
    await supabase
      .from('bestell_order_items')
      .delete()
      .eq('order_id', order.id)
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

  await supabase
    .from('bestell_orders')
    .update(updateData)
    .eq('id', order.id)

  return NextResponse.json({ success: true, status })
}
