import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error('MONGODB_URI missing')
  process.exit(1)
}

const KEEP = [
  'best-cupcake-shops-in-melbourne-cbd',
  'where-to-buy-gluten-free-cupcakes',
]

async function main() {
  await mongoose.connect(MONGODB_URI)
  const col = mongoose.connection.db.collection('blogposts')

  const toDelete = await col
    .find({ slug: { $nin: KEEP } })
    .project({ slug: 1, title: 1 })
    .toArray()

  console.log('Deleting:', toDelete.map((p) => p.slug))

  const result = await col.deleteMany({ slug: { $nin: KEEP } })
  console.log('Deleted count:', result.deletedCount)

  const remaining = await col.find({}).project({ slug: 1, title: 1 }).toArray()
  console.log('Remaining:', remaining)

  await mongoose.disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
