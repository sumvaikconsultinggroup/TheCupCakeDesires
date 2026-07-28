export interface CupcakeFlavourCount {
  name: string
  quantity: number
  image?: string
}

export const CUPCAKE_BUILDER_IMAGES: Record<string, string> = {
  'vanilla vanilla': '/images/cupcake-builder/vanilla-vanilla.webp',
  'chocolate chocolate': '/images/cupcake-builder/chocolate-chocolate.webp',
  'red velvet': '/images/cupcake-builder/red-velvet.webp',
  'chocolate vanilla': '/images/cupcake-builder/chocolate-vanilla.webp',
  'chocolate peppermint': '/images/cupcake-builder/chocolate-pepermint.webp',
  'vanilla chocolate': '/images/cupcake-builder/vanilla-chocolate.webp',
  'vanilla strawberry': '/images/cupcake-builder/vanilla-strawberry.webp',
  coconut: '/images/cupcake-builder/coconut.webp',
  mocha: '/images/cupcake-builder/mocha.webp',
  'salted caramel': '/images/cupcake-builder/salted-caramel.jpg',
  'hazelnut heaven': '/images/cupcake-builder/hazelnut-heaven.jpg',
  'cookies n cream': '/images/cupcake-builder/cookies-n-cream.jpg',
  'cookies and cream': '/images/cupcake-builder/cookies-n-cream.jpg',
  'rocky road': '/images/cupcake-builder/rocky-road.jpg',
  'molten chocolate': '/images/cupcake-builder/molten-chocolate.jpg',
  'm n m': '/images/cupcake-builder/m-n-m.jpg',
  mnm: '/images/cupcake-builder/m-n-m.jpg',
  'vegan chocolate vanilla': '/images/cupcake-builder/vegan-chocolate-vanilla.jpg',
  'gluten free red velvet': '/images/cupcake-builder/gluten-free-red-velvet.jpg',
  'white chocolate with tim tam slice': '/images/cake-slice/white-chocolate-with-tim-tam.png',
  'chocolate caramel with mars slice': '/images/cake-slice/chocolate-caramel-with-mars.png',
  'chocolate caramel with tim tam slice': '/images/cake-slice/chocolate-caramel-with-tim-tam.png',
  'rocky road slice': '/images/cake-slice/rocky-road.png',
  'lemon slice': '/images/cake-slice/lemon-slice.png',
  'carrot cake slice': '/images/cake-slice/carrot.png',
  'raspberry jelly cheesecake slice': '/images/cake-slice/raspberry-jelly-cheesecake.png',
  'toffee honeycomb with golden gaytime slice': '/images/cake-slice/toffee-honeycomb-with-golden-gaytime.png',
}

export const CAKE_SLICE_BUILDER_OPTIONS = [
  {
    name: 'White Chocolate with Tim Tam Slice',
    blurb: 'Creamy white chocolate slice with crushed Tim Tam on a biscuit base',
  },
  {
    name: 'Chocolate Caramel with Mars Slice',
    blurb: 'Chocolate and caramel layers studded with Mars Bar pieces',
  },
  {
    name: 'Chocolate Caramel with Tim Tam Slice',
    blurb: 'Chocolate caramel slice with crushed Tim Tam crunch',
  },
  {
    name: 'Rocky Road Slice',
    blurb: 'Rich chocolate, marshmallow, jelly and nuts',
  },
  {
    name: 'Lemon Slice',
    blurb: 'Tangy lemon icing on a coconut biscuit base',
  },
  {
    name: 'Carrot Cake Slice',
    blurb: 'Spiced carrot cake finished with cream cheese frosting',
  },
  {
    name: 'Raspberry Jelly Cheesecake Slice',
    blurb: 'Baked cheesecake with raspberry jelly on a biscuit base',
  },
  {
    name: 'Toffee Honeycomb with Golden Gaytime Slice',
    blurb: 'Toffee honeycomb slice with Golden Gaytime crumb',
  },
] as const

export function normalizeCupcakeFlavourName(name: string) {
  return String(name || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\bn['’`-]?/g, 'n ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

export function getCupcakeBuilderImage(name: string) {
  const normalized = normalizeCupcakeFlavourName(name)
  return CUPCAKE_BUILDER_IMAGES[normalized]
}

export function parseCupcakeContents(contents?: string): CupcakeFlavourCount[] {
  if (!contents) return []

  return String(contents)
    .split(/\s*(?:\||·|Â·|;|,)\s*/g)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part): CupcakeFlavourCount | null => {
      const match = part.match(/^(\d+)\s*(?:x|×|Ã—|\*)\s*(.+)$/i)
      if (!match) return null

      const quantity = Number.parseInt(match[1], 10)
      const name = match[2].trim()
      if (!Number.isFinite(quantity) || quantity <= 0 || !name) return null

      return {
        name,
        quantity,
        image: getCupcakeBuilderImage(name),
      }
    })
    .filter((item): item is CupcakeFlavourCount => Boolean(item))
}
