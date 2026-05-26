import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createAnonClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createAnonClient()
    const { data, error } = await supabase.from('agency_config').select('*').single()
    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error('[Agency GET]', error)
    return NextResponse.json({ error: 'Error al cargar configuración' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const secret = req.headers.get('x-admin-secret')
    if (secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const supabase = createServiceClient()
    const { data: existing } = await supabase.from('agency_config').select('id').single()

    let result
    if (existing) {
      const { data } = await supabase.from('agency_config').update(body).eq('id', existing.id).select().single()
      result = data
    } else {
      const { data } = await supabase.from('agency_config').insert(body).select().single()
      result = data
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[Agency PUT]', error)
    return NextResponse.json({ error: 'Error al guardar configuración' }, { status: 500 })
  }
}
