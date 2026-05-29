// src/lib/shiprocket.js

import axios from 'axios';

let authToken = null;
let tokenExpiry = null;

export async function getShiprocketToken() {
  if (authToken && tokenExpiry && new Date() < tokenExpiry) {
    return authToken;
  }

  const url = `${process.env.SHIPROCKET_API_URL}/auth/login`;
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;

  try {
    const response = await axios.post(url, { email, password });
    authToken = response.data.token;
    // Shiprocket token is typically valid for 10 days. Set expiry in 9 days.
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 9);
    tokenExpiry = expiryDate;
    return authToken;
  } catch (error) {
    console.error('Error getting Shiprocket token:', error.response ? error.response.data : error.message);
    throw new Error('Failed to authenticate with Shiprocket');
  }
}

export async function getShiprocketOrder(orderId) {
  try {
    const token = await getShiprocketToken();
    const url = `${process.env.SHIPROCKET_API_URL}/orders/show/${orderId}`;

    // Note: Shiprocket API might expect internal order ID or channel order ID
    // If orderId is our DB OrderId, we might need to search by channel_order_id
    // But assuming orderId passed here is shiprocket's order id just in case, or we use filter

    // Better approach: filter by custom order id (channel_order_id)
    const searchUrl = `${process.env.SHIPROCKET_API_URL}/orders?channel_order_id=${orderId}`;

    const response = await axios.get(searchUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data.data && response.data.data.length > 0) {
      return response.data.data[0];
    }
    return null;
  } catch (error) {
    console.error('Error fetching Shiprocket order:', error.message);
    return null;
  }
}

export async function getShiprocketOrderStatus(orderId) {
  const order = await getShiprocketOrder(orderId);
  if (order) {
    return order.status; // e.g., 'NEW', 'READY TO SHIP', 'PICKED UP' etc.
  }
  return null;
}

export async function cancelShiprocketOrder(shiprocketOrderId) {
  try {
    const token = await getShiprocketToken();
    const url = `${process.env.SHIPROCKET_API_URL}/orders/cancel`;

    const response = await axios.post(url, { ids: [shiprocketOrderId] }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error cancelling Shiprocket order:', error.response ? error.response.data : error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Fetch latest orders from Shiprocket
 * @param {Object} options - Query options
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.perPage - Orders per page (default: 10, max: 100)
 * @param {string} options.sort - Sort order: 'asc' or 'desc' (default: 'desc')
 * @param {string} options.sortBy - Sort by field: 'created_at' or 'updated_at' (default: 'created_at')
 * @returns {Promise<Object>} - Returns orders array and pagination info
 */
export async function getLatestShiprocketOrders(options = {}) {
  try {
    const token = await getShiprocketToken();
    const {
      page = 1,
      perPage = 10,
      sort = 'desc',
      sortBy = 'created_at'
    } = options;

    const url = `${process.env.SHIPROCKET_API_URL}/orders`;
    
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: Math.min(perPage, 100).toString(), // Max 100 per page
      sort: sort,
      sort_by: sortBy
    });

    const response = await axios.get(`${url}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data && response.data.data) {
      return {
        success: true,
        orders: response.data.data,
        pagination: {
          currentPage: response.data.current_page || page,
          totalPages: response.data.last_page || 1,
          totalOrders: response.data.total || 0,
          perPage: response.data.per_page || perPage
        }
      };
    }

    return {
      success: true,
      orders: [],
      pagination: {
        currentPage: page,
        totalPages: 0,
        totalOrders: 0,
        perPage: perPage
      }
    };
  } catch (error) {
    console.error('Error fetching latest Shiprocket orders:', error.response ? error.response.data : error.message);
    return {
      success: false,
      error: error.message,
      orders: [],
      pagination: null
    };
  }
}