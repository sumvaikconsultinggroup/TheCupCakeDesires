export type KeywordBlog = {
  slug: string
  title: string
  description: string
  excerpt: string
  category: string
  publishedAt: string
  readingTime: number
  tags: string[]
  /** Optional byline; defaults to The Cupcake Desire when omitted. */
  author?: { name: string; avatar?: string }
  /** Placeholder path until the real banner is uploaded under public/images/blog/. */
  featuredImage: {
    url: string
    alt?: string
    /** CSS object-position, e.g. "50% 30%" or "center top". */
    focalPoint?: string
  }
  sections: { heading?: string; paragraphs: string[] }[]
}

export const KEYWORD_BLOGS: KeywordBlog[] = [
  {
    slug: 'chocolate-cupcake-recipe',
    title: 'Chocolate Cupcake Recipe with Chocolate Buttercream',
    description:
      'A home chocolate cupcake recipe: cocoa sponge and chocolate buttercream for 12 cupcakes. Or order the same flavour from The Cupcake Desire in Melbourne.',
    excerpt: 'Cocoa, butter and a chocolate frosting that sets. Twelve cupcakes, mixed in one bowl.',
    category: 'Recipes',
    publishedAt: '2026-03-01',
    readingTime: 6,
    tags: ['chocolate cupcake recipe', 'chocolate cupcakes', 'melbourne'],
    featuredImage: {
      url: '/images/blog/chocolate-cupcake-recipe.webp',
      alt: 'Chocolate cupcake with chocolate buttercream',
    },
    sections: [
      {
        paragraphs: [
          'This is the plain chocolate cupcake we point people to when they want to bake a dozen at home: a cocoa sponge and a chocolate buttercream. It is not a copy of a shop recipe. If you would rather not turn the oven on, the chocolate chocolate cupcakes on our menu are the ordered version, delivered on a weekday in Melbourne.',
        ],
      },
      {
        heading: 'Sponge',
        paragraphs: [
          'Heat the oven to 170°C fan. Line a 12-hole tin. Melt 80g butter with 80ml milk and 1 tablespoon of vegetable oil. In another bowl whisk 140g caster sugar, 2 eggs and 1 teaspoon of vanilla. Sift in 120g plain flour, 40g cocoa and 1 teaspoon of baking powder. Fold the wet ingredients through. The batter should fall off the spoon. Divide it and bake for 16–18 minutes, until a skewer comes out with a few crumbs.',
        ],
      },
      {
        heading: 'Chocolate buttercream',
        paragraphs: [
          'Beat 150g soft butter until it is pale. Add 250g icing sugar and 30g cocoa, a spoon at a time, then 1 tablespoon of milk. It should hold a peak and still spread. If it is stiff, add a teaspoon more milk. Cool the cakes fully before you ice them, or the frosting slides off.',
        ],
      },
      {
        heading: 'If you are feeding more than the house',
        paragraphs: [
          'A home dozen is a good Sunday. A party, an office or a next-weekday delivery is the menu: chocolate cupcakes sold in threes, or a chocolate round cake in 6 or 8 inch. We bake those in Narre Warren. We do not deliver the same day.',
        ],
      },
    ],
  },
  {
    slug: 'vanilla-cupcake-recipe',
    title: 'Fluffy Vanilla Cupcake Recipe',
    description:
      'A fluffy vanilla cupcake recipe for 12 cakes, with vanilla buttercream. The same flavour is on The Cupcake Desire menu for Melbourne delivery.',
    excerpt: 'Butter, milk and vanilla. Twelve cupcakes with a soft crumb.',
    category: 'Recipes',
    publishedAt: '2026-03-02',
    readingTime: 6,
    tags: ['vanilla cupcake recipe', 'fluffy vanilla cupcakes'],
    featuredImage: {
      url: '/images/blog/vanilla-cupcake-recipe.webp',
      alt: 'Fluffy vanilla cupcakes with buttercream',
    },
    sections: [
      {
        paragraphs: [
          'A fluffy vanilla cupcake is mostly butter, sugar, egg and milk, with enough flour to hold it. This batch makes 12. The ordered version is our vanilla vanilla cupcake, sold in threes.',
        ],
      },
      {
        heading: 'Method',
        paragraphs: [
          'Heat the oven to 170°C fan. Beat 125g soft butter with 150g caster sugar until it looks pale. Beat in 2 eggs, one at a time, and 2 teaspoons of vanilla. Fold in 160g self-raising flour and 2 tablespoons of milk. Spoon into cases, about two-thirds full. Bake 15–17 minutes. Cool before icing.',
          'For the frosting, beat 125g soft butter with 200g icing sugar, 1 teaspoon of vanilla and 1 tablespoon of milk. It should be soft enough to pipe and firm enough to sit.',
        ],
      },
      {
        heading: 'Why home batches sink',
        paragraphs: [
          'Opening the oven in the first 10 minutes drops them. So does a tin that is too full. If the crumb is dry, the oven was hot or they stayed in too long. The skewer test is more reliable than the clock.',
        ],
      },
    ],
  },
  {
    slug: 'red-velvet-cupcake-recipe',
    title: 'Red Velvet Cupcake Recipe',
    description:
      'Red velvet cupcakes with a cocoa crumb and cream-cheese frosting. A home batch of 12, plus the Melbourne menu version.',
    excerpt: 'A little cocoa, buttermilk, and cream-cheese frosting.',
    category: 'Recipes',
    publishedAt: '2026-03-03',
    readingTime: 7,
    tags: ['red velvet cupcake recipe', 'red velvet cupcakes'],
    featuredImage: {
      url: '/images/blog/red-velvet-cupcake-recipe.webp',
      alt: 'Red velvet cupcakes with cream-cheese frosting',
    },
    sections: [
      {
        paragraphs: [
          'Red velvet is a cocoa cake coloured red, finished with cream-cheese frosting. It is not a chocolate cake and it is not a vanilla cake. This home batch makes 12. Our menu cupcakes and the 6-inch and 8-inch red velvet cakes are the delivered version.',
        ],
      },
      {
        heading: 'Sponge',
        paragraphs: [
          'Heat the oven to 170°C fan. Whisk 140g caster sugar with 80ml vegetable oil and 1 egg. Stir in 1 tablespoon of red food colour and 1 teaspoon of vanilla. Sift 130g plain flour, 1 tablespoon of cocoa and half a teaspoon of bicarb. Add that, then 80ml buttermilk, then 1 teaspoon of white vinegar. Bake 16–18 minutes. The vinegar and bicarb are what lift it. Do not skip them.',
        ],
      },
      {
        heading: 'Cream-cheese frosting',
        paragraphs: [
          'Beat 200g of cold cream cheese with 60g of soft butter until smooth. Add 180g icing sugar. Keep it cool. Warm cream cheese goes slack and will not pipe.',
        ],
      },
    ],
  },
  {
    slug: 'oreo-cupcakes-recipe',
    title: 'Cookies and Cream Cupcake Recipe',
    description:
      'Cookies and cream cupcakes: chocolate sponge, crushed biscuit and a cookies-and-cream frosting. Home method, plus the Melbourne menu cupcakes.',
    excerpt: 'Chocolate cake, crushed biscuit, and a pale frosting.',
    category: 'Recipes',
    publishedAt: '2026-03-04',
    readingTime: 6,
    tags: ['oreo cupcakes', 'cookies and cream cupcakes'],
    featuredImage: {
      url: '/images/blog/oreo-cupcakes-recipe.webp',
      alt: 'Cookies and cream cupcakes',
    },
    sections: [
      {
        paragraphs: [
          'People search for an Oreo cupcake recipe when they want chocolate cake, crushed chocolate biscuit and a sweet cookies-and-cream frosting. Bake the chocolate cupcakes from our chocolate recipe, then use this frosting. We sell the same idea as cookies and cream cupcakes. We do not sell a branded biscuit product.',
        ],
      },
      {
        heading: 'Frosting',
        paragraphs: [
          'Beat 150g soft butter with 220g icing sugar. Crush 6 chocolate sandwich biscuits to a rubble, not a dust, and fold them through with 1 tablespoon of milk. Pile it on cooled cakes and add a little more biscuit on top.',
          'The biscuit softens overnight. Ice them the day you eat them.',
        ],
      },
    ],
  },
  {
    slug: 'how-to-make-a-smash-cake',
    title: 'How to Make a Smash Cake',
    description:
      'How to make a small smash cake for a first birthday: a four-inch vanilla sponge, a thin coat of frosting, and no hard decorations.',
    excerpt: 'A small cake for photos, not for the adults.',
    category: 'Guides',
    publishedAt: '2026-03-05',
    readingTime: 5,
    tags: ['how to make a smash cake', 'smash cake melbourne'],
    featuredImage: {
      url: '/images/blog/how-to-make-a-smash-cake.webp',
      alt: 'Small smash cake for a first birthday',
    },
    sections: [
      {
        paragraphs: [
          'A smash cake is a small cake a baby can pull apart. The adults eat something else. Keep the baby’s cake plain, small and free of nuts and hard lollies.',
        ],
      },
      {
        heading: 'Size and bake',
        paragraphs: [
          'Use a 10cm tin and a half batch of the vanilla cupcake batter, baked as one cake for about 20 minutes at 170°C fan. Level the top. A single layer is enough. Two layers look taller in photos and are harder for a baby to manage.',
          'Spread a thin coat of buttercream. Skip sprinkles that are hard, and skip dark colours if you care about stains. Sit the baby down, take the photo, and take the cake away when they are done.',
        ],
      },
      {
        heading: 'Ordering one in Melbourne',
        paragraphs: [
          'We bake smash cakes to order and deliver them on a weekday, with three days’ notice. The grown-up cupcakes are a separate box. We do not run the photo session.',
        ],
      },
    ],
  },
  {
    slug: 'how-many-cupcakes-for-a-wedding',
    title: 'How Many Cupcakes for a Wedding',
    description:
      'How many wedding cupcakes to order: one each if there is also a cake, about one and a half if cupcakes are the dessert. Melbourne delivery notes.',
    excerpt: 'A simple count before you order a wedding box or a tier.',
    category: 'Guides',
    publishedAt: '2026-03-06',
    readingTime: 5,
    tags: ['wedding cupcakes', 'cupcake wedding cake'],
    featuredImage: {
      url: '/images/blog/how-many-cupcakes-for-a-wedding.webp',
      alt: 'Wedding cupcake display',
    },
    sections: [
      {
        paragraphs: [
          'Count guests who will eat dessert, not the whole invitation list. Children usually take one. A lot of adults take one and leave half.',
        ],
      },
      {
        heading: 'The numbers',
        paragraphs: [
          'If there is a cutting cake as well, order one cupcake a guest. If cupcakes are the only dessert, order one and a half. Mini cupcakes are smaller, so use two minis where you would have used one full cupcake.',
          'A box of 12 is a starting order, not a wedding. A full tier is quoted to the guest count, the colours and the date. Weddings need longer notice, so book early.',
        ],
      },
      {
        heading: 'Stands',
        paragraphs: [
          'We do not sell cupcake stands. Hire the stand, and we deliver the cupcakes. They need to be eaten the day they arrive.',
        ],
      },
    ],
  },
  {
    slug: 'are-macarons-gluten-free',
    title: 'Are Macarons Gluten Free?',
    description:
      'Macarons are made with almond meal, not wheat flour. Our Melbourne kitchen also handles wheat, so read this before you order them as gluten-free.',
    excerpt: 'No wheat flour in the shell. Wheat is still in the kitchen.',
    category: 'Dietary',
    publishedAt: '2026-03-07',
    readingTime: 4,
    tags: ['are macarons gluten free', 'gluten free macarons'],
    featuredImage: {
      url: '/images/blog/are-macarons-gluten-free.webp',
      alt: 'Macarons on a plate',
    },
    sections: [
      {
        paragraphs: [
          'A macaron shell is almond meal, egg white and sugar. There is no wheat flour in that mixture. That is why people call them gluten-free.',
        ],
      },
      {
        heading: 'The kitchen matters more than the recipe',
        paragraphs: [
          'Our kitchen also bakes wheat sponges. Made in a shared kitchen that also handles nuts, gluten, dairy, eggs, soy and sesame, so not suitable for severe allergies or coeliac disease. For other dietary questions, please contact us before ordering.',
          'The product we label gluten-free is the gluten-free red velvet cupcake, which is a different bake. Do not swap the two in your head.',
        ],
      },
    ],
  },
  {
    slug: 'kids-birthday-cake-ideas-melbourne',
    title: 'Kids Birthday Cake Ideas in Melbourne',
    description:
      'Kids birthday cake ideas we actually bake in Melbourne: dress cakes, giant cupcakes, and themed boxes. What is on the menu and what is quoted.',
    excerpt: 'Elsa, unicorns, dinosaurs and a box of cupcakes for everyone else.',
    category: 'Guides',
    publishedAt: '2026-03-08',
    readingTime: 5,
    tags: ['kids birthday cakes melbourne', 'kids cakes'],
    featuredImage: {
      url: '/images/blog/kids-birthday-cake-ideas-melbourne.webp',
      alt: 'Kids birthday cake ideas from The Cupcake Desire',
    },
    sections: [
      {
        paragraphs: [
          'The cakes children ask for fall into two piles: ones we already ice every week, and ones we build from a photo.',
        ],
      },
      {
        heading: 'On the menu',
        paragraphs: [
          'Elsa, Belle and Ariel dress cakes. Giant cupcakes in pink, blue and aqua that serve about 20. Birthday cupcakes in a box of 12. Those have a price and a product page.',
        ],
      },
      {
        heading: 'From a photo',
        paragraphs: [
          'Bluey, Minecraft, dinosaurs, unicorns and Barbie-style pink gowns are quoted. Send the date, the servings and a picture. Cakes need three days. We deliver on weekdays, not the same day, from Narre Warren.',
        ],
      },
    ],
  },
  {
    slug: 'halloween-cupcake-ideas-melbourne',
    title: 'Halloween Cupcake Ideas for Melbourne Parties',
    description:
      'Halloween cupcake ideas for kids parties, school and the office, plus how many to order and how delivery works across Melbourne Metro.',
    excerpt:
      'Pumpkin patch swirls, friendly ghosts and spooky dark frosting for Melbourne Halloween parties, with delivery timing for 2026.',
    category: 'Guides',
    publishedAt: '2026-10-01',
    readingTime: 7,
    tags: [
      'halloween cupcake ideas melbourne',
      'halloween cupcakes melbourne',
      'halloween party treats',
    ],
    author: { name: 'Rupal Mahajan', avatar: '/images/Rupal-Mahajan-Author-Picture.webp' },
    featuredImage: {
      url: '/images/halloween/halloween-blog-hero.webp',
      alt: 'Halloween cupcake ideas for Melbourne parties from The Cupcake Desire',
    },
    sections: [
      {
        paragraphs: [
          'Halloween in Melbourne lands in spring, which means longer evenings, school parties and plenty of office afternoon teas. Cupcakes suit the day well: they are easy to share, easy to theme and need no cutting. Here are some ideas from our kitchen, plus the practical bits on ordering.',
        ],
      },
      {
        heading: 'Pumpkin patch cupcakes',
        paragraphs: [
          'Orange swirls with a green leaf on top turn a box of cupcakes into a little pumpkin patch. They suit a family dinner or a classroom, and the colours look great in photos.',
        ],
      },
      {
        heading: 'Friendly ghosts for younger kids',
        paragraphs: [
          'White frosting piped into a tall swirl with two little eyes reads as a ghost straight away, and it is cute rather than scary. Ideal for a kids party where some guests are very small.',
        ],
      },
      {
        heading: 'Spooky dark cupcakes for grown ups',
        paragraphs: [
          'Black and deep purple frosting with a sprinkle mix gives a moodier look for an adult party or an office Halloween table.',
        ],
      },
      {
        heading: 'Minis for sharing tables',
        paragraphs: [
          'Mini cupcakes let guests try a few flavours, and they go further at a busy party. Browse our [mini cupcakes](/collections/mini-cupcakes).',
        ],
      },
      {
        heading: 'Make one cake the centrepiece',
        paragraphs: [
          'A Halloween cake on the table, surrounded by cupcakes, gives your party a focal point. See our [Halloween cakes](/collections/halloween-cakes).',
        ],
      },
      {
        heading: 'How many cupcakes for a Halloween party?',
        paragraphs: [
          'Plan around one cupcake per guest, or two to three minis per guest when other food is served. Our [Halloween party treats guide](/halloween-party-treats-melbourne) covers kids, school and office parties in more detail.',
        ],
      },
      {
        heading: 'Dietary needs',
        paragraphs: [
          'Vegan, eggless and gluten free options are available and are made in a shared kitchen. Everything is made in a shared kitchen that also handles nuts, gluten, dairy, eggs, soy and sesame, so it is not suitable for severe allergies or coeliac disease.',
        ],
      },
      {
        heading: 'Getting them delivered',
        paragraphs: [
          'We are an online bakery delivering across Melbourne Metro on weekdays, between 9am and 3pm. Order by noon for next-weekday delivery. Delivery fees are typically $0 to $20, and the exact fee shows at checkout. Halloween 2026 falls on a Saturday, so for a weekend party book Friday 30 October. See the areas we cover on our [cupcake delivery page](/cupcake-delivery).',
        ],
      },
      {
        heading: 'Ready to order?',
        paragraphs: [
          'Shop our [Halloween cupcakes](/collections/halloween-cupcakes), or browse everything on our [homepage](/). Questions? Call 03 9705 0051.',
        ],
      },
    ],
  },
]

export function getKeywordBlog(slug: string) {
  return KEYWORD_BLOGS.find((post) => post.slug === slug) || null
}
