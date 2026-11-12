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
  /** Optional hero tagline under the H1 (overrides CMS collection.description). */
  tagline?: string
  /**
   * Optional paragraphs rendered in the hero after the tagline and before the
   * "N bakes on the bench" line. Supports [label](/path) markdown links.
   */
  heroAfterTagline?: string[]
  /** Optional share image (og:image / twitter:image), preferred over CMS collection.image. */
  image?: string
  /** Optional H2 sections after the intro (supports [label](/path) links). */
  sections?: { heading: string; paragraphs: string[] }[]
  /** Optional FAQ overrides (replaces collectionQuickAnswers). Must mirror visible FAQ. */
  faqs?: { question: string; answer: string }[]
  /** Optional H2 above the FAQ block (replaces default "Quick answers"). */
  faqHeading?: string
  /** Optional paragraph after the FAQ block; supports [label](/path) markdown links. */
  faqFooter?: string
  /** Extra FAQs appended after collectionQuickAnswers (ignored when faqs override is set). */
  extraFaqs?: { question: string; answer: string }[]
  /** When the product grid is empty, show these fallback links in the server HTML. */
  emptyFallbackLinks?: { href: string; label: string }[]
}

const ORDERING =
  'Everything is baked to order in our Narre Warren kitchen and hand-delivered on weekdays across Melbourne Metro. Order by 12 noon for next-weekday delivery, generally 9am to 3pm.'
