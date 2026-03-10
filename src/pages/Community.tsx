import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Camera, Gamepad2, Star, Info, Car, Bell,
    Sparkles, Trophy, Plus, Check, AlertCircle,
    Music, Shield, Palette, Megaphone, Lock,
    RefreshCw, X, Heart, Ticket, Euro,
    Flame, Search, Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';
import { MemoryWall } from '../components/community/MemoryWall';
import { QuizSection } from '../components/community/QuizSection';
import { AvisSection } from '../components/community/AvisSection';
import { GuideSection } from '../components/community/GuideSection';
import { CovoitSection } from '../components/community/CovoitSection';
import { AlertsSection } from '../components/community/AlertsSection';
import galerieData from '../data/galerie.json';
import confetti from 'canvas-confetti';

// --- STAGE & LOCATION DATA ---
const FESTIVAL_LOCATIONS = [
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
    // --- GOD TIER / SUPERSTARS (1M€+) ---
    { id: 'calvin-harris', name: 'Calvin Harris', price: 1200000, genre: 'Dance Pop', popularity: 99, label: 'Sony Music', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Calvin_Harris_2012.jpg/800px-Calvin_Harris_2012.jpg' },
    { id: 'shm', name: 'Swedish House Mafia', price: 1000000, genre: 'House', popularity: 99, label: 'Republic', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Swedish_House_Mafia_-_Ushuaia.jpg/800px-Swedish_House_Mafia_-_Ushuaia.jpg' },
    { id: 'tiesto', name: 'Tiësto', price: 850000, genre: 'Big Room', popularity: 99, label: 'Musical Freedom', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Tiesto_%26_Logo.jpg/800px-Tiesto_%26_Logo.jpg' },
    { id: 'david-guetta', name: 'David Guetta', price: 900000, genre: 'Mainstage', popularity: 99, label: 'Warner', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/David_Guetta_Pau_2012.jpg/800px-David_Guetta_Pau_2012.jpg' },
    { id: 'fred-again', name: 'Fred again..', price: 1100000, genre: 'Live Electronic', popularity: 99, label: 'Atlantic', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Fred_again.._-_Pritat_-_2022.jpg/800px-Fred_again.._-_Pritat_-_2022.jpg' },
    { id: 'skrillex', name: 'Skrillex', price: 950000, genre: 'Bass Music', popularity: 99, label: 'Atlantic', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Skrillex_cropped.jpg/800px-Skrillex_cropped.jpg' },
    { id: 'martin-garrix', name: 'Martin Garrix', price: 800000, genre: 'Progressive House', popularity: 99, label: 'STMPD', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Martin_Garrix_2013-11-20_001.jpg/800px-Martin_Garrix_2013-11-20_001.jpg' },

    // --- HEADLINER TIER (400k - 750k€) ---
    { id: 'keinemusik', name: 'Keinemusik (&ME, Adam Port, Rampa)', price: 750000, genre: 'Afro House', popularity: 99, label: 'Keinemusik', image: 'https://i1.sndcdn.com/avatars-000499628310-j8m2j2-t500x500.jpg' },
    { id: 'anyma', name: 'Anyma', price: 650000, genre: 'Melodic Techno', popularity: 99, label: 'Afterlife', image: 'https://i1.sndcdn.com/avatars-T3WXZtGkY0J8Z8V6-X6rQGQ-t500x500.jpg' },
    { id: 'tale-of-us', name: 'Tale of Us', price: 550000, genre: 'Melodic Techno', popularity: 98, label: 'Afterlife', image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'charlotte-de-witte', name: 'Charlotte de Witte', price: 500000, genre: 'Techno', popularity: 99, label: 'KNTXT', image: 'https://i1.sndcdn.com/avatars-000570887142-v3v3v3-t500x500.jpg' },
    { id: 'amelie-lens', name: 'Amelie Lens', price: 450000, genre: 'Techno', popularity: 98, label: 'Lenske', image: 'https://i1.sndcdn.com/avatars-000499628310-j8m2j2-t500x500.jpg' },
    { id: 'fisher', name: 'Fisher', price: 600000, genre: 'Tech House', popularity: 99, label: 'Catch & Release', image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'peggy-gou', name: 'Peggy Gou', price: 480000, genre: 'House', popularity: 98, image: 'https://i1.sndcdn.com/avatars-000499628310-j8m2j2-t500x500.jpg' },
    { id: 'black-coffee', name: 'Black Coffee', price: 450000, genre: 'Afro House', popularity: 98, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Black_Coffee_2015.jpg/800px-Black_Coffee_2015.jpg' },
    { id: 'solomun', name: 'Solomun', price: 500000, genre: 'Deep House', popularity: 98, label: 'Diynamic', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Solomun_@_Tomorrowland_2015.jpg/800px-Solomun_@_Tomorrowland_2015.jpg' },
    { id: 'carl-cox', name: 'Carl Cox', price: 550000, genre: 'Techno', popularity: 99, label: 'Intec', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Carl_Cox_2011.jpg/800px-Carl_Cox_2011.jpg' },
    { id: 'hardwell', name: 'Hardwell', price: 480000, genre: 'Big Room Techno', popularity: 98, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Hardwell_NRJ_Music_Awards_2014.jpg/800px-Hardwell_NRJ_Music_Awards_2014.jpg' },
    { id: 'armin-van-buuren', name: 'Armin van Buuren', price: 500000, genre: 'Trance', popularity: 98, label: 'Armada', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Armin_van_Buuren_Electronic_Family_2013-07-20_003.jpg/800px-Armin_van_Buuren_Electronic_Family_2013-07-20_003.jpg' },
    { id: 'kygo', name: 'Kygo', price: 700000, genre: 'Tropical House', popularity: 99, label: 'Sony', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Kygo_NRJ_Music_Awards_2017.jpg/800px-Kygo_NRJ_Music_Awards_2017.jpg' },

    // --- TRENDING / CONTROVERSIAL (Prices based on current news) ---
    { id: 'fantasm', name: 'Fantasm', price: 25000, genre: 'Hard Techno', popularity: 40, label: 'Controverse', image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'marlon-hoffstadt', name: 'Marlon Hoffstadt', price: 350000, genre: 'Eurodance', popularity: 96, label: 'Trend: Daddy Trance', image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'oguz', name: 'Oguz', price: 180000, genre: 'Hard Techno', popularity: 94, label: 'Trend: 808', image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },

    // --- MAIN SUPPORT TIER (50k - 250k€) ---
    { id: 'francis-mercier', name: 'Francis Mercier', price: 95000, genre: 'Afro House', popularity: 95, label: 'Deep Root Records', image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'john-summit', name: 'John Summit', price: 350000, genre: 'Tech House', popularity: 98, label: 'Experts Only', image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'dom-dolla', name: 'Dom Dolla', price: 340000, genre: 'Tech House', popularity: 97, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'james-hype', name: 'James Hype', price: 280000, genre: 'Tech House', popularity: 98, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'vintage-culture', name: 'Vintage Culture', price: 320000, genre: 'House', popularity: 97, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'boris-brejcha', name: 'Boris Brejcha', price: 320000, genre: 'High-Tech Minimal', popularity: 98, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'artbat', name: 'Artbat', price: 300000, genre: 'Melodic Techno', popularity: 97, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'camelphat', name: 'Camelphat', price: 320000, genre: 'Melodic House', popularity: 97, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'meduza', name: 'Meduza', price: 280000, genre: 'House', popularity: 97, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'michael-bibi', name: 'Michael Bibi', price: 300000, genre: 'Tech House', popularity: 96, label: 'Solid Grooves', image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'mau-p', name: 'Mau P', price: 220000, genre: 'Tech House', popularity: 97, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'mochakk', name: 'Mochakk', price: 240000, genre: 'Tech House', popularity: 97, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'i-hate-models', name: 'I Hate Models', price: 220000, genre: 'Industrial Techno', popularity: 95, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'adam-beyer', name: 'Adam Beyer', price: 260000, genre: 'Techno', popularity: 97, label: 'Drumcode', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Adam_Beyer.jpg/800px-Adam_Beyer.jpg' },
    { id: 'adriatique', name: 'Adriatique', price: 280000, genre: 'Melodic House', popularity: 96, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'nina-kraviz', name: 'Nina Kraviz', price: 250000, genre: 'Techno', popularity: 96, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Nina_Kraviz_Berghain_2011.jpg/800px-Nina_Kraviz_Berghain_2011.jpg' },
    { id: 'indira-paganotto', name: 'Indira Paganotto', price: 180000, genre: 'Psy-Techno', popularity: 94, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'sara-landry', name: 'Sara Landry', price: 200000, genre: 'Hard Techno', popularity: 95, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'klangkuenstler', name: 'Klangkuenstler', price: 180000, genre: 'Hard Techno', popularity: 94, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'reinier-zonneveld', name: 'Reinier Zonneveld', price: 190000, genre: 'Acid Techno', popularity: 95, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'richie-hawtin', name: 'Richie Hawtin', price: 320000, genre: 'Legend', popularity: 98, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Richie_Hawtin_2011.jpg/800px-Richie_Hawtin_2011.jpg' },
    { id: 'jeff-mills', name: 'Jeff Mills', price: 320000, genre: 'Legend', popularity: 98, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Jeff_Mills_2004.jpg/800px-Jeff_Mills_2004.jpg' },
    { id: 'the-martinez-brothers', name: 'The Martinez Brothers', price: 300000, genre: 'Tech House', popularity: 97, label: 'Cuttin\' Headz', image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'pawsa', name: 'PAWSA', price: 180000, genre: 'Tech House', popularity: 96, label: 'Solid Grooves', image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'skepta', name: 'Skepta (Mas Tiempo)', price: 150000, genre: 'House', popularity: 96, label: 'Mas Tiempo', image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'honey-dijon', name: 'Honey Dijon', price: 140000, genre: 'House', popularity: 96, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },

    // --- SUPPORT / RISING STARS (2k - 40k€) ---
    { id: 'notre-dame', name: 'Notre Dame', price: 18000, genre: 'Melodic House', popularity: 92, label: 'Diynamic', image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'maz', name: 'Maz', price: 15000, genre: 'Afro House', popularity: 93, label: 'Dawn Patrol', image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'hugel', name: 'Hugel', price: 45000, genre: 'Latin House', popularity: 93, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'wade', name: 'Wade', price: 40000, genre: 'Tech House', popularity: 95, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'cassian', name: 'Cassian', price: 35000, genre: 'Melodic Techno', popularity: 94, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'mont-rouge', name: 'Mont Rouge', price: 12000, genre: 'Afro House', popularity: 91, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'mita-gami', name: 'Mita Gami', price: 10000, genre: 'Indie Dance', popularity: 87, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'adam-ten', name: 'Adam Ten', price: 10000, genre: 'Indie Dance', popularity: 86, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'samm', name: 'Samm', price: 8500, genre: 'Afro House', popularity: 89, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'ajna', name: 'Ajna', price: 8500, genre: 'Afro House', popularity: 89, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'topic', name: 'Topic', price: 45000, genre: 'Dance Pop', popularity: 95, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'mesto', name: 'Mesto', price: 15000, genre: 'Future House', popularity: 88, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'azzecca', name: 'Azzecca', price: 6000, genre: 'House', popularity: 85, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'sam-wolfe', name: 'Sam WOLFE', price: 5500, genre: 'Techno', popularity: 84, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'zorza', name: 'Zorza', price: 4500, genre: 'Techno', popularity: 82, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'robin-tordjman', name: 'Robin Tordjman', price: 2500, genre: 'Afro House', popularity: 90, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
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
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'WALL' | 'PHOTOS' | 'QUIZZ' | 'AVIS' | 'GUIDE' | 'COVOIT' | 'ALERTS' | 'GAME'>('WALL');

    // Game State
    const [gameStarted, setGameStarted] = useState(false);
    const [budget, setBudget] = useState(0);
    const [selectedDjs, setSelectedDjs] = useState<typeof DJ_POOL>([]);
    const [selectedCosts, setSelectedCosts] = useState<string[]>([]);
    const [gameState, setGameState] = useState<'ONBOARDING' | 'LOCATION' | 'DATE' | 'LOGISTICS' | 'STAGES' | 'BOOKING' | 'GENERATION' | 'RESULTS'>('ONBOARDING');
    const [bookingStatus, setBookingStatus] = useState<{ djId: string; status: 'PENDING' | 'ACCEPTED' | 'REJECTED'; message: string } | null>(null);
    const [ticketingProgress, setTicketingProgress] = useState(0);
    const [weather, setWeather] = useState<'CLEAR' | 'RAIN' | 'HEAT'>('CLEAR');

    // RPG State
    const [promoterXP, setPromoterXP] = useState(() => Number(localStorage.getItem('dropsiders_xp')) || 0);
    const [selectedEffects, setSelectedEffects] = useState<string[]>([]);
    const [negotiatingDj, setNegotiatingDj] = useState<typeof DJ_POOL[0] | null>(null);
    const [aftermovieSummary, setAftermovieSummary] = useState('');

    // Player Info
    const [playerName, setPlayerName] = useState('');
    const [playerEmail, setPlayerEmail] = useState('');
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
    useMemo(() => {
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

        if (newTip && newTip.tip !== advisorTip?.tip) {
            setAdvisorTip(newTip);
        }
    }, [selectedDjs, selectedCosts, selectedDate, gameState]);

    const [isPriceRising, setIsPriceRising] = useState(false);
    useMemo(() => {
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
        return () => clearInterval(timer);
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
        <div className={twMerge(
            "min-h-screen transition-colors duration-1000 pb-32 pt-24",
            isNightMode ? "bg-[#020202]" : "bg-[#050505]",
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

            <div className="relative z-10 container mx-auto px-4 md:px-12">
                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8"
                >
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 bg-neon-red/10 rounded-xl">
                                <Users className="w-6 h-6 text-neon-red" />
                            </div>
                            <span className="text-neon-red font-black tracking-[0.3em] text-[10px] uppercase">Espace Communauté</span>
                        </div>
                        <h1 className="text-5xl md:text-8xl font-display font-black mb-4 uppercase italic tracking-tighter">
                            DROPSIDERS <span className="text-neon-red drop-shadow-[0_0_20px_rgba(255,0,51,0.5)]">LAB</span>
                        </h1>
                        <p className="text-white/40 max-w-xl text-xs font-black uppercase tracking-widest leading-loose">
                            Connectez-vous avec la scène, partagez vos récaps, et créez vos propres expériences. Le futur des festivals s'écrit ici.
                        </p>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.05, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/communaute/partager')}
                        className="group relative px-8 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(255,255,255,0.05)] hover:bg-neon-red hover:text-white transition-all duration-500 overflow-hidden"
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
                <div className="mb-16">
                    <div className="flex flex-wrap items-center gap-3 p-1.5 bg-white/5 backdrop-blur-3xl rounded-3xl w-fit border border-white/10">
                        {[
                            { id: 'WALL', icon: Star, label: 'Mur de Souvenirs' },
                            { id: 'PHOTOS', icon: Camera, label: 'Albums Photo' },
                            { id: 'QUIZZ', icon: Gamepad2, label: 'Défis & Quiz' },
                            { id: 'GAME', icon: Sparkles, iconClass: 'text-amber-400', label: 'Tycoon Festival' },
                            { id: 'AVIS', icon: Heart, label: 'Avis' },
                            { id: 'GUIDE', icon: Info, label: 'Guide Pratique' },
                            { id: 'COVOIT', icon: Car, label: 'Covoiturage' },
                            { id: 'ALERTS', icon: Bell, label: 'Alertes' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all relative group ${activeTab === tab.id ? 'text-black' : 'text-white/40 hover:text-white'}`}
                            >
                                {activeTab === tab.id && (
                                    <motion.div
                                        layoutId="community-tab-bg-v2"
                                        className="absolute inset-0 bg-white shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                                        style={{ borderRadius: '16px' }}
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <tab.icon className={`w-4 h-4 relative z-10 transition-colors ${activeTab === tab.id ? 'text-neon-red' : tab.iconClass || 'group-hover:text-neon-red'}`} />
                                <span className="relative z-10 tracking-widest">{tab.label}</span>
                            </button>
                        ))}
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

                    {activeTab === 'QUIZZ' && (
                        <motion.div
                            key="quizz"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                        >
                            <QuizSection />
                        </motion.div>
                    )}

                    {activeTab === 'PHOTOS' && (
                        <motion.div
                            key="photos"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
                        >
                            {/* Reuse Galerie components or similar styled cards */}
                            {galerieData.slice(0, 8).map((album, idx) => (
                                <motion.div
                                    key={album.id}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="group relative aspect-[4/5] bg-white/5 rounded-[2rem] overflow-hidden border border-white/10 hover:border-white/30 transition-all duration-700 shadow-2xl"
                                >
                                    <img
                                        src={album.cover}
                                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-60 group-hover:opacity-100"
                                        alt=""
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                                    <div className="absolute bottom-0 left-0 right-0 p-8">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="px-2 py-0.5 bg-neon-red text-white text-[8px] font-black uppercase tracking-wider rounded-md">
                                                {album.category}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-display font-black text-white uppercase italic tracking-tighter leading-tight group-hover:text-neon-red transition-colors">
                                            {album.title}
                                        </h3>
                                        <p className="text-[9px] text-white/40 font-black uppercase tracking-[0.2em] mt-3">
                                            {album.date} • {album.images.length} Photos
                                        </p>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        className="absolute top-6 right-6 w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => navigate(`/galerie/${album.id}`)}
                                    >
                                        <Plus className="w-5 h-5 text-white" />
                                    </motion.button>
                                </motion.div>
                            ))}
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
                                        DEVIENS <span className="text-amber-400">ORGANISATEUR</span>
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
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black uppercase text-white/40 ml-4">Email Contact</label>
                                                            <input type="email" value={playerEmail} onChange={(e) => setPlayerEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-xl font-black uppercase focus:border-amber-400 outline-none" placeholder="PRO@DROPSIDERS.COM" />
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
                                                <button disabled={!playerName || !festivalName || !playerEmail} onClick={() => setGameState('LOCATION')} className="w-full py-8 bg-white text-black rounded-3xl font-black text-xs uppercase tracking-[0.4em] disabled:opacity-20 hover:bg-amber-400 transition-all">VALIDER ET CONTINUER →</button>
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
                                            <div className="lg:col-span-12 xl:col-span-5">
                                                <motion.div
                                                    initial={{ scale: 0.9, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    className={twMerge(
                                                        "relative aspect-[1.3/2] border-[12px] shadow-[0_60px_120px_rgba(0,0,0,0.9)] rounded-[2.5rem] p-8 md:p-12 overflow-hidden bg-[#050505]",
                                                        posterStyle === 'ULTRA' ? "border-white" :
                                                            posterStyle === 'TOMORROWLAND' ? "border-[#d4af37]" : "border-white/10"
                                                    )}
                                                >
                                                    <div className="relative z-10 h-full flex flex-col items-center text-center">
                                                        <div className="mb-12">
                                                            <div className="text-[10px] font-black text-amber-400 uppercase tracking-[0.5em] mb-4">World Premiere</div>
                                                            <h3 className="text-4xl md:text-6xl font-display font-black uppercase text-white italic tracking-tighter leading-none">{festivalName}</h3>
                                                        </div>
                                                        <div className="flex-1 w-full space-y-6">
                                                            {selectedDjs.map((dj, i) => (
                                                                <div key={dj.id} className={twMerge("font-black uppercase tracking-widest", i === 0 ? "text-4xl text-white" : "text-xl text-white/50")}>
                                                                    {dj.name}
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="mt-auto pt-10 border-t border-white/10 w-full text-white/20 text-[9px] font-black uppercase tracking-[0.6em]">
                                                            {selectedLocation.name} • {selectedDate}
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

                                                    <div className="flex flex-col sm:flex-row gap-4">
                                                        <button onClick={() => window.print()} className="flex-1 py-6 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-neon-red hover:text-white transition-all">Sauvegarder Affiche</button>
                                                        <button onClick={resetGame} className="flex-1 py-6 bg-white/10 border border-white/20 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/20 transition-all">Nouveau Festival</button>
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

                    {activeTab === 'GUIDE' && (
                        <motion.div
                            key="guide"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <GuideSection />
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

                    {activeTab === 'ALERTS' && (
                        <motion.div
                            key="alerts"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <AlertsSection />
                        </motion.div>
                    )}
                </AnimatePresence>

                {activeTab !== 'GAME' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        className="mt-32 p-12 md:p-24 bg-gradient-to-br from-neon-red/[0.05] to-neon-cyan/[0.05] border border-white/10 rounded-[4rem] text-center"
                    >
                        <h2 className="text-4xl md:text-6xl font-display font-black mb-8 uppercase italic tracking-tighter">
                            REJOINS LE <span className="text-neon-cyan">MOUVEMENT</span>
                        </h2>
                        <p className="text-white/40 max-w-2xl mx-auto text-xs font-black uppercase tracking-[0.3em] leading-loose mb-12">
                            Abonne-toi à notre newsletter pour ne rien rater des futures extensions du Lab Dropsiders.
                        </p>
                        <div className="flex flex-col md:flex-row gap-4 max-w-md mx-auto">
                            <input
                                type="email"
                                placeholder="TON.EMAIL@FESTIVAL.FR"
                                className="flex-1 px-8 py-5 bg-black/40 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-neon-red transition-colors"
                            />
                            <button className="px-10 py-5 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-neon-red hover:text-white transition-all">
                                OK
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}

export default Community;
