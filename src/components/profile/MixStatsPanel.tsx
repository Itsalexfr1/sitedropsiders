import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Headphones, Download, Share2, Globe, MapPin, BarChart2, RefreshCw, ChevronDown, TrendingUp } from 'lucide-react';

interface DailyPoint { date: string; count: number; }
interface GeoEntry { country?: string; city?: string; count: number; }
interface MixStat {
    mixId: string;
    title: string;
    type: string;
    plays: number;
    downloads: number;
    shares: number;
    topCountries: { country: string; count: number }[];
    topCities: { city: string; count: number }[];
    daily: DailyPoint[];
    playsStats?: {
        topCountries: { country: string; count: number }[];
        topCities: { city: string; count: number }[];
        daily: DailyPoint[];
    };
    downloadsStats?: {
        topCountries: { country: string; count: number }[];
        topCities: { city: string; count: number }[];
        daily: DailyPoint[];
    };
    sharesStats?: {
        topCountries: { country: string; count: number }[];
        topCities: { city: string; count: number }[];
        daily: DailyPoint[];
    };
}
interface StatsData { stats: Record<string, MixStat>; mixCount: number; }

const COUNTRY_FLAGS: Record<string, string> = {
    FR: '🇫🇷', US: '🇺🇸', DE: '🇩🇪', GB: '🇬🇧', ES: '🇪🇸', IT: '🇮🇹',
    BE: '🇧🇪', NL: '🇳🇱', CH: '🇨🇭', CA: '🇨🇦', AU: '🇦🇺', BR: '🇧🇷',
    MX: '🇲🇽', JP: '🇯🇵', KR: '🇰🇷', RU: '🇷🇺', PL: '🇵🇱', PT: '🇵🇹',
    MA: '🇲🇦', DZ: '🇩🇿', TN: '🇹🇳', SN: '🇸🇳', CI: '🇨🇮', CM: '🇨🇲',
    XX: '🌍',
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string; glow: string }> = {
    Track: { bg: 'bg-neon-red', text: 'text-neon-red', glow: 'rgba(255,0,0,0.6)' },
    Remix: { bg: 'bg-neon-purple', text: 'text-neon-purple', glow: 'rgba(188,19,254,0.6)' },
    Edit: { bg: 'bg-neon-cyan', text: 'text-neon-cyan', glow: 'rgba(0,240,255,0.6)' },
    Mix: { bg: 'bg-neon-green', text: 'text-neon-green', glow: 'rgba(57,255,20,0.6)' },
};

function getCatColor(type: string) {
    const key = type ? type.charAt(0).toUpperCase() + type.slice(1).toLowerCase() : 'Remix';
    return CATEGORY_COLORS[key] || CATEGORY_COLORS.Remix;
}

