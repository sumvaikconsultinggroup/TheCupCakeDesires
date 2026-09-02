'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { parseCupcakeContents } from '@/lib/cupcake-builder-images'
import CorporateLogoStrip from '@/components/order/CorporateLogoStrip'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Clock,
  Copy,
  CreditCard,
  Edit,
  ExternalLink,
  Globe,
  History,
  Loader2,
  Mail,
  Package,
  Phone,
  Plus,
  Printer,
  RefreshCw,
  RotateCcw,
  Send,
  Shield,
  Smartphone,
  StickyNote,
  Tag,
  Timer,
  Truck,
  Users,
  X,
  XCircle,
} from 'lucide-react'
import Link from 'next/link'
import { use, useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  SHIPPING_STATE,
  SHIPPING_STATES,
  normalizeShippingState,
} from '@/utils/deliveryArea'
import {
  cancelOrderAction,
  generateInvoiceAction,
  getOrderAction,
  markAsConfirmedAction,
  processRefundAction,
  sendOrderEmailAction,
  updateOrderAction,
} from '../order-actions'

type TabType = 'timeline' | 'payments' | 'fulfillment' | 'notes'

interface TimelineEvent {
  _id?: string
  eventType?: string // Renamed from 'type' to match schema
  type?: string // Keep for backward compatibility
  title: string
  description?: string
  user?: string
  metadata?: Record<string, unknown>
  createdAt: string
  timestamp?: string | Date // Support both createdAt and timestamp
}

interface OrderNote {
  _id?: string
  content: string
  author: string
  isInternal: boolean
  createdAt: string
}

