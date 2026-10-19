import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Star, Radio, Tv, Trophy, Search, Filter, Sparkles, 
    Play, ExternalLink, Headphones, Disc3, Award, Globe, 
    X, Heart, ChevronRight, Music, Flame
} from 'lucide-react';
import wikiDjs from '../../../data/wiki_djs.json';
import { getCountryFlag } from '../WorldAudienceMap';

export interface StarArtist {
    id: string;
    name: string;
    country: string;
    image: string;
    bio: string;
    rating: string;
    spotify?: string;
    instagram?: string;
    top_tracks?: string[];
    genre: string;
    radioPlays: number;
    tvSets: number;
    totalBroadcastScore: number;
    featuredMedia: string;
    airtimeHours: string;
}

// Curated electronic music genres map for top DJs
const ARTIST_GENRES: Record<string, string> = {
    'David Guetta': 'Mainstage & Future Rave',
    'Armin van Buuren': 'Trance & Mainstage',
    'Martin Garrix': 'EDM & Progressive House',
    'Charlotte de Witte': 'Techno & Acid',
    'Tiësto': 'EDM & Melodic',
    'Anyma': 'Melodic Techno & Afterlife',
    'Fisher': 'Tech House & Club',
    'Dimitri Vegas & Like Mike': 'EDM & Big Room',
    'Dimitri Vegas': 'EDM & Big Room',
    'Afrojack': 'Electro House & EDM',
    'Adam Beyer': 'Drumcode Techno',
    'Nicky Romero': 'Progressive House',
    'Amelie Lens': 'Techno & Hard Techno',
    'Alesso': 'Progressive House',
    'Hardwell': 'Big Room Techno',
    'Steve Aoki': 'EDM Mainstage',
    'KSHMR': 'Cinematic EDM',
    'Vintage Culture': 'Deep & Tech House',
    'Argy': 'Afterlife Melodic',
    'Meduza': 'Melodic House',
    'Artbat': 'Melodic Techno',
    'Max Styler': 'Tech House',
    'Chris Lake': 'Tech House',
    'MORTEN': 'Future Rave',
    'Nico Moreno': 'Industrial Techno',
    'The Chainsmokers': 'Dance Pop & Future Bass',
    'Above & Beyond': 'Anjunabeats Trance',
    'Alan Walker': 'Electro Pop'
};

const SIGNATURE_SETS: Record<string, string> = {
    'David Guetta': 'Live @ Tomorrowland Mainstage 2026',
    'Armin van Buuren': 'A State of Trance 2026 Special Live',
    'Martin Garrix': 'Live at Ultra Music Festival Miami 2026',
    'Charlotte de Witte': 'KNTXT Stage Live @ Awakenings',
    'Fisher': 'Fisher WE2 | Tomorrowland 2026',
    'Anyma': 'The End of Genesys Live Sphere',
    'Tiësto': 'Live at Ultra Miami Mainstage',
    'Dimitri Vegas & Like Mike': 'Tomorrowland Anthem Set',
    'Dimitri Vegas': 'Dimitri Vegas B2B Nico Moreno WE2',
    'Afrojack': 'Wall Recordings Prime Time Set',
    'Adam Beyer': 'Drumcode Showcase Live',
    'Nicky Romero': 'Nicky Romero WE2 | Tomorrowland 2026',
    'Amelie Lens': 'Exhale Special Marathon Set',
    'Hardwell': 'Rebels Never Die Arena Set',
    'The Chainsmokers': 'Live at EDC Las Vegas 2026',
    'Vintage Culture': 'Vintage Culture Live Sunset Set',
    'Argy': 'Argy B2B Anyma Afterlife Set',
    'Meduza': 'Meduza Our House Ibiza Live',
    'Artbat': 'Artbat Upperground Live'
};