function BarChart({ data, color, label }: { data: DailyPoint[]; color: string; label: string }) {
    const last30 = data.slice(-30);
    const max = Math.max(...last30.map(d => d.count), 1);

    // Show every 5th date label
    return (
        <div className="flex items-end gap-[2px] h-20 w-full">
            {last30.map((d, i) => {
                const pct = (d.count / max) * 100;
                const isToday = i === last30.length - 1;
                return (
                    <div key={d.date} className="flex-1 flex flex-col items-center justify-end gap-0.5 group relative" title={`${d.date}: ${d.count} ${label}`}>
                        <div
                            className="w-full rounded-t-sm transition-all duration-300"
                            style={{
                                height: `${Math.max(pct, 2)}%`,
                                background: isToday ? color : `${color}99`,
                                boxShadow: d.count > 0 ? `0 0 6px ${color}66` : 'none'
                            }}
                        />
                        {/* Tooltip */}
                        {d.count > 0 && (
                            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:flex bg-black border border-white/10 rounded-lg px-2 py-1 text-[9px] text-white whitespace-nowrap z-10 shadow-xl">
                                {d.date.slice(5)}: {d.count} {label}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
    const pct = max > 0 ? (value / max) * 100 : 0;
    return (
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden flex-1">
            <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}88` }}
            />
        </div>
    );
}

export function MixStatsPanel({ userEmail }: { userEmail: string }) {
    const [statsData, setStatsData] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedMixId, setSelectedMixId] = useState<string | null>(null);
    const [chartRange, setChartRange] = useState<7 | 30>(30);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [statsMode, setStatsMode] = useState<'play' | 'download' | 'share'>('play');

    const loadStats = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/mix/stats?email=${encodeURIComponent(userEmail)}`, {
                headers: {
                    'X-Admin-Password': localStorage.getItem('dropsiders_admin_password') || '',
                    'X-Admin-Username': localStorage.getItem('dropsiders_admin_username') || '',
                }
            });
            if (!res.ok) throw new Error('Impossible de charger les stats');
            const data = await res.json();
            setStatsData(data);
            // Select first mix by default
            const keys = Object.keys(data.stats || {});
            if (keys.length > 0 && !selectedMixId) setSelectedMixId(keys[0]);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userEmail) loadStats();
    }, [userEmail]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-neon-cyan/20 border-t-neon-cyan rounded-full animate-spin" />
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Chargement des stats...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <p className="text-neon-red text-sm font-bold">{error}</p>
                <button onClick={loadStats} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/60 hover:text-white transition-all">
                    <RefreshCw className="w-4 h-4" /> Réessayer
                </button>
            </div>
        );
    }

    const allStats = Object.values(statsData?.stats || {}) as MixStat[];

    if (allStats.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <BarChart2 className="w-12 h-12 text-gray-700" />
                <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">Aucun mix à analyser</p>
                <p className="text-xs text-gray-600 text-center max-w-xs">Uploadez votre premier mix pour commencer à accumuler des statistiques d'écoute.</p>
            </div>
        );
    }

    // Global totals
    const totalPlays = allStats.reduce((s, m) => s + m.plays, 0);
    const totalDownloads = allStats.reduce((s, m) => s + m.downloads, 0);
    const totalShares = allStats.reduce((s, m) => s + m.shares, 0);

    // Aggregate countries and cities based on statsMode
    const allCountries: Record<string, number> = {};
    const allCities: Record<string, number> = {};
    for (const m of allStats) {
        const modeStats = statsMode === 'play'
            ? (m.playsStats || { topCountries: m.topCountries, topCities: m.topCities })
            : statsMode === 'download'
                ? (m.downloadsStats || { topCountries: [], topCities: [] })
                : (m.sharesStats || { topCountries: [], topCities: [] });

        for (const c of modeStats.topCountries || []) allCountries[c.country] = (allCountries[c.country] || 0) + c.count;
        for (const c of modeStats.topCities || []) allCities[c.city] = (allCities[c.city] || 0) + c.count;
    }
    const globalCountries = Object.entries(allCountries).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const globalCities = Object.entries(allCities).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const maxCountryCount = globalCountries[0]?.[1] || 1;

    const selectedStat = selectedMixId ? statsData?.stats[selectedMixId] : null;
    const selectedMixName = allStats.find(m => m.mixId === selectedMixId)?.title || '';

    // Get daily stats for chart based on selected mode
    const getModeDaily = (stat: MixStat | null) => {
        if (!stat) return [];
        const modeStats = statsMode === 'play'
            ? (stat.playsStats || { daily: stat.daily })
            : statsMode === 'download'
                ? (stat.downloadsStats || { daily: [] })
                : (stat.sharesStats || { daily: [] });
        return modeStats.daily || [];
    };

    const modeDaily = getModeDaily(selectedStat ?? null);
    const chartData = chartRange === 7 ? modeDaily.slice(-7) : modeDaily;

    const catCol = selectedStat ? getCatColor(selectedStat.type) : CATEGORY_COLORS.Remix;

    const getModeColor = (mode: 'play' | 'download' | 'share') => {
        if (mode === 'play') return 'rgba(0,240,255,0.8)';
        if (mode === 'download') return 'rgba(188,19,254,0.8)';
        return 'rgba(57,255,20,0.8)';
    };

    const getModeTextColor = (mode: 'play' | 'download' | 'share') => {
        if (mode === 'play') return 'text-neon-cyan';
        if (mode === 'download') return 'text-neon-purple';
        return 'text-neon-green';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-neon-cyan/10 border border-neon-cyan/30 rounded-xl flex items-center justify-center">
                        <BarChart2 className="w-5 h-5 text-neon-cyan" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Analytics Studio</h3>
                        <p className="text-[10px] text-gray-500">{allStats.length} mix{allStats.length > 1 ? 's' : ''} · données en temps réel</p>
                    </div>
                </div>
                <button
                    onClick={loadStats}
                    className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all"
                    title="Rafraîchir"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* Global KPIs */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { id: 'play', icon: Headphones, label: 'Écoutes', value: totalPlays, color: 'text-neon-cyan', glow: 'rgba(0,240,255,0.15)', border: 'border-neon-cyan/20', activeBorder: 'border-neon-cyan bg-neon-cyan/5 shadow-[0_0_15px_rgba(0,240,255,0.2)]' },
                    { id: 'download', icon: Download, label: 'Téléchargements', value: totalDownloads, color: 'text-neon-purple', glow: 'rgba(188,19,254,0.15)', border: 'border-neon-purple/20', activeBorder: 'border-neon-purple bg-neon-purple/5 shadow-[0_0_15px_rgba(188,19,254,0.2)]' },
                    { id: 'share', icon: Share2, label: 'Partages', value: totalShares, color: 'text-neon-green', glow: 'rgba(57,255,20,0.15)', border: 'border-neon-green/20', activeBorder: 'border-neon-green bg-neon-green/5 shadow-[0_0_15px_rgba(57,255,20,0.2)]' },
                ].map(({ id, icon: Icon, label, value, color, glow, border, activeBorder }) => {
                    const isActive = statsMode === id;
                    return (
                        <button
                            key={label}
                            onClick={() => setStatsMode(id as any)}
                            className={`relative border rounded-2xl p-4 text-center overflow-hidden transition-all duration-300 hover:scale-[1.02] cursor-pointer focus:outline-none w-full ${
                                isActive ? activeBorder : `bg-black/40 ${border} opacity-60 hover:opacity-100`
                            }`}
                            style={{ boxShadow: isActive ? undefined : `inset 0 0 30px ${glow}` }}
                        >
                            <Icon className={`w-5 h-5 mx-auto mb-2 ${color} ${isActive ? 'scale-110' : ''} transition-transform duration-300`} />
                            <p className={`text-xl md:text-2xl font-black ${color}`}>{value.toLocaleString('fr-FR')}</p>
                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">{label}</p>
                        </button>
                    );
                })}
            </div>

            {/* Mix Selector + Chart */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 space-y-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    {/* Mix Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setDropdownOpen(p => !p)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white font-bold hover:bg-white/5 transition-all"
                        >
                            {selectedStat && (
                                <span className={`text-[9px] font-black ${catCol.text} uppercase`}>{selectedStat.type}</span>
                            )}
                            <span className="max-w-[150px] truncate">{selectedMixName || 'Sélectionner un mix'}</span>
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                        </button>
                        <AnimatePresence>
                            {dropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    className="absolute top-full mt-2 left-0 z-30 bg-[#0d0d0d] border border-white/10 rounded-2xl overflow-hidden shadow-2xl min-w-[200px]"
                                >
                                    {allStats.map(m => {
                                        const c = getCatColor(m.type);
                                        return (
                                            <button
                                                key={m.mixId}
                                                onClick={() => { setSelectedMixId(m.mixId); setDropdownOpen(false); }}
                                                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-all text-left ${m.mixId === selectedMixId ? 'bg-white/5' : ''}`}
                                            >
                                                <span className={`text-[8px] font-black ${c.text} uppercase tracking-widest shrink-0`}>{m.type}</span>
                                                <span className="text-xs text-white font-bold truncate">{m.title}</span>
                                                <span className="ml-auto text-[9px] text-gray-500 shrink-0">{m.plays} 🎧</span>
                                            </button>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Range toggle */}
                    <div className="flex gap-1 p-1 bg-black/40 border border-white/10 rounded-xl">
                        {([7, 30] as const).map(r => (
                            <button
                                key={r}
                                onClick={() => setChartRange(r)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${chartRange === r ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
                            >
                                {r}j
                            </button>
                        ))}
                    </div>
                </div>

                {/* Chart */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-4 h-4 text-gray-500" />
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                            {statsMode === 'play' ? 'Écoutes' : statsMode === 'download' ? 'Téléchargements' : 'Partages'} — {chartRange} derniers jours
                        </p>
                    </div>
                    {chartData.length > 0 ? (
                        <BarChart 
                            data={chartData} 
                            color={statsMode === 'play' ? 'rgba(0,240,255,1)' : statsMode === 'download' ? 'rgba(188,19,254,1)' : 'rgba(57,255,20,1)'} 
                            label={statsMode === 'play' ? 'écoutes' : statsMode === 'download' ? 'téléchargements' : 'partages'}
                        />
                    ) : (
                        <div className="h-20 flex items-center justify-center text-gray-600 text-xs">Aucune donnée</div>
                    )}
                    {/* Date axis labels */}
                    {chartData.length > 0 && (
                        <div className="flex justify-between mt-1">
                            <span className="text-[8px] text-gray-600">{chartData[0]?.date.slice(5)}</span>
                            <span className="text-[8px] text-gray-600">{chartData[chartData.length - 1]?.date.slice(5)}</span>
                        </div>
                    )}
                </div>

                {/* Selected mix stats */}
                {selectedStat && (
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
                        {[
                            { label: 'Écoutes', value: selectedStat.plays, icon: '🎧' },
                            { label: 'Téléchargements', value: selectedStat.downloads, icon: '⬇️' },
                            { label: 'Partages', value: selectedStat.shares, icon: '🔗' },
                        ].map(({ label, value, icon }) => (
                            <div key={label} className="text-center">
                                <p className="text-lg font-black text-white">{value}</p>
                                <p className="text-[9px] text-gray-500 uppercase tracking-widest">{icon} {label}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Geography */}
            <div className="grid md:grid-cols-2 gap-4">
                {/* Countries */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Globe className={`w-4 h-4 ${getModeTextColor(statsMode)}`} />
                        <h4 className="text-xs font-black text-white uppercase tracking-widest">Top Pays</h4>
                    </div>
                    {globalCountries.length > 0 ? (
                        <div className="space-y-2.5">
                            {globalCountries.map(([country, count]) => (
                                <div key={country} className="flex items-center gap-3">
                                    <span className="text-base w-6 text-center shrink-0">{COUNTRY_FLAGS[country] || '🌍'}</span>
                                    <span className="text-xs text-gray-300 font-bold w-8 shrink-0">{country}</span>
                                    <ProgressBar value={count} max={maxCountryCount} color={getModeColor(statsMode)} />
                                    <span className="text-xs text-gray-400 font-bold shrink-0 w-6 text-right">{count}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-gray-600 text-center py-6">Aucune donnée géographique</p>
                    )}
                </div>

                {/* Cities */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <MapPin className={`w-4 h-4 ${getModeTextColor(statsMode)}`} />
                        <h4 className="text-xs font-black text-white uppercase tracking-widest">Top Villes</h4>
                    </div>
                    {globalCities.length > 0 ? (
                        <div className="space-y-2.5">
                            {globalCities.map(([city, count], i) => (
                                <div key={city} className="flex items-center gap-3">
                                    <span className="text-[10px] text-gray-600 font-black w-4 shrink-0">#{i + 1}</span>
                                    <span className="text-xs text-gray-300 font-bold flex-1 truncate">{city}</span>
                                    <ProgressBar value={count} max={globalCities[0]?.[1] || 1} color={getModeColor(statsMode)} />
                                    <span className="text-xs text-gray-400 font-bold shrink-0 w-6 text-right">{count}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-gray-600 text-center py-6">Aucune donnée de ville</p>
                    )}
                </div>
            </div>

            {/* All Mixes Ranking */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-4 h-4 text-neon-green" />
                    <h4 className="text-xs font-black text-white uppercase tracking-widest">Classement de tes mixes</h4>
                </div>
                <div className="space-y-2">
                    {[...allStats]
                        .sort((a, b) => {
                            const valA = statsMode === 'play' ? a.plays : statsMode === 'download' ? a.downloads : a.shares;
                            const valB = statsMode === 'play' ? b.plays : statsMode === 'download' ? b.downloads : b.shares;
                            return valB - valA;
                        })
                        .map((m, i) => {
                            const col = getCatColor(m.type);
                            const activeVal = statsMode === 'play' ? m.plays : statsMode === 'download' ? m.downloads : m.shares;
                            const topVal = Math.max(...allStats.map(x => statsMode === 'play' ? x.plays : statsMode === 'download' ? x.downloads : x.shares), 1);
                            return (
                                <div
                                    key={m.mixId}
                                    onClick={() => setSelectedMixId(m.mixId)}
                                    className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${m.mixId === selectedMixId ? 'bg-white/10 border border-white/10' : 'hover:bg-white/5'}`}
                                >
                                    <span className="text-[10px] text-gray-600 font-black w-4 shrink-0">#{i + 1}</span>
                                    <div className={`w-2 h-8 rounded-full ${col.bg} shrink-0`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-white truncate">{m.title}</p>
                                        <p className={`text-[9px] ${col.text} uppercase font-black`}>{m.type}</p>
                                    </div>
                                    <div className="flex items-center gap-3 text-[10px] text-gray-400 shrink-0">
                                        <span className={`flex items-center gap-1 ${statsMode === 'play' ? 'text-neon-cyan font-black' : ''}`}><Headphones className="w-3 h-3" />{m.plays}</span>
                                        <span className={`flex items-center gap-1 ${statsMode === 'download' ? 'text-neon-purple font-black' : ''}`}><Download className="w-3 h-3" />{m.downloads}</span>
                                        <span className={`flex items-center gap-1 ${statsMode === 'share' ? 'text-neon-green font-black' : ''}`}><Share2 className="w-3 h-3" />{m.shares}</span>
                                    </div>
                                    <div className="w-16 hidden sm:block">
                                        <ProgressBar value={activeVal} max={topVal} color={col.glow.replace('0.6)', '0.9)')} />
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </div>
        </motion.div>
    );
}

export default MixStatsPanel;
