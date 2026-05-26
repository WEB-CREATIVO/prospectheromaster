'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Bot, User, Home, Phone, X } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { v4 as uuidv4 } from 'uuid'
import PropertyCard from './PropertyCard'
import type { ChatMessage, Property, AgencyConfig } from '@/types'

interface Props { agencyConfig: AgencyConfig }

export default function ChatInterface({ agencyConfig }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId] = useState(() => uuidv4())
  const [showLeadForm, setShowLeadForm] = useState(false)
  const [leadForm, setLeadForm] = useState({ name: '', email: '', phone: '' })
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Initial welcome message
  useEffect(() => {
    setMessages([{
      id: uuidv4(),
      role: 'assistant',
      content: agencyConfig.welcome_message,
      timestamp: new Date(),
    }])
  }, [agencyConfig.welcome_message])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const conversationHistory = messages
    .filter(m => !m.isTyping)
    .map(m => ({ role: m.role, content: m.content }))

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMsg: ChatMessage = {
      id: uuidv4(), role: 'user', content: text, timestamp: new Date(),
    }
    const typingMsg: ChatMessage = {
      id: 'typing', role: 'assistant', content: '', timestamp: new Date(), isTyping: true,
    }

    setMessages(prev => [...prev, userMsg, typingMsg])
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          session_id: sessionId,
          conversation_history: conversationHistory.slice(-8),
        }),
      })

      const data = await res.json()

      setMessages(prev => [
        ...prev.filter(m => m.id !== 'typing'),
        {
          id: uuidv4(),
          role: 'assistant',
          content: data.message ?? 'Lo siento, ha ocurrido un error. Por favor, inténtalo de nuevo.',
          timestamp: new Date(),
          properties: data.properties?.length ? data.properties : undefined,
        },
      ])
    } catch {
      setMessages(prev => [
        ...prev.filter(m => m.id !== 'typing'),
        {
          id: uuidv4(), role: 'assistant',
          content: 'Lo siento, ha ocurrido un error de conexión. Por favor, inténtalo de nuevo.',
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isLoading, sessionId, conversationHistory])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setShowLeadForm(false)
    await sendMessage(
      `Mi nombre es ${leadForm.name}, mi email es ${leadForm.email}${leadForm.phone ? ` y mi teléfono es ${leadForm.phone}` : ''}. Me gustaría que un agente me contactara.`
    )
  }

  const suggestions = [
    'Busco piso en Madrid para comprar',
    'Apartamento de alquiler en Barcelona',
    'Villa con piscina en Marbella',
    '¿Qué propiedades tenéis disponibles?',
  ]

  const primaryColor = agencyConfig.primary_color ?? '#1E3A5F'
  const secondaryColor = agencyConfig.secondary_color ?? '#C9973A'

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-2xl overflow-hidden max-w-lg w-full mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 text-white"
        style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <h2 className="font-semibold text-sm leading-tight">{agencyConfig.name}</h2>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-white/80">Asistente IA · En línea</span>
          </div>
        </div>
        {agencyConfig.contact_phone && (
          <a href={`tel:${agencyConfig.contact_phone}`}
            className="ml-auto flex items-center gap-1 text-xs text-white/80 hover:text-white transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{agencyConfig.contact_phone}</span>
          </a>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        {messages.map(msg => (
          <div key={msg.id}
            className={`flex gap-2 chat-bubble-enter ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Avatar */}
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 self-end
              ${msg.role === 'user' ? 'bg-brand-600' : 'bg-white border border-gray-200'}`}
              style={msg.role === 'user' ? { background: primaryColor } : {}}>
              {msg.role === 'user'
                ? <User className="w-3.5 h-3.5 text-white" />
                : <Bot className="w-3.5 h-3.5 text-gray-600" />
              }
            </div>

            {/* Bubble + Properties */}
            <div className={`flex flex-col gap-2 max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              {msg.isTyping ? (
                <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1 items-center h-5">
                    <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                  </div>
                </div>
              ) : (
                <div className={`rounded-2xl px-4 py-3 text-sm shadow-sm leading-relaxed
                  ${msg.role === 'user'
                    ? 'text-white rounded-br-sm'
                    : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm'}`}
                  style={msg.role === 'user' ? { background: primaryColor } : {}}>
                  {msg.role === 'assistant' ? (
                    <div className="prose-chat">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p>{msg.content}</p>
                  )}
                </div>
              )}

              {/* Property cards */}
              {msg.properties && msg.properties.length > 0 && (
                <div className="w-full grid grid-cols-1 gap-2">
                  {msg.properties.slice(0, 4).map((p: Property) => (
                    <PropertyCard key={p.id} property={p} />
                  ))}
                </div>
              )}

              <span className="text-xs text-gray-400 px-1">
                {msg.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {/* Suggestions (only at start) */}
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {suggestions.map(s => (
              <button key={s} onClick={() => sendMessage(s)}
                className="text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-brand-300 hover:text-brand-600 transition-colors shadow-sm">
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Lead CTA */}
        {messages.length >= 5 && !messages.some(m => m.content.includes('agente')) && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
            <p className="text-xs text-amber-800 mb-2 font-medium">
              ¿Quieres que un agente te llame?
            </p>
            <button onClick={() => setShowLeadForm(true)}
              className="text-xs font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors">
              Sí, contactarme
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Lead capture form */}
      {showLeadForm && (
        <div className="border-t border-gray-100 p-4 bg-white animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800">Tus datos de contacto</h3>
            <button onClick={() => setShowLeadForm(false)}>
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <form onSubmit={handleLeadSubmit} className="space-y-2">
            <input
              required placeholder="Tu nombre *" value={leadForm.name}
              onChange={e => setLeadForm(p => ({ ...p, name: e.target.value }))}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300"
            />
            <input
              required type="email" placeholder="Tu email *" value={leadForm.email}
              onChange={e => setLeadForm(p => ({ ...p, email: e.target.value }))}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300"
            />
            <input
              type="tel" placeholder="Teléfono (opcional)" value={leadForm.phone}
              onChange={e => setLeadForm(p => ({ ...p, phone: e.target.value }))}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300"
            />
            <button type="submit"
              className="w-full text-sm font-semibold text-white py-2 rounded-lg transition-colors"
              style={{ background: primaryColor }}>
              Enviar mis datos
            </button>
          </form>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-100 p-3 bg-white">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Escribe tu mensaje..."
            disabled={isLoading}
            className="flex-1 text-sm border border-gray-200 rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-300 disabled:opacity-50 bg-gray-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40"
            style={{ background: primaryColor }}
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </form>
        <p className="text-center text-xs text-gray-300 mt-2 flex items-center justify-center gap-1">
          <Home className="w-3 h-3" />
          Powered by ProspectHeroMaster
        </p>
      </div>
    </div>
  )
}
