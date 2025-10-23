import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, SQLITE_PATH } from '$env/static/private';
import { betterAuth } from 'better-auth';
import { anonymous } from 'better-auth/plugins';
import Database from 'better-sqlite3';

export const auth = betterAuth({
    database: new Database(SQLITE_PATH),
    socialProviders: {
        google: {
            clientId: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET
        }
    },
    plugins: [anonymous()]
});
