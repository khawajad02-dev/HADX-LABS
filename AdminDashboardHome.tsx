'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { GlassCard } from '@/components/ui/GlassCard'
import { fetchDashboardMetrics } from '@/lib/actions'

const SkeletonShimmer = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-4 bg-white/10 rounded w-3/4"></div>
    <div className="h-8 bg-white/5 rounded w-1/2"></div>
    <div className="h-2 bg-white/10 rounded-full mt-4 overflow-hidden">
      <div className="h-full bg-yellow-200/30 w-[75%] animate-pulse"></div>
    </div>
  </div>
)

export default function HomePage() {
  const [videoEnded, setVideoEnded] = useState(false)
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (videoEnded) {
      const loadData = async () => {
        try {
          const data = await fetchDashboardMetrics()
          setMetrics(data)
        } catch (error) {
          console.error("Failed to load metrics", error)
        } finally {
          setLoading(false)
        }
      }
      loadData()
    }
  }, [videoEnded])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = e.target.value.replace(/[<>"{}]/g, '')
    setSearchQuery(sanitized)
  }

  return (
    <AnimatePresence mode="wait">
      {!videoEnded && (
        <motion.div
          key="intro-video"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 bg-black z-50"
        >
          <video
            src="/videos/hadx_labs_intro.mp4"
            autoPlay
            muted
            playsInline
            onEnded={() => setVideoEnded(true)}
            className="w-full h-full object-cover"
          />
        </motion.div>
      )}

      {videoEnded && (
        <motion.div
          key="dashboard-viewport"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="min-h-screen bg-black p-6 text-white overflow-hidden relative"
        >
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black -z-10" />

          <header className="mb-8 flex justify-between items-center">
            <h1 className="text-3xl font-black tracking-widest uppercase">HADX CORE</h1>
            <div className="bg-green-500/10 border border-green-500/30 px-4 py-1 rounded-full text-xs text-green-400 font-mono">
              SECURE NODE ACTIVE
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-[200px]">
            <GlassCard className="md:col-span-2 md:row-span-2 flex flex-col justify-between group hover:border-yellow-200/30 hover:scale-[1.01] transition-all duration-300">
              {loading ? (
                <SkeletonShimmer />
              ) : (
                <>
                  <h3 className="text-zinc-400 text-sm uppercase tracking-wider">Total Revenue</h3>
                  <p className="text-4xl font-bold text-yellow-200">{metrics?.revenue || '$0.00'}</p>
                  <div className="h-2 bg-white/10 rounded-full mt-4 overflow-hidden">
                    <div className="h-full bg-yellow-200 w-[75%]" />
                  </div>
                </>
              )}
            </GlassCard>

            <GlassCard className="md:col-span-2 flex flex-col justify-center group hover:border-yellow-200/30 hover:scale-[1.01] transition-all duration-300">
              {loading ? (
                <div className="space-y-3">
                  <div className="animate-pulse h-3 bg-white/10 rounded w-1/4"></div>
                  <div className="animate-pulse h-12 bg-white/5 rounded-xl w-full"></div>
                </div>
              ) : (
                <>
                  <label className="text-zinc-400 text-xs uppercase mb-2">Secure Search</label>
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={handleSearch}
                    placeholder="Enter query..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-yellow-200/50 outline-none transition-all"
                  />
                </>
              )}
            </GlassCard>

            <GlassCard className="flex items-center justify-center group hover:border-yellow-200/30 hover:scale-[1.01] transition-all duration-300">
              {loading ? (
                <div className="animate-pulse h-8 w-20 bg-white/10 rounded"></div>
              ) : (
                <div className="text-center">
                  <p className="text-2xl font-bold">{metrics?.activeUsers || 0}</p>
                  <p className="text-xs text-zinc-500 uppercase">Active Users</p>
                </div>
              )}
            </GlassCard>

            <GlassCard className="flex items-center justify-center group hover:border-yellow-200/30 hover:scale-[1.01] transition-all duration-300">
              {loading ? (
                <div className="animate-pulse h-8 w-16 bg-white/10 rounded"></div>
              ) : (
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-400">99.9%</p>
                  <p className="text-xs text-zinc-500 uppercase">Uptime</p>
                </div>
              )}
            </GlassCard>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
