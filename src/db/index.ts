import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// `@auth/drizzle-adapter` detects the SQL dialect from a real drizzle instance at
// module load, so the instance must be constructed eagerly. `neon()` must not throw
// on a missing connection string either, or `next build` fails for every route that
// imports auth. A format-valid placeholder keeps construction safe; a genuinely
// missing env then fails only the individual DB-backed request, never the build.
const PLACEHOLDER_URL =
  'postgresql://placeholder:placeholder@placeholder.neon.tech/placeholder?sslmode=require';

export const db = drizzle(neon(process.env.DATABASE_URL || PLACEHOLDER_URL), { schema });

/** App code should use this — it fails loudly instead of querying the placeholder. */
export function getDb() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
  return db;
}

export { schema };