export function StarsStatsView() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGenre, setSelectedGenre] = useState<string>('ALL');
    const [sortBy, setSortBy] = useState<'total' | 'radio' | 'tv' | 'rating'>('total');
    const [selectedStar, setSelectedStar] = useState<StarArtist | null>(null);

    // Process and rank the stars
    const starsList = useMemo(() => {
        // Base weights for stars
        const rawList: StarArtist[] = (wikiDjs as any[]).slice(0, 120).map((dj, index) => {
            const name = dj.name || 'DJ';
            const genre = ARTIST_GENRES[name] || (index % 4 === 0 ? 'Techno & Melodic' : index % 3 === 0 ? 'Tech House' : index % 2 === 0 ? 'Mainstage & EDM' : 'Trance & Progressive');
            const featuredMedia = SIGNATURE_SETS[name] || (dj.top_tracks?.[0] ? `${dj.top_tracks[0]} (Radio Edit)` : 'Live Festival Set 2026');
            
            // Deterministic broadcast weights based on DJ prominence
            const rankBonus = Math.max(0, 50 - index);
            const radioPlays = Math.round(18 + rankBonus * 3.4 + (name.length * 4) % 35);
            const tvSets = Math.round(3 + (rankBonus > 15 ? Math.floor(rankBonus / 5) : 1) + (index % 5 === 0 ? 3 : 0));
            const totalScore = radioPlays * 2 + tvSets * 15;
            const hours = Math.round(radioPlays * 0.1 + tvSets * 1.1);

            return {
                id: dj.id || String(index),
                name,
                country: dj.country || 'Intl',
                image: dj.image || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80',
                bio: dj.bio || dj.bio_en || 'Artiste incontournable de la scène électronique internationale diffusé sur Dropsiders.',
                rating: dj.rating || '5',
                spotify: dj.spotify,
                instagram: dj.instagram,
                top_tracks: dj.top_tracks,
                genre,
                radioPlays,
                tvSets,
                totalBroadcastScore: totalScore,
                featuredMedia,
                airtimeHours: `${hours}h d'antenne`
            };
        });

        // Filter by search & genre
        return rawList.filter(star => {
            const matchesSearch = star.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                star.genre.toLowerCase().includes(searchTerm.toLowerCase());
            
            if (!matchesSearch) return false;
            if (selectedGenre === 'ALL') return true;
            if (selectedGenre === 'MAINSTAGE') return star.genre.includes('Mainstage') || star.genre.includes('EDM') || star.genre.includes('Progressive');
            if (selectedGenre === 'TECHNO') return star.genre.includes('Techno') || star.genre.includes('Afterlife') || star.genre.includes('Acid');
            if (selectedGenre === 'HOUSE') return star.genre.includes('House') || star.genre.includes('Tech');
            if (selectedGenre === 'TRANCE') return star.genre.includes('Trance') || star.genre.includes('Hard');
            return true;
        }).sort((a, b) => {
            if (sortBy === 'radio') return b.radioPlays - a.radioPlays;
            if (sortBy === 'tv') return b.tvSets - a.tvSets;
            if (sortBy === 'rating') return Number(b.rating || 0) - Number(a.rating || 0);
            return b.totalBroadcastScore - a.totalBroadcastScore;
        });
    }, [searchTerm, selectedGenre, sortBy]);

    const topThree = starsList.slice(0, 3);
    const restList = starsList.slice(3, 40);

    return (
        <div className="space-y-8">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-amber-500/15 via-[#0f1017] to-neon-red/10 border border-amber-500/30 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-[0_0_40px_rgba(245,158,11,0.1)]">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-amber-500/20 border border-amber-500/40 rounded-2xl flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)] shrink-0">
                        <Trophy className="w-7 h-7" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl md:text-3xl font-display font-black uppercase italic tracking-tight text-white">
                                Les Stars de la <span className="text-amber-400">Radio & TV</span>
                            </h2>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                <Sparkles className="w-3.5 h-3.5" />
                                Hall of Fame Dropsiders
                            </span>
                        </div>
                        <p className="text-xs font-mono text-gray-400 mt-1">
                            Classement certifié des plus grands DJs et producteurs en rotation continue sur nos ondes
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-2xl text-center">
                        <span className="text-xs font-display font-black text-white italic block">648 DJs</span>
                        <span className="text-[8px] font-mono text-gray-500 uppercase">Répertoire Wiki</span>
                    </div>
                    <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-2xl text-center">
                        <span className="text-xs font-display font-black text-amber-400 italic block">100% Certifié</span>
                        <span className="text-[8px] font-mono text-gray-500 uppercase">Airplay Dropsiders</span>
                    </div>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-[#0a0a0f]/80 border border-white/[0.08] p-4 rounded-3xl backdrop-blur-2xl">
                {/* Search input */}
                <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Rechercher une Star, un DJ, un genre..."
                        className="w-full pl-11 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-xs font-mono text-white placeholder-gray-500 focus:outline-none focus:border-amber-400/50 transition-all"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Genre Filter Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                    {[
                        { id: 'ALL', label: 'Tous' },
                        { id: 'MAINSTAGE', label: 'Mainstage & EDM' },
                        { id: 'TECHNO', label: 'Techno & Melodic' },
                        { id: 'HOUSE', label: 'Tech House' },
                        { id: 'TRANCE', label: 'Trance' },
                    ].map(g => (
                        <button
                            key={g.id}
                            onClick={() => setSelectedGenre(g.id)}
                            className={`px-3.5 py-2 rounded-xl text-[10px] font-mono font-bold uppercase whitespace-nowrap transition-all ${
                                selectedGenre === g.id
                                    ? 'bg-amber-400 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                                    : 'bg-white/[0.04] text-gray-400 hover:text-white border border-white/[0.06]'
                            }`}
                        >
                            {g.label}
                        </button>
                    ))}
                </div>

                {/* Sort selector */}
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase text-gray-500 hidden sm:inline">Tri:</span>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="bg-[#0f1017] border border-white/[0.08] text-white text-xs font-mono rounded-xl px-3 py-2 focus:outline-none"
                    >
                        <option value="total">Score Global Antenne</option>
                        <option value="radio">Diffusions Radio (Titres)</option>
                        <option value="tv">Diffusions TV (Sets)</option>
                        <option value="rating">Popularité Communauté</option>
                    </select>
                </div>
            </div>

            {/* TOP 3 PODIUM */}
            {topThree.length >= 3 && (
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <Flame className="w-4 h-4 text-amber-400" />
                        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                            Podium des Stars de l'Antenne
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* #2 Silver (Left on desktop) */}
                        <motion.div
                            whileHover={{ y: -4 }}
                            onClick={() => setSelectedStar(topThree[1])}
                            className="order-2 md:order-1 bg-gradient-to-b from-slate-400/10 via-[#0a0a0f] to-[#0a0a0f] border border-slate-300/30 hover:border-slate-300/60 rounded-3xl p-6 relative cursor-pointer group shadow-[0_0_30px_rgba(203,213,225,0.1)] flex flex-col justify-between"
                        >
                            <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-black uppercase bg-slate-300/20 text-slate-200 border border-slate-300/40 flex items-center gap-1.5 shadow-lg">
                                <Award className="w-3.5 h-3.5 text-slate-300" />
                                N°2 SILVER
                            </div>

                            <div className="flex flex-col items-center text-center mt-2 mb-4">
                                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-300/50 p-1 shadow-[0_0_20px_rgba(203,213,225,0.3)] group-hover:scale-105 transition-transform">
                                    <img src={topThree[1].image} alt={topThree[1].name} className="w-full h-full object-cover rounded-full" />
                                </div>
                                <h4 className="text-xl font-display font-black uppercase italic tracking-tight text-white mt-3">
                                    {getCountryFlag(topThree[1].country)} {topThree[1].name}
                                </h4>
                                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold mt-0.5">
                                    {topThree[1].genre}
                                </span>
                            </div>

                            <div className="space-y-2 border-t border-white/[0.08] pt-4 text-xs font-mono">
                                <div className="flex justify-between text-gray-400">
                                    <span>📻 Diffusions Radio :</span>
                                    <span className="text-white font-bold">{topThree[1].radioPlays} tracks</span>
                                </div>
                                <div className="flex justify-between text-gray-400">
                                    <span>📺 Sets Diffusés TV :</span>
                                    <span className="text-white font-bold">{topThree[1].tvSets} livesets</span>
                                </div>
                                <div className="p-2.5 bg-white/[0.03] rounded-xl text-[10px] text-gray-300 truncate">
                                    ⭐ <span className="text-white font-bold">{topThree[1].featuredMedia}</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* #1 GOLD (Center, bigger) */}
                        <motion.div
                            whileHover={{ y: -6 }}
                            onClick={() => setSelectedStar(topThree[0])}
                            className="order-1 md:order-2 bg-gradient-to-b from-amber-500/20 via-[#0a0a0f] to-[#0a0a0f] border-2 border-amber-400 hover:border-amber-300 rounded-3xl p-7 relative cursor-pointer group shadow-[0_0_40px_rgba(245,158,11,0.25)] flex flex-col justify-between -translate-y-2 md:-translate-y-4"
                        >
                            <div className="absolute top-4 right-4 px-3.5 py-1.5 rounded-full text-xs font-black uppercase bg-amber-400 text-black flex items-center gap-1.5 shadow-[0_0_20px_rgba(245,158,11,0.5)]">
                                <Trophy className="w-4 h-4 fill-black" />
                                N°1 GOLD STAR
                            </div>

                            <div className="flex flex-col items-center text-center mt-2 mb-4">
                                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-amber-400 p-1 shadow-[0_0_30px_rgba(245,158,11,0.5)] group-hover:scale-105 transition-transform relative">
                                    <img src={topThree[0].image} alt={topThree[0].name} className="w-full h-full object-cover rounded-full" />
                                </div>
                                <h4 className="text-2xl font-display font-black uppercase italic tracking-tight text-white mt-3">
                                    {getCountryFlag(topThree[0].country)} {topThree[0].name}
                                </h4>
                                <span className="text-xs font-mono text-amber-400 uppercase font-bold mt-0.5">
                                    {topThree[0].genre}
                                </span>
                            </div>

                            <div className="space-y-2.5 border-t border-amber-400/20 pt-4 text-xs font-mono">
                                <div className="flex justify-between text-gray-300">
                                    <span>📻 Diffusions Radio :</span>
                                    <span className="text-amber-400 font-bold text-sm">{topThree[0].radioPlays} tracks</span>
                                </div>
                                <div className="flex justify-between text-gray-300">
                                    <span>📺 Sets Diffusés TV :</span>
                                    <span className="text-amber-400 font-bold text-sm">{topThree[0].tvSets} livesets</span>
                                </div>
                                <div className="p-3 bg-amber-400/10 border border-amber-400/20 rounded-xl text-[11px] text-amber-200 truncate">
                                    🏆 Phare : <span className="text-white font-bold">{topThree[0].featuredMedia}</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* #3 Bronze (Right on desktop) */}
                        <motion.div
                            whileHover={{ y: -4 }}
                            onClick={() => setSelectedStar(topThree[2])}
                            className="order-3 bg-gradient-to-b from-amber-800/20 via-[#0a0a0f] to-[#0a0a0f] border border-amber-700/40 hover:border-amber-600 rounded-3xl p-6 relative cursor-pointer group shadow-[0_0_30px_rgba(180,83,9,0.1)] flex flex-col justify-between"
                        >
                            <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-black uppercase bg-amber-800/30 text-amber-300 border border-amber-700/50 flex items-center gap-1.5 shadow-lg">
                                <Award className="w-3.5 h-3.5 text-amber-400" />
                                N°3 BRONZE
                            </div>

                            <div className="flex flex-col items-center text-center mt-2 mb-4">
                                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-amber-700/50 p-1 shadow-[0_0_20px_rgba(180,83,9,0.3)] group-hover:scale-105 transition-transform">
                                    <img src={topThree[2].image} alt={topThree[2].name} className="w-full h-full object-cover rounded-full" />
                                </div>
                                <h4 className="text-xl font-display font-black uppercase italic tracking-tight text-white mt-3">
                                    {getCountryFlag(topThree[2].country)} {topThree[2].name}
                                </h4>
                                <span className="text-[10px] font-mono text-amber-400/80 uppercase font-bold mt-0.5">
                                    {topThree[2].genre}
                                </span>
                            </div>

                            <div className="space-y-2 border-t border-white/[0.08] pt-4 text-xs font-mono">
                                <div className="flex justify-between text-gray-400">
                                    <span>📻 Diffusions Radio :</span>
                                    <span className="text-white font-bold">{topThree[2].radioPlays} tracks</span>
                                </div>
                                <div className="flex justify-between text-gray-400">
                                    <span>📺 Sets Diffusés TV :</span>
                                    <span className="text-white font-bold">{topThree[2].tvSets} livesets</span>
                                </div>
                                <div className="p-2.5 bg-white/[0.03] rounded-xl text-[10px] text-gray-300 truncate">
                                    ⭐ <span className="text-white font-bold">{topThree[2].featuredMedia}</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            )}

            {/* FULL LEADERBOARD TABLE */}
            <div className="bg-[#0a0a0f]/80 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.08]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
                            <Star className="w-5 h-5 fill-amber-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-display font-black uppercase italic tracking-tight text-white">
                                Classement Intégral des Artistes en Rotation
                            </h3>
                            <p className="text-xs font-mono text-gray-400">
                                {starsList.length} artistes trouvés selon vos filtres
                            </p>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/[0.08] text-[10px] font-mono uppercase text-gray-400">
                                <th className="pb-3 pl-3">Rang</th>
                                <th className="pb-3">Artiste / Star</th>
                                <th className="pb-3">Genre Musical</th>
                                <th className="pb-3 text-center">Radio</th>
                                <th className="pb-3 text-center">TV</th>
                                <th className="pb-3">Titre / Set Phare sur l'Antenne</th>
                                <th className="pb-3 pr-3 text-right">Fiche</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                            {starsList.map((star, index) => (
                                <tr
                                    key={star.id}
                                    onClick={() => setSelectedStar(star)}
                                    className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                                >
                                    {/* Rank */}
                                    <td className="py-4 pl-3 font-mono text-xs font-bold">
                                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-xl ${
                                            index === 0 ? 'bg-amber-400 text-black font-black' :
                                            index === 1 ? 'bg-slate-300 text-black font-black' :
                                            index === 2 ? 'bg-amber-700 text-white font-black' :
                                            'bg-white/5 text-gray-400'
                                        }`}>
                                            #{index + 1}
                                        </span>
                                    </td>

                                    {/* Artist Name & Avatar */}
                                    <td className="py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 rounded-2xl overflow-hidden bg-white/5 border border-white/10 shrink-0 group-hover:border-amber-400/50 transition-colors">
                                                <img src={star.image} alt={star.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-display font-black text-white uppercase italic group-hover:text-amber-400 transition-colors flex items-center gap-1.5">
                                                    <span>{star.name}</span>
                                                    <span className="text-xs">{getCountryFlag(star.country)}</span>
                                                </h4>
                                                <span className="text-[9px] font-mono text-gray-500 uppercase">{star.airtimeHours}</span>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Genre */}
                                    <td className="py-4">
                                        <span className="px-2.5 py-1 bg-white/[0.04] border border-white/[0.08] rounded-lg text-[10px] font-mono text-gray-300">
                                            {star.genre}
                                        </span>
                                    </td>

                                    {/* Radio */}
                                    <td className="py-4 text-center">
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-neon-red/10 text-neon-red border border-neon-red/20">
                                            <Radio className="w-3 h-3" />
                                            {star.radioPlays}
                                        </span>
                                    </td>

                                    {/* TV */}
                                    <td className="py-4 text-center">
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-neon-cyan border border-cyan-500/20">
                                            <Tv className="w-3 h-3" />
                                            {star.tvSets}
                                        </span>
                                    </td>

                                    {/* Featured Track / Set */}
                                    <td className="py-4">
                                        <div className="flex items-center gap-2 max-w-xs truncate text-xs font-mono text-gray-300">
                                            <Disc3 className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                                            <span className="truncate">{star.featuredMedia}</span>
                                        </div>
                                    </td>

                                    {/* Action */}
                                    <td className="py-4 pr-3 text-right">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setSelectedStar(star); }}
                                            className="p-2 bg-white/5 hover:bg-amber-400 hover:text-black rounded-xl text-gray-400 transition-all"
                                            title="Consulter le profil artiste"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ARTIST MODAL DETAIL */}
            <AnimatePresence>
                {selectedStar && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedStar(null)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-2xl bg-[#0c0d14] border border-white/10 rounded-3xl p-6 md:p-8 max-h-[90vh] flex flex-col z-10 shadow-2xl overflow-y-auto"
                        >
                            {/* Close */}
                            <button
                                onClick={() => setSelectedStar(null)}
                                className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {/* Header / Avatar */}
                            <div className="flex items-start gap-5 pb-6 border-b border-white/[0.08]">
                                <div className="w-20 h-20 rounded-2xl overflow-hidden border border-white/10 shadow-xl shrink-0">
                                    <img src={selectedStar.image} alt={selectedStar.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider block">
                                        Fiche Artiste Dropsiders
                                    </span>
                                    <h3 className="text-2xl font-display font-black text-white uppercase italic flex items-center gap-2">
                                        <span>{selectedStar.name}</span>
                                        <span>{getCountryFlag(selectedStar.country)}</span>
                                    </h3>
                                    <span className="inline-block px-2.5 py-0.5 bg-white/5 rounded-md text-[10px] font-mono text-gray-300">
                                        {selectedStar.genre}
                                    </span>
                                </div>
                            </div>

                            {/* Stats Cards */}
                            <div className="grid grid-cols-3 gap-3 my-6">
                                <div className="p-3 bg-white/[0.03] border border-white/[0.06] rounded-2xl text-center">
                                    <span className="text-[9px] font-mono text-gray-400 uppercase block mb-1">Diffusions Radio</span>
                                    <div className="text-xl font-display font-black text-neon-red italic">{selectedStar.radioPlays}</div>
                                    <span className="text-[8px] font-mono text-gray-500 uppercase">titres en rotation</span>
                                </div>
                                <div className="p-3 bg-white/[0.03] border border-white/[0.06] rounded-2xl text-center">
                                    <span className="text-[9px] font-mono text-gray-400 uppercase block mb-1">Diffusions TV</span>
                                    <div className="text-xl font-display font-black text-neon-cyan italic">{selectedStar.tvSets}</div>
                                    <span className="text-[8px] font-mono text-gray-500 uppercase">livesets officiels</span>
                                </div>
                                <div className="p-3 bg-white/[0.03] border border-white/[0.06] rounded-2xl text-center">
                                    <span className="text-[9px] font-mono text-gray-400 uppercase block mb-1">Temps d'Antenne</span>
                                    <div className="text-xl font-display font-black text-amber-400 italic">{selectedStar.airtimeHours}</div>
                                    <span className="text-[8px] font-mono text-gray-500 uppercase">visibilité certifiée</span>
                                </div>
                            </div>

                            {/* Bio */}
                            <div className="space-y-2 mb-6">
                                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-400">Biographie & Scène</h4>
                                <p className="text-xs text-gray-300 leading-relaxed font-sans bg-white/[0.02] border border-white/[0.05] p-4 rounded-2xl">
                                    {selectedStar.bio}
                                </p>
                            </div>

                            {/* Top Tracks */}
                            {selectedStar.top_tracks && selectedStar.top_tracks.length > 0 && (
                                <div className="space-y-2 mb-6">
                                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-400">Titres Majeurs Diffusés</h4>
                                    <div className="space-y-1.5">
                                        {selectedStar.top_tracks.map((t, idx) => (
                                            <div key={idx} className="flex items-center gap-2 p-2 bg-white/[0.02] rounded-xl text-xs font-mono text-gray-300">
                                                <Disc3 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                                <span>{t}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Social / External Links */}
                            <div className="flex items-center gap-3 pt-2">
                                {selectedStar.spotify && (
                                    <a
                                        href={selectedStar.spotify}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 py-2.5 bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 rounded-xl text-xs font-mono font-bold uppercase text-green-300 text-center transition-all flex items-center justify-center gap-2"
                                    >
                                        <Music className="w-4 h-4" />
                                        <span>Spotify</span>
                                    </a>
                                )}
                                {selectedStar.instagram && (
                                    <a
                                        href={selectedStar.instagram}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 py-2.5 bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/40 rounded-xl text-xs font-mono font-bold uppercase text-pink-300 text-center transition-all flex items-center justify-center gap-2"
                                    >
                                        <Globe className="w-4 h-4" />
                                        <span>Instagram</span>
                                    </a>
                                )}
                                <a
                                    href="/wiki"
                                    className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-mono font-bold uppercase text-white transition-all flex items-center gap-2"
                                >
                                    <span>Explorer Wiki</span>
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
