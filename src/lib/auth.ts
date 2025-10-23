import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, SQLITE_PATH } from '$env/static/private';
import { betterAuth } from 'better-auth';
import { anonymous } from 'better-auth/plugins';
import Database from 'better-sqlite3';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '../../migrations/auth-schema';

const DB_NAME = 'sqlite.db';
mkdirSync(dirname(SQLITE_PATH), { recursive: true });

const sqlite = new Database(`${SQLITE_PATH}/${DB_NAME}`);
const db = drizzle({ client: sqlite, schema });
migrate(db, {
    migrationsFolder: './drizzle'
});

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: 'sqlite',
        schema
    }),
    socialProviders: {
        google: {
            clientId: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET
        }
    },
    plugins: [anonymous()]
});
