import { Metadata } from 'next'
import { DEFAULT_OG_IMAGE } from '@/lib/site-url'
import CustomDressCakeClient from './CustomDressCakeClient'

export const metadata: Metadata = {
  title: 'Custom Dress Cake Enquiry | The Cupcake Desire',
  description:
    'Design a princess dress cake — Barbie, Elsa, Rapunzel, Cinderella and more. Pick Vanilla or Chocolate, add a photo and notes, and we’ll quote. From $150.',
  alternates: { canonical: '/custom-dress-cake' },
  openGraph: {
    images: [DEFAULT_OG_IMAGE],
    title: 'Custom Dress Cake Enquiry | The Cupcake Desire',
    description:
      'Hand-piped princess dress cakes baked to order in Narre Warren. Pick a style and flavour, or share your own idea with a photo.',
    url: 'https://thecupcakedesire.com.au/custom-dress-cake',
    type: 'website',
  },
}

export default function CustomDressCakePage() {
  return <CustomDressCakeClient />
}
