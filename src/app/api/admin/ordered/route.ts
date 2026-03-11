import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(request: Request) {
  const supabase = createServiceClient()
  const body = await request.json()
  const { article_number, campus, ordered, quantity } = body

  if (ordered) {
    // Mark as ordered (upsert)
    const { error } = await supabase
      .from('bestell_ordered_articles')
      .upsert({
        article_number,
        campus,
        ordered_quantity: quantity || 0,
        ordered_at: new Date().toISOString(),
      }, { onConflict: 'article_number,campus' })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  } else {
    // Mark as not ordered (delete)
    await supabase
      .from('bestell_ordered_articles')
      .delete()
      .eq('article_number', article_number)
      .eq('campus', campus)
  }

  return NextResponse.json({ success: true })
}
