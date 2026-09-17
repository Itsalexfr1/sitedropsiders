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

export interface RadioTrackItem {
    id: string;
    title: string;
    artist?: string;
    youtubeId: string;
    duration?: number; // seconds
    category?: 'liveset' | 'clip';
    addedAt?: number;
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
    youtubeId: string;
    startTime: string;
    endTime: string;
    startSecondsFromMidnight: number;
    durationSeconds: number;
    durationFormatted: string;
    isCurrentlyLive: boolean;
    category?: 'liveset' | 'clip';
}

/**
 * Construit les blocs radio par défaut en intégrant l'intégralité des 240 sets & clips de la TV
 */
export function buildDefaultRadioBlocksFromTV(): RadioScheduleBlock[] {
    const rawTvBlocks = (settings as any)?.tv_blocks;
    if (Array.isArray(rawTvBlocks) && rawTvBlocks.length > 0) {
        return rawTvBlocks.map((b: any, idx: number) => {
            const tracks: RadioTrackItem[] = (b.videos || []).map((v: any, vIdx: number) => {
                const { artist } = parseArtistAndEvent(v.title || '');
                return {
                    id: `rt_${v.id || v.youtubeId || vIdx}`,
                    title: v.title,
                    artist: artist || 'Artiste',
                    youtubeId: v.youtubeId,
                    duration: v.duration || 3600,
                    category: v.category || ((v.duration || 3600) < 1200 ? 'clip' : 'liveset')
                };
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
                tracks
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
    const fromTv = buildDefaultRadioBlocksFromTV();
    if (fromTv.length > 0) return fromTv;
    return [];
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
 * Retourne le bloc actuellement en direct selon le jour et l'heure
 */
export function getActiveRadioBlock(blocks: RadioScheduleBlock[], currentHour?: number, currentDay?: number): RadioScheduleBlock {
    const list = Array.isArray(blocks) && blocks.length > 0 ? blocks : DEFAULT_RADIO_BLOCKS;
    const nowHour = currentHour !== undefined ? currentHour : Math.floor(getParisSeconds() / 3600);
    const nowDay = currentDay !== undefined ? currentDay : getParisDayOfWeek();

    // 1. Chercher un bloc programmé pour aujourd'hui sur cette heure
    const todayBlocks = list.filter(b => isRadioBlockActiveOnDay(b, nowDay));
    const todayMatch = todayBlocks.find(b => isHourInRadioBlock(b, nowHour));
    if (todayMatch) return todayMatch;

    // 2. Chercher dans tous les blocs si pas de match spécifique aujourd'hui
    const anyMatch = list.find(b => isHourInRadioBlock(b, nowHour));
    if (anyMatch) return anyMatch;

    return list[0] || DEFAULT_RADIO_BLOCKS[0];
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
    const activeBlock = getActiveRadioBlock(list, currentHour, nowDay);
    if (!activeBlock) return null;

    const rawTracks = activeBlock.tracks && activeBlock.tracks.length > 0
        ? activeBlock.tracks
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
    let elapsedInBlock = nowSec - blockStartSec;
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
    const itemStartFromMidnight = (blockStartSec + (elapsedInBlock - selectedTrackOffset)) % 86400;
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

        const rawTracks = block.tracks && block.tracks.length > 0
            ? block.tracks
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

