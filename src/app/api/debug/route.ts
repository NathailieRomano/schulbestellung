import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const keyStart = process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 20)
  
  const supabase = createServiceClient()
  
  const {data: teacher, error: tErr} = await supabase.from('bestell_teachers').select('id, name').eq('token', 'DUFX4hCAvECP').single()
  
  let orders = null, oErr = null
  if (teacher) {
    const res = await supabase.from('bestell_orders').select('id, teacher_id, status, created_at').eq('teacher_id', teacher.id)
    orders = res.data
    oErr = res.error
  }
  
  let itemCols: string[] = []
  if (orders?.[0]) {
    const {data: items} = await supabase.from('bestell_order_items').select('*').eq('order_id', (orders[0] as Record<string, unknown>).id as string).limit(1)
    if (items?.[0]) itemCols = Object.keys(items[0])
  }
  
  return NextResponse.json({
    env_url: url,
    env_key_start: keyStart,
    teacher_id: teacher?.id?.slice(0, 8),
    teacher_err: tErr?.message,
    orders_count: orders?.length,
    orders: orders?.map((o: Record<string, unknown>) => ({ id: (o.id as string)?.slice(0, 8), status: o.status, created: o.created_at })),
    orders_err: oErr?.message,
    item_columns: itemCols,
  })
}
