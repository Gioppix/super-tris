import { env } from '$env/dynamic/private';

export const is_prod = (): boolean => {
    return env.PRODUCTION !== 'false';
};
