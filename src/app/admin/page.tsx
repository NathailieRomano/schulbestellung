'use client'

import { useEffect, useState, useCallback } from 'react'

interface TeacherWithOrder {
  id: string
  name: string
  campus: 'schoenau' | 'zulg'
  token: string | null
  order: {
    id: string
    status: string
    submitted_at: string | null
    updated_at: string
    item_count: number
  } | null
}

interface OrderItem {
  article_number: string
  article_name: string
  category: string
  subcategory: string
  quantity: number
  note: string | null
  teacher_name: string
  campus: string
  order_status: string
}

type View = 'dashboard' | 'detail' | 'all-orders' | 'export'

export default function AdminPage() {
  const [adminToken, setAdminToken] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [teachers, setTeachers] = useState<TeacherWithOrder[]>([])
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<View>('dashboard')
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherWithOrder | null>(null)
  const [teacherItems, setTeacherItems] = useState<OrderItem[]>([])
  const [allItems, setAllItems] = useState<OrderItem[]>([])
  const [campusFilter, setCampusFilter] = useState<string>('all')
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  const fetchDashboard = useCallback(async (token: string) => {
    setLoading(true)
    const res = await fetch('/api/admin/dashboard', {
      headers: { authorization: token },
    })
    if (res.ok) {
      const data = await res.json()
      setTeachers(data.teachers)
      setSettings(data.settings)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem('admin_token')
    if (stored) {
      // Verify
      fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: stored }),
      }).then(res => {
        if (res.ok) {
          setAdminToken(stored)
          fetchDashboard(stored)
        } else {
          localStorage.removeItem('admin_token')
        }
      })
    }
  }, [fetchDashboard])

  const login = async () => {
    setLoginError('')
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      const data = await res.json()
      setAdminToken(data.token)
      localStorage.setItem('admin_token', data.token)
      fetchDashboard(data.token)
    } else {
      setLoginError('Falsches Passwort')
    }
  }

  const generateToken = async (teacherId: string) => {
    if (!adminToken) return
    const res = await fetch('/api/admin/tokens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: adminToken,
      },
      body: JSON.stringify({ teacherId }),
    })
    if (res.ok) {
      fetchDashboard(adminToken)
    }
  }

  const generateAllTokens = async () => {
    if (!adminToken) return
    if (!confirm('Tokens für alle LPs ohne Token generieren?')) return
    const res = await fetch('/api/admin/tokens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: adminToken,
      },
      body: JSON.stringify({ bulk: true }),
    })
    if (res.ok) {
      const data = await res.json()
      alert(`${data.count} Tokens generiert!`)
      fetchDashboard(adminToken)
    }
  }

  const viewTeacherOrder = async (teacher: TeacherWithOrder) => {
    if (!adminToken) return
    setSelectedTeacher(teacher)
    setView('detail')
    const res = await fetch(`/api/admin/orders?teacherId=${teacher.id}`, {
      headers: { authorization: adminToken },
    })
    if (res.ok) {
      const data = await res.json()
      setTeacherItems(data.items || [])
    }
  }

  const loadAllOrders = async () => {
    if (!adminToken) return
    setView('all-orders')
    const res = await fetch('/api/admin/orders', {
      headers: { authorization: adminToken },
    })
    if (res.ok) {
      const data = await res.json()
      setAllItems(data.items || [])
    }
  }

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/b/${token}`
    navigator.clipboard.writeText(url)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  const exportCSV = (campus?: string) => {
    if (!adminToken) return
    const url = `/api/admin/export${campus ? `?campus=${campus}` : ''}`
    window.open(url + (url.includes('?') ? '&' : '?') + `auth=${adminToken}`, '_blank')
  }

  // Login
  if (!adminToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-sm">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">🔒 Admin Login</h1>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
            placeholder="Passwort"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:border-blue-500 outline-none text-gray-800"
          />
          {loginError && <p className="text-red-500 text-sm mb-4">{loginError}</p>}
          <button
            onClick={login}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700"
          >
            Anmelden
          </button>
        </div>
      </div>
    )
  }

  const schoenauTeachers = teachers.filter(t => t.campus === 'schoenau')
  const zulgTeachers = teachers.filter(t => t.campus === 'zulg')
  const submittedCount = teachers.filter(t => t.order?.status === 'submitted').length
  const draftCount = teachers.filter(t => t.order?.status === 'draft' && (t.order?.item_count || 0) > 0).length

  const filteredTeachers = campusFilter === 'all' ? teachers : teachers.filter(t => t.campus === campusFilter)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gray-800 text-white">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">📋 Schulbestellung Admin</h1>
            <div className="flex items-center gap-3">
              <nav className="flex gap-2">
                <button
                  onClick={() => setView('dashboard')}
                  className={`px-3 py-1.5 rounded text-sm ${view === 'dashboard' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                  Dashboard
                </button>
                <button
                  onClick={loadAllOrders}
                  className={`px-3 py-1.5 rounded text-sm ${view === 'all-orders' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                  Alle Bestellungen
                </button>
                <button
                  onClick={() => setView('export')}
                  className={`px-3 py-1.5 rounded text-sm ${view === 'export' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                  Export
                </button>
              </nav>
              <button
                onClick={() => {
                  localStorage.removeItem('admin_token')
                  setAdminToken(null)
                }}
                className="text-gray-400 hover:text-white text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {loading && <div className="text-center text-gray-500 py-8">Laden...</div>}

        {/* Dashboard */}
        {view === 'dashboard' && !loading && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard title="Total LPs" value={teachers.length} color="blue" />
              <StatCard title="Eingereicht" value={submittedCount} color="green" />
              <StatCard title="Entwurf" value={draftCount} color="yellow" />
              <StatCard
                title="Offen"
                value={teachers.length - submittedCount - draftCount}
                color="gray"
              />
            </div>

            {/* Campus stats */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-bold text-gray-800 mb-2">🏫 Schönau ({schoenauTeachers.length})</h3>
                <div className="flex gap-4 text-sm">
                  <span className="text-green-600">✅ {schoenauTeachers.filter(t => t.order?.status === 'submitted').length} eingereicht</span>
                  <span className="text-yellow-600">🟡 {schoenauTeachers.filter(t => t.order?.status === 'draft' && (t.order?.item_count || 0) > 0).length} Entwurf</span>
                  <span className="text-gray-500">⬜ {schoenauTeachers.filter(t => !t.order || (t.order.status === 'draft' && !t.order.item_count)).length} offen</span>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-bold text-gray-800 mb-2">🏫 Zulg ({zulgTeachers.length})</h3>
                <div className="flex gap-4 text-sm">
                  <span className="text-green-600">✅ {zulgTeachers.filter(t => t.order?.status === 'submitted').length} eingereicht</span>
                  <span className="text-yellow-600">🟡 {zulgTeachers.filter(t => t.order?.status === 'draft' && (t.order?.item_count || 0) > 0).length} Entwurf</span>
                  <span className="text-gray-500">⬜ {zulgTeachers.filter(t => !t.order || (t.order.status === 'draft' && !t.order.item_count)).length} offen</span>
                </div>
              </div>
            </div>

            {/* Token actions */}
            <div className="mb-4 flex items-center gap-3">
              <button
                onClick={generateAllTokens}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                🔑 Alle Token generieren
              </button>
              <select
                value={campusFilter}
                onChange={e => setCampusFilter(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm text-gray-700"
              >
                <option value="all">Alle Standorte</option>
                <option value="schoenau">Schönau</option>
                <option value="zulg">Zulg</option>
              </select>
            </div>

            {/* Teacher list */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 text-left text-sm text-gray-600">
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2 hidden md:table-cell">Standort</th>
                    <th className="px-4 py-2 hidden md:table-cell">Artikel</th>
                    <th className="px-4 py-2">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeachers.map(t => (
                    <tr key={t.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2">
                        {t.order?.status === 'submitted' ? '✅' :
                         t.order?.status === 'draft' && (t.order?.item_count || 0) > 0 ? '🟡' : '⬜'}
                      </td>
                      <td className="px-4 py-2 text-gray-800 text-sm">{t.name}</td>
                      <td className="px-4 py-2 text-gray-500 text-sm hidden md:table-cell">
                        {t.campus === 'schoenau' ? 'Schönau' : 'Zulg'}
                      </td>
                      <td className="px-4 py-2 text-gray-500 text-sm hidden md:table-cell">
                        {t.order?.item_count || 0}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex gap-1 flex-wrap">
                          {t.token ? (
                            <>
                              <button
                                onClick={() => copyLink(t.token!)}
                                className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-gray-700"
                              >
                                {copiedToken === t.token ? '✓ Kopiert!' : '🔗 Link'}
                              </button>
                              <button
                                onClick={() => viewTeacherOrder(t)}
                                className="text-xs bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded text-blue-700"
                              >
                                👁️ Details
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => generateToken(t.id)}
                              className="text-xs bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded text-blue-700"
                            >
                              🔑 Token
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Detail view */}
        {view === 'detail' && selectedTeacher && (
          <div>
            <button
              onClick={() => setView('dashboard')}
              className="mb-4 text-blue-600 hover:text-blue-800 text-sm"
            >
              ← Zurück zum Dashboard
            </button>
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {selectedTeacher.name} — {selectedTeacher.campus === 'schoenau' ? 'Schönau' : 'Zulg'}
              <span className="ml-2 text-sm font-normal">
                {selectedTeacher.order?.status === 'submitted' ? '✅ Eingereicht' : '🟡 Entwurf'}
              </span>
            </h2>
            {teacherItems.length === 0 ? (
              <p className="text-gray-500">Noch keine Artikel bestellt.</p>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100 text-left text-gray-600">
                      <th className="px-3 py-2">Artikelnr.</th>
                      <th className="px-3 py-2">Artikel</th>
                      <th className="px-3 py-2">Kategorie</th>
                      <th className="px-3 py-2">Menge</th>
                      <th className="px-3 py-2">Bemerkung</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teacherItems.map((item, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-2 text-gray-500">{item.article_number}</td>
                        <td className="px-3 py-2 text-gray-800">{item.article_name}</td>
                        <td className="px-3 py-2 text-gray-500">{item.category}</td>
                        <td className="px-3 py-2 font-medium text-gray-800">{item.quantity}</td>
                        <td className="px-3 py-2 text-gray-500">{item.note || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* All orders */}
        {view === 'all-orders' && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Alle Bestellungen</h2>

            {/* Aggregate view */}
            {allItems.length > 0 && (
              <>
                <div className="mb-4 flex gap-2">
                  <select
                    value={campusFilter}
                    onChange={e => setCampusFilter(e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm text-gray-700"
                  >
                    <option value="all">Alle Standorte</option>
                    <option value="schoenau">Schönau</option>
                    <option value="zulg">Zulg</option>
                  </select>
                </div>

                <div className="bg-white rounded-lg shadow overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100 text-left text-gray-600">
                        <th className="px-3 py-2">Standort</th>
                        <th className="px-3 py-2">Lehrperson</th>
                        <th className="px-3 py-2">Artikelnr.</th>
                        <th className="px-3 py-2">Artikel</th>
                        <th className="px-3 py-2">Menge</th>
                        <th className="px-3 py-2">Bemerkung</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allItems
                        .filter(item => campusFilter === 'all' || item.campus === campusFilter)
                        .map((item, i) => (
                          <tr key={i} className="border-t">
                            <td className="px-3 py-2 text-gray-500">
                              {item.campus === 'schoenau' ? 'Schönau' : 'Zulg'}
                            </td>
                            <td className="px-3 py-2 text-gray-800">{item.teacher_name}</td>
                            <td className="px-3 py-2 text-gray-500">{item.article_number}</td>
                            <td className="px-3 py-2 text-gray-800">{item.article_name}</td>
                            <td className="px-3 py-2 font-medium">{item.quantity}</td>
                            <td className="px-3 py-2 text-gray-500">{item.note || ''}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            {allItems.length === 0 && (
              <p className="text-gray-500">Noch keine Bestellungen vorhanden.</p>
            )}
          </div>
        )}

        {/* Export */}
        {view === 'export' && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">📥 Export</h2>
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <p className="text-gray-600">
                Exportiere alle eingereichten Bestellungen als CSV (Semikolon-getrennt, UTF-8).
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => exportCSV()}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
                >
                  📥 Alle Standorte
                </button>
                <button
                  onClick={() => exportCSV('schoenau')}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium"
                >
                  📥 Nur Schönau
                </button>
                <button
                  onClick={() => exportCSV('zulg')}
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 font-medium"
                >
                  📥 Nur Zulg
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ title, value, color }: { title: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    gray: 'bg-gray-50 text-gray-700 border-gray-200',
  }
  return (
    <div className={`p-4 rounded-lg border ${colors[color]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm">{title}</div>
    </div>
  )
}
