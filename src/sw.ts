/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);

// Handle Push Notifications
self.addEventListener('push', (event: PushEvent) => {
    if (!event.data) return;

    try {
        const data = event.data.json();
        const options: NotificationOptions = {
            body: data.body || 'Nouvel artiste sur scène !',
            icon: data.icon || '/android-chrome-192x192.png',
            badge: data.badge || '/android-chrome-192x192.png',
            vibrate: [200, 100, 200, 100, 200], // Makes the phone vibrate "officially"
            data: {
                url: data.url || '/'
            },
            actions: [
                { action: 'open', title: 'Voir le Live' },
                { action: 'close', title: 'Fermer' }
            ],
            tag: 'artist-live', // Replaces old notifications with new ones
            renotify: true
        };

        event.waitUntil(
            self.registration.showNotification(data.title || 'DROPSIDERS LIVE', options)
        );
    } catch (e) {
        console.error('Error handling push event:', e);
    }
});

// Handle Notification Clicks
self.addEventListener('notificationclick', (event: NotificationEvent) => {
    event.notification.close();

    if (event.action === 'close') return;

    const urlToOpen = (event.notification.data.url as string) || '/';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // If a window is already open, focus it
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i] as WindowClient;
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            // Otherwise open a new window
            if (self.clients.openWindow) {
                return self.clients.openWindow(urlToOpen);
            }
        })
    );
});
