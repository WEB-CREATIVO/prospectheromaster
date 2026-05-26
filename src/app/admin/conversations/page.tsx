'use client'
import { useState, useEffect, useCallback } from 'react'
import { MessageSquare, Search, User, Clock, CheckCircle2, ChevronRight } from 'lucide-react'
import { timeAgo } from '@/lib/utils/format'
import type { Conversation, Message } from '@/types'
import { createClient } from '@/lib/supabase/client'

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selected, setSelected] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('conversations')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setConversations(data ?? [])
        setLoading(false)
      })
  }, [])

  const loadMessages = useCallback(async (conv: Conversation) => {
    setSelected(conv)
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conv.id)
      .order('created_at')
    setMessages(data ?? [])
  }, [supabase])

  const filtered = conversations.filter(c =>
    !search ||
    c.visitor_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.visitor_email?.toLowerCase().includes(search.toLowerCase()) ||
    c.session_id.includes(search)
  )

  const sentimentColor = (s?: string) => {
    if (s === 'positive') return 'text-green-500'
    if (s === 'negative') return 'text-red-500'
    return 'text-gray-400'
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Conversaciones</h1>
        <p className="text-sm text-gray-500 mt-0.5">{conversations.length} conversaciones totales</p>
      </div>

      <div className="flex gap-4 h-[calc(100vh-220px)]">
        {/* List */}
        <div className="w-72 flex flex-col gap-3 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar conversaciones..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-1">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin w-6 h-6 border-4 border-brand-600 border-t-transparent rounded-full" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-8">No hay conversaciones</p>
            ) : filtered.map(conv => (
              <button key={conv.id} onClick={() => loadMessages(conv)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  selected?.id === conv.id
                    ? 'bg-brand-50 border-brand-200'
                    : 'bg-white border-gray-100 hover:border-gray-200'
                }`}>
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-3.5 h-3.5 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-gray-800 truncate">
                        {conv.visitor_name ?? `Visitante ${conv.session_id.slice(0, 6)}`}
                      </p>
                      {conv.converted && <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-400">
                      {conv.message_count} msgs · {timeAgo(conv.started_at)}
                    </p>
                  </div>
                  <ChevronRight className="w-3 h-3 text-gray-300 mt-1 flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Messages panel */}
        <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">Selecciona una conversación</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="border-b border-gray-100 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800 text-sm">
                      {selected.visitor_name ?? `Visitante ${selected.session_id.slice(0, 8)}`}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {selected.visitor_email && `${selected.visitor_email} · `}
                      <Clock className="w-3 h-3 inline mr-0.5" />
                      {new Date(selected.started_at).toLocaleString('es-ES')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {selected.converted && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                        Lead capturado
                      </span>
                    )}
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      selected.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {selected.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.role === 'user'
                        ? 'bg-brand-600 text-white rounded-br-sm'
                        : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm'
                    }`}>
                      <p className="leading-relaxed">{msg.content}</p>
                      <div className="flex items-center justify-between mt-1 gap-3">
                        <p className="text-xs opacity-60">
                          {new Date(msg.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {msg.latency_ms && (
                          <p className="text-xs opacity-40">{msg.latency_ms}ms</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
