import { NextResponse } from 'next/server'

export async function GET() {
  const csvContent = `product_handle,customer_name,email,rating,title,content,image_url,verified,created_at
chocolate-cupcakes,Sarah Mitchell,sarah@example.com,5,Absolutely divine!,The chocolate cupcakes were moist and rich — perfect for my daughter's birthday party. Will order again!,https://example.com/review-image1.jpg,true,2024-01-15
vanilla-birthday-cake,James Wilson,james@example.com,4,Beautiful and tasty,Lovely vanilla cake with gorgeous buttercream. Arrived fresh and on time.,,,2024-01-20
red-velvet-cupcakes,Emma Chen,emma@example.com,5,Best red velvet ever!,Cream cheese frosting was spot on. These disappeared in minutes at our office morning tea.,https://example.com/review-image2.jpg,false,2024-02-01
lemon-drizzle-loaf,Michael O'Brien,mike@example.com,3,Good but a touch sweet,Lovely lemon flavour and moist crumb. Would prefer slightly less icing next time.,,true,2024-02-10
custom-wedding-cake,Lisa & Tom,lisa@example.com,5,Dream wedding cake!,CupCake Desires created exactly what we envisioned. Guests are still talking about it!,https://example.com/review-image3.jpg,true,2024-02-15`

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="reviews-sample.csv"',
    },
  })
}
