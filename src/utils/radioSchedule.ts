import { 
    DEFAULT_TV_BLOCKS, 
    parseArtistAndEvent, 
    formatDurationExact, 
    DAYS_OF_WEEK, 
    ALL_DAYS, 
    WEEKDAYS, 
    WEEKEND_DAYS,
    getSeededShuffle
} from './tvSchedule';
import settings from '../data/settings.json';

export { DAYS_OF_WEEK, ALL_DAYS, WEEKDAYS, WEEKEND_DAYS, formatDurationExact };

export const STORAGE_RADIO_BLOCKS_KEY = 'dropsiders_radio_blocks';
export const STORAGE_RADIO_TOP_HORAIRE_KEY = 'dropsiders_radio_top_horaire';

export type RadioTrackCategory = 'liveset' | 'clip' | 'jingle' | 'pub' | 'promo' | 'interview' | 'set' | 'top_horaire';

export interface RadioTrackItem {
    id: string;
    title: string;
    artist?: string;
    youtubeId?: string;
    audioUrl?: string; // Support audio upload MP3 / WAV
    duration?: number; // seconds
    category?: RadioTrackCategory;
    addedAt?: number;
    isTopHoraire?: boolean;
    isThemeJingle?: boolean;
}

export function getRadioCategoryMeta(category?: string, isTheme?: boolean, isTop?: boolean) {
    if (isTop || category === 'top_horaire') {
        return {
            id: 'top_horaire',
            label: 'TOP HORAIRE',
            emoji: '⏰',
            color: '#00f0ff',
            bg: 'bg-cyan-500/15',
            text: 'text-cyan-400',
            border: 'border-cyan-500/40'
        };
    }
    if (isTheme || category === 'generique') {
        return {
            id: 'generique',
            label: 'GÉNÉRIQUE',
            emoji: '🎙️',
            color: '#a855f7',
            bg: 'bg-purple-500/15',
            text: 'text-purple-400',
            border: 'border-purple-500/40'
        };
    }
    switch (category) {
        case 'interview':
            return {
                id: 'interview',
                label: 'INTERVIEW',
                emoji: '🎙️',
                color: '#10b981',
                bg: 'bg-emerald-500/15',
                text: 'text-emerald-400',
                border: 'border-emerald-500/40'
            };
        case 'jingle':
            return {
                id: 'jingle',
                label: 'JINGLE',
                emoji: '🔔',
                color: '#f59e0b',
                bg: 'bg-amber-500/15',
                text: 'text-amber-400',
                border: 'border-amber-500/40'
            };
        case 'pub':
            return {
                id: 'pub',
                label: 'PUB / SPONSOR',
                emoji: '📢',
                color: '#ec4899',
                bg: 'bg-pink-500/15',
                text: 'text-pink-400',
                border: 'border-pink-500/40'
            };
        case 'promo':
            return {
                id: 'promo',
                label: 'PROMO',
                emoji: '📣',
                color: '#f97316',
                bg: 'bg-orange-500/15',
                text: 'text-orange-400',
                border: 'border-orange-500/40'
            };
        case 'clip':
            return {
                id: 'clip',
                label: 'CLIP RADIO',
                emoji: '🎬',
                color: '#3b82f6',
                bg: 'bg-blue-500/15',
                text: 'text-blue-400',
                border: 'border-blue-500/40'
            };
        case 'liveset':
        case 'set':
        default:
            return {
                id: 'set',
                label: 'SET / MIX',
                emoji: '🎧',
                color: '#6366f1',
                bg: 'bg-indigo-500/15',
                text: 'text-indigo-400',
                border: 'border-indigo-500/40'
            };
    }
}

export interface RadioThemeJingle {
    enabled: boolean;
    title: string;
    audioUrl?: string;
    youtubeId?: string;
    duration: number; // in seconds
}

