import type { FaqItem } from '@/lib/product-faq'

export type MelbournePage = {
  slug: string
  title: string
  description: string
  eyebrow: string
  heading: string
  breadcrumb: string
  intro: string[]
  sections: { heading: string; body: string[] }[]
  faqs: FaqItem[]
  productHandles: string[]
  productsHeading: string
  links: { href: string; label: string }[]
}

const DELIVERY =
  'We bake to order in Narre Warren and hand-deliver on weekdays across the Melbourne suburbs on our delivery list. Order before noon for the next weekday. We do not deliver on weekends, and we do not offer same-day delivery.'

const DIET =
  'Every flavour has an eggless alternative. Vegan and gluten-free cakes are separate ranges, so tell us before you order.'

const ENQUIRY =
  'Character and one-off designs are quoted. Use the custom dress-cake form or contact us with the date, servings and a photo of the look you want. Cakes need three days’ notice. Weddings and large corporate orders need longer notice.'

function page(entry: MelbournePage): MelbournePage {
  return entry
}

export const MELBOURNE_PAGES: MelbournePage[] = [
  page({
    slug: 'bluey-cake',
    title: 'Bluey Cake Melbourne | Custom Birthday Cakes',
    description:
      'Custom Bluey-style birthday cakes and matching cupcakes, baked to order in Narre Warren and delivered on weekdays across Melbourne.',
    eyebrow: 'Kids’ birthdays',
    heading: 'Bluey cakes, made to order in Melbourne',
    breadcrumb: 'Bluey cake',
    intro: [
      'A Bluey cake is usually a blue buttercream cake with the heeler puppies children recognise, sized for a kids’ party. We design that as a custom cake, plus a box of cupcakes in the same colours if the whole class is coming.',
      `${ENQUIRY} ${DELIVERY}`,
    ],
    sections: [
      {
        heading: 'What to send with a Bluey cake enquiry',
        body: [
          'Tell us how many people you are feeding, whether you want a round cake, a giant cupcake or cupcakes as well, and the date of the party. A photo of the pose you like is enough. We are not the official maker of the television characters, so the cake is a custom likeness in your colours.',
          DIET,
        ],
      },
    ],
    faqs: [
      {
        question: 'Can you make a Bluey birthday cake in Melbourne?',
        answer:
          'Yes, as a custom cake. Send the date, servings and a reference photo. We quote from the Narre Warren kitchen and deliver on a weekday.',
      },
      {
        question: 'Can I add Bluey cupcakes to the cake?',
        answer: 'Yes. A themed box of 12 cupcakes can travel with the cake so there is enough for the party.',
      },
    ],
    productHandles: ['custom-birthday-cake', 'box-of-12-birthday-cupcakes', 'elsa-blue-dress-cake'],
    productsHeading: 'Cakes and cupcakes that work with a kids’ party',
    links: [
      { href: '/melbourne/kids-birthday-cakes', label: 'Kids birthday cakes' },
      { href: '/custom-dress-cake', label: 'Custom dress cake' },
      { href: '/collections/birthday-cupcakes', label: 'Birthday cupcakes' },
      { href: '/melbourne/elsa-frozen-cake', label: 'Elsa cake' },
    ],
  }),
  page({
    slug: 'rainbow-cake',
    title: 'Rainbow Cake Melbourne | Layer Cakes & Cupcakes',
    description:
      'Rainbow layer cakes and rainbow cupcakes baked to order in Melbourne. Weekday delivery from our Narre Warren kitchen. Eggless on request.',
    eyebrow: 'Colour',
    heading: 'Rainbow cakes and cupcakes in Melbourne',
    breadcrumb: 'Rainbow cake',
    intro: [
      'A rainbow cake hides bands of colour under white or pastel buttercream, or piles the colour on top with swirls and sprinkles. We bake rainbow layer cakes to order, and we also do rainbow-topped cupcakes when you want a box instead of slices.',
      `${DELIVERY} ${DIET}`,
    ],
    sections: [
      {
        heading: 'Rainbow layer cake or rainbow cupcakes',
        body: [
          'Choose a layer cake when the table needs a centrepiece that is cut. Choose cupcakes when guests are moving around and you do not want a cake knife. Both can be vanilla or chocolate sponge.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Do you deliver rainbow birthday cakes in Melbourne?',
        answer: 'Yes, on weekdays. Cakes need three days’ notice. Order before noon and the earliest delivery is the next weekday.',
      },
      {
        question: 'Can a rainbow cake be eggless?',
        answer: 'Yes. Ask for the eggless version when you order.',
      },
    ],
    productHandles: ['custom-birthday-cake', 'vanilla-vanilla-round-cake', 'box-of-12-birthday-cupcakes'],
    productsHeading: 'Start with these',
    links: [
      { href: '/melbourne/colour-cakes', label: 'Pink, purple and yellow cakes' },
      { href: '/melbourne/unicorn-cake', label: 'Unicorn cakes' },
      { href: '/collections/cakes', label: 'All cakes' },
    ],
  }),
  page({
    slug: 'smash-cakes',
    title: 'Smash Cakes Melbourne | First Birthday',
    description:
      'Small smash cakes for a first birthday, baked to order in Melbourne. A cake the baby can pull apart, plus cupcakes for the adults. Weekday delivery.',
    eyebrow: 'First birthdays',
    heading: 'Smash cakes for a first birthday in Melbourne',
    breadcrumb: 'Smash cakes',
    intro: [
      'A smash cake is a small cake a baby can sit with and pull apart for photos. It is not the cake the adults eat. We bake a plain, softly frosted smash cake in the colour of the party, and a separate box of cupcakes for everyone else.',
      `${DELIVERY} Tell us the session date. Smash cakes are still cakes, so allow three days.`,
    ],
    sections: [
      {
        heading: 'How a smash cake is different',
        body: [
          'Keep it small, one or two layers, with frosting that will not stain too darkly if you are worried about clothes. Skip nuts and hard lollies on the baby’s cake. The grown-up cupcakes can be as decorated as you like.',
          'We do not run cake-smash photo sessions. We bake the cake and deliver it.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Do you make smash cakes in Melbourne?',
        answer: 'Yes. They are custom small cakes. Contact us with the date and colour.',
      },
      {
        question: 'How do I make a smash cake at home?',
        answer:
          'A four-inch vanilla sponge, a thin coat of buttercream and no hard decorations is the usual home version. Our guide walks through the steps, or we can bake it.',
      },
    ],
    productHandles: ['custom-birthday-cake', 'vanilla-vanilla-round-cake', 'box-of-12-baby-neutral-cupcakes'],
    productsHeading: 'Pair the smash cake with cupcakes',
    links: [
      { href: '/blogs/how-to-make-a-smash-cake', label: 'How to make a smash cake' },
      { href: '/melbourne/baby-shower', label: 'Baby shower cupcakes' },
      { href: '/melbourne/birthday-cakes', label: 'Birthday cakes' },
    ],
  }),
  page({
    slug: 'barbie-doll-cake',
    title: 'Barbie Doll Cake Melbourne | Dress Cakes',
    description:
      'Barbie-style doll cakes and dress cakes in Melbourne. Buttercream gowns, baked to order, with cupcakes in the same colours. Weekday delivery.',
    eyebrow: 'Dress cakes',
    heading: 'Barbie doll cakes and dress cakes',
    breadcrumb: 'Barbie doll cake',
    intro: [
      'A doll cake is a tall cake with a doll at the centre and a buttercream gown. We already bake Elsa, Belle and Ariel dress cakes, and we quote other gown colours, including pink Barbie-style dresses, as a custom order.',
      `${ENQUIRY}`,
    ],
    sections: [
      {
        heading: 'Ready-made gowns and custom colours',
        body: [
          'If the party is blue, yellow or aqua, start with the Elsa, Belle or Ariel cakes already on the menu. For pink, or a different doll, send the enquiry with the date and a photo.',
          DIET,
        ],
      },
    ],
    faqs: [
      {
        question: 'Can you make a Barbie birthday cake?',
        answer: 'Yes, as a custom dress cake. Pink buttercream gowns are quoted to the date and size.',
      },
      {
        question: 'Do you sell the doll as well?',
        answer: 'The cake is built around a doll. Confirm on the enquiry whether you are supplying the doll or we are.',
      },
    ],
    productHandles: ['elsa-blue-dress-cake', 'belle-yellow-dress-cake', 'ariel-aqua-dress-cake', 'custom-birthday-cake'],
    productsHeading: 'Dress cakes on the menu',
    links: [
      { href: '/custom-dress-cake', label: 'Custom dress cake enquiry' },
      { href: '/melbourne/elsa-frozen-cake', label: 'Elsa cake' },
      { href: '/collections/dress-cakes', label: 'All dress cakes' },
    ],
  }),
  page({
    slug: 'elsa-frozen-cake',
    title: 'Elsa Cake Melbourne | Frozen Dress Cakes',
    description:
      'Elsa dress cakes and Frozen-blue cupcakes in Melbourne. The Elsa blue dress cake is on the menu. Weekday delivery from Narre Warren.',
    eyebrow: 'Dress cakes',
    heading: 'Elsa and Frozen cakes in Melbourne',
    breadcrumb: 'Elsa cake',
    intro: [
      'The Elsa blue dress cake is a doll cake in a blue buttercream gown, in vanilla or chocolate. It is the cake to order when the party is Frozen and you want the gown, not only blue frosting.',
      'Anna-and-Elsa combinations, or a second cake, are a custom enquiry. Matching blue cupcakes can go in the same delivery.',
    ],
    sections: [
      {
        heading: 'Cake, cupcakes, or both',
        body: [
          `${DELIVERY} ${DIET}`,
          'Dress cakes need three days. If the party is on a Monday, order by the previous Wednesday.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Do you sell an Elsa frozen doll cake?',
        answer: 'Yes. The Elsa blue dress cake is a menu item. Other Frozen scenes are quoted.',
      },
      {
        question: 'Can I get Elsa cupcakes as well?',
        answer: 'Yes. Add a box of cupcakes in blue and white and we deliver them with the cake.',
      },
    ],
    productHandles: ['elsa-blue-dress-cake', 'box-of-12-birthday-cupcakes', 'giant-cupcake-vanilla-vanilla-aqua'],
    productsHeading: 'Elsa cake and party cupcakes',
    links: [
      { href: '/custom-dress-cake', label: 'Custom dress cake' },
      { href: '/melbourne/barbie-doll-cake', label: 'Barbie doll cakes' },
      { href: '/collections/dress-cakes', label: 'Dress cakes' },
    ],
  }),
  page({
    slug: 'minecraft-cake',
    title: 'Minecraft Cake Melbourne | Custom Birthday Cakes',
    description:
      'Minecraft-style birthday cakes and cupcakes in Melbourne, built to order with block colours and grass-green frosting. Weekday delivery.',
    eyebrow: 'Kids’ birthdays',
    heading: 'Minecraft cakes and cupcakes',
    breadcrumb: 'Minecraft cake',
    intro: [
      'Minecraft cakes are usually square-looking rounds covered in green, brown and grey buttercream, sometimes with a fondant pickaxe or creeper face. We make those as custom cakes, and we pipe the same colours onto cupcakes when you need one for every child.',
      `${ENQUIRY} We are not an official Minecraft bakery. The design follows your photo.`,
    ],
    sections: [
      {
        heading: 'Cupcakes when the cake will not stretch',
        body: [
          'A single cake serves the table. A box of 12 or a mini box of 24 covers the rest of the party without cutting into the decorated top.',
          DELIVERY,
        ],
      },
    ],
    faqs: [
      {
        question: 'Can you make a Minecraft birthday cake in Melbourne?',
        answer: 'Yes, to order. Send the date, how many it should serve, and whether you want cupcakes as well.',
      },
    ],
    productHandles: ['custom-birthday-cake', 'box-of-12-birthday-cupcakes', 'box-of-24-assorted-mini-cupcakes'],
    productsHeading: 'Party cakes and boxes',
    links: [
      { href: '/melbourne/kids-birthday-cakes', label: 'Kids birthday cakes' },
      { href: '/melbourne/dinosaur-cake', label: 'Dinosaur cakes' },
      { href: '/collections/birthday-cupcakes', label: 'Birthday cupcakes' },
    ],
  }),
  page({
    slug: 'unicorn-cake',
    title: 'Unicorn Cake Melbourne | Birthday Cakes & Cupcakes',
    description:
      'Unicorn birthday cakes and unicorn cupcakes in Melbourne. Pastel horns, rainbow manes and matching boxes, baked to order.',
    eyebrow: 'Kids’ birthdays',
    heading: 'Unicorn cakes in Melbourne',
    breadcrumb: 'Unicorn cake',
    intro: [
      'Unicorn cakes are pastel buttercream, a horn, ears and a rainbow mane. We build them as custom round cakes or as a giant cupcake, and we do the same pastel swirl on a box of cupcakes.',
      DELIVERY,
    ],
    sections: [
      {
        heading: 'Sizes',
        body: [
          'A 6-inch round is a small family cake. An 8-inch feeds a larger table. A giant cupcake serves about 20 and still looks like one cupcake. For more than that, add a box of 12.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Do you deliver unicorn birthday cakes?',
        answer: 'Yes, on weekdays across Melbourne Metro, with three days’ notice for cakes.',
      },
    ],
    productHandles: ['custom-birthday-cake', 'vanilla-vanilla-round-cake', 'box-of-12-birthday-cupcakes'],
    productsHeading: 'Cakes you can build a unicorn order around',
    links: [
      { href: '/melbourne/rainbow-cake', label: 'Rainbow cakes' },
      { href: '/melbourne/kids-birthday-cakes', label: 'Kids cakes' },
      { href: '/collections/giant-cupcakes', label: 'Giant cupcakes' },
    ],
  }),
  page({
    slug: 'dinosaur-cake',
    title: 'Dinosaur Cake Melbourne | Cakes & Cupcakes',
    description:
      'Dinosaur birthday cakes and dinosaur cupcakes in Melbourne. Green buttercream and simple dinosaur toppers, baked to order.',
    eyebrow: 'Kids’ birthdays',
    heading: 'Dinosaur cakes and cupcakes',
    breadcrumb: 'Dinosaur cake',
    intro: [
      'Dinosaur parties want green frosting, a few spikes and room for the cake to be cut. We do that as a custom cake, or as dinosaur cupcakes when you would rather hand them out.',
      `${DELIVERY} ${DIET}`,
    ],
    sections: [
      {
        heading: 'Cupcakes for the loot-bag table',
        body: ['A box of 12 themed cupcakes sits next to the cake so the birthday child still has a whole cake for photos.'],
      },
    ],
    faqs: [
      {
        question: 'Can you make dinosaur cupcakes in Melbourne?',
        answer: 'Yes. Ask for green frosting and simple toppers on a box of 12, or send a photo for a custom cake.',
      },
    ],
    productHandles: ['box-of-12-birthday-cupcakes', 'custom-birthday-cake', 'box-of-24-assorted-mini-cupcakes'],
    productsHeading: 'Party boxes',
    links: [
      { href: '/melbourne/minecraft-cake', label: 'Minecraft cakes' },
      { href: '/melbourne/kids-birthday-cakes', label: 'Kids birthday cakes' },
    ],
  }),
  page({
    slug: 'bunny-cake',
    title: 'Bunny Cake Melbourne | Easter & Birthdays',
    description:
      'Bunny cakes for Easter and birthdays, plus Easter cupcakes, baked to order and delivered on weekdays across Melbourne.',
    eyebrow: 'Easter and birthdays',
    heading: 'Bunny cakes in Melbourne',
    breadcrumb: 'Bunny cake',
    intro: [
      'A bunny cake is a buttercream cake shaped or decorated as a rabbit, for Easter or for a birthday that happens to want ears. We also bake Easter cupcakes with the same pastel finish when a full cake is too much.',
      'Cakes need three days. Easter week fills up, so order earlier than the usual cutoff.',
    ],
    sections: [
      {
        heading: 'Easter cupcakes if you need a number',
        body: [`A box of 12 Easter cupcakes is the menu version. A sculpted bunny cake is quoted. ${DELIVERY}`],
      },
    ],
    faqs: [
      {
        question: 'Do you make bunny birthday cakes?',
        answer: 'Yes, as a custom cake. Send the date and whether it is Easter or a birthday.',
      },
    ],
    productHandles: ['box-of-12-easter-cupcakes', 'custom-birthday-cake', 'vanilla-vanilla-round-cake'],
    productsHeading: 'Easter and birthday bakes',
    links: [
      { href: '/collections/easter-cupcakes', label: 'Easter cupcakes' },
      { href: '/melbourne/birthday-cakes', label: 'Birthday cakes' },
    ],
  }),
  page({
    slug: 'heart-cake',
    title: 'Heart Cake Melbourne | Vintage Heart Cakes',
    description:
      'Heart cakes and vintage-style heart cakes in Melbourne, plus heart-topped cupcakes. Baked to order, weekday delivery.',
    eyebrow: 'Vintage and Valentine’s',
    heading: 'Heart cakes in Melbourne',
    breadcrumb: 'Heart cake',
    intro: [
      'Heart cakes are either a heart-shaped tin or a round cake finished with a vintage piping border and a few hearts. We bake both to order. For Valentine’s Day, a box of heart-topped cupcakes is already on the menu and is the faster order.',
      DELIVERY,
    ],
    sections: [
      {
        heading: 'Vintage piping',
        body: [
          'Vintage heart cakes take longer to pipe than a smooth round. Ask early in the week of the event. Red, pink and white are the usual colours. Other colours are fine if we have the notice.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Do you deliver vintage heart cakes in Melbourne?',
        answer: 'Yes, as a custom cake, on weekdays, with three days’ notice.',
      },
      {
        question: 'Is there a heart cake I can order without a quote?',
        answer: 'The Valentine’s cupcake box is a menu item. A piped heart cake is quoted.',
      },
    ],
    productHandles: ['box-of-12-valentines-day-cupcakes', 'custom-birthday-cake', 'vanilla-vanilla-round-cake'],
    productsHeading: 'Heart-topped cupcakes and cakes',
    links: [
      { href: '/collections/valentines-day-cupcakes', label: "Valentine's cupcakes" },
      { href: '/melbourne/colour-cakes', label: 'Pink cakes' },
    ],
  }),
  page({
    slug: 'sports-cakes',
    title: 'Soccer, Basketball & Football Cakes Melbourne',
    description:
      'Soccer cakes, basketball cakes and football cupcakes in Melbourne, including AFL boxes. Custom cakes and themed cupcakes, weekday delivery.',
    eyebrow: 'Sports parties',
    heading: 'Soccer, basketball and football cakes',
    breadcrumb: 'Sports cakes',
    intro: [
      'Sports cakes are usually a round cake iced like a pitch or court, or cupcakes with a ball on top. We quote the cake from a photo. AFL cupcakes are already a menu box if the party is football and you want cupcakes rather than a cake.',
      DELIVERY,
    ],
    sections: [
      {
        heading: 'Which one to order',
        body: [
          'Soccer and basketball cakes are custom. Football watch-alongs at the office are often the AFL cupcake box, which does not need a design quote.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Can you make a soccer birthday cake?',
        answer: 'Yes. Send the team colours, the date and how many it should serve.',
      },
      {
        question: 'Do you make basketball cupcakes?',
        answer: 'Yes, as themed cupcakes on a box of 12, or as a cake if you want a court on top.',
      },
    ],
    productHandles: ['box-of-12-afl-cupcakes', 'custom-birthday-cake', 'box-of-12-birthday-cupcakes'],
    productsHeading: 'Sports boxes and custom cakes',
    links: [
      { href: '/melbourne/kids-birthday-cakes', label: 'Kids birthday cakes' },
      { href: '/melbourne/birthday-cakes', label: 'Birthday cakes' },
    ],
  }),
  page({
    slug: 'colour-cakes',
    title: 'Pink, Purple & Yellow Birthday Cakes Melbourne',
    description:
      'Pink cakes, purple cakes and yellow birthday cakes in Melbourne. Buttercream colours matched to the party, baked to order.',
    eyebrow: 'Colour',
    heading: 'Pink, purple and yellow cakes',
    breadcrumb: 'Colour cakes',
    intro: [
      'Most “pink cake” and “purple cake” searches are a birthday cake in a single colour, smoothly finished or with a few flowers. We colour the buttercream to the party and bake a 6-inch or 8-inch round, or a giant cupcake in aqua, pink or blue from the menu.',
      `${DELIVERY} ${DIET}`,
    ],
    sections: [
      {
        heading: 'Menu colours and custom colours',
        body: [
          'Pink, blue and aqua giant cupcakes are on the menu. A specific pastel, or a two-tone pink and purple cake, is a short custom note on the order.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Can I order a pink birthday cake?',
        answer: 'Yes. Tell us the shade and the size. Three days’ notice for cakes.',
      },
    ],
    productHandles: ['giant-cupcake-vanilla-vanilla-pink', 'vanilla-vanilla-round-cake', 'belle-yellow-dress-cake'],
    productsHeading: 'Cakes that already come in colour',
    links: [
      { href: '/melbourne/rainbow-cake', label: 'Rainbow cakes' },
      { href: '/melbourne/heart-cake', label: 'Heart cakes' },
      { href: '/collections/cakes', label: 'All cakes' },
    ],
  }),
  page({
    slug: 'kids-birthday-cakes',
    title: 'Kids Birthday Cakes Melbourne',
    description:
      'Kids birthday cakes and cupcakes in Melbourne: dress cakes, themed cakes and boxes of 12. Baked to order, weekday delivery.',
    eyebrow: 'Birthdays',
    heading: 'Kids birthday cakes in Melbourne',
    breadcrumb: 'Kids birthday cakes',
    intro: [
      'Kids’ cakes in our kitchen are either a menu dress cake (Elsa, Belle, Ariel), a giant cupcake, or a custom cake from a photo. Cupcakes in a box of 12 cover the guests so the decorated cake survives until the song.',
      `${DELIVERY} ${DIET}`,
    ],
    sections: [
      {
        heading: 'Themes we are asked for',
        body: [
          'Bluey, Minecraft, dinosaurs, unicorns, Frozen and Barbie-style gowns are the usual photo briefs. Each has its own page with what is on the menu and what is quoted.',
        ],
      },
    ],
    faqs: [
      {
        question: 'What kids birthday cakes can I order online?',
        answer:
          'Dress cakes and giant cupcakes can be ordered from the product page. Photo-match themes are an enquiry with the date and servings.',
      },
    ],
    productHandles: ['elsa-blue-dress-cake', 'box-of-12-birthday-cupcakes', 'custom-birthday-cake', 'giant-cupcake-vanilla-vanilla-pink'],
    productsHeading: 'Kids’ party bakes',
    links: [
      { href: '/blogs/kids-birthday-cake-ideas-melbourne', label: 'Kids birthday cake ideas' },
      { href: '/melbourne/bluey-cake', label: 'Bluey cakes' },
      { href: '/melbourne/unicorn-cake', label: 'Unicorn cakes' },
      { href: '/bday-party', label: 'Birthday parties' },
    ],
  }),
  page({
    slug: 'birthday-cakes',
    title: 'Birthday Cakes Melbourne | Delivery',
    description:
      'Birthday cakes and birthday cupcakes delivered in Melbourne. Round cakes, giant cupcakes and themed boxes, baked to order in Narre Warren.',
    eyebrow: 'Birthdays',
    heading: 'Birthday cakes delivered in Melbourne',
    breadcrumb: 'Birthday cakes',
    intro: [
      'Birthday orders here are a round cake in 6 or 8 inch, a giant cupcake that serves about 20, a dress cake, or a box of 12 themed cupcakes. The cupcake box is the one you can check out without a quote. Cakes with a custom top are an enquiry.',
      `${DELIVERY} Cakes need three days. Cupcake boxes ordered before noon leave the next weekday.`,
    ],
    sections: [
      {
        heading: 'Cake or cupcakes',
        body: [
          'Order cupcakes when people will eat standing up. Order a cake when you want it cut at the table. Many parties do both.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Do you deliver birthday cakes in Melbourne?',
        answer: 'Yes, on weekdays, from Narre Warren. Check your suburb on the delivery page for the fee.',
      },
      {
        question: 'Can I get a birthday cake the same day?',
        answer: 'No. We do not offer same-day delivery. The earliest is the next weekday if you order before noon, and cakes need three days.',
      },
    ],
    productHandles: ['box-of-12-birthday-cupcakes', 'custom-birthday-cake', 'red-velvet-round-cake', 'vanilla-vanilla-round-cake'],
    productsHeading: 'Birthday cakes and boxes',
    links: [
      { href: '/collections/birthday-cupcakes', label: 'Birthday cupcakes' },
      { href: '/collections/cakes', label: 'Round cakes' },
      { href: '/melbourne/kids-birthday-cakes', label: 'Kids cakes' },
      { href: '/cupcake-delivery', label: 'Delivery suburbs' },
    ],
  }),
  page({
    slug: 'gender-reveal',
    title: 'Gender Reveal Cake & Cupcakes Melbourne',
    description:
      'Gender reveal cupcakes with a hidden pink or blue centre, delivered in Melbourne. Cakes quoted for the same party. Weekday delivery.',
    eyebrow: 'Baby',
    heading: 'Gender reveal cakes and cupcakes',
    breadcrumb: 'Gender reveal',
    intro: [
      'Our gender reveal cupcakes keep the colour inside the cake, under pink and blue swirled frosting, so the first bite is the reveal. A full gender reveal cake, cut at a party, is quoted the same way: the colour is in the centre, not on the outside.',
      DELIVERY,
    ],
    sections: [
      {
        heading: 'Cupcakes are the menu item',
        body: [
          'The box of 12 is ready to order. If you need a tall cake for a photo, contact us with the date. Do not assume a cupcake box and a cake can both be next-day. Cakes need three days.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Do you deliver gender reveal cakes in Melbourne?',
        answer: 'Cupcakes are on the menu. A reveal cake is a custom order with three days’ notice. Both are delivered on weekdays.',
      },
    ],
    productHandles: ['box-of-12-gender-reveal-cupcakes', 'box-of-12-baby-neutral-cupcakes', 'custom-birthday-cake'],
    productsHeading: 'Reveal cupcakes',
    links: [
      { href: '/collections/gender-reveal-cupcakes', label: 'Gender reveal cupcakes' },
      { href: '/melbourne/baby-shower', label: 'Baby shower' },
    ],
  }),
  page({
    slug: 'baby-shower',
    title: 'Baby Shower Cakes & Cupcakes Melbourne',
    description:
      'Baby shower cupcakes and cakes in Melbourne. Pink, blue or neutral boxes of 12, plus custom cakes. Weekday delivery.',
    eyebrow: 'Baby',
    heading: 'Baby shower cakes and cupcakes',
    breadcrumb: 'Baby shower',
    intro: [
      'Baby shower orders are usually a box of 12 in pink, blue, or pink and blue together. Those boxes are on the menu. A shower cake with flowers or bears on top is a custom cake with three days’ notice.',
      DELIVERY,
    ],
    sections: [
      {
        heading: 'Which box',
        body: [
          'Baby girl is pink. Baby boy is blue. Baby neutral mixes both, which is the one to order if you are not announcing a colour, or if you are having twins.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Do you deliver baby shower cupcakes in Melbourne?',
        answer: 'Yes. Boxes of 12, weekday delivery, order before noon for the next weekday.',
      },
    ],
    productHandles: ['box-of-12-baby-girl-cupcakes', 'box-of-12-baby-boy-cupcakes', 'box-of-12-baby-neutral-cupcakes'],
    productsHeading: 'Baby shower boxes',
    links: [
      { href: '/collections/baby-girl-cupcakes', label: 'Baby girl cupcakes' },
      { href: '/collections/baby-boy-cupcakes', label: 'Baby boy cupcakes' },
      { href: '/melbourne/gender-reveal', label: 'Gender reveal' },
    ],
  }),
  page({
    slug: 'red-velvet',
    title: 'Red Velvet Cake Melbourne | Delivery',
    description:
      'Red velvet cake and red velvet cupcakes in Melbourne. Cream-cheese buttercream, baked to order, weekday delivery. A gluten-free red velvet cupcake is on the menu.',
    eyebrow: 'Flavour',
    heading: 'Red velvet cake and cupcakes',
    breadcrumb: 'Red velvet',
    intro: [
      'Red velvet here is a cocoa-vanilla crumb with cream-cheese buttercream. Cupcakes are sold in threes. Round cakes come in 6 inch and 8 inch. There is also a gluten-free red velvet cupcake in the deluxe range.',
      `${DELIVERY} ${DIET}`,
    ],
    sections: [
      {
        heading: 'Cake or cupcakes',
        body: [
          'Order the cupcakes when you want a few. Order the round cake when you are cutting it. The gluten-free cupcake is a different bake from the standard one, made without gluten.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Where can I buy red velvet cake in Melbourne?',
        answer: 'From this kitchen, delivered on a weekday. There is no walk-in shop.',
      },
      {
        question: 'Is there a red velvet cupcake recipe?',
        answer: 'Yes, on the journal. The same flavour is also on the menu if you would rather not bake.',
      },
    ],
    productHandles: ['red-velvet-3-cupcakes', 'red-velvet-round-cake', 'gluten-free-red-velvet-3-cupcakes'],
    productsHeading: 'Red velvet on the menu',
    links: [
      { href: '/blogs/red-velvet-cupcake-recipe', label: 'Red velvet cupcake recipe' },
      { href: '/collections/standard-cupcakes', label: 'Classic cupcakes' },
      { href: '/collections/cakes', label: 'Cakes' },
    ],
  }),
  page({
    slug: 'chocolate-cupcakes',
    title: 'Chocolate Cupcakes Melbourne | Order Online',
    description:
      'Chocolate cupcakes with chocolate buttercream, baked to order in Melbourne. Sold in threes, with a chocolate round cake if you need slices.',
    eyebrow: 'Flavour',
    heading: 'Chocolate cupcakes, baked to order',
    breadcrumb: 'Chocolate cupcakes',
    intro: [
      'Chocolate chocolate cupcakes are chocolate sponge and chocolate buttercream, sold in threes so you can mix them with vanilla or red velvet. The same flavour exists as a 6-inch or 8-inch round cake.',
      `${DELIVERY} A home recipe is on the journal if you are baking a small batch yourself.`,
    ],
    sections: [
      {
        heading: 'Other chocolate finishes',
        body: [
          'Molten chocolate adds a ganache finish. Cookies and cream is the one with crushed cookie. Those sit in the deluxe range, still sold in threes.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Can I order chocolate cupcakes online in Melbourne?',
        answer: 'Yes. Minimum of three, weekday delivery, order before noon for the next weekday.',
      },
    ],
    productHandles: ['chocolate-chocolate-3-cupcakes', 'chocolate-chocolate-round-cake', 'molten-chocolate-3-cupcakes'],
    productsHeading: 'Chocolate bakes',
    links: [
      { href: '/blogs/chocolate-cupcake-recipe', label: 'Chocolate cupcake recipe' },
      { href: '/melbourne/vanilla-cupcakes', label: 'Vanilla cupcakes' },
      { href: '/collections/standard-cupcakes', label: 'Classic cupcakes' },
    ],
  }),
  page({
    slug: 'vanilla-cupcakes',
    title: 'Vanilla Cupcakes Melbourne | Order Online',
    description:
      'Vanilla cupcakes with vanilla buttercream, baked to order in Melbourne. Sold in threes. A vanilla round cake is there when you need slices.',
    eyebrow: 'Flavour',
    heading: 'Vanilla cupcakes',
    breadcrumb: 'Vanilla cupcakes',
    intro: [
      'Vanilla vanilla is vanilla sponge and vanilla buttercream. It is the base under most themed cakes, and it is sold on its own in threes. There is a fluffy vanilla recipe on the journal for people baking at home.',
      DELIVERY,
    ],
    sections: [
      {
        heading: 'Vanilla under a theme',
        body: [
          'Rainbow, unicorn and pastel cakes usually start as vanilla. If you only want the cupcakes, order them plain or ask for a colour on the frosting.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Do you sell moist vanilla cupcakes?',
        answer: 'Yes. They are baked to order, not kept in a display, so they are fresh on the delivery day.',
      },
    ],
    productHandles: ['vanilla-vanilla-3-cupcakes', 'vanilla-vanilla-round-cake', 'vanilla-strawberry-3-cupcakes'],
    productsHeading: 'Vanilla on the menu',
    links: [
      { href: '/blogs/vanilla-cupcake-recipe', label: 'Vanilla cupcake recipe' },
      { href: '/melbourne/chocolate-cupcakes', label: 'Chocolate cupcakes' },
    ],
  }),
  page({
    slug: 'cookies-and-cream-cupcakes',
    title: 'Cookies and Cream Cupcakes Melbourne',
    description:
      'Cookies and cream cupcakes and an Oreo-style round cake, baked to order in Melbourne. Weekday delivery. Recipe notes on the journal.',
    eyebrow: 'Flavour',
    heading: 'Cookies and cream cupcakes',
    breadcrumb: 'Cookies and cream',
    intro: [
      'Cookies and cream is chocolate sponge, cookies-and-cream buttercream and crushed cookie on top. Cupcakes come in threes. The round cake is the same idea, cut into slices.',
      'We do not sell a separate Oreo-branded product. The flavour is cookies and cream.',
    ],
    sections: [
      {
        heading: 'Recipe or order',
        body: [`The journal has a home method. The menu version is delivered. ${DELIVERY}`],
      },
    ],
    faqs: [
      {
        question: 'Can I buy cookies and cream cupcakes online?',
        answer: 'Yes, in threes, with weekday Melbourne delivery.',
      },
    ],
    productHandles: ['cookies-n-cream-3-cupcakes', 'cookies-cream-round-cake'],
    productsHeading: 'Cookies and cream',
    links: [
      { href: '/blogs/oreo-cupcakes-recipe', label: 'Cookies and cream cupcake recipe' },
      { href: '/collections/deluxe-cupcakes', label: 'Deluxe cupcakes' },
    ],
  }),
  page({
    slug: 'carrot-cake',
    title: 'Carrot Cake Melbourne | Slices & Catering',
    description:
      'Carrot cake slices for catering in Melbourne, in boxes from 12. We do not run a carrot-cake shopfront. Weekday delivery from Narre Warren.',
    eyebrow: 'Slices',
    heading: 'Carrot cake slices in Melbourne',
    breadcrumb: 'Carrot cake',
    intro: [
      'Carrot cake in this kitchen is a slice, sold for catering boxes, not a whole bakery counter of carrot cakes. Boxes run from 12 up to larger catering counts. A full round carrot cake is a custom enquiry, not a standing menu cake.',
      DELIVERY,
    ],
    sections: [
      {
        heading: 'What we do not bake',
        body: [
          'We do not sell jam donuts, and we are not a carrot-cake cafe. If you need carrot cake as finger food for an office, the slice box is the order.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Can I buy carrot cake online in Melbourne?',
        answer: 'Yes, as catering slices. Check the slice page for box sizes.',
      },
    ],
    productHandles: ['carrot-cake-slice'],
    productsHeading: 'Carrot cake slices',
    links: [
      { href: '/collections/cake-slices', label: 'Cake slices' },
      { href: '/corporate/cake-slices', label: 'Corporate cake slices' },
    ],
  }),
  page({
    slug: 'cookies',
    title: 'Custom Cookies in Melbourne? Cupcakes Instead',
    description:
      'We do not print custom cookies. For Melbourne dessert tables we bake cupcakes, macarons and cake slices to order, with weekday delivery.',
    eyebrow: 'What we bake',
    heading: 'Looking for custom cookies in Melbourne',
    breadcrumb: 'Cookies',
    intro: [
      'Searches for custom cookies, birthday cookies and personalised biscuits are looking for iced biscuits with names and logos. We do not make those. We do make the dessert that usually sits next to them: cupcakes, macarons and cake slices, with an edible logo on corporate cupcakes.',
      'If the brief is a company logo, start with branded cupcakes. If it is a birthday name, the cupcake builder takes a message.',
    ],
    sections: [
      {
        heading: 'R U OK and graduation',
        body: [
          'We have R U OK? Day cupcakes for offices. We do not have a cookie version of that campaign. Graduation and birthday messages go on cupcakes.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Do you sell custom cookies in Melbourne?',
        answer: 'No. We sell cupcakes, cakes, macarons and slices. Logo cupcakes cover most of the same events.',
      },
    ],
    productHandles: ['box-of-12-ruok-day-cupcakes', 'box-of-12-birthday-cupcakes', 'box-of-12-assorted-macarons'],
    productsHeading: 'What to order instead',
    links: [
      { href: '/branded-cupcakes-melbourne', label: 'Branded cupcakes' },
      { href: '/cupcake-builder', label: 'Build a box' },
      { href: '/collections/macarons', label: 'Macarons' },
    ],
  }),
  page({
    slug: 'drip-cakes',
    title: 'Drip Cakes Melbourne',
    description:
      'Drip cakes in Melbourne, including molten chocolate with a ganache drip. Custom colours quoted. Weekday delivery, three days’ notice.',
    eyebrow: 'Cakes',
    heading: 'Drip cakes',
    breadcrumb: 'Drip cakes',
    intro: [
      'A drip cake is a frosted round with a chocolate or coloured ganache drip down the side. Our molten chocolate round cake is the menu version, with a chocolate drip. Other drip colours are a custom note on a vanilla or chocolate cake.',
      'Cakes need three days. ' + DELIVERY,
    ],
    sections: [
      {
        heading: 'Chocolate drip without a quote',
        body: ['Order the molten chocolate round cake in 6 or 8 inch if the drip should be chocolate and you want it on the menu price.'],
      },
    ],
    faqs: [
      {
        question: 'Can you make a drip cake in another colour?',
        answer: 'Yes, as a custom cake. Tell us the drip colour and the sponge.',
      },
    ],
    productHandles: ['molten-chocolate-round-cake', 'chocolate-chocolate-round-cake', 'custom-birthday-cake'],
    productsHeading: 'Cakes with a ganache finish',
    links: [
      { href: '/collections/cakes', label: 'All cakes' },
      { href: '/melbourne/birthday-cakes', label: 'Birthday cakes' },
    ],
  }),
  page({
    slug: 'black-velvet-and-dot-cakes',
    title: 'Black Velvet & Polka Dot Cakes Melbourne',
    description:
      'Black velvet and polka-dot cakes are custom orders in Melbourne, not standing menu cakes. Red velvet and chocolate are ready to order.',
    eyebrow: 'Custom cakes',
    heading: 'Black velvet and dot cakes',
    breadcrumb: 'Black velvet and dot cakes',
    intro: [
      'We do not keep a black velvet cake or a polka-dot cake on the everyday menu. Both are custom finishes on a chocolate or vanilla sponge: a very dark crumb for black velvet, and piped dots for a dot cake.',
      'If you want red velvet specifically, that one is on the menu as cupcakes and as a round cake.',
    ],
    sections: [
      {
        heading: 'Notice',
        body: [`${ENQUIRY}`],
      },
    ],
    faqs: [
      {
        question: 'Do you sell black velvet cake?',
        answer: 'Only as a custom order. The dark red velvet and the chocolate cake are the menu equivalents.',
      },
    ],
    productHandles: ['red-velvet-round-cake', 'chocolate-chocolate-round-cake', 'custom-birthday-cake'],
    productsHeading: 'Closest menu cakes',
    links: [
      { href: '/melbourne/red-velvet', label: 'Red velvet' },
      { href: '/melbourne/custom-cakes', label: 'Custom cakes' },
    ],
  }),
  page({
    slug: 'gluten-free-cakes',
    title: 'Gluten Free Cakes Melbourne',
    description:
      'Gluten-free cupcakes and gluten-free birthday options in Melbourne. Macarons are not automatically gluten-free. Weekday delivery.',
    eyebrow: 'Dietary',
    heading: 'Gluten-free cakes in Melbourne',
    breadcrumb: 'Gluten-free cakes',
    intro: [
      'The gluten-free item on the everyday menu is the gluten-free red velvet cupcake. Other gluten-free cakes are discussed before you order, because they are baked away from the wheat sponges and we will only promise what we can separate.',
      'Macarons are made with almond meal, not wheat flour, but our kitchen is not a gluten-free facility. Read the macaron note before you treat them as gluten-free.',
    ],
    sections: [
      {
        heading: 'Cupcakes first',
        body: [
          'If a gluten-free cupcake is enough, order the red velvet gluten-free cupcakes and read the gluten-free cupcake page for how we handle the range.',
          DELIVERY,
        ],
      },
    ],
    faqs: [
      {
        question: 'Are your macarons gluten free?',
        answer:
          'They are made without wheat flour. The kitchen also handles wheat. If coeliac disease is the concern, read the macaron guide and contact us before ordering.',
      },
      {
        question: 'Do you deliver gluten-free birthday cake in Melbourne?',
        answer: 'Ask us for the date. The guaranteed gluten-free menu item is the red velvet cupcake.',
      },
    ],
    productHandles: ['gluten-free-red-velvet-3-cupcakes', 'box-of-12-assorted-macarons'],
    productsHeading: 'Gluten-free and macarons',
    links: [
      { href: '/gluten-free-cupcakes', label: 'Gluten-free cupcakes' },
      { href: '/blogs/are-macarons-gluten-free', label: 'Are macarons gluten free?' },
      { href: '/allergen-info', label: 'Allergens' },
    ],
  }),
  page({
    slug: 'vegan-cake-delivery',
    title: 'Vegan Cake Delivery Melbourne',
    description:
      'Vegan cake and vegan cupcake delivery in Melbourne. A vegan chocolate-vanilla cupcake is on the menu. Other vegan cakes are confirmed before baking.',
    eyebrow: 'Dietary',
    heading: 'Vegan cake delivery in Melbourne',
    breadcrumb: 'Vegan cake delivery',
    intro: [
      'Vegan orders are baked without egg or dairy, as their own range, not as a last-minute swap on a butter cake. The vegan chocolate-vanilla cupcake is the one you can add to a cart today. A vegan birthday cake is confirmed for the date before we promise it.',
      DELIVERY,
    ],
    sections: [
      {
        heading: 'Cupcakes while the cake is confirmed',
        body: [
          'Many tables mix one vegan box with the regular cupcakes. Keep them in the box they arrive in so they stay identifiable.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Do you deliver vegan birthday cakes in Melbourne?',
        answer: 'Yes, when we have confirmed the date. Start with the vegan cakes page or contact us. Delivery is weekdays only.',
      },
    ],
    productHandles: ['vegan-chocolate-vanilla-3-cupcakes'],
    productsHeading: 'Vegan cupcakes',
    links: [
      { href: '/vegan-cakes', label: 'Vegan cakes' },
      { href: '/vegan-cupcakes', label: 'Vegan cupcakes' },
      { href: '/cupcake-delivery', label: 'Delivery areas' },
    ],
  }),
  page({
    slug: 'custom-cakes',
    title: 'Custom Cakes & Cupcakes Melbourne',
    description:
      'Custom cakes and custom cupcakes in Melbourne. Photo briefs, colours and messages. Baked to order in Narre Warren, weekday delivery.',
    eyebrow: 'Custom',
    heading: 'Custom cakes and cupcakes',
    breadcrumb: 'Custom cakes',
    intro: [
      'Custom means we change the colour, the message, the toppers or the shape. A message on a standard box is the cupcake builder. A gown, a character or a drip in a special colour is an enquiry.',
      'We do not make custom iced cookies, donuts or jam donuts. If that is the whole order, we are the wrong bakery.',
    ],
    sections: [
      {
        heading: 'What to include',
        body: [`Date, suburb, servings, flavour, and a photo. ${ENQUIRY}`],
      },
    ],
    faqs: [
      {
        question: 'Can I order custom cupcakes in Melbourne?',
        answer: 'Yes. Use the builder for flavours and a message, or contact us for a logo or a full theme.',
      },
    ],
    productHandles: ['custom-birthday-cake', 'box-of-12-birthday-cupcakes'],
    productsHeading: 'Custom starting points',
    links: [
      { href: '/cupcake-builder', label: 'Build a box' },
      { href: '/custom-dress-cake', label: 'Dress cakes' },
      { href: '/melbourne/birthday-cakes', label: 'Birthday cakes' },
      { href: '/contact', label: 'Contact' },
    ],
  }),
  page({
    slug: 'cupcakes-near-me',
    title: 'Cupcakes Near Me in Melbourne | Delivered',
    description:
      'No shopfront. Cupcakes near you in Melbourne means weekday delivery from our Narre Warren kitchen. Check your suburb before you order.',
    eyebrow: 'Delivery',
    heading: 'Cupcakes near me, delivered',
    breadcrumb: 'Cupcakes near me',
    intro: [
      '“Cupcakes near me” usually means a shop you can walk into. We do not have one. The kitchen is at 352 Princes Hwy, Narre Warren, and it is not a counter. If your suburb is on the delivery list, we bring the box to you on a weekday.',
      'If it is not on the list, contact us before you pay. We would rather say no than take an order we cannot deliver.',
    ],
    sections: [
      {
        heading: 'Cakes near me, same answer',
        body: [
          'Round cakes, dress cakes and cupcakes all use that delivery list. The CBD is on it. Chadstone, Frankston, Werribee and Williamstown are not standard stops.',
          DELIVERY,
        ],
      },
    ],
    faqs: [
      {
        question: 'Is there a cupcake shop near me?',
        answer: 'Not this bakery. Order for delivery and check the suburb list.',
      },
      {
        question: 'Do you sell donuts?',
        answer: 'No. Cupcakes, cakes, macarons and slices only.',
      },
    ],
    productHandles: ['red-velvet-3-cupcakes', 'box-of-12-birthday-cupcakes', 'box-of-24-assorted-mini-cupcakes'],
    productsHeading: 'What gets delivered',
    links: [
      { href: '/cupcake-delivery', label: 'All delivery suburbs' },
      { href: '/melbourne/shopping-centre-cupcakes', label: 'Shopping-centre suburbs' },
      { href: '/cupcake-delivery/melbourne', label: 'Melbourne CBD delivery' },
    ],
  }),
  page({
    slug: 'same-day-cupcake-delivery',
    title: 'Same Day Cupcake Delivery Melbourne? No — Next Weekday',
    description:
      'The Cupcake Desire does not offer same-day cupcake or cake delivery in Melbourne. Order before noon for the next weekday.',
    eyebrow: 'Delivery',
    heading: 'Same-day cupcake delivery is not available',
    breadcrumb: 'Same-day delivery',
    intro: [
      'We do not offer same-day cupcake delivery, same-day cake delivery or same-day cookie delivery. Cakes are baked after the order, and the courier run is the next weekday when you order before noon. Orders after noon leave the weekday after that.',
      'If the party is today, we cannot help. If it is tomorrow and you are ordering in the morning, a cupcake box can make the next-weekday run. A custom cake cannot. Cakes need three days.',
    ],
    sections: [
      {
        heading: 'What “next day” means',
        body: [
          'Monday to Friday only. A Friday noon deadline delivers the following Monday, not Saturday. Public holidays are not delivery days.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Can I get cupcakes delivered today in Melbourne?',
        answer: 'No. The earliest is the next weekday after a noon order.',
      },
      {
        question: 'Can I get a birthday cake delivered the same day?',
        answer: 'No. Birthday cakes need three days, and delivery is still a weekday.',
      },
    ],
    productHandles: ['box-of-12-birthday-cupcakes', 'red-velvet-3-cupcakes'],
    productsHeading: 'Orders that can make the next weekday',
    links: [
      { href: '/shipping-policy', label: 'Delivery policy' },
      { href: '/cupcake-delivery', label: 'Suburbs and fees' },
    ],
  }),
  page({
    slug: 'cupcake-stands',
    title: 'Cupcake Stands | We Sell the Cupcakes, Not the Stand',
    description:
      'We do not sell acrylic or 3-tier cupcake stands. We bake the wedding and party cupcakes that go on them, delivered in Melbourne.',
    eyebrow: 'Weddings',
    heading: 'Cupcake stands are not in the shop',
    breadcrumb: 'Cupcake stands',
    intro: [
      'A cupcake stand, including a 3-tier acrylic stand, is a hire prop. We do not sell or hire stands. We bake the cupcakes that sit on one: wedding boxes, mini boxes of 24, and a wedding cupcake tier that is quoted to your guest count.',
      'If you need both the stand and the baking, hire the stand locally and order the cupcakes from us.',
    ],
    sections: [
      {
        heading: 'How many cupcakes',
        body: [
          'A rough guide is one and a half cupcakes a guest if cupcakes are the dessert, or one each if there is also a cake. The wedding guide goes through the numbers.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Do you sell a 3 tier cupcake stand?',
        answer: 'No. We sell the cupcakes. The stand is separate.',
      },
    ],
    productHandles: ['box-of-12-wedding-cupcakes', 'box-of-24-assorted-mini-cupcakes'],
    productsHeading: 'Cupcakes for a stand',
    links: [
      { href: '/blogs/how-many-cupcakes-for-a-wedding', label: 'How many cupcakes for a wedding' },
      { href: '/collections/wedding-cupcakes', label: 'Wedding cupcakes' },
    ],
  }),
  page({
    slug: 'shopping-centre-cupcakes',
    title: 'Cupcakes at Chadstone, Frankston, Werribee & Williamstown',
    description:
      'We do not have shops at Chadstone, Frankston, Werribee or Williamstown. Highpoint postcode 3032 is on our delivery list. Other centres are not.',
    eyebrow: 'Suburbs',
    heading: 'Shopping-centre cupcakes, and where we actually deliver',
    breadcrumb: 'Shopping centres',
    intro: [
      'People search for cupcakes at Chadstone, Frankston, Werribee, Williamstown, Highpoint and Watergardens because other bakeries have counters there. We do not. There is no Cupcake Desire shop in any of those centres.',
      'Delivery is by postcode. Highpoint and Maribyrnong sit on postcode 3032, which is on our extended-zone list, so an address in 3032 can be delivered on a weekday. Chadstone is 3148, Frankston is 3199, Werribee is 3030 and Williamstown is 3016. Those postcodes are not on the standard list. Watergardens (Taylors Lakes) is not on it either. Contact us before ordering if your postcode is missing.',
    ],
    sections: [
      {
        heading: 'Melbourne CBD is different',
        body: [
          'Postcode 3000 is on the list, so cupcakes in the CBD are a normal weekday delivery, not a store visit.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Do you have a cake shop at Chadstone?',
        answer: 'No. We also do not deliver to postcode 3148 on the standard run.',
      },
      {
        question: 'Do you deliver to Highpoint?',
        answer: 'Postcode 3032 is on our extended-zone list. Check the address postcode on the delivery page before you pay.',
      },
    ],
    productHandles: ['box-of-12-birthday-cupcakes', 'red-velvet-3-cupcakes'],
    productsHeading: 'Order for a suburb we do deliver to',
    links: [
      { href: '/cupcake-delivery', label: 'Full suburb list' },
      { href: '/cupcake-delivery/melbourne', label: 'CBD delivery' },
      { href: '/melbourne/cupcake-queens', label: 'If you were looking for another bakery' },
    ],
  }),
  page({
    slug: 'cupcake-queens',
    title: 'The Cupcake Desire, Not The Cupcake Queens',
    description:
      'The Cupcake Desire is a different Melbourne bakery from The Cupcake Queens. We bake in Narre Warren and deliver on weekdays. We have no Chadstone or Frankston shop.',
    eyebrow: 'This bakery',
    heading: 'You may have been looking for a different bakery',
    breadcrumb: 'Cupcake Queens',
    intro: [
      'The Cupcake Desire and The Cupcake Queens are different businesses. If you searched “cupcake queens”, “cupcake queen”, or a shop at Chadstone, Frankston or Williamstown, that name is not us.',
      'We are an online bakery. The kitchen is at 352 Princes Hwy, Narre Warren. There is no walk-in store, and we do not trade inside those shopping centres. We bake cupcakes, cakes and macarons to order and hand-deliver on weekdays to the suburbs on our list.',
    ],
    sections: [
      {
        heading: 'What you can order here',
        body: [
          'Standard and deluxe cupcakes in threes, themed boxes of 12, mini boxes of 24, round cakes, dress cakes, macarons and corporate logo cupcakes. Eggless on request. Vegan and gluten-free are separate ranges.',
          'We are not publishing the other bakery’s menu or prices. For their stores, use their own site. For a delivery from Narre Warren, start with the shop or the suburb list.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Are you The Cupcake Queens?',
        answer: 'No. We are The Cupcake Desire, in Narre Warren.',
      },
      {
        question: 'Do you have a shop at Chadstone or Frankston?',
        answer: 'No. Those postcodes are not on our standard delivery list either.',
      },
    ],
    productHandles: ['box-of-12-birthday-cupcakes', 'red-velvet-3-cupcakes', 'box-of-24-assorted-mini-cupcakes'],
    productsHeading: 'What The Cupcake Desire sells',
    links: [
      { href: '/melbourne/shopping-centre-cupcakes', label: 'Shopping-centre suburbs' },
      { href: '/collections/all-cupcakes', label: 'All cupcakes' },
      { href: '/about-us', label: 'Our story' },
      { href: '/contact', label: 'Contact' },
    ],
  }),
]

export function getMelbournePage(slug: string) {
  return MELBOURNE_PAGES.find((page) => page.slug === slug) || null
}

export function melbournePath(slug: string) {
  return `/melbourne/${slug}`
}
