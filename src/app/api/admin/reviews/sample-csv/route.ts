import { NextResponse } from 'next/server'

export async function GET() {
  // Sample CSV content with headers and example rows
  const csvContent = `product_handle,customer_name,email,rating,title,content,image_url,verified,created_at
whey-protein-chocolate,John Doe,john@example.com,5,Amazing Product!,This protein powder is fantastic. Great taste and mixes well. Definitely recommend!,https://example.com/review-image1.jpg,true,2024-01-15
creatine-monohydrate,Jane Smith,jane@example.com,4,Good Quality,Solid creatine supplement. Works as expected. Packaging could be better.,,,2024-01-20
mass-gainer-vanilla,Mike Johnson,mike@example.com,5,Best Mass Gainer,Gained 5kg in 2 months. Excellent product for bulking.,https://example.com/review-image2.jpg,false,2024-02-01
bcaa-watermelon,Sarah Williams,sarah@example.com,3,Decent Taste,The BCAA does the job but taste could be improved. Still using it though.,,true,2024-02-10
pre-workout-orange,Chris Brown,chris@example.com,5,Incredible Energy,Best pre-workout I've ever used. Clean energy without jitters!,https://example.com/review-image3.jpg,true,2024-02-15`

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="reviews-sample.csv"'
    }
  })
}