export interface RadioTopHoraireConfig {
    enabled: boolean;
    title: string;
    audioUrl?: string;
    youtubeId?: string;
    duration: number; // in seconds (ex: 10s ou 15s)
}

export const DEFAULT_TOP_HORAIRE: RadioTopHoraireConfig = {
    enabled: true,
    title: 'Dropsiders Radio • Top Horaire Officiel',
    youtubeId: 'CsRTKXYEhOM',
    duration: 10
};

export function getTopHoraireConfig(): RadioTopHoraireConfig {
    try {
        const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_RADIO_TOP_HORAIRE_KEY) : null;
        if (saved) {
            const p = JSON.parse(saved);
            if (p && typeof p.enabled === 'boolean') return p;
        }
    } catch {}
    const fromSettings = (settings as any)?.radio_top_horaire;
    if (fromSettings && typeof fromSettings.enabled === 'boolean') {
        return fromSettings;
    }
    return DEFAULT_TOP_HORAIRE;
}

export interface RadioSpecialJingle {
    id: string;
    title: string;
    audioUrl?: string;
    youtubeId?: string;
    duration: number; // in seconds
    enabled?: boolean;
}

export interface RadioScheduleBlock {
    id: string;
    name: string;
    title: string;
    timeSlot: string;
    startHour: number; // 0..23
    endHour: number; // 1..24 (24 = minuit)
    color: string;
    emoji: string;
    randomize: boolean;
    days?: number[]; // [1..6, 0] où 1=Lun, 6=Sam, 0=Dim. Vide ou absent = 7j/7
    tracks: RadioTrackItem[];
    themeJingle?: RadioThemeJingle; // Générique d'émission avec jingle uploadé
    specialJingles?: RadioSpecialJingle[]; // Jingles spécifiques à cette émission
    jingleFrequency?: number; // Ex: tous les 2, 3 morceaux
}

export interface ComputedRadioScheduleItem {
    id: string;
    blockId: string;
    blockTitle: string;
    blockColor: string;
    blockEmoji: string;
    title: string;
    artist: string;
    event: string;
    youtubeId?: string;
    audioUrl?: string;
    startTime: string;
    endTime: string;
    startSecondsFromMidnight: number;
    durationSeconds: number;
    durationFormatted: string;
    isCurrentlyLive: boolean;
    category?: RadioTrackCategory;
    isTopHoraire?: boolean;
    isThemeJingle?: boolean;
}

/**
 * Construit les blocs radio par défaut en intégrant l'intégralité des 240 sets & clips de la TV
 */
const DEFAULT_SYSTEM_JINGLES: RadioTrackItem[] = [
    {
        id: 'def_jingle_1',
        title: 'Dropsiders Radio • Official Festival ID Jingle',
        artist: 'DROPSIDERS JINGLE',
        youtubeId: 'k5yQBhDnrvM',
        duration: 15,
        category: 'jingle'
    },
    {
        id: 'def_jingle_2',
        title: 'Dropsiders • Drop Alert & Sweeper Sound FX',
        artist: 'DROPSIDERS JINGLE',
        youtubeId: 'CsRTKXYEhOM',
        duration: 10,
        category: 'jingle'
    },
    {
        id: 'def_jingle_3',
        title: 'Dropsiders Radio • Non-Stop Club & Festival Energy',
        artist: 'DROPSIDERS JINGLE',
        youtubeId: '8YbWq5urfww',
        duration: 12,
        category: 'jingle'
    }
];

const DEFAULT_SYSTEM_PUBS: RadioTrackItem[] = [
    {
        id: 'def_pub_1',
        title: 'Publicité Dropsiders Voyages • Packs Festivals & Bus',
        artist: 'SPONSOR',
        youtubeId: 'pQdsHoG2yhw',
        duration: 30,
        category: 'pub'
    },
    {
        id: 'def_pub_2',
        title: 'Spot Partenaire • Dropsiders Shop Officiel & Goodies',
        artist: 'SPONSOR',
        youtubeId: '61tiIdIrjUQ',
        duration: 25,
        category: 'pub'
    }
];

