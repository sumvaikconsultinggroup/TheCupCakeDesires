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
    pricedVariants: number
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
      under20: 0,
      '20to40': 0,
      '40to60': 0,
      '60to80': 0,
      over80: 0,
    }
    
    // Inventory trends
    let lowStock = 0
    let outOfStock = 0
    let wellStocked = 0
    let overstocked = 0
    
    for (const product of products) {
      const variants = product.variants || []
      totalVariants += variants.length

      // Variant-less products have nothing sellable: count them in totalProducts only
      if (variants.length === 0) continue

      let productUnits = 0
      let productValue = 0
      let hasStock = false
      
      for (const v of variants) {
        const qty = v.inventoryQty || 0
        const price = v.price || 0

        productUnits += qty
        productValue += qty * price
        totalInventoryUnits += qty
        totalInventoryValue += qty * price
        
        if (qty > 0) hasStock = true
        
        // Stock distribution
        if (qty === 0) stockRanges.zero++
        else if (qty <= 10) stockRanges.low++
        else if (qty <= 50) stockRanges.medium++
        else if (qty <= 100) stockRanges.high++
        else stockRanges.veryHigh++
        
        // Price ranges
        if (price < 20) priceRanges.under20++
        else if (price < 40) priceRanges['20to40']++
        else if (price < 60) priceRanges['40to60']++
        else if (price < 80) priceRanges['60to80']++
        else priceRanges.over80++
        
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
      { range: 'Under $20', count: priceRanges.under20, percentage: Math.round((priceRanges.under20 / totalPriceEntries) * 100) || 0 },
      { range: '$20 - $40', count: priceRanges['20to40'], percentage: Math.round((priceRanges['20to40'] / totalPriceEntries) * 100) || 0 },
      { range: '$40 - $60', count: priceRanges['40to60'], percentage: Math.round((priceRanges['40to60'] / totalPriceEntries) * 100) || 0 },
      { range: '$60 - $80', count: priceRanges['60to80'], percentage: Math.round((priceRanges['60to80'] / totalPriceEntries) * 100) || 0 },
      { range: 'Over $80', count: priceRanges.over80, percentage: Math.round((priceRanges.over80 / totalPriceEntries) * 100) || 0 },
    ]
    
    const data: ReportData = {
      overview: {
        totalProducts: products.length,
        totalVariants,
        totalInventoryValue,
        totalInventoryUnits,
        averagePrice: priceCount > 0 ? Math.round((totalPrice / priceCount) * 100) / 100 : 0,
        pricedVariants: priceCount,
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
