'use client'

interface CancelOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  cancelReason: string
  setCancelReason: (reason: string) => void
  cancelling: boolean
  cancelError: string | null
  orderStatus?: string
}

export default function CancelOrderModal({
  isOpen,
  onClose,
  onConfirm,
  cancelReason,
  setCancelReason,
  cancelling,
  cancelError,
  orderStatus,
}: CancelOrderModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-800">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Cancel Order?
        </h3>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          Are you sure you want to cancel this order? This action cannot be undone.
          {orderStatus === 'processing' && (
            <span className="mt-2 block font-medium text-orange-600 dark:text-orange-400">
              Note: This order is processing. Cancellation will be attempted with the warehouse.
            </span>
          )}
        </p>

        <div className="mt-4">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Reason for cancellation
          </label>
          <select
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700"
          >
            <option value="">Select a reason</option>
            <option value="Changed my mind">Changed my mind</option>
            <option value="Found a better price">Found a better price</option>
            <option value="Ordered by mistake">Ordered by mistake</option>
            <option value="Shipping taking too long">Shipping taking too long</option>
            <option value="Product not needed">Product not needed</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {cancelError && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{cancelError}</p>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={cancelling}
            className="flex-1 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600"
          >
            Keep Order
          </button>
          <button
            onClick={onConfirm}
            disabled={cancelling || !cancelReason}
            className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {cancelling ? 'Cancelling...' : 'Yes, Cancel Order'}
          </button>
        </div>
      </div>
    </div>
  )
}
