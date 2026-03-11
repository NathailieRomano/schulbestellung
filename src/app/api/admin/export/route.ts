export const dynamic = "force-dynamic"
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const authHeader = request.headers.get('authorization') || url.searchParams.get('auth')
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

  const campus = url.searchParams.get('campus') // 'schoenau', 'zulg', or null for all

  // Get all submitted orders
  const { data: orders } = await supabase
    .from('bestell_orders')
    .select('*, bestell_teachers(name, campus)')
    .eq('status', 'submitted')

  const rows: string[] = []
  rows.push('Standort;Lehrperson;Artikelnummer;Artikelname;Kategorie;Unterkategorie;Menge;Bemerkung')

  for (const order of orders || []) {
    const teacher = (order as Record<string, unknown>).bestell_teachers as Record<string, string> | null
    if (!teacher) continue
    if (campus && teacher.campus !== campus) continue

    const { data: items } = await supabase
      .from('bestell_order_items')
      .select('*')
      .eq('order_id', order.id)
      .order('category')

    for (const item of items || []) {
      const campusLabel = teacher.campus === 'schoenau' ? 'Schönau' : 'Zulg'
      rows.push(
        [
          campusLabel,
          teacher.name,
          item.article_number,
          `"${(item.article_name as string).replace(/"/g, '""')}"`,
          item.category,
          item.subcategory,
          item.quantity,
          item.note ? `"${(item.note as string).replace(/"/g, '""')}"` : '',
        ].join(';')
      )
    }
  }

  const csv = rows.join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="bestellung_${campus || 'alle'}_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
