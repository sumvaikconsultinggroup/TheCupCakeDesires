'use client'

import { useRouter } from 'next/navigation'
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react'

export default function ForbiddenPage() {
  const router = useRouter()

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-red-100 p-6">
            <ShieldAlert className="h-16 w-16 text-red-600" />
          </div>
        </div>
        
        <h1 className="mb-2 text-3xl font-bold text-neutral-900 dark:text-white">
          Access Denied
        </h1>
        
        <p className="mb-8 text-neutral-600 dark:text-neutral-400">
          You don't have permission to access this page. Please contact the store owner if you believe this is an error.
        </p>
        
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-6 py-3 font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
          
          <button
            onClick={() => router.push('/admin')}
            className="flex items-center justify-center gap-2 rounded-lg bg-[#2e1f15] px-6 py-3 font-medium text-white transition-colors hover:bg-[#2e1f15]/90"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
