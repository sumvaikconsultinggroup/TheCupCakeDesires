'use server'

import connectDb from '@/lib/mongodb'
import Product from '@/models/product.model'

interface ShopifyCSVRow {
  Handle: string
  Title: string
  'Body (HTML)': string
  Vendor: string
  'Product Category': string
  Type: string
  Tags: string
  Published: string
  'Option1 Name': string
  'Option1 Value': string
  'Option2 Name': string
  'Option2 Value': string
  'Option3 Name': string
  'Option3 Value': string
  'Variant SKU': string
  'Variant Grams': string
  'Variant Inventory Qty': string
  'Variant Inventory Policy': string
  'Variant Price': string
  'Variant Compare At Price': string
  'Variant Requires Shipping': string
  'Variant Taxable': string
  'Variant Barcode': string
  'Variant Weight Unit': string
  'Cost per item': string
  'Image Src': string
  'Image Position': string
  'Image Alt Text': string
  'Gift Card': string
  'SEO Title': string
  'SEO Description': string
  Status: string
  'Variant Image': string
}

interface ParsedProduct {
  handle: string
  title: string
  bodyHtml: string
  vendor: string
  productCategory: string
  type: string
  tags: string[]
  published: boolean
  options: { name: string; values: string[] }[]
  variants: {
    option1Value: string
    option2Value?: string
    option3Value?: string
    sku: string
    grams: number
    inventoryQty: number
    inventoryPolicy: 'deny' | 'continue'
    price: number
    compareAtPrice?: number
    requiresShipping: boolean
    taxable: boolean
    barcode?: string
    image?: string
    weightUnit: string
    costPerItem?: number
  }[]
  images: { src: string; position: number; altText: string }[]
  seo: { title: string; description: string }
  giftCard: boolean
  status: 'active' | 'draft' | 'archived'
}

interface ImportResult {
  success: boolean
  message: string
  imported?: number
  skipped?: number
  errors?: string[]
  products?: ParsedProduct[]
}

// Parse CSV content into rows
function parseCSV(csvContent: string): ShopifyCSVRow[] {
  const lines = csvContent.split('\n')
  if (lines.length < 2) return []

  // Parse header
  const headerLine = lines[0]
  const headers = parseCSVLine(headerLine)

  const rows: ShopifyCSVRow[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    
    const values = parseCSVLine(line)
    const row: any = {}
    
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    
    rows.push(row as ShopifyCSVRow)
  }
  
  return rows
}

// Parse a single CSV line handling quoted fields with commas
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]
    
    if (char === '"' && !inQuotes) {
      inQuotes = true
    } else if (char === '"' && inQuotes) {
      if (nextChar === '"') {
        current += '"'
        i++ // Skip next quote
      } else {
        inQuotes = false
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current.trim())
  return result
}

