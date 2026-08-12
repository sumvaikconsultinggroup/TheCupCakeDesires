import { Metadata } from 'next'
import CustomDressCakeClient from './CustomDressCakeClient'

export const metadata: Metadata = {
  title: 'Custom Dress Cake Enquiry | The Cupcake Desire',
  description:
    'Design a princess dress cake — Barbie, Elsa, Anna, Rapunzel, Cinderella, Aurora or Jasmine. Choose Vanilla or Chocolate, add notes and a photo, and we’ll send a quote. From $150.',
  alternates: { canonical: '/custom-dress-cake' },
  openGraph: {
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