const DEFAULT_SYSTEM_INTERVIEWS: RadioTrackItem[] = [
    {
        id: 'def_inter_1',
        title: 'Interview Exclusive • Martin Garrix en direct de l\'Amsterdam Dance Event',
        artist: 'INTERVIEW',
        youtubeId: 'k5yQBhDnrvM',
        duration: 180,
        category: 'interview'
    }
];

export function buildDefaultRadioBlocksFromTV(): RadioScheduleBlock[] {
    const rawTvBlocks = (settings as any)?.tv_blocks || DEFAULT_TV_BLOCKS;
    if (Array.isArray(rawTvBlocks) && rawTvBlocks.length > 0) {
        return rawTvBlocks.map((b: any, idx: number) => {
            const rawTracks: RadioTrackItem[] = (b.videos || []).map((v: any, vIdx: number) => {
                const { artist } = parseArtistAndEvent(v.title || '');
                return {
                    id: `rt_${v.id || v.youtubeId || vIdx}`,
                    title: v.title,
                    artist: artist || 'Artiste',
                    youtubeId: v.youtubeId,
                    duration: v.duration || 3600,
                    category: (v.category === 'clip' ? 'clip' : 'liveset') as RadioTrackCategory
                };
            });

            // Insérer l'habillage radio par défaut (Jingles, Pubs et Interviews)
            const scheduledTracks: RadioTrackItem[] = [];
            let jIdx = 0;
            let pIdx = 0;

            rawTracks.forEach((track, tIdx) => {
                scheduledTracks.push(track);

                // 1 Jingle après chaque set
                if (DEFAULT_SYSTEM_JINGLES.length > 0) {
                    const j = DEFAULT_SYSTEM_JINGLES[jIdx % DEFAULT_SYSTEM_JINGLES.length];
                    jIdx++;
                    scheduledTracks.push({
                        ...j,
                        id: `sched_jing_${b.id}_${tIdx}`
                    });
                }

                // 1 Pub toutes les 2 sets
                if ((tIdx + 1) % 2 === 0 && DEFAULT_SYSTEM_PUBS.length > 0) {
                    const p = DEFAULT_SYSTEM_PUBS[pIdx % DEFAULT_SYSTEM_PUBS.length];
                    pIdx++;
                    scheduledTracks.push({
                        ...p,
                        id: `sched_pub_${b.id}_${tIdx}`
                    });
                }

                // 1 Interview sur l'émission prime (au 2ème set)
                if (idx === 1 && tIdx === 1 && DEFAULT_SYSTEM_INTERVIEWS.length > 0) {
                    scheduledTracks.push({
                        ...DEFAULT_SYSTEM_INTERVIEWS[0],
                        id: `sched_inter_${b.id}_${tIdx}`
                    });
                }
            });

            return {
                id: `radio_${b.id}`,
                name: `Émission ${idx + 1} · ${b.title || b.name}`,
                title: b.title || b.name,
                timeSlot: b.timeSlot,
                startHour: b.startHour,
                endHour: b.endHour,
                color: b.color || '#00ffff',
                emoji: b.emoji || '📻',
                randomize: b.randomize !== false,
                days: b.days || [1, 2, 3, 4, 5, 6, 0],
                tracks: scheduledTracks.length > 0 ? scheduledTracks : rawTracks
            };
        });
    }

    return [];
}

export const DEFAULT_RADIO_BLOCKS: RadioScheduleBlock[] = (() => {
    const fromSettings = (settings as any)?.radio_blocks;
    if (Array.isArray(fromSettings) && fromSettings.length > 0) {
        return fromSettings;
    }
    return buildDefaultRadioBlocksFromTV();
})();

/**
 * Heure de Paris en secondes depuis minuit
 */
