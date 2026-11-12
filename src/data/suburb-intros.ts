/**
 * Suburb delivery page intros (GSC content 12 Nov 2026).
 * Slot A = intro under the live lead; Slot B = localHeading + localBody.
 * localBody uses RichParagraph [label](/path) markdown links.
 */

export type SuburbIntro = {
  intro: string
  localHeading: string
  localBody: string
}

export const SUBURB_INTROS: Record<string, SuburbIntro> = {
  'clayton-south': {
    intro:
      'Clayton South is part of the City of Kingston and sits in our near delivery zone, so delivery to 3169 is $9.95, and free on orders over $100. Order by 12 noon for next-weekday delivery. We hand-deliver to homes and workplaces in Clayton South on weekdays, generally between 9am and 3pm. If the order is for a workplace, add the building name and who should receive it in your order notes.',
    localHeading: 'Sending cupcakes around Clayton South',
    localBody:
      'For a team morning tea or a birthday at home, a [birthday box of 12](/collections/birthday-cupcakes) suits a small group, and [mini cupcake boxes of 24](/collections/mini-cupcakes) suit a meeting where people graze. Sending to more than one address nearby? [Clayton](/cupcake-delivery/clayton), [Keysborough](/cupcake-delivery/keysborough) and [Mulgrave](/cupcake-delivery/mulgrave) each have their own page with their fee.',
  },
  clayton: {
    intro:
      "Clayton is in our near delivery zone, so delivery to 3168 is $9.95, and free on orders over $100. Order by 12 noon for next-weekday delivery. We deliver Monday to Friday, generally between 9am and 3pm, and we can't guarantee a timed slot. For a weekend party in Clayton, choose Friday delivery.",
    localHeading: 'Choosing a Clayton order',
    localBody:
      "Choose every flavour yourself in a [build your own box](/cupcake-builder), or go for a themed [birthday box](/collections/birthday-cupcakes). Want a whole cake instead? Browse our [round cakes](/collections/cakes). Cakes need 3 days' notice. Ordering for Clayton South instead? See the [Clayton South](/cupcake-delivery/clayton-south) page for that postcode.",
  },
  'glen-waverley': {
    intro:
      'Glen Waverley is in the City of Monash and in our near delivery zone, so delivery to 3150 is $9.95, and free on orders over $100. Order by 12 noon for next-weekday delivery. If you are catering for different diets, every flavour we bake comes in an eggless version, we bake a dedicated vegan range, and we have gluten-free options too.',
    localHeading: 'Eggless, vegan and gluten-free orders in Glen Waverley',
    localBody:
      'Ask for [eggless cupcakes](/eggless-cupcakes) in your order notes, or choose from our [vegan range](/vegan-cupcakes) and [gluten-free cupcakes](/gluten-free-cupcakes). Everything is made in a shared kitchen that also handles nuts, gluten, dairy, eggs, soy and sesame, so it is not suitable for severe allergies or coeliac disease. Please read our [allergen information](/allergen-info) before you order.',
  },
  berwick: {
    intro:
      "Berwick is in the City of Casey, and delivery to 3806 is $9.95, or free on orders over $100. Planning a celebration cake for Berwick? Cakes need 3 days' notice, so book your date early. Cupcakes can come sooner. Order by 12 noon for next-weekday delivery. We hand-deliver on weekdays only, generally between 9am and 3pm, so for a weekend event choose Friday delivery.",
    localHeading: 'Cakes and cupcakes for Berwick celebrations',
    localBody:
      'Choose a [round cake](/collections/cakes) for the candles, or a [birthday box of 12](/collections/birthday-cupcakes) so every guest gets their own. Planning for a larger party? Contact us with your date and numbers first, because larger or custom orders need longer notice. We also deliver to [Hallam](/cupcake-delivery/hallam) and [Endeavour Hills](/cupcake-delivery/endeavour-hills).',
  },
  cranbourne: {
    intro:
      'Cranbourne is in the City of Casey, and delivery to 3977 is $9.95, or free on orders over $100. Order by 12 noon for next-weekday delivery. We hand-deliver to Cranbourne homes and workplaces on weekdays, generally between 9am and 3pm. For a school event or a work function, send us your date and numbers early, because larger orders need longer notice.',
    localHeading: 'Larger orders for Cranbourne events',
    localBody:
      'For a crowd, choose [mini cupcake boxes of 24](/collections/mini-cupcakes), and for a work event our [corporate cupcakes](/corporate) can carry your logo on edible discs. Add the venue and a contact name in your order notes so the delivery reaches the right person. We also deliver to [Hampton Park](/cupcake-delivery/hampton-park) and [Berwick](/cupcake-delivery/berwick).',
  },
  'chirnside-park': {
    intro:
      "Chirnside Park is in the Shire of Yarra Ranges and in our extended delivery zone, so delivery to 3116 is $19.95, and free on orders over $100. Order by 12 noon for next-weekday delivery. We hand-deliver on weekdays, generally between 9am and 3pm, and we can't guarantee a timed slot, so choose a delivery day when someone will be home or at reception.",
    localHeading: 'Making an extended zone delivery worth it',
    localBody:
      "Delivery is free on orders over $100, so it can make sense to put a cake and cupcakes in one order. Cakes need 3 days' notice. If you are sending to more than one Melbourne address, contact us before you order and we will confirm what is possible. We also deliver to [Lilydale](/cupcake-delivery/lilydale) and [Croydon](/cupcake-delivery/croydon).",
  },
  beaumaris: {
    intro:
      'Beaumaris is in the City of Bayside and in our extended delivery zone, so delivery to 3193 is $19.95, and free on orders over $100. Order by 12 noon for next-weekday delivery. Sending cupcakes as a gift to someone in Beaumaris? Choose a weekday when they will be home, because we hand-deliver on weekdays only, generally between 9am and 3pm.',
    localHeading: 'Gift boxes for Beaumaris',
    localBody:
      'A [birthday box of 12](/collections/birthday-cupcakes), or a box you [build yourself](/cupcake-builder) in the flavours they like, makes a simple gift. For a weekend birthday, choose Friday delivery. Also sending to Sandringham? See the [Sandringham](/cupcake-delivery/sandringham) page for that postcode and its fee.',
  },
}
