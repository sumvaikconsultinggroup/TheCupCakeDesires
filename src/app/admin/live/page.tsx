'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Globe,
  Users,
  ShoppingCart,
  Eye,
  MousePointer,
  Clock,
  TrendingUp,
  MapPin,
  Activity,
  Zap,
  ArrowRight,
  Package,
  CreditCard,
  AlertCircle,
  RefreshCw,
  Maximize2,
  ChevronRight,
  User,
  Timer,
  IndianRupee,
  Wifi,
  WifiOff,
  Search,
  ExternalLink,
} from 'lucide-react'

interface LiveVisitor {
  id: string
  location: { city: string; country: string; lat: number; lng: number }
  currentPage: string
  device: 'desktop' | 'mobile' | 'tablet'
  duration: number
  cartItems: number
  cartValue: number
  status: 'browsing' | 'cart' | 'checkout' | 'purchased' | 'abandoned'
  pageViews?: number
}

interface LiveEvent {
  id: string
  type: string
  visitor: string
  data: any
  timestamp: string | Date
}

interface LiveStats {
  activeVisitors: number
  activeCarts: number
  activeCartValue: number
  inCheckout: number
  todayRevenue: number
  todayOrders: number
  abandonedCarts: number
  abandonedValue: number
  conversionRate: number
  revenueChange: string
  deviceBreakdown: { desktop: number; mobile: number; tablet: number }
  topCities: { city: string; count: number }[]
}

// India city coordinates for map
const INDIA_CITIES: Record<string, { lat: number; lng: number }> = {
  'Mumbai': { lat: 19.076, lng: 72.877 },
  'Delhi': { lat: 28.613, lng: 77.209 },
  'Bangalore': { lat: 12.971, lng: 77.594 },
  'Chennai': { lat: 13.082, lng: 80.270 },
  'Hyderabad': { lat: 17.385, lng: 78.486 },
  'Pune': { lat: 18.520, lng: 73.856 },
  'Kolkata': { lat: 22.572, lng: 88.363 },
  'Ahmedabad': { lat: 23.022, lng: 72.571 },
  'Jaipur': { lat: 26.912, lng: 75.787 },
  'Lucknow': { lat: 26.846, lng: 80.946 },
  'Unknown': { lat: 20.593, lng: 78.962 }, // Center of India
}

