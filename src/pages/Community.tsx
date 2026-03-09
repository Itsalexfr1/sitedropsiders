import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Camera, Gamepad2, Star, Info, Car, Bell,
    Sparkles, Trophy, Plus, Check, AlertCircle,
    Music, Shield, Palette, Megaphone,
    RefreshCw, X, Download, Heart,
    Flame, Share2, Instagram, Facebook, Twitter, Search, Filter
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
    { id: 'boom', name: 'Boom - De Schorre (TML)', cost: 450000, prestige: 10, capacity: 200000 },
    { id: 'alpe-dhuez', name: "Alpe d'Huez (TML Winter)", cost: 280000, prestige: 8, capacity: 25000 },
    { id: 'itu', name: 'Itu - São Paulo (TML BR)', cost: 180000, prestige: 6, capacity: 150000 },

    // ULTRA MUSIC FESTIVAL
    { id: 'miami', name: 'Miami - Bayfront Park (UMF)', cost: 550000, prestige: 10, capacity: 165000 },
    { id: 'split', name: 'Split - Park Mladeži (Ultra EU)', cost: 220000, prestige: 8, capacity: 120000 },
    { id: 'johannesburg', name: 'Jo\'burg - Expo Centre (Ultra SA)', cost: 140000, prestige: 6, capacity: 80000 },
    { id: 'sejong', name: 'Seoul - Olympic Stadium (Ultra KR)', cost: 190000, prestige: 7, capacity: 100000 },
    { id: 'tokyo', name: 'Tokyo - Odaiba (Ultra JP)', cost: 240000, prestige: 8, capacity: 100000 },

    // EDC
    { id: 'vegas', name: 'Vegas - Speedway (EDC LV)', cost: 600000, prestige: 10, capacity: 450000 },
    { id: 'mexico', name: 'CDMX - Autódromo (EDC MX)', cost: 210000, prestige: 7, capacity: 120000 },
    { id: 'orlando', name: 'Orlando - Tinker Field (EDC ORL)', cost: 170000, prestige: 6, capacity: 90000 },

    // CONCERT HALLS, STADIUMS & SUPER-CLUBS
    { id: 'sphere', name: 'Vegas - MSG Sphere', cost: 750000, prestige: 10, capacity: 18000 },
    { id: 'omnia', name: 'Vegas - Omnia Club', cost: 400000, prestige: 9, capacity: 3500 },
    { id: 'space-miami', name: 'Miami - Club Space', cost: 350000, prestige: 9, capacity: 2500 },
    { id: 'ushuaia', name: 'Ibiza - Ushuaïa', cost: 450000, prestige: 10, capacity: 7000 },
    { id: 'hi-ibiza', name: 'Ibiza - Hï Ibiza', cost: 430000, prestige: 10, capacity: 5000 },
    { id: 'stade-france', name: 'Paris - Stade de France', cost: 500000, prestige: 9, capacity: 80000 },
    { id: 'wembley', name: 'London - Wembley Stadium', cost: 550000, prestige: 9, capacity: 90000 },
    { id: 'msg', name: 'NYC - Madison Sq Garden', cost: 420000, prestige: 9, capacity: 20000 },
    { id: 'red-rocks', name: 'Colorado - Red Rocks', cost: 220000, prestige: 8, capacity: 9500 },
    { id: 'berghain', name: 'Berlin - Berghain (Main)', cost: 130000, prestige: 9, capacity: 1500 },
    { id: 'gashouder', name: 'Amsterdam - Gashouder', cost: 280000, prestige: 8, capacity: 3500 },

    // CLASSICS
    { id: 'paris', name: 'Paris - Longchamp', cost: 150000, prestige: 7, capacity: 50000 },
    { id: 'ibiza', name: 'Ibiza - Playa d\'en Bossa', cost: 350000, prestige: 8, capacity: 100000 },
    { id: 'lyon', name: 'Lyon - Eurexpo', cost: 80000, prestige: 5, capacity: 30000 },
    { id: 'berlin', name: 'Berlin - Tempelhof', cost: 120000, prestige: 7, capacity: 40000 },
];

const SPONSORS = [
    { id: 'redbull', name: 'Red Bull', bonus: 150000, impact: 'hype', desc: '+150k€ & Boost de Hype' },
    { id: 'pioneer', name: 'Pioneer DJ', bonus: 80000, impact: 'tech', desc: '+80k€ & Scénographie Pro' },
    { id: 'mercedes', name: 'Mercedes-Benz', bonus: 250000, impact: 'luxury', desc: '+250k€ & Prestige VIP' },
    { id: 'heineken', name: 'Heineken', bonus: 120000, impact: 'commercial', desc: '+120k€ & Ventes Boissons' },
];

const RANDOM_EVENTS = [
    { id: 'rain', name: 'Orage Violent', impact: -0.2, message: 'Un orage frappe le site ! -20% de ventes sur place.' },
    { id: 'viral', name: 'TikTok Viral', impact: 0.3, message: 'Ta line-up devient virale sur TikTok ! +30% de hype.' },
    { id: 'cancel', name: 'Grève des Transports', impact: -0.15, message: 'Grève des trains ! Certains fans ne peuvent pas venir. -15%.' },
    { id: 'soldout', name: 'Sold Out Flash', impact: 0.1, message: 'Les billets s\'arrachent en 2 minutes ! +10% de profit.' },
];

const STAGE_COST_PER_UNIT = 100000;

// --- HALL OF FAME MOCK DATA ---
const HALL_OF_FAME = [
    { id: 'h1', playerName: 'Alex', festivalName: 'NEON WAVE', djs: ['Boris Brejcha', 'Charlotte de Witte', 'Amelie Lens'], budget: '2.4M€', date: 'Juin 2026', likes: 124, location: 'Ibiza - Hï Ibiza' },
    { id: 'h2', playerName: 'Lucas', festivalName: 'BASS MOUNTAIN', djs: ['Skrillex', 'Fred again..', 'I Hate Models'], budget: '4.1M€', date: 'Août 2026', likes: 89, location: 'Vegas - Speedway (EDC LV)' },
    { id: 'h3', playerName: 'Emma', festivalName: 'TECHNO GARDEN', djs: ['Nina Kraviz', 'Carl Cox', 'Adam Beyer'], budget: '1.8M€', date: 'Juillet 2026', likes: 256, location: 'Paris - Stade de France' },
];

