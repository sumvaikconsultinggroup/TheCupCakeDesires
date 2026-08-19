/**
 * Corporate cupcakes — standalone ad landing page.
 * Edit areaName / utm per campaign. Deploy this folder alone.
 */
window.LANDING_CONFIG = {
  areaName: 'Melbourne',
  deliveryLabel: 'Hand-delivered across Greater Melbourne',

  siteUrl: 'https://thecupcakedesire.com.au',
  corporateUrl: 'https://thecupcakedesire.com.au/corporate',
  miniUrl: 'https://thecupcakedesire.com.au/corporate/mini',
  slicesUrl: 'https://thecupcakedesire.com.au/corporate/cake-slices',
  quoteUrl: 'https://thecupcakedesire.com.au/corporate',

  phone: '03 9705 0051',
  phoneTel: '+61397050051',
  email: 'hello@thecupcakedesire.com.au',

  utm: {
    source: 'google',
    medium: 'cpc',
    campaign: 'corporate-melbourne',
  },

  logoImage: './images/logo.png',
  heroImage: './images/corporate-3.png',

  stats: [
    { value: '500+', label: 'Companies served' },
    { value: '120k', label: 'Cupcakes / year' },
    { value: '24h', label: 'Quote turnaround' },
    { value: '4.9★', label: 'Corporate reviews' },
  ],

  products: {
    standard: {
      title: 'Corporate Cupcakes',
      tagline: 'Standard size · edible logos',
      occasion: 'Office celebrations',
      blurb: 'Full-size cupcakes with your logo on every swirl — launches, thank-yous, all-hands.',
      hrefKey: 'corporate',
      image: './images/corporate-3.png',
      flavours: ['Vanilla', 'Chocolate', 'Mix of Both'],
      sizes: [
        { qty: '12', price: '66' },
        { qty: '30', price: '150' },
        { qty: '50', price: '240' },
        { qty: '100', price: '450' },
        { qty: '200', price: '840' },
        { qty: '300', price: '1,200' },
        { qty: '500', price: '1,750' },
      ],
    },
    mini: {
      title: 'Mini Corporate',
      tagline: 'Bite-size · branded toppers',
      occasion: 'Networking trays',
      blurb: 'One-bite branded minis — easy to pass, hard to forget, perfect for mixers.',
      hrefKey: 'mini',
      image: './images/minis.jpeg',
      flavours: ['Vanilla', 'Chocolate', 'Mix of Both'],
      sizes: [
        { qty: '24', price: '84' },
        { qty: '100', price: '330' },
        { qty: '300', price: '900' },
        { qty: '500', price: '1,400' },
      ],
    },
    slices: {
      title: 'Corporate Cake Slices',
      tagline: 'Premium slices · logo optional',
      occasion: 'Boardroom tables',
      blurb: 'Signature cake slices for meetings that deserve more than a biscuit tin.',
      hrefKey: 'slices',
      image: './images/slice-rocky.png',
      flavours: [
        'White Chocolate Tim Tam',
        'Chocolate Caramel Mars',
        'Rocky Road',
        'Lemon',
        'Carrot Cake',
        'Raspberry Jelly Cheesecake',
        'Toffee Honeycomb Golden Gaytime',
        'Mix (all flavours)',
      ],
      sizes: [
        { qty: '12', price: '84' },
        { qty: '36', price: '234' },
        { qty: '50', price: '300' },
        { qty: '100', price: '550' },
      ],
    },
  },
}
