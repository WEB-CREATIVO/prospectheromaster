import Anthropic from '@anthropic-ai/sdk'
import { SearchFilters, Property } from '@/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export const CLAUDE_MODEL = 'claude-sonnet-4-6'

// System prompt builder — fully configurable per agency
export function buildSystemPrompt(agencyConfig: {
  name: string
  ai_persona: string
  contact_email?: string
  contact_phone?: string
  currency?: string
}): string {
  return `${agencyConfig.ai_persona}

## Tu identidad
Eres el asistente de IA de "${agencyConfig.name}".
${agencyConfig.contact_email ? `Email de contacto: ${agencyConfig.contact_email}` : ''}
${agencyConfig.contact_phone ? `Teléfono: ${agencyConfig.contact_phone}` : ''}

## Capacidades
- Buscar propiedades en el catálogo según las necesidades del usuario
- Describir propiedades en detalle (precio, zona, características, imágenes)
- Responder preguntas sobre procesos de compra, alquiler, hipotecas y trámites
- Capturar datos de contacto del interesado cuando sea el momento adecuado
- Proporcionar soporte pre y post-venta

## Reglas estrictas
1. SOLO recomiendas propiedades reales del catálogo. Nunca inventas propiedades.
2. Cuando el usuario quiera buscar propiedades, devuelves SIEMPRE el JSON de búsqueda en este formato exacto al final del mensaje:
   <search>{"operation_type":"sale|rent","city":"...","min_bedrooms":N,"max_price":N,...}</search>
3. Cuando captures datos del lead, devuelves:
   <lead>{"name":"...","email":"...","phone":"...","interest_type":"sale|rent|both"}</lead>
4. Si el usuario pregunta por el estado de un contrato o inmueble, dile que un agente le contactará con la información específica.
5. Moneda: ${agencyConfig.currency ?? 'EUR'}. Precios siempre en euros.
6. Idioma: Español de España (tuteo). Sé cálido, profesional y conciso.

## Flujo de captura de lead
Tras 3-4 intercambios de calidad, pregunta si quieren que un agente les contacte. Si dicen que sí o muestran interés claro, pide nombre, email y teléfono de forma natural.

## Formato de respuesta
- Usa markdown ligero (negrita, listas)
- Máximo 3-4 párrafos por respuesta
- Si hay propiedades para mostrar, el sistema las mostrará en tarjetas automáticamente`
}

// Extract search filters from Claude's response
export function extractSearchFilters(text: string): SearchFilters | null {
  const match = text.match(/<search>([\s\S]*?)<\/search>/)
  if (!match) return null
  try {
    return JSON.parse(match[1]) as SearchFilters
  } catch {
    return null
  }
}

// Extract lead data from Claude's response
export function extractLeadData(text: string): Partial<{
  name: string; email: string; phone: string; interest_type: string
}> | null {
  const match = text.match(/<lead>([\s\S]*?)<\/lead>/)
  if (!match) return null
  try {
    return JSON.parse(match[1])
  } catch {
    return null
  }
}

// Clean response text (remove XML tags before showing to user)
export function cleanResponseText(text: string): string {
  return text
    .replace(/<search>[\s\S]*?<\/search>/g, '')
    .replace(/<lead>[\s\S]*?<\/lead>/g, '')
    .trim()
}

// Build context message with found properties
export function buildPropertyContext(properties: Property[]): string {
  if (!properties.length) return ''
  const list = properties
    .slice(0, 5)
    .map((p, i) => {
      const price = p.operation_type === 'rent'
        ? `${p.price.toLocaleString('es-ES')}€/mes`
        : `${p.price.toLocaleString('es-ES')}€`
      return `${i + 1}. [${p.reference}] ${p.title}
   - Tipo: ${p.property_type} | ${p.operation_type === 'sale' ? 'Venta' : 'Alquiler'}
   - Precio: ${price}${p.price_per_m2 ? ` (${p.price_per_m2.toLocaleString('es-ES')}€/m²)` : ''}
   - Habitaciones: ${p.bedrooms} | Baños: ${p.bathrooms} | Superficie: ${p.area_m2}m²
   - Ubicación: ${p.neighborhood ? p.neighborhood + ', ' : ''}${p.city}
   - Características: ${[
       p.has_elevator && 'Ascensor',
       p.has_parking && 'Garaje',
       p.has_pool && 'Piscina',
       p.has_terrace && 'Terraza',
       p.has_air_conditioning && 'A/C',
       p.has_furnished && 'Amueblado',
     ].filter(Boolean).join(', ') || 'Estándar'}
   - ${p.description?.slice(0, 150)}...`
    })
    .join('\n\n')

  return `\n\n[CATÁLOGO - ${properties.length} propiedades encontradas]\n${list}`
}

export type ConversationMessage = { role: 'user' | 'assistant'; content: string }

export async function chat(
  messages: ConversationMessage[],
  systemPrompt: string,
  propertyContext?: string
): Promise<{ text: string; inputTokens: number; outputTokens: number; latencyMs: number }> {
  const start = Date.now()

  const systemWithContext = propertyContext
    ? systemPrompt + propertyContext
    : systemPrompt

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    system: systemWithContext,
    messages,
  })

  const latencyMs = Date.now() - start
  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  return {
    text,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    latencyMs,
  }
}
