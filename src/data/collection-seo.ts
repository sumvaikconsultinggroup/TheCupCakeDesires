/**
 * Search-intent copy for collection pages: keyword-first titles, meta
 * descriptions and a short, accurate intro rendered in the server HTML.
 *
 * These take precedence over the per-collection SEO fields in the admin
 * (which held generic "X | The Cupcake Desire Melbourne" titles). Facts here
 * must match the shipping / refund / allergen policies; prices are NOT written
 * here — the page states them from the live products (see collectionFaq).
 */

export interface CollectionSeo {
  /** <title> before the brand suffix; aim for ≤ 40 characters. */
  title: string
  /** Meta description, ≤ 160 characters. */
  description: string
  /** Heading for the intro block, e.g. "Birthday cupcakes, delivered across Melbourne". */
  heading: string
  intro: string[]
  /** Short noun used in generated Q&As, e.g. "birthday cupcakes". */
  noun: string
}

const ORDERING =
  'Everything is baked to order in our Narre Warren kitchen and hand-delivered on weekdays across Melbourne Metro — order before noon for delivery the next weekday.'
const DIETARY = 'Every flavour has an eggless alternative, and we bake separate vegan and gluten-free ranges.'

const occasion = (
  noun: string,
  title: string,
  description: string,
  heading: string,
  lead: string
): CollectionSeo => ({
  noun,
  title,
  description,
  heading,
  intro: [
    `${lead} Our themed box of 12 comes decorated for the occasion in assorted flavours, and you can round it out with a mini cupcake box of 24 or a few of our standard and deluxe flavours.`,
    `${ORDERING} ${DIETARY} Want to choose every flavour yourself? Use the build-your-own box and add a message.`,
  ],
})

