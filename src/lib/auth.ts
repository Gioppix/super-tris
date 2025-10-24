import { LRUCache } from 'lru-cache';
import { DATABASE_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from '$env/static/private';
import { betterAuth } from 'better-auth';
import { anonymous } from 'better-auth/plugins';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import * as schema from '../migrations/auth-schema';

export const db = drizzle(DATABASE_URL);

await migrate(db, { migrationsFolder: './drizzle' });

export const cache = new LRUCache<string, string>({
    max: 500,
    ttl: 1000 * 60 * 60,
    // While hosting, RAM is much more expensive than the computation required to clear
    ttlAutopurge: true
});

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: 'pg',
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
