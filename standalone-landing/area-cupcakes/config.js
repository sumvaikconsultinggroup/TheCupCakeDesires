/**
 * R U OK? Day Cupcakes — campaign landing page config.
 * Change areaName / postcode / utm for each suburb ad.
 * Deploy this folder alone (not part of the main website).
 */
window.LANDING_CONFIG = {
  areaName: 'Narre Warren',
  postcode: '3805',
  deliveryLabel: 'Hand-delivered across Greater Melbourne',

  siteUrl: 'https://thecupcakedesire.com.au',

  /** Primary CTA — the R U OK? Day product page */
  shopCtaUrl: 'https://thecupcakedesire.com.au/products/box-of-12-ruok-day-cupcakes',

  /** Secondary — bulk / corporate enquiry */
  corporateCtaUrl: 'https://thecupcakedesire.com.au/corporate',

  phone: '03 9705 0051',
  phoneTel: '+61397050051',
  email: 'hello@thecupcakedesire.com.au',

  utm: {
    source: 'google',
    medium: 'cpc',
    campaign: 'ruok-day-narre-warren',
  },

  heroImage: './images/ruok-day.jpeg',
  logoImage: './images/logo.png',

  sizes: [
    { qty: '12', price: '66' },
    { qty: '30', price: '150' },
    { qty: '50', price: '240' },
    { qty: '100', price: '450' },
    { qty: '200', price: '840' },
    { qty: '300', price: '1,200' },
    { qty: '500', price: '1,750' },
  ],

  flavours: ['Vanilla', 'Chocolate', 'Mix of Both'],
}
