/**
 * Système de détection géographique de la langue pour Dropsiders.
 * Français dans les pays francophones, Anglais dans le reste du monde.
 */

export type SupportedLanguage = 'fr' | 'en';

/**
 * Liste des codes pays (ISO 3166-1 alpha-2) francophones :
 * Pays et territoires où le français est langue officielle, co-officielle ou d'usage majeur.
 */
export const FRANCOPHONE_COUNTRIES = new Set<string>([
    // Europe
    'FR', // France
    'BE', // Belgique
    'CH', // Suisse
    'LU', // Luxembourg
    'MC', // Monaco
    'AD', // Andorre

    // Amériques & Caraïbes
    'CA', // Canada (Québec / bilingue)
    'HT', // Haïti

    // Territoires et départements d'outre-mer français
    'GP', // Guadeloupe
    'MQ', // Martinique
    'GF', // Guyane française
    'RE', // La Réunion
    'YT', // Mayotte
    'NC', // Nouvelle-Calédonie
    'PF', // Polynésie française
    'PM', // Saint-Pierre-et-Miquelon
    'BL', // Saint-Barthélemy
    'MF', // Saint-Martin
    'WF', // Wallis-et-Futuna

    // Afrique (Nord, Ouest, Centrale, Est)
    'DZ', // Algérie
    'MA', // Maroc
    'TN', // Tunisie
    'SN', // Sénégal
    'CI', // Côte d'Ivoire
    'CM', // Cameroun
    'CD', // République démocratique du Congo
    'CG', // République du Congo
    'MG', // Madagascar
    'ML', // Mali
    'BF', // Burkina Faso
    'NE', // Niger
    'TG', // Togo
    'BJ', // Bénin
    'GN', // Guinée
    'TD', // Tchad
    'RW', // Rwanda
    'BI', // Burundi
    'GA', // Gabon
    'DJ', // Djibouti
    'KM', // Comores
    'SC', // Seychelles
    'CF', // Centrafrique
    'MR', // Mauritanie
    'GQ', // Guinée équatoriale

    // Moyen-Orient & Océanie
    'LB', // Liban
    'VU', // Vanuatu
]);

/**
 * Vérifie si un code pays (ISO 3166-1 alpha-2) est un pays francophone.
 */
export function isFrancophoneCountry(countryCode?: string | null): boolean {
    if (!countryCode || typeof countryCode !== 'string') return false;
    return FRANCOPHONE_COUNTRIES.has(countryCode.trim().toUpperCase());
}

/**
 * Renvoie 'fr' si le pays est francophone, sinon 'en'.
 */
export function getLanguageForCountry(countryCode?: string | null): SupportedLanguage {
    return isFrancophoneCountry(countryCode) ? 'fr' : 'en';
}

/**
 * Motifs de fuseaux horaires fortement associés à des régions francophones.
 */
const FRENCH_TIMEZONES = [
    'Paris', 'Brussels', 'Zurich', 'Monaco', 'Luxembourg', 'Andorra',
    'Montreal', 'Port-au-Prince',
    'Casablanca', 'Algiers', 'Tunis', 'Dakar', 'Abidjan', 'Douala', 'Kinshasa',
    'Brazzaville', 'Antananarivo', 'Bamako', 'Ouagadougou', 'Niamey', 'Lome',
    'Cotonou', 'Conakry', 'Ndjamena', 'Kigali', 'Bujumbura', 'Libreville',
    'Djibouti', 'Reunion', 'Mayotte', 'Noumea', 'Tahiti', 'Beirut'
];

/**
 * Estimation synchrone ultra-rapide (0 ms) pour éviter tout délai ou scintillement
 * au tout premier affichage avant la fin des requêtes réseau.
 */
export function getInitialGuessedLanguage(): SupportedLanguage {
    // 1. Vérifier si un pays a déjà été mis en cache précédemment
    try {
        const cachedCountry = localStorage.getItem('dropsiders_geo_country');
        if (cachedCountry) {
            return getLanguageForCountry(cachedCountry);
        }
    } catch {
        // localStorage non disponible ou privé
    }

    // 2. Heuristique du fuseau horaire
    try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        if (FRENCH_TIMEZONES.some(zone => tz.includes(zone))) {
            return 'fr';
        }
    } catch {
        // fallback
    }

    // 3. Heuristique de langue du navigateur
    if (typeof navigator !== 'undefined') {
        const lang = (navigator.language || (navigator.languages && navigator.languages[0]) || '').toLowerCase();
        if (lang.startsWith('fr')) {
            return 'fr';
        }
    }

    // Par défaut pour le reste du monde : anglais
    return 'en';
}

/**
 * Détecte le pays et la langue correspondante via les APIs disponibles :
 * 1. Endpoint Cloudflare interne : /api/geo
 * 2. Fallback API IP externe : https://api.country.is
 * 3. Fallback heuristique local (fuseau horaire / navigateur)
 */
export async function detectUserCountryAndLanguage(): Promise<{
    country: string | null;
    language: SupportedLanguage;
    source: 'cloudflare' | 'external_api' | 'cache' | 'heuristic';
}> {
    // 1. Si on a déjà détecté le pays dans les 7 derniers jours en cache
    try {
        const cachedCountry = localStorage.getItem('dropsiders_geo_country');
        const cachedTime = localStorage.getItem('dropsiders_geo_time');
        const now = Date.now();
        const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

        if (cachedCountry && cachedTime && now - parseInt(cachedTime, 10) < SEVEN_DAYS_MS) {
            return {
                country: cachedCountry,
                language: getLanguageForCountry(cachedCountry),
                source: 'cache'
            };
        }
    } catch {
        // ignorer erreurs localStorage
    }

    // 2. Tester l'endpoint interne /api/geo (Cloudflare natif)
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);

        const res = await fetch('/api/geo', {
            signal: controller.signal,
            headers: { 'Accept': 'application/json' }
        });
        clearTimeout(timeoutId);

        if (res.ok) {
            const data = await res.json();
            if (data && typeof data.country === 'string' && data.country.length === 2) {
                const countryCode = data.country.toUpperCase();
                try {
                    localStorage.setItem('dropsiders_geo_country', countryCode);
                    localStorage.setItem('dropsiders_geo_time', Date.now().toString());
                } catch {
                    // ignore
                }
                return {
                    country: countryCode,
                    language: getLanguageForCountry(countryCode),
                    source: 'cloudflare'
                };
            }
        }
    } catch {
        // En local ou si l'API interne n'est pas encore connectée, continuer au fallback
    }

    // 3. Fallback vers https://api.country.is
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);

        const res = await fetch('https://api.country.is', {
            signal: controller.signal,
            headers: { 'Accept': 'application/json' }
        });
        clearTimeout(timeoutId);

        if (res.ok) {
            const data = await res.json();
            if (data && typeof data.country === 'string' && data.country.length === 2) {
                const countryCode = data.country.toUpperCase();
                try {
                    localStorage.setItem('dropsiders_geo_country', countryCode);
                    localStorage.setItem('dropsiders_geo_time', Date.now().toString());
                } catch {
                    // ignore
                }
                return {
                    country: countryCode,
                    language: getLanguageForCountry(countryCode),
                    source: 'external_api'
                };
            }
        }
    } catch {
        // Fallback final
    }

    // 4. Fallback heuristique local
    const guessedLang = getInitialGuessedLanguage();
    return {
        country: null,
        language: guessedLang,
        source: 'heuristic'
    };
}
