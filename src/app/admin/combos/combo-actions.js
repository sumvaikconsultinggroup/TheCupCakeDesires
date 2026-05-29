// c:\Users\dell\Desktop\gibbon-ecomm\src\app\admin\combos\combo-actions.js

'use server'

import connectDb from '@/lib/mongodb'
import ProductCombo from '@/models/ProductCombo'
import Product from '@/models/product.model'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

/* ---------------- Get All Combos ---------------- */

export async function getCombos(params = {}) {
  try {
    await connectDb()

    const { search, status, page = 1, limit = 20 } = params

    const filter = { isDeleted: { $ne: true } }

    if (search) {
      filter.title = { $regex: search, $options: 'i' }
    }

    if (status && status !== 'all') {
      filter.status = status
    }

    const total = await ProductCombo.countDocuments(filter)
    const skip = (page - 1) * limit

    const combos = await ProductCombo.find(filter)
      .populate('items.productId', 'title images handle')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const plainCombos = combos.map((combo) => ({
      ...combo,
      _id: combo._id.toString(),
      items: combo.items.map((item) => ({
        ...item,
        productId: item.productId?._id?.toString() || item.productId,
      })),
    }))

    return {
      success: true,
      combos: plainCombos,
      total,
    }
  } catch (error) {
    console.error('Error fetching combos:', error)
    return {
      success: false,
      message: error.message,
      combos: [],
      total: 0,
    }
  }
}

/* ---------------- Get Single Combo ---------------- */

export async function getCombo(handle) {
  try {
    await connectDb()

    const combo = await ProductCombo.findOne({ handle, isDeleted: { $ne: true } })
      .populate('items.productId')
      .lean()

    if (!combo) {
      return { success: false, message: 'Combo not found' }
    }

    return {
      success: true,
      combo: {
        ...combo,
        _id: combo._id.toString(),
      },
    }
  } catch (error) {
    return { success: false, message: error.message }
  }
}

/* ---------------- Create Combo ---------------- */

export async function createCombo(data) {
  try {
    await connectDb()

    // Validate that all products exist
    const productIds = data.items.map((item) => item.productId)
    const products = await Product.find({ _id: { $in: productIds } })

    if (products.length !== productIds.length) {
      return { success: false, message: 'Some products not found' }
    }

    // Create the combo
    const combo = await ProductCombo.create(data)

    return {
      success: true,
      message: 'Combo created successfully',
      combo: {
        ...combo.toObject(),
        _id: combo._id.toString(),
      },
    }
  } catch (error) {
    console.error('Error creating combo:', error)
    return { success: false, message: error.message }
  }
}

/* ---------------- Update Combo ---------------- */

export async function updateCombo(handle, data) {
  try {
    await connectDb()

    if (data.image && data.image.startsWith('data:')) {
      const upload = await cloudinary.uploader.upload(data.image, {
        folder: 'combos',
      })
      data.image = upload.secure_url
    }

    const combo = await ProductCombo.findOneAndUpdate({ handle, isDeleted: { $ne: true } }, data, {
      new: true,
      runValidators: true,
    })

    if (!combo) {
      return { success: false, message: 'Combo not found' }
    }

    return {
      success: true,
      message: 'Combo updated successfully',
      combo: {
        ...combo.toObject(),
        _id: combo._id.toString(),
      },
    }
  } catch (error) {
    return { success: false, message: error.message }
  }
}

/* ---------------- Delete Combo ---------------- */

export async function deleteCombo(handle) {
  try {
    await connectDb()

    const combo = await ProductCombo.findOneAndUpdate({ handle }, { isDeleted: true }, { new: true })

    if (!combo) {
      return { success: false, message: 'Combo not found' }
    }

    return { success: true, message: 'Combo deleted successfully' }
  } catch (error) {
    return { success: false, message: error.message }
  }
}

/* ---------------- Get Products for Combo Selection ---------------- */

export async function getProductsForCombo(search = '') {
  try {
    await connectDb()

    const filter = {
      isDeleted: { $ne: true },
      status: 'active',
      published: true,
    }

    if (search) {
      filter.title = { $regex: search, $options: 'i' }
    }

    const products = await Product.find(filter).select('_id handle title images variants').limit(50).lean()

    const plainProducts = products.map((product) => ({
      _id: product._id.toString(),
      handle: product.handle,
      title: product.title,
      images: product.images || [],
      variants:
        product.variants?.map((v) => ({
          _id: v._id?.toString(),
          option1Value: v.option1Value,
          option2Value: v.option2Value,
          option3Value: v.option3Value,
          price: v.price,
          compareAtPrice: v.compareAtPrice,
          image: v.image,
          sku: v.sku,
          inventoryQty: v.inventoryQty,
        })) || [],
    }))

    return {
      success: true,
      products: plainProducts,
    }
  } catch (error) {
    console.error('Error fetching products:', error)
    return {
      success: false,
      message: error.message,
      products: [],
    }
  }
}

/* ---------------- Duplicate Combo ---------------- */

export async function duplicateCombo(handle) {
  try {
    await connectDb()

    const original = await ProductCombo.findOne({ handle, isDeleted: { $ne: true } }).lean()

    if (!original) {
      return { success: false, message: 'Combo not found' }
    }

    const newHandle = `${original.handle}-copy-${Date.now()}`

    const duplicate = await ProductCombo.create({
      ...original,
      _id: undefined,
      handle: newHandle,
      title: `${original.title} (Copy)`,
      status: 'draft',
    })

    return {
      success: true,
      message: 'Combo duplicated successfully',
      combo: {
        ...duplicate.toObject(),
        _id: duplicate._id.toString(),
      },
    }
  } catch (error) {
    return { success: false, message: error.message }
  }
}

/* ---------------- Get Active Combos for Public Display ---------------- */

export async function getActiveCombos(limit = 10) {
  try {
    await connectDb()

    const combos = await ProductCombo.find({
      isDeleted: { $ne: true },
      status: 'active',
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()

    const plainCombos = combos.map((combo) => ({
      _id: combo._id.toString(),
      handle: combo.handle,
      title: combo.title,
      description: combo.description || '',
      image: combo.image || '',
      items: combo.items.map((item) => ({
        productId: item.productId?.toString() || '',
        variantId: item.variantId?.toString() || '',
        titleSnapshot: item.titleSnapshot,
        imageSnapshot: item.imageSnapshot || '',
        priceSnapshot: item.priceSnapshot,
        quantity: item.quantity,
        variantDetails: item.variantDetails || {},
      })),
      totalOriginalPrice: combo.totalOriginalPrice || 0,
      totalPrice: combo.totalPrice || 0,
      totalQuantity: combo.totalQuantity || 0,
      discount: combo.discount || 0,
      discountPercentage: combo.discountPercentage || 0,
      savingsAmount: combo.savingsAmount || 0,
      status: combo.status,
    }))

    return {
      success: true,
      combos: plainCombos,
    }
  } catch (error) {
    console.error('Error fetching active combos:', error)
    return {
      success: false,
      message: error.message,
      combos: [],
    }
  }
}