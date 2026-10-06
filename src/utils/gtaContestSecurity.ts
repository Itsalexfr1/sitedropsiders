// Utility for Anti-Cheat Fingerprinting & Answer Verification for GTA 6 Dropsiders Contest

export interface GTAContestEntry {
    id: string;
    nom: string;
    prenom: string;
    instagram: string;
    email: string;
    plateforme: 'PlayStation 5 (PS5)' | 'Xbox';
    hasAccountBonus: boolean;
    referralCode: string;
    referredBy?: string;
    referralCount: number;
    totalTickets: number;
    answers: {
        q1: string;
        q2: string;
        q3: string;
    };
    answersValid: {
        q1: boolean;
        q2: boolean;
        q3: boolean;
    };
    isAllCorrect: boolean;
    isOptedIn: boolean;
    optInToken: string;
    fingerprint: string;
    ip?: string;
    createdAt: string;
    optedInAt?: string;
    status: 'VALIDATED' | 'PENDING_OPT_IN' | 'FAILED';
    rejectionReason?: string;
}

// 1. Browser Fingerprint Generator
export async function generateBrowserFingerprint(): Promise<string> {
    const components: string[] = [];

    // Screen specs
    components.push(`screen:${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`);
    components.push(`pixelRatio:${window.devicePixelRatio || 1}`);

    // Navigator
    components.push(`lang:${navigator.language || (navigator as any).userLanguage || ''}`);
    components.push(`platform:${navigator.platform || ''}`);
    components.push(`cores:${navigator.hardwareConcurrency || 'unknown'}`);
    components.push(`tz:${Intl.DateTimeFormat().resolvedOptions().timeZone || ''}`);
    components.push(`offset:${new Date().getTimezoneOffset()}`);

    // Canvas Fingerprint
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 240;
        canvas.height = 60;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.textBaseline = 'top';
            ctx.font = "14px 'Arial'";
            ctx.textBaseline = 'alphabetic';
            ctx.fillStyle = '#f60';
            ctx.fillRect(125, 1, 62, 20);
            ctx.fillStyle = '#069';
            ctx.fillText('Dropsiders GTA6 <canvas> 🌴🎮', 2, 15);
            ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
            ctx.fillText('Dropsiders GTA6 <canvas> 🌴🎮', 4, 17);
            components.push(`canvas:${canvas.toDataURL()}`);
        }
    } catch {
        components.push('canvas:error');
    }

    // WebGL info
    try {
        const glCanvas = document.createElement('canvas');
        const gl = glCanvas.getContext('webgl') || glCanvas.getContext('experimental-webgl');
        if (gl && 'getExtension' in gl) {
            const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                const vendor = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
                const renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                components.push(`webgl:${vendor}~${renderer}`);
            }
        }
    } catch {
        components.push('webgl:none');
    }

    // Hash the concatenated values
    const raw = components.join('###');
    return hashString(raw);
}

// Simple fast SHA-256 / DJB2 fallback hash
async function hashString(str: string): Promise<string> {
    try {
        if (window.crypto && window.crypto.subtle) {
            const msgUint8 = new TextEncoder().encode(str);
            const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
        }
    } catch {
        // Fallback
    }

    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i);
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(16, '0');
}

// 2. Persistent Storage (Cookies + LocalStorage)
const STORAGE_KEY = 'ds_gta6_contest_entry_v2';
const COOKIE_KEY = 'ds_gta6_fp_v2';

export function getLocalContestEntry(): GTAContestEntry | null {
    try {
        const item = localStorage.getItem(STORAGE_KEY);
        if (item) {
            return JSON.parse(item);
        }
    } catch {
        // Ignored
    }
    return null;
}

export function saveLocalContestEntry(entry: GTAContestEntry) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
        // Set cookie 365 days
        const expires = new Date(Date.now() + 365 * 86400 * 1000).toUTCString();
        document.cookie = `${COOKIE_KEY}=${entry.id}; expires=${expires}; path=/; SameSite=Lax`;
    } catch {
        // Ignored
    }
}

export function checkHasAlreadyParticipated(fingerprint: string): { alreadyPlayed: boolean; entry?: GTAContestEntry } {
    const local = getLocalContestEntry();
    if (local) {
        return { alreadyPlayed: true, entry: local };
    }

    // Check cookie
    const hasCookie = document.cookie.split(';').some(c => c.trim().startsWith(`${COOKIE_KEY}=`));
    if (hasCookie) {
        return { alreadyPlayed: true };
    }

    // Check all entries in local registry
    const all = getAllContestEntries();
    const match = all.find(e => e.fingerprint === fingerprint);
    if (match) {
        return { alreadyPlayed: true, entry: match };
    }

    return { alreadyPlayed: false };
}

// Global registry in localStorage for immediate client reactivity & offline/mock fallback
const REGISTRY_KEY = 'ds_gta6_contest_all_entries_v2';

export function getAllContestEntries(): GTAContestEntry[] {
    try {
        const raw = localStorage.getItem(REGISTRY_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                // Filtrer automatiquement les anciens faux participants de test
                return parsed.filter(e => !e.id.startsWith('gta-10'));
            }
        }
    } catch {}
    
    return [];
}

export function saveAllContestEntries(entries: GTAContestEntry[]) {
    try {
        localStorage.setItem(REGISTRY_KEY, JSON.stringify(entries));
    } catch {}
}

// 3. Normalization & Answers Verification
export function cleanString(str: string): string {
    return (str || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // remove accents
        .replace(/[^a-z0-9\s&]/g, ' ') // keep alphanumeric, spaces, and ampersand
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Question 1: "QUEL EST L'ARTISTE QU'ON DOIT RÉCUPÉRER DANS GTA 5 ?"
 * Attendu: Solomun
 */
export function verifyQuestion1(ans: string): boolean {
    const clean = cleanString(ans);
    return clean.includes('solomun') || clean.includes('solomon');
}

/**
 * Question 2: "QUEL EST LE GROUPE QUI APPARAÎT SUR CAYO PERICO LORS DE GTA 5 ?"
 * Attendu: Keinemusik
 */
export function verifyQuestion2(ans: string): boolean {
    const clean = cleanString(ans);
    return clean.includes('keinemusik') || clean.includes('keine musik');
}

/**
 * Question 3: "QUELS SONT LES ARTISTES QUI ONT SORTI 'FREE YOUR MIND' SUR CIRCOLOCO RECORDS ?"
 * Attendu: Prospa & Cloonee
 */
export function verifyQuestion3(ans: string): boolean {
    const clean = cleanString(ans);
    const hasProspa = clean.includes('prospa');
    const hasCloonee = clean.includes('cloonee') || clean.includes('cloone');
    return hasProspa && hasCloonee;
}

export function evaluateContestAnswers(q1: string, q2: string, q3: string) {
    const q1Valid = verifyQuestion1(q1);
    const q2Valid = verifyQuestion2(q2);
    const q3Valid = verifyQuestion3(q3);
    const isAllCorrect = q1Valid && q2Valid && q3Valid;

    return {
        q1Valid,
        q2Valid,
        q3Valid,
        isAllCorrect
    };
}

// 4. Unique Referral Code Generator
export function generateReferralCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'DS-';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}
