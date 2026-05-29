'use server'

import connectDb from '@/lib/mongodb'
import Product from '@/models/product.model'

export interface ReportData {
  overview: {
    totalProducts: number
    totalVariants: number
    totalInventoryValue: number
    totalInventoryUnits: number
    averagePrice: number
    productsWithoutStock: number
  }
  inventoryByCategory: {
    category: string
    count: number
    units: number
    value: number
  }[]
  topProductsByValue: {
    handle: string
    title: string
    image: string
    units: number
    value: number
  }[]
  stockDistribution: {
    range: string
    count: number
    percentage: number
  }[]
  inventoryTrends: {
    lowStock: number
    outOfStock: number
    wellStocked: number
    overstocked: number
  }
  priceRanges: {
    range: string
    count: number
    percentage: number
  }[]
}

export async function getReportData(): Promise<{ success: boolean; data: ReportData | null }> {
  try {
    await connectDb()
    
    const products = await Product.find({ isDeleted: { $ne: true } }).lean()
    
    // Calculate overview stats
    let totalVariants = 0
    let totalInventoryValue = 0
    let totalInventoryUnits = 0
    let totalPrice = 0
    let priceCount = 0
    let productsWithoutStock = 0
    
    // Category breakdown
    const categoryMap = new Map<string, { count: number; units: number; value: number }>()
    
    // Top products by inventory value
    const productValues: { handle: string; title: string; image: string; units: number; value: number }[] = []
    
    // Stock distribution
    let stockRanges = {
      zero: 0,
      low: 0, // 1-10
      medium: 0, // 11-50
      high: 0, // 51-100
      veryHigh: 0, // 100+
    }
    
    // Price ranges
    let priceRanges = {
      under500: 0,
      '500to1000': 0,
      '1000to2000': 0,
      '2000to5000': 0,
      over5000: 0,
    }
    
    // Inventory trends
    let lowStock = 0
    let outOfStock = 0
    let wellStocked = 0
    let overstocked = 0
    
    for (const product of products) {
      const variants = product.variants || []
      totalVariants += variants.length
      
      let productUnits = 0
      let productValue = 0
      let hasStock = false
      
      for (const v of variants) {
        const qty = v.inventoryQty || 0
        const price = v.price || 0
        const cost = v.costPerItem || price
        
        productUnits += qty
        productValue += qty * cost
        totalInventoryUnits += qty
        totalInventoryValue += qty * cost
        
        if (qty > 0) hasStock = true
        
        // Stock distribution
        if (qty === 0) stockRanges.zero++
        else if (qty <= 10) stockRanges.low++
        else if (qty <= 50) stockRanges.medium++
        else if (qty <= 100) stockRanges.high++
        else stockRanges.veryHigh++
        
        // Price ranges
        if (price < 500) priceRanges.under500++
        else if (price < 1000) priceRanges['500to1000']++
        else if (price < 2000) priceRanges['1000to2000']++
        else if (price < 5000) priceRanges['2000to5000']++
        else priceRanges.over5000++
        
        if (price > 0) {
          totalPrice += price
          priceCount++
        }
        
        // Inventory trends
        if (qty === 0) outOfStock++
        else if (qty <= 10) lowStock++
        else if (qty <= 100) wellStocked++
        else overstocked++
      }
      
      if (!hasStock) productsWithoutStock++
      
      // Category breakdown
      const category = product.productCategory || 'Uncategorized'
      const existing = categoryMap.get(category) || { count: 0, units: 0, value: 0 }
      categoryMap.set(category, {
        count: existing.count + 1,
        units: existing.units + productUnits,
        value: existing.value + productValue,
      })
      
      // Product values
      productValues.push({
        handle: product.handle,
        title: product.title,
        image: product.images?.[0]?.src || '',
        units: productUnits,
        value: productValue,
      })
    }
    
    // Sort and get top products
    const topProductsByValue = productValues
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
    
    // Convert category map to array
    const inventoryByCategory = Array.from(categoryMap.entries())
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.value - a.value)
    
    // Calculate stock distribution percentages
    const totalStockEntries = Object.values(stockRanges).reduce((a, b) => a + b, 0)
    const stockDistribution = [
      { range: 'Out of Stock (0)', count: stockRanges.zero, percentage: Math.round((stockRanges.zero / totalStockEntries) * 100) || 0 },
      { range: 'Low (1-10)', count: stockRanges.low, percentage: Math.round((stockRanges.low / totalStockEntries) * 100) || 0 },
      { range: 'Medium (11-50)', count: stockRanges.medium, percentage: Math.round((stockRanges.medium / totalStockEntries) * 100) || 0 },
      { range: 'High (51-100)', count: stockRanges.high, percentage: Math.round((stockRanges.high / totalStockEntries) * 100) || 0 },
      { range: 'Very High (100+)', count: stockRanges.veryHigh, percentage: Math.round((stockRanges.veryHigh / totalStockEntries) * 100) || 0 },
    ]
    
    // Calculate price range percentages
    const totalPriceEntries = Object.values(priceRanges).reduce((a, b) => a + b, 0)
    const priceRangeData = [
      { range: 'Under ₹500', count: priceRanges.under500, percentage: Math.round((priceRanges.under500 / totalPriceEntries) * 100) || 0 },
      { range: '₹500 - ₹1,000', count: priceRanges['500to1000'], percentage: Math.round((priceRanges['500to1000'] / totalPriceEntries) * 100) || 0 },
      { range: '₹1,000 - ₹2,000', count: priceRanges['1000to2000'], percentage: Math.round((priceRanges['1000to2000'] / totalPriceEntries) * 100) || 0 },
      { range: '₹2,000 - ₹5,000', count: priceRanges['2000to5000'], percentage: Math.round((priceRanges['2000to5000'] / totalPriceEntries) * 100) || 0 },
      { range: 'Over ₹5,000', count: priceRanges.over5000, percentage: Math.round((priceRanges.over5000 / totalPriceEntries) * 100) || 0 },
    ]
    
    const data: ReportData = {
      overview: {
        totalProducts: products.length,
        totalVariants,
        totalInventoryValue,
        totalInventoryUnits,
        averagePrice: priceCount > 0 ? Math.round(totalPrice / priceCount) : 0,
        productsWithoutStock,
      },
      inventoryByCategory,
      topProductsByValue,
      stockDistribution,
      inventoryTrends: { lowStock, outOfStock, wellStocked, overstocked },
      priceRanges: priceRangeData,
    }
    
    return { success: true, data }
  } catch (error) {
    console.error('Get report data error:', error)
    return { success: false, data: null }
  }
}
