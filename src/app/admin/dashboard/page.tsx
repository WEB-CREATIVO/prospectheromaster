'use client'
import { useState, useEffect } from 'react'
import {
  MessageSquare, Users, TrendingUp, Home,
  ArrowUp, Clock, Eye
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts'
import { formatPrice, timeAgo } from '@/lib/utils/format'

const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? 'demo'

interface Stats {
  today: { conversations: number; leads: number; conversions: number }
  week: { conversations: number; leads: number; conversions: number; conversion_rate: number }
  top_properties: Array<{ views: number; property: { title: string; price: number; operation_type: string } }>
  daily_stats: Array<{ date: string; total_conversations: number; leads_captured: number; converted_conversations: number }>
  recent_leads: Array<{ id: string; name: string; email: string; status: string; created_at: string }>
  recent_conversations: Array<{ id: string; session_id: string; visitor_name: string; message_count: number; started_at: string; converted: boolean }>
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  qualified: 'bg-purple-100 text-purple-700',
  closed_won: 'bg-green-100 text-green-700',
  closed_lost: 'bg-red-100 text-red-700',
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics', { headers: { 'x-admin-secret': ADMIN_SECRET } })
      .then(r => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" />
    </div>
  )

  const kpis = [
    {
      label: 'Conversaciones hoy', value: stats?.today.conversions ?? 0,
      sub: `+${stats?.week.conversations ?? 0} esta semana`,
      icon: MessageSquare, color: 'bg-blue-500', trend: 12,
    },
    {
      label: 'Leads capturados', value: stats?.week.leads ?? 0,
      sub: `${stats?.today.leads ?? 0} hoy`,
      icon: Users, color: 'bg-green-500', trend: 8,
    },
    {
      label: 'Tasa de conversión', value: `${stats?.week.conversion_rate ?? 0}%`,
      sub: `${stats?.week.conversions ?? 0} conversiones esta semana`,
      icon: TrendingUp, color: 'bg-purple-500', trend: 5,
    },
    {
      label: 'Propiedades activas', value: 10,
      sub: '5 venta · 5 alquiler',
      icon: Home, color: 'bg-amber-500', trend: 0,
    },
  ]

  const chartData = stats?.daily_stats?.slice(0, 7).reverse().map(d => ({
    date: new Date(d.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
    conversaciones: d.total_conversations,
    leads: d.leads_captured,
    conversiones: d.converted_conversations,
  })) ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Métricas en tiempo real de tu plataforma</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, sub, icon: Icon, color, trend }) => (
          <div key={label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              {trend !== 0 && (
                <span className="flex items-center gap-0.5 text-xs font-medium text-green-600">
                  <ArrowUp className="w-3 h-3" />{trend}%
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">{label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Area chart */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Actividad últimos 7 días</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorConv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1E3A5F" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1E3A5F" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C9973A" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#C9973A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="conversaciones" stroke="#1E3A5F" fill="url(#colorConv)" name="Conversaciones" />
                <Area type="monotone" dataKey="leads" stroke="#C9973A" fill="url(#colorLeads)" name="Leads" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              Todavía no hay datos · Inicia el chat para ver estadísticas
            </div>
          )}
        </div>

        {/* Top properties */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            <Eye className="w-4 h-4 inline mr-1.5 text-gray-400" />
            Propiedades más vistas
          </h2>
          {stats?.top_properties?.length ? (
            <div className="space-y-3">
              {stats.top_properties.slice(0, 5).map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-300 w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">{item.property?.title}</p>
                    <p className="text-xs text-gray-400">
                      {formatPrice(item.property?.price, 'EUR', item.property?.operation_type)}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-brand-600">{item.views} vistas</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 text-center py-8">Sin datos todavía</p>
          )}
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent leads */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Últimos leads</h2>
          {stats?.recent_leads?.length ? (
            <div className="space-y-3">
              {stats.recent_leads.map(lead => (
                <div key={lead.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-gray-500">
                      {(lead.name ?? lead.email ?? '?')[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800">{lead.name ?? lead.email ?? 'Anónimo'}</p>
                    <p className="text-xs text-gray-400">{timeAgo(lead.created_at)}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[lead.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {lead.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 text-center py-8">No hay leads todavía</p>
          )}
        </div>

        {/* Recent conversations */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Conversaciones recientes</h2>
          {stats?.recent_conversations?.length ? (
            <div className="space-y-3">
              {stats.recent_conversations.map(conv => (
                <div key={conv.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-3.5 h-3.5 text-brand-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800">
                      {conv.visitor_name ?? `Visitante ${conv.session_id.slice(0, 6)}`}
                    </p>
                    <p className="text-xs text-gray-400">
                      {conv.message_count} mensajes · <Clock className="w-2.5 h-2.5 inline" /> {timeAgo(conv.started_at)}
                    </p>
                  </div>
                  {conv.converted && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Lead</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 text-center py-8">No hay conversaciones todavía</p>
          )}
        </div>
      </div>
    </div>
  )
}