export function getParisSeconds(): number {
    const now = new Date();
    try {
        const pStr = now.toLocaleString('en-US', { timeZone: 'Europe/Paris', hour12: false });
        const p = new Date(pStr);
        return p.getHours() * 3600 + p.getMinutes() * 60 + p.getSeconds();
    } catch {
        return now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    }
}

/**
 * Date du jour à Paris au format YYYY-MM-DD (pour seed deterministe)
 */
export function getParisTodayString(): string {
    const now = new Date();
    try {
        const pStr = now.toLocaleString('en-US', { timeZone: 'Europe/Paris' });
        const p = new Date(pStr);
        return p.toISOString().slice(0, 10);
    } catch {
        return now.toISOString().slice(0, 10);
    }
}

/**
 * Jour de la semaine à Paris (0=Dimanche, 1=Lundi ... 6=Samedi)
 */
export function getParisDayOfWeek(): number {
    const now = new Date();
    try {
        const pStr = now.toLocaleString('en-US', { timeZone: 'Europe/Paris' });
        const p = new Date(pStr);
        return p.getDay();
    } catch {
        return now.getDay();
    }
}

/**
 * Vérifie si une heure (0..23) appartient à un bloc horaire
 */
export function isHourInRadioBlock(b: RadioScheduleBlock, h: number): boolean {
    const start = b.startHour ?? 0;
    const rawEnd = b.endHour ?? 24;
    const end = rawEnd === 0 ? 24 : rawEnd;

    if (start < end) {
        return h >= start && h < end;
    } else if (start > end) {
        return h >= start || h < end;
    } else {
        return true;
    }
}

/**
 * Vérifie si un bloc est actif un jour donné (0..6 où 0=Dimanche)
 */
export function isRadioBlockActiveOnDay(b: RadioScheduleBlock, dayOfWeek: number): boolean {
    if (!b.days || !Array.isArray(b.days) || b.days.length === 0 || b.days.length === 7) {
        return true;
    }
    return b.days.includes(dayOfWeek);
}

/**
 * Formatage lisible des jours d'une émission radio
 */
export function formatRadioBlockDays(days?: number[]): string {
    if (!days || !Array.isArray(days) || days.length === 0 || days.length === 7) {
        return '7j/7 (Tous les jours)';
    }
    const sorted = [...days].sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b));
    const isWeekdays = sorted.length === 5 && sorted.every(d => [1, 2, 3, 4, 5].includes(d));
    if (isWeekdays) return 'Lun - Ven (Semaine)';
    const isWeekend = sorted.length === 2 && sorted.includes(6) && sorted.includes(0);
    if (isWeekend) return 'Sam - Dim (Week-end)';
    const dayNames: Record<number, string> = { 1: 'Lun', 2: 'Mar', 3: 'Mer', 4: 'Jeu', 5: 'Ven', 6: 'Sam', 0: 'Dim' };
    return sorted.map(d => dayNames[d] || String(d)).join(', ');
}

/**
 * Formatage créneau horaire
 */
export function formatRadioTimeSlot(startHour: number, endHour: number): string {
    const s = `${String(startHour).padStart(2, '0')}h`;
    const endNorm = endHour === 24 || endHour === 0 ? '00' : String(endHour).padStart(2, '0');
    const e = `${endNorm}h`;
    return `${s} - ${e}`;
}

/**
 * Tri chronologique de diffusion (06h00 -> 06h00)
 */
export function sortRadioBlocksByBroadcastOrder(blocks: RadioScheduleBlock[], autoRenumber: boolean = false): RadioScheduleBlock[] {
    if (!Array.isArray(blocks) || blocks.length <= 1) return blocks || [];

    const sorted = [...blocks].sort((a, b) => {
        const offsetA = ((a.startHour ?? 0) - 6 + 24) % 24;
        const offsetB = ((b.startHour ?? 0) - 6 + 24) % 24;
        if (offsetA !== offsetB) return offsetA - offsetB;
        return (a.endHour ?? 24) - (b.endHour ?? 24);
    });

    if (!autoRenumber) return sorted;

    return sorted.map((b, idx) => {
        const num = idx + 1;
        let nextName = b.name;
        if (b.name && /Émission\s+\d+/i.test(b.name)) {
            nextName = b.name.replace(/Émission\s+\d+/i, `Émission ${num}`);
        }
        return {
            ...b,
            name: nextName
        };
    });
}