export const COLLECTION_SEO: Record<string, CollectionSeo> = {
  'birthday-cupcakes': occasion(
    'birthday cupcakes',
    'Birthday Cupcakes Delivered in Melbourne',
    'Birthday cupcakes baked to order and delivered across Melbourne. Themed boxes of 12, minis and custom boxes. Eggless, vegan & gluten-free options.',
    'Birthday cupcakes, delivered across Melbourne',
    'Colourful, hand-frosted birthday cupcakes make the party — for kids, grown-ups or a surprise at the office.'
  ),
  'wedding-cupcakes': {
    noun: 'wedding cupcakes',
    title: 'Wedding Cupcakes Melbourne',
    description:
      'Wedding cupcakes and cupcake tiers baked to order in Narre Warren for Melbourne weddings. Eggless, vegan & gluten-free options. Enquire early.',
    heading: 'Wedding cupcakes for Melbourne celebrations',
    intro: [
      'Hand-frosted wedding cupcakes are an easy, elegant alternative to a traditional cake: every guest gets their own, there is no cutting, and you can mix flavours for different tastes. Order a themed box of 12 for smaller celebrations, or enquire about a wedding cupcake tier for the main table.',
      `${ORDERING} Weddings typically need about a week’s notice so we can plan baking and delivery — get in touch early with your date and guest numbers. ${DIETARY}`,
    ],
  },
  'anniversary-cupcakes': occasion(
    'anniversary cupcakes',
    'Anniversary Cupcakes Melbourne',
    'Anniversary cupcakes baked to order and delivered across Melbourne — a sweet surprise for a partner, parents or friends. Eggless & vegan options.',
    'Anniversary cupcakes, delivered in Melbourne',
    'Mark the years with a box of hand-frosted anniversary cupcakes — for your partner, your parents or friends celebrating a milestone.'
  ),
  'gender-reveal-cupcakes': occasion(
    'gender reveal cupcakes',
    'Gender Reveal Cupcakes Melbourne',
    'Gender reveal cupcakes with a hidden pink or blue centre, baked to order and delivered across Melbourne. Eggless, vegan & gluten-free options.',
    'Gender reveal cupcakes for your big moment',
    'Our gender reveal cupcakes keep the secret under pink-and-blue swirled frosting until the first bite.'
  ),
  'baby-girl-cupcakes': occasion(
    'baby girl cupcakes',
    'Baby Girl & Baby Shower Cupcakes',
    'Pink baby girl cupcakes for baby showers and new arrivals, baked to order and delivered across Melbourne. Eggless, vegan & gluten-free options.',
    'Baby girl cupcakes for showers and new arrivals',
    'Welcome a new little one with baby girl cupcakes finished in pink baby-shower decorations.'
  ),
  'baby-boy-cupcakes': occasion(
    'baby boy cupcakes',
    'Baby Boy & Baby Shower Cupcakes',
    'Blue baby boy cupcakes for baby showers and new arrivals, baked to order and delivered across Melbourne. Eggless, vegan & gluten-free options.',
    'Baby boy cupcakes for showers and new arrivals',
    'Celebrate a new arrival with baby boy cupcakes finished in blue baby-shower decorations.'
  ),
  'baby-neutral-cupcakes': occasion(
    'baby shower cupcakes',
    'Baby Shower Cupcakes Melbourne',
    'Baby shower cupcakes in pink and blue, baked to order and delivered across Melbourne. Themed boxes of 12 and minis. Eggless & vegan options.',
    'Baby shower cupcakes in pink and blue',
    'Not finding out yet, or celebrating twins? Our baby-neutral cupcakes mix pink and blue baby-shower decorations in one box.'
  ),
  'valentines-day-cupcakes': occasion(
    "Valentine's Day cupcakes",
    "Valentine's Day Cupcakes Melbourne",
    "Valentine's Day cupcakes baked to order and delivered across Melbourne — heart-topped boxes of 12 and minis. Eggless & vegan options.",
    "Valentine's Day cupcakes, delivered",
    'Say it with heart-topped cupcakes — delivered to their door or desk on Valentine’s Day.'
  ),
  'i-love-u-cupcakes': occasion(
    'I love you cupcakes',
    'I Love You Cupcakes Delivered',
    'I Love You cupcakes baked to order and delivered across Melbourne — a sweet way to say it any day. Eggless, vegan & gluten-free options.',
    'Say “I love you” with cupcakes',
    'Some things are easier said with buttercream. Our I Love You cupcakes spell it out for anniversaries, apologies or just because.'
  ),
  'mothers-day-cupcakes': occasion(
    "Mother's Day cupcakes",
    "Mother's Day Cupcakes Melbourne",
    "Mother's Day cupcakes baked to order and delivered across Melbourne. Themed boxes of 12, minis and custom boxes. Eggless & vegan options.",
    "Mother's Day cupcakes, delivered to Mum",
    'Put a smile on Mum’s face with a box of hand-frosted Mother’s Day cupcakes.'
  ),
  'fathers-day-cupcakes': occasion(
    "Father's Day cupcakes",
    "Father's Day Cupcakes Melbourne",
    "Father's Day cupcakes baked to order and delivered across Melbourne. Themed boxes of 12, minis and custom boxes. Eggless & vegan options.",
    "Father's Day cupcakes, delivered to Dad",
    'Treat Dad like a king with a box of hand-frosted Father’s Day cupcakes.'
  ),
  'christmas-cupcakes': occasion(
    'Christmas cupcakes',
    'Christmas Cupcakes Melbourne',
    'Christmas cupcakes for parties and gifts, baked to order and delivered across Melbourne. Themed boxes of 12 and minis. Eggless & vegan options.',
    'Christmas cupcakes for parties and gifts',
    'Festive Christmas cupcakes for the office party, a family lunch or a thoughtful gift.'
  ),
  'easter-cupcakes': occasion(
    'Easter cupcakes',
    'Easter Cupcakes Melbourne',
    'Easter cupcakes baked to order and delivered across Melbourne — themed boxes of 12, minis and custom boxes. Eggless, vegan & gluten-free options.',
    'Easter cupcakes, delivered in Melbourne',
    'Bring some Easter-bunny spirit to the table with themed Easter cupcakes.'
  ),
  'diwali-cupcakes': occasion(
    'Diwali cupcakes',
    'Diwali Cupcakes Melbourne',
    'Diwali cupcakes for the festival of lights, baked to order and delivered across Melbourne. Every flavour available eggless. Vegan options too.',
    'Diwali cupcakes for the festival of lights',
    'Celebrate the festival of lights with Diwali cupcakes — and because every flavour has an eggless alternative, they suit every guest at the table.'
  ),
  'australia-day-cupcakes': occasion(
    'Australia Day cupcakes',
    'Australia Day Cupcakes Melbourne',
    'Australia Day cupcakes baked to order and delivered across Melbourne — themed boxes of 12, minis and custom boxes. Eggless & vegan options.',
    'Australia Day cupcakes for the barbie',
    'Have the mates around and bring out the Australia Day cupcakes.'
  ),
  'sorry-cupcakes': occasion(
    'sorry cupcakes',
    'Sorry Cupcakes Delivered in Melbourne',
    'Sorry cupcakes baked to order and delivered across Melbourne — an apology that is hard to stay mad at. Eggless, vegan & gluten-free options.',
    'Say sorry with cupcakes',
    'Stuffed up? A box of sorry cupcakes delivered to the door is an apology that is hard to stay mad at.'
  ),
  'thank-u-cupcakes': occasion(
    'thank you cupcakes',
    'Thank You Cupcakes Delivered',
    'Thank you cupcakes for teachers, clients and friends, baked to order and delivered across Melbourne. Eggless, vegan & gluten-free options.',
    'Thank you cupcakes, delivered',
    'When words alone don’t cover it, thank you cupcakes do — for teachers, clients, colleagues and friends.'
  ),
  'standard-cupcakes': {
    noun: 'standard cupcakes',
    title: 'Classic Cupcakes Melbourne',
    description:
      'Classic hand-frosted cupcakes — red velvet, chocolate, vanilla, mocha, coconut and more. Baked to order, delivered across Melbourne.',
    heading: 'Our classic cupcake flavours',
    intro: [
      'Our standard range is where it all started: red velvet, chocolate chocolate, vanilla vanilla, chocolate vanilla, vanilla chocolate, vanilla strawberry, chocolate peppermint, mocha and coconut. Each is sold by the cupcake with a minimum of three, so you can order a single flavour or mix several.',
      `${ORDERING} ${DIETARY}`,
    ],
  },
  'deluxe-cupcakes': {
    noun: 'deluxe cupcakes',
    title: 'Deluxe Gourmet Cupcakes Melbourne',
    description:
      'Deluxe cupcakes — salted caramel, rocky road, molten chocolate, hazelnut and more, plus vegan and gluten-free. Delivered across Melbourne.',
    heading: 'Deluxe cupcakes, finished with extras',
    intro: [
      'Our deluxe flavours are bigger and richer, finished with extras like ganache drips, caramel and toppings: salted caramel, rocky road, molten chocolate, M&M, hazelnut heaven and cookies n cream. The range also includes a gluten-free red velvet and a vegan, gluten-free chocolate vanilla.',
      `Deluxe cupcakes are sold by the cupcake with a minimum of three. ${ORDERING}`,
    ],
  },
  'mini-cupcakes': {
    noun: 'mini cupcakes',
    title: 'Mini Cupcakes Melbourne – Boxes of 24',
    description:
      'Mini cupcakes in boxes of 24 — assorted, red velvet, chocolate, vanilla and M&M. Baked to order and delivered across Melbourne.',
    heading: 'Mini cupcakes for parties and meetings',
    intro: [
      'Two dozen bite-sized cupcakes in a box — ideal for parties, morning teas and meetings where guests want a taste of everything. Choose assorted, or a single flavour such as red velvet, chocolate chocolate, vanilla vanilla, M&M, or our chocolate and vanilla bases.',
      `${ORDERING} ${DIETARY} Need them branded? See our mini corporate cupcakes.`,
    ],
  },
  macarons: {
    noun: 'macarons',
    title: 'Macarons Delivered in Melbourne',
    description:
      'French macarons in boxes of 12 — salted caramel, strawberry, chocolate or assorted. Delivered on weekdays across Melbourne.',
    heading: 'Macarons, a dozen at a time',
    intro: [
      'Crisp shells and soft centres in boxes of 12: choose salted caramel, strawberry, chocolate or an assorted box. Macarons pair beautifully with a cupcake order for gifts and dessert tables.',
      `${ORDERING} Our kitchen handles nuts, so please contact us before ordering if you have an allergy.`,
    ],
  },
  cakes: {
    noun: 'cakes',
    title: 'Cake Delivery Melbourne – Round Cakes',
    description:
      'Round cakes in 6" and 8" — chocolate, red velvet, salted caramel, cookies & cream and more — plus drip and custom birthday cakes. Melbourne delivery.',
    heading: 'Cakes, baked to order and delivered',
    intro: [
      'Our round cakes come in 6" and 8": chocolate chocolate, molten chocolate, red velvet, salted caramel, cookies & cream and vanilla vanilla. For something taller there is the drip cake, and for a one-off design, send us a custom birthday cake enquiry.',
      'Cakes need three days’ notice. They are delivered on weekdays across Melbourne Metro from our Narre Warren kitchen, and eggless versions are available.',
    ],
  },
  'special-occasion-cakes': {
    noun: 'occasion cakes',
    title: 'Occasion Cakes Melbourne',
    description:
      "Christmas, Easter, Mother's Day and Valentine's Day cakes, hand-piped and baked to order. Delivered across Melbourne from Narre Warren.",
    heading: 'Cakes for the big days of the year',
    intro: [
      'Hand-piped cakes dressed for the calendar’s big days: a Christmas tree cake, Easter cakes, a Mother’s Day cake with buttercream roses and a Valentine’s Day cake piled with rosettes.',
      'Cakes need three days’ notice and are delivered on weekdays across Melbourne Metro. Order early for busy holidays.',
    ],
  },
  'dress-cakes': {
    noun: 'dress cakes',
    title: 'Princess Dress Cakes Melbourne',
    description:
      'Princess dress cakes — Elsa, Belle, Ariel and more — in vanilla or chocolate. Baked to order for birthdays and delivered across Melbourne.',
    heading: 'Princess dress cakes for birthdays',
    intro: [
      'A tall doll cake dressed in a buttercream gown — Elsa, Belle, Ariel and more — in vanilla or chocolate. Want a different princess or colours? Use the custom dress cake enquiry and we will quote.',
      'Cakes need three days’ notice and are delivered on weekdays across Melbourne Metro from our Narre Warren kitchen.',
    ],
  },
  'giant-cupcakes': {
    noun: 'giant cupcakes',
    title: 'Giant Cupcakes Melbourne – Serves 20',
    description:
      'Giant cupcakes that serve about 20 — red velvet, chocolate, vanilla and deluxe flavours. A cake alternative, delivered across Melbourne.',
    heading: 'Giant cupcakes: the cake alternative',
    intro: [
      'One show-stopping cupcake that serves around 20 — piled high with hand-piped buttercream in red velvet, chocolate, vanilla or our deluxe flavours (salted caramel, hazelnut heaven, molten chocolate, cookies and cream).',
      `${ORDERING} Eggless versions are available.`,
    ],
  },
  'deluxe-giant-cupcakes': {
    noun: 'deluxe giant cupcakes',
    title: 'Deluxe Giant Cupcakes – Serves 20',
    description:
      'Deluxe giant cupcakes — salted caramel, hazelnut heaven, molten chocolate, cookies and cream — each serves about 20. Melbourne delivery.',
    heading: 'Deluxe giant cupcakes',
    intro: [
      'Our most indulgent giants, each serving around 20: salted caramel, hazelnut heaven, molten chocolate and cookies and cream, finished with piped buttercream and deluxe toppings.',
      `${ORDERING} Our kitchen handles nuts — please contact us first if you have an allergy.`,
    ],
  },
  'cake-slices': {
    noun: 'cake slices',
    title: 'Cake Slices Catering Melbourne',
    description:
      'Cake slice catering boxes of 12, 36, 50 and 100 — caramel, lemon, rocky road, cheesecake and more. Baked to order, delivered across Melbourne.',
    heading: 'Cake slice catering boxes',
    intro: [
      'Catering boxes of 12, 36, 50 or 100 slices for meetings, morning teas and events: carrot cake, lemon, rocky road, raspberry jelly cheesecake, chocolate caramel with Mars or Tim Tam, toffee honeycomb with Golden Gaytime, white chocolate with Tim Tam, or a mixed box.',
      `${ORDERING} Larger orders may need longer notice — contact us and we will confirm. Need your logo on them? See corporate cake slices.`,
    ],
  },
  'gift-voucher': {
    noun: 'gift vouchers',
    title: 'Cupcake Gift Vouchers',
    description:
      'Cupcake Desire gift vouchers in $25, $50 and $100 — redeemable on cupcakes, cakes and macarons delivered across Melbourne.',
    heading: 'Gift vouchers for cupcake lovers',
    intro: [
      'Not sure what they’d pick? A gift voucher in $25, $50 or $100 lets them choose — redeemable on the whole range for delivery across Melbourne Metro.',
    ],
  },
}
