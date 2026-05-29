import mongoose from 'mongoose'
import CartNotification from '@/models/CartNotification'
import { formatDistanceToNow } from 'date-fns'
import RefreshButton from './RefreshButton'
import SendEmailButton from './SendEmailButton'

// Force dynamic rendering so we always see the latest carts
export const dynamic = 'force-dynamic'

const connectDB = async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI || '')
  }
}

async function getAbandonedCarts() {
  await connectDB()

  // Fetch carts that are active and sort by most recently updated
  const carts = await CartNotification.find({ isActive: true })
    .sort({ updatedAt: -1 })
    .lean()

  // Serialize MongoDB documents to plain objects (ObjectId → string, Date → string)
  return JSON.parse(JSON.stringify(carts))
}

export default async function AbandonedCartsPage() {
  const carts = await getAbandonedCarts()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Abandoned Checkouts</h1>
            <p className="text-sm text-gray-500 mt-1">
              View and manage carts left behind by customers.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <RefreshButton />
            <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
              <span className="text-sm font-medium text-gray-500">Total Active: </span>
              <span className="text-lg font-bold text-gray-900">{carts.length}</span>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                <tr>
                  <th scope="col" className="px-6 py-4 font-semibold">Customer</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Cart Summary</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Total Value</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Last Active</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Status</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {carts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No abandoned carts found.
                    </td>
                  </tr>
                ) : (
                  carts.map((cart: any) => {
                    // Fallback calculation for subtotal if it wasn't saved in DB yet
                    const total = cart.subtotal || cart.products?.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0) || 0

                    return (
                      <tr key={cart._id} className="bg-white hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">{cart.userName || 'Guest User'}</span>
                            <span className="text-xs text-gray-500">{cart.email}</span>
                            {cart.phoneNumber && <span className="text-xs text-gray-400">{cart.phoneNumber}</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-gray-900">{cart.products?.length || 0} items</span>
                            <span className="text-xs text-gray-500 truncate max-w-[200px]">
                              {cart.products?.map((p: any) => `${p.name} (x${p.quantity})`).join(', ')}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900">
                          ₹{total.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {cart.updatedAt ? formatDistanceToNow(new Date(cart.updatedAt), { addSuffix: true }) : '-'}
                        </td>
                        <td className="px-6 py-4">
                          {cart.isSent ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Recovered
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <SendEmailButton cart={cart} />
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}