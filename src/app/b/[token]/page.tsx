'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { getGroupedCatalog, searchCatalog, type DisplayGroup, type Article } from '@/lib/catalog'

interface OrderItemData {
  article_number: string
  article_name: string
  category: string
  subcategory: string
  quantity: number
  note?: string
}

interface TeacherData {
  id: string
  name: string
  campus: 'schoenau' | 'zulg'
}

export default function OrderPage() {
  const params = useParams()
  const token = params.token as string

  const [teacher, setTeacher] = useState<TeacherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [stockQuantities, setStockQuantities] = useState<Record<string, number>>({})
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [orderStatus, setOrderStatus] = useState<string>('draft')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [expandedSubs, setExpandedSubs] = useState<Set<string>>(new Set())
  const [deadline, setDeadline] = useState<string>('')
  const [showCart, setShowCart] = useState(false)

  const [hasUnsaved, setHasUnsaved] = useState(false)
  const catalog = useMemo(() => getGroupedCatalog(), [])

  // Warn before closing tab with unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsaved) {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [hasUnsaved])

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/teacher/${token}`)
        if (!res.ok) {
          setError('Ungültiger Link. Bitte kontaktiere den Administrator.')
          setLoading(false)
          return
        }
        const data = await res.json()
        setTeacher(data.teacher)
        setDeadline(data.settings?.deadline || data.settings?.order_deadline || '')
        setOrderStatus(data.order?.status || 'draft')

        // Load existing items
        const existingQuantities: Record<string, number> = {}
        const existingStockQuantities: Record<string, number> = {}
        let existingNote = ''
        for (const item of data.items || []) {
          if (item.article_number === 'NOTE') {
            existingNote = item.note || ''
          } else {
            existingQuantities[item.article_number] = item.quantity_personal ?? item.quantity ?? 0
            if (item.quantity_stock > 0) {
              existingStockQuantities[item.article_number] = item.quantity_stock
            }
          }
        }
        setQuantities(existingQuantities)
        setStockQuantities(existingStockQuantities)
        setNote(existingNote)
      } catch {
        setError('Fehler beim Laden.')
      }
      setLoading(false)
    }
    loadData()
  }, [token])

  const setStockQuantity = useCallback((articleNumber: string, qty: number) => {
    setStockQuantities(prev => {
      const next = { ...prev }
      if (qty <= 0) {
        delete next[articleNumber]
      } else {
        next[articleNumber] = qty
      }
      return next
    })
    setSaved(false)
    setSubmitted(false)
    setHasUnsaved(true)
  }, [])

  const setQuantity = useCallback((articleNumber: string, qty: number) => {
    setQuantities(prev => {
      const next = { ...prev }
      if (qty <= 0) {
        delete next[articleNumber]
      } else {
        next[articleNumber] = qty
      }
      return next
    })
    setSaved(false)
    setSubmitted(false)
    setHasUnsaved(true)
  }, [])

  const cartItems = useMemo(() => {
    const items: (OrderItemData & { quantity_personal: number; quantity_stock: number })[] = []
    for (const group of catalog) {
      for (const sub of group.subcategories) {
        for (const article of sub.articles) {
          const qtyPersonal = quantities[article.articleNumber] || 0
          const qtyStock = stockQuantities[article.articleNumber] || 0
          if (qtyPersonal > 0 || qtyStock > 0) {
            items.push({
              article_number: article.articleNumber,
              article_name: article.name,
              category: group.name,
              subcategory: sub.name,
              quantity: qtyPersonal + qtyStock,
              quantity_personal: qtyPersonal,
              quantity_stock: qtyStock,
            })
          }
        }
      }
    }
    return items
  }, [quantities, stockQuantities, catalog])

  const searchResults = useMemo(() => {
    if (searchQuery.length < 2) return null
    return searchCatalog(searchQuery)
  }, [searchQuery])

  const saveOrder = async (submit: boolean) => {
    setSaving(true)
    try {
      const res = await fetch('/api/order/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          items: cartItems,
          note: note || null,
          submit,
        }),
      })
      if (res.ok) {
        setHasUnsaved(false)
        if (submit) {
          setSubmitted(true)
          setOrderStatus('submitted')
        } else {
          setSaved(true)
        }
      } else {
        alert('Speichern fehlgeschlagen. Bitte nochmals versuchen.')
      }
    } catch {
      alert('Fehler beim Speichern')
    }
    setSaving(false)
  }

  const toggleGroup = (name: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const toggleSub = (name: string) => {
    setExpandedSubs(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const daysLeft = useMemo(() => {
    if (!deadline) return null
    const d = new Date(deadline)
    const now = new Date()
    const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }, [deadline])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="animate-pulse text-blue-600 text-lg">Laden...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
          <h1 className="text-xl font-bold text-red-600 mb-2">Fehler</h1>
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    )
  }

  const campusLabel = teacher?.campus === 'schoenau' ? 'Schönau' : 'Zulg'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold">Sammelbestellung 2026</h1>
              <p className="text-blue-100 text-sm">
                {teacher?.name} — Standort {campusLabel}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {daysLeft !== null && (
                <div className={`text-xs px-2 py-1 rounded-full ${daysLeft > 14 ? 'bg-blue-500' : daysLeft > 3 ? 'bg-yellow-500' : 'bg-red-500'}`}>
                  {daysLeft > 0 ? `Noch ${daysLeft} Tage` : 'Frist abgelaufen'}
                </div>
              )}
              <button
                onClick={() => setShowCart(!showCart)}
                className="relative bg-blue-500 hover:bg-blue-400 px-3 py-2 rounded-lg text-sm font-medium"
              >
                🛒 {cartItems.length}
              </button>
            </div>
          </div>
          {orderStatus === 'submitted' && (
            <div className="mt-2 bg-green-500 text-white px-3 py-1 rounded text-sm">
              ✅ Bestellung bereits eingereicht — du kannst sie noch bearbeiten
            </div>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="🔍 Artikel suchen (Name oder Nummer)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-gray-800"
          />
        </div>

        {/* Search Results */}
        {searchResults && (
          <div className="mb-6 bg-white rounded-lg shadow p-4">
            <h2 className="font-bold text-gray-700 mb-3">
              Suchergebnisse ({searchResults.length}{searchResults.length === 50 ? '+' : ''})
            </h2>
            {searchResults.length === 0 ? (
              <p className="text-gray-500">Keine Artikel gefunden.</p>
            ) : (
              <div className="space-y-2">
                {searchResults.map(r => (
                  <ArticleRow
                    key={r.article.articleNumber}
                    article={r.article}
                    quantity={quantities[r.article.articleNumber] || 0}
                    stockQuantity={stockQuantities[r.article.articleNumber] || 0}
                    onQuantityChange={setQuantity}
                    onStockQuantityChange={setStockQuantity}
                    subtitle={r.subcategory}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Catalog */}
        {!searchResults && (
          <div className="space-y-2">
            {catalog.map(group => (
              <GroupAccordion
                key={group.name}
                group={group}
                expanded={expandedGroups.has(group.name)}
                onToggle={() => toggleGroup(group.name)}
                expandedSubs={expandedSubs}
                onToggleSub={toggleSub}
                quantities={quantities}
                stockQuantities={stockQuantities}
                onQuantityChange={setQuantity}
                onStockQuantityChange={setStockQuantity}
              />
            ))}
          </div>
        )}

        {/* Note */}
        <div className="mt-6 bg-white rounded-lg shadow p-4">
          <h2 className="font-bold text-gray-700 mb-2">📝 Bemerkungen</h2>
          <textarea
            value={note}
            onChange={e => { setNote(e.target.value); setSaved(false); setSubmitted(false); setHasUnsaved(true) }}
            placeholder="Spezielle Wünsche, Anmerkungen..."
            className="w-full px-3 py-2 rounded border border-gray-300 focus:border-blue-500 outline-none text-gray-800"
            rows={3}
          />
        </div>

        {/* Action Buttons */}
        <div className="mt-6 mb-20 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => saveOrder(false)}
            disabled={saving}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-lg disabled:opacity-50"
          >
            {saving ? '...' : '💾 Zwischenspeichern'}
          </button>
          <button
            onClick={() => {
              if (confirm('Bestellung definitiv absenden?')) {
                saveOrder(true)
              }
            }}
            disabled={saving || cartItems.length === 0}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50"
          >
            {saving ? '...' : '📤 Bestellung absenden'}
          </button>
        </div>

        {saved && (
          <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg text-center z-50">
            ✅ Zwischengespeichert!
          </div>
        )}
        {submitted && (
          <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg text-center z-50">
            ✅ Bestellung eingereicht! Du kannst jederzeit zurückkommen und bearbeiten.
          </div>
        )}
      </div>

      {/* Cart Sidebar */}
      {showCart && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowCart(false)}>
          <div
            className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-xl overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">🛒 Warenkorb ({cartItems.length})</h2>
                <button onClick={() => setShowCart(false)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
              </div>
              {cartItems.length === 0 ? (
                <p className="text-gray-500">Noch keine Artikel ausgewählt.</p>
              ) : (
                <div className="space-y-3">
                  {cartItems.map((item, idx) => (
                    <div key={`${item.article_number}-${idx}`} className="flex justify-between items-start border-b pb-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{item.article_name}</p>
                        <p className="text-xs text-gray-500">{item.article_number}</p>
                        <div className="flex gap-3 mt-0.5">
                          {item.quantity_personal > 0 && (
                            <span className="text-xs text-blue-600 font-medium">Pers: {item.quantity_personal}</span>
                          )}
                          {item.quantity_stock > 0 && (
                            <span className="text-xs text-green-600 font-medium">Lager: {item.quantity_stock}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <button
                          onClick={() => {
                            setQuantity(item.article_number, 0)
                            setStockQuantity(item.article_number, 0)
                          }}
                          className="text-red-400 hover:text-red-600 text-sm"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function GroupAccordion({
  group,
  expanded,
  onToggle,
  expandedSubs,
  onToggleSub,
  quantities,
  stockQuantities,
  onQuantityChange,
  onStockQuantityChange,
}: {
  group: DisplayGroup
  expanded: boolean
  onToggle: () => void
  expandedSubs: Set<string>
  onToggleSub: (name: string) => void
  quantities: Record<string, number>
  stockQuantities: Record<string, number>
  onQuantityChange: (articleNumber: string, qty: number) => void
  onStockQuantityChange: (articleNumber: string, qty: number) => void
}) {
  const totalArticles = group.subcategories.reduce((sum, s) => sum + s.articles.length, 0)
  const selectedCount = group.subcategories.reduce(
    (sum, s) => sum + s.articles.filter(a => (quantities[a.articleNumber] > 0) || (stockQuantities[a.articleNumber] > 0)).length,
    0
  )

  return (
    <div className="bg-white rounded-lg shadow">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 rounded-lg"
      >
        <span className="font-bold text-gray-800">
          {group.icon} {group.name}
          <span className="ml-2 text-sm font-normal text-gray-500">({totalArticles} Artikel)</span>
          {selectedCount > 0 && (
            <span className="ml-2 text-sm font-medium text-blue-600">✓ {selectedCount} gewählt</span>
          )}
        </span>
        <span className="text-gray-400 text-xl">{expanded ? '−' : '+'}</span>
      </button>

      {expanded && (
        <div className="px-4 pb-3 space-y-1">
          {group.subcategories.map(sub => {
            const subKey = `${group.name}::${sub.name}`
            const subExpanded = expandedSubs.has(subKey)
            const subSelected = sub.articles.filter(a => quantities[a.articleNumber] > 0).length

            return (
              <div key={sub.name} className="border-l-2 border-blue-100 pl-3">
                <button
                  onClick={() => onToggleSub(subKey)}
                  className="w-full py-2 flex items-center justify-between text-left hover:text-blue-600"
                >
                  <span className="text-sm text-gray-700">
                    {sub.name}
                    <span className="ml-1 text-gray-400">({sub.articles.length})</span>
                    {subSelected > 0 && (
                      <span className="ml-1 text-blue-600 font-medium">✓ {subSelected}</span>
                    )}
                  </span>
                  <span className="text-gray-400 text-sm">{subExpanded ? '▾' : '▸'}</span>
                </button>

                {subExpanded && (
                  <div className="space-y-1 pb-2">
                    {sub.articles.map(article => (
                      <ArticleRow
                        key={article.articleNumber}
                        article={article}
                        quantity={quantities[article.articleNumber] || 0}
                        stockQuantity={stockQuantities[article.articleNumber] || 0}
                        onQuantityChange={onQuantityChange}
                        onStockQuantityChange={onStockQuantityChange}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function QuantityControl({ value, onChange, color = 'blue' }: { value: number; onChange: (v: number) => void; color?: string }) {
  const colors = color === 'green'
    ? { bg: 'bg-green-100 hover:bg-green-200', text: 'text-green-700', activeBg: 'bg-green-50', border: 'focus:border-green-500' }
    : { bg: 'bg-blue-100 hover:bg-blue-200', text: 'text-blue-700', activeBg: 'bg-blue-50', border: 'focus:border-blue-500' }
  return (
    <div className="flex items-center gap-0.5">
      {value > 0 && (
        <button onClick={() => onChange(value - 1)} className={`w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs`}>−</button>
      )}
      <input
        type="number" min="0" value={value || ''}
        onChange={e => onChange(parseInt(e.target.value) || 0)}
        className={`w-10 h-6 text-center text-xs border border-gray-300 rounded ${colors.border} outline-none text-gray-800`}
        placeholder="0"
      />
      <button onClick={() => onChange(value + 1)} className={`w-6 h-6 rounded ${colors.bg} ${colors.text} font-bold text-xs`}>+</button>
    </div>
  )
}

function ArticleRow({
  article,
  quantity,
  stockQuantity,
  onQuantityChange,
  onStockQuantityChange,
  subtitle,
}: {
  article: Article
  quantity: number
  stockQuantity: number
  onQuantityChange: (articleNumber: string, qty: number) => void
  onStockQuantityChange: (articleNumber: string, qty: number) => void
  subtitle?: string
}) {
  const hasAny = quantity > 0 || stockQuantity > 0
  return (
    <div className={`py-1.5 px-2 rounded ${hasAny ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <a
            href={`https://shop.ingold-biwa.ch${article.url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-800 hover:text-blue-600 hover:underline truncate block"
            title="Im Shop ansehen"
          >
            {article.name} ↗
          </a>
          <p className="text-xs text-gray-400">
            {article.articleNumber}
            {subtitle && ` • ${subtitle}`}
          </p>
        </div>
        <div className="flex flex-col gap-0.5 shrink-0 items-end">
          <div className="flex items-center gap-1">
            <span className="text-xs text-blue-600 w-12 text-right">Pers.</span>
            <QuantityControl value={quantity} onChange={(v) => onQuantityChange(article.articleNumber, v)} color="blue" />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-green-600 w-12 text-right">Lager</span>
            <QuantityControl value={stockQuantity} onChange={(v) => onStockQuantityChange(article.articleNumber, v)} color="green" />
          </div>
        </div>
      </div>
    </div>
  )
}
