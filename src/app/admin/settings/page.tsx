'use client'
import { useState, useEffect } from 'react'
import { Save, Eye, Palette, Bot, Phone, Globe } from 'lucide-react'

interface Config {
  name: string; primary_color: string; secondary_color: string; accent_color: string
  welcome_message: string; ai_persona: string; contact_email: string
  contact_phone: string; address: string; city: string; website: string
  currency: string; language: string; lead_capture_enabled: boolean; lead_capture_trigger: number
}

const DEFAULT: Config = {
  name: '', primary_color: '#1E3A5F', secondary_color: '#C9973A', accent_color: '#F0E6D3',
  welcome_message: '', ai_persona: '', contact_email: '', contact_phone: '',
  address: '', city: '', website: '', currency: 'EUR', language: 'es',
  lead_capture_enabled: true, lead_capture_trigger: 3,
}

export default function SettingsPage() {
  const [config, setConfig] = useState<Config>(DEFAULT)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [tab, setTab] = useState<'brand' | 'ai' | 'contact' | 'leads'>('brand')

  useEffect(() => {
    fetch('/api/agency')
      .then(r => r.json())
      .then(d => { setConfig({ ...DEFAULT, ...d }); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    await fetch('/api/agency', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': 'demo' },
      body: JSON.stringify(config),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const set = (key: keyof Config) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setConfig(p => ({ ...p, [key]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }))

  const tabs = [
    { id: 'brand', icon: Palette, label: 'Marca' },
    { id: 'ai', icon: Bot, label: 'Asistente IA' },
    { id: 'contact', icon: Phone, label: 'Contacto' },
    { id: 'leads', icon: Globe, label: 'Leads' },
  ] as const

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" /></div>

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
          <p className="text-sm text-gray-500 mt-0.5">Personaliza tu plataforma</p>
        </div>
        <div className="flex gap-2">
          <a href="/" target="_blank"
            className="flex items-center gap-2 text-sm text-gray-600 border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            <Eye className="w-4 h-4" /> Vista previa
          </a>
          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 text-sm text-white bg-brand-600 px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50">
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : saved ? '¡Guardado!' : 'Guardar'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
              tab === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        {tab === 'brand' && (
          <>
            <Field label="Nombre de la agencia" required>
              <input value={config.name} onChange={set('name')} placeholder="Mi Inmobiliaria" {...input} />
            </Field>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Color primario">
                <div className="flex items-center gap-2">
                  <input type="color" value={config.primary_color} onChange={set('primary_color')}
                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                  <input value={config.primary_color} onChange={set('primary_color')} className={inputCls} />
                </div>
              </Field>
              <Field label="Color secundario">
                <div className="flex items-center gap-2">
                  <input type="color" value={config.secondary_color} onChange={set('secondary_color')}
                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                  <input value={config.secondary_color} onChange={set('secondary_color')} className={inputCls} />
                </div>
              </Field>
              <Field label="Color acento">
                <div className="flex items-center gap-2">
                  <input type="color" value={config.accent_color} onChange={set('accent_color')}
                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                  <input value={config.accent_color} onChange={set('accent_color')} className={inputCls} />
                </div>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Moneda">
                <select value={config.currency} onChange={set('currency')} className={inputCls}>
                  <option value="EUR">EUR €</option>
                  <option value="USD">USD $</option>
                  <option value="GBP">GBP £</option>
                </select>
              </Field>
              <Field label="Idioma">
                <select value={config.language} onChange={set('language')} className={inputCls}>
                  <option value="es">Español</option>
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                  <option value="pt">Português</option>
                </select>
              </Field>
            </div>
          </>
        )}

        {tab === 'ai' && (
          <>
            <Field label="Mensaje de bienvenida" hint="Primera frase del asistente al iniciar el chat. Soporta **negrita** y saltos de línea.">
              <textarea value={config.welcome_message} onChange={set('welcome_message')}
                rows={4} className={inputCls} placeholder="¡Hola! Soy tu asistente..." />
            </Field>
            <Field label="Personalidad de la IA (System Prompt)" hint="Define cómo se comporta y qué es el asistente. Sé específico y detallado.">
              <textarea value={config.ai_persona} onChange={set('ai_persona')}
                rows={8} className={inputCls}
                placeholder="Eres un experto agente inmobiliario llamado [nombre]..." />
            </Field>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-800">
                <strong>Consejo:</strong> La IA siempre usa las propiedades reales del catálogo. No inventa datos.
                Personaliza la personalidad para que refleje los valores de tu agencia.
              </p>
            </div>
          </>
        )}

        {tab === 'contact' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Email de contacto">
                <input type="email" value={config.contact_email} onChange={set('contact_email')}
                  placeholder="info@tuinmobiliaria.es" {...inputProps} />
              </Field>
              <Field label="Teléfono">
                <input type="tel" value={config.contact_phone} onChange={set('contact_phone')}
                  placeholder="+34 91 000 00 00" {...inputProps} />
              </Field>
            </div>
            <Field label="Dirección">
              <input value={config.address} onChange={set('address')} placeholder="Calle Mayor, 1" {...inputProps} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Ciudad">
                <input value={config.city} onChange={set('city')} placeholder="Madrid" {...inputProps} />
              </Field>
              <Field label="Sitio web">
                <input type="url" value={config.website} onChange={set('website')}
                  placeholder="https://tuinmobiliaria.es" {...inputProps} />
              </Field>
            </div>
          </>
        )}

        {tab === 'leads' && (
          <>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-800">Captura automática de leads</p>
                <p className="text-xs text-gray-500 mt-0.5">La IA solicita los datos de contacto automáticamente</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={config.lead_capture_enabled}
                  onChange={e => setConfig(p => ({ ...p, lead_capture_enabled: e.target.checked }))}
                  className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600" />
              </label>
            </div>
            <Field label="Mensajes antes de solicitar datos" hint="Número de mensajes del usuario antes de activar la captura de lead (1-10)">
              <input type="number" min={1} max={10} value={config.lead_capture_trigger}
                onChange={set('lead_capture_trigger')} className={inputCls} />
            </Field>
          </>
        )}
      </div>
    </div>
  )
}

const inputCls = 'w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white'
const inputProps = { className: inputCls }
const input = { className: inputCls }

function Field({ label, hint, required, children }: {
  label: string; hint?: string; required?: boolean; children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}
