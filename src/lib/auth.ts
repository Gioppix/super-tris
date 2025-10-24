import { LRUCache } from 'lru-cache';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, SQLITE_PATH } from '$env/static/private';
import { betterAuth } from 'better-auth';
import { anonymous } from 'better-auth/plugins';
import Database from 'better-sqlite3';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { mkdirSync } from 'fs';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '../../migrations/auth-schema';

const DB_NAME = 'sqlite.db';
mkdirSync(SQLITE_PATH, { recursive: true });

const sqlite = new Database(`${SQLITE_PATH}/${DB_NAME}`);
const db = drizzle({ client: sqlite, schema });
migrate(db, {
    migrationsFolder: './drizzle'
});

const cache = new LRUCache<string, string>({
    max: 500,
    ttl: 1000 * 60 * 60,
    // While hosting RAM is much more expensive than the computation required to clear
    ttlAutopurge: true
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
    plugins: [anonymous()],
    secondaryStorage: {
        get: async (key: string) => {
            return cache.get(key);
        },
        set: async (key: string, value: string, ttl?: number) => {
            cache.set(key, value, { ttl });
        },
        delete: async (key: string) => {
            cache.delete(key);
        }
    }
});
