import { MongoClient } from 'mongodb'

const dbName = process.env.MONGODB_DB || 'gateflow'

// In dev, Next.js hot-reloads modules, which would otherwise open a new
// connection on every edit. Cache the client promise on the global object
// so it's reused across reloads. In production each serverless invocation
// gets a fresh module scope, so this simply memoizes per warm instance.
export async function getDb() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error(
      'Missing MONGODB_URI. Copy .env.local.example to .env.local (locally) or set it in your ' +
        "Vercel project's Environment Variables (in production)."
    )
  }

  if (!globalThis._gateflowMongoClientPromise) {
    const client = new MongoClient(uri)
    globalThis._gateflowMongoClientPromise = client.connect()
  }

  const client = await globalThis._gateflowMongoClientPromise
  return client.db(dbName)
}
