import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Camera, Star, Info,
    Sparkles, Trophy, Plus, Check, AlertCircle,
    Music, Shield, Palette, Megaphone, Lock,
    RefreshCw, X, Heart, Ticket, Euro,
    Flame, Search, Filter, Globe,
    Share2, MessageSquare, Wand2, Instagram, Users as UsersIcon
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';
import { MemoryWall } from '../components/community/MemoryWall';
import { QuizSection } from '../components/community/QuizSection';
import { AvisSection } from '../components/community/AvisSection';
import { GuideSection } from '../components/community/GuideSection';
import { CovoitSection } from '../components/community/CovoitSection';
import { DjNameGenerator } from '../components/community/DjNameGenerator';
import { PlaylistSharing } from '../components/community/PlaylistSharing';
import { TrackIdForum } from '../components/community/TrackIdForum';
import { useUser } from '../context/UserContext';
import { useEffect } from 'react';

import { InstagramContest } from '../components/community/InstagramContest';
import confetti from 'canvas-confetti';
import { SEO } from '../components/utils/SEO';
import { AdminEditBar } from '../components/admin/AdminEditBar';

// --- STAGE & LOCATION DATA ---
const FESTIVAL_LOCATIONS = [
    // 🎪 RÉGIONAL & DÉBUTANT (Rank 0-1)
    { id: 'camping', name: 'Camping Municipal - Le Grau-du-Roi', cost: 3000, prestige: 1, capacity: 500, minRank: 0 },
    { id: 'fete-village', name: 'Fête de la Musique - Place de l\'Église', cost: 8000, prestige: 2, capacity: 1200, minRank: 0 },
    { id: 'salle-fetes', name: 'Salle des Fêtes - Saint-Étienne', cost: 12000, prestige: 2, capacity: 1500, minRank: 0 },
    { id: 'club-local', name: 'Le Petit Club Underground - Lyon', cost: 18000, prestige: 3, capacity: 600, minRank: 0 },
    { id: 'bar-concert', name: 'La Maroquinerie - Paris', cost: 25000, prestige: 3, capacity: 1000, minRank: 0 },
    { id: 'zenith-nantes', name: 'Zénith Nantes Métropole', cost: 55000, prestige: 4, capacity: 9000, minRank: 0 },
    { id: 'zenith-paris', name: 'Zénith Paris - La Villette', cost: 80000, prestige: 5, capacity: 6300, minRank: 0 },
    { id: 'zenith-lyon', name: 'Zénith de Lyon', cost: 65000, prestige: 4, capacity: 7500, minRank: 0 },
    { id: 'accor-arena', name: 'Accor Arena - Paris (Bercy)', cost: 200000, prestige: 7, capacity: 20000, minRank: 1 },
    { id: 'arenes-nimes', name: 'Arènes de Nîmes 🏛️', cost: 95000, prestige: 8, capacity: 16000, minRank: 1 },
    { id: 'sportpaleis', name: 'Sportpaleis - Anvers (BE)', cost: 180000, prestige: 7, capacity: 23000, minRank: 1 },
    { id: 'o2-london', name: 'The O2 Arena - London', cost: 320000, prestige: 8, capacity: 20000, minRank: 1 },
    { id: 'sap-center', name: 'SAP Center - San Jose (USA)', cost: 270000, prestige: 7, capacity: 17000, minRank: 1 },
    { id: 'tokyo-dome', name: 'Tokyo Dome - Japan', cost: 380000, prestige: 8, capacity: 55000, minRank: 1 },
    { id: 'maracana', name: 'Stade Maracanã - Rio de Janeiro', cost: 420000, prestige: 9, capacity: 78000, minRank: 2 },

    // TOMORROWLAND
    { id: 'boom', name: 'Boom - De Schorre (TML)', cost: 450000, prestige: 10, capacity: 200000, minRank: 2 },
    { id: 'alpe-dhuez', name: "Alpe d'Huez (TML Winter)", cost: 280000, prestige: 8, capacity: 25000, minRank: 1 },
    { id: 'itu', name: 'Itu - São Paulo (TML BR)', cost: 180000, prestige: 6, capacity: 150000, minRank: 1 },

    // ULTRA MUSIC FESTIVAL
    { id: 'miami', name: 'Miami - Bayfront Park (UMF)', cost: 550000, prestige: 10, capacity: 165000, minRank: 2 },
    { id: 'split', name: 'Split - Park Mladeži (Ultra EU)', cost: 220000, prestige: 8, capacity: 120000, minRank: 1 },
    { id: 'johannesburg', name: 'Jo\'burg - Expo Centre (Ultra SA)', cost: 140000, prestige: 6, capacity: 80000, minRank: 1 },
    { id: 'sejong', name: 'Seoul - Olympic Stadium (Ultra KR)', cost: 190000, prestige: 7, capacity: 100000, minRank: 1 },
    { id: 'tokyo', name: 'Tokyo - Odaiba (Ultra JP)', cost: 240000, prestige: 8, capacity: 100000, minRank: 1 },

    // EDC
    { id: 'vegas', name: 'Vegas - Speedway (EDC LV)', cost: 600000, prestige: 10, capacity: 450000, minRank: 2 },
    { id: 'mexico', name: 'CDMX - Autódromo (EDC MX)', cost: 210000, prestige: 7, capacity: 120000, minRank: 1 },
    { id: 'orlando', name: 'Orlando - Tinker Field (EDC ORL)', cost: 170000, prestige: 6, capacity: 90000, minRank: 0 },

    // CONCERT HALLS, STADIUMS & SUPER-CLUBS
    { id: 'sphere', name: 'Vegas - MSG Sphere', cost: 750000, prestige: 10, capacity: 18000, minRank: 3 },
    { id: 'omnia', name: 'Vegas - Omnia Club', cost: 400000, prestige: 9, capacity: 3500, minRank: 2 },
    { id: 'space-miami', name: 'Miami - Club Space', cost: 350000, prestige: 9, capacity: 2500, minRank: 2 },
    { id: 'ushuaia', name: 'Ibiza - Ushuaïa', cost: 450000, prestige: 10, capacity: 7000, minRank: 3 },
    { id: 'hi-ibiza', name: 'Ibiza - Hï Ibiza', cost: 430000, prestige: 10, capacity: 5000, minRank: 3 },
    { id: 'stade-france', name: 'Paris - Stade de France', cost: 500000, prestige: 9, capacity: 80000, minRank: 2 },
    { id: 'wembley', name: 'London - Wembley Stadium', cost: 550000, prestige: 9, capacity: 90000, minRank: 2 },
    { id: 'msg', name: 'NYC - Madison Sq Garden', cost: 420000, prestige: 9, capacity: 20000, minRank: 2 },
    { id: 'red-rocks', name: 'Colorado - Red Rocks', cost: 220000, prestige: 8, capacity: 9500, minRank: 1 },
    { id: 'berghain', name: 'Berlin - Berghain (Main)', cost: 130000, prestige: 9, capacity: 1500, minRank: 2 },
    { id: 'gashouder', name: 'Amsterdam - Gashouder', cost: 280000, prestige: 8, capacity: 3500, minRank: 1 },

    // CLASSICS
    { id: 'paris', name: 'Paris - Longchamp', cost: 150000, prestige: 7, capacity: 50000, minRank: 0 },
    { id: 'ibiza-beach', name: 'Ibiza - Playa d\'en Bossa', cost: 350000, prestige: 8, capacity: 100000, minRank: 2 },
    { id: 'lyon', name: 'Lyon - Eurexpo', cost: 80000, prestige: 5, capacity: 30000, minRank: 0 },
    { id: 'berlin', name: 'Berlin - Tempelhof', cost: 120000, prestige: 7, capacity: 40000, minRank: 1 },
];

const PROM_RANKS = [
    { level: 0, name: "Bedroom Promoter", minXp: 0, color: "text-white/40" },
    { level: 1, name: "Underground Hero", minXp: 1000, color: "text-blue-400" },
    { level: 2, name: "City Night King", minXp: 5000, color: "text-purple-400" },
    { level: 3, name: "Festival Legend", minXp: 15000, color: "text-amber-400" }
];

const STAGE_EFFECTS = [
    { id: 'pyro', name: 'Pyrotechnie Lourde', cost: 150000, hype: 0.2, icon: Flame },
    { id: 'drones', name: 'Show de Drones', cost: 250000, hype: 0.3, icon: Sparkles },
    { id: 'holo', name: 'Visuels 3D / Holo', cost: 100000, hype: 0.15, icon: Camera }
];

const NEGOTIATION_PERKS = [
    { id: 'jet', name: 'Jet Privé', cost: 50000, chance: 0.4, desc: "Pour les bookings express." },
    { id: 'hotel', name: 'Suite Royale', cost: 15000, chance: 0.2, desc: "Confort 5 étoiles." },
    { id: 'prime', name: 'Prime de Signature', cost: 100000, chance: 0.6, desc: "Cash immédiat." }
];

const SPONSORS = [
    { id: 'redbull', name: 'Red Bull', bonus: 250000, impact: 'hype', threshold: 50000, failPenalty: 1000, desc: 'Objectif: 50k Fans. Récompense: 250k€.' },
    { id: 'pioneer', name: 'Pioneer DJ', bonus: 120000, impact: 'tech', threshold: 30000, failPenalty: 500, desc: 'Objectif: 30k Fans. Récompense: 120k€.' },
    { id: 'mercedes', name: 'Mercedes-Benz', bonus: 400000, impact: 'luxury', threshold: 80000, failPenalty: 2000, desc: 'Objectif: 80k Fans. Récompense: 400k€.' },
    { id: 'heineken', name: 'Heineken', bonus: 180000, impact: 'commercial', threshold: 40000, failPenalty: 800, desc: 'Objectif: 40k Fans. Récompense: 180k€.' },
];

const MERCH_OPTIONS = [
    { id: 'tshirt', name: 'T-Shirts Dropsiders', cost: 15000, revPerPerson: 5, icon: Palette },
    { id: 'beer', name: 'Bière Artisanale', cost: 25000, revPerPerson: 8, icon: Flame },
    { id: 'vip_area', name: 'Pack Zone VIP', cost: 50000, revPerPerson: 15, icon: Heart },
];

const CRISIS_EVENTS = [
    {
        id: 'late_dj',
        name: 'DJ en Retard !',
        desc: 'Ta tête d\'affiche est coincée à l\'aéroport. Que fais-tu ?',
        options: [
            { id: 'heli', name: 'Payer un Hélicoptère', cost: 50000, impact: 0, sat: 0, result: 'Le DJ arrive à temps ! (--- 50k€)' },
            { id: 'wait', name: 'Faire attendre le public', cost: 0, impact: -0.1, sat: -0.2, result: 'Le public est furieux, la hype baisse.' },
            { id: 'extend', name: 'Prolonger le set précédent', cost: 10000, impact: -0.05, sat: 0.1, result: 'Transition réussie, mais coût additionnel.' }
        ]
    },
    {
        id: 'rain_storm',
        name: 'Tempête Imminente',
        desc: 'Une tempête approche. Doit-on couvrir la scène ?',
        options: [
            { id: 'cover', name: 'Équipement de Protection', cost: 30000, impact: 0, sat: 0.1, result: 'Le matériel est protégé. (+ Sat)' },
            { id: 'risk', name: 'Prendre le risque', cost: 0, impact: -0.2, sat: -0.1, result: 'Dégâts matériels importants ! (--- Hype)' }
        ]
    }
];

const RANDOM_EVENTS = [
    { id: 'rain', name: 'Orage Violent', impact: -0.2, message: 'Un orage frappe le site ! -20% de ventes sur place.' },
    { id: 'viral', name: 'TikTok Viral', impact: 0.3, message: 'Ta line-up devient virale sur TikTok ! +30% de hype.' },
    { id: 'cancel', name: 'Grève des Transports', impact: -0.15, message: 'Grève des trains ! Certains fans ne peuvent pas venir. -15%.' },
    { id: 'soldout', name: 'Sold Out Flash', impact: 0.1, message: 'Les billets s\'arrachent en 2 minutes ! +10% de profit.' },
];

const STAGE_COST_PER_UNIT = 100000;

// --- HALL OF FAME MOCK DATA (Remover later if needed) ---
const DEFAULT_HALL_OF_FAME = [
    { id: '1', playerName: 'Alex', festivalName: 'Sideral Vision', profit: 1250000, location: 'Stadium' },
    { id: '2', playerName: 'Bebou', festivalName: 'Techno Temple', profit: 890000, location: 'Hangars' },
];