interface OrderData {
  id: string
  orderId: string
  status: string
  createdAt: string
  updatedAt: string
  customer: {
    firstName?: string
    lastName?: string
    name?: string
    email?: string
    phone?: string
    totalOrders?: number
    totalSpent?: number
  }
  shippingAddress: {
    address?: string
    address1?: string
    street?: string
    city?: string
    state?: string
    zipcode?: string
    postalCode?: string
    country?: string
  }
  deliveryAddress?: {
    address?: string
    address1?: string
    street?: string
    city?: string
    state?: string
    zipcode?: string
    postalCode?: string
    country?: string
    phone?: string
    firstName?: string
    lastName?: string
    email?: string
    name?: string
  }
  billingAddress?: {
    address?: string
    address1?: string
    city?: string
    state?: string
    zipcode?: string
    country?: string
  }
  items: {
    productId?: string
    name: string
    quantity: number
    price: number
    sku?: string
    variant?: {
      option1Value?: string
      option2Value?: string
    }
    variants?: {
      name: string
      option: string
    }[]
    imageUrl?: string
    /** Corporate logo artwork uploaded by the customer for this line. */
    logoUrls?: string[]
    logoUrl?: string
  }[]
  subtotal?: number
  discount?: number
  discountCode?: string
  shipping?: number
  taxes?: number
  totalAmount: number
  paymentMethod?: string
  paymentDetails?: {
    paymentMethod?: string
    transactionId?: string
    status?: string
    paymentStatus?: string // Payment status: 'pending', 'paid', 'failed', 'refunded'
    paidAt?: string
    gateway?: string
    refundId?: string
    refundedAt?: string
    refundAmount?: number
  }
  fulfillment?: {
    status?: string
    shipmentId?: string
    carrier?: string
    trackingNumber?: string
    trackingUrl?: string
    shippedAt?: string
    deliveredAt?: string
    estimatedDelivery?: string
  }
  // Self-delivery scheduling (Narre Warren bake board).
  deliveryDate?: string
  deliverySlot?: string
  deliveryNote?: string
  timeline?: TimelineEvent[]
  notes?: OrderNote[]
  tags?: string[]
  assignedTo?: string
  slaDeadline?: string
  riskScore?: string
  riskReasons?: string[]
  invoiceNumber?: string
  invoiceGeneratedAt?: string
  source?: string
  shipment?: {
    id: string
    shipmentId: string
    status: string
    awbNumber?: string
    courierName?: string
    trackingUrl?: string
    estimatedDeliveryDate?: string
    statusHistory?: { status: string; timestamp: string; description?: string }[]
    deliveryAddress?: {
      name?: string
      phone?: string
      email?: string
      address?: string
      address2?: string
      city?: string
      state?: string
      pincode?: string
      zipcode?: string
      country?: string
    }
  }
  statusLogs?: {
    status: string
    timestamp: string
    message?: string
  }[]
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('timeline')
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showReassignModal, setShowReassignModal] = useState(false)
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [showTagModal, setShowTagModal] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [newAssignee, setNewAssignee] = useState('')
  const [newTag, setNewTag] = useState('')
  const [emailType, setEmailType] = useState<'payment_pending' | 'invoice' | 'shipping_update' | 'delivery_confirmation' | 'custom'>(
    'shipping_update'
  )
  const [customEmailSubject, setCustomEmailSubject] = useState('')
  const [customEmailMessage, setCustomEmailMessage] = useState('')
  const [editAddress, setEditAddress] = useState({
    address: '',
    address1: '',
    city: '',
    state: '',
    zipcode: '',
    country: 'India',
  })

  const [order, setOrder] = useState<OrderData | null>(null)

  // Fetch order data using server action
  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true)
      const result = await getOrderAction(resolvedParams.id)
      if (result.success && result.order) {
        setOrder(result.order as unknown as any as OrderData)
      } else {
        toast.error(result.error || 'Order not found')
      }
    } catch (error) {
      console.error('Error fetching order:', error)
      toast.error('Failed to load order')
    } finally {
      setLoading(false)
    }
  }, [resolvedParams.id])

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

  // Update order status
  const handleStatusUpdate = async (newStatus: string) => {
    try {
      setActionLoading('status')
      const result = await updateOrderAction(order?.orderId || resolvedParams.id, 'update_status', {
        status: newStatus,
        user: 'Admin',
      })
      if (result.success) {
        toast.success(`Order status updated to ${newStatus}`)
        await fetchOrder()
      } else {
        toast.error(result.error || 'Failed to update status')
      }
    } catch (error) {
      toast.error('Failed to update status')
    } finally {
      setActionLoading(null)
    }
  }

  // Add note
  const handleAddNote = async () => {
    if (!newNote.trim()) return
    try {
      setActionLoading('note')
      const result = await updateOrderAction(order?.orderId || resolvedParams.id, 'add_note', {
        content: newNote,
        author: 'Admin',
        isInternal: true,
      })
      if (result.success) {
        toast.success('Note added successfully')
        setNewNote('')
        setShowNoteModal(false)
        await fetchOrder()
      } else {
        toast.error(result.error || 'Failed to add note')
      }
    } catch (error) {
      toast.error('Failed to add note')
    } finally {
      setActionLoading(null)
    }
  }

  // Accept the order into the kitchen
  const handleConfirmOrder = async () => {
    if (!confirm('Accept this order into the kitchen?')) return

    try {
      setActionLoading('confirm')
      const result = await markAsConfirmedAction(order?.orderId || resolvedParams.id)
      if (result.success) {
        toast.success(result.message || 'Order moved to the kitchen')
        await fetchOrder()
      } else {
        toast.error(result.error || 'Failed to accept order')
      }
    } catch (error) {
      toast.error('Failed to accept order')
    } finally {
      setActionLoading(null)
    }
  }

  // Mark order as out for delivery
  const handleMarkOutForDelivery = async () => {
    const note = window.prompt(
      'Optional driver / delivery note (e.g. "Sam is driving, ETA 2-4 PM"). Leave blank to skip.'
    )
    if (note === null) return
    try {
      setActionLoading('out_for_delivery')
      const { markAsOutForDeliveryAction } = await import('../order-actions')
      const result = await markAsOutForDeliveryAction(order?.orderId || resolvedParams.id, {
        deliveryNote: note || undefined,
      })
      if (result.success) {
        toast.success(result.message || 'Order marked as out for delivery')
        await fetchOrder()
      } else {
        toast.error(result.error || 'Failed to mark order as out for delivery')
      }
    } catch {
      toast.error('Failed to mark order as out for delivery')
    } finally {
      setActionLoading(null)
    }
  }

  // Mark order as delivered
  const handleMarkDelivered = async () => {
    if (!confirm('Confirm this order has been handed over to the customer?')) return
    try {
      setActionLoading('delivered')
      const { markAsDeliveredAction } = await import('../order-actions')
      const result = await markAsDeliveredAction(order?.orderId || resolvedParams.id)
      if (result.success) {
        toast.success(result.message || 'Order marked as delivered')
        await fetchOrder()
      } else {
        toast.error(result.error || 'Failed to mark order as delivered')
      }
    } catch {
      toast.error('Failed to mark order as delivered')
    } finally {
      setActionLoading(null)
    }
  }

  // Cancel order
  const handleCancelOrder = async () => {
    if (!confirm('Are you sure you want to cancel this order?'))
      return

    try {
      setActionLoading('cancel')
      const result = await cancelOrderAction(order?.orderId || resolvedParams.id)
      if (result.success) {
        toast.success(result.message || 'Order cancelled successfully')
        await fetchOrder()
      } else {
        toast.error(result.error || 'Failed to cancel order')
      }
    } catch (error) {
      toast.error('Failed to cancel order')
    } finally {
      setActionLoading(null)
    }
  }

  // Process refund
  const handleRefund = async () => {
    try {
      setActionLoading('refund')
      const amount = refundAmount ? parseFloat(refundAmount) : order?.totalAmount || 0
      const result = await processRefundAction(order?.orderId || resolvedParams.id, amount, refundReason)
      if (result.success) {
        toast.success('Refund processed successfully')
        setShowRefundModal(false)
        setRefundAmount('')
        setRefundReason('')
        await fetchOrder()
      } else {
        toast.error(result.error || 'Failed to process refund')
      }
    } catch (error) {
      toast.error('Failed to process refund')
    } finally {
      setActionLoading(null)
    }
  }

  // Reassign order
  const handleReassign = async () => {
    if (!newAssignee.trim()) return
    try {
      setActionLoading('assign')
      const result = await updateOrderAction(order?.orderId || resolvedParams.id, 'assign', {
        assignedTo: newAssignee,
        user: 'Admin',
      })
      if (result.success) {
        toast.success('Order reassigned successfully')
        setShowReassignModal(false)
        setNewAssignee('')
        await fetchOrder()
      } else {
        toast.error(result.error || 'Failed to reassign order')
      }
    } catch (error) {
      toast.error('Failed to reassign order')
    } finally {
      setActionLoading(null)
    }
  }

  // Add tag
  const handleAddTag = async () => {
    if (!newTag.trim()) return
    try {
      setActionLoading('tag')
      const result = await updateOrderAction(order?.orderId || resolvedParams.id, 'add_tag', {
        tag: newTag.toLowerCase().replace(/\s+/g, '-'),
      })
      if (result.success) {
        toast.success('Tag added successfully')
        setNewTag('')
        setShowTagModal(false)
        await fetchOrder()
      } else {
        toast.error(result.error || 'Failed to add tag')
      }
    } catch (error) {
      toast.error('Failed to add tag')
    } finally {
      setActionLoading(null)
    }
  }

  // Remove tag
  const handleRemoveTag = async (tag: string) => {
    try {
      const result = await updateOrderAction(order?.orderId || resolvedParams.id, 'remove_tag', { tag })
      if (result.success) {
        toast.success('Tag removed')
        await fetchOrder()
      }
    } catch (error) {
      toast.error('Failed to remove tag')
    }
  }

  // Update shipping address
  const handleUpdateAddress = async () => {
    try {
      setActionLoading('address')
      const result = await updateOrderAction(order?.orderId || resolvedParams.id, 'update_shipping_address', {
        shippingAddress: editAddress,
        user: 'Admin',
      })
      if (result.success) {
        toast.success('Address updated successfully')
        setShowAddressModal(false)
        await fetchOrder()
      } else {
        toast.error(result.error || 'Failed to update address')
      }
    } catch (error) {
      toast.error('Failed to update address')
    } finally {
      setActionLoading(null)
    }
  }

  // Generate and print invoice
  const handlePrintInvoice = async () => {
    try {
      setActionLoading('print')
      const result = await generateInvoiceAction(order?.orderId || resolvedParams.id)

      if (result.success && result.invoice) {
        // Open print window with invoice
        const printWindow = window.open('', '_blank')
        if (printWindow) {
          printWindow.document.write(generateInvoiceHTML(result.invoice))
          printWindow.document.close()
          printWindow.print()
        }
        toast.success('Invoice opened for printing')
        await fetchOrder()
      } else {
        toast.error(result.error || 'Failed to generate invoice')
      }
    } catch (error) {
      toast.error('Failed to generate invoice')
    } finally {
      setActionLoading(null)
    }
  }

  // Send invoice email
  const handleSendInvoice = async () => {
    try {
      setActionLoading('email')
      const result = await sendOrderEmailAction(order?.orderId || resolvedParams.id, 'invoice')
      if (result.success) {
        toast.success('Invoice sent to customer')
        await fetchOrder()
      } else {
        toast.error(result.error || 'Failed to send invoice')
      }
    } catch (error) {
      toast.error('Failed to send invoice')
    } finally {
      setActionLoading(null)
    }
  }

  // Send email
  const handleSendEmail = async () => {
    try {
      setActionLoading('email')
      const result = await sendOrderEmailAction(
        order?.orderId || resolvedParams.id,
        emailType,
        emailType === 'custom' ? customEmailMessage : undefined
      )
      if (result.success) {
        toast.success('Email sent successfully')
        setShowEmailModal(false)
        setCustomEmailSubject('')
        setCustomEmailMessage('')
        await fetchOrder()
      } else {
        toast.error(result.error || 'Failed to send email')
      }
    } catch (error) {
      toast.error('Failed to send email')
    } finally {
      setActionLoading(null)
    }
  }

  // Send WhatsApp (opens WhatsApp web)
  const handleSendWhatsApp = () => {
    if (!order?.customer?.phone) {
      toast.error('Customer phone number not available')
      return
    }
    const phone = order.customer.phone.replace(/\D/g, '')
    const message = encodeURIComponent(
      `Hi ${order.customer.name || order.customer.firstName || 'there'}! This is regarding your order ${order.orderId} from The Cupcake Desire. How can we help you today?`
    )
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank')
    toast.success('WhatsApp opened')
  }

  // Copy to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  // Generate invoice HTML for printing
  const generateInvoiceHTML = (invoice: Record<string, unknown>) => {
    const inv = invoice as {
      invoiceNumber?: string
      date?: string
      company?: {
        name?: string
        address?: string
        city?: string
        state?: string
        pincode?: string
        gstin?: string
        phone?: string
        email?: string
      }
      customer?: {
        name?: string
        email?: string
        phone?: string
        address?: {
          address?: string
          address1?: string
          city?: string
          state?: string
          zipcode?: string
        }
      }
      items?: { name: string; quantity: number; price: number; total: number; variants?: { name: string; option: string }[] }[]
      subtotal?: number
      discount?: number
      shipping?: number
      taxes?: number
      total?: number
      payment?: { method?: string; status?: string; transactionId?: string }
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${inv.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
          .company { font-weight: bold; font-size: 24px; color: #2e1f15; }
          .invoice-title { font-size: 32px; color: #333; }
          .invoice-meta { color: #666; margin-top: 10px; }
          .addresses { display: flex; justify-content: space-between; margin-bottom: 40px; }
          .address { width: 45%; }
          .address h3 { color: #2e1f15; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background: #f5f5f5; padding: 12px; text-align: left; border-bottom: 2px solid #ddd; }
          td { padding: 12px; border-bottom: 1px solid #eee; }
          .totals { text-align: right; }
          .totals .row { display: flex; justify-content: flex-end; gap: 100px; margin: 5px 0; }
          .totals .total { font-size: 20px; font-weight: bold; color: #2e1f15; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="company">${inv.company?.name || 'The Cupcake Desire'}</div>
            <div class="invoice-meta">
              ${inv.company?.address || ''}<br>
              ${inv.company?.city || ''}, ${inv.company?.state || ''} ${inv.company?.pincode || ''}<br>
              GSTIN: ${inv.company?.gstin || 'N/A'}<br>
              ${inv.company?.phone || ''} | ${inv.company?.email || ''}
            </div>
          </div>
          <div style="text-align: right;">
            <div class="invoice-title">INVOICE</div>
            <div class="invoice-meta">
              Invoice #: ${inv.invoiceNumber || 'N/A'}<br>
              Date: ${inv.date ? new Date(inv.date).toLocaleDateString('en-AU', { timeZone: 'Australia/Melbourne' }) : 'N/A'}<br>
              Order: ${order?.orderId || 'N/A'}
            </div>
          </div>
        </div>
        
        <div class="addresses">
          <div class="address">
            <h3>Bill To</h3>
            ${inv.customer?.name || 'Customer'}<br>
            ${inv.customer?.email || ''}<br>
            ${inv.customer?.phone || ''}<br>
            ${inv.customer?.address?.address || ''} ${inv.customer?.address?.address1 || ''}<br>
            ${inv.customer?.address?.city || ''}, ${inv.customer?.address?.state || ''} ${inv.customer?.address?.zipcode || ''}
          </div>
          <div class="address">
            <h3>Ship To</h3>
            ${order?.customer?.name || order?.customer?.firstName || 'Customer'}<br>
            ${order?.shippingAddress?.address || order?.shippingAddress?.address1 || ''}<br>
            ${order?.shippingAddress?.city || ''}, ${order?.shippingAddress?.state || ''} ${order?.shippingAddress?.zipcode || ''}
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${(inv.items || [])
        .map(
          (item: { name: string; quantity: number; price: number; total: number }) => `
              <tr>
                <td>
                  <div style="font-weight: bold;">${item.name}</div>
                  ${(item as any).variants && (item as any).variants.length > 0
              ? `<div style="font-size: 11px; color: #666; margin-top: 4px;">
                        ${(item as any).variants
                .filter((v: any) => v.name === 'Option 1')
                .map((v: any) => `Flavor: ${v.option}`)
                .join('')}
                       </div>`
              : ''
            }             </td>
                <td>${item.quantity}</td>
                <td>$${item.price?.toLocaleString()}</td>
                <td>$${item.total?.toLocaleString()}</td>
              </tr>
            `
        )
        .join('')}
          </tbody>
        </table>
        
        <div class="totals">
          <div class="row"><span>Subtotal:</span><span>$${inv.subtotal?.toLocaleString() || 0}</span></div>
          ${inv.discount ? `<div class="row"><span>Discount:</span><span>-$${inv.discount?.toLocaleString()}</span></div>` : ''}
          <div class="row"><span>Shipping:</span><span>${inv.shipping === 0 ? 'Free' : `$${inv.shipping?.toLocaleString()}`}</span></div>
          ${Number(inv.taxes || 0) > 0 ? `<div class="row"><span>Taxes:</span><span>$${Number(inv.taxes).toLocaleString()}</span></div>` : ''}
          <div class="row total"><span>Total:</span><span>$${inv.total?.toLocaleString() || 0}</span></div>
        </div>
        
        <div class="footer">
          Payment Method: ${inv.payment?.method?.toUpperCase() || 'N/A'} | 
          Status: ${inv.payment?.status?.toUpperCase() || 'N/A'}
          ${inv.payment?.transactionId ? ` | Transaction ID: ${inv.payment.transactionId}` : ''}
          <br><br>
          Thank you for your business!
        </div>
      </body>
      </html>
    `
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_payment':
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'paid':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'in_kitchen':
        return 'bg-cream-deep text-cocoa border-line'
      case 'out_for_delivery':
        return 'bg-rose-deep text-cocoa border-line'
      case 'delivered':
        return 'bg-mint text-mint-accent border-line'
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'refunded':
        return 'bg-orange-100 text-orange-700 border-orange-200'
      default:
        return 'bg-cream text-cocoa-soft border-line'
    }
  }

  const getPaymentStatusColor = (status?: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700'
      case 'pending':
        return 'bg-yellow-100 text-yellow-700'
      case 'failed':
        return 'bg-red-100 text-red-700'
      case 'refunded':
        return 'bg-orange-100 text-orange-700'
      default:
        return 'bg-neutral-100 text-neutral-700'
    }
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'created':
        return <Package className="h-4 w-4" />
      case 'payment':
        return <CreditCard className="h-4 w-4" />
      case 'fulfillment':
        return <Package className="h-4 w-4" />
      case 'shipping':
        return <Truck className="h-4 w-4" />
      case 'delivery':
        return <CheckCircle className="h-4 w-4" />
      case 'refund':
        return <RotateCcw className="h-4 w-4" />
      case 'note':
        return <StickyNote className="h-4 w-4" />
      case 'email':
        return <Mail className="h-4 w-4" />
      case 'sms':
        return <Smartphone className="h-4 w-4" />
      case 'status':
        return <RefreshCw className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getRiskColor = (score?: string) => {
    switch (score) {
      case 'low':
        return 'bg-green-100 text-green-700'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700'
      case 'high':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-neutral-100 text-neutral-700'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-cocoa" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="py-20 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-neutral-300" />
        <h3 className="mt-4 text-lg font-medium">Order not found</h3>
        <p className="mt-2 text-neutral-500">The order you're looking for doesn't exist.</p>
        <Link href="/admin/orders" className="mt-4 inline-flex items-center gap-2 text-cocoa hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Orders
        </Link>
      </div>
    )
  }

  const timeline = order.timeline || []
  // Get customer name from deliveryAddress.firstName, prioritizing it
  const deliveryAddr = order.deliveryAddress || order.shipment?.deliveryAddress
  const addr = deliveryAddr as any
  const deliveryFirstName = addr?.firstName
  const customerName =
    deliveryFirstName ||
    order.customer?.name || 
    `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.trim() || 
    addr?.name ||
    'Guest'

  // Combine timeline and statusLogs
  // Map timeline events to ensure eventType and createdAt are set correctly
  const mappedTimeline = timeline.map((event: any) => ({
    ...event,
    eventType: event.eventType || event.type || 'status',
    createdAt: event.createdAt || event.timestamp || new Date().toISOString(),
  }))

  const combinedTimeline: TimelineEvent[] = [
    ...mappedTimeline,
    ...(order.statusLogs || []).map((log) => ({
      eventType: 'status',
      type: 'status', // Keep for backward compatibility
      title: log.status.charAt(0).toUpperCase() + log.status.slice(1),
      description: log.message,
      createdAt: log.timestamp,
    })),
  ].sort((a, b) => {
    const dateA = new Date(a.createdAt || a.timestamp || 0).getTime()
    const dateB = new Date(b.createdAt || b.timestamp || 0).getTime()
    return dateA - dateB
  })

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/orders"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-cream text-cocoa hover:bg-ivory"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <p className="text-xs font-medium tracking-[0.18em] text-taupe uppercase">
              Order detail
            </p>
            <div className="flex items-center gap-3">
              <h1 className="font-bake-display text-3xl text-cocoa">{order.orderId}</h1>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${getStatusColor(order.status)}`}
              >
                {order.status.replace(/_/g, ' ')}
              </span>
              {order.riskScore === 'high' && (
                <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                  <AlertCircle className="h-3 w-3" /> High Risk
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-taupe">
              Placed {new Date(order.createdAt).toLocaleString('en-AU', { timeZone: 'Australia/Melbourne' })}
              {order.assignedTo && ` • Assigned to ${order.assignedTo}`}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handlePrintInvoice}
            disabled={!!actionLoading}
            className="flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700"
          >
            {actionLoading === 'print' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
            Print Invoice
          </button>
          <button
            onClick={handleSendInvoice}
            disabled={!!actionLoading}
            className="flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700"
          >
            {actionLoading === '/email' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send Invoice
          </button>
          {/* Self-delivery lifecycle actions: paid → in_kitchen → out_for_delivery → delivered */}
          {order.paymentDetails?.paymentStatus === 'paid' && order.status === 'paid' && (
            <button
              onClick={handleConfirmOrder}
              disabled={actionLoading === 'confirm'}
              className="flex items-center gap-2 rounded-xl bg-cocoa px-4 py-2 text-sm font-medium text-ivory transition-colors hover:bg-cocoa-soft disabled:opacity-50"
            >
              {actionLoading === 'confirm' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Accept into kitchen
                </>
              )}
            </button>
          )}
          {order.status === 'in_kitchen' && (
            <button
              onClick={handleMarkOutForDelivery}
              disabled={actionLoading === 'out_for_delivery'}
              className="flex items-center gap-2 rounded-xl bg-rose-accent px-4 py-2 text-sm font-medium text-ivory transition-colors hover:opacity-90 disabled:opacity-50"
            >
              {actionLoading === 'out_for_delivery' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Truck className="h-4 w-4" />
                  Mark out for delivery
                </>
              )}
            </button>
          )}
          {order.status === 'out_for_delivery' && (
            <button
              onClick={handleMarkDelivered}
              disabled={actionLoading === 'delivered'}
              className="flex items-center gap-2 rounded-xl bg-mint-accent px-4 py-2 text-sm font-medium text-ivory transition-colors hover:opacity-90 disabled:opacity-50"
            >
              {actionLoading === 'delivered' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Mark delivered
                </>
              )}
            </button>
          )}
          {!['cancelled', 'refunded', 'delivered'].includes(order.status) && (
            <button
              onClick={handleCancelOrder}
              disabled={actionLoading === 'cancel'}
              className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              {actionLoading === 'cancel' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <X className="h-4 w-4" />
                  Cancel order
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Delivery window banner — pulled from the kitchen schedule */}
      {order.deliveryDate && !['cancelled', 'refunded', 'delivered'].includes(order.status) && (
        <div className="flex items-center gap-3 rounded-xl border border-line bg-cream p-4">
          <Timer className="h-5 w-5 text-cocoa" />
          <div>
            <p className="text-sm font-medium text-cocoa">
              Scheduled for{' '}
              {new Date(order.deliveryDate).toLocaleDateString('en-AU', {
                timeZone: 'Australia/Melbourne',
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}
              {order.deliverySlot ? ` · ${order.deliverySlot}` : ''}
            </p>
            {order.deliveryNote ? (
              <p className="mt-0.5 text-xs text-cocoa-soft">{order.deliveryNote}</p>
            ) : (
              <p className="text-xs text-taupe">Driver leaves the Narre Warren kitchen on this date.</p>
            )}
          </div>
        </div>
      )}

      {/* Status Update Bar — self-delivery lifecycle */}
      {!['cancelled', 'refunded', 'delivered'].includes(order.status) && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-ivory p-4 shadow-sm">
          <span className="text-sm font-medium text-cocoa-soft">Update status:</span>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'pending_payment', label: 'Awaiting payment' },
              { key: 'paid', label: 'Paid' },
              { key: 'in_kitchen', label: 'In kitchen' },
              { key: 'out_for_delivery', label: 'Out for delivery' },
              { key: 'delivered', label: 'Delivered' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => handleStatusUpdate(key)}
                disabled={!!actionLoading || order.status === key}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                  order.status === key
                    ? 'bg-cocoa text-ivory'
                    : 'bg-cream text-cocoa-soft hover:bg-cream-deep disabled:opacity-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Layout - 3 Column */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Left Column - Customer Info */}
        <div className="space-y-6 lg:col-span-1">
          {/* Customer Card */}
          <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-neutral-800">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-neutral-900 dark:text-white">Customer</h3>
              <button
                onClick={() => copyToClipboard(order.customer?.email || '', 'Email')}
                className="text-neutral-400 hover:text-cocoa"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cocoa font-bold text-white">
                {customerName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-neutral-900 dark:text-white">{customerName}</p>
                <p className="text-sm text-taupe">
                  {order.customer?.totalOrders || 1} orders •{' '}
                  {(order.customer?.totalSpent || order.totalAmount).toLocaleString('en-AU', {
                    style: 'currency',
                    currency: 'AUD',
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              {order.customer?.email && (
                <a
                  href={`mailto:${order.customer.email}`}
                  className="flex items-center gap-2 text-neutral-600 hover:text-cocoa dark:text-neutral-400"
                >
                  <Mail className="h-4 w-4" /> {order.customer.email}
                </a>
              )}
              {(order.deliveryAddress?.phone || order.shipment?.deliveryAddress?.phone || order.customer?.phone) && (
                <>
                  <a
                    href={`tel:${order.deliveryAddress?.phone || order.shipment?.deliveryAddress?.phone || order.customer?.phone}`}
                    className="flex items-center gap-2 text-neutral-600 hover:text-cocoa dark:text-neutral-400"
                  >
                    <Phone className="h-4 w-4" /> {order.deliveryAddress?.phone || order.shipment?.deliveryAddress?.phone || order.customer?.phone}
                  </a>
                  {(order.deliveryAddress?.email || order.shipment?.deliveryAddress?.email) && (
                    <a
                      href={`mailto:${order.deliveryAddress?.email || order.shipment?.deliveryAddress?.email}`}
                      className="flex items-center gap-2 text-neutral-600 hover:text-cocoa dark:text-neutral-400"
                    >
                      <Mail className="h-4 w-4" /> {order.deliveryAddress?.email || order.shipment?.deliveryAddress?.email}
                    </a>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-neutral-800">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-neutral-900 dark:text-white">Shipping Address</h3>
              <button
                onClick={() => {
                  const deliveryAddr = order.deliveryAddress || order.shipment?.deliveryAddress
                  const shippingAddr = order.shippingAddress
                  // Handle both address1 (from deliveryAddress) and address2 (from shipment.deliveryAddress)
                  const addr = deliveryAddr as any
                  const address1Value = addr?.address1 || addr?.address2 || shippingAddr?.address1 || ''
                  // Handle both zipcode (from deliveryAddress) and pincode (from shipment.deliveryAddress)
                  const zipcodeValue = addr?.zipcode || addr?.pincode || shippingAddr?.postalCode || shippingAddr?.zipcode || ''
                  setEditAddress({
                    address: deliveryAddr?.address || shippingAddr?.street || shippingAddr?.address || '',
                    address1: address1Value,
                    city: deliveryAddr?.city || shippingAddr?.city || '',
                    state:
                      normalizeShippingState(deliveryAddr?.state || shippingAddr?.state) ||
                      SHIPPING_STATE,
                    zipcode: zipcodeValue,
                    country: deliveryAddr?.country || shippingAddr?.country || 'Australia',
                  })
                  setShowAddressModal(true)
                }}
                className="text-neutral-400 hover:text-cocoa"
              >
                <Edit className="h-4 w-4" />
              </button>
            </div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              {(() => {
                const deliveryAddr = order.deliveryAddress || order.shipment?.deliveryAddress
                const shippingAddr = order.shippingAddress
                const address = deliveryAddr?.address || shippingAddr?.street || shippingAddr?.address || shippingAddr?.address1
                // Handle both address1 (from deliveryAddress) and address2 (from shipment.deliveryAddress)
                const addr = deliveryAddr as any
                const address1 = addr?.address1 || addr?.address2 || shippingAddr?.address1
                const city = deliveryAddr?.city || shippingAddr?.city
                const state = deliveryAddr?.state || shippingAddr?.state
                // Handle both zipcode (from deliveryAddress) and pincode (from shipment.deliveryAddress)
                const zipcode = addr?.zipcode || addr?.pincode || shippingAddr?.postalCode || shippingAddr?.zipcode
                const country = deliveryAddr?.country || shippingAddr?.country || 'India'
                
                return (
                  <>
                    {address && <p>{address}</p>}
                    {address1 && <p>{address1}</p>}
                    {(city || state || zipcode) && (
                      <p>
                        {city && `${city}`}
                        {city && state && ', '}
                        {state && `${state}`}
                        {zipcode && ` ${zipcode}`}
                      </p>
                    )}
                    {country && <p>{country}</p>}
                  </>
                )
              })()}
            </div>
          </div>

          {/* Tags */}
          <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-neutral-800">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-neutral-900 dark:text-white">Tags</h3>
              <button onClick={() => setShowTagModal(true)} className="text-neutral-400 hover:text-cocoa">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(order.tags || []).map((tag: string) => (
                <span
                  key={tag}
                  className="group inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300"
                >
                  <Tag className="h-3 w-3" /> {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {(!order.tags || order.tags.length === 0) && <p className="text-sm text-neutral-400">No tags</p>}
            </div>
          </div>

          {/* Source */}
          <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-neutral-800">
            <h3 className="mb-3 font-semibold text-neutral-900 dark:text-white">Order Source</h3>
            <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
              <Globe className="h-4 w-4" />
              <span className="capitalize">{order.source || 'Website'}</span>
            </div>
          </div>
        </div>

        {/* Center Column - Order Items & Tabs */}
        <div className="space-y-6 lg:col-span-2">
          {/* Order Items */}
          <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-neutral-800">
            <h3 className="mb-4 font-semibold text-neutral-900 dark:text-white">Order Items</h3>
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center gap-4 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-900">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="h-16 w-16 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-neutral-200 dark:bg-neutral-700">
                      <Package className="h-8 w-8 text-neutral-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-neutral-900 dark:text-white">{item.name}</p>
                    <div className="text-sm text-neutral-500">
                      {item.variants && item.variants.length > 0 ? (
                        <div className="flex flex-wrap gap-x-2 gap-y-1">
                          {/* Show every detail line — flavour/size options AND
                              build-your-own contents/message. 'Logo' is rendered
                              separately below as an image. */}
                          {item.variants
                            .filter((v) => v.option && !/^Logo(\s+\d+)?$/i.test(v.name))
                            .map((v, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center rounded bg-neutral-100 px-1.5 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                              >
                                {v.name === 'Option 1' ? 'Flavour' : v.name}: {v.option}
                              </span>
                            ))}
                        </div>
                      ) : (
                        <p>
                          {item.variant?.option1Value && `Flavor/Variant: ${item.variant.option1Value}`}
                        </p>
                      )}
                      {parseCupcakeContents(item.variants?.find((v) => v.name === 'Contents')?.option).length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {parseCupcakeContents(item.variants?.find((v) => v.name === 'Contents')?.option).map((flavour) => (
                            <span
                              key={flavour.name}
                              className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white py-0.5 pl-0.5 pr-2 text-xs font-semibold text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
                            >
                              {flavour.image && (
                                <span className="relative h-6 w-6 overflow-hidden rounded-full bg-neutral-100">
                                  <img src={flavour.image} alt={flavour.name} className="h-full w-full object-cover" />
                                </span>
                              )}
                              {flavour.quantity}x {flavour.name}
                            </span>
                          ))}
                        </div>
                      )}
                      {item.sku && <p className="mt-1">SKU: {item.sku}</p>}
                    </div>
                    <p className="text-sm text-neutral-500">Qty: {item.quantity}</p>

                    <CorporateLogoStrip
                      logoUrls={item.logoUrls}
                      logoUrl={item.logoUrl}
                      variants={item.variants}
                      variant="admin"
                      itemNoun={/slice/i.test(item.name || '') ? 'slice' : 'cupcake'}
                    />
                  </div>
                  <p className="font-semibold text-cocoa">
                    {(item.price * item.quantity).toLocaleString('en-AU', {
                      style: 'currency',
                      currency: 'AUD',
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="mt-4 border-t border-line pt-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-taupe">Subtotal</span>
                  <span className="text-cocoa">
                    {(order.subtotal ?? (order.totalAmount + (order.discount || 0) - (order.shipping || 0))).toLocaleString('en-AU', {
                      style: 'currency',
                      currency: 'AUD',
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                {(order.discount ?? 0) > 0 && (
                  <div className="flex justify-between text-mint-accent">
                    <span>Discount {order.discountCode && `(${order.discountCode})`}</span>
                    <span>-{(order.discount || 0).toLocaleString('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-taupe">Delivery</span>
                  <span className="text-cocoa">
                    {order.shipping === 0
                      ? 'Free'
                      : (order.shipping ?? 0).toLocaleString('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 2 })}
                  </span>
                </div>
                {(order.taxes ?? 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-taupe">GST</span>
                    <span className="text-cocoa">{(order.taxes || 0).toLocaleString('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-line pt-2 text-base font-semibold">
                  <span className="text-cocoa">Total</span>
                  <span className="text-cocoa">
                    {order.totalAmount.toLocaleString('en-AU', {
                      style: 'currency',
                      currency: 'AUD',
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="rounded-2xl bg-ivory shadow-sm">
            <div className="flex border-b border-line">
              {(['timeline', 'payments', 'fulfillment', 'notes'] as TabType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-4 py-3 text-sm font-medium capitalize transition-colors ${activeTab === tab
                    ? 'border-b-2 border-cocoa text-cocoa'
                    : 'text-taupe hover:text-cocoa'
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="p-5">
              {activeTab === 'timeline' && (
                <div className="space-y-4">
                  {combinedTimeline.length === 0 ? (
                    <div className="py-8 text-center">
                      <History className="mx-auto h-8 w-8 text-neutral-300" />
                      <p className="mt-2 text-neutral-500">No timeline events yet</p>
                    </div>
                  ) : (
                    [...combinedTimeline].reverse().map((event, index) => (
                      <div key={event._id || index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cocoa/10 text-cocoa">
                            {getEventIcon(event.eventType || event.type || 'status')}
                          </div>
                          {index < combinedTimeline.length - 1 && (
                            <div className="mt-2 h-full w-0.5 bg-neutral-200 dark:bg-neutral-700" />
                          )}
                        </div>
                        <div className="flex-1 pb-6">
                          <p className="font-medium text-neutral-900 dark:text-white">{event.title}</p>
                          {event.description && <p className="text-sm text-neutral-500">{event.description}</p>}
                          <div className="mt-1 flex items-center gap-2 text-xs text-neutral-400">
                            <Clock className="h-3 w-3" />
                            {new Date(event.createdAt || event.timestamp || new Date()).toLocaleString('en-AU', {
                              timeZone: 'Australia/Melbourne',
                            })}
                            {event.user && <span>• {event.user}</span>}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'payments' && (
                <div className="space-y-4">
                  <div
                    className={`flex items-center justify-between rounded-xl p-4 ${order.paymentDetails?.status === 'paid'
                      ? 'bg-green-50 dark:bg-green-900/20'
                      : order.paymentDetails?.status === 'refunded'
                        ? 'bg-orange-50 dark:bg-orange-900/20'
                        : 'bg-yellow-50 dark:bg-yellow-900/20'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      {order.paymentDetails?.status === 'paid' ? (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      ) : order.paymentDetails?.status === 'refunded' ? (
                        <RotateCcw className="h-6 w-6 text-orange-600" />
                      ) : (
                        <Clock className="h-6 w-6 text-yellow-600" />
                      )}
                      <div>
                        <p
                          className={`font-medium ${order.paymentDetails?.status === 'paid'
                            ? 'text-green-700 dark:text-green-400'
                            : order.paymentDetails?.status === 'refunded'
                              ? 'text-orange-700 dark:text-orange-400'
                              : 'text-yellow-700 dark:text-yellow-400'
                            }`}
                        >
                          Payment {order.paymentDetails?.status?.charAt(0).toUpperCase()}
                          {order.paymentDetails?.status?.slice(1)}
                        </p>
                        <p
                          className={`text-sm ${order.paymentDetails?.status === 'paid'
                            ? 'text-green-600'
                            : order.paymentDetails?.status === 'refunded'
                              ? 'text-orange-600'
                              : 'text-yellow-600'
                            }`}
                        >
                          via Stripe
                          {order.paymentDetails?.transactionId && ` • ${order.paymentDetails.transactionId}`}
                        </p>
                      </div>
                    </div>
                    <p
                      className={`text-lg font-bold ${order.paymentDetails?.status === 'paid'
                        ? 'text-green-700'
                        : order.paymentDetails?.status === 'refunded'
                          ? 'text-orange-700'
                          : 'text-yellow-700'
                        }`}
                    >
                      {order.totalAmount.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  {order.paymentDetails?.refundId && (
                    <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                      <p className="font-medium text-orange-700">Refund Processed</p>
                      <p className="text-sm text-orange-600">
                        Amount:{' '}
                        {(order.paymentDetails.refundAmount ?? 0).toLocaleString('en-AU', {
                          style: 'currency',
                          currency: 'AUD',
                          minimumFractionDigits: 2,
                        })}{' '}
                        • ID: {order.paymentDetails.refundId} •
                        {order.paymentDetails.refundedAt &&
                          new Date(order.paymentDetails.refundedAt).toLocaleString('en-AU', {
                            timeZone: 'Australia/Melbourne',
                          })}
                      </p>
                    </div>
                  )}

                  {order.paymentDetails?.status === 'paid' && !order.paymentDetails?.refundId && (
                    <button
                      onClick={() => setShowRefundModal(true)}
                      className="flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      <RotateCcw className="h-4 w-4" /> Issue Refund
                    </button>
                  )}
                </div>
              )}

              {activeTab === 'fulfillment' && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-line bg-cream p-4">
                    <p className="text-xs font-semibold tracking-[0.18em] text-taupe uppercase">
                      Self-delivery from Narre Warren
                    </p>
                    <p className="mt-1 text-sm text-cocoa-soft">
                      We bake to order and deliver every box ourselves — no courier handoff. The customer
                      chose the delivery date and time window at checkout (shown below); run the order
                      through Kitchen → Out for delivery → Delivered as the day progresses.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-line p-4">
                      <p className="text-xs font-semibold tracking-[0.18em] text-taupe uppercase">
                        Delivery date
                      </p>
                      <p className="mt-1 font-medium text-cocoa">
                        {order.deliveryDate
                          ? new Date(order.deliveryDate).toLocaleDateString('en-AU', {
                              timeZone: 'Australia/Melbourne',
                              weekday: 'long',
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Not scheduled yet'}
                      </p>
                    </div>
                    <div className="rounded-xl border border-line p-4">
                      <p className="text-xs font-semibold tracking-[0.18em] text-taupe uppercase">
                        Delivery window
                      </p>
                      <p className="mt-1 font-medium text-cocoa">
                        {order.deliverySlot || 'Not set'}
                      </p>
                    </div>
                  </div>

                  {order.notes?.some((n) => n.author === 'customer' && !n.isInternal && n.content) && (
                    <div className="rounded-xl border border-rose-accent/40 bg-rose/50 p-4">
                      <p className="text-xs font-semibold tracking-[0.18em] text-rose-accent uppercase">
                        Delivery instructions — from customer
                      </p>
                      <p className="mt-1 text-sm text-cocoa">
                        {order.notes.find((n) => n.author === 'customer' && !n.isInternal)?.content}
                      </p>
                    </div>
                  )}

                  {order.deliveryNote && (
                    <div className="rounded-xl border border-line bg-rose p-4">
                      <p className="text-xs font-semibold tracking-[0.18em] text-taupe uppercase">
                        Driver / kitchen note
                      </p>
                      <p className="mt-1 text-sm text-cocoa">{order.deliveryNote}</p>
                    </div>
                  )}

                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    {order.paymentDetails?.paymentStatus === 'paid' && order.status === 'paid' && (
                      <button
                        onClick={handleConfirmOrder}
                        disabled={actionLoading === 'confirm'}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-cocoa py-3 font-medium text-ivory hover:bg-cocoa-soft disabled:opacity-50"
                      >
                        {actionLoading === 'confirm' ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="h-5 w-5" />
                            Accept into kitchen
                          </>
                        )}
                      </button>
                    )}
                    {order.status === 'in_kitchen' && (
                      <button
                        onClick={handleMarkOutForDelivery}
                        disabled={actionLoading === 'out_for_delivery'}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-accent py-3 font-medium text-ivory hover:opacity-90 disabled:opacity-50"
                      >
                        {actionLoading === 'out_for_delivery' ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <>
                            <Truck className="h-5 w-5" />
                            Mark out for delivery
                          </>
                        )}
                      </button>
                    )}
                    {order.status === 'out_for_delivery' && (
                      <button
                        onClick={handleMarkDelivered}
                        disabled={actionLoading === 'delivered'}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-mint-accent py-3 font-medium text-ivory hover:opacity-90 disabled:opacity-50"
                      >
                        {actionLoading === 'delivered' ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="h-5 w-5" />
                            Mark delivered
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="space-y-4">
                  {(order.notes || []).length === 0 ? (
                    <div className="py-8 text-center">
                      <StickyNote className="mx-auto h-8 w-8 text-neutral-300" />
                      <p className="mt-2 text-neutral-500">No notes yet</p>
                    </div>
                  ) : (
                    [...(order.notes || [])].reverse().map((note, index) => (
                      <div key={note._id || index} className="rounded-xl bg-yellow-50 p-4 dark:bg-yellow-900/20">
                        <p className="text-sm text-neutral-700 dark:text-neutral-300">{note.content}</p>
                        <div className="mt-2 flex items-center gap-2 text-xs text-neutral-500">
                          <span>{note.author}</span>
                          <span>•</span>
                          <span>{new Date(note.createdAt).toLocaleString('en-AU', { timeZone: 'Australia/Melbourne' })}</span>
                          {note.isInternal && (
                            <>
                              <span>•</span>
                              <span className="rounded bg-neutral-200 px-1 dark:bg-neutral-700">Internal</span>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  <button
                    onClick={() => setShowNoteModal(true)}
                    className="flex items-center gap-2 text-sm text-cocoa hover:underline"
                  >
                    <Plus className="h-4 w-4" /> Add Note
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Actions */}
        <div className="space-y-6 lg:col-span-1">
          {/* Payment Info */}
          <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-neutral-800">
            <h3 className="mb-3 font-semibold text-neutral-900 dark:text-white">Payment</h3>
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${getPaymentStatusColor(order.paymentDetails?.paymentStatus)}`}
              >
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-cocoa">Stripe</p>
                <p className="text-xs text-taupe capitalize">
                  {order.paymentDetails?.paymentStatus || 'Pending'}
                </p>
                {order.paymentDetails?.transactionId && (
                  <p className="mt-1 font-mono text-xs text-taupe">{order.paymentDetails.transactionId}</p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-2xl bg-ivory p-5 shadow-sm">
            <h3 className="mb-3 font-semibold text-cocoa">Quick actions</h3>
            <div className="space-y-2">
              {order.paymentDetails?.paymentStatus === 'paid' && order.status === 'paid' && (
                <button
                  onClick={handleConfirmOrder}
                  disabled={actionLoading === 'confirm'}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-cocoa hover:bg-cream disabled:opacity-50"
                >
                  {actionLoading === 'confirm' ? (
                    <Loader2 className="h-4 w-4 animate-spin text-taupe" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-taupe" />
                  )}
                  Accept into kitchen
                </button>
              )}
              {order.status === 'in_kitchen' && (
                <button
                  onClick={handleMarkOutForDelivery}
                  disabled={actionLoading === 'out_for_delivery'}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-cocoa hover:bg-cream disabled:opacity-50"
                >
                  {actionLoading === 'out_for_delivery' ? (
                    <Loader2 className="h-4 w-4 animate-spin text-taupe" />
                  ) : (
                    <Truck className="h-4 w-4 text-taupe" />
                  )}
                  Mark out for delivery
                </button>
              )}
              {order.status === 'out_for_delivery' && (
                <button
                  onClick={handleMarkDelivered}
                  disabled={actionLoading === 'delivered'}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-cocoa hover:bg-cream disabled:opacity-50"
                >
                  {actionLoading === 'delivered' ? (
                    <Loader2 className="h-4 w-4 animate-spin text-taupe" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-taupe" />
                  )}
                  Mark delivered
                </button>
              )}
              {/* {order.status === 'confirmed' && (
                <button
                  onClick={handleCancelOrder}
                  disabled={actionLoading === 'cancel'}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-900/20"
                >
                  {actionLoading === 'cancel' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                  Cancel Order
                </button>
              )} */}
              {/* <button
                onClick={handlePrintInvoice}
                disabled={!!actionLoading}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-neutral-100 disabled:opacity-50 dark:hover:bg-neutral-700"
              >
                <FileText className="h-4 w-4 text-neutral-400" /> Generate Invoice
              </button> */}
              {/* <button
                onClick={handleSendWhatsApp}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700"
              >
                <MessageSquare className="h-4 w-4 text-neutral-400" /> Send WhatsApp
              </button> */}
              <button
                onClick={() => setShowEmailModal(true)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700"
              >
                <Mail className="h-4 w-4 text-neutral-400" /> Send Email
              </button>
              {/* <button
                onClick={() => setShowReassignModal(true)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700"
              >
                <Users className="h-4 w-4 text-neutral-400" /> Reassign
              </button> */}
              {!['cancelled', 'refunded', 'delivered'].includes(order.status) && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4" /> Cancel Order
                </button>
              )}
            </div>
          </div>

          {/* Risk Assessment */}
          <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-neutral-800">
            <h3 className="mb-3 font-semibold text-neutral-900 dark:text-white">Risk Assessment</h3>
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${getRiskColor(order.riskScore)}`}>
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p
                  className={`font-medium capitalize ${order.riskScore === 'low'
                    ? 'text-green-600'
                    : order.riskScore === 'medium'
                      ? 'text-yellow-600'
                      : order.riskScore === 'high'
                        ? 'text-red-600'
                        : 'text-neutral-600'
                    }`}
                >
                  {order.riskScore || 'Low'} Risk
                </p>
                <p className="text-xs text-neutral-500">
                  {order.customer?.totalOrders && order.customer.totalOrders > 1 ? 'Repeat customer' : 'New customer'}
                  {order.paymentDetails?.status === 'paid' && ', verified payment'}
                </p>
              </div>
            </div>
            {order.riskReasons && order.riskReasons.length > 0 && (
              <div className="mt-3 space-y-1">
                {order.riskReasons.map((reason, i) => (
                  <p key={i} className="text-xs text-red-600">
                    • {reason}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}

      {/* Note Modal */}
      <AnimatePresence>
        {showNoteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowNoteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-800"
            >
              <h3 className="mb-4 text-lg font-bold">Add Note</h3>
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Enter your note..."
                rows={4}
                className="w-full rounded-xl border border-neutral-200 p-3 outline-none focus:border-cocoa dark:border-neutral-700 dark:bg-neutral-900"
              />
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setShowNoteModal(false)}
                  className="flex-1 rounded-xl border border-neutral-200 py-2 font-medium hover:bg-neutral-50 dark:border-neutral-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddNote}
                  disabled={!newNote.trim() || !!actionLoading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-cocoa py-2 font-medium text-white disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Add Note
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Refund Modal */}
      <AnimatePresence>
        {showRefundModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowRefundModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-800"
            >
              <h3 className="mb-4 text-lg font-bold">Issue Refund</h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Refund Amount</label>
                  <input
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    placeholder={`Max: $${order.totalAmount.toLocaleString()}`}
                    max={order.totalAmount}
                    className="w-full rounded-xl border border-neutral-200 p-3 outline-none focus:border-cocoa dark:border-neutral-700 dark:bg-neutral-900"
                  />
                  <p className="mt-1 text-xs text-neutral-500">Leave empty for full refund</p>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Reason</label>
                  <textarea
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="Reason for refund..."
                    rows={3}
                    className="w-full rounded-xl border border-neutral-200 p-3 outline-none focus:border-cocoa dark:border-neutral-700 dark:bg-neutral-900"
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => setShowRefundModal(false)}
                  className="flex-1 rounded-xl border border-neutral-200 py-2 font-medium hover:bg-neutral-50 dark:border-neutral-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRefund}
                  disabled={!!actionLoading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-2 font-medium text-white disabled:opacity-50"
                >
                  {actionLoading === '/refund' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4" />
                  )}
                  Process Refund
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowCancelModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-800"
            >
              <h3 className="mb-4 text-lg font-bold text-red-600">Cancel Order</h3>
              <p className="mb-4 text-neutral-600 dark:text-neutral-400">
                Are you sure you want to cancel this order? This action cannot be undone.
              </p>
              <div>
                <label className="mb-1 block text-sm font-medium">Cancellation Reason</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Reason for cancellation..."
                  rows={3}
                  className="w-full rounded-xl border border-neutral-200 p-3 outline-none focus:border-cocoa dark:border-neutral-700 dark:bg-neutral-900"
                />
              </div>
              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 rounded-xl border border-neutral-200 py-2 font-medium hover:bg-neutral-50 dark:border-neutral-700"
                >
                  Keep Order
                </button>
                <button
                  onClick={handleCancelOrder}
                  disabled={!!actionLoading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-2 font-medium text-white disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                  Cancel Order
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reassign Modal */}
      <AnimatePresence>
        {showReassignModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowReassignModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-800"
            >
              <h3 className="mb-4 text-lg font-bold">Reassign Order</h3>
              <div>
                <label className="mb-1 block text-sm font-medium">Assign To</label>
                <input
                  type="text"
                  value={newAssignee}
                  onChange={(e) => setNewAssignee(e.target.value)}
                  placeholder="Staff member name..."
                  className="w-full rounded-xl border border-neutral-200 p-3 outline-none focus:border-cocoa dark:border-neutral-700 dark:bg-neutral-900"
                />
              </div>
              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => setShowReassignModal(false)}
                  className="flex-1 rounded-xl border border-neutral-200 py-2 font-medium hover:bg-neutral-50 dark:border-neutral-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReassign}
                  disabled={!newAssignee.trim() || !!actionLoading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-cocoa py-2 font-medium text-white disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Reassign
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tag Modal */}
      <AnimatePresence>
        {showTagModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowTagModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-800"
            >
              <h3 className="mb-4 text-lg font-bold">Add Tag</h3>
              <div>
                <label className="mb-1 block text-sm font-medium">Tag Name</label>
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="e.g., vip, urgent, gift..."
                  className="w-full rounded-xl border border-neutral-200 p-3 outline-none focus:border-cocoa dark:border-neutral-700 dark:bg-neutral-900"
                />
              </div>
              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => setShowTagModal(false)}
                  className="flex-1 rounded-xl border border-neutral-200 py-2 font-medium hover:bg-neutral-50 dark:border-neutral-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTag}
                  disabled={!newTag.trim() || !!actionLoading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-cocoa py-2 font-medium text-white disabled:opacity-50"
                >
                  Add Tag
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Address Edit Modal */}
      <AnimatePresence>
        {showAddressModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowAddressModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-800"
            >
              <h3 className="mb-4 text-lg font-bold">Edit Shipping Address</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={editAddress.address}
                  onChange={(e) => setEditAddress({ ...editAddress, address: e.target.value })}
                  placeholder="Address Line 1"
                  className="w-full rounded-xl border border-neutral-200 p-3 outline-none focus:border-cocoa dark:border-neutral-700 dark:bg-neutral-900"
                />
                <input
                  type="text"
                  value={editAddress.address1}
                  onChange={(e) => setEditAddress({ ...editAddress, address1: e.target.value })}
                  placeholder="Address Line 2 (Optional)"
                  className="w-full rounded-xl border border-neutral-200 p-3 outline-none focus:border-cocoa dark:border-neutral-700 dark:bg-neutral-900"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={editAddress.city}
                    onChange={(e) => setEditAddress({ ...editAddress, city: e.target.value })}
                    placeholder="City"
                    className="w-full rounded-xl border border-neutral-200 p-3 outline-none focus:border-cocoa dark:border-neutral-700 dark:bg-neutral-900"
                  />
                  <select
                    value={normalizeShippingState(editAddress.state) || SHIPPING_STATE}
                    onChange={(e) => setEditAddress({ ...editAddress, state: e.target.value })}
                    className="w-full rounded-xl border border-neutral-200 p-3 outline-none focus:border-cocoa dark:border-neutral-700 dark:bg-neutral-900"
                  >
                    {SHIPPING_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={editAddress.zipcode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                      setEditAddress({ ...editAddress, zipcode: value })
                    }}
                    placeholder="Pincode"
                    maxLength={6}
                    className="w-full rounded-xl border border-neutral-200 p-3 outline-none focus:border-cocoa dark:border-neutral-700 dark:bg-neutral-900"
                  />
                  <input
                    type="text"
                    value={editAddress.country}
                    onChange={(e) => setEditAddress({ ...editAddress, country: e.target.value })}
                    placeholder="Country"
                    className="w-full rounded-xl border border-neutral-200 p-3 outline-none focus:border-cocoa dark:border-neutral-700 dark:bg-neutral-900"
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => setShowAddressModal(false)}
                  className="flex-1 rounded-xl border border-neutral-200 py-2 font-medium hover:bg-neutral-50 dark:border-neutral-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateAddress}
                  disabled={!!actionLoading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-cocoa py-2 font-medium text-white disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Update Address
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email Modal */}
      <AnimatePresence>
        {showEmailModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowEmailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-800"
            >
              <h3 className="mb-4 text-lg font-bold">Send Email</h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Email Type</label>
                  <select
                    value={emailType}
                    onChange={(e) => setEmailType(e.target.value as typeof emailType)}
                    className="w-full rounded-xl border border-neutral-200 p-3 outline-none focus:border-cocoa dark:border-neutral-700 dark:bg-neutral-900"
                  >
                    <option value="payment_pending">Payment Pending Reminder</option>
                    <option value="shipping_update">Shipping Update</option>
                    <option value="delivery_confirmation">Delivery Confirmation</option>
                    <option value="invoice">Invoice</option>
                    <option value="custom">Custom Message</option>
                  </select>
                </div>
                {emailType === 'custom' && (
                  <>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Subject</label>
                      <input
                        type="text"
                        value={customEmailSubject}
                        onChange={(e) => setCustomEmailSubject(e.target.value)}
                        placeholder="Email subject..."
                        className="w-full rounded-xl border border-neutral-200 p-3 outline-none focus:border-cocoa dark:border-neutral-700 dark:bg-neutral-900"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Message</label>
                      <textarea
                        value={customEmailMessage}
                        onChange={(e) => setCustomEmailMessage(e.target.value)}
                        placeholder="Your message..."
                        rows={4}
                        className="w-full rounded-xl border border-neutral-200 p-3 outline-none focus:border-cocoa dark:border-neutral-700 dark:bg-neutral-900"
                      />
                    </div>
                  </>
                )}
                <p className="text-sm text-neutral-500">
                  Email will be sent to: {order.customer?.email || 'No email available'}
                </p>
              </div>
              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="flex-1 rounded-xl border border-neutral-200 py-2 font-medium hover:bg-neutral-50 dark:border-neutral-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendEmail}
                  disabled={!!actionLoading || !order.customer?.email}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-cocoa py-2 font-medium text-white disabled:opacity-50"
                >
                  {actionLoading === '/email' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Send Email
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
