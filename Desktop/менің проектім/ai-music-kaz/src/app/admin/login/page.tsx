"use client"
import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Lock, Mail } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      toast.success('Сәтті кірілді!')
      router.push('/admin/dashboard')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Кіру қатесі орын алды')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center premium-gradient px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 glassmorphism rounded-3xl shadow-2xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gradient mb-2">AI MUSIC KAZ</h1>
          <p className="text-silver opacity-60">Админ панеліне кіру</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-silver opacity-40 w-5 h-5" />
            <input
              type="email"
              placeholder="Электрондық пошта"
              className="w-full pl-11 pr-4 py-3 bg-graphite/50 border border-glass-border rounded-xl focus:outline-none focus:ring-2 focus:ring-luxury-purple/50 transition-all text-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-silver opacity-40 w-5 h-5" />
            <input
              type="password"
              placeholder="Құпия сөз"
              className="w-full pl-11 pr-4 py-3 bg-graphite/50 border border-glass-border rounded-xl focus:outline-none focus:ring-2 focus:ring-luxury-purple/50 transition-all text-white"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-luxury-purple to-luxury-blue text-white font-semibold rounded-xl hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? 'Кіріп жатыр...' : 'Кіру'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