// Convert Shopify CSV rows into our product format
function convertToProducts(rows: ShopifyCSVRow[]): ParsedProduct[] {
  const productMap = new Map<string, ParsedProduct>()
  
  for (const row of rows) {
    const handle = row.Handle?.trim()
    if (!handle) continue
    
    // Check if this is a new product or variant of existing
    let product = productMap.get(handle)
    
    if (!product) {
      // New product
      product = {
        handle,
        title: row.Title || handle,
        bodyHtml: row['Body (HTML)'] || '',
        vendor: row.Vendor || '',
        productCategory: row['Product Category'] || 'Uncategorized',
        type: row.Type || '',
        tags: row.Tags ? row.Tags.split(',').map(t => t.trim()).filter(t => t) : [],
        published: row.Published?.toLowerCase() === 'true',
        options: [],
        variants: [],
        images: [],
        seo: {
          title: row['SEO Title'] || '',
          description: row['SEO Description'] || '',
        },
        giftCard: row['Gift Card']?.toLowerCase() === 'true',
        status: (row.Status?.toLowerCase() || 'active') as 'active' | 'draft' | 'archived',
      }
      
      // Build options from Option1, Option2, Option3 names
      if (row['Option1 Name']) {
        product.options.push({ name: row['Option1 Name'], values: [] })
      }
      if (row['Option2 Name']) {
        product.options.push({ name: row['Option2 Name'], values: [] })
      }
      if (row['Option3 Name']) {
        product.options.push({ name: row['Option3 Name'], values: [] })
      }
      
      productMap.set(handle, product)
    }
    
    // Add variant
    const option1Value = row['Option1 Value']?.trim() || 'Default'
    const variant = {
      option1Value,
      option2Value: row['Option2 Value']?.trim() || undefined,
      option3Value: row['Option3 Value']?.trim() || undefined,
      sku: row['Variant SKU']?.replace(/^'/, '') || '', // Remove leading apostrophe
      grams: parseFloat(row['Variant Grams']) || 0,
      inventoryQty: parseInt(row['Variant Inventory Qty']) || 0,
      inventoryPolicy: (row['Variant Inventory Policy']?.toLowerCase() === 'continue' ? 'continue' : 'deny') as 'deny' | 'continue',
      price: parseFloat(row['Variant Price']) || 0,
      compareAtPrice: parseFloat(row['Variant Compare At Price']) || undefined,
      requiresShipping: row['Variant Requires Shipping']?.toLowerCase() !== 'false',
      taxable: row['Variant Taxable']?.toLowerCase() !== 'false',
      barcode: row['Variant Barcode']?.replace(/^'/, '') || undefined,
      image: row['Variant Image'] || undefined,
      weightUnit: row['Variant Weight Unit'] || 'kg',
      costPerItem: parseFloat(row['Cost per item']) || undefined,
    }
    
    // Only add variant if it has a price or is unique
    const existingVariant = product.variants.find(
      v => v.option1Value === variant.option1Value && 
           v.option2Value === variant.option2Value &&
           v.option3Value === variant.option3Value
    )
    
    if (!existingVariant) {
      product.variants.push(variant)
      
      // Update option values
      if (product.options[0] && option1Value && !product.options[0].values.includes(option1Value)) {
        product.options[0].values.push(option1Value)
      }
      if (product.options[1] && variant.option2Value && !product.options[1].values.includes(variant.option2Value)) {
        product.options[1].values.push(variant.option2Value)
      }
      if (product.options[2] && variant.option3Value && !product.options[2].values.includes(variant.option3Value)) {
        product.options[2].values.push(variant.option3Value)
      }
    }
    
    // Add image if present and unique
    const imageSrc = row['Image Src']?.trim()
    if (imageSrc && !product.images.find(img => img.src === imageSrc)) {
      product.images.push({
        src: imageSrc,
        position: parseInt(row['Image Position']) || product.images.length + 1,
        altText: row['Image Alt Text'] || '',
      })
    }
  }
  
  // Filter out products with no valid variants
  return Array.from(productMap.values()).filter(p => p.variants.length > 0)
}

// Parse CSV and return preview
export async function parseShopifyCSV(csvContent: string): Promise<ImportResult> {
  try {
    const rows = parseCSV(csvContent)
    
    if (rows.length === 0) {
      return { success: false, message: 'CSV file is empty or invalid' }
    }
    
    const products = convertToProducts(rows)
    
    if (products.length === 0) {
      return { success: false, message: 'No valid products found in CSV' }
    }
    
    return {
      success: true,
      message: `Found ${products.length} products with ${rows.length} total variant rows`,
      products,
    }
  } catch (error) {
    console.error('CSV Parse error:', error)
    return { success: false, message: 'Failed to parse CSV file' }
  }
}

// Import products to database
export async function importProducts(products: ParsedProduct[], overwriteExisting: boolean = false): Promise<ImportResult> {
  try {
    await connectDb()
    
    let imported = 0
    let skipped = 0
    const errors: string[] = []
    
    for (const product of products) {
      try {
        // Check if product exists
        const existingProduct = await Product.findOne({ handle: product.handle })
        
        if (existingProduct) {
          if (overwriteExisting) {
            // Update existing product
            await Product.updateOne(
              { handle: product.handle },
              {
                $set: {
                  title: product.title,
                  bodyHtml: product.bodyHtml,
                  vendor: product.vendor,
                  productCategory: product.productCategory,
                  type: product.type,
                  tags: product.tags,
                  published: product.published,
                  options: product.options,
                  variants: product.variants,
                  images: product.images,
                  seo: product.seo,
                  giftCard: product.giftCard,
                  status: product.status,
                }
              }
            )
            imported++
          } else {
            skipped++
          }
        } else {
          // Create new product
          await Product.create({
            handle: product.handle,
            title: product.title,
            bodyHtml: product.bodyHtml,
            vendor: product.vendor,
            productCategory: product.productCategory,
            type: product.type,
            tags: product.tags,
            published: product.published,
            options: product.options,
            variants: product.variants,
            images: product.images,
            seo: product.seo,
            giftCard: product.giftCard,
            status: product.status,
            fulfillmentService: 'manual',
            inventoryTracker: 'shopify',
            isDeleted: false,
          })
          imported++
        }
      } catch (error: any) {
        errors.push(`${product.handle}: ${error.message}`)
      }
    }
    
    return {
      success: true,
      message: `Import complete: ${imported} imported, ${skipped} skipped`,
      imported,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
    }
  } catch (error: any) {
    console.error('Import error:', error)
    return { success: false, message: error.message || 'Import failed' }
  }
}

// Delete all products (for testing)
export async function deleteAllProducts(): Promise<ImportResult> {
  try {
    await connectDb()
    const result = await Product.deleteMany({})
    return {
      success: true,
      message: `Deleted ${result.deletedCount} products`,
    }
  } catch (error: any) {
    return { success: false, message: error.message || 'Delete failed' }
  }
}