// --- FESTIVAL CREATOR GAME DATA ---
const DJ_POOL = [
    // --- GOD TIER / SUPERSTARS ---
    { id: 'calvin-harris', name: 'Calvin Harris', price: 1200000, genre: 'Dance Pop', popularity: 99, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Calvin_Harris_2012.jpg/800px-Calvin_Harris_2012.jpg' },
    { id: 'fred-again', name: 'Fred again..', price: 1100000, genre: 'Live Electronic', popularity: 99, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Fred_again.._-_Pritat_-_2022.jpg/800px-Fred_again.._-_Pritat_-_2022.jpg' },
    { id: 'shm', name: 'Swedish House Mafia', price: 1000000, genre: 'House', popularity: 99, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Swedish_House_Mafia_-_Ushuaia.jpg/800px-Swedish_House_Mafia_-_Ushuaia.jpg' },
    { id: 'skrillex', name: 'Skrillex', price: 950000, genre: 'Bass Music', popularity: 99, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Skrillex_cropped.jpg/800px-Skrillex_cropped.jpg' },
    { id: 'david-guetta', name: 'David Guetta', price: 900000, genre: 'Mainstage', popularity: 99, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/David_Guetta_Pau_2012.jpg/800px-David_Guetta_Pau_2012.jpg' },
    { id: 'tiesto', name: 'Tiësto', price: 850000, genre: 'Big Room', popularity: 99, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Tiesto_%26_Logo.jpg/800px-Tiesto_%26_Logo.jpg' },
    { id: 'martin-garrix', name: 'Martin Garrix', price: 800000, genre: 'Progressive House', popularity: 99, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Martin_Garrix_2013-11-20_001.jpg/800px-Martin_Garrix_2013-11-20_001.jpg' },
    { id: 'alesso', name: 'Alesso', price: 750000, genre: 'Progressive House', popularity: 98, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'dj-snake', name: 'DJ Snake', price: 850000, genre: 'Bass/Trap', popularity: 99, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'marshmello', name: 'Marshmello', price: 800000, genre: 'Mainstage', popularity: 98, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },

    // --- MAINSTAGE & MELODIC HEADLINERS ---
    { id: 'keinemusik', name: 'Keinemusik (&ME, Adam Port, Rampa)', price: 750000, genre: 'Afro House', popularity: 99, image: 'https://i1.sndcdn.com/avatars-000499628310-j8m2j2-t500x500.jpg' },
    { id: 'anyma', name: 'Anyma', price: 650000, genre: 'Melodic Techno', popularity: 99, image: 'https://i1.sndcdn.com/avatars-T3WXZtGkY0J8Z8V6-X6rQGQ-t500x500.jpg' },
    { id: 'fisher', name: 'Fisher', price: 600000, genre: 'Tech House', popularity: 99, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'tale-of-us', name: 'Tale of Us', price: 550000, genre: 'Melodic Techno', popularity: 98, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'charlotte-de-witte', name: 'Charlotte de Witte', price: 500000, genre: 'Techno', popularity: 99, image: 'https://i1.sndcdn.com/avatars-000570887142-v3v3v3-t500x500.jpg' },
    { id: 'armin-van-buuren', name: 'Armin van Buuren', price: 500000, genre: 'Trance', popularity: 98, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Armin_van_Buuren_Electronic_Family_2013-07-20_003.jpg/800px-Armin_van_Buuren_Electronic_Family_2013-07-20_003.jpg' },
    { id: 'solomun', name: 'Solomun', price: 500000, genre: 'Deep House', popularity: 98, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Solomun_@_Tomorrowland_2015.jpg/800px-Solomun_@_Tomorrowland_2015.jpg' },
    { id: 'timmy-trumpet', name: 'Timmy Trumpet', price: 450000, genre: 'Hardstage', popularity: 97, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'afrojack', name: 'Afrojack', price: 450000, genre: 'Big Room', popularity: 97, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'steve-aoki', name: 'Steve Aoki', price: 400000, genre: 'Mainstage', popularity: 97, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'nicky-romero', name: 'Nicky Romero', price: 350000, genre: 'Progressive House', popularity: 96, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },

    // --- HARDSTYLE / HARDCORE (EDC/Tomorrowland vibe) ---
    { id: 'sub-zero-project', name: 'Sub Zero Project', price: 180000, genre: 'Hardstyle', popularity: 95, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'da-tweekaz', name: 'Da Tweekaz', price: 160000, genre: 'Hardstyle', popularity: 94, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'angerfist', name: 'Angerfist', price: 150000, genre: 'Hardcore', popularity: 94, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'miss-k8', name: 'Miss K8', price: 120000, genre: 'Hardcore', popularity: 92, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'headhunterz', name: 'Headhunterz', price: 200000, genre: 'Hardstyle', popularity: 95, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'brennan-heart', name: 'Brennan Heart', price: 140000, genre: 'Hardstyle', popularity: 93, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'coone', name: 'Coone', price: 110000, genre: 'Hardstyle', popularity: 91, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },

    // --- BASS / DUBSTEP (EDC style) ---
    { id: 'excision', name: 'Excision', price: 350000, genre: 'Bass Music', popularity: 97, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'subtronics', name: 'Subtronics', price: 300000, genre: 'Bass Music', popularity: 96, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'illenium', name: 'Illenium', price: 400000, genre: 'Melodic Bass', popularity: 98, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'rezz', name: 'Rezz', price: 280000, genre: 'Electronic', popularity: 95, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'zeds-dead', name: 'Zeds Dead', price: 260000, genre: 'Bass Music', popularity: 95, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },

    // --- TECHNO / AWAKENINGS TIER ---
    { id: 'amelie-lens', name: 'Amelie Lens', price: 450000, genre: 'Techno', popularity: 98, image: 'https://i1.sndcdn.com/avatars-000499628310-j8m2j2-t500x500.jpg' },
    { id: 'carl-cox', name: 'Carl Cox', price: 550000, genre: 'Techno', popularity: 99, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Carl_Cox_2011.jpg/800px-Carl_Cox_2011.jpg' },
    { id: 'adam-beyer', name: 'Adam Beyer', price: 260000, genre: 'Techno', popularity: 97, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Adam_Beyer.jpg/800px-Adam_Beyer.jpg' },
    { id: 'enrico-sangiuliano', name: 'Enrico Sangiuliano', price: 180000, genre: 'Techno', popularity: 94, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: '999999999', name: '999999999', price: 220000, genre: 'Hard Techno', popularity: 96, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'kobosil', name: 'Kobosil', price: 190000, genre: 'Techno', popularity: 95, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'paula-temple', name: 'Paula Temple', price: 140000, genre: 'Techno', popularity: 92, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'indira-paganotto', name: 'Indira Paganotto', price: 180000, genre: 'Psy-Techno', popularity: 94, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'sara-landry', name: 'Sara Landry', price: 200000, genre: 'Hard Techno', popularity: 95, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'klangkuenstler', name: 'Klangkuenstler', price: 180000, genre: 'Hard Techno', popularity: 94, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },

    // --- HOUSE / TECH HOUSE / ART HOUSE ---
    { id: 'chris-lake', name: 'Chris Lake', price: 350000, genre: 'Tech House', popularity: 98, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'john-summit', name: 'John Summit', price: 350000, genre: 'Tech House', popularity: 98, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'dom-dolla', name: 'Dom Dolla', price: 340000, genre: 'Tech House', popularity: 97, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'the-martinez-brothers', name: 'The Martinez Brothers', price: 300000, genre: 'Tech House', popularity: 97, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'vintage-culture', name: 'Vintage Culture', price: 320000, genre: 'House', popularity: 97, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'artbat', name: 'Artbat', price: 300000, genre: 'Melodic Techno', popularity: 97, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'camelphat', name: 'Camelphat', price: 320000, genre: 'Melodic House', popularity: 97, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'meduza', name: 'Meduza', price: 280000, genre: 'House', popularity: 97, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'eli-brown', name: 'Eli Brown', price: 240000, genre: 'Techno-House', popularity: 96, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'mau-p', name: 'Mau P', price: 220000, genre: 'Tech House', popularity: 97, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'gorgon-city', name: 'Gorgon City', price: 200000, genre: 'House', popularity: 95, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },

    // --- TRENDING / CONTROVERSIAL ---
    { id: 'fantasm', name: 'Fantasm', price: 2200, genre: 'Hard Techno', popularity: 40, label: 'Controverse', image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'marlon-hoffstadt', name: 'Marlon Hoffstadt', price: 350000, genre: 'Eurodance', popularity: 96, label: 'Daddy Trance', image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'oguz', name: 'Oguz', price: 180000, genre: 'Hard Techno', popularity: 94, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },

    // --- SUPPORT / RISING STARS (2k - 100k€) ---
    { id: 'francis-mercier', name: 'Francis Mercier', price: 95000, genre: 'Afro House', popularity: 95, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'cassian', name: 'Cassian', price: 45000, genre: 'Melodic Techno', popularity: 94, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'prospa', name: 'Prospa', price: 35000, genre: 'Electronic', popularity: 89, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'ben-hemsley', name: 'Ben Hemsley', price: 40000, genre: 'Trance-House', popularity: 90, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'sammy-virji', name: 'Sammy Virji', price: 30000, genre: 'UKG', popularity: 91, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'notre-dame', name: 'Notre Dame', price: 18000, genre: 'Melodic House', popularity: 92, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'maz', name: 'Maz', price: 15000, genre: 'Afro House', popularity: 93, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'mont-rouge', name: 'Mont Rouge', price: 12000, genre: 'Afro House', popularity: 91, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'mita-gami', name: 'Mita Gami', price: 10000, genre: 'Indie Dance', popularity: 87, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'adam-ten', name: 'Adam Ten', price: 10000, genre: 'Indie Dance', popularity: 86, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'samm', name: 'Samm', price: 8500, genre: 'Afro House', popularity: 89, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'ajna', name: 'Ajna', price: 8500, genre: 'Afro House', popularity: 89, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'mesto', name: 'Mesto', price: 15000, genre: 'Future House', popularity: 88, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'azzecca', name: 'Azzecca', price: 6000, genre: 'House', popularity: 85, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'sam-wolfe', name: 'Sam WOLFE', price: 5500, genre: 'Techno', popularity: 84, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'zorza', name: 'Zorza', price: 4500, genre: 'Techno', popularity: 82, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'robin-tordjman', name: 'Robin Tordjman', price: 2500, genre: 'Afro House', popularity: 90, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },

    // --- LEGENDS ---
    { id: 'richie-hawtin', name: 'Richie Hawtin', price: 320000, genre: 'Legend', popularity: 98, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Richie_Hawtin_2011.jpg/800px-Richie_Hawtin_2011.jpg' },
    { id: 'jeff-mills', name: 'Jeff Mills', price: 320000, genre: 'Legend', popularity: 98, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Jeff_Mills_2004.jpg/800px-Jeff_Mills_2004.jpg' },
    { id: 'carl-cox-legend', name: 'Carl Cox (Classic Set)', price: 400000, genre: 'Legend', popularity: 99, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Carl_Cox_2011.jpg/800px-Carl_Cox_2011.jpg' },
];

const FIX_COSTS = [
    { id: 'security', name: 'Sécurité & Secours', basePrice: 45000, icon: Shield },
    { id: 'sceno', name: 'Scénographie & VJs', basePrice: 65000, icon: Palette },
    { id: 'marketing', name: 'Marketing & Pub', basePrice: 25000, icon: Megaphone },
    { id: 'food', name: 'Food Court & Bars', basePrice: 35000, icon: Users },
    { id: 'screens', name: 'Écrans Géants', basePrice: 50000, icon: Camera },
    { id: 'camping', name: 'Camping VIP', basePrice: 80000, icon: Heart },
    { id: 'fireworks', name: 'Feux d\'Artifice', basePrice: 120000, icon: Sparkles },
    { id: 'co2', name: 'CO2 & SFX Pyrotechnie', basePrice: 40000, icon: Flame },
];

export function Community() {
    const { isLoggedIn, user, updateScore } = useUser();
    const navigate = useNavigate();

    // --- TAB TYPE UPDATE ---
    type TabType = 'WALL' | 'UPLOADS' | 'CONCOURS' | 'GAME' | 'AVIS' | 'COVOIT' | 'PLAYLISTS' | 'TRACK_ID' | 'CALENDAR' | 'LAB';
    const [activeTab, setActiveTab] = useState<TabType>('WALL');
    const location = useLocation();

    // Handle initial tab from URL
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        if (tab && ['WALL', 'UPLOADS', 'CONCOURS', 'GAME', 'AVIS', 'COVOIT', 'PLAYLISTS', 'TRACK_ID', 'CALENDAR', 'LAB'].includes(tab)) {
            setActiveTab(tab as TabType);
        }
    }, [location.search]);
    
    // Sub-tabs for Contest
    const [contestTab, setContestTab] = useState<'QUIZ' | 'INSTAGRAM'>('QUIZ');
    const [isContestActive, setIsContestActive] = useState(false);

    // Photo Upload Form States
    const [uploadFestival, setUploadFestival] = useState('');
    const [uploadMessage, setUploadMessage] = useState('');
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [isAutoCorrected, setIsAutoCorrected] = useState(false);

    // Fetch Settings
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/settings');
                if (res.ok) {
                    const data = await res.json();
                    if (data.is_contest_active !== undefined) {
                        setIsContestActive(data.is_contest_active);
                        // If we were on CONCOURS but it's now inactive, switch back to WALL
                        if (!data.is_contest_active && activeTab === 'CONCOURS') {
                            setActiveTab('WALL');
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to fetch settings', error);
            }
        };
        fetchSettings();
    }, [activeTab]);

    const [galerieData, setGalerieData] = useState<any[]>([]);
    const [agendaData, setAgendaData] = useState<any[]>([]);

    useEffect(() => {
        const fetchCommunityData = async () => {
            try {
                const [galerieRes, agendaRes] = await Promise.all([
                    fetch('/api/galerie'),
                    fetch('/api/agenda')
                ]);
                if (galerieRes.ok) setGalerieData(await galerieRes.json());
                if (agendaRes.ok) setAgendaData(await agendaRes.json());
            } catch (error) {
                console.error('Failed to fetch community data', error);
            } finally {
            }
        };
        fetchCommunityData();
    }, []);

    const festivals = useMemo(() => {
        const unique = new Set(agendaData.map(a => a.title));
        return Array.from(unique).sort();
    }, [agendaData]);



    const handleAutoCorrect = (val: string) => {
        const trimmed = val.trim();
        if (!trimmed) return "";
        
        // Exact match (case insensitive)
        const exactMatch = festivals.find(f => f.toLowerCase() === trimmed.toLowerCase());
        if (exactMatch) {
            setIsAutoCorrected(true);
            return exactMatch;
        }

        // Fuzzy match (starts with)
        const partialMatch = festivals.find(f => f.toLowerCase().startsWith(trimmed.toLowerCase()));
        if (partialMatch) {
            setIsAutoCorrected(true);
            return partialMatch;
        }

        setIsAutoCorrected(false);
        return trimmed.toUpperCase();
    };

    // Game State
    const [gameStarted, setGameStarted] = useState(false);
    const [gameState, setGameState] = useState<'ONBOARDING' | 'LOCATION' | 'DATE' | 'LOGISTICS' | 'STAGES' | 'BOOKING' | 'GENERATION' | 'RESULTS'>('ONBOARDING');
    const [budget, setBudget] = useState(0);
    const [selectedDjs, setSelectedDjs] = useState<typeof DJ_POOL>([]);
    const [selectedCosts, setSelectedCosts] = useState<string[]>([]);
    const [bookingStatus, setBookingStatus] = useState<{ djId: string, status: 'PENDING' | 'ACCEPTED' | 'REJECTED', message: string } | null>(null);
    const [ticketingProgress, setTicketingProgress] = useState(0);
    const [weather, setWeather] = useState<'CLEAR' | 'RAIN' | 'HEAT'>('CLEAR');

    // --- EFFECT: DYNAMIC THEME ---
    useEffect(() => {
        const checkTheme = () => {
            const hour = new Date().getHours();
            const body = document.body;
            body.classList.remove('theme-deep-night', 'theme-sunrise', 'theme-sunset');

            if (hour >= 2 && hour < 6) body.classList.add('theme-deep-night');
            else if (hour >= 6 && hour < 10) body.classList.add('theme-sunrise');
            else if (hour >= 18 && hour < 22) body.classList.add('theme-sunset');
        };

        checkTheme();
        const interval = setInterval(checkTheme, 60000); // Check every minute
        return () => clearInterval(interval);
    }, []);

    // RPG State
    const [promoterXP, setPromoterXP] = useState(() => Number(localStorage.getItem('dropsiders_xp')) || 0);
    const [drops, setDrops] = useState(() => Number(localStorage.getItem('dropsiders_drops')) || 0);
    const [selectedEffects, setSelectedEffects] = useState<string[]>([]);
    const [negotiatingDj, setNegotiatingDj] = useState<typeof DJ_POOL[0] | null>(null);
    const [aftermovieSummary, setAftermovieSummary] = useState('');

    // Player Info
    const [playerName, setPlayerName] = useState('');
    const [playerEmail, setPlayerEmail] = useState(user?.email || '');

    useEffect(() => {
        if (isLoggedIn && user) {
            setPlayerEmail(user.email);
        }
    }, [isLoggedIn, user]);
    const [festivalName, setFestivalName] = useState('');
    const [selectedLocation, setSelectedLocation] = useState(FESTIVAL_LOCATIONS[0]);
    const [stageCount, setStageCount] = useState(1);
    const [festivalDuration, setFestivalDuration] = useState(1); // 1, 2, or 3 Days
    const [priceSurge, setPriceSurge] = useState(1);
    const [ticketPrice, setTicketPrice] = useState(150);
    const [selectedSponsors, setSelectedSponsors] = useState<string[]>([]);
    const [selectedMerch, setSelectedMerch] = useState<string[]>([]);
    const [activeCrisis, setActiveCrisis] = useState<typeof CRISIS_EVENTS[0] | null>(null);
    const [archives, setArchives] = useState<any[]>(() => {
        const saved = localStorage.getItem('dropsiders_archives');
        return saved ? JSON.parse(saved) : [];
    });
    const [hallOfFame, setHallOfFame] = useState<any[]>(() => {
        const saved = localStorage.getItem('dropsiders_hall_of_fame');
        return saved ? JSON.parse(saved) : DEFAULT_HALL_OF_FAME;
    });
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [randomEvent, setRandomEvent] = useState<typeof RANDOM_EVENTS[0] | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGenreFilter, setSelectedGenreFilter] = useState('ALL');
    const [priceSort, setPriceSort] = useState<'ASC' | 'DESC' | 'NONE'>('NONE');
    const [advisorTip, setAdvisorTip] = useState<{ name: string, tip: string, avatar: string } | null>(null);
    const [posterStyle, setPosterStyle] = useState<'ULTRA' | 'TOMORROWLAND' | 'EDC'>('ULTRA');

    const currentRank = useMemo(() => {
        return [...PROM_RANKS].reverse().find(r => promoterXP >= r.minXp) || PROM_RANKS[0];
    }, [promoterXP]);

    // Stats
    const sponsorsBonus = useMemo(() => {
        return SPONSORS.filter(s => selectedSponsors.includes(s.id)).reduce((acc, s) => acc + s.bonus, 0);
    }, [selectedSponsors]);

    const totalDjsCost = useMemo(() => {
        // Riders cost: +15% for top DJs
        return selectedDjs.reduce((acc, dj) => {
            // Seasonality: +20% in Summer (June, July, August)
            const month = selectedDate ? new Date(selectedDate).getMonth() : 5;
            const seasonFactor = (month >= 5 && month <= 7) ? 1.2 : 1;
            return acc + (dj.price * (dj.popularity > 95 ? 1.15 : 1) * seasonFactor * priceSurge);
        }, 0);
    }, [selectedDjs, selectedDate, priceSurge]);
    const totalExtraCost = useMemo(() => {
        const fix = FIX_COSTS
            .filter(c => selectedCosts.includes(c.id))
            .reduce((acc, c) => acc + (c.basePrice * (1 + (festivalDuration - 1) * 0.7)), 0);
        const effects = STAGE_EFFECTS
            .filter(e => selectedEffects.includes(e.id))
            .reduce((acc, e) => acc + e.cost, 0);
        const merch = MERCH_OPTIONS
            .filter(m => selectedMerch.includes(m.id))
            .reduce((acc, m) => acc + m.cost, 0);
        return fix + effects + merch;
    }, [selectedCosts, selectedEffects, selectedMerch, festivalDuration]);
    const locationCost = selectedLocation.cost * (1 + (festivalDuration - 1) * 0.4);
    const stagesCost = (stageCount * STAGE_COST_PER_UNIT) * (1 + (festivalDuration - 1) * 0.2);
    const totalSpent = (totalDjsCost + totalExtraCost + locationCost + stagesCost);
    const totalBudgetWithSponsors = budget + sponsorsBonus;
    const remainingBudget = totalBudgetWithSponsors - totalSpent;

    // Simulation logic
    const { attendance, profit } = useMemo(() => {
        const prestigeBase = (selectedLocation as any).prestige || 5;
        const lineupPower = selectedDjs.reduce((acc, dj) => acc + (dj.popularity / 10), 0);

        // Genre Synergy: +5% hype for each DJ of the same genre if more than 2
        const genreCounts: { [key: string]: number } = {};
        const labelCounts: { [key: string]: number } = {};
        selectedDjs.forEach(d => {
            genreCounts[d.genre] = (genreCounts[d.genre] || 0) + 1;
            if ((d as any).label) labelCounts[(d as any).label] = (labelCounts[(d as any).label] || 0) + 1;
        });

        const genreSynergy = Object.values(genreCounts).reduce((acc, count) => acc + (count > 2 ? count * 0.05 : 0), 0);
        const labelSynergy = Object.values(labelCounts).reduce((acc, count) => acc + (count >= 3 ? 0.15 : 0), 0);

        // Saturation & Consistency Mechanics
        const totalSelected = selectedDjs.length;
        let saturationPenalty = 0;
        let isMonogenre = false;

        if (totalSelected > 0) {
            Object.values(genreCounts).forEach(count => {
                if (count > 5) saturationPenalty += (count - 5) * 0.08; // -8% per artist over 5 of same genre
            });
            isMonogenre = Object.keys(genreCounts).length === 1 && totalSelected >= 5;
        }

        // Stage Constraint Penalty: X artists per stage per day mandatory
        const requiredArtists = stageCount * 5 * festivalDuration;
        const artistShortfall = Math.max(0, requiredArtists - totalSelected);
        const stagePenalty = artistShortfall > 0 ? (1 - (artistShortfall * 0.1)) : 1; // -10% per missing slot

        // Hype formula: Lineup + Prestige + Marketing + Synergies + Effects
        let currentHype = (lineupPower * 2) + (prestigeBase * 5);
        currentHype *= (1 + genreSynergy + labelSynergy);
        currentHype *= stagePenalty;

        if (isMonogenre) currentHype *= 1.45; // Consistency Bonus: "Underground Credibility"
        currentHype *= (1 - saturationPenalty); // Saturation Penalty

        // Incoherence penalty: Mix of Hard Techno and Tropical House?
        const hasHardTechno = selectedDjs.some(d => d.genre === 'Hard Techno');
        const hasTropical = selectedDjs.some(d => d.genre === 'Tropical House');
        if (hasHardTechno && hasTropical) currentHype *= 0.8;

        // Effects Boost
        const effectsHype = STAGE_EFFECTS
            .filter(e => selectedEffects.includes(e.id))
            .reduce((acc, e) => acc + e.hype, 0);
        currentHype *= (1 + effectsHype);

        // AI Date Check Impact (Seasonality)
        const month = selectedDate ? new Date(selectedDate).getMonth() : 5;
        const isPeakSeason = month >= 5 && month <= 7; // June, July, August
        if (isPeakSeason) currentHype *= 1.25; // Summer boost!

        if (selectedCosts.includes('marketing')) currentHype *= 1.3;

        // Sponsoring Impact
        selectedSponsors.forEach(sId => {
            const s = SPONSORS.find(sp => sp.id === sId);
            if (s?.impact === 'hype') currentHype *= 1.15;
        });

        if (randomEvent?.id === 'viral') currentHype *= 1.3;

        // Pricing sensitivity
        const optimalPrice = 50 + (prestigeBase * 15) + (lineupPower * 5);
        const pricePenalty = Math.max(0, (ticketPrice - optimalPrice) / 100);

        let finalAttendance = Math.floor(selectedLocation.capacity * (currentHype / 150) * (1 - pricePenalty));
        finalAttendance = Math.min(finalAttendance, selectedLocation.capacity);

        if (randomEvent?.id === 'rain') finalAttendance *= 0.8;
        if (randomEvent?.id === 'cancel') finalAttendance *= 0.85;

        // Merch Revenue
        const merchRevPerPerson = MERCH_OPTIONS
            .filter(m => selectedMerch.includes(m.id))
            .reduce((acc, m) => acc + m.revPerPerson, 0);

        const currentRevenue = finalAttendance * (ticketPrice + merchRevPerPerson);
        const currentProfit = currentRevenue - totalSpent;

        return {
            attendance: finalAttendance,
            profit: currentProfit
        };
    }, [selectedLocation, selectedDjs, selectedCosts, selectedSponsors, selectedMerch, ticketPrice, totalSpent, randomEvent, selectedDate, stageCount]);

    // Start game logic

    const startNewGame = () => {
        const randomBudget = Math.floor(Math.random() * (10000000 - 1000000 + 1)) + 1000000;
        setBudget(randomBudget);
        setSelectedDjs([]);
        setSelectedCosts([]);
        setSelectedSponsors([]);
        setSelectedEffects([]);
        setTicketPrice(150);

        // Random event chance
        if (Math.random() > 0.5) {
            setRandomEvent(RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)]);
        } else {
            setRandomEvent(null);
        }

        // Talent Scout initial tip
        const tips = [
            { name: "John, Scout Senior", avatar: "👨‍💼", tip: "L'Afro House est en feu ! Si tu peux choper Keinemusik ou Black Coffee, ton festival va exploser sur Insta." },
            { name: "Sarah, Liaison Booking", avatar: "👩‍🎤", tip: "Les USA ne jurent que par John Summit et Mau P. Booke-les pour attirer le public international." },
            { name: "Marc, Strategist Lab", avatar: "👨‍🔬", tip: "La techno mélodique type Afterlife est ultra tendance. Anyma et Tale of Us garantissent un sold-out." },
            { name: "Lucie, Trend Hunter", avatar: "👩‍💻", tip: "Indira Paganotto et Charlotte de Witte dominent la scène techno. Un lineup 100% Techno Berlin, c'est le move du moment." },
            { name: "Viktor, Underground King", avatar: "🥷", tip: "Le public réclame du brut. Le retour du Hard Groove et de la Techno 90s est massif. Pense à Marlon Hoffstadt." }
        ];
        setAdvisorTip(tips[Math.floor(Math.random() * tips.length)]);

        // Weather randomization
        const weatherOptions: ('CLEAR' | 'RAIN' | 'HEAT')[] = ['CLEAR', 'CLEAR', 'RAIN', 'HEAT'];
        setWeather(weatherOptions[Math.floor(Math.random() * weatherOptions.length)]);

        setGameState('ONBOARDING');
        setGameStarted(true);
        setTicketingProgress(0);
    };

    // Auto-update advisor tips based on festival status

    // Auto-update advisor tips based on festival status
    useEffect(() => {
        if (gameState !== 'BOOKING') return;

        let newTip = null;

        if (selectedDjs.length < 5) {
            newTip = { name: "John, Scout", avatar: "👨‍💼", tip: "Ton Lineup est un peu vide. Un festival sans au moins 5 DJs, c'est juste une kermesse ! Bouscule tes agents." };
        } else if (!selectedCosts.includes('food')) {
            newTip = { name: "Sarah, Liaison", avatar: "👩‍🎤", tip: "T'as oublié de prendre des Food Trucks ! Tes fans vont mourir de faim au bout de 2h, c'est la faillite assurée." };
        } else if (!selectedCosts.includes('security')) {
            newTip = { name: "Marc, Strategist", avatar: "👨‍🔬", tip: "Pas de sécurité ? C'est le chaos garanti. Les mairies vont fermer ton event direct si tu n'as pas de secours." };
        } else if (!selectedCosts.includes('sceno')) {
            newTip = { name: "Lucie, Hunter", avatar: "👩‍💻", tip: "La scène est toute nue ! Sans VJs et Scéno, les gens ne reviendront pas l'année prochaine." };
        } else if (!selectedDate) {
            newTip = { name: "Viktor, Underground", avatar: "🥷", tip: "T'as tout... sauf une date ! Choisis quand l'event a lieu sinon l'affiche sera vide." };
        }

        if (newTip && (!advisorTip || newTip.tip !== advisorTip.tip)) {
            setAdvisorTip(newTip);
        }
    }, [selectedDjs, selectedCosts, selectedDate, gameState, advisorTip]);

    const [isPriceRising, setIsPriceRising] = useState(false);
    useEffect(() => {
        let timer: any;
        if (gameState === 'BOOKING' && gameStarted) {
            timer = setInterval(() => {
                setPriceSurge(prev => {
                    const next = prev + 0.03;
                    if (next > 1.05) setIsPriceRising(true);
                    return next;
                });
            }, 45000); // Surge every 45s
        } else {
            setPriceSurge(1);
            setIsPriceRising(false);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [gameState, gameStarted]);

    const toggleDj = async (dj: typeof DJ_POOL[0]) => {
        if (selectedDjs.find(d => d.id === dj.id || d.name === dj.name)) {
            setSelectedDjs(prev => prev.filter(d => d.id !== dj.id && d.name !== dj.name));
            setBookingStatus(null);
            return;
        }

        if (totalSpent + dj.price > budget) return;

        const agents = [
            { name: "Mr. Gold", style: "SHARK", tone: "Écoute-moi bien, mon client est une légende." },
            { name: "Alice", style: "PROFESSIONAL", tone: "Nous avons reçu votre proposition pour le créneau." },
            { name: "Zack", style: "VIBE", tone: "Yo ! Le projet a l'air cool, voyons si ça matche." }
        ];
        const activeAgent = agents[Math.floor(Math.random() * agents.length)];

        setBookingStatus({
            djId: dj.id,
            status: 'PENDING',
            message: `${activeAgent.name}: "${activeAgent.tone} Je consulte l'agenda..."`
        });

        // AI Thinking delay
        await new Promise(resolve => setTimeout(resolve, 1800));

        const prestigeScore = (selectedLocation as any).prestige || 5;
        const lineupScore = Math.min(selectedDjs.length, 5);
        let successChance = (prestigeScore + lineupScore + (dj.popularity / 10)) / 25;

        // Agent behavior modifiers
        if (activeAgent.style === 'SHARK' && dj.price > 800000) successChance *= 0.8;
        if (activeAgent.style === 'VIBE' && (dj.genre === 'Techno' || dj.genre === 'House')) successChance *= 1.2;

        if (Math.random() < successChance || dj.price < 100000) {
            setSelectedDjs(prev => [...prev, dj]);
            setBookingStatus({
                djId: dj.id,
                status: 'ACCEPTED',
                message: `${activeAgent.name}: "C'est validé. On envoie le contrat. On se voit sur scène !"`
            });
        } else {
            setNegotiatingDj(dj);
            setBookingStatus({
                djId: dj.id,
                status: 'REJECTED',
                message: `${activeAgent.name}: "Hum... l'artiste hésite. Si tu rajoutes des garanties, ça peut passer."`
            });
        }

        setTimeout(() => {
            if (!negotiatingDj) setBookingStatus(null);
        }, 5000);
    };

    const handleNegotiate = (perk: typeof NEGOTIATION_PERKS[0]) => {
        if (!negotiatingDj) return;
        const finalPrice = negotiatingDj.price + perk.cost;
        if (totalSpent + perk.cost > budget) return;

        setBookingStatus({
            djId: negotiatingDj.id,
            status: 'PENDING',
            message: `Négociation: Option "${perk.name}" activée...`
        });

        setTimeout(() => {
            if (Math.random() < perk.chance || perk.id === 'prime') {
                setSelectedDjs(prev => [...prev, { ...negotiatingDj, price: finalPrice }]);
                setBookingStatus({
                    djId: negotiatingDj.id,
                    status: 'ACCEPTED',
                    message: `L'artiste a accepté la prime ! Booking confirmé.`
                });
            } else {
                setBookingStatus({
                    djId: negotiatingDj.id,
                    status: 'REJECTED',
                    message: `Même avec le bonus, l'artiste refuse. Dommage.`
                });
            }
            setNegotiatingDj(null);
            setTimeout(() => setBookingStatus(null), 3000);
        }, 1500);
    };

    const handleCrisisChoice = (option: any) => {
        if (!activeCrisis) return;
        // Apply costs and impacts (simplified logic)
        setBudget(prev => prev - option.cost);
        // We could add more state for satisfaction if needed, but for now we impact the final XP/Hype
        setActiveCrisis(null);

        // Feed back to the user
        setBookingStatus({
            djId: 'crisis',
            status: 'ACCEPTED',
            message: `CRISE RÉSOLUE: ${option.result}`
        });
        setTimeout(() => setBookingStatus(null), 3000);
    };

    const generatePoster = async () => {
        if (selectedCosts.length < 3 || selectedDjs.length < 5 || !selectedDate) return;

        const styles: ('ULTRA' | 'TOMORROWLAND' | 'EDC')[] = ['ULTRA', 'TOMORROWLAND', 'EDC'];
        setPosterStyle(styles[Math.floor(Math.random() * styles.length)]);

        // Generate Aftermovie Summary
        const bestDj = selectedDjs[0]?.name;
        const weatherText = weather === 'RAIN' ? "sous une pluie diluvienne" : weather === 'HEAT' ? "sous une chaleur écrasante" : "sous un ciel étoilé";
        const effectText = selectedEffects.includes('pyro') ? "les feux d'artifice ont illuminé le ciel" : "l'ambiance était électrique";
        const merchText = selectedMerch.length > 0 ? `Le merchandising (${selectedMerch.join(', ')}) a été dévalisé.` : "";

        setAftermovieSummary(`Le triomphe de ${bestDj} ${weatherText} restera dans les annales. ${effectText} et la foule de ${attendance.toLocaleString()} personnes a vibré comme jamais. ${merchText} Un succès qui marque l'entrée de ${playerName} dans l'histoire.`);

        // Ticketing Phase
        setGameState('GENERATION');

        for (let i = 0; i <= 100; i += 2) {
            setTicketingProgress(i);
            // Trigger Crisis at 40%
            if (i === 40 && Math.random() < 0.3) {
                setActiveCrisis(CRISIS_EVENTS[Math.floor(Math.random() * CRISIS_EVENTS.length)]);
                // Pause ticketing until resolved? (simplified: just show it)
            }
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#ff0033', '#00ffff', '#ffffff']
        });

        // Sponsor Validation
        let sponsorPenalty = 0;
        selectedSponsors.forEach(sId => {
            const s = SPONSORS.find(sp => sp.id === sId);
            if (s && attendance < s.threshold) {
                sponsorPenalty += (s.failPenalty || 0);
            }
        });

        // Calculate XP and Progress
        const gainXpFinal = Math.max(0, Math.floor(profit / 5000) + Math.floor(attendance / 100) - sponsorPenalty);
        const newTotalXp = promoterXP + gainXpFinal;
        setPromoterXP(newTotalXp);
        localStorage.setItem('dropsiders_xp', newTotalXp.toString());

        // Save to Archives
        const newFestival = {
            id: Date.now(),
            name: festivalName,
            location: selectedLocation.name,
            djs: selectedDjs.map(d => d.name),
            attendance,
            profit,
            rank: currentRank.name,
            date: selectedDate,
            xpGained: gainXpFinal
        };
        const updatedArchives = [newFestival, ...archives].slice(0, 10);
        setArchives(updatedArchives);
        localStorage.setItem('dropsiders_archives', JSON.stringify(updatedArchives));

        // Add to Hall of Fame (Real Players Only)
        if (profit > 100000) {
            const entry = {
                id: Date.now(),
                playerName: playerName || 'Anonyme',
                festivalName,
                profit,
                location: selectedLocation.name
            };
            const newHallOfFame = [entry, ...hallOfFame]
                .sort((a, b) => b.profit - a.profit)
                .slice(0, 10);
            setHallOfFame(newHallOfFame);
            localStorage.setItem('dropsiders_hall_of_fame', JSON.stringify(newHallOfFame));
        }

        setGameState('RESULTS');
    };

    const resetGame = () => {
        setGameStarted(false);
        setGameState('ONBOARDING');
        setBudget(0);
        setSelectedDjs([]);
        setSelectedCosts([]);
        setSelectedEffects([]);
        setSelectedMerch([]);
        setActiveCrisis(null);
        setNegotiatingDj(null);
        setBookingStatus(null);
        setAftermovieSummary('');
        setTicketingProgress(0);
        setPlayerName('');
        setPlayerEmail('');
        setFestivalName('');
    };

    const isNightMode = useMemo(() => {
        return selectedEffects.includes('holo') || selectedEffects.includes('drones');
    }, [selectedEffects]);

    return (
        <>
            <SEO
                title="Communauté & Lab"
                description="Rejoignez la communauté Dropsiders. Jouez au Festival Producer, consultez le Wiki, partagez vos playlists et profitez de l'entraide entre festivaliers."
            />
            <div className={twMerge(
                "min-h-screen transition-colors duration-1000 pb-32 pt-24",
                "bg-dark-bg",
                "text-white"
            )}>
                {/* Background Ambient Glows */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                    <div className={twMerge(
                        "absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] animate-pulse transition-all duration-1000",
                        isNightMode ? "bg-neon-red/10 scale-110" : "bg-neon-red/5"
                    )} />
                    <div className={twMerge(
                        "absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] animate-pulse [animation-delay:2s] transition-all duration-1000",
                        isNightMode ? "bg-neon-cyan/10 scale-110" : "bg-neon-cyan/5"
                    )} />

                    {isNightMode && (
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,255,0.02)_0%,transparent_70%)] animate-pulse" />
                    )}

                    {/* Weather Effects */}
                    {weather === 'RAIN' && (
                        <div className="absolute inset-0 opacity-40">
                            {[...Array(20)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ top: -20, left: `${Math.random() * 100}%` }}
                                    animate={{ top: '120%' }}
                                    transition={{ duration: 1 + Math.random(), repeat: Infinity, ease: "linear" }}
                                    className="absolute w-[1px] h-8 bg-blue-400"
                                />
                            ))}
                        </div>
                    )}
                    {weather === 'HEAT' && (
                        <div className="absolute inset-0 bg-orange-500/5 animate-pulse mix-blend-overlay blur-3xl" />
                    )}
                </div>

                <div className="relative z-10 container mx-auto px-4 md:px-12 overflow-x-hidden">
                    {/* ── Standard Page Header ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-12 text-center sm:text-left flex flex-col sm:flex-row sm:items-end justify-between gap-8"
                    >
                        <div>
                            <div className="flex items-center justify-center sm:justify-start gap-3 mb-4">
                            </div>
                            <h1 className="text-4xl md:text-6xl font-display font-black text-white mb-6 uppercase italic tracking-tighter leading-none">
                                LA <span className="text-neon-red drop-shadow-[0_0_20px_rgba(255,0,51,0.5)]">COMMUNAUTÉ</span>
                            </h1>
                            <p className="text-gray-400 max-w-2xl text-base md:text-lg font-medium leading-relaxed mx-auto sm:mx-0">
                                Connectez-vous avec la scène, partagez vos récaps, et créez vos propres expériences. Le futur des festivals s'écrit ici.
                            </p>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.05, y: -5 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/communaute/partager')}
                            className="group relative px-8 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(255,255,255,0.05)] hover:bg-neon-red hover:text-white transition-all duration-500 overflow-hidden mx-auto sm:mx-0"
                        >
                            <span className="relative z-10 flex items-center gap-4">
                                Partager Album
                                <div className="p-2 bg-black text-white group-hover:bg-white group-hover:text-neon-red rounded-lg transition-colors">
                                    <Camera className="w-4 h-4" />
                                </div>
                            </span>
                        </motion.button>
                    </motion.div>

                    {/* Enhanced Tabs */}
                    <div className="mb-16 w-full overflow-x-auto no-scrollbar">
                        <div className="inline-flex items-center gap-1 p-1.5 bg-white/5 backdrop-blur-3xl rounded-3xl border border-white/10">
                            {([
                                { id: 'WALL',          icon: Star,         label: 'Souvenirs',         multiline: false },
                                { id: 'UPLOADS',       icon: Camera,       label: 'Vos Photos',        multiline: false },
                                { id: 'AVIS',          icon: MessageSquare,label: 'Avis & Votes',      multiline: false },
                                { id: 'CONCOURS',      icon: Trophy,       label: 'Jeux Concours',     multiline: false, hidden: !isContestActive },
                                { id: 'GAME',          icon: Sparkles,     label: 'PRODUCER',          multiline: false, iconClass: 'text-amber-400' },

                                { id: 'TRACK_ID',      icon: Music,        label: 'TrackID',           multiline: false },
                                { id: 'PLAYLISTS',     icon: Share2,       label: 'Mixs',              multiline: false },
                                { id: 'LAB',           icon: Wand2,        label: 'Communaut\u00e9',       multiline: false },
                            ] as any[]).filter(tab => !tab.hidden).map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-[0.12em] transition-all relative group ${activeTab === tab.id ? 'text-black' : 'text-white/40 hover:text-white'}`}
                                >
                                    {activeTab === tab.id && (
                                        <motion.div
                                            layoutId="community-tab-bg-v2"
                                            className="absolute inset-0 bg-white shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                                            style={{ borderRadius: '16px' }}
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <tab.icon className={`w-3.5 h-3.5 relative z-10 flex-shrink-0 transition-colors ${activeTab === tab.id ? 'text-[#FF0000]' : tab.iconClass || 'group-hover:text-[#FF0000]'}`} />
                                    {tab.multiline ? (
                                        <span className="relative z-10 text-center leading-tight">
                                            Guide<br />Pratique
                                        </span>
                                    ) : (
                                        <span className="relative z-10 tracking-widest">{tab.label}</span>
                                    )}
                                </button>
                            ))}
                            <div className="w-2 shrink-0 md:hidden" />
                        </div>
                    </div>

                    {/* Content Area */}
                    <AnimatePresence mode="wait">
                        {activeTab === 'WALL' && (
                            <motion.div
                                key="wall"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                            >
                                <MemoryWall galerieData={galerieData} />
                            </motion.div>
                        )}

                        {activeTab === 'AVIS' && (
                            <motion.div
                                key="avis"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                            >
                                <AvisSection />
                            </motion.div>
                        )}

                        {activeTab === 'CONCOURS' && isContestActive && (
                            <motion.div
                                key="concours"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.05 }}
                                className="space-y-12"
                            >
                                <div className="flex flex-col items-center gap-8">
                                    <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 backdrop-blur-xl">
                                        {[
                                            { id: 'QUIZ', label: 'Jouer au Quiz', icon: Music },
                                            { id: 'INSTAGRAM', label: 'Règlement & Partage', icon: Instagram }
                                        ].map(tab => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setContestTab(tab.id as any)}
                                                className={twMerge(
                                                    "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all",
                                                    contestTab === tab.id 
                                                        ? "bg-white text-black shadow-xl" 
                                                        : "text-white/40 hover:text-white hover:bg-white/5"
                                                )}
                                            >
                                                <tab.icon className="w-4 h-4" />
                                                {tab.label}
                                            </button>
                                        ))}
                                    </div>
                                    
                                    <div className="text-center space-y-2">
                                        <h2 className="text-4xl md:text-6xl font-display font-black uppercase italic tracking-tighter">
                                            ESPACE <span className="text-neon-red">CONCOURS</span>
                                        </h2>
                                        <p className="text-white/40 font-black uppercase tracking-widest text-[10px]">
                                            {contestTab === 'QUIZ' ? 'Tentez de gagner en répondant au Blind Test' : 'Comment valider votre participation via Instagram'}
                                        </p>
                                    </div>
                                </div>

                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={contestTab}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        {contestTab === 'QUIZ' ? <QuizSection /> : <InstagramContest onPlayClick={() => setContestTab('QUIZ')} />}
                                    </motion.div>
                                </AnimatePresence>
                            </motion.div>
                        )}

                        {activeTab === 'UPLOADS' && (
                            <motion.div
                                key="uploads"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -30 }}
                                className="max-w-4xl mx-auto"
                            >
                                <div className="bg-white/5 border border-white/10 rounded-[4rem] p-8 md:p-16 backdrop-blur-3xl space-y-12">
                                    <div className="text-center space-y-4">
                                        <div className="inline-flex p-4 bg-neon-red/10 rounded-3xl mb-4">
                                            <Camera className="w-10 h-10 text-neon-red" />
                                        </div>
                                        <h2 className="text-3xl md:text-5xl font-display font-black uppercase italic tracking-tighter">
                                            PARTAGEZ VOS <span className="text-neon-red">SOUVENIRS</span>
                                        </h2>
                                        <p className="text-white/40 max-w-xl mx-auto text-[10px] font-black uppercase tracking-widest leading-loose">
                                            Indiquez l'événement et envoyez vos pépites. Elles seront classées automatiquement dans l'album correspondant après modération.
                                        </p>
                                    </div>

                                    {!uploadSuccess ? (
                                        <div className="space-y-8 bg-black/20 p-8 md:p-12 rounded-[3rem] border border-white/5">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-3 relative">
                                                    <label className="text-[10px] font-black uppercase text-white/40 ml-4">Événement / Festival</label>
                                                    <div className="relative group/input">
                                                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within/input:text-neon-red transition-colors" />
                                                        <input 
                                                            type="text"
                                                            value={uploadFestival}
                                                            onChange={(e) => {
                                                                setUploadFestival(e.target.value);
                                                                setIsAutoCorrected(false);
                                                            }}
                                                            onBlur={() => {
                                                                setTimeout(() => {
                                                                    if (uploadFestival) setUploadFestival(handleAutoCorrect(uploadFestival));
                                                                }, 200);
                                                            }}
                                                            placeholder="NOM DU FESTIVAL OU ÉVÉNEMENT..."
                                                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-5 py-5 text-xs font-black italic uppercase focus:border-neon-red outline-none transition-all placeholder:text-white/10"
                                                        />
                                                        {isAutoCorrected && uploadFestival && (
                                                            <motion.span 
                                                                initial={{ opacity: 0, x: -10 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                className="absolute right-5 top-1/2 -translate-y-1/2 text-[8px] font-black text-green-500 uppercase italic tracking-widest bg-green-500/10 px-2 py-1 rounded-md border border-green-500/20"
                                                            >
                                                                Corrigé ✓
                                                            </motion.span>
                                                        )}
                                                    </div>

                                                    </div>
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black uppercase text-white/40 ml-4">Ton Message (Optionnel)</label>
                                                    <input 
                                                        type="text" 
                                                        value={uploadMessage}
                                                        onChange={(e) => setUploadMessage(e.target.value)}
                                                        placeholder="UN PETIT MOT SUR CETTE PHOTO..."
                                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-xs font-black italic uppercase focus:border-neon-red outline-none"
                                                    />
                                                </div>
                                            </div>

                                            <div className="border-2 border-dashed border-white/10 rounded-[2.5rem] p-12 text-center group hover:border-neon-red/50 transition-all cursor-pointer bg-white/[0.02]">
                                                <input type="file" className="hidden" id="photo-upload" accept="image/*" multiple />
                                                <label htmlFor="photo-upload" className="cursor-pointer block">
                                                    <Plus className="w-12 h-12 text-white/20 mx-auto mb-4 group-hover:scale-110 group-hover:text-neon-red transition-all" />
                                                    <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/40 group-hover:text-white transition-colors">Déposer vos photos ici</span>
                                                    <span className="block text-[8px] font-bold text-white/20 uppercase mt-2">JPG, PNG, WEBP (Max 10MB)</span>
                                                </label>
                                            </div>

                                            <button 
                                                onClick={() => {
                                                    if (!uploadFestival) return alert('Veuillez sélectionner un festival');
                                                    setUploadSuccess(true);
                                                    setTimeout(() => setUploadSuccess(false), 5000);
                                                }}
                                                className="w-full py-6 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-neon-red hover:text-white transition-all duration-500 shadow-xl"
                                            >
                                                Envoyer pour modération & Tri Auto
                                            </button>
                                        </div>
                                    ) : (
                                        <motion.div 
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="bg-green-500/10 border border-green-500/20 rounded-[3rem] p-12 text-center space-y-4"
                                        >
                                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Check className="w-8 h-8 text-green-500" />
                                            </div>
                                            <h3 className="text-xl font-black uppercase italic">Merci !</h3>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-white/60">
                                                Vos photos ont été transmises. <br />
                                                Elles seront ajoutées à l'album <span className="text-green-500">{uploadFestival}</span> après validation.
                                            </p>
                                        </motion.div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl flex items-center gap-4">
                                            <Sparkles className="w-5 h-5 text-neon-red shrink-0" />
                                            <p className="text-[9px] text-white/40 font-bold uppercase leading-relaxed">
                                                Tri automatique par festival pour un accès facilité la saison prochaine.
                                            </p>
                                        </div>
                                        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl flex items-center gap-4">
                                            <Trophy className="w-5 h-5 text-neon-red shrink-0" />
                                            <p className="text-[9px] text-white/40 font-bold uppercase leading-relaxed">
                                                Les contributeurs actifs gagnent des points d'XP exclusifs.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'GAME' && (
                            <motion.div
                                key="game"
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="max-w-7xl mx-auto"
                            >
                                {!gameStarted ? (
                                    <div className="relative group overflow-hidden bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-[3rem] p-12 md:p-24 text-center">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-50" />
                                        <Sparkles className="w-20 h-20 text-amber-400 mx-auto mb-10 animate-pulse" />
                                        <h2 className="text-4xl md:text-7xl font-display font-black mb-8 uppercase italic tracking-tighter">
                                            FESTIVAL <span className="text-amber-400">PRODUCER</span>
                                        </h2>
                                        <p className="text-white/40 max-w-2xl mx-auto text-sm font-medium uppercase tracking-[0.25em] leading-loose mb-12">
                                            Budget limité, programmation de luxe et logistique sans faille. Réussiras-tu à créer le festival parfait sans faire faillite ?
                                        </p>
                                        <motion.button
                                            whileHover={{ scale: 1.05, y: -5 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={startNewGame}
                                            className="px-16 py-6 bg-white text-black rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-[0_20px_40px_rgba(255,255,255,0.1)] hover:bg-amber-400 hover:shadow-[0_20px_40px_rgba(251,191,36,0.2)] transition-all duration-500 mb-20"
                                        >
                                            DÉMARRER LA PRODUCTION
                                        </motion.button>
                                    </div>
                                ) : (
                                    <div className="space-y-12 relative">
                                        {/* Persistent Budget Header */}
                                        {gameState !== 'ONBOARDING' && gameState !== 'RESULTS' && (
                                            <div className="sticky top-0 z-50 py-6 px-10 bg-black/80 backdrop-blur-xl border-b border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 -mx-12 mb-12 shadow-2xl">
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-black uppercase text-amber-400 tracking-[0.3em]">Trésorerie de Production</span>
                                                    <span className="text-xl font-black font-mono text-white tracking-widest">{totalSpent.toLocaleString()}€ <span className="text-white/20">/ {(budget + sponsorsBonus).toLocaleString()}€</span></span>
                                                </div>
                                                <div className="flex-1 max-w-md w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5 mx-6">
                                                    <motion.div
                                                        className={twMerge("h-full", remainingBudget < 0 ? "bg-neon-red" : "bg-gradient-to-r from-amber-400 to-amber-600")}
                                                        animate={{ width: `${Math.min(100, (totalSpent / (budget + sponsorsBonus)) * 100)}%` }}
                                                    />
                                                </div>
                                                <div className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl">
                                                    <span className={twMerge("text-sm font-black italic", remainingBudget < 0 ? "text-neon-red animate-pulse" : "text-emerald-400")}>
                                                        {remainingBudget.toLocaleString()}€ DISPONIBLE
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Steps 1-5 logic */}
                                        {gameState === 'ONBOARDING' && (
                                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-4xl mx-auto space-y-10">
                                                <div className="bg-white/5 p-12 rounded-[4rem] border border-white/10 space-y-10 backdrop-blur-3xl">
                                                    <div className="text-center space-y-4">
                                                        <h3 className="text-5xl font-black uppercase italic tracking-tighter text-amber-400">1. Dossier de Production</h3>
                                                        <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Étape 1/8 : Identité & Financement</p>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                        <div className="space-y-6">
                                                            <div className="space-y-2">
                                                                <label className="text-[10px] font-black uppercase text-white/40 ml-4">Ton Nom</label>
                                                                <input type="text" value={playerName} onChange={(e) => setPlayerName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-xl font-black italic uppercase focus:border-amber-400 outline-none" placeholder="TON NOM" />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-[10px] font-black uppercase text-white/40 ml-4">Le Festival</label>
                                                                <input type="text" value={festivalName} onChange={(e) => setFestivalName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-xl font-black italic uppercase focus:border-amber-400 outline-none" placeholder="NOM DU FESTIVAL" />
                                                            </div>
                                                            <div className="p-5 bg-amber-400/10 border border-amber-400/20 rounded-2xl flex items-start gap-3">
                                                                <Info className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                                                                <p className="text-[10px] font-bold text-white/60 uppercase leading-relaxed">
                                                                    Ton email de sauvegarde cloud sera demandé à la fin de la résidence pour synchroniser ton XP.
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-6">
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Sponsors (Max 2)</p>
                                                            <div className="grid grid-cols-1 gap-3">
                                                                {SPONSORS.map(sponsor => (
                                                                    <button key={sponsor.id} onClick={() => selectedSponsors.includes(sponsor.id) ? setSelectedSponsors(p => p.filter(id => id !== sponsor.id)) : selectedSponsors.length < 2 && setSelectedSponsors(p => [...p, sponsor.id])} className={twMerge("p-4 rounded-xl border transition-all text-left flex justify-between items-center", selectedSponsors.includes(sponsor.id) ? "bg-amber-400 border-amber-400 text-black" : "bg-white/5 border-white/10 text-white/40")}>
                                                                        <div><p className="text-[10px] font-black uppercase italic leading-none mb-1">{sponsor.name}</p><p className="text-[7px] font-bold opacity-60">+{sponsor.bonus.toLocaleString()}€</p></div>
                                                                        {selectedSponsors.includes(sponsor.id) && <Check className="w-3 h-3" />}
                                                                    </button>
                                                                ))}
                                                            </div>

                                                            <div className="pt-4 space-y-4">
                                                                <p className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Durée du Festival</p>
                                                                <div className="flex gap-2">
                                                                    {[1, 2, 3].map(d => (
                                                                        <button key={d} onClick={() => setFestivalDuration(d)} className={twMerge("flex-1 py-4 rounded-xl border font-black text-[10px] transition-all", festivalDuration === d ? "bg-white text-black border-white" : "bg-white/5 border-white/10 text-white/40")}>
                                                                            {d} {d > 1 ? 'JOURS' : 'JOUR'}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button disabled={!playerName || !festivalName} onClick={() => setGameState('LOCATION')} className="w-full py-8 bg-white text-black rounded-3xl font-black text-xs uppercase tracking-[0.4em] disabled:opacity-20 hover:bg-amber-400 transition-all">VALIDER ET CONTINUER →</button>
                                                </div>
                                            </motion.div>
                                        )}

                                        {gameState === 'LOCATION' && (
                                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-12">
                                                <div className="text-center space-y-4">
                                                    <h3 className="text-6xl font-black uppercase italic tracking-tighter text-amber-400">2. Choisir le Lieu</h3>
                                                    <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Étape 2/8 : Ton arène pour l'histoire</p>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                                    {FESTIVAL_LOCATIONS.map(loc => {
                                                        const isLocked = currentRank.level < (loc.minRank || 0);
                                                        return (
                                                            <button key={loc.id} disabled={isLocked} onClick={() => { setSelectedLocation(loc); setGameState('DATE'); }} className={twMerge("p-8 rounded-[3rem] border-2 transition-all flex flex-col items-start gap-4 text-left group min-h-[200px]", selectedLocation.id === loc.id ? "bg-white border-white text-black scale-105" : isLocked ? "bg-black/40 border-white/5 opacity-20 grayscale pointer-events-none" : "bg-white/5 border-white/10 hover:border-white/30")}>
                                                                <div className="w-full flex justify-between items-start">
                                                                    <span className="text-[8px] font-black uppercase tracking-widest opacity-40">Cap: {loc.capacity.toLocaleString()}</span>
                                                                    {isLocked && <Lock className="w-3 h-3" />}
                                                                </div>
                                                                <h4 className="text-xl font-black italic uppercase leading-tight mb-2">{loc.name}</h4>
                                                                <div className="mt-auto pt-4 border-t border-black/5 w-full">
                                                                    <p className="text-sm font-black">{loc.cost.toLocaleString()}€</p>
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </motion.div>
                                        )}

                                        {gameState === 'DATE' && (
                                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-2xl mx-auto space-y-10 bg-white/5 p-12 rounded-[3.5rem] border border-white/10 backdrop-blur-3xl">
                                                <div className="text-center space-y-4">
                                                    <h3 className="text-4xl font-black uppercase italic tracking-tighter text-amber-400">3. Fixer la Date</h3>
                                                    <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Étape 3/8 : Vérification IA</p>
                                                </div>
                                                <div className="space-y-8">
                                                    <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-3xl p-10 text-4xl font-black italic text-center uppercase [color-scheme:dark]" />
                                                    {selectedDate && (
                                                        <div className="p-8 bg-amber-400/10 border border-amber-400/20 rounded-2xl flex items-start gap-4">
                                                            <Sparkles className="w-6 h-6 text-amber-400 flex-shrink-0" />
                                                            <p className="text-xs text-white/60 font-medium font-mono">DATE DISPONIBLE : Créneau optimal validé par l'IA Dropsiders.</p>
                                                        </div>
                                                    )}
                                                </div>
                                                <button disabled={!selectedDate} onClick={() => setGameState('LOGISTICS')} className="w-full py-8 bg-white text-black rounded-3xl font-black text-xs uppercase tracking-[0.4em] disabled:opacity-20 hover:bg-amber-400 transition-all shadow-xl">CONTINUER →</button>
                                            </motion.div>
                                        )}

                                        {gameState === 'LOGISTICS' && (
                                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-12">
                                                <div className="text-center space-y-4">
                                                    <h3 className="text-6xl font-black uppercase italic tracking-tighter text-amber-400">4. Logistique</h3>
                                                    <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Étape 4/8 : Sécurité & Services (Min. 3)</p>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                                    {FIX_COSTS.map(cost => (
                                                        <button key={cost.id} onClick={() => selectedCosts.includes(cost.id) ? setSelectedCosts(p => p.filter(c => c !== cost.id)) : setSelectedCosts(p => [...p, cost.id])} className={twMerge("p-10 rounded-[3rem] border-2 transition-all flex flex-col items-center gap-6 text-center", selectedCosts.includes(cost.id) ? "bg-white border-white text-black scale-105" : "bg-white/5 border-white/10 hover:border-white/30")}>
                                                            <cost.icon className="w-10 h-10" />
                                                            <h4 className="text-xs font-black uppercase tracking-widest">{cost.name}</h4>
                                                            <p className="text-[10px] font-mono opacity-60 italic">{cost.basePrice.toLocaleString()}€</p>
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="flex justify-center">
                                                    <button disabled={selectedCosts.length < 3} onClick={() => setGameState('STAGES')} className="px-24 py-8 bg-white text-black rounded-3xl font-black text-xs uppercase tracking-[0.4em] disabled:opacity-20 hover:bg-amber-400 transition-all">CONFIRMER LOGISTIQUE →</button>
                                                </div>
                                            </motion.div>
                                        )}

                                        {gameState === 'STAGES' && (
                                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-12">
                                                <div className="text-center space-y-4">
                                                    <h3 className="text-6xl font-black uppercase italic tracking-tighter text-amber-400">5. Scènes & Show</h3>
                                                    <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Étape 5/8 : Configuration Scénique</p>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl mx-auto">
                                                    <div className="p-12 bg-white/5 border border-white/10 rounded-[4rem] space-y-10 backdrop-blur-3xl">
                                                        <h4 className="text-sm font-black uppercase tracking-widest text-center">Quantité de Scènes</h4>
                                                        <div className="flex justify-center gap-8">
                                                            {[1, 2, 3].map(n => (
                                                                <button key={n} onClick={() => setStageCount(n)} className={twMerge("w-24 h-24 rounded-[2rem] border-2 flex flex-col items-center justify-center gap-1 transition-all", stageCount === n ? "bg-amber-400 border-amber-400 text-black scale-110 shadow-2xl" : "bg-white/5 border-white/10 text-white/40")}>
                                                                    <span className="text-3xl font-black italic">{n}</span>
                                                                    <span className="text-[8px] font-black uppercase">Stages</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                        <p className="text-[10px] font-bold text-white/40 text-center uppercase italic">Un malus sera appliqué si vous ne bookez pas 5 artistes par scène.</p>
                                                    </div>
                                                    <div className="p-12 bg-white/5 border border-white/10 rounded-[4rem] space-y-10 backdrop-blur-3xl">
                                                        <h4 className="text-sm font-black uppercase tracking-widest text-center">Effets Visuels</h4>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            {STAGE_EFFECTS.map(e => (
                                                                <button key={e.id} onClick={() => selectedEffects.includes(e.id) ? setSelectedEffects(p => p.filter(id => id !== e.id)) : setSelectedEffects(p => [...p, e.id])} className={twMerge("p-6 rounded-2xl border transition-all flex flex-col items-center gap-2", selectedEffects.includes(e.id) ? "bg-white border-white text-black" : "bg-white/5 border-white/10 text-white/40")}>
                                                                    <e.icon className="w-6 h-6" />
                                                                    <span className="text-[9px] font-black uppercase">{e.name}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex justify-center">
                                                    <button onClick={() => { setBudget(2500000 + (currentRank.level * 800000) + sponsorsBonus); setGameState('BOOKING'); }} className="px-32 py-8 bg-white text-black rounded-3xl font-black text-xs uppercase tracking-[0.4em] hover:bg-amber-400 transition-all shadow-2xl">LANCER LE BOOKING →</button>
                                                </div>
                                            </motion.div>
                                        )}
                                        {/* --- STEP 6: BOOKING & PRODUCTION --- */}
                                        {gameState === 'BOOKING' && (
                                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                                                {/* Sidebar: Production Control */}
                                                <div className="lg:col-span-4 space-y-8">
                                                    <div className="sticky top-24 p-10 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] shadow-2xl space-y-10">
                                                        <div className="flex items-center justify-between">
                                                            <h3 className="text-2xl font-black italic tracking-tighter uppercase text-white">Production</h3>
                                                            <button onClick={resetGame} className="p-2 text-white/20 hover:text-white transition-colors">
                                                                <X className="w-6 h-6" />
                                                            </button>
                                                        </div>

                                                        {/* Budget Progress */}
                                                        <div className="space-y-4">
                                                            <div className="flex justify-between items-end">
                                                                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Trésorerie</span>
                                                                <div className="flex flex-col items-end">
                                                                    <span className="text-2xl font-black font-mono text-white tracking-widest">{totalSpent.toLocaleString()}€</span>
                                                                    {isPriceRising && <span className="text-[8px] text-neon-red font-black uppercase animate-pulse">Alerte : Prix en hausse !</span>}
                                                                </div>
                                                            </div>
                                                            <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                                <motion.div
                                                                    className={twMerge("h-full transition-colors duration-500", remainingBudget < 0 ? "bg-neon-red" : "bg-amber-400")}
                                                                    animate={{ width: `${Math.min(100, (totalSpent / (budget + sponsorsBonus)) * 100)}%` }}
                                                                />
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-[9px] font-bold text-white/20 uppercase">Budget Max: {(budget + sponsorsBonus).toLocaleString()}€</span>
                                                                <span className={twMerge("text-[9px] font-black uppercase", remainingBudget < 0 ? "text-neon-red animate-pulse" : "text-emerald-400")}>
                                                                    Reste: {remainingBudget.toLocaleString()}€
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Quick Settings */}
                                                        <div className="space-y-8">
                                                            <div className="space-y-4">
                                                                <div className="flex justify-between items-center text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">
                                                                    <span>Prix Billet</span>
                                                                    <span className="text-white font-mono">{ticketPrice}€</span>
                                                                </div>
                                                                <input type="range" min="50" max="800" step="10" value={ticketPrice} onChange={(e) => setTicketPrice(parseInt(e.target.value))} className="w-full accent-amber-400" />
                                                            </div>

                                                            <div className="p-6 bg-white/[0.03] border border-white/10 rounded-[2rem] relative overflow-hidden group">
                                                                <div className="flex gap-5 relative z-10">
                                                                    <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shrink-0 shadow-xl border border-white/10">
                                                                        <span className="text-3xl">{advisorTip?.avatar || "👤"}</span>
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="text-[10px] font-black uppercase text-amber-400 tracking-[0.2em] mb-1">{advisorTip?.name || "Conseiller"}</h4>
                                                                        <p className="text-[11px] font-bold text-white/70 italic leading-snug">"{advisorTip?.tip}"</p>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-4">
                                                                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Services ({selectedCosts.length})</span>
                                                                <div className="grid grid-cols-4 gap-2">
                                                                    {FIX_COSTS.map(cost => (
                                                                        <button
                                                                            key={cost.id}
                                                                            onClick={() => selectedCosts.includes(cost.id) ? setSelectedCosts(p => p.filter(id => id !== cost.id)) : setSelectedCosts(p => [...p, cost.id])}
                                                                            className={twMerge(
                                                                                "p-3 rounded-xl border-2 transition-all flex items-center justify-center",
                                                                                selectedCosts.includes(cost.id) ? "bg-white border-white text-black shadow-lg" : "bg-white/5 border-white/10 text-white/20"
                                                                            )}
                                                                            title={cost.name}
                                                                        >
                                                                            <cost.icon className="w-4 h-4" />
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <button
                                                            disabled={selectedDjs.length < 5 || remainingBudget < 0 || !selectedDate}
                                                            onClick={generatePoster}
                                                            className="w-full py-6 rounded-[1.5rem] bg-white text-black font-black text-[10px] uppercase tracking-[0.3em] disabled:opacity-20 hover:bg-neon-red hover:text-white transition-all duration-500 shadow-2xl"
                                                        >
                                                            {selectedDjs.length < 5 ? `Artistes: ${selectedDjs.length}/5` : "Lancer le Festival"}
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Main: DJ List */}
                                                <div className="lg:col-span-8 flex flex-col min-h-[800px] relative">
                                                    <div className="sticky top-0 z-40 bg-[#050505]/60 backdrop-blur-3xl pb-8 pt-4 border-b border-white/5 mx-[-1rem] px-4 rounded-b-[3rem]">
                                                        <div className="flex flex-col xl:flex-row items-center justify-between gap-8 py-4">
                                                            <div className="text-center xl:text-left">
                                                                <h3 className="text-4xl font-black italic tracking-tighter uppercase mb-2 bg-gradient-to-r from-white via-white to-white/20 bg-clip-text text-transparent">Booking Gallery</h3>
                                                                <p className="text-[11px] font-black text-amber-400 uppercase tracking-[0.4em]">{selectedDjs.length} / 5 Artistes Minimum</p>
                                                            </div>

                                                            <div className="flex flex-wrap items-center justify-center gap-4 w-full xl:w-auto">
                                                                <div className="relative group flex-1 md:w-80">
                                                                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Rechercher une star..."
                                                                        value={searchQuery}
                                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                                        className="w-full pl-14 pr-8 py-4 bg-white/5 border border-white/10 rounded-[2rem] text-xs font-black text-white placeholder:text-white/20 focus:outline-none focus:border-amber-400 focus:bg-white/10 transition-all duration-500 shadow-2xl"
                                                                    />
                                                                </div>

                                                                <div className="flex items-center gap-2">
                                                                    <div className="relative">
                                                                        <Filter className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                                                        <select
                                                                            value={selectedGenreFilter}
                                                                            onChange={(e) => setSelectedGenreFilter(e.target.value)}
                                                                            className="pl-14 pr-10 py-4 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-white appearance-none focus:outline-none focus:border-white/20 transition-all cursor-pointer hover:bg-white/10"
                                                                        >
                                                                            <option value="ALL">Tous les Styles</option>
                                                                            <option value="EDM">EDM</option>
                                                                            <option value="TECHNO">Techno</option>
                                                                            <option value="HOUSE">House</option>
                                                                            <option value="TECH HOUSE">Tech House</option>
                                                                            <option value="AFRO HOUSE">Afro House</option>
                                                                            <option value="MELODIC TECHNO">Melodic</option>
                                                                            <option value="BASS MUSIC">Bass</option>
                                                                        </select>
                                                                    </div>

                                                                    <button
                                                                        onClick={() => setPriceSort(prev => prev === 'DESC' ? 'ASC' : 'DESC')}
                                                                        className="px-6 py-4 bg-white/5 border border-white/10 rounded-full flex items-center gap-3 hover:bg-white/10 transition-all"
                                                                    >
                                                                        <Trophy className={twMerge("w-4 h-4", priceSort !== 'NONE' ? "text-amber-400" : "text-white/20")} />
                                                                        <span className="text-[10px] font-black uppercase tracking-widest">Prix {priceSort === 'DESC' ? '↓' : priceSort === 'ASC' ? '↑' : ''}</span>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* AI Booking Notification Status + Negotiation */}
                                                        <AnimatePresence mode="wait">
                                                            {negotiatingDj ? (
                                                                <motion.div
                                                                    key="negotiation"
                                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                                    animate={{ opacity: 1, scale: 1 }}
                                                                    exit={{ opacity: 0 }}
                                                                    className="p-8 rounded-[3rem] bg-amber-400 text-black border border-amber-500 shadow-2xl z-50 flex flex-col items-center gap-6"
                                                                >
                                                                    <div className="text-center">
                                                                        <h4 className="text-xl font-black uppercase italic tracking-tighter">NÉGOCIATION EN COURS</h4>
                                                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">L'agent de {negotiatingDj.name} demande un extra.</p>
                                                                    </div>
                                                                    <div className="grid grid-cols-3 gap-4 w-full">
                                                                        {NEGOTIATION_PERKS.map(perk => (
                                                                            <button
                                                                                key={perk.id}
                                                                                onClick={() => handleNegotiate(perk)}
                                                                                className="p-4 bg-black/10 border border-black/10 rounded-2xl hover:bg-black/20 transition-all flex flex-col items-center gap-2"
                                                                            >
                                                                                <span className="text-[9px] font-black uppercase">{perk.name}</span>
                                                                                <span className="text-xs font-mono font-black">{perk.cost.toLocaleString()}€</span>
                                                                                <span className="text-[7px] opacity-40 uppercase font-bold text-center">{perk.desc}</span>
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                    <button
                                                                        onClick={() => setNegotiatingDj(null)}
                                                                        className="text-[9px] font-black uppercase tracking-widest opacity-40 hover:opacity-100"
                                                                    >
                                                                        Annuler le booking
                                                                    </button>
                                                                </motion.div>
                                                            ) : bookingStatus ? (
                                                                <div className="p-5 rounded-[2rem] bg-amber-400/5 border border-amber-400/10 flex items-center gap-4 text-amber-400/40">
                                                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                                                    <span className="text-[10px] font-black uppercase tracking-[0.4em] italic">Négociation en cours (voir carte)...</span>
                                                                </div>
                                                            ) : (
                                                                <div className="p-5 rounded-[2rem] bg-white/[0.03] border border-white/5 flex items-center gap-4 text-white/20">
                                                                    <div className="w-10 h-10 border border-white/10 rounded-xl flex items-center justify-center">
                                                                        <Music className="w-4 h-4 opacity-50" />
                                                                    </div>
                                                                    <span className="text-[10px] font-black uppercase tracking-[0.4em] italic">Clique sur un artiste pour lancer la négociation...</span>
                                                                </div>
                                                            )}
                                                        </AnimatePresence>

                                                        {/* Crisis Modal */}
                                                        <AnimatePresence>
                                                            {activeCrisis && (
                                                                <motion.div
                                                                    initial={{ opacity: 0 }}
                                                                    animate={{ opacity: 1 }}
                                                                    exit={{ opacity: 0 }}
                                                                    className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6"
                                                                >
                                                                    <motion.div
                                                                        initial={{ scale: 0.9, y: 20 }}
                                                                        animate={{ scale: 1, y: 0 }}
                                                                        className="max-w-xl w-full p-12 bg-white/5 border border-white/10 rounded-[4rem] space-y-10"
                                                                    >
                                                                        <div className="text-center space-y-4">
                                                                            <div className="w-20 h-20 bg-neon-red/20 rounded-3xl flex items-center justify-center mx-auto border border-neon-red/30">
                                                                                <AlertCircle className="w-10 h-10 text-neon-red animate-pulse" />
                                                                            </div>
                                                                            <h2 className="text-4xl font-black italic tracking-tighter uppercase text-white">{activeCrisis.name}</h2>
                                                                            <p className="text-white/40 text-xs font-black uppercase tracking-[0.2em]">{activeCrisis.desc}</p>
                                                                        </div>

                                                                        <div className="grid grid-cols-1 gap-4">
                                                                            {activeCrisis.options.map(option => (
                                                                                <button
                                                                                    key={option.id}
                                                                                    onClick={() => handleCrisisChoice(option)}
                                                                                    className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-amber-400/30 transition-all text-left group"
                                                                                >
                                                                                    <div className="flex justify-between items-center">
                                                                                        <span className="text-sm font-black uppercase tracking-widest group-hover:text-amber-400 transition-colors">{option.name}</span>
                                                                                        <span className="text-[10px] font-mono text-white/40">{option.cost > 0 ? `-${option.cost.toLocaleString()}€` : 'Gratuit'}</span>
                                                                                    </div>
                                                                                    <p className="text-[9px] font-bold text-white/20 uppercase mt-2">{option.result}</p>
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    </motion.div>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pt-12">
                                                        {[...DJ_POOL]
                                                            .filter(dj => {
                                                                const matchesSearch = dj.name.toLowerCase().includes(searchQuery.toLowerCase());
                                                                const matchesGenre = selectedGenreFilter === 'ALL' || dj.genre.toUpperCase().includes(selectedGenreFilter);
                                                                return matchesSearch && matchesGenre;
                                                            })
                                                            .sort((a, b) => {
                                                                if (priceSort === 'ASC') return a.price - b.price;
                                                                if (priceSort === 'DESC') return b.price - a.price;
                                                                return 0;
                                                            })
                                                            .map((dj, i) => {
                                                                const isSelected = selectedDjs.find(d => d.id === dj.id);
                                                                const canAfford = remainingBudget >= (dj.price * (dj.popularity > 95 ? 1.15 : 1));
                                                                const isHeadliner = dj.price > 600000;

                                                                return (
                                                                    <motion.button
                                                                        key={dj.id}
                                                                        initial={{ opacity: 0, y: 20 }}
                                                                        animate={{ opacity: 1, y: 0 }}
                                                                        transition={{ delay: Math.min(i * 0.03, 0.6) }}
                                                                        onClick={() => toggleDj(dj)}
                                                                        disabled={!isSelected && !canAfford}
                                                                        className={twMerge(
                                                                            "relative group p-8 rounded-[3rem] border-2 transition-all duration-500 text-left overflow-hidden flex flex-col min-h-[340px] shadow-2xl",
                                                                            isSelected
                                                                                ? "bg-amber-400 border-amber-400 text-black scale-105 z-10"
                                                                                : !canAfford && !isSelected
                                                                                    ? "bg-white/[0.02] border-white/5 opacity-20 grayscale pointer-events-none"
                                                                                    : isHeadliner
                                                                                        ? "bg-gradient-to-br from-white/[0.08] to-transparent border-white/20 hover:border-amber-400/50"
                                                                                        : "bg-white/[0.04] border-white/10 hover:border-white/20"
                                                                        )}
                                                                    >
                                                                        {/* Glow Effect for Selected/Headliners */}
                                                                        {isSelected && (
                                                                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.4),transparent)] opacity-50" />
                                                                        )}

                                                                        <div className="flex justify-between items-start mb-8 relative z-10">
                                                                            <div className={twMerge(
                                                                                "w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 overflow-hidden bg-black/20",
                                                                                isSelected ? "border-black/10 shadow-lg" : "border-white/10 group-hover:border-amber-400 group-hover:shadow-[0_0_20px_rgba(251,191,36,0.5)]"
                                                                            )}>
                                                                                {(dj as any).image ? (
                                                                                    <img
                                                                                        src={(dj as any).image}
                                                                                        alt={dj.name}
                                                                                        className="w-full h-full object-cover"
                                                                                        onError={(e) => {
                                                                                            (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${dj.name}&backgroundColor=050505`;
                                                                                        }}
                                                                                    />
                                                                                ) : (
                                                                                    <Music className="w-7 h-7" />
                                                                                )}
                                                                            </div>

                                                                            <div className="flex flex-col items-end gap-2">
                                                                                {isSelected ? (
                                                                                    <div className="bg-black text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                                                                        <Check className="w-3 h-3" /> Confirmé
                                                                                    </div>
                                                                                ) : isHeadliner ? (
                                                                                    <div className="bg-amber-400/20 text-amber-500 border border-amber-500/30 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
                                                                                        Elite Tier
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="bg-white/5 text-white/40 border border-white/10 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                                                        Artiste
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        <div className="flex-1 relative z-10">
                                                                            <h4 className={twMerge(
                                                                                "text-2xl font-black uppercase italic tracking-tighter mb-1 leading-none transition-colors",
                                                                                isSelected ? "text-black" : "text-white group-hover:text-amber-400"
                                                                            )}>
                                                                                {dj.name}
                                                                            </h4>
                                                                            <p className={twMerge(
                                                                                "text-[10px] font-black uppercase tracking-[0.3em] mb-6 opacity-40",
                                                                                isSelected ? "text-black" : "text-white"
                                                                            )}>
                                                                                {dj.genre}
                                                                            </p>

                                                                            <div className="space-y-4">
                                                                                <AnimatePresence>
                                                                                    {bookingStatus?.djId === dj.id && (
                                                                                        <motion.div
                                                                                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                                                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                                                                            className={twMerge(
                                                                                                "p-4 rounded-2xl border flex flex-col gap-2 shadow-2xl",
                                                                                                bookingStatus.status === 'PENDING' ? "bg-amber-400/20 border-amber-400/40" :
                                                                                                    bookingStatus.status === 'ACCEPTED' ? "bg-emerald-400/20 border-emerald-400/40" :
                                                                                                        "bg-red-400/20 border-red-400/40"
                                                                                            )}
                                                                                        >
                                                                                            <div className="flex items-center justify-between">
                                                                                                <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Status Agent</span>
                                                                                                {bookingStatus.status === 'PENDING' && <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />}
                                                                                            </div>
                                                                                            <p className="text-[10px] font-bold text-white leading-tight italic">
                                                                                                {bookingStatus.message}
                                                                                            </p>
                                                                                        </motion.div>
                                                                                    )}
                                                                                </AnimatePresence>

                                                                                <div className="flex justify-between items-end">
                                                                                    <span className="text-[9px] font-black uppercase tracking-widest opacity-30">Power Rating</span>
                                                                                    <span className={twMerge("text-xs font-black", isSelected ? "text-black" : "text-amber-400")}>{dj.popularity}%</span>
                                                                                </div>
                                                                                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                                                    <motion.div
                                                                                        initial={{ width: 0 }}
                                                                                        animate={{ width: `${dj.popularity}%` }}
                                                                                        className={twMerge("h-full", isSelected ? "bg-black" : "bg-amber-400")}
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        <div className="flex items-center justify-between pt-8 mt-8 border-t border-black/5 relative z-10">
                                                                            <div className="flex flex-col">
                                                                                <span className="text-[8px] font-black uppercase tracking-widest opacity-30 mb-0.5">Booking Fee</span>
                                                                                <span className={twMerge(
                                                                                    "text-2xl font-mono font-black",
                                                                                    isSelected ? "text-black" : "text-white"
                                                                                )}>
                                                                                    {dj.price.toLocaleString()}€
                                                                                </span>
                                                                            </div>
                                                                            <div className={twMerge(
                                                                                "p-3 rounded-2xl transition-all",
                                                                                isSelected ? "bg-black/10" : "bg-white/5 group-hover:bg-amber-400 group-hover:text-black"
                                                                            )}>
                                                                                <Plus className="w-5 h-5" />
                                                                            </div>
                                                                        </div>

                                                                        {!isSelected && !canAfford && (
                                                                            <div className="absolute inset-0 bg-[#050505]/80 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center z-20">
                                                                                <AlertCircle className="w-10 h-10 text-red-500 mb-4" />
                                                                                <span className="text-xs font-black text-white uppercase tracking-[0.3em] mb-2 leading-tight">Trésorerie Insuffisante</span>
                                                                                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest leading-relaxed">Cet artiste prestigieux demande une avance que vous ne possédez pas.</p>
                                                                            </div>
                                                                        )}
                                                                    </motion.button>
                                                                );
                                                            })}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* --- STEP 7: TICKETING SIMULATION --- */}
                                        {gameState === 'GENERATION' && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center p-12 text-center"
                                            >
                                                <div className="max-w-md w-full space-y-12">
                                                    <div className="relative w-32 h-32 mx-auto">
                                                        <motion.div
                                                            animate={{ rotate: 360 }}
                                                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                                            className="absolute inset-0 border-4 border-amber-400/20 border-t-amber-400 rounded-full"
                                                        />
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <Ticket className="w-12 h-12 text-amber-400" />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <h2 className="text-4xl font-black italic tracking-tighter uppercase text-white">Simulation Billeterie</h2>
                                                        <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">Analyse des algorithmes de vente...</p>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${ticketingProgress}%` }}
                                                                className="h-full bg-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)]"
                                                            />
                                                        </div>
                                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-amber-400">
                                                            <span>Ventes Directes</span>
                                                            <span>{Math.round(ticketingProgress)}%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* --- STEP 8: FINAL RESULTS --- */}
                                        {gameState === 'RESULTS' && (
                                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                                                {/* Left: Poster Display */}
                                                <div className="lg:col-span-12 xl:col-span-5 space-y-6">
                                                    <div className="flex gap-4 mb-4">
                                                        {(['ULTRA', 'TOMORROWLAND', 'EDC'] as const).map((style) => (
                                                            <button
                                                                key={style}
                                                                onClick={() => setPosterStyle(style)}
                                                                className={twMerge(
                                                                    "flex-1 py-3 text-[8px] font-black uppercase tracking-widest rounded-xl border transition-all",
                                                                    posterStyle === style ? "bg-white text-black border-white" : "bg-white/5 border-white/10 text-white/40 hover:border-white/30"
                                                                )}
                                                            >
                                                                {style}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    <motion.div
                                                        key={posterStyle}
                                                        initial={{ rotateY: 90, opacity: 0 }}
                                                        animate={{ rotateY: 0, opacity: 1 }}
                                                        className={twMerge(
                                                            "relative aspect-[3/4] shadow-[0_60px_120px_rgba(0,0,0,0.9)] rounded-[3rem] p-8 md:p-12 overflow-hidden flex flex-col",
                                                            posterStyle === 'ULTRA' ? "bg-white border-[1px] border-black" :
                                                                posterStyle === 'TOMORROWLAND' ? "bg-[#0a0a0d] border-[16px] border-[#d4af37]" :
                                                                    "bg-black border-[2px] border-neon-red shadow-[0_0_80px_rgba(255,0,0,0.2)]"
                                                        )}
                                                    >
                                                        {/* Background Elements */}
                                                        {posterStyle === 'ULTRA' && (
                                                            <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                                                                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-black rounded-full -mr-64 -mt-64" />
                                                                <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_2px_2px,_#000_1px,_transparent_0)] [background-size:24px_24px]" />
                                                            </div>
                                                        )}
                                                        {posterStyle === 'TOMORROWLAND' && (
                                                            <div className="absolute inset-0 pointer-events-none">
                                                                <div className="absolute inset-2 border-[1px] border-[#d4af37]/30" />
                                                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 border-b-[1px] border-x-[1px] border-[#d4af37]/20 rounded-b-full overflow-hidden">
                                                                    <div className="absolute inset-4 border-[1px] border-[#d4af37]/10 rounded-full animate-pulse" />
                                                                </div>
                                                            </div>
                                                        )}
                                                        {posterStyle === 'EDC' && (
                                                            <div className="absolute inset-0 pointer-events-none">
                                                                <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,_transparent_0%,_#000_70%),_conic-gradient(from_0deg_at_50%_50%,_#ff003c_0deg,_#00f0ff_120deg,_#ff003c_360deg)] opacity-10 blur-3xl animate-pulse" />
                                                                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,0,60,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,0,60,0.05)_1px,transparent_1px)] bg-[size:20px_20px]" />
                                                            </div>
                                                        )}

                                                        <div className="relative z-10 h-full flex flex-col items-center">
                                                            <div className="mb-10 text-center">
                                                                <div className={twMerge(
                                                                    "text-[8px] font-black uppercase tracking-[0.5em] mb-3",
                                                                    posterStyle === 'ULTRA' ? "text-black/30" : "text-amber-400"
                                                                )}>
                                                                    {selectedDate} • {selectedLocation.name}
                                                                </div>
                                                                <h3 className={twMerge(
                                                                    "font-display font-black uppercase italic tracking-tighter leading-[0.8]",
                                                                    festivalName.length > 20 ? "text-2xl md:text-4xl" : "text-4xl md:text-6xl",
                                                                    posterStyle === 'ULTRA' ? "text-black" : "text-white"
                                                                )}>
                                                                    {festivalName}
                                                                </h3>
                                                            </div>

                                                            <div className="flex-1 w-full flex flex-col justify-center items-center gap-4 py-8">
                                                                {selectedDjs.map((dj, i) => {
                                                                    const isHeadline = i < 3;
                                                                    const count = selectedDjs.length;
                                                                    let fontSizeClass = "text-xl";
                                                                    if (isHeadline) {
                                                                        fontSizeClass = count > 10 ? "text-2xl" : "text-4xl";
                                                                        if (dj.name.length > 15) fontSizeClass = count > 10 ? "text-lg" : "text-2xl";
                                                                    } else {
                                                                        fontSizeClass = count > 15 ? "text-[8px]" : "text-xs";
                                                                    }

                                                                    return (
                                                                        <div
                                                                            key={dj.id}
                                                                            className={twMerge(
                                                                                "font-black uppercase tracking-[0.2em] transition-all text-center px-4",
                                                                                fontSizeClass,
                                                                                posterStyle === 'ULTRA' ? (isHeadline ? "text-black font-display" : "text-black/40") :
                                                                                    posterStyle === 'TOMORROWLAND' ? (isHeadline ? "text-[#d4af37]" : "text-white/30") :
                                                                                        (isHeadline ? "text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" : "text-neon-red/50")
                                                                            )}
                                                                            style={{ lineHeight: 1.1 }}
                                                                        >
                                                                            {dj.name}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>

                                                            <div className={twMerge(
                                                                "mt-auto pt-8 border-t w-full flex flex-col gap-2",
                                                                posterStyle === 'ULTRA' ? "border-black/5" : "border-white/10"
                                                            )}>
                                                                <div className="flex justify-between items-center px-2">
                                                                    <div className={twMerge("text-[8px] font-black uppercase tracking-widest", posterStyle === 'ULTRA' ? "text-black/20" : "text-white/20")}>Communaut&eacute;</div>
                                                                    <div className={twMerge("text-[8px] font-black uppercase tracking-widest", posterStyle === 'ULTRA' ? "text-black/20" : "text-white/20")}>#FESTIVALPRODUCER</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                </div>

                                                {/* Right: Detailed Report & Archives */}
                                                <div className="lg:col-span-12 xl:col-span-7 space-y-8">
                                                    <div className="p-10 bg-white/5 border border-white/10 rounded-[3rem] backdrop-blur-3xl space-y-10">
                                                        <div className="flex justify-between items-center">
                                                            <h3 className="text-2xl font-black italic tracking-tighter uppercase text-white">Rapport de Production</h3>
                                                            <div className="px-4 py-2 bg-emerald-400/10 border border-emerald-400/20 rounded-xl text-emerald-400 text-[10px] font-black uppercase">Statut: Succès</div>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                            <div className="p-8 bg-white/[0.03] rounded-[2rem] border border-white/5 text-center">
                                                                <Users className="w-8 h-8 text-amber-400 mx-auto mb-4" />
                                                                <span className="text-[9px] font-black text-white/40 uppercase block mb-1 tracking-widest">Affluence Totale</span>
                                                                <span className="text-3xl font-black text-white">{attendance.toLocaleString()}</span>
                                                            </div>
                                                            <div className="p-8 bg-white/[0.03] rounded-[2rem] border border-white/5 text-center">
                                                                <Euro className="w-8 h-8 text-emerald-400 mx-auto mb-4" />
                                                                <span className="text-[9px] font-black text-white/40 uppercase block mb-1 tracking-widest">Profit Net</span>
                                                                <span className={twMerge("text-3xl font-black", profit >= 0 ? "text-emerald-400" : "text-neon-red")}>{profit.toLocaleString()}€</span>
                                                            </div>
                                                        </div>

                                                        <div className="p-8 bg-white/[0.03] border border-white/5 rounded-[2rem] relative overflow-hidden group text-center">
                                                            <h4 className="text-[10px] font-black uppercase text-amber-400 tracking-[0.3em] mb-4">Analyse Critique</h4>
                                                            <p className="text-lg font-bold italic text-white/80 leading-relaxed uppercase tracking-tight">
                                                                "{aftermovieSummary}"
                                                            </p>
                                                        </div>

                                                        <div className="space-y-6">
                                                            {/* Cloud Sync */}
                                                            <div className="p-10 bg-white/5 border border-white/10 rounded-[3rem] backdrop-blur-3xl">
                                                                <div className="flex items-center gap-4 mb-6">
                                                                    <div className="w-10 h-10 rounded-full bg-amber-400/10 flex items-center justify-center">
                                                                        <Globe className="w-5 h-5 text-amber-400" />
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="text-xs font-black uppercase tracking-widest text-white">Cloud XP Sync</h4>
                                                                        <p className="text-[8px] font-bold text-white/40 uppercase tracking-tighter">
                                                                            {isLoggedIn ? 'Sauvegarde automatique activée' : 'Sauvegarde ta progression sur Cloudflare'}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                {!isLoggedIn ? (
                                                                    <div className="space-y-4">
                                                                        <input
                                                                            type="email"
                                                                            placeholder="TON@EMAIL.COM POUR SAUVEGARDER TA CARRIÈRE"
                                                                            value={playerEmail}
                                                                            onChange={(e) => setPlayerEmail(e.target.value)}
                                                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-sm font-black uppercase focus:border-amber-400 outline-none transition-all placeholder:text-white/20"
                                                                        />
                                                                        <p className="text-[9px] text-gray-500 font-bold uppercase text-center italic">Connecte-toi à ton compte pour une synchronisation automatique</p>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center gap-3 px-6 py-4 bg-emerald-400/10 border border-emerald-400/20 rounded-2xl">
                                                                        <Check className="w-4 h-4 text-emerald-400" />
                                                                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{user?.username} – Compte Synchronisé</span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="flex flex-col sm:flex-row gap-4">
                                                                <button onClick={() => window.print()} className="flex-1 py-6 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-neon-red hover:text-white transition-all">Sauvegarder Affiche</button>
                                                                <button
                                                                    onClick={async () => {
                                                                        const earnedXp = Math.floor((profit > 0 ? profit / 1000 : 0) + (attendance / 200));
                                                                        const earnedDrops = Math.floor((profit > 0 ? profit / 5000 : 0) + (attendance / 500));
                                                                        const newXp = (promoterXP || 0) + earnedXp;
                                                                        const newDrops = (drops || 0) + earnedDrops;

                                                                        setPromoterXP(newXp);
                                                                        setDrops(newDrops);
                                                                        localStorage.setItem('dropsiders_xp', newXp.toString());
                                                                        localStorage.setItem('dropsiders_drops', newDrops.toString());

                                                                        if (isLoggedIn) {
                                                                            updateScore('festival_producer', newXp);
                                                                        }

                                                                        if (playerEmail || isLoggedIn) {
                                                                            try {
                                                                                await fetch('/api/community/sync-xp', {
                                                                                    method: 'POST',
                                                                                    headers: { 'Content-Type': 'application/json' },
                                                                                    body: JSON.stringify({ email: playerEmail || user?.email, xp: newXp, drops: newDrops, level: currentRank.level })
                                                                                });
                                                                            } catch (e) {
                                                                                console.error('Cloud Sync failed', e);
                                                                            }
                                                                        }
                                                                        resetGame();
                                                                        alert(`Félicitations ! Vous avez gagné ${earnedXp} XP et ${earnedDrops} Drops${(playerEmail || isLoggedIn) ? ' – Progression synchronisée !' : ' – Sauvegardé localement.'}`);
                                                                    }}
                                                                    className="flex-1 py-6 bg-amber-400 text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-500 transition-all shadow-[0_10px_30px_rgba(251,191,36,0.2)]"
                                                                >
                                                                    {playerEmail ? 'SYNCHRONISER XP & QUITTER' : 'ENREGISTRER XP & TERMINER'}
                                                                </button>
                                                                <button onClick={resetGame} className="flex-1 py-6 bg-white/10 border border-white/20 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/20 transition-all">Nouveau Festival</button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Career Archives */}
                                                    <div className="p-10 bg-white/5 border border-white/10 rounded-[3rem] backdrop-blur-3xl space-y-8">
                                                        <div className="flex items-center gap-4">
                                                            <Trophy className="w-6 h-6 text-amber-400" />
                                                            <h3 className="text-xl font-black italic tracking-tighter uppercase text-white">Archives de Carrière</h3>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                                                            {archives.length === 0 ? (
                                                                <div className="col-span-full py-20 text-center opacity-20">
                                                                    <p className="text-[10px] font-black uppercase tracking-widest italic">Aucune archive disponible...</p>
                                                                </div>
                                                            ) : (
                                                                archives.map((entry, idx) => (
                                                                    <div key={idx} className="p-6 bg-white/[0.03] border border-white/5 rounded-2xl group hover:bg-white/[0.05] transition-all">
                                                                        <div className="flex justify-between items-start mb-4">
                                                                            <h4 className="text-[10px] font-black uppercase text-white group-hover:text-amber-400">{entry.festivalName}</h4>
                                                                            <span className="text-[8px] font-bold text-white/20 uppercase">{entry.date}</span>
                                                                        </div>
                                                                        <div className="flex justify-between items-end">
                                                                            <span className="text-[9px] font-bold text-white/40">{entry.location}</span>
                                                                            <span className={twMerge("text-xs font-black font-mono", entry.profit >= 0 ? "text-emerald-400" : "text-neon-red")}>{entry.profit.toLocaleString()}€</span>
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>

                                                        {/* Hall of Fame - NEW SECTION */}
                                                        <div className="pt-8 mt-8 border-t border-white/10 space-y-6">
                                                            <div className="flex items-center gap-4">
                                                                <Star className="w-6 h-6 text-amber-400" />
                                                                <h3 className="text-xl font-black italic tracking-tighter uppercase text-white">Hall of Fame (Légendes)</h3>
                                                            </div>
                                                            <div className="grid grid-cols-1 gap-3">
                                                                {hallOfFame.map((legend, idx) => (
                                                                    <div key={idx} className="p-4 bg-amber-400/5 border border-amber-400/10 rounded-xl flex justify-between items-center group hover:bg-amber-400/10 transition-all">
                                                                        <div className="flex flex-col">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em]">{legend.playerName}</span>
                                                                                {idx === 0 && <Trophy className="w-3 h-3 text-amber-400" />}
                                                                            </div>
                                                                            <span className="text-[9px] font-bold text-white/40 italic">{legend.festivalName}</span>
                                                                        </div>
                                                                        <span className="text-sm font-black text-amber-400 font-mono">+{legend.profit.toLocaleString()}€</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'AVIS' && (
                            <motion.div
                                key="avis"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                            >
                                <AvisSection />
                            </motion.div>
                        )}



                        {activeTab === 'COVOIT' && (
                            <motion.div
                                key="covoit"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <CovoitSection />
                            </motion.div>
                        )}



                        {activeTab === 'PLAYLISTS' && (
                            <motion.div
                                key="playlists"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -30 }}
                            >
                                <PlaylistSharing />
                            </motion.div>
                        )}

                        {activeTab === 'TRACK_ID' && (
                            <motion.div
                                key="track_id"
                                initial={{ opacity: 0, filter: 'blur(10px)' }}
                                animate={{ opacity: 1, filter: 'blur(0px)' }}
                                exit={{ opacity: 0, filter: 'blur(10px)' }}
                            >
                                <TrackIdForum />
                            </motion.div>
                        )}


                        {activeTab === 'LAB' && (
                            <motion.div
                                key="lab"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.1 }}
                            >
                                <DjNameGenerator />
                            </motion.div>
                        )}
                    </AnimatePresence>

                </div>
            </div>
            <AdminEditBar
                pageName="Communauté"
                pageActions={[
                    { label: 'Gérer les photos', icon: <Camera className="w-3.5 h-3.5" />, to: '/admin/manage?tab=Communauté', permission: 'community' },
                    { label: 'Modération', icon: <UsersIcon className="w-3.5 h-3.5" />, to: '/admin/manage?tab=Communauté', permission: 'community' },
                ]}
            />
        </>
    );
}

export default Community;
