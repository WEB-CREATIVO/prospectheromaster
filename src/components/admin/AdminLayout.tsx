'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Home, MessageSquare, Users, Settings,
  Bot, LogOut, ChevronRight, Menu, X
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/properties', icon: Home, label: 'Propiedades' },
  { href: '/admin/conversations', icon: MessageSquare, label: 'Conversaciones' },
  { href: '/admin/leads', icon: Users, label: 'Leads' },
  { href: '/admin/settings', icon: Settings, label: 'Configuración' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 flex flex-col transition-transform duration-200
        md:relative md:translate-x-0
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `} style={{ background: 'linear-gradient(180deg, #1E3A5F 0%, #0f1f33 100%)' }}>
        {/* Logo */}
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gold-500 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">ProspectHero</p>
              <p className="text-white/50 text-xs">Master Panel</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname.startsWith(href)
            return (
              <Link key={href} href={href}
                className={`sidebar-link ${active ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{label}</span>
                {active && <ChevronRight className="w-3 h-3 ml-auto opacity-60" />}
              </Link>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="p-4 border-t border-white/10 space-y-2">
          <Link href="/" className="sidebar-link">
            <MessageSquare className="w-4 h-4" />
            <span>Ver Chat</span>
          </Link>
          <button className="sidebar-link w-full text-left">
            <LogOut className="w-4 h-4" />
            <span>Salir</span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-14 border-b border-gray-200 bg-white flex items-center gap-3 px-4 flex-shrink-0">
          <button className="md:hidden text-gray-500" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <h1 className="text-sm font-semibold text-gray-700">
            {navItems.find(i => pathname.startsWith(i.href))?.label ?? 'Admin'}
          </h1>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-gray-400">Admin</span>
            <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center">
              <span className="text-xs font-semibold text-brand-600">A</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
