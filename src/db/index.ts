import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ DATABASE_URL is not defined in environment variables!");
}

const client = postgres(connectionString || '', { 
  prepare: false,
  onnotice: () => {}, // Silence notices
});

export const db = drizzle(client, { schema });
