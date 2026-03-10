import { lazy, type ComponentType } from 'react';

/**
 * Un wrapper autour de React.lazy qui gère les erreurs de chargement de modules
 * (typiquement quand on déploie une nouvelle version et que les anciens hashes JS ont disparu).
 */
export function lazyRetry<T extends ComponentType<any>>(
    componentImport: () => Promise<{ default: T } | T>
): T {
    return lazy(async () => {
        try {
            const component = await componentImport();
            if (component && typeof component === 'object' && 'default' in component) {
                return component as { default: T };
            }
            return { default: component } as { default: T };
        } catch (error) {
            // Si on échoue à charger le module (Failed to fetch dynamically imported module)
            // On force un rechargement de la page pour récupérer les nouveaux assets indexés par le serveur
            console.error('Module load failed, retrying via page refresh...', error);
            window.location.reload();
            throw error; // On throw quand même pour satisfaire React
        }
    }) as unknown as T;
}
