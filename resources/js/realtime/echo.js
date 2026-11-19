import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

/**
 * Create a Laravel Echo client configured for Laravel Reverb
 * using Equiply's stateless Sanctum Bearer token authentication.
 */
export function createEchoClient(token) {
    const appKey = import.meta.env.VITE_REVERB_APP_KEY;
    if (!appKey) {
        return null;
    }

    const scheme = import.meta.env.VITE_REVERB_SCHEME || 'http';
    const host = import.meta.env.VITE_REVERB_HOST || window.location.hostname;
    const port = Number(import.meta.env.VITE_REVERB_PORT || (scheme === 'https' ? 443 : 8080));

    const headers = {
        Accept: 'application/json',
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    return new Echo({
        broadcaster: 'reverb',
        key: appKey,
        wsHost: host,
        wsPort: port,
        wssPort: port,
        forceTLS: scheme === 'https',
        enabledTransports: ['ws', 'wss'],
        authEndpoint: '/api/broadcasting/auth',
        auth: {
            headers,
        },
    });
}
