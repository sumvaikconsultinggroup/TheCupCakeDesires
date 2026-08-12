/**
 * Custom Dress Cake enquiry — princess styles, shared price, flavour choice.
 */
export const CUSTOM_DRESS_CAKE_PRICE = 150

export const CUSTOM_DRESS_CAKE_STYLES = [
  'Barbie dress cake',
  'Elsa dress cake',
  'Anna dress cake',
  'Rapunzel dress cake',
  'Cinderella dress cake',
  'Aurora dress cake',
  'Jasmine dress cake',
  'Something else (tell us below)',
] as const

export const CUSTOM_DRESS_CAKE_FLAVOURS = ['Vanilla', 'Chocolate'] as const

export type CustomDressCakeStyle = (typeof CUSTOM_DRESS_CAKE_STYLES)[number]
export type CustomDressCakeFlavour = (typeof CUSTOM_DRESS_CAKE_FLAVOURS)[number]
