import { useEffect, useState, useCallback } from 'react';
import type { DropsidersCard } from '../context/UserContext';
import wikiFestivals from '../data/wiki_festivals.json';
import wikiClubs from '../data/wiki_clubs.json';
import wikiDjs from '../data/wiki_djs.json';

const VISIT_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const LAST_CARD_DATE_KEY = 'dropsiders_last_card_date';
const SESSION_START_KEY = 'dropsiders_session_start';
const VISITS_COUNT_KEY = 'dropsiders_visits_count';

function getRarity(rank: number): DropsidersCard['rarity'] {
    if (rank <= 10) return 'legendary';
    if (rank <= 30) return 'epic';
    if (rank <= 60) return 'rare';
    return 'common';
}

function buildCardPool(): DropsidersCard[] {
    const festivalCards: DropsidersCard[] = (wikiFestivals as any[]).map((f) => ({
        id: `festival_${f.id}`,
        type: 'festival' as const,
        name: f.name,
        city: f.city,
        country: f.country,
        image: f.image,
        djmag_rank: f.djmag_rank || 99,
        rarity: getRarity(f.djmag_rank || 99),
        collectedAt: new Date().toISOString(),
        attendees: f.attendees,
        attendees_label: f.attendees_label,
    }));

    const clubCards: DropsidersCard[] = (wikiClubs as any[]).map((c) => ({
        id: `club_${c.id}`,
        type: 'club' as const,
        name: c.name,
        city: c.city,
        country: c.country,
        image: c.image,
        djmag_rank: c.djmag_rank || 99,
        rarity: getRarity(c.djmag_rank || 99),
        collectedAt: new Date().toISOString(),
        attendees: c.attendees,
        attendees_label: c.attendees_label,
    }));

    // DJs: use numeric ID as rank (lower ID = more legendary), city = country
    const djCards: DropsidersCard[] = (wikiDjs as any[])
        .filter((d) => d.image && d.image.startsWith('http'))
        .map((d, index) => {
            const rank = Math.min(99, index + 1);
            return {
                id: `dj_${d.id}`,
                type: 'dj' as const,
                name: d.name,
                city: d.country || 'Intl',
                country: d.country || 'Intl',
                image: d.image,
                djmag_rank: rank,
                rarity: getRarity(rank),
                collectedAt: new Date().toISOString(),
                top_tracks: d.top_tracks || ["Titre Inconnu 1", "Titre Inconnu 2", "Titre Inconnu 3"]
            };
        });

    return [...festivalCards, ...clubCards, ...djCards];
}

function pickRandomCard(existing: string[], visitCount: number): DropsidersCard | null {
    const pool = buildCardPool();
    // Prefer cards not yet collected, fall back to any card
    let uncollected = pool.filter((c) => !existing.includes(c.id));
    
    // Rarity logic based on visit count
    uncollected = uncollected.filter(c => {
        if (c.rarity === 'legendary') return visitCount >= 10 && Math.random() < 0.05; // 5% chance after 10 visits
        if (c.rarity === 'epic') return visitCount >= 5 && Math.random() < 0.15; // 15% chance after 5 visits
        if (c.rarity === 'rare') return visitCount >= 2 && Math.random() < 0.30; // 30% chance after 2 visits
        return true; // common always available
    });

    if (uncollected.length === 0) {
        // Fallback to common cards if bad luck
        uncollected = pool.filter(c => c.rarity === 'common');
    }

    const source = uncollected.length > 0 ? uncollected : pool.filter(c => c.rarity === 'common');
    if (source.length === 0) return null;
    const picked = source[Math.floor(Math.random() * source.length)];
    return { ...picked, collectedAt: new Date().toISOString() };
}

function todayString(): string {
    return new Date().toISOString().slice(0, 10);
}

function hasEarnedCardToday(): boolean {
    return localStorage.getItem(LAST_CARD_DATE_KEY) === todayString();
}

function markCardEarnedToday(): void {
    localStorage.setItem(LAST_CARD_DATE_KEY, todayString());
}

interface UseVisitTimerResult {
    pendingCard: DropsidersCard | null;
    claimCard: (onClaim: (card: DropsidersCard) => void) => void;
    dismissCard: () => void;
}

export function useVisitTimer(collectedCardIds: string[]): UseVisitTimerResult {
    const [pendingCard, setPendingCard] = useState<DropsidersCard | null>(null);

    useEffect(() => {
        // If already earned today, do nothing
        if (hasEarnedCardToday()) return;

        // Record session start
        const now = Date.now();
        const storedStart = Number(localStorage.getItem(SESSION_START_KEY) || 0);
        const sessionStart = storedStart > 0 ? storedStart : now;

        if (!storedStart) {
            localStorage.setItem(SESSION_START_KEY, String(now));
            // Increment visits on new session
            const currentVisits = Number(localStorage.getItem(VISITS_COUNT_KEY) || 0);
            localStorage.setItem(VISITS_COUNT_KEY, String(currentVisits + 1));
        }

        const elapsed = now - sessionStart;
        const remaining = Math.max(0, VISIT_DURATION_MS - elapsed);

        const timerId = setTimeout(() => {
            if (!hasEarnedCardToday()) {
                const visits = Number(localStorage.getItem(VISITS_COUNT_KEY) || 1);
                const card = pickRandomCard(collectedCardIds, visits);
                if (card) {
                    setPendingCard(card);
                }
            }
        }, remaining);

        return () => clearTimeout(timerId);
    }, []); // Run once on mount

    const claimCard = useCallback((onClaim: (card: DropsidersCard) => void) => {
        if (!pendingCard) return;
        markCardEarnedToday();
        localStorage.removeItem(SESSION_START_KEY);
        onClaim(pendingCard);
        setPendingCard(null);
    }, [pendingCard]);

    const dismissCard = useCallback(() => {
        if (pendingCard) {
            markCardEarnedToday();
            localStorage.removeItem(SESSION_START_KEY);
        }
        setPendingCard(null);
    }, [pendingCard]);

    return { pendingCard, claimCard, dismissCard };
}
