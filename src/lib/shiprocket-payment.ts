import axios from 'axios'
import { getShiprocketToken } from './shiprocket'

const SHIPROCKET_API_URL = process.env.SHIPROCKET_API_URL || 'https://apiv2.shiprocket.in/v1/external'

export async function getShiprocketCODOrders(params: { page?: number; per_page?: number; sort?: string; sort_by?: string } = {}) {
    try {
        const token = await getShiprocketToken()
        // Using shipments endpoint to get COD remittance details generally or orders with payment_method="COD"
        // However, for "COD Transactions", we specifically want the finance/remittance data if available, or just orders marked as COD.
        // Given the prompt "show cod transactions which you have to fetch from the shiprocket", 
        // we'll fetch orders and filter for COD, or if there's a specific remittance API, we'd use that.
        // Shiprocket API v2 Orders endpoint: /orders

        // Default params
        const page = params.page || 1
        const per_page = params.per_page || 20 // Max 100
        const sort = params.sort || 'DESC'
        const sort_by = params.sort_by || 'created_at'

        const response = await axios.get(`${SHIPROCKET_API_URL}/orders`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            params: {
                page,
                per_page,
                sort,
                sort_by,
                payment_method: 'COD' // Filter for COD orders
            },
        })

        return {
            success: true,
            orders: response.data.data, // Array of orders
            pagination: response.data.meta?.pagination // { current_page, next_page, prev_page, total_pages, total_count }
        }
    } catch (error: any) {
        console.error('Error fetching Shiprocket COD orders:', error.response?.data || error.message)
        return {
            success: false,
            error: error.response?.data?.message || 'Failed to fetch COD orders'
        }
    }
}
