'use client'
import Image from 'next/image'
import { BedDouble, Bath, Maximize2, MapPin, Zap, Car, Waves, Trees } from 'lucide-react'
import { Property } from '@/types'
import { formatPrice, formatArea, propertyTypeLabel } from '@/lib/utils/format'

interface Props {
  property: Property
  compact?: boolean
}

export default function PropertyCard({ property: p, compact }: Props) {
  const badge = p.operation_type === 'sale'
    ? 'bg-brand-600 text-white'
    : 'bg-gold-500 text-white'

  const amenities = [
    p.has_elevator && { icon: Zap, label: 'Ascensor' },
    p.has_parking && { icon: Car, label: 'Garaje' },
    p.has_pool && { icon: Waves, label: 'Piscina' },
    p.has_terrace && { icon: Trees, label: 'Terraza' },
  ].filter(Boolean) as Array<{ icon: React.ElementType; label: string }>

  return (
    <div className="property-card bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
      {/* Image */}
      <div className="relative h-40 bg-gray-100">
        {p.primary_image_url ? (
          <Image
            src={p.primary_image_url}
            alt={p.title}
            fill
            className="object-cover"
            sizes="(max-width: 400px) 100vw, 350px"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100">
            <span className="text-brand-300 text-4xl">🏠</span>
          </div>
        )}
        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge}`}>
            {p.operation_type === 'sale' ? 'Venta' : 'Alquiler'}
          </span>
          {p.highlight && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-400 text-amber-900">
              Destacado
            </span>
          )}
        </div>
        <div className="absolute top-2 right-2">
          <span className="text-xs bg-black/60 text-white px-2 py-0.5 rounded-full">
            {propertyTypeLabel(p.property_type)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">
            {p.title}
          </h3>
        </div>

        <div className="flex items-center gap-1 text-gray-500 text-xs mb-2">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{p.neighborhood ? `${p.neighborhood}, ` : ''}{p.city}</span>
        </div>

        {/* Price */}
        <p className="text-brand-600 font-bold text-base mb-2">
          {formatPrice(p.price, p.currency, p.operation_type)}
          {p.price_per_m2 && (
            <span className="text-gray-400 font-normal text-xs ml-1">
              · {formatPrice(p.price_per_m2, p.currency)}/m²
            </span>
          )}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-3 text-gray-600 text-xs mb-2">
          {p.bedrooms > 0 && (
            <span className="flex items-center gap-1">
              <BedDouble className="w-3.5 h-3.5" />
              {p.bedrooms} hab.
            </span>
          )}
          {p.bathrooms > 0 && (
            <span className="flex items-center gap-1">
              <Bath className="w-3.5 h-3.5" />
              {p.bathrooms} baños
            </span>
          )}
          {p.area_m2 && (
            <span className="flex items-center gap-1">
              <Maximize2 className="w-3.5 h-3.5" />
              {formatArea(p.area_m2)}
            </span>
          )}
        </div>

        {/* Amenities */}
        {!compact && amenities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {amenities.slice(0, 3).map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-0.5 text-xs bg-gray-50 text-gray-600 px-1.5 py-0.5 rounded-md">
                <Icon className="w-3 h-3" />
                {label}
              </span>
            ))}
          </div>
        )}

        {/* Ref */}
        <p className="text-gray-300 text-xs mt-2">Ref: {p.reference}</p>
      </div>
    </div>
  )
}
