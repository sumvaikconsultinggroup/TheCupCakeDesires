'use client'

import { Inbox } from 'lucide-react'

export interface EmptyStateProps { hasFilters: boolean; onClearFilters?: () => void; message?: string }

export default function EmptyState({ hasFilters, onClearFilters, message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
        <Inbox className="w-8 h-8 text-neutral-400 dark:text-neutral-500" />
      </div>
      <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-1">{hasFilters ? 'No orders match these filters' : 'No orders yet'}</h3>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4 max-w-sm">{message ?? (hasFilters ? 'Try adjusting your search or removing some filters.' : 'New orders will appear here once customers start checking out.')}</p>
      {hasFilters && onClearFilters && <button onClick={onClearFilters} className="px-4 py-2 text-sm font-medium text-white bg-[#1B198F] hover:bg-[#0F0E5B] rounded-md transition-colors">Clear all filters</button>}
    </div>
  )
}
