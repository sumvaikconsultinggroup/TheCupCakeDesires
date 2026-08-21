/**
 * Updates Rupal Mahajan author bio on seeded blog posts.
 * Usage: node --env-file=.env.local scripts/update-blog-author-rupal.mjs
 */
import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error('MONGODB_URI missing')
  process.exit(1)
}

const author = {
  name: 'Rupal Mahajan',
  avatar: '/images/Rupal-Mahajan-Author-Picture.webp',
  bio: 'Rupal Mahajan is the proud owner and creative heart behind Cupcake Desire, a beloved bakery I established in 2012. What began as a simple passion for baking quickly blossomed into a thriving business built on my commitment to quality, customer service, and spreading happiness through every bite. With an unwavering dedication to crafting cupcakes that delight both the eye and the palate, I have turned my love for baking into a joyful journey—one that continues to bring smiles to my community every day. Beyond the kitchen, I also enjoy sharing meaningful insights and valuable knowledge from the baking world through my self-written blogs. Whether it’s answering the questions people often wonder about or exploring trends shaping the industry, these writings allow me to connect on a deeper, more personal level with those who appreciate the craft. Through storytelling and helpful guidance, I hope to inspire curiosity, spark creativity, and make the world of cupcakes feel a little closer to everyone who follows my journey.',
}

const SLUGS = [
  'best-cupcake-shops-in-melbourne-cbd',
  'where-to-buy-gluten-free-cupcakes',
  'birthday-party-ideas-melbourne',
  'nut-free-cupcakes-vs-nut-free-cakes',
  'corporate-vegan-cupcakes-for-melbourne-offices',
]

async function main() {
  await mongoose.connect(MONGODB_URI)
  const result = await mongoose.connection.db.collection('blogposts').updateMany(
    { slug: { $in: SLUGS } },
    { $set: { author, updatedAt: new Date() } }
  )
  console.log('Matched:', result.matchedCount, 'Modified:', result.modifiedCount)
  await mongoose.disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
