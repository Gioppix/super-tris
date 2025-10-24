import { cache, db } from '$lib/auth';

export const get_name = async (user_id: string) => {
    const cacheKey = `user:${user_id}:name`;
    const cached = cache.get(cacheKey);
    if (cached) {
        return cached;
    }

    const userRecord = await db.query.user.findFirst({
        where: (users, { eq }) => eq(users.id, user_id),
        columns: { name: true }
    });

    const name = userRecord?.name ?? 'Unknown User';
    cache.set(cacheKey, name, { ttl: 1000 * 60 * 5 });
    return name;
};