export default function LiveViewPage() {
  const [visitors, setVisitors] = useState<LiveVisitor[]>([])
  const [events, setEvents] = useState<LiveEvent[]>([])
  const [stats, setStats] = useState<LiveStats>({
    activeVisitors: 0,
    activeCarts: 0,
    activeCartValue: 0,
    inCheckout: 0,
    todayRevenue: 0,
    todayOrders: 0,
    abandonedCarts: 0,
    abandonedValue: 0,
    conversionRate: 0,
    revenueChange: '0',
    deviceBreakdown: { desktop: 0, mobile: 0, tablet: 0 },
    topCities: [],
  })
  const [connected, setConnected] = useState(false)
  const [selectedVisitor, setSelectedVisitor] = useState<LiveVisitor | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Use polling instead of SSE for better proxy compatibility
  const fetchLiveData = useCallback(async () => {
    try {
      // Fetch stats
      const statsRes = await fetch('/api/live/stats')
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(prev => ({
          ...prev,
          ...statsData,
        }))
      }
      
      // Fetch visitors
      const visitorsRes = await fetch('/api/live/visitors')
      if (visitorsRes.ok) {
        const visitorsData = await visitorsRes.json()
        if (visitorsData.visitors) {
          setVisitors(visitorsData.visitors.map((v: any) => ({
            ...v,
            location: {
              ...v.location,
              lat: INDIA_CITIES[v.location?.city]?.lat || v.location?.lat || 20.593,
              lng: INDIA_CITIES[v.location?.city]?.lng || v.location?.lng || 78.962,
            }
          })))
        }
      }
      
      // Fetch events
      const eventsRes = await fetch('/api/live/events?limit=20')
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json()
        if (eventsData.events) {
          setEvents(eventsData.events)
        }
      }
      
      setConnected(true)
    } catch (error) {
      console.error('Live data fetch error:', error)
      setConnected(false)
    }
  }, [])

  // Fetch initial data and start polling
  useEffect(() => {
    // Initial fetch
    fetchLiveData()

    // Poll every 3 seconds for real-time updates
    const pollInterval = setInterval(fetchLiveData, 3000)

    return () => {
      clearInterval(pollInterval)
    }
  }, [fetchLiveData])

  // Draw map
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      gradient.addColorStop(0, '#0f172a')
      gradient.addColorStop(1, '#1e293b')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw grid lines
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.1)'
      ctx.lineWidth = 1
      for (let i = 0; i < canvas.width; i += 40) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i, canvas.height)
        ctx.stroke()
      }
      for (let i = 0; i < canvas.height; i += 40) {
        ctx.beginPath()
        ctx.moveTo(0, i)
        ctx.lineTo(canvas.width, i)
        ctx.stroke()
      }

      // Draw India outline (simplified)
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(canvas.width * 0.3, canvas.height * 0.2)
      ctx.lineTo(canvas.width * 0.7, canvas.height * 0.15)
      ctx.lineTo(canvas.width * 0.75, canvas.height * 0.4)
      ctx.lineTo(canvas.width * 0.6, canvas.height * 0.85)
      ctx.lineTo(canvas.width * 0.45, canvas.height * 0.75)
      ctx.lineTo(canvas.width * 0.3, canvas.height * 0.5)
      ctx.closePath()
      ctx.stroke()

      // Draw visitor dots
      visitors.forEach((visitor, index) => {
        const x = ((visitor.location.lng - 68) / 30) * canvas.width
        const y = ((35 - visitor.location.lat) / 25) * canvas.height

        // Pulse animation
        const time = Date.now() / 1000
        const pulse = Math.sin(time * 2 + index) * 0.5 + 0.5

        // Outer glow
        const glowColor = visitor.status === 'checkout' 
          ? 'rgba(34, 197, 94, 0.4)' 
          : visitor.cartItems > 0 
            ? 'rgba(251, 191, 36, 0.4)' 
            : 'rgba(59, 130, 246, 0.4)'
        
        const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, 20 + pulse * 10)
        glowGradient.addColorStop(0, glowColor)
        glowGradient.addColorStop(1, 'transparent')
        ctx.fillStyle = glowGradient
        ctx.beginPath()
        ctx.arc(x, y, 20 + pulse * 10, 0, Math.PI * 2)
        ctx.fill()

        // Inner dot
        ctx.fillStyle = visitor.status === 'checkout' 
          ? '#22c55e' 
          : visitor.cartItems > 0 
            ? '#fbbf24' 
            : '#3b82f6'
        ctx.beginPath()
        ctx.arc(x, y, 6, 0, Math.PI * 2)
        ctx.fill()

        // City label
        ctx.fillStyle = '#fff'
        ctx.font = '10px sans-serif'
        ctx.fillText(visitor.location.city, x + 10, y + 4)
      })

      animationId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [visitors])

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'page_view': return <Eye className="h-4 w-4 text-blue-500" />
      case 'product_view': return <Eye className="h-4 w-4 text-purple-500" />
      case 'add_to_cart': return <ShoppingCart className="h-4 w-4 text-green-500" />
      case 'remove_from_cart': return <ShoppingCart className="h-4 w-4 text-red-500" />
      case 'checkout_start': return <CreditCard className="h-4 w-4 text-purple-500" />
      case 'purchase': return <Package className="h-4 w-4 text-green-600" />
      case 'cart_abandon': return <AlertCircle className="h-4 w-4 text-orange-500" />
      case 'session_start': return <User className="h-4 w-4 text-blue-400" />
      case 'search': return <Search className="h-4 w-4 text-indigo-500" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  const getEventLabel = (type: string) => {
    switch (type) {
      case 'page_view': return 'Viewed page'
      case 'product_view': return 'Viewed product'
      case 'add_to_cart': return 'Added to cart'
      case 'remove_from_cart': return 'Removed from cart'
      case 'checkout_start': return 'Started checkout'
      case 'purchase': return 'Completed purchase'
      case 'cart_abandon': return 'Abandoned cart'
      case 'session_start': return 'Started session'
      case 'search': return 'Searched'
      default: return type.replace(/_/g, ' ')
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'browsing': return 'bg-blue-100 text-blue-700'
      case 'cart': return 'bg-yellow-100 text-yellow-700'
      case 'checkout': return 'bg-green-100 text-green-700'
      case 'purchased': return 'bg-purple-100 text-purple-700'
      case 'abandoned': return 'bg-red-100 text-red-700'
      default: return 'bg-neutral-100 text-neutral-700'
    }
  }

  const formatTimeAgo = (timestamp: string | Date) => {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    return `${Math.floor(seconds / 3600)}h ago`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Globe className="h-6 w-6 text-[#1B198F]" />
              {connected && (
                <>
                  <span className="absolute -right-1 -top-1 h-3 w-3 animate-ping rounded-full bg-green-500" />
                  <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-green-500" />
                </>
              )}
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Live View</h1>
            <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
              connected 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {connected ? 'Connected' : 'Reconnecting...'}
            </span>
          </div>
          <p className="text-neutral-500">Real-time visitor activity on your store</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchLiveData}
            className="flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-[#1B198F] px-4 py-2 text-sm font-medium text-white">
            <Maximize2 className="h-4 w-4" /> Full Screen
          </button>
        </div>
      </div>

      {/* Live Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-4 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Active Visitors</p>
              <p className="mt-1 text-3xl font-bold">{stats.activeVisitors}</p>
            </div>
            <Users className="h-8 w-8 opacity-50" />
          </div>
          <div className="mt-2 flex items-center gap-1 text-sm text-blue-100">
            <span className="h-2 w-2 animate-pulse rounded-full bg-white" /> Live now
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 p-4 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100">Active Carts</p>
              <p className="mt-1 text-3xl font-bold">{stats.activeCarts}</p>
            </div>
            <ShoppingCart className="h-8 w-8 opacity-50" />
          </div>
          <p className="mt-2 text-sm text-yellow-100">
            ₹{stats.activeCartValue.toLocaleString()} value
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-gradient-to-br from-red-500 to-pink-500 p-4 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100">Abandoned Today</p>
              <p className="mt-1 text-3xl font-bold">{stats.abandonedCarts}</p>
            </div>
            <AlertCircle className="h-8 w-8 opacity-50" />
          </div>
          <p className="mt-2 text-sm text-red-100">
            ₹{stats.abandonedValue.toLocaleString()} lost
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 p-4 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Today's Revenue</p>
              <p className="mt-1 text-3xl font-bold">₹{stats.todayRevenue.toLocaleString()}</p>
            </div>
            <IndianRupee className="h-8 w-8 opacity-50" />
          </div>
          <p className="mt-2 text-sm text-green-100">
            {parseFloat(stats.revenueChange) >= 0 ? '+' : ''}{stats.revenueChange}% vs yesterday
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 p-4 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Conversion Rate</p>
              <p className="mt-1 text-3xl font-bold">{stats.conversionRate}%</p>
            </div>
            <TrendingUp className="h-8 w-8 opacity-50" />
          </div>
          <p className="mt-2 text-sm text-purple-100">
            {stats.todayOrders} orders today
          </p>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Map */}
        <div className="rounded-2xl bg-slate-900 p-1 shadow-xl lg:col-span-2">
          <div className="relative overflow-hidden rounded-xl">
            <canvas
              ref={canvasRef}
              width={800}
              height={500}
              className="w-full"
            />
            {/* Legend */}
            <div className="absolute bottom-4 left-4 rounded-lg bg-black/50 p-3 backdrop-blur-sm">
              <p className="mb-2 text-xs font-medium text-white">Visitor Status</p>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-blue-500" />
                  <span className="text-blue-200">Browsing</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-yellow-500" />
                  <span className="text-yellow-200">Has Cart Items</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="text-green-200">In Checkout</span>
                </div>
              </div>
            </div>
            {/* Stats overlay */}
            <div className="absolute right-4 top-4 rounded-lg bg-black/50 p-3 backdrop-blur-sm">
              <p className="text-2xl font-bold text-white">{visitors.length}</p>
              <p className="text-xs text-neutral-400">Active on site</p>
            </div>
            {/* No visitors message */}
            {visitors.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Users className="mx-auto h-12 w-12 text-neutral-500" />
                  <p className="mt-2 text-neutral-400">No active visitors</p>
                  <p className="text-sm text-neutral-500">Visitors will appear here in real-time</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="rounded-2xl bg-white shadow-sm dark:bg-neutral-800">
          <div className="border-b border-neutral-200 p-4 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-neutral-900 dark:text-white">Live Activity</h3>
              <span className="flex items-center gap-1 text-xs text-green-600">
                <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" /> Live
              </span>
            </div>
          </div>
          <div className="max-h-[420px] overflow-y-auto p-4">
            {events.length === 0 ? (
              <div className="py-8 text-center">
                <Activity className="mx-auto h-8 w-8 text-neutral-300" />
                <p className="mt-2 text-sm text-neutral-500">No recent activity</p>
                <p className="text-xs text-neutral-400">Events will appear here in real-time</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence initial={false}>
                  {events.map((event) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-start gap-3 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-900"
                    >
                      <div className="mt-0.5">{getEventIcon(event.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 dark:text-white">
                          {getEventLabel(event.type)}
                        </p>
                        <p className="truncate text-xs text-neutral-500">
                          {event.visitor} • {event.data?.productName || event.data?.page || event.data?.searchQuery || ''}
                        </p>
                        <p className="text-xs text-neutral-400">
                          {formatTimeAgo(event.timestamp)}
                        </p>
                      </div>
                      {event.data?.productPrice && (
                        <p className="text-sm font-semibold text-green-600">
                          ₹{event.data.productPrice}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Visitors Table */}
      <div className="rounded-2xl bg-white shadow-sm dark:bg-neutral-800">
        <div className="border-b border-neutral-200 p-4 dark:border-neutral-700">
          <h3 className="font-semibold text-neutral-900 dark:text-white">
            Active Visitors ({visitors.length})
          </h3>
        </div>
        {visitors.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-neutral-300" />
            <p className="mt-4 text-lg font-medium text-neutral-900 dark:text-white">No active visitors</p>
            <p className="mt-1 text-neutral-500">
              When users visit your store, they'll appear here in real-time
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">Current Page</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">Device</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">Duration</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">Cart</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {visitors.map((visitor) => (
                  <tr
                    key={visitor.id}
                    className="cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900"
                    onClick={() => setSelectedVisitor(visitor)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-neutral-400" />
                        <span className="font-medium">{visitor.location.city}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm text-neutral-500">
                        {visitor.currentPage}
                        <ExternalLink className="h-3 w-3" />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-neutral-100 px-2 py-1 text-xs capitalize dark:bg-neutral-700">
                        {visitor.device}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm">
                        <Timer className="h-4 w-4 text-neutral-400" />
                        {formatDuration(visitor.duration)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {visitor.cartItems > 0 ? (
                        <div className="text-sm">
                          <span className="font-medium">{visitor.cartItems} items</span>
                          <span className="text-neutral-500"> • ₹{visitor.cartValue.toLocaleString()}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-neutral-400">Empty</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${getStatusColor(visitor.status)}`}>
                        {visitor.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