/**
 * Vérifie si une émission est active MAINTENANT à l'instant T
 */
export function isRadioBlockActiveNow(b: RadioScheduleBlock, nowHour?: number, nowDay?: number): boolean {
    const h = nowHour !== undefined ? nowHour : Math.floor(getParisSeconds() / 3600);
    const d = nowDay !== undefined ? nowDay : getParisDayOfWeek();
    return isRadioBlockActiveOnDay(b, d) && isHourInRadioBlock(b, h);
}

/**
 * Retourne le bloc actuellement en direct selon le jour et l'heure (ou null si aucun)
 */
export function getActiveRadioBlock(blocks: RadioScheduleBlock[], currentHour?: number, currentDay?: number): RadioScheduleBlock | null {
    const list = Array.isArray(blocks) && blocks.length > 0 ? blocks : DEFAULT_RADIO_BLOCKS;
    if (list.length === 0) return null;
    const nowHour = currentHour !== undefined ? currentHour : Math.floor(getParisSeconds() / 3600);
    const nowDay = currentDay !== undefined ? currentDay : getParisDayOfWeek();

    // 1. Chercher un bloc programmé pour aujourd'hui sur cette heure
    const todayBlocks = list.filter(b => isRadioBlockActiveOnDay(b, nowDay));
    const todayMatch = todayBlocks.find(b => isHourInRadioBlock(b, nowHour));
    if (todayMatch) return todayMatch;

    // 2. Chercher dans tous les blocs si pas de match spécifique aujourd'hui
    const anyMatch = list.find(b => isHourInRadioBlock(b, nowHour));
    if (anyMatch) return anyMatch;

    return null;
}

export interface CurrentLiveRadioInfo {
    item: ComputedRadioScheduleItem;
    offsetSeconds: number;
}

/**
 * Calcul 100% déterministe et synchronisé du morceau en direct à l'instant T.
 * F5 ne changera JAMAIS le morceau car le seed aléatoire est fixé sur la date du jour.
 */
