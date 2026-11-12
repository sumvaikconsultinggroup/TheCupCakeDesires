/**
 * /products/corporate-cupcakes Slot 2 product details (GSC content 12 Nov 2026 §4.9).
 * Headings + paragraphs with RichParagraph [label](/path) markdown links.
 */

export type CorporateCupcakesProductSection = {
  heading: string
  body: string
}

export const CORPORATE_CUPCAKES_PRODUCT_DETAILS: {
  sections: CorporateCupcakesProductSection[]
  closing: string
} = {
  sections: [
    {
      heading: 'Ordering this box online',
      body: 'Choose a box of 12, 30, 50, 100, 200, 300 or 500 cupcakes, then pick Vanilla, Chocolate or Mix of Both. Upload up to 4 logos as PNG, JPG or WEBP files (max 4MB), and we print each logo on edible discs and mix them across your cupcakes. Every cupcake is baked to order and hand frosted with soft buttercream.',
    },
    {
      heading: 'Delivery for offices and events',
      body: 'Order by 12 noon for next-weekday delivery. We hand-deliver across Melbourne Metro on weekdays, generally between 9am and 3pm. Delivery is free on orders over $100, and Outside Metro delivery is by quote. Larger corporate orders may need longer notice, so [contact us](/contact) with your date and numbers before you order.',
    },
    {
      heading: 'Dietary options',
      body: 'Every flavour we bake comes in an eggless version, and we also have a [dedicated vegan range](/vegan-cupcakes) and [gluten-free options](/gluten-free-cupcakes). Everything is made in a shared kitchen that also handles nuts, gluten, dairy, eggs, soy and sesame, so it is not suitable for severe allergies or coeliac disease.',
    },
  ],
  closing:
    'Want bite-size cupcakes for a standing event? See [mini corporate cupcakes](/corporate/mini). To see how logo printing works, read about [branded cupcakes](/branded-cupcakes-melbourne).',
}
