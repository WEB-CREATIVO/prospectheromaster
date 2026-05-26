export function formatPrice(price: number, currency = 'EUR', operation?: string): string {
  const formatted = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(price)
  return operation === 'rent' ? `${formatted}/mes` : formatted
}

export function formatArea(m2: number): string {
  return `${new Intl.NumberFormat('es-ES').format(m2)} m²`
}

export function propertyTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    apartment: 'Piso', house: 'Casa', villa: 'Villa', penthouse: 'Ático',
    studio: 'Estudio', duplex: 'Dúplex', chalet: 'Chalet',
    townhouse: 'Adosado', commercial: 'Local Comercial',
    land: 'Terreno', garage: 'Garaje', storage: 'Trastero',
  }
  return labels[type] ?? type
}

export function operationLabel(op: string): string {
  return op === 'sale' ? 'Venta' : 'Alquiler'
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '…'
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (minutes < 1) return 'Ahora mismo'
  if (minutes < 60) return `Hace ${minutes}m`
  if (hours < 24) return `Hace ${hours}h`
  if (days < 7) return `Hace ${days}d`
  return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}