export function getCurrentLiveRadioTrack(
    blocks: RadioScheduleBlock[],
    nowSec: number = getParisSeconds(),
    nowDay: number = getParisDayOfWeek(),
    todayStr: string = getParisTodayString()
): CurrentLiveRadioInfo | null {
    const list = Array.isArray(blocks) && blocks.length > 0 ? blocks : DEFAULT_RADIO_BLOCKS;
    if (list.length === 0) return null;

    const currentHour = Math.floor(nowSec / 3600);
    const secondInHour = nowSec % 3600;
    const activeBlock = getActiveRadioBlock(list, currentHour, nowDay);
    if (!activeBlock) return null;

    // ── 1. Vérification TOP HORAIRE (Début d'heure) ────────────────────────
    const topHoraire = getTopHoraireConfig();
    if (topHoraire.enabled && topHoraire.duration > 0 && secondInHour < topHoraire.duration) {
        const dur = topHoraire.duration;
        const sH = currentHour;
        const eSec = (currentHour * 3600 + dur) % 86400;
        const eH = Math.floor(eSec / 3600);
        const eM = Math.floor((eSec % 3600) / 60);

        return {
            item: {
                id: `top_horaire_${currentHour}`,
                blockId: activeBlock.id,
                blockTitle: activeBlock.title,
                blockColor: '#00f0ff',
                blockEmoji: '🔔',
                title: topHoraire.title || 'Dropsiders Radio • Top Horaire',
                artist: 'DROPSIDERS RADIO',
                event: 'TOP HORAIRE (DÉBUT D\'HEURE)',
                youtubeId: topHoraire.youtubeId,
                audioUrl: topHoraire.audioUrl,
                startTime: `${String(sH).padStart(2, '0')}h00`,
                endTime: `${String(eH).padStart(2, '0')}h${String(eM).padStart(2, '0')}`,
                startSecondsFromMidnight: currentHour * 3600,
                durationSeconds: dur,
                durationFormatted: formatDurationExact(dur),
                isCurrentlyLive: true,
                category: 'jingle',
                isTopHoraire: true
            },
            offsetSeconds: secondInHour
        };
    }

    const topOffset = (topHoraire.enabled && topHoraire.duration > 0) ? topHoraire.duration : 0;

    // ── 2. Vérification GÉNÉRIQUE D'ÉMISSION (Jingle d'ouverture) ──────────
    const themeJingle = activeBlock.themeJingle;
    const isEmissionStartHour = currentHour === (activeBlock.startHour ?? 0);
    if (isEmissionStartHour && themeJingle && themeJingle.enabled && themeJingle.duration > 0) {
        const themeStart = topOffset;
        const themeEnd = topOffset + themeJingle.duration;
        if (secondInHour >= themeStart && secondInHour < themeEnd) {
            const sSec = (currentHour * 3600 + themeStart) % 86400;
            const eSec = (currentHour * 3600 + themeEnd) % 86400;
            const sH = Math.floor(sSec / 3600);
            const sM = Math.floor((sSec % 3600) / 60);
            const eH = Math.floor(eSec / 3600);
            const eM = Math.floor((eSec % 3600) / 60);

            return {
                item: {
                    id: `theme_${activeBlock.id}`,
                    blockId: activeBlock.id,
                    blockTitle: activeBlock.title,
                    blockColor: activeBlock.color,
                    blockEmoji: activeBlock.emoji,
                    title: themeJingle.title || `Générique • ${activeBlock.title}`,
                    artist: 'DROPSIDERS RADIO',
                    event: `GÉNÉRIQUE D'ÉMISSION • ${activeBlock.title}`,
                    youtubeId: themeJingle.youtubeId,
                    audioUrl: themeJingle.audioUrl,
                    startTime: `${String(sH).padStart(2, '0')}h${String(sM).padStart(2, '0')}`,
                    endTime: `${String(eH).padStart(2, '0')}h${String(eM).padStart(2, '0')}`,
                    startSecondsFromMidnight: sSec,
                    durationSeconds: themeJingle.duration,
                    durationFormatted: formatDurationExact(themeJingle.duration),
                    isCurrentlyLive: true,
                    category: 'jingle',
                    isThemeJingle: true
                },
                offsetSeconds: secondInHour - themeStart
            };
        }
    }

    // ── 3. Pistes de l'émission + Jingles Spéciaux personnalisés ─────────────
    const introOffset = topOffset + (isEmissionStartHour && themeJingle?.enabled ? (themeJingle.duration || 0) : 0);

    const emissionJingleTracks: RadioTrackItem[] = (activeBlock.specialJingles || [])
        .filter(j => j.enabled !== false && (j.audioUrl || j.youtubeId))
        .map(j => ({
            id: j.id,
            title: j.title,
            artist: `${activeBlock.title} JINGLE`,
            audioUrl: j.audioUrl,
            youtubeId: j.youtubeId,
            duration: j.duration || 15,
            category: 'jingle' as const
        }));

    const mergedTracks = [...(activeBlock.tracks || [])];
    emissionJingleTracks.forEach(sj => {
        const exists = mergedTracks.some(t => t.id === sj.id || (sj.audioUrl && t.audioUrl === sj.audioUrl) || (sj.youtubeId && t.youtubeId === sj.youtubeId));
        if (!exists) {
            mergedTracks.push(sj);
        }
    });

    const rawTracks = mergedTracks.length > 0
        ? mergedTracks
        : [{
            id: `${activeBlock.id}_fallback`,
            title: `${activeBlock.title} - Continuous Mix`,
            artist: 'DROPSIDERS RADIO',
            youtubeId: '8YbWq5urfww',
            duration: 3600,
            category: 'liveset' as const
        }];

    // Seeded shuffle par jour pour que l'ordre soit identique 100% du temps pour tous les utilisateurs toute la journée
    const tracks = activeBlock.randomize === false
        ? rawTracks
        : getSeededShuffle(rawTracks, `${todayStr}_${activeBlock.id}`);

    const startH = activeBlock.startHour ?? 0;
    const blockStartSec = startH * 3600;
    let elapsedInBlock = nowSec - blockStartSec - introOffset;
    if (elapsedInBlock < 0) elapsedInBlock += 86400;

    const totalPlaylistSec = tracks.reduce((acc, t) => acc + (t.duration || 3600), 0) || 3600;
    const cycleSec = elapsedInBlock % totalPlaylistSec;

    let cursor = 0;
    let selectedTrack = tracks[0];
    let selectedTrackOffset = 0;
    let selectedTrackIndex = 0;

    for (let i = 0; i < tracks.length; i++) {
        const t = tracks[i];
        const dur = t.duration && t.duration > 0 ? t.duration : 3600;
        if (cycleSec >= cursor && cycleSec < cursor + dur) {
            selectedTrack = t;
            selectedTrackOffset = cycleSec - cursor;
            selectedTrackIndex = i;
            break;
        }
        cursor += dur;
    }

    const { artist } = parseArtistAndEvent(selectedTrack.title);
    const itemStartFromMidnight = (blockStartSec + introOffset + (elapsedInBlock - selectedTrackOffset)) % 86400;
    const dur = selectedTrack.duration || 3600;
    const itemEndFromMidnight = (itemStartFromMidnight + dur) % 86400;

    const sH = Math.floor(itemStartFromMidnight / 3600);
    const sM = Math.floor((itemStartFromMidnight % 3600) / 60);
    const eH = Math.floor(itemEndFromMidnight / 3600);
    const eM = Math.floor((itemEndFromMidnight % 3600) / 60);

    const item: ComputedRadioScheduleItem = {
        id: `${activeBlock.id}_t_${selectedTrackIndex}_${selectedTrack.id || selectedTrack.youtubeId}`,
        blockId: activeBlock.id,
        blockTitle: activeBlock.title,
        blockColor: activeBlock.color,
        blockEmoji: activeBlock.emoji,
        title: selectedTrack.title,
        artist: selectedTrack.artist || artist || 'Artiste',
        event: activeBlock.title,
        youtubeId: selectedTrack.youtubeId,
        audioUrl: selectedTrack.audioUrl,
        startTime: `${String(sH).padStart(2, '0')}h${String(sM).padStart(2, '0')}`,
        endTime: `${String(eH).padStart(2, '0')}h${String(eM).padStart(2, '0')}`,
        startSecondsFromMidnight: itemStartFromMidnight,
        durationSeconds: dur,
        durationFormatted: formatDurationExact(dur),
        isCurrentlyLive: true,
        category: selectedTrack.category
    };

    return {
        item,
        offsetSeconds: Math.floor(selectedTrackOffset)
    };
}

