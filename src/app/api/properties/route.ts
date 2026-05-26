import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const supabase = createServiceClient()

    const operation = searchParams.get('operation_type')
    const status = searchParams.get('status') ?? 'available'
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100)
    const offset = parseInt(searchParams.get('offset') ?? '0')

    let query = supabase
      .from('v_property_summary')
      .select('*')
      .eq('status', status)
      .order('highlight', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (operation) query = query.eq('operation_type', operation)

    const { data, error, count } = await query

    if (error) throw error
    return NextResponse.json({ properties: data, total: count })
  } catch (error) {
    console.error('[Properties GET]', error)
    return NextResponse.json({ error: 'Error al cargar propiedades' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const supabase = createServiceClient()

    // Auth check (simple secret header for MVP)
    const secret = req.headers.get('x-admin-secret')
    if (secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { images, ...propertyData } = body
    const { data: property, error } = await supabase
      .from('properties')
      .insert(propertyData)
      .select()
      .single()

    if (error) throw error

    if (images?.length) {
      await supabase.from('property_images').insert(
        images.map((img: { url: string; alt_text?: string }, i: number) => ({
          property_id: property.id,
          url: img.url,
          alt_text: img.alt_text,
          is_primary: i === 0,
          sort_order: i,
        }))
      )
    }

    return NextResponse.json({ property }, { status: 201 })
  } catch (error) {
    console.error('[Properties POST]', error)
    return NextResponse.json({ error: 'Error al crear propiedad' }, { status: 500 })
  }
}
