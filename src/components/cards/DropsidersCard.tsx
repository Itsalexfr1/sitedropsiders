import { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import type { DropsidersCard } from '../../context/UserContext';

interface DropsidersCardProps {
    card: DropsidersCard;
    /** If true, the card can be flipped on click */
    flippable?: boolean;
    /** If true, the card starts face-down (used for reveal animations) */
    startFaceDown?: boolean;
    /** Controlled flipped state — when provided, overrides internal state reactively */
    flipped?: boolean;
    /** Scale multiplier (default 1) */
    scale?: number;
    /** Show date collected */
    showDate?: boolean;
    /** Export mode to render flat faces for html-to-image without 3D transforms */
    exportMode?: 'front' | 'back';
    onClick?: () => void;
}

// ─── MUSIC STYLE ENERGY BADGES (SVG) ─────────────────────────────────────────
function TechnoEnergy() {
    return (
        <div className="w-3.5 h-3.5 bg-gradient-to-br from-slate-700 to-slate-900 border border-slate-950 rounded-full flex items-center justify-center shadow-[inset_0_1px_2px_rgba(255,255,255,0.3)]" title="Techno">
            <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 text-white fill-current">
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm0-10a2 2 0 1 0 2 2 2 2 0 0 0-2-2zm-5 2a5 5 0 0 1 5-5v1.5a3.5 3.5 0 0 0-3.5 3.5zm10 0a5 5 0 0 1-5 5v-1.5a3.5 3.5 0 0 0 3.5-3.5z" />
            </svg>
        </div>
    );
}

function HouseEnergy() {
    return (
        <div className="w-3.5 h-3.5 bg-gradient-to-br from-amber-400 to-orange-500 border border-orange-700 rounded-full flex items-center justify-center shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)]" title="House">
            <svg viewBox="0 0 24 24" className="w-2 h-2 text-white fill-none stroke-current" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 22a10 10 0 0 1 20 0" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10H8a15.3 15.3 0 0 1 4-10z" />
                <path d="M6 12c0-3.3 2.7-6 6-6s6 2.7 6 6" />
            </svg>
        </div>
    );
}

function EdmEnergy() {
    return (
        <div className="w-3.5 h-3.5 bg-gradient-to-br from-fuchsia-500 to-pink-600 border border-pink-800 rounded-full flex items-center justify-center shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)]" title="EDM / Electro">
            <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 text-white fill-current">
                <path d="M19 9h-6l3-7L5 13h6l-3 9z" />
            </svg>
        </div>
    );
}

function HardstyleEnergy() {
    return (
        <div className="w-3.5 h-3.5 bg-gradient-to-br from-lime-400 to-emerald-600 border border-emerald-800 rounded-full flex items-center justify-center shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)]" title="Hardstyle">
            <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 text-slate-900 fill-current">
                <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm1 15h-2v-2h2zm0-4h-2V7h2z" />
            </svg>
        </div>
    );
}

function TranceEnergy() {
    return (
        <div className="w-3.5 h-3.5 bg-gradient-to-br from-indigo-500 to-purple-700 border border-purple-950 rounded-full flex items-center justify-center shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)]" title="Trance">
            <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 text-white fill-current">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 13c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8.5a3.5 3.5 0 1 0 3.5 3.5A3.5 3.5 0 0 0 12 9z" />
            </svg>
        </div>
    );
}

function BassEnergy() {
    return (
        <div className="w-3.5 h-3.5 bg-gradient-to-br from-cyan-400 to-teal-600 border border-teal-800 rounded-full flex items-center justify-center shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)]" title="Bass Music">
            <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 text-white fill-current">
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm4-8a4 4 0 1 1-4-4 4 4 0 0 1 4 4zm-2.5 0A1.5 1.5 0 1 0 12 13.5 1.5 1.5 0 0 0 13.5 12z" />
            </svg>
        </div>
    );
}

function RetroEnergy() {
    return (
        <div className="w-3.5 h-3.5 bg-gradient-to-br from-[#d4af37] via-slate-100 to-[#aa7c11] border border-amber-800 rounded-full flex items-center justify-center shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)]" title="Retro / Disco">
            <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 text-amber-950 fill-current">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
        </div>
    );
}

function StarEnergy() {
    return (
        <div className="w-3.5 h-3.5 bg-gradient-to-br from-slate-200 to-slate-400 border border-slate-500 rounded-full flex items-center justify-center shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)]" title="Colorless">
            <svg viewBox="0 0 24 24" className="w-2 h-2 text-slate-800 fill-current">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
        </div>
    );
}

function EnergyBadge({ type }: { type: string }) {
    if (type === 'techno') return <TechnoEnergy />;
    if (type === 'house') return <HouseEnergy />;
    if (type === 'edm') return <EdmEnergy />;
    if (type === 'hardstyle') return <HardstyleEnergy />;
    if (type === 'trance') return <TranceEnergy />;
    if (type === 'bass') return <BassEnergy />;
    if (type === 'retro') return <RetroEnergy />;
    return <StarEnergy />;
}

// ─── MUSIC STYLE PRESETS (THEMATIC COLOR SYSTEMS) ───────────────────────────
interface CardTheme {
    styleLabel: string;
    borderFrom: string;
    borderTo: string;
    outlineColor: string;
    bgGradient: string;
    textColor: string;
    subBarBg: string;
    subBarBorder: string;
    subBarText: string;
    energyType: 'techno' | 'house' | 'edm' | 'hardstyle' | 'trance' | 'bass' | 'retro' | 'star';
    weaknessType: string;
}

const THEME_PRESETS: Record<string, CardTheme> = {
    techno: {
        styleLabel: 'TECHNO',
        borderFrom: '#1e293b',
        borderTo: '#090d16',
        outlineColor: '#020617',
        bgGradient: 'from-[#cbd5e1] via-[#94a3b8] to-[#64748b]',
        textColor: 'text-black',
        subBarBg: 'from-[#cbd5e1] via-[#94a3b8] to-[#cbd5e1]',
        subBarBorder: '#475569',
        subBarText: 'text-black',
        energyType: 'techno',
        weaknessType: 'hardstyle'
    },
    house: {
        styleLabel: 'HOUSE',
        borderFrom: '#f97316',
        borderTo: '#c2410c',
        outlineColor: '#7c2d12',
        bgGradient: 'from-[#fef3c7] via-[#fde68a] to-[#fcd34d]',
        textColor: 'text-black',
        subBarBg: 'from-[#fde68a] via-[#fcd34d] to-[#fde68a]',
        subBarBorder: '#f97316',
        subBarText: 'text-black',
        energyType: 'house',
        weaknessType: 'techno'
    },
    edm: {
        styleLabel: 'EDM / ELECTRO',
        borderFrom: '#ec4899',
        borderTo: '#be185d',
        outlineColor: '#700d3c',
        bgGradient: 'from-[#fce7f3] via-[#fbcfe8] to-[#f9a8d4]',
        textColor: 'text-black',
        subBarBg: 'from-[#fbcfe8] via-[#f9a8d4] to-[#fbcfe8]',
        subBarBorder: '#ec4899',
        subBarText: 'text-black',
        energyType: 'edm',
        weaknessType: 'house'
    },
    hardstyle: {
        styleLabel: 'HARDSTYLE',
        borderFrom: '#84cc16',
        borderTo: '#4d7c0f',
        outlineColor: '#365314',
        bgGradient: 'from-[#f7fee7] via-[#ecfccb] to-[#d9f99d]',
        textColor: 'text-black',
        subBarBg: 'from-[#ecfccb] via-[#d9f99d] to-[#ecfccb]',
        subBarBorder: '#84cc16',
        subBarText: 'text-black',
        energyType: 'hardstyle',
        weaknessType: 'trance'
    },
    trance: {
        styleLabel: 'TRANCE',
        borderFrom: '#6366f1',
        borderTo: '#4338ca',
        outlineColor: '#1e1b4b',
        bgGradient: 'from-[#e0e7ff] via-[#c7d2fe] to-[#a5b4fc]',
        textColor: 'text-black',
        subBarBg: 'from-[#c7d2fe] via-[#a5b4fc] to-[#c7d2fe]',
        subBarBorder: '#6366f1',
        subBarText: 'text-black',
        energyType: 'trance',
        weaknessType: 'bass'
    },
    bass: {
        styleLabel: 'BASS MUSIC',
        borderFrom: '#06b6d4',
        borderTo: '#0369a1',
        outlineColor: '#075985',
        bgGradient: 'from-[#ecfeff] via-[#cffafe] to-[#a5f3fc]',
        textColor: 'text-black',
        subBarBg: 'from-[#cffafe] via-[#a5f3fc] to-[#cffafe]',
        subBarBorder: '#06b6d4',
        subBarText: 'text-black',
        energyType: 'bass',
        weaknessType: 'edm'
    },
    retro: {
        styleLabel: 'RETRO / DISCO',
        borderFrom: '#475569',
        borderTo: '#1e293b',
        outlineColor: '#0f172a',
        bgGradient: 'from-[#0f172a] via-[#1e293b] to-[#0f172a]',
        textColor: 'text-white',
        subBarBg: 'from-[#1e293b] via-[#0f172a] to-[#1e293b]',
        subBarBorder: '#334155',
        subBarText: 'text-white',
        energyType: 'retro',
        weaknessType: 'techno'
    }
};

const getCardTheme = (card: DropsidersCard): CardTheme => {
    const name = card.name.toLowerCase();
    
    // Explicit overrides for popular names
    if (name.includes('tomorrowland') || name.includes('ultra') || name.includes('creamfields') || name.includes('edc') || name.includes('electric daisy') || name.includes('electro')) {
        return THEME_PRESETS.edm;
    }
    if (name.includes('berghain') || name.includes('awakenings') || name.includes('printworks') || name.includes('time warp') || name.includes('fabric') || name.includes('rex') || name.includes('techno')) {
        return THEME_PRESETS.techno;
    }
    if (name.includes('ibiza') || name.includes('hï') || name.includes('ushuaïa') || name.includes('beach') || name.includes('house') || name.includes('groove')) {
        return THEME_PRESETS.house;
    }
    if (name.includes('defqon') || name.includes('hardstyle') || name.includes('hardcore') || name.includes('decibel') || name.includes('kick')) {
        return THEME_PRESETS.hardstyle;
    }
    if (name.includes('trance') || name.includes('state of') || name.includes('asot') || name.includes('psy') || name.includes('cosmic') || name.includes('astral') || name.includes('dream')) {
        return THEME_PRESETS.trance;
    }
    if (name.includes('bass') || name.includes('dubstep') || name.includes('dnb') || name.includes('drum') || name.includes('sound') || name.includes('sub')) {
        return THEME_PRESETS.bass;
    }
    if (name.includes('retro') || name.includes('disco') || name.includes('vintage') || name.includes('classic') || name.includes('club')) {
        return THEME_PRESETS.retro;
    }

    // Fallback: Deterministic selection based on card ID/name hash
    let hash = 0;
    const key = card.id || card.name;
    for (let i = 0; i < key.length; i++) {
        hash = key.charCodeAt(i) + ((hash << 5) - hash);
    }
    const presets = Object.values(THEME_PRESETS);
    const index = Math.abs(hash) % presets.length;
    return presets[index];
};

// ─── ATTACKS CONFIGURATION ────────────────────────────────────────────────────
interface Attack {
    cost: string[];
    name: string;
    damage: string;
    text: string;
}

// Per-venue first attack names (clubs & festivals)
const VENUE_ATTACK_NAMES: Record<string, string> = {
    // ── CLUBS ──
    'Fabric': 'Bodysonic Floor',
    'Berghain': 'Industrial Surge',
    'DC-10': 'Circoloco Storm',
    'Amnesia': 'CO2 Cannon',
    'Hï': 'Theatre Drop',
    'Avant Gardner': 'Kings Hall Rush',
    'Drumsheds': 'Shed Tremor',
    'XOYO': 'Shoreditch Residency',
    'Watergate': 'Spree Current',
    'Womb': 'Shibuya Surge',
    'Club der Visionaere': 'Flutgraben Float',
    'Shelter': 'Underground Pulse',
    'Sub Club': 'Glasgow Acid',
    'Egg': 'Kings Cross Marathon',
    'Input': 'Meyer Sound Blast',
    'Exchange': 'Art Deco Rush',
    'Social Club': 'Bastille Groove',
    'Studio 338': 'Greenwich Garden',
    'Suicide Circus': 'Berlin Afterrave',
    'Oval Space': 'Bethnal Arch',
    'La Machine du Moulin Rouge': 'Pigalle Nuit',
    'Kunsthaus Tacheles': 'Squat Rave',
    'Green Valley': 'Jungle Drop',
    'Echostage': 'East Coast Wave',
    'Ushuaïa': 'Poolside Banger',
    'Bootshaus': 'Rhine Power',
    'Savaya': 'Uluwatu Cliff',
    'Laroc Club': 'Sunset Open Air',
    'Illuzion': 'Pharaonic Laser',
    'Noa Beach Club': 'Adriatic Wave',
    'Papaya Club': 'Zrce Bomb',
    'PLAY HOUSE': 'Chengdu Megastage',
    'FABRIK': 'Madrid Marathon',
    'Opium': 'Barcelone Beach',
    'Eden': 'Void Incubus',
    'Elsewhere': 'Brooklyn Underground',
    'Tenax Club': 'Florentine Pulse',
    'Il Muretto': 'Adriatic Roof',
    'Yalta Club': 'Sofia Revival',
    'D-Edge': 'LED Labyrinth',
    'Warung Beach Club': 'Sunrise Session',
    'Output': 'No-Photo Zone',
    'Paradise Club': 'Mykonos Pool Party',
    'Culture Club': 'Ghent Groove',
    'Fuse': 'Brussels Techno',
    'La Terrazza': 'Poble Roof',
    'Village Underground': 'Wagon Drop',
    'Kater Blau': 'Bar25 Legacy',
    'Sisyphos': 'Biscuit Factory',
    'Robert Johnson': 'Main River Minimal',
    'Zouk': 'Vegas Spectacle',
    'Marquee': 'Vegas Mainroom',
    'Badaboum': 'Bastille Hustle',
    // ── FESTIVALS ──
    'Tomorrowland': 'Book of Wisdom',
    'Ultra Music Festival': 'Bayfront Mainstage',
    'EDC Las Vegas': 'Headliner Rush',
    'Movement Detroit': 'Hart Plaza Techno',
    'Sónar': 'Digital Pulse',
    'Defqon.1': 'Endshow Fireworks',
    'Time Warp': 'Industrial Hall',
    'Creamfields': 'Steel Yard Storm',
    'Mysteryland': 'Dutch Fields',
    'Exit Festival': 'Petrovaradin Siege',
    'Untold Festival': 'Cluj Arena',
    'Medusa Festival': 'Sunbeach Marathon',
    'Dimensions Festival': 'Venetian Fortress',
    'Electric Zoo': 'Randall Island',
    'Neopop Festival': 'Castle Techno',
    'Loveland Festival': 'Sloterpark Sunset',
    'SW4 Festival': 'Clapham Surge',
    'Transmission Festival': 'O2 Trance Dome',
    'Electric Castle': 'Ruins of Bonțida',
    'Qlimax': 'GelreDome Indoor',
    'Epizode Festival': 'Tropical Rave',
    'Elrow Festival': 'Confetti Chaos',
    'Wide Awake Festival': 'Brockwell Punk',
    'Tomorrowland Brasil': 'Itu Jungle Magic',
    'Ultra Europe': 'Dalmatian Coast',
    'Glastonbury Festival': 'Pyramid Stage',
    'Kappa FuturFestival': 'Parco Dora Drop',
    'World Club Dome': 'Frankfurt Stadium',
    'Coachella Valley Music & Arts Festival': 'Desert Mainstage',
    'Sunburn Festival': 'Goa Shoreline',
    'AMF (Amsterdam Music Festival)': 'Top 100 Coronation',
    'Parookaville': 'Ephemeral City',
    'Parklife': 'Manchester Eclectic',
    'Sziget Festival': 'Liberty Island',
    'Balaton Sound': 'Lakeside Beat',
    'Monegros Desert Festival': 'Desert Rave',
    'Neversea Festival': 'Black Sea Shore',
    'Boomtown': 'Fictional City',
    'Lollapalooza': 'Grant Park Takeover',
    'Electric Love': 'Alpine EDM',
    'EDC Orlando': 'Florida Daisy',
    'Sonus Festival': 'Pag Island Week',
    '808 Festival': 'Bangkok Pulse',
    'Veld Music Festival': 'Downsview Surge',
    'Bonnaroo Music & Arts Festival': 'Tennessee Positivity',
    'Lovefest': 'Serbian Gem',
    'Terminal V': 'Highland Rave',
    'Arc Music Festival': 'Chicago House Roots',
    'Panorama Festival': 'Calabrian Sunset',
    'Les Plages Electroniques': 'Cannes Dancefloor',
    'Burning Man': 'Playa Ceremony',
};

// Per-club music genre labels (sourced from Wikipedia)
const CLUB_MUSIC_STYLES: Record<string, string> = {
    'Fabric': 'Techno · House · Drum & Bass',
    'Berghain': 'Techno · Industrial',
    'DC-10': 'House · Techno · Underground',
    'Amnesia': 'House · Trance · EDM',
    'Hï': 'House · Techno · EDM',
    'Avant Gardner': 'House · Techno · EDM',
    'Drumsheds': 'Techno · House · D&B',
    'XOYO': 'House · Techno · Disco',
    'Watergate': 'Deep House · Minimal · Tech-House',
    'Womb': 'Techno · House · Drum & Bass',
    'Club der Visionaere': 'Minimal · Microhouse · Techno',
    'Shelter': 'Techno · House',
    'Sub Club': 'House · Techno · Acid',
    'Egg': 'House · Techno · Disco',
    'Input': 'Techno · Minimal · Electronica',
    'Exchange': 'House · Techno · EDM',
    'Social Club': 'Hip-Hop · Funk · Électro',
    'Studio 338': 'House · Techno · Drum & Bass',
    'Suicide Circus': 'Techno · Industrial',
    'Oval Space': 'Techno · House · Expérimental',
    'La Machine du Moulin Rouge': 'Électronique · Hip-Hop · Rock',
    'Kunsthaus Tacheles': 'Techno · Underground · Expérimental',
    'Green Valley': 'EDM · Progressive House · Trance',
    'Echostage': 'EDM · House · Techno',
    'Ushuaïa': 'House · EDM · Tech-House',
    'Bootshaus': 'EDM · Hardstyle · Techno',
    'Savaya': 'House · Afro · Organic',
    'Laroc Club': 'EDM · Progressive House',
    'Illuzion': 'EDM · House · Hip-Hop',
    'Noa Beach Club': 'House · Techno · Progressive',
    'Papaya Club': 'House · Techno · EDM',
    'PLAY HOUSE': 'EDM · Hip-Hop · Électro',
    'FABRIK': 'Techno · EDM',
    'Opium': 'House · R&B · Pop Électronique',
    'Eden': 'House · Techno · Trance',
    'Elsewhere': 'Techno · House · Indie Dance',
    'Tenax Club': 'House · Techno · Électronique',
    'Il Muretto': 'House · Italo Dance · Électronique',
    'Yalta Club': 'House · Techno · Électronique',
    'D-Edge': 'Techno · House · Électronique',
    'Warung Beach Club': 'Progressive · House · Techno',
    'Output': 'Techno · House · Expérimental',
    'Paradise Club': 'House · EDM · Commercial',
    'Culture Club': 'House · Électronique',
    'Fuse': 'Techno · EBM · Industrial',
    'La Terrazza': 'House · Techno · Open Air',
    'Village Underground': 'Indie · Électronique · Alternative',
    'Kater Blau': 'House · Techno · Minimal',
    'Sisyphos': 'Techno · House · Psychédélique',
    'Robert Johnson': 'Minimal · Deep House · Techno',
    'Zouk': 'EDM · House · Techno',
    'Marquee': 'EDM · House · Hip-Hop',
    'Badaboum': 'House · Disco · Funk',
};

const getVenueAttackName = (card: DropsidersCard): string => {
    if (card.type === 'dj') return 'Signature Set';
    return VENUE_ATTACK_NAMES[card.name] || (card.type === 'festival' ? 'Main Stage Rush' : 'Midnight Ritual');
};

const getCardAttacks = (card: DropsidersCard, theme: CardTheme): Attack[] => {
    const attacks: Attack[] = [];
    const energy = theme.energyType;
    const venueAttack = getVenueAttackName(card);

    // First attack
    if (card.type === 'festival') {
        attacks.push({
            cost: ['star', 'star'],
            name: venueAttack,
            damage: '40',
            text: ''
        });
    } else if (card.type === 'dj') {
        // For DJs: no first attack shown, only top tracks
        // (we skip the attack and just return empty if no epic/legendary)
    } else {
        attacks.push({
            cost: ['star'],
            name: venueAttack,
            damage: '20',
            text: ''
        });
    }

    // Second attack: themed around the musical style (epic/legendary only)
    if (card.rarity === 'epic' || card.rarity === 'legendary') {
        const damageVal = card.rarity === 'legendary' ? '120' : '90';
        
        if (card.type === 'dj') {
            // DJs get a single themed attack
            switch (energy) {
                case 'techno':
                    attacks.push({ cost: ['techno', 'techno', 'star'], name: 'Dark Warehouse', damage: damageVal, text: '' });
                    break;
                case 'house':
                    attacks.push({ cost: ['house', 'house', 'star'], name: 'Sunset Piano', damage: damageVal, text: '' });
                    break;
                case 'edm':
                    attacks.push({ cost: ['edm', 'edm', 'star'], name: 'Laser Symphony', damage: damageVal, text: '' });
                    break;
                case 'hardstyle':
                    attacks.push({ cost: ['hardstyle', 'hardstyle', 'star'], name: 'Melodic Climax', damage: damageVal, text: '' });
                    break;
                case 'trance':
                    attacks.push({ cost: ['trance', 'trance', 'star'], name: 'Psy-Vibration', damage: damageVal, text: '' });
                    break;
                case 'bass':
                    attacks.push({ cost: ['bass', 'bass', 'star'], name: 'Subwoofer Blast', damage: damageVal, text: '' });
                    break;
                case 'retro':
                    attacks.push({ cost: ['retro', 'retro', 'star'], name: 'Disco Inferno', damage: damageVal, text: '' });
                    break;
                default:
                    attacks.push({ cost: ['star', 'star', 'star'], name: 'Signature Banger', damage: damageVal, text: '' });
            }
        } else {
            // Clubs & Festivals: second attack also named after the venue
            const secondVenueAttacks: Record<string, string> = {
                // CLUBS
                'Fabric': 'Room One Bodysonic', 'Berghain': 'Panorama Bar', 'DC-10': 'Circoloco Monday',
                'Amnesia': 'Terrace Explosion', 'Hï': 'Club Room Takeover', 'Avant Gardner': 'Great Hall Surge',
                'Drumsheds': 'Factory Takeover', 'XOYO': 'Long-Term Residency', 'Watergate': 'Riverside Float',
                'Womb': 'Mirror Ball Drop', 'Club der Visionaere': 'Canal Side Session', 'Shelter': 'A\'DAM Tower Core',
                'Sub Club': 'Funktion-One Acid', 'Egg': 'Weekend Marathon', 'Input': 'Meyer Immersion',
                'Exchange': 'Deco Hall Rush', 'Social Club': 'Paris Underground', 'Studio 338': 'Summer Garden',
                'Suicide Circus': 'Outdoor Afterrave', 'Oval Space': 'Skylight Rave', 'La Machine du Moulin Rouge': 'Nuit Pigalle',
                'Kunsthaus Tacheles': 'Art Squat Rave', 'Green Valley': 'Jungle Sunrise', 'Echostage': 'Capital Surge',
                'Ushuaïa': 'Open Air Pool Drop', 'Bootshaus': 'Rhine Massive', 'Savaya': 'Cliff Sunset',
                'Laroc Club': 'Sunset Stage', 'Illuzion': 'LED Dome Surge', 'Noa Beach Club': 'Water Stage',
                'Papaya Club': 'Island Night', 'PLAY HOUSE': 'Mobile Stage Blast', 'FABRIK': 'Madrid Massive',
                'Opium': 'Beach Glamour', 'Eden': 'San Antonio Night', 'Elsewhere': 'Hall Invasion',
                'Tenax Club': '80s Pioneer', 'Il Muretto': 'Retractable Roof', 'Yalta Club': 'Sofia Legend',
                'D-Edge': 'LED Abyss', 'Warung Beach Club': 'Wooden Temple', 'Output': 'No Flash Policy',
                'Paradise Club': 'Mykonos VIP Night', 'Culture Club': 'Ghent Design Night', 'Fuse': 'Brussels EBM',
                'La Terrazza': 'Summer Open Air', 'Village Underground': 'Metro Wagon', 'Kater Blau': 'Spree Rave',
                'Sisyphos': 'Dog Biscuit Factory', 'Robert Johnson': 'Purism Drop', 'Zouk': 'Singapore Legacy',
                'Marquee': 'Pool Club Day', 'Badaboum': 'Cocktail Club',
                // FESTIVALS
                'Tomorrowland': 'Mainstage Crescendo', 'Ultra Music Festival': 'Resistance Stage',
                'EDC Las Vegas': 'Kinetic Field', 'Movement Detroit': 'Techno Birthplace',
                'Sónar': 'Sonar+D Innovation', 'Defqon.1': 'Blue Stage Kick',
                'Time Warp': 'Mannheim Hall', 'Creamfields': 'Arc Stage',
                'Mysteryland': '1993 Legacy', 'Exit Festival': 'Danube Fortress',
                'Untold Festival': 'European Award', 'Medusa Festival': '10h Marathon Set',
                'Dimensions Festival': 'Fortress Night', 'Electric Zoo': 'Urban Island',
                'Neopop Festival': 'Dark Castle', 'Loveland Festival': 'Amsterdam Outdoor',
                'SW4 Festival': 'Bank Holiday Drop', 'Transmission Festival': 'Spacelab Visual',
                'Electric Castle': 'Castle Ruins', 'Qlimax': 'Indoor Fireworks',
                'Epizode Festival': 'Beach Week', 'Elrow Festival': 'Confetti Flood',
                'Wide Awake Festival': 'Brixton Experimental', 'Tomorrowland Brasil': 'Itu Mainpage',
                'Ultra Europe': 'Hvar Island Satellite', 'Glastonbury Festival': 'Other Stage',
                'Kappa FuturFestival': 'Parco Dora Industrial', 'World Club Dome': 'Stadium Takeover',
                'Coachella Valley Music & Arts Festival': 'Sahara Tent', 'Sunburn Festival': 'Goa Beach Stage',
                'AMF (Amsterdam Music Festival)': 'ArenA Finale', 'Parookaville': 'City Passport Drop',
                'Parklife': 'Sounds of the Near Future', 'Sziget Festival': 'Danube Stage',
                'Balaton Sound': 'Lake Sunset', 'Monegros Desert Festival': '24h Desert',
                'Neversea Festival': 'Black Sea Night', 'Boomtown': 'Imaginary Town',
                'Lollapalooza': 'Chicago Takeover', 'Electric Love': 'Alpine Stage',
                'EDC Orlando': 'Florida Neon', 'Sonus Festival': 'Boat Party Drop',
                '808 Festival': 'Bangkok Mainroom', 'Veld Music Festival': 'Toronto Bass',
                'Bonnaroo Music & Arts Festival': 'Centeroo Stage', 'Lovefest': 'Serbian Reveal',
                'Terminal V': 'Royal Highland Drop', 'Arc Music Festival': 'Union Park Roots',
                'Panorama Festival': 'Calabrian Shore', 'Les Plages Electroniques': 'Riviera Night',
                'Burning Man': 'Black Rock Effigy',
            };
            const secondName = secondVenueAttacks[card.name] || (card.type === 'festival' ? 'Headline Surge' : 'Legendary Night');
            attacks.push({
                cost: [energy, energy, 'star'],
                name: secondName,
                damage: damageVal,
                text: ''
            });
        }
    }
    
    return attacks;
};

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export function DropsidersCardComponent({ card, flippable = false, startFaceDown = false, flipped: controlledFlipped, scale = 1, showDate = false, exportMode, onClick }: DropsidersCardProps) {
    const [flipped, setFlipped] = useState(controlledFlipped !== undefined ? controlledFlipped : startFaceDown);
    const [hovered, setHovered] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    // Sync with controlled flipped prop when parent changes it
    useEffect(() => {
        if (controlledFlipped !== undefined) {
            setFlipped(controlledFlipped);
        }
    }, [controlledFlipped]);

    // Dynamic Level, HP, and Musical Genre Theme
    const level = 101 - card.djmag_rank;
    const hp = card.rarity === 'legendary' ? 150 : card.rarity === 'epic' ? 120 : card.rarity === 'rare' ? 90 : 70;
    const theme = getCardTheme(card);
    const attacks = getCardAttacks(card, theme);

    const isWhiteText = theme.textColor === 'text-white';
    const subColor = isWhiteText ? '#ffffff' : '#2c2c2c';
    const subShadow = isWhiteText ? '0 1px 2px rgba(0,0,0,0.8), 0 1px 4px rgba(0,0,0,0.6)' : '0 1px 0 rgba(255,255,255,0.8), 0 1px 4px rgba(0,0,0,0.6)';
    const titleColor = isWhiteText ? '#ffffff' : '#1a1a1a';
    const titleShadow = isWhiteText ? '0 1px 2px rgba(0,0,0,0.9), 0 2px 6px rgba(0,0,0,0.7)' : '0 1px 0 rgba(255,255,255,0.9), 0 2px 6px rgba(0,0,0,0.7)';

    // Dynamic Holographic foil gradient
    const holoBg = card.rarity === 'legendary'
        ? 'linear-gradient(115deg, transparent 20%, rgba(255,215,0,0.7) 30%, rgba(255,0,128,0.6) 40%, rgba(0,255,255,0.7) 50%, rgba(255,215,0,0.7) 60%, transparent 80%)'
        : card.rarity === 'epic'
        ? 'linear-gradient(115deg, transparent 20%, rgba(168,85,247,0.6) 30%, rgba(244,63,94,0.5) 45%, rgba(107,33,168,0.6) 60%, transparent 80%)'
        : card.rarity === 'rare'
        ? 'linear-gradient(115deg, transparent 20%, rgba(6,182,212,0.5) 30%, rgba(52,211,153,0.4) 45%, rgba(37,99,235,0.5) 60%, transparent 80%)'
        : 'none';

    // 3D Motion dynamics
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const springConfig = { stiffness: 180, damping: 15 };
    const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [12, -12]), springConfig);
    const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-12, 12]), springConfig);
    
    // Holographic sheen position
    const shineX = useSpring(useTransform(mouseX, [-0.5, 0.5], [100, 0]), springConfig);
    const shineY = useSpring(useTransform(mouseY, [-0.5, 0.5], [100, 0]), springConfig);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
        mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
    };

    const handleMouseLeave = () => {
        mouseX.set(0);
        mouseY.set(0);
        setHovered(false);
    };

    const handleClick = () => {
        if (flippable) setFlipped((f) => !f);
        onClick?.();
    };

    const W = Math.round(240 * scale);
    const H = Math.round(350 * scale);

    return (
        <motion.div
            ref={cardRef}
            style={{
                width: W,
                height: H,
                perspective: exportMode ? 'none' : 1200,
                cursor: flippable ? 'pointer' : onClick ? 'pointer' : 'default',
                rotateX: exportMode ? 0 : (flipped ? 0 : rotateX),
                rotateY: exportMode ? 0 : (flipped ? 0 : rotateY),
                transformStyle: exportMode ? 'flat' : 'preserve-3d',
            }}
            onMouseMove={exportMode ? undefined : handleMouseMove}
            onMouseEnter={exportMode ? undefined : () => setHovered(true)}
            onMouseLeave={exportMode ? undefined : handleMouseLeave}
            onClick={exportMode ? undefined : handleClick}
            whileTap={exportMode ? undefined : { scale: 0.97 }}
            className="select-none relative"
        >
            <motion.div
                style={{ width: '100%', height: '100%', transformStyle: exportMode ? 'flat' : 'preserve-3d', position: 'relative' }}
                animate={{ rotateY: exportMode ? 0 : (flipped ? 180 : 0) }}
                transition={{ duration: 0.7, ease: [0.25, 1, 0.5, 1] }}
            >
                {/* ─────────────────────────────────────────────────────────────
                    FRONT FACE (RECTO)
                    ───────────────────────────────────────────────────────────── */}
                {exportMode !== 'back' && (
                <div
                    style={exportMode === 'front' ? {} : { backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                    className="absolute inset-0 z-10 w-full h-full p-[1px]"
                >
                    {/* Golden Pokémon Card frame */}
                    <div
                        className="relative w-full h-full rounded-[24px] overflow-hidden border-[11px] flex flex-col p-[5px] shadow-[0_15px_35px_rgba(0,0,0,0.8)] select-none"
                        style={{
                            borderColor: theme.borderFrom,
                            background: `linear-gradient(135deg, ${theme.borderFrom}, ${theme.borderTo})`,
                            outline: `1px solid ${theme.outlineColor}`,
                            outlineOffset: '-11px',
                        }}
                    >
                        {/* Inner light hairline border */}
                        <div className="absolute inset-[1px] border border-white/30 rounded-[11px] pointer-events-none z-30" />

                        {/* Parchment background body */}
                        <div className={`w-full h-full rounded-[10px] bg-gradient-to-br ${theme.bgGradient} flex flex-col p-2.5 relative overflow-hidden z-10 shadow-[inset_0_0_15px_rgba(0,0,0,0.15)]`}>
                            
                            {/* Subtle scanline overlay for retro print feel */}
                            <div className="absolute inset-0 bg-[radial-gradient(#151525_0.8px,transparent_0.8px)] [background-size:8px_8px] opacity-5 pointer-events-none" />

                            {/* Holographic Overlays for rare/epic/legendary cards */}
                            {card.rarity !== 'common' && (
                                <motion.div
                                    className="absolute inset-0 pointer-events-none z-20 mix-blend-color-dodge transition-opacity duration-300"
                                    style={{
                                        opacity: hovered ? 1 : 0.4,
                                        background: holoBg,
                                        backgroundSize: '250% 250%',
                                        backgroundPosition: useTransform(() => `${shineX.get()}% ${shineY.get()}%`),
                                    }}
                                />
                            )}

                            {/* Metallic Shine Reflection Line on hover */}
                            <div
                                className="absolute inset-0 z-30 pointer-events-none transition-all duration-800 ease-out"
                                style={{
                                    background: 'linear-gradient(110deg, transparent 40%, rgba(255,255,255,0.2) 50%, transparent 60%)',
                                    backgroundSize: '200% 200%',
                                    transform: hovered ? 'translateX(100%)' : 'translateX(-100%)',
                                }}
                            />

                            {/* Card Content Layout */}
                            <motion.div 
                                className="relative z-40 flex flex-col h-full justify-between"
                                style={{ transform: hovered ? 'translateZ(40px)' : 'translateZ(0px)', transition: 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)' }}
                            >
                                
                                <div className="flex items-end justify-between border-b border-[#a8905a]/50 pb-0.5">
                                    <div className="flex items-baseline gap-1">
                                        <span 
                                            className={`text-[5px] font-black uppercase tracking-tighter slanted opacity-90 ${theme.textColor}`}
                                            style={{ textShadow: theme.textColor === 'text-white' ? '0 1px 0px rgba(0,0,0,0.8), 0 1px 4px rgba(0,0,0,0.6)' : '0 1px 0px rgba(255,255,255,0.8), 0 1px 4px rgba(0,0,0,0.6)' }}
                                        >
                                            {theme.styleLabel}
                                        </span>
                                        <h3 
                                            className={`font-serif font-black uppercase italic tracking-tight leading-none text-[#b0b0b0]`}
                                            style={{
                                                fontSize: Math.max(9, 13 * scale),
                                                textShadow: '0 1px 0 rgba(255,255,255,0.4), 0 2px 6px rgba(0,0,0,0.7)'
                                            }}
                                        >
                                            {card.name}
                                        </h3>
                                        <span 
                                            className={`font-sans font-bold tracking-tighter opacity-90 ${theme.textColor}`}
                                            style={{ 
                                                fontSize: Math.max(6, 8 * scale),
                                                textShadow: theme.textColor === 'text-white' ? '0 1px 0 rgba(0,0,0,0.8), 0 1px 4px rgba(0,0,0,0.6)' : '0 1px 0 rgba(255,255,255,0.8), 0 1px 4px rgba(0,0,0,0.6)'
                                            }}
                                        >
                                            LV.{level}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="font-serif font-black text-red-500 leading-none tracking-tighter" style={{ fontSize: Math.max(8, 12 * scale), textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                                            HP <span className={`font-sans font-extrabold ${theme.textColor}`} style={{ fontSize: Math.max(9, 13 * scale), textShadow: theme.textColor === 'text-white' ? '0 1px 0 rgba(0,0,0,0.9), 0 2px 5px rgba(0,0,0,0.7)' : '0 1px 0 rgba(255,255,255,0.9), 0 2px 5px rgba(0,0,0,0.7)' }}>{hp}</span>
                                        </span>
                                        <EnergyBadge type={theme.energyType} />
                                    </div>
                                </div>

                                {/* 2. DJ IMAGE BOX */}
                                <div className="relative w-full mt-1.5 rounded-[5px] overflow-hidden border-[3px] border-double border-[#bfab76] bg-black shadow-[2px_2px_5px_rgba(0,0,0,0.15)] flex-grow" style={{ minHeight: 0, maxHeight: '65%' }}>
                                    <img
                                        src={card.image}
                                        alt={card.name}
                                        className="w-full h-full object-cover scale-100 group-hover:scale-102 transition-transform duration-500"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
                                </div>

                                {/* 3. SUB-STAT BAR */}
                                <div 
                                    className="w-[96%] mx-auto bg-gradient-to-r border-b shadow-sm py-0.5 text-center mt-1 select-none"
                                    style={{
                                        borderImage: `linear-gradient(to right, transparent, ${theme.subBarBorder}, transparent) 1`,
                                        background: `linear-gradient(to right, transparent, rgba(255,255,255,0.4), transparent)`,
                                    }}
                                >
                                    <p className={`font-serif italic font-bold tracking-tight uppercase`} style={{ fontSize: Math.max(5, 7 * scale), color: subColor, textShadow: subShadow }}>
                                        N° {card.djmag_rank.toString().padStart(3, '0')} · {card.type === 'festival' ? 'Festival' : card.type === 'dj' ? 'DJ' : 'Club'} · {card.city}, {card.country}
                                    </p>
                                </div>

                                {/* 4. ATTACKS / DESCRIPTION SECTION */}
                                <div className="flex-grow flex flex-col justify-center mt-2.5 space-y-2">
                                    {attacks.map((att, idx) => (
                                        <div key={idx} className="flex flex-col">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1">
                                                    <div className="flex gap-0.5 select-none">
                                                        {att.cost.map((c, i) => <EnergyBadge key={i} type={c === 'star' ? 'star' : theme.energyType} />)}
                                                    </div>
                                                    <h4 className={`font-sans font-black tracking-tight ml-1 leading-none uppercase`} style={{ fontSize: Math.max(7, 10 * scale), color: titleColor, textShadow: titleShadow }}>
                                                        {att.name}
                                                    </h4>
                                                </div>
                                                <span className={`font-sans font-black leading-none`} style={{ fontSize: Math.max(8, 11 * scale), color: titleColor, textShadow: titleShadow }}>
                                                    {att.damage}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* 5. FLAVOR TEXT / TOP 3 TRACKS */}
                                <div className="mt-auto border-t border-[#c2b085]/60 pt-1 px-1 flex flex-col items-center w-full">
                                    {card.type === 'dj' ? (
                                        <div className="w-full px-1">
                                            {(card.top_tracks && card.top_tracks.length > 0) && (
                                                <>
                                                    <p className={`font-serif italic font-bold text-center leading-normal`} style={{ fontSize: Math.max(5, 7 * scale), color: subColor, textShadow: subShadow }}>
                                                        Top 3 des titres les plus écoutés :
                                                    </p>
                                                    <div className={`font-sans font-medium text-center leading-tight mt-0.5 opacity-90`} style={{ fontSize: Math.max(4.5, 6 * scale), color: subColor, textShadow: subShadow }}>
                                                        {card.top_tracks.slice(0,3).map((t, i) => <p key={i}>{i + 1}. {t}</p>)}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="w-full px-1 flex flex-col items-center gap-0.5">
                                            {card.attendees_label && (
                                                <p className={`font-sans font-black text-center leading-tight`} style={{ fontSize: Math.max(4.5, 6.5 * scale), color: subColor, textShadow: subShadow }}>
                                                    🎟 {card.attendees_label}
                                                </p>
                                            )}
                                            {card.type === 'club' && CLUB_MUSIC_STYLES[card.name] && (
                                                <p className={`font-serif italic text-center leading-tight mt-0.5 opacity-90`} style={{ fontSize: Math.max(4, 5.5 * scale), color: subColor, textShadow: subShadow }}>
                                                    🎵 {CLUB_MUSIC_STYLES[card.name]}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* 6. CARD FOOTER INFO */}
                                <div className={`border-t border-[#9e8853]/40 mt-1.5 pt-1 flex justify-between items-center font-sans font-black select-none ${theme.textColor}`} style={{ fontSize: Math.max(5, 6.5 * scale) }}>
                                    <div className="flex gap-3">
                                        <div className="flex items-center gap-1">
                                            <span className="opacity-80">weakness</span>
                                            <EnergyBadge type={theme.weaknessType} />
                                            <span className="ml-0.5">x2</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="opacity-80">resistance</span>
                                            <StarEnergy />
                                            <span className="ml-0.5">-30</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="opacity-80">retreat cost</span>
                                        <div className="flex gap-0.5">
                                            <StarEnergy />
                                        </div>
                                    </div>
                                </div>

                                {/* Copyright info block */}
                                <div className={`flex justify-between items-center mt-1 font-sans font-semibold select-none opacity-60 ${theme.textColor}`} style={{ fontSize: Math.max(4, 5.5 * scale) }}>
                                    <span>©2026 Dropsiders Card System</span>
                                    <span>{card.djmag_rank}/100 ★</span>
                                </div>

                                {showDate && card.collectedAt && (
                                    <p className={`font-bold uppercase tracking-wider mt-0.5 text-center opacity-70 ${theme.textColor}`} style={{ fontSize: 5.5 * scale }}>
                                        Obtenue le {new Date(card.collectedAt).toLocaleDateString('fr-FR')}
                                    </p>
                                )}

                            </motion.div>
                        </div>

                    </div>
                </div>
                )}

                {/* ─────────────────────────────────────────────────────────────
                    BACK FACE (VERSO) - STYLISH DROPSIDERS DESIGN
                    ───────────────────────────────────────────────────────────── */}
                {exportMode !== 'front' && (
                <div
                    style={exportMode === 'back' ? {} : { backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    className="absolute inset-0 w-full h-full p-[1px]"
                >
                    {/* Dark Premium Frame */}
                    <div 
                        className="w-full h-full rounded-[24px] overflow-hidden border-[11px] border-[#07070a] bg-[#07070a] flex flex-col p-[4px] shadow-[0_15px_40px_rgba(0,0,0,0.9)] relative"
                        style={{
                            outline: '1px solid rgba(255,255,255,0.1)',
                            outlineOffset: '-11px',
                            boxShadow: 'inset 0 0 20px rgba(34,211,238,0.15)'
                        }}
                    >
                        {/* Main canvas interior */}
                        <div className="w-full h-full rounded-[12px] bg-[#030305] overflow-hidden relative flex flex-col items-center justify-center border border-white/10 shadow-[inset_0_0_30px_rgba(0,0,0,1)]">
                            
                            {/* Background Ambient Glow */}
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.15)_0%,rgba(34,211,238,0.1)_50%,transparent_100%)] opacity-80" />
                            
                            {/* Futuristic Hex Grid Pattern */}
                            <div 
                                className="absolute inset-0 opacity-[0.03]"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0l20 10v20L20 40 0 30V10z' fill-rule='evenodd' stroke='%23ffffff' stroke-width='1' fill='none'/%3E%3C/svg%3E")`,
                                    backgroundSize: '30px 30px',
                                }}
                            />

                            {/* Diagonal Neon Accents */}
                            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50">
                                <div className="absolute top-1/4 left-[-20%] w-[140%] h-[1px] rotate-[-35deg] bg-gradient-to-r from-transparent via-neon-cyan to-transparent shadow-[0_0_10px_rgba(34,211,238,1)]" />
                                <div className="absolute top-3/4 left-[-20%] w-[140%] h-[1px] rotate-[-35deg] bg-gradient-to-r from-transparent via-neon-purple to-transparent shadow-[0_0_10px_rgba(168,85,247,1)]" />
                            </div>

                            {/* Central Dropsiders Emblem */}
                            <div className="relative z-10 flex flex-col items-center mt-[-10px]">
                                {/* Glowing backdrop for logo */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 bg-neon-cyan/20 blur-2xl rounded-full" />
                                
                                <img src="/Logo.png" alt="Dropsiders" className="w-16 h-auto drop-shadow-[0_0_15px_rgba(34,211,238,0.6)] relative z-20" />

                                {/* Title */}
                                <div className="mt-8 text-center flex flex-col items-center">
                                    <h2 className="text-xl font-black uppercase tracking-[0.25em] text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] leading-none">
                                        DROPSIDERS
                                    </h2>
                                    <div className="w-12 h-[2px] bg-gradient-to-r from-transparent via-neon-cyan to-transparent mt-2 mb-1" />
                                    <p className="text-[6px] font-bold uppercase tracking-[0.4em] text-white/60">
                                        Exclusive Collection
                                    </p>
                                </div>
                            </div>

                            {/* Tech Borders */}
                            <div className="absolute top-4 left-4 w-6 h-6 border-t-[1.5px] border-l-[1.5px] border-neon-cyan/60" />
                            <div className="absolute top-4 right-4 w-6 h-6 border-t-[1.5px] border-r-[1.5px] border-neon-purple/60" />
                            <div className="absolute bottom-4 left-4 w-6 h-6 border-b-[1.5px] border-l-[1.5px] border-neon-red/60" />
                            <div className="absolute bottom-4 right-4 w-6 h-6 border-b-[1.5px] border-r-[1.5px] border-neon-cyan/60" />
                        </div>
                    </div>
                </div>
                )}

            </motion.div>
        </motion.div>
    );
}
