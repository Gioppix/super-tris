import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from '$env/static/private';
import { betterAuth } from 'better-auth';
import { anonymous } from 'better-auth/plugins';
import { cache, db } from './server/database';

export const auth = betterAuth({
    database: db,
    socialProviders: {
        google: {
            clientId: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET
        }
    },
    plugins: [anonymous()]
    // secondaryStorage: {
    //     get: async (key: string) => {
    //         return cache.get(key);
    //     },
    //     set: async (key: string, value: string, ttl?: number) => {
    //         cache.set(key, value, { ttl });
    //     },
    //     delete: async (key: string) => {
    //         cache.delete(key);
    //     }
    // }
});
