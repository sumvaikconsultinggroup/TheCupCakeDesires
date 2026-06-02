'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import {
    Users, ArrowLeft, RefreshCw, ShoppingCart,
    Clock, Eye, TrendingUp, Activity, MapPin,
    Monitor, ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface ActiveSession {
    sessionId: string
    userId?: string
    userName?: string
    email?: string
    currentPage: string
    cartValue: number
    cartItemsCount: number
    lastActivityAt: string
    timeOnSite: number
}

export default function LiveActivityPage() {
    const [sessions, setSessions] = useState<ActiveSession[]>([])
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [autoRefresh, setAutoRefresh] = useState(true)

    const fetchData = async () => {
        try {
            const res = await fetch('/api/admin/analytics/active-sessions')
            const result = await res.json()

            if (result.success) {
                setSessions(result.data.sessions)
                setStats(result.data)
            } else {
                toast.error('Failed to load live activity')
            }
            setLoading(false)
        } catch (error) {
            console.error('Error fetching live activity:', error)
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()

        if (autoRefresh) {
            const interval = setInterval(fetchData, 15000) // Refresh every 15 seconds
            return () => clearInterval(interval)
        }
    }, [autoRefresh])

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
        }).format(value)
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-neutral-200 border-t-[#2e1f15]" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-emerald-50/30 p-6">
            {/* Header */}
            <div className="mb-6">
                <Link
                    href="/admin"
                    className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 mb-4"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-neutral-900">Live Activity</h1>
                            <div className="flex items-center gap-2 rounded-full bg-green-100 px-3 py-1">
                                <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                                <span className="text-sm font-semibold text-green-700">Live</span>
                            </div>
                        </div>
                        <p className="text-neutral-500">Real-time user activity monitoring</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-sm font-medium">
                            <input
                                type="checkbox"
                                checked={autoRefresh}
                                onChange={(e) => setAutoRefresh(e.target.checked)}
                                className="rounded"
                            />
                            Auto-refresh (15s)
                        </label>
                        <button
                            onClick={fetchData}
                            className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 font-medium shadow-sm transition-all hover:border-neutral-300"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Refresh Now
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="mb-6 grid gap-4 md:grid-cols-4">
                <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                            <Users className="h-6 w-6" />
                        </div>
                        <Activity className="h-5 w-5 opacity-70" />
                    </div>
                    <p className="mt-4 text-sm font-medium text-white/80">Active Users</p>
                    <p className="mt-1 text-3xl font-bold">{stats?.activeUsersCount || 0}</p>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-neutral-200/50">
                    <div className="flex items-center justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                            <ShoppingCart className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                    <p className="mt-4 text-sm font-medium text-neutral-500">Active Carts</p>
                    <p className="mt-1 text-3xl font-bold text-neutral-900">{stats?.activeCartsCount || 0}</p>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-neutral-200/50">
                    <div className="flex items-center justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                            <TrendingUp className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                    <p className="mt-4 text-sm font-medium text-neutral-500">Total Cart Value</p>
                    <p className="mt-1 text-3xl font-bold text-neutral-900">
                        {formatCurrency(stats?.totalCartValue || 0)}
                    </p>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-neutral-200/50">
                    <div className="flex items-center justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
                            <Monitor className="h-6 w-6 text-purple-600" />
                        </div>
                    </div>
                    <p className="mt-4 text-sm font-medium text-neutral-500">Most Viewed</p>
                    <p className="mt-1 text-sm font-semibold text-neutral-900 truncate">
                        {stats?.pageViews && Object.keys(stats.pageViews).length > 0
                            ? Object.entries(stats.pageViews).sort(([, a]: any, [, b]: any) => b - a)[0][0]
                            : 'N/A'}
                    </p>
                </div>
            </div>

            {/* Active Sessions */}
            <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-neutral-200/50">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-neutral-900">Active Sessions</h2>
                        <p className="text-sm text-neutral-500">Users currently browsing your store</p>
                    </div>
                    <p className="text-sm text-neutral-500">
                        Last updated: {new Date().toLocaleTimeString()}
                    </p>
                </div>

                {sessions.length === 0 ? (
                    <div className="py-12 text-center">
                        <Users className="mx-auto h-12 w-12 text-neutral-300" />
                        <p className="mt-4 text-neutral-500">No active users right now</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {sessions.map((session, index) => (
                            <motion.div
                                key={session.sessionId}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 p-4 hover:bg-neutral-100"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600">
                                        <Users className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-neutral-900">
                                            {session.userName || session.email || `Guest ${session.sessionId.substring(0, 8)}`}
                                        </p>
                                        <div className="flex items-center gap-3 text-sm text-neutral-500">
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {formatTime(session.timeOnSite)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Eye className="h-3 w-3" />
                                                {session.currentPage}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    {session.cartItemsCount > 0 && (
                                        <div className="rounded-lg bg-blue-100 px-3 py-1.5">
                                            <div className="flex items-center gap-2">
                                                <ShoppingCart className="h-4 w-4 text-blue-700" />
                                                <span className="text-sm font-semibold text-blue-700">
                                                    {session.cartItemsCount} items • {formatCurrency(session.cartValue)}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    <span className="text-xs text-neutral-400">
                                        {formatDistanceToNow(new Date(session.lastActivityAt), { addSuffix: true })}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Page Views */}
            {stats?.pageViews && Object.keys(stats.pageViews).length > 0 && (
                <div className="mt-6 rounded-2xl bg-white p-6 shadow-lg ring-1 ring-neutral-200/50">
                    <h2 className="mb-4 text-xl font-bold text-neutral-900">Popular Pages</h2>
                    <div className="space-y-2">
                        {Object.entries(stats.pageViews)
                            .sort(([, a]: any, [, b]: any) => b - a)
                            .slice(0, 10)
                            .map(([page, count]: any) => (
                                <div key={page} className="flex items-center justify-between">
                                    <span className="text-sm text-neutral-700">{page}</span>
                                    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
                                        {count} {count === 1 ? 'view' : 'views'}
                                    </span>
                                </div>
                            ))}
                    </div>
                </div>
            )}
        </div>
    )
}
