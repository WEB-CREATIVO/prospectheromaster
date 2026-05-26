import { createAnonClient } from '@/lib/supabase/server'
import ChatInterface from '@/components/chat/ChatInterface'
import type { AgencyConfig } from '@/types'

const DEFAULT_AGENCY: AgencyConfig = {
  id: 'default',
  name: 'ProspectHeroMaster',
  primary_color: '#1E3A5F',
  secondary_color: '#C9973A',
  accent_color: '#F0E6D3',
  welcome_message: '¡Hola! Soy tu asistente inmobiliario. ¿En qué puedo ayudarte hoy?',
  ai_persona: '',
  currency: 'EUR',
  language: 'es',
  timezone: 'Europe/Madrid',
  lead_capture_enabled: true,
  lead_capture_trigger: 3,
  metadata: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export const revalidate = 60

export default async function ChatPage() {
  let agencyConfig: AgencyConfig = DEFAULT_AGENCY
  try {
    const supabase = createAnonClient()
    const { data } = await supabase.from('agency_config').select('*').single()
    if (data) agencyConfig = data as AgencyConfig
  } catch { /* use default */ }

  return (
    <main className="min-h-screen flex items-center justify-center p-4"
      style={{ background: `linear-gradient(135deg, ${agencyConfig.primary_color}15, ${agencyConfig.secondary_color}15)` }}>
      <div className="w-full max-w-lg h-[85vh] flex flex-col">
        <ChatInterface agencyConfig={agencyConfig} />
      </div>
    </main>
  )
}
