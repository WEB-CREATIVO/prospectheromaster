import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import {
  buildSystemPrompt, extractSearchFilters, extractLeadData,
  cleanResponseText, buildPropertyContext, chat, CLAUDE_MODEL,
  type ConversationMessage
} from '@/lib/ai/claude'
import type { Property } from '@/types'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await req.json()
    const { message, session_id, conversation_history = [] } = body

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Mensaje vacío' }, { status: 400 })
    }
    if (!session_id) {
      return NextResponse.json({ error: 'session_id requerido' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // 1. Load agency config
    const { data: agencyConfig } = await supabase
      .from('agency_config')
      .select('*')
      .single()

    if (!agencyConfig) {
      return NextResponse.json({ error: 'Agencia no configurada' }, { status: 500 })
    }

    // 2. Get or create conversation
    let { data: conversation } = await supabase
      .from('conversations')
      .select('id, message_count')
      .eq('session_id', session_id)
      .single()

    if (!conversation) {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({
          session_id,
          channel: 'web',
          ip_address: req.headers.get('x-forwarded-for')?.split(',')[0] ?? null,
          user_agent: req.headers.get('user-agent') ?? null,
          status: 'active',
        })
        .select('id, message_count')
        .single()
      conversation = newConv
    }

    if (!conversation) {
      return NextResponse.json({ error: 'Error de conversación' }, { status: 500 })
    }

    // 3. Save user message
    await supabase.from('messages').insert({
      conversation_id: conversation.id,
      role: 'user',
      content: message,
      model: CLAUDE_MODEL,
    })

    // 4. Track search query if intent detected
    const lowerMsg = message.toLowerCase()
    const isSearchIntent = ['busco', 'quiero', 'necesito', 'tienes', 'hay', 'mostrar', 'ver',
      'piso', 'casa', 'apartamento', 'alquiler', 'comprar', 'venta', 'habitacion'].some(w => lowerMsg.includes(w))

    // 5. Build messages array for Claude
    const messages: ConversationMessage[] = [
      ...conversation_history.slice(-8).map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: message },
    ]

    // 6. First pass: ask Claude for search filters
    const systemPrompt = buildSystemPrompt(agencyConfig)
    const firstResponse = await chat(messages, systemPrompt)

    // 7. Check if Claude wants to search properties
    const searchFilters = extractSearchFilters(firstResponse.text)
    let properties: Property[] = []
    let propertyContext = ''

    if (searchFilters || isSearchIntent) {
      const filters = searchFilters ?? {}
      const { data: searchResults } = await supabase.rpc('search_properties', {
        p_query: filters.query ?? null,
        p_operation_type: filters.operation_type ?? null,
        p_property_type: filters.property_type ?? null,
        p_city: filters.city ?? null,
        p_neighborhood: filters.neighborhood ?? null,
        p_min_price: filters.min_price ?? null,
        p_max_price: filters.max_price ?? null,
        p_min_bedrooms: filters.min_bedrooms ?? null,
        p_max_bedrooms: filters.max_bedrooms ?? null,
        p_min_area: filters.min_area ?? null,
        p_has_parking: filters.has_parking ?? null,
        p_has_elevator: filters.has_elevator ?? null,
        p_has_pool: filters.has_pool ?? null,
        p_has_terrace: filters.has_terrace ?? null,
        p_limit: 6,
        p_offset: 0,
      })

      properties = (searchResults as Property[]) ?? []

      if (searchFilters) {
        // Save search query
        await supabase.from('search_queries').insert({
          conversation_id: conversation.id,
          query_text: message,
          interpreted_filters: searchFilters,
          results_count: properties.length,
        })
      }

      if (properties.length > 0) {
        propertyContext = buildPropertyContext(properties)

        // Second pass with property context
        const secondMessages: ConversationMessage[] = [
          ...messages.slice(0, -1),
          {
            role: 'user',
            content: message + `\n\n[El sistema ha encontrado ${properties.length} propiedades. Preséntaselas de forma natural y atractiva.]`,
          },
        ]
        const secondResponse = await chat(secondMessages, systemPrompt, propertyContext)

        // Track property views
        if (properties.length > 0) {
          await supabase.from('property_views').insert(
            properties.slice(0, 3).map(p => ({
              conversation_id: conversation.id,
              property_id: p.id,
            }))
          )
        }

        const cleanText = cleanResponseText(secondResponse.text)
        const leadData = extractLeadData(secondResponse.text)

        if (leadData?.email || leadData?.phone) {
          await handleLeadCapture(supabase, conversation.id, leadData, agencyConfig.currency)
          await supabase.from('conversations').update({ converted: true, conversion_type: 'lead', converted_at: new Date().toISOString() }).eq('id', conversation.id)
        }

        await supabase.from('messages').insert({
          conversation_id: conversation.id,
          role: 'assistant',
          content: cleanText,
          content_type: 'property_list',
          properties_shown: properties.slice(0, 5).map(p => p.id),
          tokens_input: secondResponse.inputTokens,
          tokens_output: secondResponse.outputTokens,
          latency_ms: secondResponse.latencyMs,
          model: CLAUDE_MODEL,
        })

        return NextResponse.json({
          message: cleanText,
          properties: properties.slice(0, 5),
          conversation_id: conversation.id,
          latency_ms: Date.now() - startTime,
        })
      }
    }

    // 8. No properties found or no search — return first response
    const cleanText = cleanResponseText(firstResponse.text)
    const leadData = extractLeadData(firstResponse.text)

    if (leadData?.email || leadData?.phone) {
      await handleLeadCapture(supabase, conversation.id, leadData, agencyConfig.currency)
      await supabase.from('conversations').update({ converted: true, conversion_type: 'lead', converted_at: new Date().toISOString() }).eq('id', conversation.id)
    }

    await supabase.from('messages').insert({
      conversation_id: conversation.id,
      role: 'assistant',
      content: cleanText,
      content_type: 'text',
      tokens_input: firstResponse.inputTokens,
      tokens_output: firstResponse.outputTokens,
      latency_ms: firstResponse.latencyMs,
      model: CLAUDE_MODEL,
    })

    return NextResponse.json({
      message: cleanText,
      properties: properties.slice(0, 5),
      conversation_id: conversation.id,
      latency_ms: Date.now() - startTime,
    })
  } catch (error) {
    console.error('[Chat API Error]', error)
    return NextResponse.json(
      { error: 'Error interno. Por favor, inténtalo de nuevo.' },
      { status: 500 }
    )
  }
}

async function handleLeadCapture(
  supabase: ReturnType<typeof createServiceClient>,
  conversationId: string,
  leadData: Partial<{ name: string; email: string; phone: string; interest_type: string }>,
  _currency?: string
) {
  try {
    await supabase.from('leads').upsert({
      conversation_id: conversationId,
      name: leadData.name,
      email: leadData.email,
      phone: leadData.phone,
      interest_type: leadData.interest_type as 'sale' | 'rent' | 'both' | undefined,
      status: 'new',
      priority: 'medium',
      source: 'chat',
    }, { onConflict: 'conversation_id' })

    if (leadData.name || leadData.email) {
      await supabase.from('conversations').update({
        visitor_name: leadData.name,
        visitor_email: leadData.email,
      }).eq('id', conversationId)
    }
  } catch (e) {
    console.error('[Lead Capture Error]', e)
  }
}
