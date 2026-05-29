'use client'

import { useUser } from '@clerk/nextjs'
import axios from 'axios'
import { useEffect, useState } from 'react'

interface WalletTransaction {
  _id: string
  type: 'credit' | 'debit'
  points: number
  description?: string
  balanceAfter: number
  createdAt: string
}

interface WalletData {
  points: number
  transactions: WalletTransaction[]
}

const AccountWalletPage = () => {
  const { user, isLoaded } = useUser()
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchWallet = async () => {
      if (!user) return
      try {
        const { data } = await axios.get(`/api/wallet?userId=${user.id}`)
        setWalletData(data)
      } catch (error) {
        console.error('Error fetching wallet:', error)
      } finally {
        setLoading(false)
      }
    }

    if (isLoaded && user) {
      fetchWallet()
    }
  }, [isLoaded, user])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (!isLoaded || loading) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <div className="h-32 animate-pulse rounded-2xl bg-neutral-100 dark:bg-neutral-800" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <h1 className="sr-only">My Wallet</h1>
      {/* Balance Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1B198F] to-[#3086C8] p-6 text-white shadow-lg sm:p-10">
        <div className="relative z-10">
          <h2 className="text-lg font-medium opacity-90">My Wallet Balance</h2>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-bold sm:text-5xl">
              {walletData?.points || 0}
            </span>
            <span className="text-lg font-medium opacity-80">Points</span>
          </div>
          <p className="mt-4 text-sm opacity-80 sm:text-base">
            Earn points with every purchase and redeem them for exclusive discounts.
          </p>
        </div>
        
        {/* Decorative Background Elements */}
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      </div>

      {/* Transaction History */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          Transaction History
        </h2>
        
        {!walletData?.transactions || walletData.transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 py-16 text-center dark:border-neutral-700">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 text-3xl dark:bg-neutral-800">
              👛
            </div>
            <p className="mt-4 text-lg font-medium text-neutral-900 dark:text-neutral-100">
              No transactions yet
            </p>
            <p className="mt-2 max-w-sm text-sm text-neutral-500 dark:text-neutral-400">
              Your wallet history is empty. Start shopping to earn points!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {walletData.transactions.slice().reverse().map((transaction) => (
              <div 
                key={transaction._id}
                className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-4 transition-all hover:shadow-md sm:flex-row sm:items-center sm:justify-between dark:border-neutral-700 dark:bg-neutral-900"
              >
                <div className="flex items-start gap-4">
                  <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    transaction.type === 'credit' 
                      ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' 
                      : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {transaction.type === 'credit' ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">
                      {transaction.description || (transaction.type === 'credit' ? 'Points Added' : 'Points Redeemed')}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {formatDate(transaction.createdAt)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between sm:flex-col sm:items-end">
                  <span className={`text-lg font-bold ${
                    transaction.type === 'credit' ? 'text-green-600 dark:text-green-500' : 'text-neutral-900 dark:text-neutral-100'
                  }`}>
                    {transaction.type === 'credit' ? '+' : '-'}{transaction.points}
                  </span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    Balance: {transaction.balanceAfter}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AccountWalletPage