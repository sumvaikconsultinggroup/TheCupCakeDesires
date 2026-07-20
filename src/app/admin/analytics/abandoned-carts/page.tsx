'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import {
    ShoppingCart, ArrowLeft, RefreshCw, Download, Filter,
    Mail, CheckCircle, XCircle, Eye, AlertCircle, TrendingUp,
    Calendar, DollarSign, Package, User
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import toast from 'react-hot-toast'

interface AbandonedCartItem {
    productId: string
    productName: string
    imageUrl?: string
    price: number
    quantity: number
    variant?: {
        id: string
        name: string
        option1Value?: string
        option2Value?: string
    }
}

interface AbandonedCart {
    _id: string
    userId?: string
    guestId?: string
    email?: string
    userName?: string
    cartItems: AbandonedCartItem[]
    totalValue: number
    status: 'abandoned' | 'recovered' | 'expired'
    abandonedAt: string
    lastUpdatedAt: string
    recoveryEmailSent: boolean
}

export default function AbandonedCartsPage() {
    const [carts, setCarts] = useState<AbandonedCart[]>([])
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [statusFilter, setStatusFilter] = useState('abandoned')
    const [expandedCart, setExpandedCart] = useState<string | null>(null)

    const fetchCarts = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true)
        else setLoading(true)

        try {
            const res = await fetch(`/api/admin/analytics/abandoned-carts?status=${statusFilter}&limit=100`)
            const result = await res.json()

            if (result.success) {
                setCarts(result.data.carts)
                setStats(result.data.stats)
            } else {
                toast.error('Failed to load abandoned carts')
            }
        } catch (error) {
            console.error('Error fetching abandoned carts:', error)
            toast.error('Failed to load data')
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        fetchCarts()
    }, [statusFilter])

    const handleMarkAsRecovered = async (cartId: string) => {
        try {
            const res = await fetch('/api/admin/analytics/abandoned-carts', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cartId, status: 'recovered' }),
            })

            if (res.ok) {
                toast.success('Cart marked as recovered')
                fetchCarts(true)
            } else {
                toast.error('Failed to update cart')
            }
        } catch (error) {
            console.error('Error updating cart:', error)
            toast.error('Failed to update cart')
        }
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-AU', {
            style: 'currency',
            currency: 'AUD',
            minimumFractionDigits: 0,
        }).format(value)
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-neutral-200 border-t-[#2e1f15]" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-amber-50/30 p-6">
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
                        <h1 className="text-3xl font-bold text-neutral-900">Abandoned Carts</h1>
                        <p className="text-neutral-500">Track and recover abandoned shopping carts</p>
                    </div>
                    <button
                        onClick={() => fetchCarts(true)}
                        disabled={refreshing}
                        className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 font-medium shadow-sm transition-all hover:border-neutral-300"
                    >
                        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="mb-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-neutral-200/50">
                    <div className="flex items-center justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
                            <ShoppingCart className="h-6 w-6 text-amber-600" />
                        </div>
                    </div>
                    <p className="mt-4 text-sm font-medium text-neutral-500">
                        {statusFilter === 'all'
                            ? 'All Carts'
                            : statusFilter === 'recovered'
                                ? 'Total Recovered'
                                : 'Total Abandoned'}
                    </p>
                    <p className="mt-1 text-3xl font-bold text-neutral-900">{stats?.count || 0}</p>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-neutral-200/50">
                    <div className="flex items-center justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                            <DollarSign className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                    <p className="mt-4 text-sm font-medium text-neutral-500">Total Value</p>
                    <p className="mt-1 text-3xl font-bold text-neutral-900">
                        {formatCurrency(stats?.totalValue || 0)}
                    </p>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-neutral-200/50">
                    <div className="flex items-center justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                            <TrendingUp className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                    <p className="mt-4 text-sm font-medium text-neutral-500">Average Value</p>
                    <p className="mt-1 text-3xl font-bold text-neutral-900">
                        {formatCurrency(stats?.averageValue || 0)}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="mb-4 flex gap-2">
                {['abandoned', 'recovered', 'all'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${statusFilter === status
                                ? 'bg-[#2e1f15] text-white'
                                : 'bg-white text-neutral-700 hover:bg-neutral-100'
                            }`}
                    >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                ))}
            </div>

            {/* Carts List */}
            <div className="space-y-4">
                {carts.length === 0 ? (
                    <div className="rounded-2xl bg-white p-12 text-center shadow-lg">
                        <ShoppingCart className="mx-auto h-12 w-12 text-neutral-300" />
                        <p className="mt-4 text-neutral-500">No abandoned carts found</p>
                    </div>
                ) : (
                    carts.map((cart) => (
                        <motion.div
                            key={cart._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-neutral-200/50"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                        <User className="h-5 w-5 text-neutral-400" />
                                        <div>
                                            <p className="font-semibold text-neutral-900">
                                                {cart.userName || cart.email || 'Guest User'}
                                            </p>
                                            {cart.email && (
                                                <p className="text-sm text-neutral-500">{cart.email}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-4 grid gap-4 md:grid-cols-4">
                                        <div>
                                            <p className="text-xs font-medium text-neutral-500">Cart Value</p>
                                            <p className="mt-1 text-lg font-bold text-neutral-900">
                                                {formatCurrency(cart.totalValue)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-neutral-500">Items</p>
                                            <p className="mt-1 text-lg font-bold text-neutral-900">
                                                {cart.cartItems.length}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-neutral-500">Abandoned</p>
                                            <p className="mt-1 text-sm text-neutral-700">
                                                {format(new Date(cart.abandonedAt), 'MMM dd, yyyy HH:mm')}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-neutral-500">Status</p>
                                            <span
                                                className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-semibold ${cart.status === 'recovered'
                                                        ? 'bg-green-100 text-green-700'
                                                        : cart.status === 'expired'
                                                            ? 'bg-neutral-100 text-neutral-700'
                                                            : 'bg-amber-100 text-amber-700'
                                                    }`}
                                            >
                                                {cart.status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Expanded Items */}
                                    {expandedCart === cart._id && (
                                        <div className="mt-4 space-y-2 border-t border-neutral-200 pt-4">
                                            {cart.cartItems.map((item, idx) => (
                                                <div key={idx} className="flex items-center gap-3 rounded-lg bg-neutral-50 p-3">
                                                    {item.imageUrl && (
                                                        <Image
                                                            src={item.imageUrl}
                                                            alt={item.productName}
                                                            width={48}
                                                            height={48}
                                                            className="rounded-md object-cover"
                                                        />
                                                    )}
                                                    <div className="flex-1">
                                                        <p className="font-medium text-neutral-900">{item.productName}</p>
                                                        {item.variant && (
                                                            <p className="text-xs text-neutral-500">
                                                                {item.variant.option1Value} {item.variant.option2Value}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <p className="text-sm font-semibold text-neutral-900">
                                                        {item.quantity} × {formatCurrency(item.price)}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setExpandedCart(expandedCart === cart._id ? null : cart._id)}
                                        className="rounded-lg border border-neutral-200 p-2 hover:bg-neutral-50"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </button>
                                    {cart.status === 'abandoned' && (
                                        <button
                                            onClick={() => handleMarkAsRecovered(cart._id)}
                                            className="rounded-lg bg-green-100 p-2 text-green-700 hover:bg-green-200"
                                        >
                                            <CheckCircle className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    )
}
