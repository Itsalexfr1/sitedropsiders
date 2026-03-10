// --- CONFIGURATION PUSH ---
// Ta clé VAPID publique (générée via web-push)
export const VAPID_PUBLIC_KEY = 'BGMpEqmZLss9GcRaT-ON63yjLvQYjowck_ZYpePbiV5qHeC0sBXkcIgyGOa0k98wD62nv69XEAlGz6_PKKqqiaA';

/**
 * Convertit une clé VAPID base64 en Uint8Array pour le navigateur
 */
export function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/**
 * Souscrit l'utilisateur aux notifications Push
 */
export async function subscribeUser() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push Notifications are not supported in this browser.');
        return null;
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        console.log('SW Ready for push subscription');

        // On demande la permission explicitement SI ce n'est pas déjà fait
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            throw new Error('Notification permission denied');
        }

        // On récupère ou crée la souscription
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
            console.log('No existing subscription, creating new one...');
            const subscribeOptions = {
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            };
            subscription = await registration.pushManager.subscribe(subscribeOptions);
        }

        console.log('User is subscribed:', subscription);

        // Envoyer au serveur (Optionnel si tu n'as pas encore de backend Push)
        try {
            await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscription })
            });
        } catch (e) {
            console.warn('Backend sync failed, but local subscription ok', e);
        }

        return subscription;
    } catch (error: any) {
        console.error('Failed to subscribe user:', error);
        throw error;
    }
}

/**
 * Déclenche une notification locale (test)
 */
export async function triggerTestNotification() {
    if (!('serviceWorker' in navigator)) return;

    const registration = await navigator.serviceWorker.ready;
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
        const options: any = {
            body: 'Ceci est une notification de test locale ! Tout fonctionne.',
            icon: '/android-chrome-192x192.png',
            badge: '/android-chrome-192x192.png',
            vibrate: [100, 50, 100],
            data: { url: '/' }
        };
        registration.showNotification('DROPSIDERS TEST 🚀', options);
    }
}

export async function unsubscribeUser() {
    if (!('serviceWorker' in navigator)) return false;

    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            await subscription.unsubscribe();

            // Notify server
            try {
                await fetch('/api/push/unsubscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ endpoint: subscription.endpoint })
                });
            } catch (e) { /* ignore */ }
        }
        return true;
    } catch (error: any) {
        console.error('Failed to unsubscribe user:', error);
        return false;
    }
}
