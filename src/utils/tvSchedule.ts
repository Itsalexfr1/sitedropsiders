export interface TVVideo {
    id: string;
    title: string;
    description: string;
    youtubeId: string;
    duration?: number;
}

export interface PromoVideo {
    id: string;
    youtubeId: string;
    title: string;
    duration?: number;
}

export interface TVScheduleBlock {
    id: string;
    name: string;
    title: string;
    timeSlot: string;
    startHour: number; // 0..23
    endHour: number; // 1..24 (24 = midnight)
    color: string;
    emoji: string;
    randomize: boolean;
    videos: TVVideo[];
}

export interface TVScheduleSegment {
    type: 'main' | 'promo';
    index: number;
    video: TVVideo | PromoVideo;
    duration: number;
}

export const STORAGE_TV_BLOCKS_KEY = 'dropsiders_tv_blocks';
export const STORAGE_PLAYLIST_KEY = 'dropsiders_tv_playlist_v2';
export const STORAGE_PROMOS_KEY = 'dropsiders_tv_promos_v2';
export const STORAGE_DURATIONS_KEY = 'dropsiders_tv_durations';

export const DEFAULT_TV_BLOCKS: TVScheduleBlock[] = [
    {
        id: 'bloc_1',
        name: 'Bloc 1 · Clips',
        title: 'Morning Clips',
        timeSlot: '06h - 10h',
        startHour: 6,
        endHour: 10,
        color: '#f59e0b',
        emoji: '🌅',
        randomize: true,
        videos: [
            {
                id: 'b1_1',
                title: 'Tomorrowland Belgium 2026 | Official Aftermovie',
                description: 'Diffusé sur DropsidersTV · Morning Clips',
                youtubeId: 'k5yQBhDnrvM',
                duration: 900
            },
            {
                id: 'b1_2',
                title: 'Anyma | Live from Atomium - Brussels, Belgium',
                description: 'Diffusé sur DropsidersTV · Morning Clips',
                youtubeId: 'oRb_81stwy8',
                duration: 2700
            },
            {
                id: 'b1_3',
                title: 'Porter Robinson Live at EDC Las Vegas 2026 (Official Full Set)',
                description: 'Diffusé sur DropsidersTV · Morning Clips',
                youtubeId: 'zkT8FjfBjYI',
                duration: 3600
            },
            {
                id: 'b1_4',
                title: 'Paul Kalkbrenner | Tomorrowland 2023',
                description: 'Diffusé sur DropsidersTV · Morning Clips',
                youtubeId: 'NsBiI-LyVm4',
                duration: 4200
            }
        ]
    },
    {
        id: 'bloc_2',
        name: 'Bloc 2 · Relive Festivals',
        title: 'Relive Festivals',
        timeSlot: '10h - 14h',
        startHour: 10,
        endHour: 14,
        color: '#06b6d4',
        emoji: '🎪',
        randomize: true,
        videos: [
            {
                id: 'b2_1',
                title: 'Fisher WE2 | Tomorrowland 2026',
                description: 'Diffusé sur DropsidersTV · Relive Festivals',
                youtubeId: 'DuXXMZLfAkQ',
                duration: 4500
            },
            {
                id: 'b2_2',
                title: 'The Chainsmokers Live at EDC Las Vegas 2026 (Official Full Set)',
                description: 'Diffusé sur DropsidersTV · Relive Festivals',
                youtubeId: '3AQ_Srbe1lQ',
                duration: 4200
            },
            {
                id: 'b2_3',
                title: 'Nicky Romero WE2 | Tomorrowland 2026',
                description: 'Diffusé sur DropsidersTV · Relive Festivals',
                youtubeId: 'TsyGMhx8izw',
                duration: 3600
            },
            {
                id: 'b2_4',
                title: 'Dimitri Vegas B2B Nico Moreno WE2 | Tomorrowland 2026',
                description: 'Diffusé sur DropsidersTV · Relive Festivals',
                youtubeId: 'OTKgBZS8if0',
                duration: 3600
            },
            {
                id: 'b2_5',
                title: 'Wiley Live @ Lost Lands 2025 - Full Set',
                description: 'Diffusé sur DropsidersTV · Relive Festivals',
                youtubeId: '8YbWq5urfww',
                duration: 3600
            }
        ]
    },
    {
        id: 'bloc_3',
        name: 'Bloc 3 · Day Time',
        title: 'Day Time',
        timeSlot: '14h - 18h',
        startHour: 14,
        endHour: 18,
        color: '#10b981',
        emoji: '☀️',
        randomize: true,
        videos: [
            {
                id: 'b3_1',
                title: 'JOHN SUMMIT LIVE @ ULTRA MIAMI MAIN STAGE 2026',
                description: 'Diffusé sur DropsidersTV · Day Time',
                youtubeId: 'aloPGSlq31Y',
                duration: 4500
            },
            {
                id: 'b3_2',
                title: 'Laidback Luke B2B Chuckie Live at EDC Las Vegas 2026',
                description: 'Diffusé sur DropsidersTV · Day Time',
                youtubeId: 'IzsShRhd5cw',
                duration: 3600
            },
            {
                id: 'b3_3',
                title: 'Mau P | Awakenings Festival 2026',
                description: 'Diffusé sur DropsidersTV · Day Time',
                youtubeId: 'CNGB66x4ygk',
                duration: 5400
            },
            {
                id: 'b3_4',
                title: 'Tinlicker (DJ Set) Live at EDC Las Vegas 2026',
                description: 'Diffusé sur DropsidersTV · Day Time',
                youtubeId: 'WyMR1oHCCEo',
                duration: 4200
            },
            {
                id: 'b3_5',
                title: 'HAYLA Live at EDC Las Vegas 2026 (Official Full Set)',
                description: 'Diffusé sur DropsidersTV · Day Time',
                youtubeId: 'IIquvML5M4M',
                duration: 3600
            }
        ]
    },
    {
        id: 'bloc_4',
        name: 'Bloc 4 · Prime Time',
        title: 'Prime Time Dropsiders',
        timeSlot: '18h - 00h',
        startHour: 18,
        endHour: 24,
        color: '#ff1241',
        emoji: '⭐',
        randomize: true,
        videos: [
            {
                id: 'b4_1',
                title: 'DJ SNAKE LIVE @ ULTRA MIAMI MAIN STAGE 2026',
                description: 'Diffusé sur DropsidersTV · Prime Time Dropsiders',
                youtubeId: 'hSq5aGvBJ04',
                duration: 4500
            },
            {
                id: 'b4_2',
                title: 'Swedish House Mafia Live at Ultra Music Festival (Miami 2026)',
                description: 'Diffusé sur DropsidersTV · Prime Time Dropsiders',
                youtubeId: 'byHTUyYS7bA',
                duration: 5400
            },
            {
                id: 'b4_3',
                title: 'ERIC PRYDZ LIVE @ ULTRA MUSIC FESTIVAL MIAMI 2026',
                description: 'Diffusé sur DropsidersTV · Prime Time Dropsiders',
                youtubeId: 'hU-z3iV0LOg',
                duration: 5400
            },
            {
                id: 'b4_4',
                title: 'Kaskade Live at EDC Las Vegas 2026',
                description: 'Diffusé sur DropsidersTV · Prime Time Dropsiders',
                youtubeId: 'l5wro3bMZWc',
                duration: 4500
            },
            {
                id: 'b4_5',
                title: 'Ray Volpe Live @ Lost Lands 2025 - Full Set',
                description: 'Diffusé sur DropsidersTV · Prime Time Dropsiders',
                youtubeId: 'nyaGV-jeST8',
                duration: 3600
            },
            {
                id: 'b4_6',
                title: 'WORSHIP @ ULTRA MUSIC FESTIVAL MIAMI 2026 | UMF',
                description: 'Diffusé sur DropsidersTV · Prime Time Dropsiders',
                youtubeId: 'V2lD_pq5c3M',
                duration: 4200
            }
        ]
    },
    {
        id: 'bloc_5',
        name: 'Bloc 5 · La Nuit',
        title: 'La Nuit Dropsiders',
        timeSlot: '00h - 06h',
        startHour: 0,
        endHour: 6,
        color: '#8b5cf6',
        emoji: '🌙',
        randomize: true,
        videos: [
            {
                id: 'b5_1',
                title: 'RÜFÜS DU SOL (DJ SET) - Mayan Warrior - Burning Man 2024',
                description: 'Diffusé sur DropsidersTV · La Nuit Dropsiders',
                youtubeId: 'eQ-OVsdK-hM',
                duration: 5400
            },
            {
                id: 'b5_2',
                title: 'Keinemusik (&ME, Rampa, Adam Port) - Mayan Warrior - Burning Man 2022',
                description: 'Diffusé sur DropsidersTV · La Nuit Dropsiders',
                youtubeId: '2ECWX8GdDvA',
                duration: 7200
            },
            {
                id: 'b5_3',
                title: 'SVDDEN DEATH Presents: VOYD Live @ Lost Lands 2025 - Full Set',
                description: 'Diffusé sur DropsidersTV · La Nuit Dropsiders',
                youtubeId: 'DYlcCkyYDnA',
                duration: 4500
            },
            {
                id: 'b5_4',
                title: 'Carl Cox x Playground - Burning Man 2025',
                description: 'Diffusé sur DropsidersTV · La Nuit Dropsiders',
                youtubeId: 'iyCsXPYxa6k',
                duration: 5400
            },
            {
                id: 'b5_5',
                title: 'Joris Voorn Vinyl Only Techno Set | Upclose 2026',
                description: 'Diffusé sur DropsidersTV · La Nuit Dropsiders',
                youtubeId: '4JkIGKt1AHw',
                duration: 5400
            },
            {
                id: 'b5_6',
                title: 'D-Block & S-te-Fan | Defqon.1 2026',
                description: 'Diffusé sur DropsidersTV · La Nuit Dropsiders',
                youtubeId: 'IEJUg98lIHs',
                duration: 3600
            }
        ]
    }
];