/**
 * Calcule la grille 24/7 de la radio pour une journée donnée avec seeded shuffle identique
 */
export function computeRadioDaySchedule(
    blocks: RadioScheduleBlock[],
    date: Date = new Date()
): ComputedRadioScheduleItem[] {
    const list = Array.isArray(blocks) && blocks.length > 0 ? blocks : DEFAULT_RADIO_BLOCKS;
    const dayOfWeek = getParisDayOfWeek();
    const activeBlocks = list.filter(b => isRadioBlockActiveOnDay(b, dayOfWeek));
    const sorted = sortRadioBlocksByBroadcastOrder(activeBlocks.length > 0 ? activeBlocks : list);
    const todayStr = getParisTodayString();

    const nowSec = getParisSeconds();
    const items: ComputedRadioScheduleItem[] = [];

    sorted.forEach((block) => {
        const startH = block.startHour ?? 0;
        let endH = block.endHour ?? 24;
        if (endH === 0) endH = 24;

        let blockDurationHours = endH - startH;
        if (blockDurationHours <= 0) blockDurationHours += 24;
        const blockDurationSec = blockDurationHours * 3600;

        const blockStartSec = startH * 3600;

        const emissionJingleTracks: RadioTrackItem[] = (block.specialJingles || [])
            .filter(j => j.enabled !== false && (j.audioUrl || j.youtubeId))
            .map(j => ({
                id: j.id,
                title: j.title,
                artist: `${block.title} JINGLE`,
                audioUrl: j.audioUrl,
                youtubeId: j.youtubeId,
                duration: j.duration || 15,
                category: 'jingle' as const
            }));

        const mergedTracks = [...(block.tracks || [])];
        emissionJingleTracks.forEach(sj => {
            const exists = mergedTracks.some(t => t.id === sj.id || (sj.audioUrl && t.audioUrl === sj.audioUrl) || (sj.youtubeId && t.youtubeId === sj.youtubeId));
            if (!exists) {
                mergedTracks.push(sj);
            }
        });

        const rawTracks = mergedTracks.length > 0
            ? mergedTracks
            : [{
                id: `${block.id}_fallback`,
                title: `${block.title} - Continuous Mix`,
                artist: 'DROPSIDERS RADIO',
                youtubeId: '8YbWq5urfww',
                duration: 3600,
                category: 'liveset' as const
            }];

        const tracks = block.randomize === false
            ? rawTracks
            : getSeededShuffle(rawTracks, `${todayStr}_${block.id}`);

        let cursor = 0;
        let trackIdx = 0;

        while (cursor < blockDurationSec && trackIdx < 100) {
            const track = tracks[trackIdx % tracks.length];
            const dur = track.duration && track.duration > 0 ? track.duration : 3600;
            const itemStartFromMidnight = (blockStartSec + cursor) % 86400;
            const itemEndFromMidnight = (itemStartFromMidnight + dur) % 86400;

            const sH = Math.floor(itemStartFromMidnight / 3600);
            const sM = Math.floor((itemStartFromMidnight % 3600) / 60);
            const eH = Math.floor(itemEndFromMidnight / 3600);
            const eM = Math.floor((itemEndFromMidnight % 3600) / 60);

            const isLive = (itemStartFromMidnight <= itemEndFromMidnight)
                ? (nowSec >= itemStartFromMidnight && nowSec < itemEndFromMidnight)
                : (nowSec >= itemStartFromMidnight || nowSec < itemEndFromMidnight);

            const { artist } = parseArtistAndEvent(track.title);

            items.push({
                id: `${block.id}_t_${trackIdx}_${track.id || track.youtubeId}`,
                blockId: block.id,
                blockTitle: block.title,
                blockColor: block.color,
                blockEmoji: block.emoji,
                title: track.title,
                artist: track.artist || artist || 'Artiste',
                event: block.title,
                youtubeId: track.youtubeId,
                audioUrl: track.audioUrl,
                startTime: `${String(sH).padStart(2, '0')}h${String(sM).padStart(2, '0')}`,
                endTime: `${String(eH).padStart(2, '0')}h${String(eM).padStart(2, '0')}`,
                startSecondsFromMidnight: itemStartFromMidnight,
                durationSeconds: dur,
                durationFormatted: formatDurationExact(dur),
                isCurrentlyLive: isLive,
                category: track.category
            });

            cursor += dur;
            trackIdx++;
        }
    });

    return items;
}

