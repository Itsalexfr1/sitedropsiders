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
    // --- HEADLINERS & MAINSTREAM (The 1% of the Industry) ---
    { id: 'ch', name: 'Calvin Harris', price: 1200000, genre: 'Dance Pop', popularity: 99, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Calvin_Harris_2012.jpg/800px-Calvin_Harris_2012.jpg' },
    { id: 'shm', name: 'Swedish House Mafia', price: 1100000, genre: 'House', popularity: 99, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Swedish_House_Mafia_-_Ushuaia.jpg/800px-Swedish_House_Mafia_-_Ushuaia.jpg' },
    { id: 'fa', name: 'Fred again..', price: 950000, genre: 'Future Garage', popularity: 99, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Fred_again.._-_Pritat_-_2022.jpg/800px-Fred_again.._-_Pritat_-_2022.jpg' },
    { id: 'ko', name: 'Keinemusik (CRME)', price: 950000, genre: 'Afro House', popularity: 99, image: 'https://i1.sndcdn.com/avatars-000499628310-j8m2j2-t500x500.jpg' },
    { id: 'dg', name: 'David Guetta', price: 850000, genre: 'Mainstage', popularity: 99, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/David_Guetta_Pau_2012.jpg/800px-David_Guetta_Pau_2012.jpg' },
    { id: 'kygo', name: 'Kygo', price: 850000, genre: 'Tropical House', popularity: 99, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Kygo_NRJ_Music_Awards_2017.jpg/800px-Kygo_NRJ_Music_Awards_2017.jpg' },
    { id: 'mh', name: 'Martin Garrix', price: 800000, genre: 'Progressive House', popularity: 99, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Martin_Garrix_2013-11-20_001.jpg/800px-Martin_Garrix_2013-11-20_001.jpg' },
    { id: 'tiesto', name: 'Tiësto', price: 750000, genre: 'Big Room', popularity: 99, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Tiesto_%26_Logo.jpg/800px-Tiesto_%26_Logo.jpg' },
    { id: 'sk_v2', name: 'Skrillex', price: 720000, genre: 'Bass Music', popularity: 99, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Skrillex_cropped.jpg/800px-Skrillex_cropped.jpg' },
    { id: 'ru_v2', name: 'Rüfüs Du Sol', price: 750000, genre: 'Live Electronic', popularity: 99, image: 'https://i1.sndcdn.com/avatars-000407133372-r5x4r5-t500x500.jpg' },
    { id: 'chainsmokers_v2', name: 'The Chainsmokers', price: 750000, genre: 'Electro Pop', popularity: 99, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/The_Chainsmokers_2017.jpg/800px-The_Chainsmokers_2017.jpg' },
    { id: 'ms', name: 'Marshmello', price: 700000, genre: 'Future Bass', popularity: 99, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Marshmello_2016.jpg/800px-Marshmello_2016.jpg' },
    { id: 'tale-of-us-v2', name: 'Tale of Us', price: 650000, genre: 'Afterlife', popularity: 99, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'h', name: 'Hardwell', price: 600000, genre: 'Big Room Techno', popularity: 98, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Hardwell_NRJ_Music_Awards_2014.jpg/800px-Hardwell_NRJ_Music_Awards_2014.jpg' },
    { id: 'ds_v2', name: 'DJ Snake', price: 550000, genre: 'Trap', popularity: 98, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/DJ_Snake_Day_Off_2014.jpg/800px-DJ_Snake_Day_Off_2014.jpg' },
    { id: 'fg_v2', name: 'Fisher', price: 550000, genre: 'Tech House', popularity: 99, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'ep', name: 'Eric Prydz', price: 550000, genre: 'Progressive House', popularity: 99, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Eric_Prydz_2011.jpg/800px-Eric_Prydz_2011.jpg' },
    { id: 'anyma_v2', name: 'Anyma', price: 550000, genre: 'Afterlife', popularity: 98, image: 'https://i1.sndcdn.com/avatars-T3WXZtGkY0J8Z8V6-X6rQGQ-t500x500.jpg' },
    { id: 'dvlm', name: 'Dimitri Vegas & Like Mike', price: 480000, genre: 'Big Room', popularity: 98, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Dimitri_Vegas_%26_Like_Mike_logo.jpg/800px-Dimitri_Vegas_%26_Like_Mike_logo.jpg' },
    { id: 'ex_v2', name: 'Excision', price: 480000, genre: 'Dubstep', popularity: 98, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Excision_cropped.jpg/800px-Excision_cropped.jpg' },
    { id: 'av', name: 'Armin van Buuren', price: 450000, genre: 'Trance', popularity: 98, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Armin_van_Buuren_Electronic_Family_2013-07-20_003.jpg/800px-Armin_van_Buuren_Electronic_Family_2013-07-20_003.jpg' },
    { id: 'cdw_v2', name: 'Charlotte de Witte', price: 450000, genre: 'Techno', popularity: 99, image: 'https://i1.sndcdn.com/avatars-000570887142-v3v3v3-t500x500.jpg' },
    { id: 'pg_v2', name: 'Peggy Gou', price: 450000, genre: 'House', popularity: 98, image: 'https://i1.sndcdn.com/avatars-000499628310-j8m2j2-t500x500.jpg' },
    { id: 'solomun_v2', name: 'Solomun', price: 450000, genre: 'Deep House', popularity: 98, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Solomun_@_Tomorrowland_2015.jpg/800px-Solomun_@_Tomorrowland_2015.jpg' },
    { id: 'illumineum_v2', name: 'Illenium', price: 450000, genre: 'Future Bass', popularity: 98, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Illenium_Electric_Zoo_2017.jpg/800px-Illenium_Electric_Zoo_2017.jpg' },
    { id: 'aw', name: 'Alan Walker', price: 420000, genre: 'Future Bass', popularity: 98, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Alan_Walker_NRJ_Music_Awards_2016.jpg/800px-Alan_Walker_NRJ_Music_Awards_2016.jpg' },
    { id: 'bo_v2', name: 'Black Coffee', price: 420000, genre: 'Afro House', popularity: 98, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Black_Coffee_2015.jpg/800px-Black_Coffee_2015.jpg' },
    { id: 'alesso', name: 'Alesso', price: 420000, genre: 'Progressive House', popularity: 98, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Alesso_NRJ_Music_Awards_2012.jpg/800px-Alesso_NRJ_Music_Awards_2012.jpg' },
    { id: 'cc_v2', name: 'Carl Cox', price: 400000, genre: 'Legendary', popularity: 99, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Carl_Cox_2011.jpg/800px-Carl_Cox_2011.jpg' },
    { id: 'alok', name: 'Alok', price: 400000, genre: 'Slap House', popularity: 97, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Alok_2016.jpg/800px-Alok_2016.jpg' },
    { id: 'z', name: 'Zedd', price: 380000, genre: 'Electro Pop', popularity: 97, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Zedd_2013-09-07_001.jpg/800px-Zedd_2013-09-07_001.jpg' },
    { id: 'sa', name: 'Steve Aoki', price: 380000, genre: 'Electro House', popularity: 97, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Steve_Aoki_Electric_Forest_2015.jpg/800px-Steve_Aoki_Electric_Forest_2015.jpg' },
    { id: 'al_v2', name: 'Amelie Lens', price: 380000, genre: 'Techno', popularity: 98, image: 'https://i1.sndcdn.com/avatars-000499628310-j8m2j2-t500x500.jpg' },
    { id: 'james-hype_v2', name: 'James Hype', price: 380000, genre: 'Tech House', popularity: 98, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'tt', name: 'Timmy Trumpet', price: 350000, genre: 'Psytrance', popularity: 96, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Timmy_Trumpet_Tomorrowland_2017.jpg/800px-Timmy_Trumpet_Tomorrowland_2017.jpg' },
    { id: 'js_v2', name: 'John Summit', price: 350000, genre: 'Tech House', popularity: 98, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'slander_v2', name: 'Slander', price: 350000, genre: 'Heaven Trap', popularity: 97, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'dom-dolla_v2', name: 'Dom Dolla', price: 340000, genre: 'Tech House', popularity: 97, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'vintage-culture-v2', name: 'Vintage Culture', price: 340000, genre: 'House', popularity: 97, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'richie-hawtin_v2', name: 'Richie Hawtin', price: 340000, genre: 'Legend', popularity: 98, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Richie_Hawtin_2011.jpg/800px-Richie_Hawtin_2011.jpg' },
    { id: 'aj', name: 'Afrojack', price: 320000, genre: 'Dutch House', popularity: 95, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Afrojack_NRJ_Music_Awards_2012.jpg/800px-Afrojack_NRJ_Music_Awards_2012.jpg' },
    { id: 'lf', name: 'Lost Frequencies', price: 320000, genre: 'Deep House', popularity: 96, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Lost_Frequencies_Tomorrowland_2015.jpg/800px-Lost_Frequencies_Tomorrowland_2015.jpg' },
    { id: 'bb_v2', name: 'Michael Bibi', price: 320000, genre: 'Tech House', popularity: 96, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'vintage-culture_v3', name: 'Vintage Culture', price: 320000, genre: 'House', popularity: 97, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'camelphat_v2', name: 'Camelphat', price: 320000, genre: 'Melodic House', popularity: 97, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'br_v2', name: 'Boris Brejcha', price: 320000, genre: 'High-Tech Minimal', popularity: 98, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'artbat_v2', name: 'Artbat', price: 320000, genre: 'Melodic Techno', popularity: 97, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'su_v2', name: 'Subtronics', price: 320000, genre: 'Bass', popularity: 97, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'meduza-v3', name: 'Meduza', price: 320000, genre: 'Dance', popularity: 97, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'camel-phat_v3', name: 'CamelPhat', price: 320000, genre: 'Melodic House', popularity: 97, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'jeff-mills_v2', name: 'Jeff Mills', price: 320000, genre: 'Legendary', popularity: 98, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Jeff_Mills_2004.jpg/800px-Jeff_Mills_2004.jpg' },

    // --- TECH HOUSE / HOUSE / MINIMAL ---
    { id: 'js-v2', name: 'John Summit', price: 350000, genre: 'Tech House', popularity: 98, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'm-v2', name: 'Mochakk', price: 280000, genre: 'Tech House', popularity: 97, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'bb-v3', name: 'Michael Bibi', price: 320000, genre: 'Tech House', popularity: 96, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'fg-v3', name: 'Fisher', price: 550000, genre: 'Tech House', popularity: 99, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'pg-v3', name: 'Peggy Gou', price: 450000, genre: 'House', popularity: 98, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'fa-v3', name: 'Fred again..', price: 950000, genre: 'Future Garage', popularity: 99, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'ca-v2', name: 'Cassian', price: 140000, genre: 'Melodic Techno', popularity: 94, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'p-v2', name: 'Pawsa', price: 180000, genre: 'Minimal House', popularity: 93, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'an-v2', name: 'Anotr', price: 190000, genre: 'No Art', popularity: 95, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'cl-v2', name: 'Chris Lake', price: 280000, genre: 'Tech House', popularity: 97, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'mp-v2', name: 'Mau P', price: 220000, genre: 'Tech House', popularity: 97, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'jj-v2', name: 'Jamie Jones', price: 240000, genre: 'House', popularity: 96, image: 'https://i1.sndcdn.com/avatars-000305886364-m3v3m3-t500x500.jpg' },
    { id: 'clap', name: 'Claptone', price: 180000, genre: 'House', popularity: 95 },
    { id: 'the-martinez', name: 'Martinez Brothers', price: 260000, genre: 'House', popularity: 96 },
    { id: 'gorgon-city', name: 'Gorgon City', price: 160000, genre: 'House', popularity: 94 },
    { id: 'vintage-culture', name: 'Vintage Culture', price: 320000, genre: 'House', popularity: 97 },
    { id: 'dom-dolla', name: 'Dom Dolla', price: 340000, genre: 'Tech House', popularity: 97 },
    { id: 'cloonee', name: 'Cloonee', price: 150000, genre: 'Tech House', popularity: 93 },
    { id: 'solardo', name: 'Solardo', price: 130000, genre: 'Tech House', popularity: 92 },
    { id: 'camelphat', name: 'Camelphat', price: 320000, genre: 'Melodic House', popularity: 97 },
    { id: 'meduza', name: 'Meduza', price: 280000, genre: 'Tech House', popularity: 97 },

    // --- TECHNO ---
    { id: 'cdw', name: 'Charlotte de Witte', price: 450000, genre: 'Techno', popularity: 99 },
    { id: 'al', name: 'Amelie Lens', price: 380000, genre: 'Techno', popularity: 98 },
    { id: 'cc', name: 'Carl Cox', price: 400000, genre: 'Legendary', popularity: 99 },
    { id: 'ab', name: 'Adam Beyer', price: 260000, genre: 'Techno', popularity: 97 },
    { id: 'nk', name: 'Nina Kraviz', price: 280000, genre: 'Techno', popularity: 96 },
    { id: 'ihm', name: 'I Hate Models', price: 220000, genre: 'Industrial', popularity: 95 },
    { id: 'br', name: 'Boris Brejcha', price: 320000, genre: 'High-Tech Minimal', popularity: 98 },
    { id: 'kb', name: 'Klangkuenstler', price: 260000, genre: 'Hard Techno', popularity: 96 },
    { id: 'ip', name: 'Indira Paganotto', price: 210000, genre: 'Psy-Techno', popularity: 94 },
    { id: 'sara-landry', name: 'Sara Landry', price: 240000, genre: 'Hard Techno', popularity: 93 },
    { id: 'deborah-de-luca', name: 'Deborah De Luca', price: 220000, genre: 'Techno', popularity: 95 },
    { id: 'enrico-sangiuliano', name: 'Enrico Sangiuliano', price: 190000, genre: 'Techno', popularity: 93 },
    { id: 'reinier-zonneveld', name: 'Reinier Zonneveld', price: 250000, genre: 'Acid Techno', popularity: 96 },
    { id: 'nicole-moudaber', name: 'Nicole Moudaber', price: 160000, genre: 'Techno', popularity: 92 },
    { id: 'pan-pot', name: 'Pan-Pot', price: 150000, genre: 'Techno', popularity: 92 },
    { id: 'maceo-plex', name: 'Maceo Plex', price: 220000, genre: 'Melodic Techno', popularity: 95 },
    { id: 'tale-of-us', name: 'Tale of Us', price: 650000, genre: 'Afterlife', popularity: 99 },
    { id: 'anyma', name: 'Anyma', price: 550000, genre: 'Afterlife', popularity: 98 },
    { id: 'innellea', name: 'Innellea', price: 140000, genre: 'Melodic Techno', popularity: 92 },
    { id: 'kevin-de-vries', name: 'Kevin de Vries', price: 130000, genre: 'Melodic Techno', popularity: 91 },

    // --- MELODIC / PROGRESSIVE / AFRO ---
    { id: 'ko', name: 'Keinemusik (CRME)', price: 950000, genre: 'Afro House', popularity: 99 },
    { id: 'bo', name: 'Black Coffee', price: 420000, genre: 'Afro House', popularity: 98 },
    { id: 'ru', name: 'Rüfüs Du Sol', price: 750000, genre: 'Live Electronic', popularity: 99 },
    { id: 'at', name: 'Anyma / Tale of Us', price: 850000, genre: 'Afterlife', popularity: 99 },
    { id: 'la', name: 'Lane 8', price: 240000, genre: 'Melodic House', popularity: 95 },
    { id: 'solomun', name: 'Solomun', price: 450000, genre: 'Deep House', popularity: 98 },
    { id: 'ben-boehmer', name: 'Ben Böhmer', price: 240000, genre: 'Melodic', popularity: 95 },
    { id: 'adriatique', name: 'Adriatique', price: 280000, genre: 'Melodic', popularity: 96 },
    { id: 'monolink', name: 'Monolink', price: 220000, genre: 'Live', popularity: 95 },
    { id: 'artbat', name: 'Artbat', price: 320000, genre: 'Melodic Techno', popularity: 97 },
    { id: 'yotto', name: 'Yotto', price: 120000, genre: 'Melodic', popularity: 91 },
    { id: 'tinlicker', name: 'Tinlicker', price: 140000, genre: 'Melodic', popularity: 92 },
    { id: 'gioli-assia', name: 'Giolì & Assia', price: 160000, genre: 'Live', popularity: 93 },

    // --- BASS / DUBSTEP / TRAP ---
    { id: 'sk', name: 'Skrillex', price: 650000, genre: 'Bass Music', popularity: 99 },
    { id: 'ex', name: 'Excision', price: 480000, genre: 'Dubstep', popularity: 98 },
    { id: 'su', name: 'Subtronics', price: 320000, genre: 'Bass', popularity: 97 },
    { id: 'ng', name: 'NGHTMRE', price: 180000, genre: 'Trap', popularity: 94 },
    { id: 'illumineum', name: 'Illenium', price: 450000, genre: 'Future Bass', popularity: 98 },
    { id: 'rezz', name: 'Rezz', price: 280000, genre: 'Mid-Tempo', popularity: 96 },
    { id: 'zeds-dead', name: 'Zeds Dead', price: 280000, genre: 'Bass House', popularity: 96 },
    { id: 'liquid-stranger', name: 'Liquid Stranger', price: 180000, genre: 'Freeform Bass', popularity: 93 },
    { id: 'peekaboo', name: 'Peekaboo', price: 110000, genre: 'Dubstep', popularity: 90 },
    { id: 'slander', name: 'Slander', price: 350000, genre: 'Heaven Trap', popularity: 97 },
    { id: 'isoxo', name: 'IsoXo', price: 140000, genre: 'Trap', popularity: 92 },
    { id: 'knock2', name: 'Knock2', price: 150000, genre: 'Bass House', popularity: 93 },

    // --- RISING STARS / FUTURE HEROES ---
    { id: 'me', name: 'Mesto', price: 55000, genre: 'Future House', popularity: 88 },
    { id: 'jo', name: 'Joel Corry', price: 160000, genre: 'Dance', popularity: 96 },
    { id: 'hu', name: 'Hugel', price: 130000, genre: 'Latin House', popularity: 93 },
    { id: 'of', name: 'Öwnboss', price: 110000, genre: 'Bass House', popularity: 91 },
    { id: 'azim', name: 'Azzecca', price: 35000, genre: 'House', popularity: 85 },
    { id: 'adamten', name: 'Adam Ten', price: 45000, genre: 'Indie Dance', popularity: 86 },
    { id: 'zorza', name: 'Zorza', price: 25000, genre: 'Techno', popularity: 82 },
    { id: 'sam-wolfe', name: 'Sam WOLFE', price: 30000, genre: 'Techno', popularity: 84 },
    { id: 'nitti', name: 'NITTI', price: 85000, genre: 'House', popularity: 88 },
    { id: 'meduso', name: 'Meduso', price: 28000, genre: 'Bass', popularity: 82 },
    { id: 'eliminate', name: 'Eliminate', price: 65000, genre: 'Bass', popularity: 87 },
    { id: 'fairlane', name: 'Fairlane', price: 55000, genre: 'Future Bass', popularity: 86 },
    { id: 'acraze', name: 'Acraze', price: 140000, genre: 'House', popularity: 94 },
    { id: 'topic', name: 'Topic', price: 180000, genre: 'Dance Pop', popularity: 95 },
    { id: 'sigala', name: 'Sigala', price: 160000, genre: 'Dance Pop', popularity: 94 },
    { id: 'jonas-blue', name: 'Jonas Blue', price: 190000, genre: 'Tropical House', popularity: 95 },
    { id: 'kygo', name: 'Kygo', price: 850000, genre: 'Tropical House', popularity: 99 },
    { id: 'chainsmokers', name: 'The Chainsmokers', price: 950000, genre: 'Electro Pop', popularity: 99 },
    { id: 'marsh', name: 'Marsh', price: 85000, genre: 'Progressive House', popularity: 89 },
    { id: 'cristoph', name: 'Cristoph', price: 95000, genre: 'Progressive', popularity: 90 },
    { id: 'franky-wah', name: 'Franky Wah', price: 110000, genre: 'Melodic House', popularity: 92 },
    { id: 'korolova', name: 'Korolova', price: 160000, genre: 'Melodic Techno', popularity: 94 },
    { id: 'miss-monique', name: 'Miss Monique', price: 180000, genre: 'Melodic Techno', popularity: 95 },
    { id: 'camel-phat', name: 'CamelPhat', price: 320000, genre: 'Melodic House', popularity: 97 },
    { id: 'solardo-v2', name: 'Solardo', price: 140000, genre: 'Tech House', popularity: 92 },
    { id: 'wade', name: 'Wade', price: 190000, genre: 'Tech House', popularity: 95 },
    { id: 'tita-lau', name: 'Tita Lau', price: 95000, genre: 'Tech House', popularity: 90 },
    { id: 'james-hype', name: 'James Hype', price: 380000, genre: 'Tech House', popularity: 98 },
    { id: 'meduza-v2', name: 'Meduza', price: 320000, genre: 'Dance', popularity: 97 },
    { id: 'vintage-culture-v2', name: 'Vintage Culture', price: 340000, genre: 'House', popularity: 97 },
    { id: 'joshwa', name: 'Joshwa', price: 75000, genre: 'Tech House', popularity: 88 },
    { id: 'walker-royce', name: 'Walker & Royce', price: 120000, genre: 'House', popularity: 92 },
    { id: 'sidepiece', name: 'SIDEPIECE', price: 180000, genre: 'House', popularity: 95 },
    { id: 'claudia-leo', name: 'Claudia Leon', price: 35000, genre: 'Techno', popularity: 84 },
    { id: 'stella-bossi', name: 'Stella Bossi', price: 110000, genre: 'Techno', popularity: 92 },
    { id: 'nina-kraviz-v2', name: 'Nina Kraviz', price: 280000, genre: 'Techno', popularity: 96 },
    { id: 'fja', name: 'FJAAK', price: 140000, genre: 'Techno', popularity: 92 },
    { id: 'kobosil', name: 'Kobosil', price: 180000, genre: 'Techno', popularity: 94 },
    { id: 'dax-j', name: 'Dax J', price: 140000, genre: 'Techno', popularity: 91 },
    { id: 'shd', name: 'SPFDJ', price: 110000, genre: 'Industrial Techno', popularity: 89 },
    { id: 'vtss', name: 'VTSS', price: 120000, genre: 'Techno', popularity: 91 },
    { id: 'hector-oaks', name: 'Hector Oaks', price: 130000, genre: 'Techno', popularity: 91 },
    { id: 'ellen-allien', name: 'Ellen Allien', price: 150000, genre: 'Techno', popularity: 93 },
    { id: 'rodhad', name: 'Rødhåd', price: 140000, genre: 'Techno', popularity: 91 },
    { id: 'ben-klock', name: 'Ben Klock', price: 220000, genre: 'Berghain Techno', popularity: 96 },
    { id: 'marcel-dettmann', name: 'Marcel Dettmann', price: 210000, genre: 'Techno', popularity: 95 },
    { id: 'dj-nobu', name: 'DJ Nobu', price: 120000, genre: 'Deep Techno', popularity: 90 },
    { id: 'djs', name: 'DJ Stingray 313', price: 130000, genre: 'Electro Techno', popularity: 91 },
    { id: 'jeff-mills', name: 'Jeff Mills', price: 320000, genre: 'Legendary', popularity: 98 },
    { id: 'richie-hawtin', name: 'Richie Hawtin', price: 340000, genre: 'Legend', popularity: 98 },
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
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [randomEvent, setRandomEvent] = useState<typeof RANDOM_EVENTS[0] | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGenreFilter, setSelectedGenreFilter] = useState('ALL');
    const [priceSort, setPriceSort] = useState<'ASC' | 'DESC' | 'NONE'>('NONE');
    const [advisorTip, setAdvisorTip] = useState<{ name: string, tip: string, avatar: string } | null>(null);
    const [posterStyle, setPosterStyle] = useState<'ULTRA' | 'TOMORROWLAND' | 'EDC'>('ULTRA');

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
        const randomBudget = Math.floor(Math.random() * (10000000 - 1000000 + 1)) + 1000000;
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

        // Talent Scout initial tip
        const tips = [
            { name: "John, Scout Senior", avatar: "👨‍💼", tip: "L'Afro House est en feu ! Si tu peux choper Keinemusik ou Black Coffee, ton festival va exploser sur Insta." },
            { name: "Sarah, Liaison Booking", avatar: "👩‍🎤", tip: "Les USA ne jurent que par John Summit et Mau P. Booke-les pour attirer le public international." },
            { name: "Marc, Strategist Lab", avatar: "👨‍🔬", tip: "La techno mélodique type Afterlife est ultra tendance. Anyma et Tale of Us garantissent un sold-out." },
            { name: "Lucie, Trend Hunter", avatar: "👩‍💻", tip: "Indira Paganotto et Charlotte de Witte dominent la scène techno. Un lineup 100% Techno Berlin, c'est le move du moment." },
            { name: "Viktor, Underground King", avatar: "🥷", tip: "Le public réclame du brut. Le retour du Hard Groove et de la Techno 90s est massif. Pense à Marlon Hoffstadt." }
        ];
        setAdvisorTip(tips[Math.floor(Math.random() * tips.length)]);

        setGameState('ONBOARDING');
        setGameStarted(true);
    };

    const confirmOnboarding = () => {
        if (!playerName || !playerEmail || !festivalName) return;
        setGameState('BOOKING');
    };

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

    const toggleDj = async (dj: typeof DJ_POOL[0]) => {
        if (selectedDjs.find(d => d.id === dj.id)) {
            setSelectedDjs(prev => prev.filter(d => d.id !== dj.id));
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
            setBookingStatus({
                djId: dj.id,
                status: 'REJECTED',
                message: `${activeAgent.name}: "Désolé, l'offre ne correspond pas aux attentes de l'artiste pour ce weekend."`
            });
        }

        setTimeout(() => setBookingStatus(null), 5000);
    };

    const handleShare = (platform: 'twitter' | 'facebook' | 'instagram' | 'tiktok' | 'native') => {
        const artistsText = selectedDjs.map(dj => `@${dj.name.replace(/\s+/g, '')}`).join(' ');
        const shareText = `Line-up de folie pour mon festival "${festivalName}" ! ⚡️ Avec ${artistsText}. Bilan : ${attendance.toLocaleString()} fans ! 🚀🕺 @Dropsiders #Tycoon #Festival`;
        const shareUrl = "https://dropsiders.com/communaute";

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
            instagram: `https://www.instagram.com/`,
            tiktok: `https://www.tiktok.com/`
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
        if (selectedCosts.length < 3 || selectedDjs.length < 5 || !selectedDate) return;

        const styles: ('ULTRA' | 'TOMORROWLAND' | 'EDC')[] = ['ULTRA', 'TOMORROWLAND', 'EDC'];
        setPosterStyle(styles[Math.floor(Math.random() * styles.length)]);

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

                                                {/* Advisor Character */}
                                                <div className="p-6 bg-white/[0.03] border border-white/10 rounded-[2rem] relative overflow-hidden group hover:border-amber-400/30 transition-all duration-500">
                                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                                        <Sparkles className="w-12 h-12 text-amber-400" />
                                                    </div>
                                                    <div className="flex gap-5 relative z-10">
                                                        <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shrink-0 shadow-2xl overflow-hidden border-2 border-white/10">
                                                            <span className="text-3xl">{advisorTip?.avatar || "👤"}</span>
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h4 className="text-[10px] font-black uppercase text-amber-400 tracking-[0.2em]">{advisorTip?.name || "Conseiller Talent"}</h4>
                                                                <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse" />
                                                            </div>
                                                            <p className="text-xs font-bold text-white/70 italic leading-relaxed">
                                                                "{advisorTip?.tip}"
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

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
                                                        <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Date de l'Event</span>
                                                        <span className="text-[9px] font-mono text-amber-400 italic">Mandatoire</span>
                                                    </div>
                                                    <div className="relative group">
                                                        <input
                                                            type="date"
                                                            value={selectedDate}
                                                            onChange={(e) => setSelectedDate(e.target.value)}
                                                            className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-white uppercase focus:outline-none focus:border-amber-400 transition-all duration-300"
                                                        />
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
                                                    disabled={selectedCosts.length < 3 || selectedDjs.length < 5 || remainingBudget < 0 || !selectedDate}
                                                    onClick={generatePoster}
                                                    className="w-full py-6 rounded-[1.5rem] bg-white text-black font-black text-xs uppercase tracking-[0.3em] disabled:opacity-20 disabled:cursor-not-allowed hover:bg-neon-red hover:text-white transition-all duration-500 flex items-center justify-center gap-4"
                                                >
                                                    {!selectedDate ? "Choisis une date..." : selectedDjs.length < 5 ? `Encore ${5 - selectedDjs.length} artistes...` : "Générer la Line-up"}
                                                    <Sparkles className="w-4 h-4" />
                                                </button>
                                            </div>
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

                                            {/* AI Booking Notification Status */}
                                            <AnimatePresence mode="wait">
                                                {/* Status Placeholder for layout spacing */}
                                                {!bookingStatus && (
                                                    <div className="p-5 rounded-[2rem] bg-white/[0.03] border border-white/5 flex items-center gap-4 text-white/20">
                                                        <div className="w-10 h-10 border border-white/10 rounded-xl flex items-center justify-center">
                                                            <Music className="w-4 h-4 opacity-50" />
                                                        </div>
                                                        <span className="text-[10px] font-black uppercase tracking-[0.4em] italic">Clique sur un artiste pour lancer la négociation...</span>
                                                    </div>
                                                )}
                                                {bookingStatus && (
                                                    <div className="p-5 rounded-[2rem] bg-amber-400/5 border border-amber-400/10 flex items-center gap-4 text-amber-400/40">
                                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                                        <span className="text-[10px] font-black uppercase tracking-[0.4em] italic">Négociation en cours (voir carte)...</span>
                                                    </div>
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
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
                                    <motion.div
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className={twMerge(
                                            "relative aspect-[1.3/2] border-[12px] shadow-[0_60px_120px_rgba(0,0,0,0.9)] rounded-[2.5rem] p-8 md:p-12 overflow-hidden transition-all duration-1000",
                                            posterStyle === 'ULTRA' ? "bg-gradient-to-b from-[#00bfff] via-[#000033] to-black border-white" :
                                                posterStyle === 'TOMORROWLAND' ? "bg-[#0a0a0a] border-[#d4af37] shadow-[0_0_50px_rgba(212,175,55,0.2)]" :
                                                    "bg-[#050505] border-transparent"
                                        )}
                                    >
                                        {/* EDC Specific Border Aura */}
                                        {posterStyle === 'EDC' && (
                                            <div className="absolute inset-0 border-[12px] border-transparent rounded-[2.5rem] shadow-[inset_0_0_50px_rgba(255,0,255,0.5),0_0_50px_rgba(0,255,255,0.5)] z-50 pointer-events-none" />
                                        )}

                                        {/* Background Patterns based on Style */}
                                        {posterStyle === 'ULTRA' && (
                                            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white opacity-[0.02] rounded-full blur-3xl" />
                                                <div className="absolute top-20 left-1/2 -translate-x-1/2 text-[250px] md:text-[300px] font-black text-white/5 select-none leading-none">U</div>
                                            </div>
                                        )}
                                        {posterStyle === 'TOMORROWLAND' && (
                                            <div className="absolute inset-0 pointer-events-none">
                                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-paper.png')] opacity-20" />
                                                <div className="absolute inset-0 border-[2px] border-[#d4af37]/30 m-4 rounded-[1.8rem]" />
                                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_40%,#d4af3715,transparent_60%)]" />
                                            </div>
                                        )}
                                        {posterStyle === 'EDC' && (
                                            <div className="absolute inset-0 pointer-events-none">
                                                <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[conic-gradient(from_0deg,#ff00ff,#00ffff,#ffff00,#ff00ff)] opacity-10 animate-spin-slow" />
                                                <div className="absolute inset-0 backdrop-blur-[100px]" />
                                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#ff00ff22,transparent_70%)]" />
                                            </div>
                                        )}

                                        <div className="relative z-10 h-full flex flex-col items-center text-center">
                                            <div className="flex flex-col items-center gap-4 md:gap-6 mb-12 md:mb-16">
                                                <div className={twMerge(
                                                    "px-6 py-2 text-[8px] md:text-[9px] font-black uppercase tracking-[0.5em] rounded-full border",
                                                    posterStyle === 'ULTRA' ? "bg-white text-black border-white" :
                                                        posterStyle === 'TOMORROWLAND' ? "bg-transparent text-[#d4af37] border-[#d4af37]/50" :
                                                            "bg-gradient-to-r from-[#ff00ff] to-[#00ffff] text-white border-transparent"
                                                )}>
                                                    {posterStyle} EXPERIENCE PRESENTS
                                                </div>
                                                <h1 className={twMerge(
                                                    "text-5xl md:text-7xl font-display font-black uppercase tracking-tighter leading-[0.9]",
                                                    posterStyle === 'ULTRA' ? "text-white italic" :
                                                        posterStyle === 'TOMORROWLAND' ? "text-[#fafafa] font-serif tracking-normal" :
                                                            "text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]"
                                                )}>
                                                    {festivalName.split(' ')[0]} <br />
                                                    <span className={twMerge(
                                                        "text-3xl md:text-4xl",
                                                        posterStyle === 'TOMORROWLAND' ? "text-[#d4af37]/80" : "text-white/80"
                                                    )}>
                                                        {festivalName.split(' ').slice(1).join(' ') || 'FESTIVAL'}
                                                    </span>
                                                </h1>
                                                <div className={twMerge(
                                                    "w-24 h-1",
                                                    posterStyle === 'TOMORROWLAND' ? "bg-[#d4af37]" : "bg-white"
                                                )} />
                                            </div>

                                            <div className="flex-1 w-full space-y-8 md:space-y-10 overflow-y-auto custom-scrollbar pr-2">
                                                <div className="space-y-4 md:space-y-6">
                                                    <span className={twMerge(
                                                        "text-[8px] md:text-[9px] font-black uppercase tracking-[0.6em] block",
                                                        posterStyle === 'TOMORROWLAND' ? "text-[#d4af37]/60" : "text-white/40"
                                                    )}>Starring In Order of Appearance</span>

                                                    <div className="flex flex-col gap-3 md:gap-4">
                                                        {selectedDjs.map((dj, i) => (
                                                            <motion.div
                                                                initial={{ opacity: 0, scale: 0.9 }}
                                                                animate={{ opacity: 1, scale: 1 }}
                                                                transition={{ delay: 0.5 + (i * 0.1) }}
                                                                key={dj.id}
                                                                className="flex items-center justify-center gap-3 md:gap-4"
                                                            >
                                                                {i === 0 && <div className={twMerge("w-1.5 md:w-2 h-1.5 md:h-2 rounded-full", posterStyle === 'TOMORROWLAND' ? "bg-[#d4af37]" : "bg-white")} />}
                                                                <span className={twMerge(
                                                                    "font-display font-black uppercase leading-none",
                                                                    posterStyle === 'ULTRA' ? "text-white italic tracking-tighter" :
                                                                        posterStyle === 'TOMORROWLAND' ? "text-[#fafafa] font-serif tracking-wide" :
                                                                            "text-white tracking-widest",
                                                                    i === 0 ? 'text-4xl md:text-5xl' : i < 3 ? 'text-xl md:text-2xl opacity-80' : 'text-sm md:text-lg opacity-50'
                                                                )}>
                                                                    {dj.name}
                                                                </span>
                                                                {i === 0 && <div className={twMerge("w-1.5 md:w-2 h-1.5 md:h-2 rounded-full", posterStyle === 'TOMORROWLAND' ? "bg-[#d4af37]" : "bg-white")} />}
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="pt-6 md:pt-8 flex flex-wrap justify-center gap-2 md:gap-3 opacity-60">
                                                    {FIX_COSTS.filter(c => selectedCosts.includes(c.id)).map(cost => (
                                                        <div key={cost.id} className={twMerge(
                                                            "px-3 py-1 border rounded-sm flex items-center gap-2 md:gap-3",
                                                            posterStyle === 'TOMORROWLAND' ? "border-[#d4af37]/20 text-[#d4af37]" : "border-white/20 text-white"
                                                        )}>
                                                            <cost.icon className="w-2.5 md:w-3 h-2.5 md:h-3" />
                                                            <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest leading-none">{cost.name.split(' ')[0]}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className={twMerge(
                                                "w-full pt-8 md:pt-10 border-t flex justify-between items-center",
                                                posterStyle === 'TOMORROWLAND' ? "border-[#d4af37]/30" : "border-white/10"
                                            )}>
                                                <div className="text-left space-y-2 md:space-y-3">
                                                    <div>
                                                        <p className={twMerge("text-[7px] md:text-[8px] font-black uppercase tracking-widest", posterStyle === 'TOMORROWLAND' ? "text-[#d4af37]/60" : "text-white/40")}>Location & Setup</p>
                                                        <p className={twMerge("text-xs md:text-sm font-black uppercase italic leading-none mt-1", posterStyle === 'TOMORROWLAND' ? "text-[#d4af37]" : "text-white")}>
                                                            {selectedLocation.name.split(' - ')[0]} • {stageCount} MAIN SESSIONS
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="text-center bg-white/5 backdrop-blur-md px-3 md:px-4 py-1.5 md:py-2 rounded-lg border border-white/10 shrink-0">
                                                    <p className="text-[7px] md:text-[8px] font-black text-white/40 uppercase tracking-widest mb-0.5 md:mb-1 leading-none">Live Date</p>
                                                    <p className="text-xs md:text-sm font-mono font-black text-white uppercase tracking-tighter leading-none">
                                                        {selectedDate ? new Date(selectedDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '01.06.1988'} — 2026
                                                    </p>
                                                </div>

                                                <div className="text-right">
                                                    <img
                                                        src="/Logo.png"
                                                        className={twMerge(
                                                            "h-8 md:h-12 w-auto object-contain",
                                                            posterStyle === 'TOMORROWLAND' ? "brightness-150 sepia" : "brightness-200"
                                                        )}
                                                        alt="DROPSIDERS"
                                                    />
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