// --- FESTIVAL CREATOR GAME DATA ---
const DJ_POOL = [
    // --- HEADLINERS & MAINSTREAM ---
    { id: 'dg', name: 'David Guetta', price: 450000, genre: 'Mainstage', popularity: 99 },
    { id: 'tiesto', name: 'Tiësto', price: 400000, genre: 'Big Room', popularity: 99 },
    { id: 'mh', name: 'Martin Garrix', price: 380000, genre: 'Progressive House', popularity: 99 },
    { id: 'av', name: 'Armin van Buuren', price: 320000, genre: 'Trance', popularity: 98 },
    { id: 'alok', name: 'Alok', price: 280000, genre: 'Slap House', popularity: 97 },
    { id: 'tt', name: 'Timmy Trumpet', price: 250000, genre: 'Psytrance', popularity: 96 },
    { id: 'aj', name: 'Afrojack', price: 220000, genre: 'Dutch House', popularity: 95 },
    { id: 'h', name: 'Hardwell', price: 350000, genre: 'Big Room Techno', popularity: 98 },
    { id: 'sa', name: 'Steve Aoki', price: 280000, genre: 'Electro House', popularity: 97 },
    { id: 'aw', name: 'Alan Walker', price: 320000, genre: 'Future Bass', popularity: 98 },
    { id: 'k', name: 'KSHMR', price: 210000, genre: 'Mainstage', popularity: 94 },
    { id: 'dd', name: 'Don Diablo', price: 190000, genre: 'Future House', popularity: 93 },
    { id: 'r3', name: 'R3HAB', price: 180000, genre: 'Dance', popularity: 94 },
    { id: 'lf', name: 'Lost Frequencies', price: 220000, genre: 'Deep House', popularity: 96 },
    { id: 'ww', name: 'W&W', price: 200000, genre: 'Big Room', popularity: 95 },
    { id: 'ch', name: 'Calvin Harris', price: 950000, genre: 'Dance Pop', popularity: 99 },
    { id: 'nr', name: 'Nicky Romero', price: 160000, genre: 'Progressive', popularity: 94 },
    { id: 'oh', name: 'Oliver Heldens', price: 210000, genre: 'Future House', popularity: 96 },
    { id: 'ds', name: 'DJ Snake', price: 380000, genre: 'Trap', popularity: 98 },
    { id: 'ms', name: 'Marshmello', price: 450000, genre: 'Future Bass', popularity: 99 },
    { id: 'alesso', name: 'Alesso', price: 320000, genre: 'Progressive House', popularity: 98 },
    { id: 'ep', name: 'Eric Prydz', price: 420000, genre: 'Progressive House', popularity: 99 },
    { id: 'z', name: 'Zedd', price: 280000, genre: 'Electro Pop', popularity: 97 },
    { id: 'dvlm', name: 'Dimitri Vegas & Like Mike', price: 350000, genre: 'Big Room', popularity: 98 },
    { id: 'shm', name: 'Swedish House Mafia', price: 850000, genre: 'House', popularity: 99 },

    // --- TECH HOUSE / HOUSE / MINIMAL ---
    { id: 'js', name: 'John Summit', price: 250000, genre: 'Tech House', popularity: 98 },
    { id: 'm', name: 'Mochakk', price: 220000, genre: 'Tech House', popularity: 97 },
    { id: 'bb', name: 'Michael Bibi', price: 240000, genre: 'Tech House', popularity: 96 },
    { id: 'fg', name: 'Fisher', price: 350000, genre: 'Tech House', popularity: 99 },
    { id: 'pg', name: 'Peggy Gou', price: 280000, genre: 'House', popularity: 98 },
    { id: 'fa', name: 'Fred again..', price: 500000, genre: 'Future Garage', popularity: 99 },
    { id: 'ca', name: 'Cassian', price: 120000, genre: 'Melodic Techno', popularity: 94 },
    { id: 'p', name: 'Pawsa', price: 140000, genre: 'Minimal House', popularity: 93 },
    { id: 'an', name: 'Anotr', price: 160000, genre: 'No Art', popularity: 95 },
    { id: 'cl', name: 'Chris Lake', price: 220000, genre: 'Tech House', popularity: 97 },
    { id: 'mp', name: 'Mau P', price: 180000, genre: 'Tech House', popularity: 97 },
    { id: 'jj', name: 'Jamie Jones', price: 200000, genre: 'House', popularity: 96 },
    { id: 'clap', name: 'Claptone', price: 150000, genre: 'House', popularity: 95 },
    { id: 'the-martinez', name: 'Martinez Brothers', price: 220000, genre: 'House', popularity: 96 },
    { id: 'gorgon-city', name: 'Gorgon City', price: 140000, genre: 'House', popularity: 94 },
    { id: 'vintage-culture', name: 'Vintage Culture', price: 260000, genre: 'House', popularity: 97 },
    { id: 'dom-dolla', name: 'Dom Dolla', price: 240000, genre: 'Tech House', popularity: 97 },
    { id: 'cloonee', name: 'Cloonee', price: 130000, genre: 'Tech House', popularity: 93 },
    { id: 'solardo', name: 'Solardo', price: 110000, genre: 'Tech House', popularity: 92 },
    { id: 'camelphat', name: 'Camelphat', price: 250000, genre: 'Melodic House', popularity: 97 },
    { id: 'meduza', name: 'Meduza', price: 240000, genre: 'Tech House', popularity: 97 },

    // --- TECHNO ---
    { id: 'cdw', name: 'Charlotte de Witte', price: 300000, genre: 'Techno', popularity: 99 },
    { id: 'al', name: 'Amelie Lens', price: 280000, genre: 'Techno', popularity: 98 },
    { id: 'cc', name: 'Carl Cox', price: 350000, genre: 'Legendary', popularity: 99 },
    { id: 'ab', name: 'Adam Beyer', price: 200000, genre: 'Techno', popularity: 97 },
    { id: 'nk', name: 'Nina Kraviz', price: 220000, genre: 'Techno', popularity: 96 },
    { id: 'ihm', name: 'I Hate Models', price: 180000, genre: 'Industrial', popularity: 95 },
    { id: 'br', name: 'Boris Brejcha', price: 250000, genre: 'High-Tech Minimal', popularity: 98 },
    { id: 'kb', name: 'Klangkuenstler', price: 190000, genre: 'Hard Techno', popularity: 96 },
    { id: 'ip', name: 'Indira Paganotto', price: 160000, genre: 'Psy-Techno', popularity: 94 },
    { id: 'sara-landry', name: 'Sara Landry', price: 150000, genre: 'Hard Techno', popularity: 93 },
    { id: 'deborah-de-luca', name: 'Deborah De Luca', price: 170000, genre: 'Techno', popularity: 95 },
    { id: 'enrico-sangiuliano', name: 'Enrico Sangiuliano', price: 140000, genre: 'Techno', popularity: 93 },
    { id: 'reinier-zonneveld', name: 'Reinier Zonneveld', price: 190000, genre: 'Acid Techno', popularity: 96 },
    { id: 'nicole-moudaber', name: 'Nicole Moudaber', price: 130000, genre: 'Techno', popularity: 92 },
    { id: 'pan-pot', name: 'Pan-Pot', price: 120000, genre: 'Techno', popularity: 92 },
    { id: 'maceo-plex', name: 'Maceo Plex', price: 180000, genre: 'Melodic Techno', popularity: 95 },
    { id: 'tale-of-us', name: 'Tale of Us', price: 450000, genre: 'Afterlife', popularity: 99 },
    { id: 'anyma', name: 'Anyma', price: 350000, genre: 'Afterlife', popularity: 98 },
    { id: 'innellea', name: 'Innellea', price: 110000, genre: 'Melodic Techno', popularity: 92 },
    { id: 'kevin-de-vries', name: 'Kevin de Vries', price: 100000, genre: 'Melodic Techno', popularity: 91 },

    // --- MELODIC / PROGRESSIVE / AFRO ---
    { id: 'ko', name: 'Keinemusik (CRME)', price: 750000, genre: 'Afro House', popularity: 99 },
    { id: 'bo', name: 'Black Coffee', price: 300000, genre: 'Afro House', popularity: 98 },
    { id: 'ru', name: 'Rüfüs Du Sol', price: 600000, genre: 'Live Electronic', popularity: 99 },
    { id: 'at', name: 'Anyma / Tale of Us', price: 550000, genre: 'Afterlife', popularity: 99 },
    { id: 'la', name: 'Lane 8', price: 180000, genre: 'Melodic House', popularity: 95 },
    { id: 'solomun', name: 'Solomun', price: 350000, genre: 'Deep House', popularity: 98 },
    { id: 'ben-boehmer', name: 'Ben Böhmer', price: 180000, genre: 'Melodic', popularity: 95 },
    { id: 'adriatique', name: 'Adriatique', price: 220000, genre: 'Melodic', popularity: 96 },
    { id: 'monolink', name: 'Monolink', price: 190000, genre: 'Live', popularity: 95 },
    { id: 'artbat', name: 'Artbat', price: 260000, genre: 'Melodic Techno', popularity: 97 },
    { id: 'yotto', name: 'Yotto', price: 95000, genre: 'Melodic', popularity: 91 },
    { id: 'tinlicker', name: 'Tinlicker', price: 110000, genre: 'Melodic', popularity: 92 },
    { id: 'gioli-assia', name: 'Giolì & Assia', price: 130000, genre: 'Live', popularity: 93 },

    // --- BASS / DUBSTEP / TRAP ---
    { id: 'sk', name: 'Skrillex', price: 420000, genre: 'Bass Music', popularity: 99 },
    { id: 'ex', name: 'Excision', price: 350000, genre: 'Dubstep', popularity: 98 },
    { id: 'su', name: 'Subtronics', price: 220000, genre: 'Bass', popularity: 97 },
    { id: 'ng', name: 'NGHTMRE', price: 140000, genre: 'Trap', popularity: 94 },
    { id: 'illumineum', name: 'Illenium', price: 350000, genre: 'Future Bass', popularity: 98 },
    { id: 'rezz', name: 'Rezz', price: 240000, genre: 'Mid-Tempo', popularity: 96 },
    { id: 'zeds-dead', name: 'Zeds Dead', price: 220000, genre: 'Bass House', popularity: 96 },
    { id: 'liquid-stranger', name: 'Liquid Stranger', price: 150000, genre: 'Freeform Bass', popularity: 93 },
    { id: 'peekaboo', name: 'Peekaboo', price: 90000, genre: 'Dubstep', popularity: 90 },
    { id: 'slander', name: 'Slander', price: 280000, genre: 'Heaven Trap', popularity: 97 },
    { id: 'isoxo', name: 'IsoXo', price: 110000, genre: 'Trap', popularity: 92 },
    { id: 'knock2', name: 'Knock2', price: 120000, genre: 'Bass House', popularity: 93 },

    // --- RISING STARS / FUTURE HEROES ---
    { id: 'me', name: 'Mesto', price: 45000, genre: 'Future House', popularity: 88 },
    { id: 'jo', name: 'Joel Corry', price: 120000, genre: 'Dance', popularity: 96 },
    { id: 'hu', name: 'Hugel', price: 95000, genre: 'Latin House', popularity: 93 },
    { id: 'of', name: 'Öwnboss', price: 85000, genre: 'Bass House', popularity: 91 },
    { id: 'azim', name: 'Azzecca', price: 40000, genre: 'House', popularity: 85 },
    { id: 'adamten', name: 'Adam Ten', price: 45000, genre: 'Indie Dance', popularity: 86 },
    { id: 'zorza', name: 'Zorza', price: 35000, genre: 'Techno', popularity: 82 },
    { id: 'sam-wolfe', name: 'Sam WOLFE', price: 40000, genre: 'Techno', popularity: 84 },
    { id: 'nitti', name: 'NITTI', price: 65000, genre: 'House', popularity: 88 },
    { id: 'meduso', name: 'Meduso', price: 35000, genre: 'Bass', popularity: 82 },
    { id: 'eliminate', name: 'Eliminate', price: 55000, genre: 'Bass', popularity: 87 },
    { id: 'fairlane', name: 'Fairlane', price: 45000, genre: 'Future Bass', popularity: 86 },
    { id: 'acraze', name: 'Acraze', price: 110000, genre: 'House', popularity: 94 },
    { id: 'topic', name: 'Topic', price: 130000, genre: 'Dance Pop', popularity: 95 },
    { id: 'sigala', name: 'Sigala', price: 110000, genre: 'Dance Pop', popularity: 94 },
    { id: 'jonas-blue', name: 'Jonas Blue', price: 140000, genre: 'Tropical House', popularity: 95 },
    { id: 'kygo', name: 'Kygo', price: 650000, genre: 'Tropical House', popularity: 99 },
    { id: 'chainsmokers', name: 'The Chainsmokers', price: 700000, genre: 'Electro Pop', popularity: 99 },
    { id: 'marsh', name: 'Marsh', price: 65000, genre: 'Progressive House', popularity: 89 },
    { id: 'cristoph', name: 'Cristoph', price: 75000, genre: 'Progressive', popularity: 90 },
    { id: 'franky-wah', name: 'Franky Wah', price: 85000, genre: 'Melodic House', popularity: 92 },
    { id: 'korolova', name: 'Korolova', price: 130000, genre: 'Melodic Techno', popularity: 94 },
    { id: 'miss-monique', name: 'Miss Monique', price: 140000, genre: 'Melodic Techno', popularity: 95 },
    { id: 'camel-phat', name: 'CamelPhat', price: 260000, genre: 'Melodic House', popularity: 97 },
    { id: 'solardo-v2', name: 'Solardo', price: 110000, genre: 'Tech House', popularity: 92 },
    { id: 'wade', name: 'Wade', price: 150000, genre: 'Tech House', popularity: 95 },
    { id: 'tita-lau', name: 'Tita Lau', price: 70000, genre: 'Tech House', popularity: 90 },
    { id: 'james-hype', name: 'James Hype', price: 280000, genre: 'Tech House', popularity: 98 },
    { id: 'meduza-v2', name: 'Meduza', price: 240000, genre: 'Dance', popularity: 97 },
    { id: 'vintage-culture-v2', name: 'Vintage Culture', price: 250000, genre: 'House', popularity: 97 },
    { id: 'joshwa', name: 'Joshwa', price: 60000, genre: 'Tech House', popularity: 88 },
    { id: 'walker-royce', name: 'Walker & Royce', price: 95000, genre: 'House', popularity: 92 },
    { id: 'sidepiece', name: 'SIDEPIECE', price: 130000, genre: 'House', popularity: 95 },
    { id: 'claudia-leo', name: 'Claudia Leon', price: 45000, genre: 'Techno', popularity: 84 },
    { id: 'stella-bossi', name: 'Stella Bossi', price: 90000, genre: 'Techno', popularity: 92 },
    { id: 'nina-kraviz-v2', name: 'Nina Kraviz', price: 220000, genre: 'Techno', popularity: 96 },
    { id: 'fja', name: 'FJAAK', price: 115000, genre: 'Techno', popularity: 92 },
    { id: 'kobosil', name: 'Kobosil', price: 140000, genre: 'Techno', popularity: 94 },
    { id: 'dax-j', name: 'Dax J', price: 110000, genre: 'Techno', popularity: 91 },
    { id: 'shd', name: 'SPFDJ', price: 85000, genre: 'Industrial Techno', popularity: 89 },
    { id: 'vtss', name: 'VTSS', price: 95000, genre: 'Techno', popularity: 91 },
    { id: 'hector-oaks', name: 'Hector Oaks', price: 100000, genre: 'Techno', popularity: 91 },
    { id: 'ellen-allien', name: 'Ellen Allien', price: 120000, genre: 'Techno', popularity: 93 },
    { id: 'rodhad', name: 'Rødhåd', price: 110000, genre: 'Techno', popularity: 91 },
    { id: 'ben-klock', name: 'Ben Klock', price: 180000, genre: 'Berghain Techno', popularity: 96 },
    { id: 'marcel-dettmann', name: 'Marcel Dettmann', price: 170000, genre: 'Techno', popularity: 95 },
    { id: 'dj-nobu', name: 'DJ Nobu', price: 90000, genre: 'Deep Techno', popularity: 90 },
    { id: 'djs', name: 'DJ Stingray 313', price: 100000, genre: 'Electro Techno', popularity: 91 },
    { id: 'jeff-mills', name: 'Jeff Mills', price: 250000, genre: 'Legendary', popularity: 98 },
    { id: 'richie-hawtin', name: 'Richie Hawtin', price: 260000, genre: 'Legend', popularity: 98 },
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
    const [gameState, setGameState] = useState<'SETUP' | 'ONBOARDING' | 'BOOKING' | 'POSTER'>('SETUP');
    const [bookingStatus, setBookingStatus] = useState<{ djId: string; status: 'PENDING' | 'ACCEPTED' | 'REJECTED'; message: string } | null>(null);
    const [hallOfFame, setHallOfFame] = useState(HALL_OF_FAME);

    // Player Info
    const [playerName, setPlayerName] = useState('');
    const [playerEmail, setPlayerEmail] = useState('');
    const [festivalName, setFestivalName] = useState('');
    const [selectedLocation, setSelectedLocation] = useState(FESTIVAL_LOCATIONS[0]);
    const [stageCount, setStageCount] = useState(1);
    const [festivalDuration, setFestivalDuration] = useState(1); // Days
    const [ticketPrice, setTicketPrice] = useState(150);
    const [selectedSponsors, setSelectedSponsors] = useState<string[]>([]);
    const [randomEvent, setRandomEvent] = useState<typeof RANDOM_EVENTS[0] | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGenreFilter, setSelectedGenreFilter] = useState('ALL');

    // Stats
    const sponsorsBonus = useMemo(() => {
        return SPONSORS.filter(s => selectedSponsors.includes(s.id)).reduce((acc, s) => acc + s.bonus, 0);
    }, [selectedSponsors]);

    const totalDjsCost = useMemo(() => {
        // Riders cost: +15% for top DJs
        return selectedDjs.reduce((acc, dj) => acc + (dj.price * (dj.popularity > 95 ? 1.15 : 1)), 0);
    }, [selectedDjs]);
    const totalExtraCost = useMemo(() => {
        return FIX_COSTS
            .filter(c => selectedCosts.includes(c.id))
            .reduce((acc, c) => acc + c.basePrice, 0);
    }, [selectedCosts]);
    const locationCost = selectedLocation.cost;
    const stagesCost = stageCount * STAGE_COST_PER_UNIT;
    const totalSpent = (totalDjsCost + totalExtraCost + locationCost + stagesCost) * (1 + (festivalDuration - 1) * 0.4);
    const totalBudgetWithSponsors = budget + sponsorsBonus;
    const remainingBudget = totalBudgetWithSponsors - totalSpent;

    // Simulation logic
    const { attendance, revenue, profit, hype } = useMemo(() => {
        const prestigeBase = (selectedLocation as any).prestige || 5;
        const lineupPower = selectedDjs.reduce((acc, dj) => acc + (dj.popularity / 10), 0);

        // Genre Synergy: +5% hype for each DJ of the same genre if more than 2
        const genreCounts: { [key: string]: number } = {};
        selectedDjs.forEach(d => { genreCounts[d.genre] = (genreCounts[d.genre] || 0) + 1; });
        const genreSynergy = Object.values(genreCounts).reduce((acc, count) => acc + (count > 2 ? count * 0.05 : 0), 0);

        // Hype formula: Lineup + Prestige + Marketing + Synergies
        let currentHype = (lineupPower * 2) + (prestigeBase * 5);
        currentHype *= (1 + genreSynergy);
        if (selectedCosts.includes('marketing')) currentHype *= 1.3;
        if (selectedSponsors.includes('redbull')) currentHype *= 1.15;
        if (randomEvent?.id === 'viral') currentHype *= 1.3;

        // Pricing sensitivity
        const optimalPrice = 50 + (prestigeBase * 15) + (lineupPower * 5);
        const pricePenalty = Math.max(0, (ticketPrice - optimalPrice) / 100);

        let finalAttendance = Math.floor(selectedLocation.capacity * (currentHype / 150) * (1 - pricePenalty));
        finalAttendance = Math.min(finalAttendance, selectedLocation.capacity);
        if (randomEvent?.id === 'rain') finalAttendance *= 0.8;
        if (randomEvent?.id === 'cancel') finalAttendance *= 0.85;

        const currentRevenue = finalAttendance * ticketPrice;
        const currentProfit = currentRevenue - totalSpent;

        return {
            attendance: finalAttendance,
            revenue: currentRevenue,
            profit: currentProfit,
            hype: currentHype
        };
    }, [selectedLocation, selectedDjs, selectedCosts, selectedSponsors, ticketPrice, totalSpent, randomEvent]);

    const sortedHallOfFame = useMemo(() => {
        return [...hallOfFame].sort((a, b) => (b.likes || 0) - (a.likes || 0));
    }, [hallOfFame]);

    const startNewGame = () => {
        const randomBudget = Math.floor(Math.random() * (5000000 - 500000 + 1)) + 500000;
        setBudget(randomBudget);
        setSelectedDjs([]);
        setSelectedCosts([]);
        setSelectedSponsors([]);
        setTicketPrice(150);

        // Random event chance
        if (Math.random() > 0.5) {
            setRandomEvent(RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)]);
        } else {
            setRandomEvent(null);
        }

        setGameState('ONBOARDING');
        setGameStarted(true);
    };

    const confirmOnboarding = () => {
        if (!playerName || !playerEmail || !festivalName) return;
        setGameState('BOOKING');
    };

    const toggleDj = async (dj: typeof DJ_POOL[0]) => {
        if (selectedDjs.find(d => d.id === dj.id)) {
            setSelectedDjs(prev => prev.filter(d => d.id !== dj.id));
            setBookingStatus(null);
            return;
        }

        if (totalSpent + dj.price > budget) return;

        setBookingStatus({ djId: dj.id, status: 'PENDING', message: `Négociation avec l'agent de ${dj.name}...` });

        // AI Thinking delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        const prestigeScore = (selectedLocation as any).prestige || 5;
        const lineupScore = Math.min(selectedDjs.length, 5);
        const successChance = (prestigeScore + lineupScore + (dj.popularity / 10)) / 25;

        if (Math.random() < successChance || dj.price < 100000) {
            setSelectedDjs(prev => [...prev, dj]);
            setBookingStatus({
                djId: dj.id,
                status: 'ACCEPTED',
                message: `L'artiste accepte ! Le prestige de ${selectedLocation.name} et ta vision l'ont convaincu.`
            });
        } else {
            setBookingStatus({
                djId: dj.id,
                status: 'REJECTED',
                message: `L'agent de ${dj.name} refuse. Il estime que le festival n'a pas encore assez de prestige pour son talent.`
            });
        }

        setTimeout(() => setBookingStatus(null), 4000);
    };

    const handleShare = (platform: 'twitter' | 'facebook' | 'instagram' | 'tiktok' | 'native') => {
        const shareText = `Je viens de créer mon festival "${festivalName}" sur Dropsiders ! Bilan : ${attendance.toLocaleString()} fans et un profit de ${profit.toLocaleString()}€ ! 🚀🕺 #Dropsiders #Tycoon #Festival`;
        const shareUrl = "https://dropsiders.com/communaute"; // Final URL of the site

        if (platform === 'native' && navigator.share) {
            navigator.share({
                title: festivalName,
                text: shareText,
                url: shareUrl
            }).catch(() => { });
            return;
        }

        const links = {
            twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
            instagram: `https://www.instagram.com/`, // Redirect to IG
            tiktok: `https://www.tiktok.com/` // Redirect to TikTok
        };

        if (platform !== 'native') {
            window.open(links[platform], '_blank');
        }
    };

    const handleLike = (id: string) => {
        setHallOfFame(prev => prev.map(p => p.id === id ? { ...p, likes: (p.likes || 0) + 1 } : p));
        confetti({
            particleCount: 40,
            spread: 50,
            origin: { y: 0.8 },
            colors: ['#ff0033']
        });
    };

    const generatePoster = () => {
        if (selectedCosts.length < 3) return; // Need at least 3 infrastructure units
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#ff0033', '#00ffff', '#ffffff']
        });
        setGameState('POSTER');
    };

    const resetGame = () => {
        setGameState('SETUP');
        setGameStarted(false);
        setPlayerName('');
        setPlayerEmail('');
        setFestivalName('');
        setSelectedLocation(FESTIVAL_LOCATIONS[0]);
        setStageCount(1);
        setFestivalDuration(1);
        setSelectedDjs([]);
        setSelectedCosts([]);
        setBookingStatus(null);
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white pt-24 pb-32">
            {/* Background Ambient Glows */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-neon-red/5 rounded-full blur-[150px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-neon-cyan/5 rounded-full blur-[150px] animate-pulse [animation-delay:2s]" />
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

                                    {/* Hall of Fame Section */}
                                    <div className="max-w-5xl mx-auto mt-20">
                                        <div className="flex items-center gap-4 mb-12 justify-center">
                                            <div className="h-[1px] flex-1 bg-white/10" />
                                            <h3 className="text-2xl font-black italic tracking-tighter uppercase text-white/40">Hall of Fame</h3>
                                            <div className="h-[1px] flex-1 bg-white/10" />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                                            {sortedHallOfFame.map((poster) => (
                                                <motion.div
                                                    key={poster.id}
                                                    whileHover={{ y: -10, rotate: 1 }}
                                                    className="group relative aspect-[1.3/2] bg-[#111] border-[6px] border-white shadow-2xl rounded-2xl p-6 overflow-hidden flex flex-col items-center text-center"
                                                >
                                                    <div className="absolute inset-0 opacity-10 flex items-center justify-center -rotate-12 pointer-events-none text-2xl font-black uppercase tracking-tighter leading-none">DROPS<br />IDERS</div>

                                                    <div className="relative z-10 w-full h-full flex flex-col">
                                                        <span className="text-[6px] font-black uppercase tracking-[0.3em] text-neon-red block mb-1">Production par {poster.playerName}</span>
                                                        <h4 className="text-xl font-display font-black uppercase italic tracking-tighter text-white leading-none mb-3">{poster.festivalName}</h4>
                                                        <div className="w-10 h-0.5 bg-white mx-auto mb-6" />

                                                        <div className="space-y-1 mb-6 flex-1">
                                                            {(poster as any).djs.map((dj: string, idx: number) => (
                                                                <p key={dj} className={`text-[7px] font-bold text-white uppercase tracking-widest ${idx === 0 ? 'text-[9px] font-black' : 'opacity-60'}`}>{dj}</p>
                                                            ))}
                                                        </div>

                                                        <div className="pt-4 border-t border-white/10 flex flex-col gap-3 w-full">
                                                            <div className="flex justify-between items-end">
                                                                <div className="text-left">
                                                                    <p className="text-[5px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">Lieu</p>
                                                                    <p className="text-[7px] font-black text-white uppercase italic truncate max-w-[100px] leading-none mb-2">{poster.location}</p>
                                                                    <p className="text-[5px] font-black text-white/40 uppercase tracking-widest leading-none">Budget Final</p>
                                                                    <p className="text-[7px] font-black text-white uppercase italic leading-none">{poster.budget}</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <img src="/Logo.png" className="h-2 w-auto object-contain opacity-50" alt="" />
                                                                </div>
                                                            </div>

                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleLike(poster.id);
                                                                }}
                                                                className="flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all active:scale-95 group/like"
                                                            >
                                                                <Heart className={`w-3 h-3 ${poster.likes && poster.likes > 100 ? 'text-neon-red fill-neon-red' : 'text-white/40 group-hover/like:text-neon-red'}`} />
                                                                <span className="text-[8px] font-black uppercase tracking-widest text-white/60">{poster.likes || 0} LIKES</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : gameState === 'ONBOARDING' ? (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="max-w-4xl mx-auto space-y-12"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                        <div className="p-12 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] space-y-6">
                                            <h3 className="text-3xl font-black italic tracking-tighter uppercase mb-8 text-amber-400">Dossier de Production</h3>
                                            <div className="space-y-6">
                                                <div>
                                                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-3 ml-2">Prénom de l'organisateur</label>
                                                    <input
                                                        type="text"
                                                        value={playerName}
                                                        onChange={(e) => setPlayerName(e.target.value)}
                                                        className="w-full px-8 py-5 bg-black/40 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-amber-400 transition-colors"
                                                        placeholder="TON PRÉNOM"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-3 ml-2">Email (pour l'envoi de l'affiche)</label>
                                                    <input
                                                        type="email"
                                                        value={playerEmail}
                                                        onChange={(e) => setPlayerEmail(e.target.value)}
                                                        className="w-full px-8 py-5 bg-black/40 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-amber-400 transition-colors"
                                                        placeholder="TON@EMAIL.COM"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-3 ml-2">Nom du Festival</label>
                                                    <input
                                                        type="text"
                                                        value={festivalName}
                                                        onChange={(e) => setFestivalName(e.target.value)}
                                                        className="w-full px-8 py-5 bg-black/40 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-amber-400 transition-colors"
                                                        placeholder="NOM DE TON FESTIVAL"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-12 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] space-y-8">
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="text-2xl font-black italic tracking-tighter uppercase text-white">Sponsors & Partenaires</h3>
                                                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Bonus Budget</span>
                                            </div>
                                            <div className="grid grid-cols-1 gap-4">
                                                {SPONSORS.map(sponsor => (
                                                    <button
                                                        key={sponsor.id}
                                                        onClick={() => {
                                                            if (selectedSponsors.includes(sponsor.id)) {
                                                                setSelectedSponsors(prev => prev.filter(id => id !== sponsor.id));
                                                            } else if (selectedSponsors.length < 2) {
                                                                setSelectedSponsors(prev => [...prev, sponsor.id]);
                                                            }
                                                        }}
                                                        className={twMerge(
                                                            "p-6 rounded-2xl border transition-all text-left flex justify-between items-center group",
                                                            selectedSponsors.includes(sponsor.id)
                                                                ? "bg-amber-400 border-amber-400 text-black"
                                                                : "bg-white/5 border-white/10 text-white/40 hover:border-white/20"
                                                        )}
                                                    >
                                                        <div>
                                                            <p className="text-sm font-black uppercase italic tracking-tighter mb-1">{sponsor.name}</p>
                                                            <p className={`text-[8px] font-bold uppercase tracking-widest ${selectedSponsors.includes(sponsor.id) ? 'text-black/60' : 'text-white/20'}`}>{sponsor.desc}</p>
                                                        </div>
                                                        <span className={`text-xs font-mono font-black ${selectedSponsors.includes(sponsor.id) ? 'text-black' : 'text-amber-400'}`}>
                                                            +{sponsor.bonus.toLocaleString()}€
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="pt-6 border-t border-white/10">
                                                <div className="flex justify-between items-end">
                                                    <div>
                                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Budget Total Provisoire</p>
                                                        <p className="text-2xl font-mono font-black text-white">{(budget + sponsorsBonus).toLocaleString()}€</p>
                                                    </div>
                                                    {randomEvent && (
                                                        <div className="text-right">
                                                            <p className="text-[8px] font-black text-neon-red uppercase tracking-widest mb-1 animate-pulse">Alerte Marché</p>
                                                            <p className="text-[10px] font-bold text-white uppercase italic max-w-[150px] leading-tight">{randomEvent.name}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-center pt-8">
                                        <button
                                            onClick={confirmOnboarding}
                                            disabled={!playerName || !playerEmail || !festivalName}
                                            className="px-24 py-8 bg-white text-black rounded-3xl font-black text-sm uppercase tracking-[0.4em] hover:bg-amber-400 hover:scale-105 transition-all duration-500 disabled:opacity-20 shadow-[0_20px_60px_rgba(255,255,255,0.1)]"
                                        >
                                            LANCER LA PRODUCTION
                                        </button>
                                    </div>
                                </motion.div>
                            ) : gameState === 'BOOKING' ? (
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                                    {/* Sidebar: Budget & Controls */}
                                    <div className="lg:col-span-4 space-y-8">
                                        <div className="sticky top-24 p-10 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-2xl">
                                            <div className="flex items-center justify-between mb-10">
                                                <h3 className="text-2xl font-black italic tracking-tighter uppercase">Production Control</h3>
                                                <button onClick={resetGame} className="p-2 text-white/20 hover:text-white transition-colors">
                                                    <X className="w-6 h-6" />
                                                </button>
                                            </div>

                                            <div className="space-y-10">
                                                <div>
                                                    <div className="flex justify-between items-end mb-4">
                                                        <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Budget Total</span>
                                                        <span className="text-2xl font-black font-mono text-white tracking-widest">{budget.toLocaleString()}€</span>
                                                    </div>
                                                    <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                                                        <motion.div
                                                            className={`h-full ${remainingBudget < 0 ? 'bg-red-500' : 'bg-amber-400'}`}
                                                            animate={{ width: `${(totalSpent / budget) * 100}%` }}
                                                        />
                                                    </div>
                                                    <div className="flex justify-between mt-3">
                                                        <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Dépensé: {totalSpent.toLocaleString()}€</span>
                                                        <span className={`text-[9px] font-black uppercase tracking-widest ${remainingBudget < 0 ? 'text-red-500' : 'text-emerald-400'}`}>
                                                            Reste: {remainingBudget.toLocaleString()}€
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Infrastructure & Logistique</span>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {FIX_COSTS.map(cost => (
                                                            <button
                                                                key={cost.id}
                                                                onClick={() => {
                                                                    if (selectedCosts.includes(cost.id)) {
                                                                        setSelectedCosts(prev => prev.filter(id => id !== cost.id));
                                                                    } else if (totalSpent + cost.basePrice <= budget) {
                                                                        setSelectedCosts(prev => [...prev, cost.id]);
                                                                    }
                                                                }}
                                                                className={twMerge(
                                                                    "p-4 rounded-2xl border transition-all flex flex-col items-center gap-2",
                                                                    selectedCosts.includes(cost.id)
                                                                        ? "bg-amber-400 border-amber-400 text-black shadow-[0_0_20px_rgba(251,191,36,0.2)]"
                                                                        : "bg-white/5 border-white/10 text-white/40 hover:border-white/20"
                                                                )}
                                                            >
                                                                <cost.icon className="w-5 h-5" />
                                                                <span className="text-[8px] font-black uppercase tracking-tighter text-center">{cost.name}</span>
                                                                <span className="text-[7px] font-mono opacity-60">+{cost.basePrice.toLocaleString()}€</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Prix du Pass (Billet)</span>
                                                        <span className="text-xl font-mono font-black text-white">{ticketPrice}€</span>
                                                    </div>
                                                    <div className="flex items-center gap-4 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl">
                                                        <input
                                                            type="range"
                                                            min="50"
                                                            max="800"
                                                            step="5"
                                                            value={ticketPrice}
                                                            onChange={(e) => setTicketPrice(parseInt(e.target.value))}
                                                            className="flex-1 accent-white"
                                                        />
                                                    </div>
                                                    <div className="flex justify-between mt-2">
                                                        <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Low Cost</span>
                                                        <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Ultra VIP</span>
                                                    </div>
                                                </div>

                                                {randomEvent && (
                                                    <div className="p-6 bg-neon-red/10 border border-neon-red/20 rounded-2xl">
                                                        <div className="flex items-center gap-3 mb-2 text-neon-red">
                                                            <AlertCircle className="w-4 h-4" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest">Market Info</span>
                                                        </div>
                                                        <p className="text-[10px] font-bold text-white uppercase italic leading-snug">{randomEvent.name}: {randomEvent.message}</p>
                                                    </div>
                                                )}

                                                <div className="space-y-4">
                                                    <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Lieu du Festival (Destinations)</span>
                                                    <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-[300px] pr-2 scrollbar-hide">
                                                        {FESTIVAL_LOCATIONS.map(loc => (
                                                            <button
                                                                key={loc.id}
                                                                onClick={() => {
                                                                    const diff = loc.cost - selectedLocation.cost;
                                                                    if (totalSpent + diff <= budget) {
                                                                        setSelectedLocation(loc);
                                                                    }
                                                                }}
                                                                className={twMerge(
                                                                    "p-2 rounded-lg border transition-all text-center flex flex-col justify-center min-h-[60px]",
                                                                    selectedLocation.id === loc.id
                                                                        ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                                                                        : "bg-white/5 border-white/10 text-white/40 hover:border-white/20"
                                                                )}
                                                            >
                                                                <span className="text-[7px] font-black uppercase block leading-tight">{loc.name}</span>
                                                                <span className="text-[6px] font-mono opacity-60 mt-0.5">{loc.cost.toLocaleString()}€</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Durée du Festival ({festivalDuration} Jours)</span>
                                                        <span className="text-[9px] font-mono text-amber-400">Multiplicateur x{1 + (festivalDuration - 1) * 0.4}</span>
                                                    </div>
                                                    <div className="flex items-center gap-4 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl">
                                                        <input
                                                            type="range"
                                                            min="1"
                                                            max="3"
                                                            step="1"
                                                            value={festivalDuration}
                                                            onChange={(e) => {
                                                                const val = parseInt(e.target.value);
                                                                const tempSpent = (totalDjsCost + totalExtraCost + locationCost + stagesCost) * (1 + (val - 1) * 0.4);
                                                                if (tempSpent <= budget) {
                                                                    setFestivalDuration(val);
                                                                }
                                                            }}
                                                            className="flex-1 accent-amber-400"
                                                        />
                                                        <span className="text-white font-mono font-black">{festivalDuration}J</span>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Stages ({stageCount})</span>
                                                        <span className="text-[9px] font-mono text-amber-400">+{stagesCost.toLocaleString()}€</span>
                                                    </div>
                                                    <div className="flex items-center gap-4 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl">
                                                        <input
                                                            type="range"
                                                            min="1"
                                                            max="5"
                                                            step="1"
                                                            value={stageCount}
                                                            onChange={(e) => {
                                                                const val = parseInt(e.target.value);
                                                                const diff = (val - stageCount) * STAGE_COST_PER_UNIT;
                                                                if (totalSpent + diff <= budget) {
                                                                    setStageCount(val);
                                                                }
                                                            }}
                                                            className="flex-1 accent-amber-400"
                                                        />
                                                        <span className="text-white font-mono font-black">{stageCount}</span>
                                                    </div>
                                                </div>

                                                <button
                                                    disabled={selectedCosts.length < 4 || selectedDjs.length === 0 || remainingBudget < 0}
                                                    onClick={generatePoster}
                                                    className="w-full py-6 rounded-[1.5rem] bg-white text-black font-black text-xs uppercase tracking-[0.3em] disabled:opacity-20 disabled:cursor-not-allowed hover:bg-neon-red hover:text-white transition-all duration-500 flex items-center justify-center gap-4"
                                                >
                                                    Générer la Line-up
                                                    <Sparkles className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Main: DJ List */}
                                    <div className="lg:col-span-8 flex flex-col min-h-[800px] relative">
                                        <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-md pb-6 pt-2">
                                            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
                                                <div>
                                                    <h3 className="text-3xl font-black italic tracking-tighter uppercase mb-1">Booking Gallery</h3>
                                                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{selectedDjs.length} Artistes sur la Line-up</p>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                                                    <div className="relative flex-1 md:w-64">
                                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                                        <input
                                                            type="text"
                                                            placeholder="Chercher un artiste..."
                                                            value={searchQuery}
                                                            onChange={(e) => setSearchQuery(e.target.value)}
                                                            className="w-full pl-12 pr-6 py-3 bg-white/5 border border-white/10 rounded-full text-xs font-bold text-white placeholder:text-white/20 focus:outline-none focus:border-amber-400/50 transition-all"
                                                        />
                                                    </div>
                                                    <div className="relative">
                                                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                                        <select
                                                            value={selectedGenreFilter}
                                                            onChange={(e) => setSelectedGenreFilter(e.target.value)}
                                                            className="pl-12 pr-8 py-3 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-white appearance-none focus:outline-none focus:border-amber-400/50 transition-all cursor-pointer"
                                                        >
                                                            <option value="ALL">Tous les Styles</option>
                                                            <option value="EDM">EDM</option>
                                                            <option value="TECHNO">Techno</option>
                                                            <option value="HOUSE">House</option>
                                                            <option value="TECH HOUSE">Tech House</option>
                                                            <option value="HARDSTYLE">Hardstyle</option>
                                                            <option value="TRANCE">Trance</option>
                                                            <option value="DRUM & BASS">D&B</option>
                                                            <option value="TRAP">Trap</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* AI Booking Notification Placeholder / Status */}
                                            <AnimatePresence mode="wait">
                                                {bookingStatus ? (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: -10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -10 }}
                                                        className={twMerge(
                                                            "p-4 rounded-2xl border flex items-center gap-4 shadow-lg overflow-hidden relative",
                                                            bookingStatus.status === 'PENDING' ? "bg-amber-400/10 border-amber-400/20" :
                                                                bookingStatus.status === 'ACCEPTED' ? "bg-emerald-400/10 border-emerald-400/20" :
                                                                    "bg-red-400/10 border-red-400/20"
                                                        )}
                                                    >
                                                        <div className={twMerge(
                                                            "w-10 h-10 rounded-full flex items-center justify-center",
                                                            bookingStatus.status === 'PENDING' ? "bg-amber-400/20 text-amber-400" :
                                                                bookingStatus.status === 'ACCEPTED' ? "bg-emerald-400/20 text-emerald-400" :
                                                                    "bg-red-400/20 text-red-400"
                                                        )}>
                                                            {bookingStatus.status === 'PENDING' && <RefreshCw className="w-5 h-5 animate-spin" />}
                                                            {bookingStatus.status === 'ACCEPTED' && <Check className="w-5 h-5" />}
                                                            {bookingStatus.status === 'REJECTED' && <X className="w-5 h-5" />}
                                                        </div>
                                                        <div className="flex-1">
                                                            <span className="text-[8px] font-black uppercase tracking-widest opacity-40 block mb-0.5">Négociation en cours</span>
                                                            <p className="text-xs font-bold text-white leading-tight">{bookingStatus.message}</p>
                                                        </div>
                                                        {bookingStatus.status === 'PENDING' && (
                                                            <motion.div
                                                                className="absolute bottom-0 left-0 h-0.5 bg-amber-400"
                                                                initial={{ width: 0 }}
                                                                animate={{ width: "100%" }}
                                                                transition={{ duration: 1.5, ease: "linear" }}
                                                            />
                                                        )}
                                                    </motion.div>
                                                ) : (
                                                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-4 text-white/20 italic">
                                                        <Sparkles className="w-5 h-5" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Sélectionne un artiste pour lancer les négociations</span>
                                                    </div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pt-4">
                                            {DJ_POOL
                                                .filter(dj => {
                                                    const matchesSearch = dj.name.toLowerCase().includes(searchQuery.toLowerCase());
                                                    const matchesGenre = selectedGenreFilter === 'ALL' || dj.genre === selectedGenreFilter || (selectedGenreFilter === 'TECHNO' && dj.genre === 'BERLIN TECHNO');
                                                    return matchesSearch && matchesGenre;
                                                })
                                                .map((dj, i) => {
                                                    const isSelected = selectedDjs.find(d => d.id === dj.id);
                                                    const canAfford = remainingBudget >= (dj.price * (dj.popularity > 95 ? 1.15 : 1));

                                                    return (
                                                        <motion.button
                                                            key={dj.id}
                                                            initial={{ opacity: 0, scale: 0.95 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            transition={{ delay: Math.min(i * 0.02, 0.5) }}
                                                            onClick={() => toggleDj(dj)}
                                                            disabled={!isSelected && !canAfford}
                                                            className={twMerge(
                                                                "relative group p-6 rounded-[2rem] border transition-all duration-300 text-left overflow-hidden flex flex-col",
                                                                isSelected
                                                                    ? "bg-amber-400 border-amber-400 text-black shadow-[0_0_30px_rgba(251,191,36,0.2)]"
                                                                    : !canAfford && !isSelected
                                                                        ? "bg-white/5 border-white/5 text-white/10 grayscale cursor-not-allowed"
                                                                        : "bg-white/5 border-white/10 text-white/40 hover:border-amber-400/50 hover:bg-white/10"
                                                            )}
                                                        >
                                                            <div className="flex justify-between items-start mb-6">
                                                                <div className={twMerge(
                                                                    "w-10 h-10 rounded-xl flex items-center justify-center border transition-colors",
                                                                    isSelected ? "bg-black/10 border-black/10" : "bg-white/5 border-white/10"
                                                                )}>
                                                                    <Music className={twMerge("w-5 h-5", isSelected ? "text-black" : "text-amber-400")} />
                                                                </div>
                                                                {isSelected && <Check className="w-5 h-5 text-black" />}
                                                                {!isSelected && dj.popularity > 95 && (
                                                                    <div className="px-2 py-0.5 bg-neon-red/10 border border-neon-red/20 rounded-md">
                                                                        <span className="text-[7px] font-black text-neon-red uppercase tracking-widest">Iconic</span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="flex-1">
                                                                <h4 className={twMerge(
                                                                    "text-lg font-black uppercase italic tracking-tighter mb-0.5 leading-tight",
                                                                    isSelected ? "text-black" : "text-white"
                                                                )}>
                                                                    {dj.name}
                                                                </h4>
                                                                <p className={twMerge(
                                                                    "text-[8px] font-bold uppercase tracking-widest mb-4 opacity-60",
                                                                    isSelected ? "text-black" : "text-white/40"
                                                                )}>
                                                                    {dj.genre}
                                                                </p>
                                                            </div>

                                                            <div className="flex items-center justify-between pt-4 border-t border-black/5 mt-auto">
                                                                <span className={twMerge(
                                                                    "text-sm font-mono font-black",
                                                                    isSelected ? "text-black" : "text-amber-400"
                                                                )}>
                                                                    {dj.price.toLocaleString()}€
                                                                </span>
                                                                <div className="flex items-center gap-1.5 opacity-40">
                                                                    <Trophy className="w-2.5 h-2.5" />
                                                                    <span className="text-[9px] font-black tracking-widest">{dj.popularity}</span>
                                                                </div>
                                                            </div>

                                                            {!isSelected && !canAfford && (
                                                                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center pointer-events-none">
                                                                    <span className="text-[7px] font-black text-white px-3 py-1 bg-red-500 rounded-full uppercase tracking-[0.2em] shadow-lg">Hors-Budget</span>
                                                                </div>
                                                            )}
                                                        </motion.button>
                                                    );
                                                })}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
                                    <motion.div
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="relative aspect-[1.3/2] bg-[#111] border-[12px] border-white shadow-[0_40px_100px_rgba(0,0,0,0.8)] rounded-[2rem] p-12 overflow-hidden"
                                    >
                                        <div className="absolute inset-0 opacity-20 flex items-center justify-center -rotate-12 pointer-events-none">
                                            <span className="text-[200px] font-black text-white/10 uppercase tracking-tighter leading-none">DROPS<br />IDERS</span>
                                        </div>

                                        <div className="relative z-10 h-full flex flex-col items-center text-center">
                                            <div className="flex flex-col items-center gap-4 mb-20">
                                                <div className="px-4 py-1.5 bg-neon-red text-white text-[10px] font-black uppercase tracking-[0.4em] rounded-sm">
                                                    Dropsiders Lab Présente
                                                </div>
                                                <h1 className="text-6xl font-display font-black text-white uppercase italic tracking-tighter leading-none">
                                                    {festivalName.split(' ')[0]} <span className="text-neon-red">{festivalName.split(' ').slice(1).join(' ') || 'EXPERIENCE'}</span>
                                                </h1>
                                                <div className="w-40 h-1 bg-white" />
                                            </div>

                                            <div className="flex-1 w-full space-y-12">
                                                <div>
                                                    <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.5em] mb-4 block">Featuring</span>
                                                    <div className="flex flex-col gap-4">
                                                        {selectedDjs.map((dj, i) => (
                                                            <motion.span
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                transition={{ delay: 0.5 + (i * 0.1) }}
                                                                key={dj.id}
                                                                className={`font-display font-black uppercase italic tracking-tighter leading-none ${i === 0 ? 'text-4xl text-white' : 'text-2xl text-white/70'}`}
                                                            >
                                                                {dj.name}{i < selectedDjs.length - 1 && " •"}
                                                            </motion.span>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="pt-8 flex flex-wrap justify-center gap-4 opacity-50">
                                                    {FIX_COSTS.filter(c => selectedCosts.includes(c.id)).map(cost => (
                                                        <div key={cost.id} className="flex items-center gap-2 px-3 py-1 border border-white/20 rounded-full">
                                                            <cost.icon className="w-3 h-3 text-neon-red" />
                                                            <span className="text-[7px] font-black uppercase tracking-widest leading-none">{cost.name.split(' ')[0]}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="w-full pt-12 border-t border-white/10 flex justify-between items-end">
                                                <div className="text-left space-y-2">
                                                    <div>
                                                        <p className="text-[9px] font-black text-white/60 uppercase tracking-widest">Lieu & Stages</p>
                                                        <p className="text-lg font-black text-white uppercase italic">{selectedLocation.name} • {stageCount} STAGES</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-black text-white/60 uppercase tracking-widest">Date & Durée</p>
                                                        <p className="text-lg font-black text-white uppercase italic tracking-tighter">SUMMER 2026 • {festivalDuration} DAYS</p>
                                                    </div>
                                                </div>
                                                <div className="text-right flex flex-col items-end gap-1.5 leading-none">
                                                    <img src="/Logo.png" className="h-10 w-auto object-contain mb-2" alt="DROPSIDERS" />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>

                                    <div className="space-y-8">
                                        <motion.div
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 1 }}
                                            className="p-10 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] space-y-8"
                                        >
                                            <h3 className="text-3xl font-black italic tracking-tighter uppercase text-amber-400">Rapport Financier</h3>

                                            <div className="grid grid-cols-2 gap-8">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Affluence</p>
                                                    <p className="text-2xl font-mono font-black text-white">{attendance.toLocaleString()} <span className="text-xs text-white/20 font-sans">FANS</span></p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Hype Score</p>
                                                    <p className="text-2xl font-mono font-black text-white">{Math.floor(hype)} / 100</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Revenus Bruts</p>
                                                    <p className="text-2xl font-mono font-black text-white">{revenue.toLocaleString()}€</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Dépenses Totales</p>
                                                    <p className="text-2xl font-mono font-black text-white">{totalSpent.toLocaleString()}€</p>
                                                </div>
                                            </div>

                                            <div className={twMerge(
                                                "p-8 rounded-[2rem] border animate-pulse",
                                                profit > 0 ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20"
                                            )}>
                                                <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-2 opacity-60">Résultat Net</p>
                                                <p className={twMerge(
                                                    "text-5xl font-mono font-black tracking-tighter",
                                                    profit > 0 ? "text-emerald-400" : "text-red-500"
                                                )}>
                                                    {profit > 0 ? "+" : ""}{profit.toLocaleString()}€
                                                </p>
                                                <p className="text-[10px] font-bold uppercase italic tracking-widest mt-4 opacity-40">
                                                    {profit > 1000000 ? "MAGNAT DES FESTIVALS" : profit > 0 ? "PROJET RENTABLE" : "DÉFICIT PRODUCTION"}
                                                </p>
                                            </div>

                                            <div className="flex flex-col gap-4 pt-6">
                                                <div className="grid grid-cols-2 gap-4 mb-4">
                                                    <button
                                                        onClick={() => handleShare('native')}
                                                        className="flex items-center justify-center gap-3 py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                                                    >
                                                        <Share2 className="w-4 h-4" /> Partager
                                                    </button>
                                                    <button
                                                        onClick={() => handleShare('twitter')}
                                                        className="flex items-center justify-center gap-3 py-4 bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 border border-[#1DA1F2]/20 text-[#1DA1F2] rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                                                    >
                                                        <Twitter className="w-4 h-4" /> X / Twitter
                                                    </button>
                                                </div>

                                                <div className="flex justify-center gap-6 mb-8 px-4 py-2 bg-white/5 rounded-2xl border border-white/10">
                                                    <button onClick={() => handleShare('instagram')} className="p-2 text-white/40 hover:text-pink-500 transition-colors">
                                                        <Instagram className="w-5 h-5" />
                                                    </button>
                                                    <button onClick={() => handleShare('tiktok')} className="p-2 text-white/40 hover:text-white transition-colors">
                                                        <Music className="w-5 h-5" />
                                                    </button>
                                                    <button onClick={() => handleShare('facebook')} className="p-2 text-white/40 hover:text-blue-500 transition-colors">
                                                        <Facebook className="w-5 h-5" />
                                                    </button>
                                                </div>

                                                <button
                                                    onClick={() => window.print()}
                                                    className="w-full py-6 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-neon-red hover:text-white transition-all duration-500 flex items-center justify-center gap-4"
                                                >
                                                    <Download className="w-4 h-4" /> Sauvegarder l'Affiche
                                                </button>
                                                <button
                                                    onClick={resetGame}
                                                    className="w-full py-6 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-white/10 transition-all flex items-center justify-center gap-4"
                                                >
                                                    <RefreshCw className="w-4 h-4" /> Nouvelle Production
                                                </button>
                                            </div>
                                        </motion.div>
                                    </div>
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

                {/* Footer CTA */}
                {
                    activeTab !== 'GAME' && (
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
                    )
                }
            </div >
        </div >
    );
}

export default Community;
