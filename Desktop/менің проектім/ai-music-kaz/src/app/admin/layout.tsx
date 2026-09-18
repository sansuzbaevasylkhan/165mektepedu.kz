"use client"
import React from 'react'
import Link from 'next/link'
import { LayoutDashboard, Music, LogOut, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  const navItems = [
    { name: 'Басқару панелі', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Музыкалар', href: '/admin/music', icon: Music },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <aside className="w-64 bg-graphite border-r border-glass-border flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gradient">AI MUSIC KAZ</h1>
          <p className="text-xs text-silver opacity-40">Admin Dashboard</p>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-glass transition-all text-silver hover:text-white group"
            >
              <item.icon className="w-5 h-5 opacity-60 group-hover:opacity-100" />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-glass-border space-y-2">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-glass transition-all text-silver hover:text-white group"
          >
            <ExternalLink className="w-5 h-5 opacity-60 group-hover:opacity-100" />
            <span>Сайтқа өту</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 text-silver hover:text-red-400 transition-all group"
          >
            <LogOut className="w-5 h-5 opacity-60 group-hover:opacity-100" />
            <span>Шығу</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
