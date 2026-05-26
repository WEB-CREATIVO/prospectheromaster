'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Plus, Search, Filter, Eye, Edit2, Trash2, Home } from 'lucide-react'
import { Property } from '@/types'
import { formatPrice, formatArea, propertyTypeLabel, operationLabel } from '@/lib/utils/format'

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'sale' | 'rent'>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/properties?limit=50')
      .then(r => r.json())
      .then(d => setProperties(d.properties ?? []))
      .finally(() => setLoading(false))
  }, [])

  const filtered = properties.filter(p => {
    if (filter !== 'all' && p.operation_type !== filter) return false
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) &&
        !p.city.toLowerCase().includes(search.toLowerCase()) &&
        !p.reference.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      available: 'bg-green-100 text-green-700',
      reserved: 'bg-yellow-100 text-yellow-700',
      sold: 'bg-gray-100 text-gray-600',
      rented: 'bg-blue-100 text-blue-700',
    }
    const labels: Record<string, string> = {
      available: 'Disponible', reserved: 'Reservada', sold: 'Vendida', rented: 'Alquilada',
    }
    return { className: map[status] ?? 'bg-gray-100', label: labels[status] ?? status }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Propiedades</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} propiedades en catálogo</p>
        </div>
        <button className="flex items-center gap-2 bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors">
          <Plus className="w-4 h-4" /> Nueva propiedad
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por título, ciudad, ref..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300"
          />
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {(['all', 'sale', 'rent'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {f === 'all' ? 'Todas' : f === 'sale' ? 'Venta' : 'Alquiler'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Propiedad</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Ubicación</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Precio</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Detalles</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Vistas</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(p => {
                  const badge = statusBadge(p.status)
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            {p.primary_image_url ? (
                              <Image src={p.primary_image_url} alt={p.title} fill className="object-cover" unoptimized />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Home className="w-5 h-5 text-gray-300" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate max-w-48">{p.title}</p>
                            <div className="flex gap-1 mt-0.5">
                              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                                p.operation_type === 'sale' ? 'bg-brand-100 text-brand-700' : 'bg-amber-100 text-amber-700'
                              }`}>{operationLabel(p.operation_type)}</span>
                              <span className="text-xs text-gray-400">{p.reference}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="text-gray-700">{p.city}</p>
                        {p.neighborhood && <p className="text-xs text-gray-400">{p.neighborhood}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{formatPrice(p.price, p.currency, p.operation_type)}</p>
                        {p.price_per_m2 && <p className="text-xs text-gray-400">{formatPrice(p.price_per_m2)}/m²</p>}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <p className="text-gray-600">{propertyTypeLabel(p.property_type)}</p>
                        <p className="text-xs text-gray-400">
                          {p.bedrooms}h · {p.bathrooms}b · {p.area_m2 ? formatArea(p.area_m2) : '—'}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-gray-500">
                          <Eye className="w-3.5 h-3.5" />
                          <span className="text-xs">{p.views_count}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-md transition-colors">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-gray-400 text-sm">
                No se encontraron propiedades
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
