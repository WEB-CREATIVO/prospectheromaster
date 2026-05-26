'use client'
import { useState, useEffect } from 'react'
import { Users, Phone, Mail, Search, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { timeAgo } from '@/lib/utils/format'
import type { Lead } from '@/types'

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  new:              { label: 'Nuevo',       color: 'bg-blue-100 text-blue-700' },
  contacted:        { label: 'Contactado',  color: 'bg-yellow-100 text-yellow-700' },
  qualified:        { label: 'Calificado',  color: 'bg-purple-100 text-purple-700' },
  proposal:         { label: 'Propuesta',   color: 'bg-indigo-100 text-indigo-700' },
  visit_scheduled:  { label: 'Visita',      color: 'bg-orange-100 text-orange-700' },
  closed_won:       { label: 'Cerrado ✓',   color: 'bg-green-100 text-green-700' },
  closed_lost:      { label: 'Perdido',     color: 'bg-red-100 text-red-700' },
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low:    { label: 'Baja',    color: 'text-gray-400' },
  medium: { label: 'Media',   color: 'text-yellow-500' },
  high:   { label: 'Alta',    color: 'text-orange-500' },
  urgent: { label: 'Urgente', color: 'text-red-500' },
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [updating, setUpdating] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setLeads((data as Lead[]) ?? [])
        setLoading(false)
      })
  }, [])

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id)
    await supabase.from('leads').update({ status }).eq('id', id)
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status: status as Lead['status'] } : l))
    setUpdating(null)
  }

  const filtered = leads.filter(l => {
    if (statusFilter !== 'all' && l.status !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      if (!l.name?.toLowerCase().includes(q) &&
          !l.email?.toLowerCase().includes(q) &&
          !l.phone?.includes(q)) return false
    }
    return true
  })

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    won: leads.filter(l => l.status === 'closed_won').length,
    rate: leads.length ? Math.round((leads.filter(l => l.status === 'closed_won').length / leads.length) * 100) : 0,
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gestión del pipeline de clientes</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total leads', value: stats.total, icon: Users, color: 'text-blue-500' },
          { label: 'Nuevos', value: stats.new, icon: TrendingUp, color: 'text-green-500' },
          { label: 'Cerrados', value: stats.won, icon: TrendingUp, color: 'text-purple-500' },
          { label: 'Conversión', value: `${stats.rate}%`, icon: TrendingUp, color: 'text-amber-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className={`${color} mb-2`}><Icon className="w-4 h-4" /></div>
            <p className="text-xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email, teléfono..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300"
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white">
          <option value="all">Todos los estados</option>
          {Object.entries(STATUS_CONFIG).map(([v, { label }]) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Lead</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Contacto</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Interés</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Prioridad</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(lead => {
                const sc = STATUS_CONFIG[lead.status] ?? { label: lead.status, color: 'bg-gray-100' }
                const pc = PRIORITY_CONFIG[lead.priority] ?? PRIORITY_CONFIG.medium
                return (
                  <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-brand-600">
                            {(lead.name ?? lead.email ?? '?')[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{lead.name ?? 'Sin nombre'}</p>
                          {lead.notes && <p className="text-xs text-gray-400 truncate max-w-40">{lead.notes}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="space-y-0.5">
                        {lead.email && (
                          <a href={`mailto:${lead.email}`} className="flex items-center gap-1 text-xs text-gray-600 hover:text-brand-600">
                            <Mail className="w-3 h-3" />{lead.email}
                          </a>
                        )}
                        {lead.phone && (
                          <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-xs text-gray-600 hover:text-brand-600">
                            <Phone className="w-3 h-3" />{lead.phone}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {lead.interest_type && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          lead.interest_type === 'sale' ? 'bg-brand-100 text-brand-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {lead.interest_type === 'sale' ? 'Compra' : lead.interest_type === 'rent' ? 'Alquiler' : 'Ambos'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={lead.status}
                        onChange={e => updateStatus(lead.id, e.target.value)}
                        disabled={updating === lead.id}
                        className={`text-xs px-2 py-1 rounded-lg font-medium border-0 focus:outline-none cursor-pointer ${sc.color}`}
                      >
                        {Object.entries(STATUS_CONFIG).map(([v, { label }]) => (
                          <option key={v} value={v}>{label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className={`text-xs font-medium ${pc.color}`}>{pc.label}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{timeAgo(lead.created_at)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">
              {leads.length === 0 ? 'No hay leads todavía. Los leads se capturan automáticamente desde el chat.' : 'No se encontraron leads'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