/**
 * Deterministic pseudo-random shuffle seeded by a string (e.g. date + block ID)
 * This ensures all viewers worldwide get the exact same randomized playlist order on that day!
 */
export function getSeededShuffle<T>(items: T[], seedStr: string): T[] {
    if (!items || items.length <= 1) return [...items];
    const arr = [...items];
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
        hash = (hash << 5) - hash + seedStr.charCodeAt(i);
        hash |= 0;
    }
    let seed = Math.abs(hash) || 12345;
    const random = () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
    };
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/**
 * Returns the currently active block based on the current hour (0..23)
 */
export function getActiveTVBlock(blocks: TVScheduleBlock[], currentHour?: number): TVScheduleBlock {
    const list = Array.isArray(blocks) && blocks.length > 0 ? blocks : DEFAULT_TV_BLOCKS;
    const h = currentHour !== undefined ? currentHour : new Date().getHours();
    const found = list.find(b => h >= b.startHour && h < b.endHour);
    return found || list[0] || DEFAULT_TV_BLOCKS[0];
}

/**
 * Builds the TV playback segments for a block, optionally interleaving promo clips
 */
export function buildBlockSegments(
    videos: TVVideo[],
    promos: PromoVideo[],
    durationsMap: Record<string, number> = {}
): TVScheduleSegment[] {
    if (!videos || videos.length === 0) return [];

    const segments: TVScheduleSegment[] = [];
    const hasPromos = Array.isArray(promos) && promos.length > 0;

    for (let i = 0; i < videos.length; i++) {
        const v = videos[i];
        if (!v) continue;
        const dur = (durationsMap && durationsMap[v.youtubeId]) || v.duration || 3600;
        segments.push({
            type: 'main',
            index: i,
            video: v,
            duration: Math.max(15, dur)
        });

        if (hasPromos) {
            const promoIdx = i % promos.length;
            const promo = promos[promoIdx];
            if (promo) {
                const pDur = (durationsMap && durationsMap[promo.youtubeId]) || promo.duration || 60;
                segments.push({
                    type: 'promo',
                    index: promoIdx,
                    video: promo,
                    duration: Math.max(5, pDur)
                });
            }
        }
    }

    return segments;
}

/**
 * Calculates the current live playback position within a block given elapsed seconds since block start
 */
export function calculateBlockLivePosition(
    segments: TVScheduleSegment[],
    elapsedSecondsInBlock: number
): { index: number; isPromo: boolean; startSeconds: number } {
    if (!segments || segments.length === 0) {
        return { index: 0, isPromo: false, startSeconds: 0 };
    }

    const totalCycle = segments.reduce((sum, s) => sum + s.duration, 0);
    if (totalCycle <= 0) {
        return { index: 0, isPromo: false, startSeconds: 0 };
    }

    let cyclePos = Math.floor(Math.max(0, elapsedSecondsInBlock)) % totalCycle;

    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        if (cyclePos < seg.duration) {
            return {
                index: seg.index,
                isPromo: seg.type === 'promo',
                startSeconds: Math.floor(cyclePos)
            };
        }
        cyclePos -= seg.duration;
    }

    const first = segments[0];
    return {
        index: first.index,
        isPromo: first.type === 'promo',
        startSeconds: 0
    };
}
