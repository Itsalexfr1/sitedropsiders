// ─── Thème événementiel Radio Dropsiders ──────────────────────────────────────
// "Escape Psycho Circus" — Édition Halloween
// Actif en octobre et repasse automatiquement en mode normal le 1er novembre 00:00:00.

export const ESCAPE_PSYCHO_CIRCUS_BG = '/images/radio_escape_psycho_circus.jpg';

export interface RadioThemeConfig {
    isActive: boolean;
    bgImage: string;
    badgeLabel: string;
    editionLabel: string;
    accentColor: string;
}

/**
 * Détermine si le thème événementiel "Escape Psycho Circus" (Halloween) est actif.
 * Il est actif durant le mois d'octobre et repasse automatiquement en mode normal
 * dès le 1er novembre 00:00:00 (heure de Paris).
 *
 * Supporte les paramètres URL pour tester à tout moment :
 * ?radio_theme=escape => force le thème Escape Psycho Circus
 * ?radio_theme=normal => force le thème normal par défaut
 */
export function isEscapePsychoCircusActive(): boolean {
    if (typeof window !== 'undefined') {
        try {
            const params = new URLSearchParams(window.location.search);
            const override = params.get('radio_theme');
            if (override === 'escape') return true;
            if (override === 'normal') return false;
        } catch {}
    }

    try {
        const now = new Date();
        const year = now.getFullYear();
        // 1er Novembre de l'année en cours à 00:00:00 (mois 10 en JS car 0=Janvier, 9=Octobre, 10=Novembre)
        const expiry = new Date(year, 10, 1, 0, 0, 0);

        // Actif en octobre (mois index 9) et avant le 1er novembre
        return now.getMonth() === 9 && now < expiry;
    } catch {
        return false;
    }
}
