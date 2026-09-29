/**
 * Blog guides linked from the shop pages they support. Most posts were only
 * linked from /blogs, so Google treated them as low-priority orphans; these
 * links pass relevance both ways (guide ↔ the page that sells it).
 */
export interface Guide {
  href: string
  title: string
}

const G = {
  orderOnline: { href: '/blogs/order-cupcakes-online-melbourne', title: 'How to order cupcakes online: a checklist before you pay' },
  chooseRight: { href: '/blogs/cupcake-delivery-melbourne-choose-right-cupcakes', title: 'How to choose cupcakes for your occasion' },
  bestForDelivery: { href: '/blogs/best-cupcakes-delivery-melbourne', title: 'Best cupcake flavours for every occasion' },
  bestShopsCbd: { href: '/blogs/best-cupcake-shops-in-melbourne-cbd', title: 'Best cupcake shops in Melbourne CBD' },
  spring: { href: '/blogs/spring-cupcake-ideas-melbourne', title: 'Spring cupcake ideas in Melbourne' },
  birthdayIdeas: { href: '/blogs/birthday-party-ideas-melbourne', title: 'Birthday party ideas in Melbourne' },
  veganBirthday: { href: '/blogs/best-vegan-cakes-in-melbourne-for-birthdays', title: 'Best vegan cakes in Melbourne for birthdays' },
  giftingIdeas: { href: '/blogs/corporate-gifting-ideas', title: 'Corporate gifting ideas that build relationships' },
  logoBrand: { href: '/blogs/how-corporate-logo-cupcakes-strengthen-brand-recognition', title: 'How logo cupcakes strengthen brand recognition' },
  employeeGifts: { href: '/blogs/employee-appreciation-gift-ideas-that-leave-a-lasting-impression', title: 'Employee appreciation gift ideas' },
  milestones: { href: '/blogs/how-to-celebrate-team-milestones-at-work', title: 'How to celebrate team milestones at work' },
  veganOffice: { href: '/blogs/corporate-vegan-cupcakes-for-melbourne-offices', title: 'Corporate vegan cupcakes for Melbourne offices' },
  veganCelebrations: { href: '/blogs/creating-memorable-office-celebrations-with-vegan-treats', title: 'Office celebrations with vegan treats' },
  nutFree: { href: '/blogs/nut-free-cupcakes-vs-nut-free-cakes', title: 'Nut-free cupcakes vs nut-free cakes' },
  glutenFree: { href: '/blogs/where-to-buy-gluten-free-cupcakes', title: 'Where to buy gluten-free cupcakes' },
} satisfies Record<string, Guide>

/** Keyed by page path. */
export const RELATED_GUIDES: Record<string, Guide[]> = {
  '/collections/all-items': [G.orderOnline, G.chooseRight, G.bestForDelivery, G.bestShopsCbd, G.spring],
  '/collections/all-cupcakes': [G.bestForDelivery, G.chooseRight, G.bestShopsCbd],
  '/collections/birthday-cupcakes': [G.birthdayIdeas, G.chooseRight, G.veganBirthday],
  '/collections/wedding-cupcakes': [G.chooseRight, G.bestForDelivery],
  '/collections/mini-cupcakes': [G.chooseRight, G.milestones],
  '/collections/cakes': [G.veganBirthday, G.birthdayIdeas],
  '/collections/cake-slices': [G.milestones, G.employeeGifts],
  '/collections/standard-cupcakes': [G.bestForDelivery, G.orderOnline],
  '/collections/deluxe-cupcakes': [G.bestForDelivery, G.spring],
  '/corporate': [G.giftingIdeas, G.logoBrand, G.employeeGifts, G.milestones, G.veganOffice, G.veganCelebrations],
  '/branded-cupcakes-melbourne': [G.logoBrand, G.giftingIdeas, G.employeeGifts],
  '/cupcake-catering': [G.milestones, G.employeeGifts, G.veganCelebrations, G.chooseRight],
  '/eggless-cupcakes': [G.orderOnline, G.chooseRight],
  '/vegan-cupcakes': [G.veganOffice, G.veganCelebrations, G.veganBirthday],
  '/vegan-cakes': [G.veganBirthday, G.veganOffice],
  '/gluten-free-cupcakes': [G.glutenFree, G.orderOnline],
  '/nut-free-cakes': [G.nutFree, G.birthdayIdeas],
}
