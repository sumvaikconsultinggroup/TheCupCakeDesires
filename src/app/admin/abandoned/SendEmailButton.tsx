'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Product {
  name: string
  price: number
  quantity: number
  imageUrl?: string
  variant?: {
    option1Value?: string
  }
}

interface Cart {
  _id: string
  email: string
  userName: string
  products: Product[]
}

export default function SendEmailButton({ cart }: { cart: Cart }) {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<'template' | 'custom'>('template')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSend = async () => {
    setLoading(true)

    try {
      const payload =
        mode === 'template'
          ? {
              email: cart.email,
              cartData: cart,
              type: 'template',
            }
          : {
              email: cart.email,
              cartData: cart,
              type: 'custom',
              subject,
              message,
            }

      const res = await fetch('/api/cart/abandoned/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.message || 'Failed to send email')
      }

      setIsOpen(false)
      router.refresh()
      alert('Email sent successfully')
    } catch (error: any) {
      console.error(error)
      alert(error.message || 'Error sending email')
    } finally {
      setLoading(false)
    }
  }

  const isCustomInvalid =
    mode === 'custom' && (!subject.trim() || !message.trim())

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-indigo-600 hover:text-indigo-900 font-medium text-sm"
      >
        Send Email
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Send Recovery Email
            </h2>

            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setMode('template')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'template'
                    ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-700/10'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Use Template
              </button>

              <button
                onClick={() => setMode('custom')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'custom'
                    ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-700/10'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Write Custom
              </button>
            </div>

            {mode === 'template' ? (
              <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-sm text-gray-600">
                  This will send the standard abandoned cart recovery email
                  containing {cart.products.length} items in their cart.
                </p>
              </div>
            ) : (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    placeholder="Don't forget your items!"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    placeholder="Write your personal message here..."
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                onClick={handleSend}
                disabled={loading || isCustomInvalid}
                className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
