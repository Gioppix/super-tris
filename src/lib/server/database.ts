import { DATABASE_URL } from '$env/static/private';
import { LRUCache } from 'lru-cache';
import { Pool } from 'pg';

export const db = new Pool({
    connectionString: DATABASE_URL
});

export const cache = new LRUCache<string, string>({
    max: 500,
    ttl: 1000 * 60 * 60,
    // While hosting, RAM is much more expensive than the computation required to clear
    ttlAutopurge: true
});

export const get_name = async (user_id: string) => {
    const cacheKey = `user:${user_id}:name`;
    const cached = cache.get(cacheKey);
    if (cached) {
        return cached;
    }

    const result = await db.query('SELECT name FROM "user" WHERE id = $1 LIMIT 1', [user_id]);

    const userRecord = result.rows[0];

    const name = userRecord?.name ?? 'Unknown User';
    cache.set(cacheKey, name, { ttl: 1000 * 60 * 5 });
    return name;
};
