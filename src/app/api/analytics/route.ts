import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const secret = req.headers.get('x-admin-secret')
    if (secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const supabase = createServiceClient()
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const weekStart = new Date(now.getTime() - 7 * 86400000).toISOString()

    const [
      { count: todayConversations },
      { count: todayLeads },
      { count: todayConversions },
      { count: weekConversations },
      { count: weekLeads },
      { count: weekConversions },
      { data: topProperties },
      { data: dailyStats },
      { data: recentLeads },
      { data: recentConversations },
    ] = await Promise.all([
      supabase.from('conversations').select('*', { count: 'exact', head: true }).gte('started_at', todayStart),
      supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', todayStart),
      supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('converted', true).gte('started_at', todayStart),
      supabase.from('conversations').select('*', { count: 'exact', head: true }).gte('started_at', weekStart),
      supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', weekStart),
      supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('converted', true).gte('started_at', weekStart),
      supabase.from('property_views').select('property_id, properties(reference, title, price, operation_type, primary_image_url:property_images(url))').gte('viewed_at', weekStart).limit(50),
      supabase.from('v_conversation_stats').select('*').limit(14),
      supabase.from('leads').select('*, properties(title, price, operation_type)').order('created_at', { ascending: false }).limit(5),
      supabase.from('conversations').select('*').order('started_at', { ascending: false }).limit(5),
    ])

    // Aggregate top properties
    const propViewMap: Record<string, { id: string; views: number; property: unknown }> = {}
    if (topProperties) {
      for (const view of topProperties as Array<{ property_id: string; properties: unknown }>) {
        if (!propViewMap[view.property_id]) {
          propViewMap[view.property_id] = { id: view.property_id, views: 0, property: view.properties }
        }
        propViewMap[view.property_id].views++
      }
    }
    const topPropertiesSorted = Object.values(propViewMap)
      .sort((a, b) => b.views - a.views)
      .slice(0, 5)

    return NextResponse.json({
      today: {
        conversations: todayConversations ?? 0,
        leads: todayLeads ?? 0,
        conversions: todayConversions ?? 0,
        messages: 0,
      },
      week: {
        conversations: weekConversations ?? 0,
        leads: weekLeads ?? 0,
        conversions: weekConversions ?? 0,
        conversion_rate: weekConversations
          ? Math.round(((weekConversions ?? 0) / weekConversations) * 100)
          : 0,
      },
      top_properties: topPropertiesSorted,
      daily_stats: dailyStats ?? [],
      recent_leads: recentLeads ?? [],
      recent_conversations: recentConversations ?? [],
    })
  } catch (error) {
    console.error('[Analytics GET]', error)
    return NextResponse.json({ error: 'Error al cargar analytics' }, { status: 500 })
  }
}
