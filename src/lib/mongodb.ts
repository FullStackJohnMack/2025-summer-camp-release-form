import { MongoClient } from "mongodb";

const cached: { client: MongoClient | null } = { client: null };

export async function getMongoClient() {

    console.log("→ Connecting to Mongo with:", process.env.MONGODB_URI);
  if (cached.client) return cached.client;
  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();
  cached.client = client;
  return client;
}