const DIETARY = 'Every flavour has an eggless alternative, and we bake separate vegan and gluten-free cupcake ranges.'

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
  // GSC content 12 Nov 2026 §3 / §4.5 birthday.
  'birthday-cupcakes': {
    noun: 'birthday cupcakes',
    title: 'Birthday Cupcakes Delivered in Melbourne | The Cupcake Desire',
    description:
      'Birthday cupcakes baked to order and delivered across Melbourne. Themed boxes of 12, minis and custom boxes. Eggless, vegan & gluten-free options.',
    tagline:
      'Birthday cupcakes in Melbourne arrive from us as a decorated themed box of 12, a mini box of 24, or a box you fill yourself with a written message. Every order is baked for its delivery date and hand-delivered across Melbourne Metro on weekdays. Order by 12 noon for next-weekday delivery.',
    heading: 'Birthday cupcakes, delivered across Melbourne Metro',
    intro: [
      'We bake birthday cupcakes fresh to order in our Narre Warren kitchen and hand-deliver them across Melbourne Metro on weekdays only. A themed box of 12 is $66, or [build your own box](/cupcake-builder) and add a message. Order by 12 noon for next-weekday delivery, generally 9am to 3pm.',
      'Colourful, hand-frosted birthday cupcakes suit kids, grown-ups or a surprise at the office. Our [themed box of 12](/products/box-of-12-birthday-cupcakes) comes decorated for the occasion in assorted flavours, and you can round it out with a [mini cupcake box of 24](/products/mini-cupcake-box-24) or a few of our [standard](/collections/standard-cupcakes) and [deluxe](/collections/deluxe-cupcakes) flavours. Every flavour has an [eggless option](/eggless-cupcakes), alongside [our vegan range](/vegan-cupcakes) and [gluten-free options](/gluten-free-cupcakes). Everything is made in a shared kitchen that also handles nuts, gluten, dairy, eggs, soy and sesame, so it is not suitable for severe allergies or coeliac disease.',
    ],
    faqHeading: 'Birthday cupcakes: questions before you order',
    faqFooter:
      'Planning the whole party? See [Birthday cakes](/melbourne/birthday-cakes) and [Kids birthday cakes](/melbourne/kids-birthday-cakes).',
    faqs: [
      {
        question: 'Can I put a name or photo on birthday cupcakes?',
        answer:
          'Yes. Custom Picture Cupcakes let you upload a photo of the birthday person or a favourite character, and we print it on edible discs spread through the box. Choose 12 full-size cupcakes or 24 minis. For a written note instead, the build-your-own box takes a message of up to 120 characters.',
      },
      {
        question: 'How many cupcakes do I need for a birthday party?',
        answer:
          'A simple guide is one full-size cupcake or two to three minis per guest, with a few spare for adults and late arrivals. A themed box of 12 suits a small party, and a mini box of 24 stretches further for bigger groups. Our kids party guide on the blog walks through the numbers.',
      },
      {
        question: 'What comes in the themed birthday box?',
        answer:
          'The themed box holds 12 hand-frosted cupcakes in assorted flavours, decorated for a birthday with bright sprinkles and candy toppers. It costs $66 including GST. Any flavour can be made eggless if you write eggless in the delivery instructions at checkout, and every box is baked to order rather than taken from a display case.',
      },
      {
        question: 'Can I order a birthday cake as well as cupcakes?',
        answer:
          "Yes. Round cakes come in 6 and 8 inch sizes, and there is a custom birthday cake plus dress cakes for themed parties. Cakes need 3 days' notice, so book the cake first and then order the cupcakes for the same weekday. A giant cupcake that serves about 20 is another centrepiece option.",
      },
      {
        question: 'Can you deliver birthday cupcakes to someone as a surprise?',
        answer:
          "Yes, to any address in Melbourne Metro on a weekday. Order by 12 noon for next-weekday delivery. Add the recipient's phone number so we can reach them, and include a message if you build your own box. If nobody answers on the first attempt, the order may be left at the premises.",
      },
    ],
  },
  'wedding-cupcakes': {
    noun: 'wedding cupcakes',
    title: 'Wedding Cupcakes Melbourne',
    description:
      'Wedding cupcakes and cupcake tiers baked to order in Narre Warren for Melbourne weddings. Small wedding packages from $300. Eggless, vegan & gluten-free options.',
    heading: 'Wedding cupcakes for Melbourne celebrations',
    image:
      'https://res.cloudinary.com/dqxh4ooej/image/upload/v1786944883/legacy-migrated/wedding.jpg',
    intro: [
      'Hand-frosted wedding cupcakes are an easy, elegant alternative to a traditional cake: every guest gets their own, there is no cutting, and you can mix flavours for different tastes. Small wedding packages start from $300. Order a themed box of 12 for smaller celebrations, or enquire about a wedding cupcake tier for the main table.',
      `${ORDERING} Weddings need longer notice so we can plan baking and delivery. Get in touch early with your date and guest numbers. ${DIETARY}`,
    ],
  },
  'anniversary-cupcakes': occasion(
    'anniversary cupcakes',
    'Anniversary Cupcakes Melbourne',
    'Anniversary cupcakes baked to order and delivered across Melbourne, a sweet surprise for a partner, parents or friends. Eggless & vegan options.',
    'Anniversary cupcakes, delivered in Melbourne',
    'Mark the years with a box of hand-frosted anniversary cupcakes, for your partner, your parents or friends celebrating a milestone.'
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
  'valentines-day-cupcakes': {
    ...occasion(
      "Valentine's Day cupcakes",
      "Valentine's Day Cupcakes Melbourne",
      "Valentine's Day cupcakes baked to order and delivered across Melbourne, with heart-topped boxes of 12 and minis. Eggless & vegan options.",
      "Valentine's Day cupcakes, delivered",
      'Say it with heart-topped cupcakes, delivered to their door or desk across Melbourne Metro. We deliver on weekdays, so for weekend occasions choose Friday delivery.'
    ),
    extraFaqs: [
      {
        question: 'Can you deliver Valentine’s Day cupcakes?',
        answer:
          'Yes, across Melbourne Metro. We deliver on weekdays, so for weekend occasions choose Friday delivery. Valentine’s Day 2027 is a Sunday, so choose Friday 12 February. Order by 12 noon for next-weekday delivery, generally 9am to 3pm.',
      },
    ],
  },
  'i-love-u-cupcakes': occasion(
    'I love you cupcakes',
    'I Love You Cupcakes Delivered',
    'I Love You cupcakes baked to order and delivered across Melbourne, a sweet way to say it any day. Eggless, vegan & gluten-free options.',
    'Say “I love you” with cupcakes',
    'Some things are easier said with buttercream. Our I Love You cupcakes spell it out for anniversaries, apologies or just because.'
  ),
  'mothers-day-cupcakes': {
    ...occasion(
      "Mother's Day cupcakes",
      "Mother's Day Cupcakes Melbourne",
      "Mother's Day cupcakes baked to order and delivered across Melbourne. Themed boxes of 12, minis and custom boxes. Eggless & vegan options.",
      "Mother's Day cupcakes, delivered to Mum",
      'Put a smile on Mum’s face with a box of hand-frosted Mother’s Day cupcakes, delivered across Melbourne Metro. We deliver on weekdays, so for weekend occasions choose Friday delivery.'
    ),
    extraFaqs: [
      {
        question: 'Can you deliver Mother’s Day cupcakes?',
        answer:
          'Yes, across Melbourne Metro. We deliver on weekdays, so for weekend occasions choose Friday delivery. Mother’s Day is always a Sunday, so book it for the Friday. Order by 12 noon for next-weekday delivery, generally 9am to 3pm.',
      },
    ],
  },
  'fathers-day-cupcakes': {
    ...occasion(
      "Father's Day cupcakes",
      "Father's Day Cupcakes Melbourne",
      "Father's Day cupcakes baked to order and delivered across Melbourne. Themed boxes of 12, minis and custom boxes. Eggless & vegan options.",
      "Father's Day cupcakes, delivered to Dad",
      'Treat Dad like a king with a box of hand-frosted Father’s Day cupcakes, delivered across Melbourne Metro. We deliver on weekdays, so for weekend occasions choose Friday delivery.'
    ),
    extraFaqs: [
      {
        question: 'Can you deliver Father’s Day cupcakes?',
        answer:
          'Yes, across Melbourne Metro. We deliver on weekdays, so for weekend occasions choose Friday delivery. Father’s Day is always a Sunday, so book it for the Friday. Order by 12 noon for next-weekday delivery, generally 9am to 3pm.',
      },
    ],
  },
  'christmas-cupcakes': {
    ...occasion(
      'Christmas cupcakes',
      'Christmas Cupcakes Melbourne',
      'Christmas cupcakes for parties and gifts, baked to order and delivered across Melbourne. Themed boxes of 12 and minis. Eggless & vegan options.',
      'Christmas cupcakes for parties and gifts',
      'Festive Christmas cupcakes for the office party, a family lunch or a thoughtful gift.'
    ),
    // X2 companion: hero intro + office in-link sit under the live tagline; FAQ replaces generics.
    heroAfterTagline: [
      'Christmas cupcake delivery in Melbourne from The Cupcake Desire runs on weekdays across Melbourne Metro, generally between 9am and 3pm. Order by 12 noon for next-weekday delivery. Choose the Box of 12 Christmas Cupcakes ($66), a Mini Cupcake Box (24) at $70 or single flavours from $5 each (minimum 3). Metro Melbourne delivery is $0 to $20 by suburb, free over $100.',
      'Ordering for the office? See [Christmas corporate cupcakes](/corporate/christmas).',
    ],
    faqs: [
      {
        question: 'How much are Christmas cupcakes?',
        answer:
          'A themed box of 12 Christmas cupcakes is $66. Other boxes in this collection are $70. Single-flavour cupcakes are $5 each (minimum 3). All prices in AUD, including GST.',
      },
      {
        question: 'Do you deliver cupcakes across Melbourne?',
        answer:
          'Yes. We hand-deliver across Melbourne Metro on weekdays from our kitchen in Narre Warren, including the CBD and inner suburbs. Order by 12 noon for next-weekday delivery, generally 9am to 3pm. Metro Melbourne delivery $0 to $20 by suburb, free over $100. Outside Metro by quote. No weekend or public-holiday delivery.',
      },
      {
        question: 'Do you make eggless, vegan and gluten-free cupcakes?',
        answer:
          'Yes. Every flavour has an eggless alternative, and we bake separate vegan and gluten-free cupcake ranges. Made in a shared kitchen that also handles nuts, gluten, dairy, eggs, soy and sesame, so not suitable for severe allergies or coeliac disease. For other dietary questions, please contact us before ordering.',
      },
      {
        question: 'How much notice do Christmas cupcake orders need?',
        answer:
          "Order by 12 noon for next-weekday delivery. Every box is baked to order and hand-delivered on weekdays across Melbourne Metro, generally between 9am and 3pm. A Christmas Cake needs 3 days' notice. For Christmas orders, contact us early with your date and numbers.",
      },
      {
        question: 'Can I get Christmas cupcakes delivered on a weekend?',
        answer:
          'No. We deliver on weekdays only, with no weekend or public-holiday delivery anywhere in Melbourne Metro. For a weekend Christmas party, choose Friday delivery. Metro Melbourne delivery is $0 to $20 by suburb and free over $100, so a larger order can travel at no delivery cost.',
      },
      {
        question: 'Do you make Christmas cupcakes for offices?',
        answer:
          'Yes. The Box of 12 Christmas Cupcakes suits a team morning tea, and our corporate cupcakes box prints up to 4 logos on edible discs in boxes of 12 to 500. See [Christmas corporate cupcakes](/corporate/christmas) for office orders, quotes and the options in one place.',
      },
    ],
  },
  'halloween-cupcakes': {
    noun: 'Halloween cupcakes',
    title: 'Halloween Cupcakes Melbourne | Delivered | Cupcake Desire',
    description:
      'Halloween cupcakes baked to order and delivered across Melbourne Metro on weekdays. Boxes and minis, with vegan, eggless and gluten free options.',
    heading: 'Halloween Cupcakes, Delivered in Melbourne',
    image: '/images/halloween/halloween-cupcakes-collection.webp',
    intro: [
      'Pumpkins, ghosts and a little spooky fun, piped onto cupcakes we bake to order for Halloween parties, classrooms and office afternoons. Choose a box below and we deliver across Melbourne Metro.',
    ],
    sections: [
      {
        heading: 'Box sizes for every kind of Halloween get together',
        paragraphs: [
          'A standard box suits a family night in, while mini cupcakes go further at a kids party or a shared office table. Mixing a box of cupcakes with a Halloween cake gives you a centrepiece plus easy grab and go treats.',
        ],
      },
      {
        heading: 'Halloween cupcake delivery across Melbourne',
        paragraphs: [
          'We are an online bakery, so every order is placed on the website and delivered to your door across Melbourne Metro, weekdays between 9am and 3pm. Order by 12 noon for next-weekday delivery, generally 9am to 3pm. Metro Melbourne delivery $0 to $20 by suburb, free over $100. Outside Metro by quote. You will see the exact fee at checkout. Halloween falls on a Saturday in 2026, so plan for a Friday 30 October delivery if your party is on the weekend. See all areas on our [cupcake delivery page](/cupcake-delivery).',
        ],
      },
      {
        heading: 'Vegan, eggless and gluten free Halloween cupcakes',
        paragraphs: [
          'Many of our flavours are available as vegan, eggless or gluten free options. These are made in a shared kitchen. Everything is made in a shared kitchen that also handles nuts, gluten, dairy, eggs, soy and sesame, so it is not suitable for severe allergies or coeliac disease.',
        ],
      },
      {
        heading: 'Halloween cupcakes for kids',
        paragraphs: [
          'Bright orange frosting, friendly ghosts and sprinkles make these an easy win for a school party or a trick or treat afternoon. For planning help, read our [Halloween party treats guide](/halloween-party-treats-melbourne). Also see our [Halloween cakes](/collections/halloween-cakes), [Halloween cupcake ideas blog](/blogs/halloween-cupcake-ideas-melbourne), and [mini cupcakes](/collections/mini-cupcakes).',
        ],
      },
    ],
    faqs: [
      {
        question: 'Do you deliver Halloween cupcakes in Melbourne?',
        answer:
          'Yes. We deliver across Melbourne Metro on weekdays between 9am and 3pm. Order by 12 noon for next-weekday delivery, generally 9am to 3pm.',
      },
      {
        question: 'How much is delivery?',
        answer:
          'Metro Melbourne delivery $0 to $20 by suburb, free over $100. Outside Metro by quote. The exact fee shows at checkout.',
      },
      {
        question: 'Can I get Halloween cupcakes delivered on Saturday 31 October?',
        answer: 'We deliver on weekdays only, so for a weekend party choose Friday 30 October.',
      },
      {
        question: 'Do you have vegan or gluten free Halloween cupcakes?',
        answer:
          'Vegan, eggless and gluten free options are available and are made in a shared kitchen. Everything is made in a shared kitchen that also handles nuts, gluten, dairy, eggs, soy and sesame, so it is not suitable for severe allergies or coeliac disease.',
      },
      {
        question: 'Can I pick up my order?',
        answer:
          'We are an online bakery and orders are delivered across Melbourne Metro. For help, call 03 9705 0051.',
      },
    ],
    emptyFallbackLinks: [
      { href: '/collections/all-cupcakes', label: 'Browse all cupcakes' },
      { href: '/collections/cakes', label: 'Browse cakes' },
    ],
  },
  'halloween-cakes': {
    noun: 'Halloween cakes',
    title: 'Halloween Cakes Melbourne | Delivered | Cupcake Desire',
    description:
      'Halloween cakes baked to order for parties and birthdays, delivered across Melbourne Metro on weekdays. Vegan, eggless and gluten free options.',
    heading: 'Halloween Cakes, Delivered in Melbourne',
    image: '/images/halloween/halloween-cakes-collection.webp',
    intro: [
      'A Halloween cake gives your party a centrepiece people gather around. We bake each one to order and deliver across Melbourne Metro.',
    ],
    sections: [
      {
        heading: 'A Halloween birthday cake',
        paragraphs: [
          'Birthdays close to 31 October are a fun excuse to go spooky. Pick a Halloween design below, or see our [birthday cakes](/collections/cakes) for other themes.',
        ],
      },
      {
        heading: 'Custom Halloween cakes',
        paragraphs: [
          'Want your own colours or a name on top? Use our [custom birthday cake](/products/custom-birthday-cake) options where available.',
        ],
      },
      {
        heading: 'Delivery across Melbourne',
        paragraphs: [
          'We are an online bakery, so every order is placed on the website and delivered to your door across Melbourne Metro, weekdays between 9am and 3pm. Order by 12 noon for next-weekday delivery, generally 9am to 3pm. Metro Melbourne delivery $0 to $20 by suburb, free over $100. Outside Metro by quote. You will see the exact fee at checkout. Halloween falls on a Saturday in 2026, so plan for a Friday 30 October delivery if your party is on the weekend. See all areas on our [cupcake delivery page](/cupcake-delivery).',
        ],
      },
      {
        heading: 'Vegan, eggless and gluten free Halloween cakes',
        paragraphs: [
          'Many of our flavours are available as vegan, eggless or gluten free options. These are made in a shared kitchen. Everything is made in a shared kitchen that also handles nuts, gluten, dairy, eggs, soy and sesame, so it is not suitable for severe allergies or coeliac disease.',
        ],
      },
      {
        heading: 'Pair it with cupcakes',
        paragraphs: [
          'Add a box of [Halloween cupcakes](/collections/halloween-cupcakes) so every guest has a treat in hand. For planning help, read our [Halloween party treats guide](/halloween-party-treats-melbourne).',
        ],
      },
    ],
    faqs: [
      {
        question: 'Do you deliver Halloween cakes in Melbourne?',
        answer:
          'Yes. We deliver across Melbourne Metro on weekdays between 9am and 3pm. Order by 12 noon for next-weekday delivery, generally 9am to 3pm.',
      },
      {
        question: 'How much is delivery?',
        answer:
          'Metro Melbourne delivery $0 to $20 by suburb, free over $100. Outside Metro by quote. The exact fee shows at checkout.',
      },
      {
        question: 'Can I get a Halloween cake delivered on Saturday 31 October?',
        answer: 'We deliver on weekdays only, so for a weekend party choose Friday 30 October.',
      },
      {
        question: 'Do you have vegan or gluten free Halloween cakes?',
        answer:
          'Vegan, eggless and gluten free options are available and are made in a shared kitchen. Everything is made in a shared kitchen that also handles nuts, gluten, dairy, eggs, soy and sesame, so it is not suitable for severe allergies or coeliac disease.',
      },
      {
        question: 'Can I pick up my order?',
        answer:
          'We are an online bakery and orders are delivered across Melbourne Metro. For help, call 03 9705 0051.',
      },
    ],
    emptyFallbackLinks: [
      { href: '/collections/all-cupcakes', label: 'Browse all cupcakes' },
      { href: '/collections/cakes', label: 'Browse cakes' },
    ],
  },

  'easter-cupcakes': occasion(
    'Easter cupcakes',
    'Easter Cupcakes Melbourne',
    'Easter cupcakes baked to order and delivered across Melbourne, with themed boxes of 12, minis and custom boxes. Eggless, vegan & gluten-free options.',
    'Easter cupcakes, delivered in Melbourne',
    'Bring some Easter-bunny spirit to the table with themed Easter cupcakes.'
  ),
  'diwali-cupcakes': occasion(
    'Diwali cupcakes',
    'Diwali Cupcakes Melbourne',
    'Diwali cupcakes for the festival of lights, baked to order and delivered across Melbourne. Every flavour available eggless. Vegan options too.',
    'Diwali cupcakes for the festival of lights',
    'Celebrate the festival of lights with Diwali cupcakes, and because every flavour has an eggless alternative, they suit every guest at the table.'
  ),
  'australia-day-cupcakes': occasion(
    'Australia Day cupcakes',
    'Australia Day Cupcakes Melbourne',
    'Australia Day cupcakes baked to order and delivered across Melbourne, with themed boxes of 12, minis and custom boxes. Eggless & vegan options.',
    'Australia Day cupcakes for the barbie',
    'Have the mates around and bring out the Australia Day cupcakes.'
  ),
  'sorry-cupcakes': occasion(
    'sorry cupcakes',
    'Sorry Cupcakes Delivered in Melbourne',
    'Sorry cupcakes baked to order and delivered across Melbourne, an apology that is hard to stay mad at. Eggless, vegan & gluten-free options.',
    'Say sorry with cupcakes',
    'Stuffed up? A box of sorry cupcakes delivered to the door is an apology that is hard to stay mad at.'
  ),
  'thank-u-cupcakes': occasion(
    'thank you cupcakes',
    'Thank You Cupcakes Delivered',
    'Thank you cupcakes for teachers, clients and friends, baked to order and delivered across Melbourne. Eggless, vegan & gluten-free options.',
    'Thank you cupcakes, delivered',
    'When words alone don’t cover it, thank you cupcakes do, for teachers, clients, colleagues and friends.'
  ),
  'standard-cupcakes': {
    noun: 'standard cupcakes',
    title: 'Classic Cupcakes Melbourne',
    description:
      'Classic hand-frosted cupcakes: red velvet, chocolate, vanilla, mocha, coconut and more. Baked to order, delivered across Melbourne.',
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
      'Deluxe cupcakes: salted caramel, rocky road, molten chocolate, hazelnut and more, plus vegan and gluten-free. Delivered across Melbourne.',
    heading: 'Deluxe cupcakes, finished with extras',
    intro: [
      'Our deluxe flavours are bigger and richer, finished with extras like ganache drips, caramel and toppings: salted caramel, rocky road, molten chocolate, M&M, hazelnut heaven and cookies n cream. The range also includes a gluten-free red velvet and a vegan, gluten-free chocolate vanilla.',
      `Deluxe cupcakes are sold by the cupcake with a minimum of three. ${ORDERING}`,
    ],
  },
  'mini-cupcakes': {
    noun: 'mini cupcakes',
    title: 'Mini Cupcakes Melbourne, Boxes of 24',
    description:
      'Mini cupcakes in boxes of 24: assorted, red velvet, chocolate, vanilla and M&M. Baked to order and delivered across Melbourne.',
    tagline:
      'Mini cupcakes from The Cupcake Desire come 24 to a box, assorted or in a single flavour such as red velvet, chocolate, vanilla or M&M. Being bite-sized, they let guests try a few at parties, morning teas and meetings. Each box is baked to order for Melbourne Metro. Order by 12 noon for next-weekday delivery.',
    heading: 'Mini cupcakes for parties and meetings',
    intro: [
      'Two dozen bite-sized cupcakes in a box, ideal for parties, morning teas and meetings where guests want a taste of everything. Choose assorted, or a single flavour such as red velvet, chocolate chocolate, vanilla vanilla, M&M, or our chocolate and vanilla bases.',
      `${ORDERING} ${DIETARY} Need them branded? See our mini corporate cupcakes.`,
    ],
    faqHeading: 'Mini cupcakes: planning questions',
    faqFooter:
      'Looking for a cupcake order close to home? See [Cupcakes near me](/melbourne/cupcakes-near-me).',
    faqs: [
      {
        question: 'How many mini cupcakes should I order per guest?',
        answer:
          'Plan on two to three minis per guest for a morning tea or meeting, and a little more if the minis are the main dessert. Multiply your guest count by that guide, then round up to whole boxes of 24. For a mixed spread, pair minis with full-size cupcakes or a box of cake slices.',
      },
      {
        question: 'Which flavours come in a mini box?',
        answer:
          'You can order an assorted box of 24 or a box in one flavour: red velvet, chocolate chocolate, vanilla vanilla, M&M, a chocolate base or a vanilla base. Boxes are $70 to $72 including GST, depending on the flavour. Any flavour can also be made eggless if you ask for it at checkout.',
      },
      {
        question: 'Can I get mini cupcakes with a logo or photo?',
        answer:
          'Yes. For a business logo, mini corporate cupcakes come in quantities of 24, 100, 300 or 500, with up to 4 logos printed on edible discs. For a personal photo, Custom Picture Cupcakes include a box of 24 minis in vanilla, chocolate or a mix of both. Larger or custom orders need longer notice.',
      },
      {
        question: 'Are mini cupcakes available for vegan or gluten-free guests?',
        answer:
          'Every mini flavour comes in an eggless version. Our vegan range and gluten-free options are listed on their own pages, so check those before ordering for vegan or gluten-free guests. Everything is made in a shared kitchen that also handles nuts, gluten, dairy, eggs, soy and sesame, so it is not suitable for severe allergies or coeliac disease.',
      },
      {
        question: 'Can mini cupcakes be delivered to an office?',
        answer:
          'Yes, to any office or venue in Melbourne Metro on a weekday. Order by 12 noon for next-weekday delivery. Deliveries generally arrive between 9am and 3pm with no fixed time slot, so plan around that window for a morning event. Larger orders need longer notice, so send us your date and numbers first.',
      },
    ],
  },
  macarons: {
    noun: 'macarons',
    title: 'Macarons Delivered in Melbourne',
    description:
      'French macarons in boxes of 12: salted caramel, strawberry, chocolate or assorted. Delivered on weekdays across Melbourne.',
    heading: 'Macarons, a dozen at a time',
    intro: [
      'Crisp shells and soft centres in boxes of 12: choose salted caramel, strawberry, chocolate or an assorted box. Macarons pair beautifully with a cupcake order for gifts and dessert tables.',
      `${ORDERING} Made in a shared kitchen that also handles nuts, gluten, dairy, eggs, soy and sesame, so not suitable for severe allergies or coeliac disease. For other dietary questions, please contact us before ordering.`,
    ],
  },
  cakes: {
    noun: 'cakes',
    title: 'Cake Delivery Melbourne, Round Cakes',
    description:
      'Round cakes in 6" and 8": chocolate, red velvet, salted caramel, cookies & cream and more, plus drip and custom birthday cakes. Melbourne delivery.',
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
      'Princess dress cakes: Elsa, Belle, Ariel and more, in vanilla or chocolate. Baked to order for birthdays and delivered across Melbourne.',
    heading: 'Princess dress cakes for birthdays',
    intro: [
      'A tall doll cake dressed in a buttercream gown: Elsa, Belle, Ariel and more, in vanilla or chocolate. Want a different princess or colours? Use the custom dress cake enquiry and we will quote.',
      'Cakes need three days’ notice and are delivered on weekdays across Melbourne Metro from our Narre Warren kitchen.',
    ],
  },
  'giant-cupcakes': {
    noun: 'giant cupcakes',
    title: 'Giant Cupcakes Melbourne, Serves 20',
    description:
      'Giant cupcakes that serve about 20: red velvet, chocolate, vanilla and deluxe flavours. A cake alternative, delivered across Melbourne.',
    heading: 'Giant cupcakes: the cake alternative',
    intro: [
      'One show-stopping cupcake that serves around 20, piled high with hand-piped buttercream in red velvet, chocolate, vanilla or our deluxe flavours (salted caramel, hazelnut heaven, molten chocolate, cookies and cream).',
      `${ORDERING} Eggless versions are available.`,
    ],
  },
  'deluxe-giant-cupcakes': {
    noun: 'deluxe giant cupcakes',
    title: 'Deluxe Giant Cupcakes, Serves 20',
    description:
      'Deluxe giant cupcakes: salted caramel, hazelnut heaven, molten chocolate, cookies and cream, each serves about 20. Melbourne delivery.',
    heading: 'Deluxe giant cupcakes',
    intro: [
      'Our most indulgent giants, each serving around 20: salted caramel, hazelnut heaven, molten chocolate and cookies and cream, finished with piped buttercream and deluxe toppings.',
      `${ORDERING} Made in a shared kitchen that also handles nuts, gluten, dairy, eggs, soy and sesame, so not suitable for severe allergies or coeliac disease. For other dietary questions, please contact us before ordering.`,
    ],
  },
  'cake-slices': {
    noun: 'cake slices',
    title: 'Cake Slices Catering Melbourne',
    description:
      'Cake slice catering boxes of 12, 36, 50 and 100: caramel, lemon, rocky road, cheesecake and more. Baked to order, delivered across Melbourne.',
    heading: 'Cake slice catering boxes',
    intro: [
      'Catering boxes of 12, 36, 50 or 100 slices for meetings, morning teas and events: carrot cake, lemon, rocky road, raspberry jelly cheesecake, chocolate caramel with Mars or Tim Tam, toffee honeycomb with Golden Gaytime, white chocolate with Tim Tam, or a mixed box.',
      `${ORDERING} Larger orders may need longer notice. Contact us and we will confirm. Need your logo on them? See corporate cake slices.`,
    ],
  },
  'gift-voucher': {
    noun: 'gift vouchers',
    title: 'Cupcake Gift Vouchers',
    description:
      'Cupcake Desire gift vouchers in $25, $50 and $100, redeemable on cupcakes, cakes and macarons delivered across Melbourne.',
    heading: 'Gift vouchers for cupcake lovers',
    intro: [
      'Not sure what they’d pick? A gift voucher in $25, $50 or $100 lets them choose, redeemable on the whole range for delivery across Melbourne Metro.',
    ],
  },
}
