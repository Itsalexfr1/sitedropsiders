// ─── Thèmes événementiels Radio Dropsiders ──────────────────────────────────────
// "Escape Psycho Circus" — Édition Halloween (Octobre)
// "Dropsiders Winter / Christmas Edition" — Édition Noël & Fêtes de fin d'année (Décembre)

export const ESCAPE_PSYCHO_CIRCUS_BG = '/images/radio_escape_psycho_circus.jpg';
export const CHRISTMAS_RADIO_BG = '/images/radio_christmas_bg.jpg';

export type RadioSeasonalTheme = 'halloween' | 'christmas' | 'default';

export interface RadioThemeConfig {
    isActive: boolean;
    theme: RadioSeasonalTheme;
    bgImage?: string;
    badgeLabel: string;
    editionLabel: string;
    accentColor: string;
}

/**
 * Détermine si le thème événementiel Halloween ("Escape Psycho Circus") est actif.
 * Actif durant tout le mois d'octobre (jusqu'au 1er novembre 00:00:00).
 * Paramètres URL : ?radio_theme=escape ou ?radio_theme=halloween
 */
export function isEscapePsychoCircusActive(): boolean {
    if (typeof window !== 'undefined') {
        try {
            const params = new URLSearchParams(window.location.search);
            const override = params.get('radio_theme');
            if (override === 'escape' || override === 'halloween') return true;
            if (override === 'normal' || override === 'default' || override === 'christmas') return false;
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

/** Alias plus explicite */
export const isHalloweenThemeActive = isEscapePsychoCircusActive;

/**
 * Détermine si le thème événementiel Noël ("Dropsiders Xmas") est actif.
 * Actif durant tout le mois de décembre (mois index 11) jusqu'au 2 janvier.
 * Paramètres URL : ?radio_theme=christmas ou ?radio_theme=noel
 */
export function isChristmasThemeActive(): boolean {
    if (typeof window !== 'undefined') {
        try {
            const params = new URLSearchParams(window.location.search);
            const override = params.get('radio_theme');
            if (override === 'christmas' || override === 'noel' || override === 'xmas') return true;
            if (override === 'normal' || override === 'default' || override === 'escape' || override === 'halloween') return false;
        } catch {}
    }

    try {
        const now = new Date();
        // Mois de décembre (11) ou 1er janvier (0)
        return now.getMonth() === 11 || (now.getMonth() === 0 && now.getDate() <= 2);
    } catch {
        return false;
    }
}

/**
 * Retourne le thème actif courant
 */
export function getCurrentRadioTheme(): RadioSeasonalTheme {
    if (isChristmasThemeActive()) return 'christmas';
    if (isEscapePsychoCircusActive()) return 'halloween';
    return 'default';
}
