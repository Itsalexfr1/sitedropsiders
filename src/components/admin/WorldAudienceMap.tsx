import { useState, useMemo } from 'react';
import {
    ComposableMap,
    Geographies,
    Geography,
    Marker,
    ZoomableGroup
} from 'react-simple-maps';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, ZoomIn, ZoomOut, RotateCcw, Compass, MapPin } from 'lucide-react';

const GEO_URL = '/data/countries-110m.json';

// Helper to convert 2-letter ISO code to flag emoji
export function getCountryFlag(code: string): string {
    if (!code || code.length !== 2) return '🌐';
    const codePoints = code
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0));
    try {
        return String.fromCodePoint(...codePoints);
    } catch {
        return '🌐';
    }
}

// Master country metadata dictionary (ISO-2 -> { name, numeric, coords: [lng, lat] })
export const COUNTRY_META: Record<string, { name: string; numeric: string; coords: [number, number] }> = {
    FR: { name: 'France', numeric: '250', coords: [2.3522, 46.8566] },
    BE: { name: 'Belgique', numeric: '056', coords: [4.4699, 50.5039] },
    CH: { name: 'Suisse', numeric: '756', coords: [8.2275, 46.8182] },
    CA: { name: 'Canada', numeric: '124', coords: [-106.3468, 56.1304] },
    US: { name: 'États-Unis', numeric: '840', coords: [-95.7129, 37.0902] },
    GB: { name: 'Royaume-Uni', numeric: '826', coords: [-3.436, 55.3781] },
    DE: { name: 'Allemagne', numeric: '276', coords: [10.4515, 51.1657] },
    ES: { name: 'Espagne', numeric: '724', coords: [-3.7492, 40.4637] },
    IT: { name: 'Italie', numeric: '380', coords: [12.5674, 41.8719] },
    NL: { name: 'Pays-Bas', numeric: '528', coords: [5.2913, 52.1326] },
    LU: { name: 'Luxembourg', numeric: '442', coords: [6.1296, 49.8153] },
    PT: { name: 'Portugal', numeric: '620', coords: [-8.2245, 39.3999] },
    MA: { name: 'Maroc', numeric: '504', coords: [-7.0926, 31.7917] },
    DZ: { name: 'Algérie', numeric: '012', coords: [1.6596, 28.0339] },
    TN: { name: 'Tunisie', numeric: '788', coords: [9.5375, 33.8869] },
    SE: { name: 'Suède', numeric: '752', coords: [18.6435, 60.1282] },
    NO: { name: 'Norvège', numeric: '578', coords: [8.4689, 60.472] },
    DK: { name: 'Danemark', numeric: '208', coords: [9.5018, 56.2639] },
    FI: { name: 'Finlande', numeric: '246', coords: [25.7482, 61.9241] },
    PL: { name: 'Pologne', numeric: '616', coords: [19.1451, 51.9194] },
    AT: { name: 'Autriche', numeric: '040', coords: [14.5501, 47.5162] },
    IE: { name: 'Irlande', numeric: '372', coords: [-8.2439, 53.4129] },
    BR: { name: 'Brésil', numeric: '076', coords: [-51.9253, -14.235] },
    MX: { name: 'Mexique', numeric: '484', coords: [-102.5528, 23.6345] },
    AU: { name: 'Australie', numeric: '036', coords: [133.7751, -25.2744] },
    JP: { name: 'Japon', numeric: '392', coords: [138.2529, 36.2048] },
    KR: { name: 'Corée du Sud', numeric: '410', coords: [127.7669, 35.9078] },
    SN: { name: 'Sénégal', numeric: '686', coords: [-14.4524, 14.4974] },
    CI: { name: 'Côte d’Ivoire', numeric: '384', coords: [-5.5471, 7.54] },
    RE: { name: 'La Réunion', numeric: '638', coords: [55.5364, -21.1151] },
    GP: { name: 'Guadeloupe', numeric: '312', coords: [-61.551, 16.265] },
    MQ: { name: 'Martinique', numeric: '474', coords: [-61.0242, 14.6415] }
};

interface WorldAudienceMapProps {
    countries: { code: string; visits: number }[];
    totalVisits: number;
}

export function WorldAudienceMap({ countries, totalVisits }: WorldAudienceMapProps) {
    // Map view state
    const [position, setPosition] = useState<{ coordinates: [number, number]; zoom: number }>({
        coordinates: [10, 20],
        zoom: 1
    });

    const [activeCountryCode, setActiveCountryCode] = useState<string | null>(null);
    const [hoveredCountry, setHoveredCountry] = useState<{
        code: string;
        name: string;
        visits: number;
        percentage: number;
        rank: number;
    } | null>(null);

    // Indexed countries by ISO code and numeric ID
    const { countryStatsMap, numericCodeMap, sortedCountries, maxVisits } = useMemo(() => {
        const statsMap = new Map<string, { code: string; name: string; visits: number; percentage: number; rank: number }>();
        const numMap = new Map<string, string>(); // numeric -> ISO code

        const sorted = [...(countries || [])]
            .filter(c => c.visits > 0)
            .sort((a, b) => b.visits - a.visits);

        let max = 1;
        sorted.forEach((c, index) => {
            if (c.visits > max) max = c.visits;
            const codeUpper = c.code.toUpperCase();
            const meta = COUNTRY_META[codeUpper];
            const name = meta?.name || codeUpper;
            const percentage = totalVisits > 0 ? (c.visits / totalVisits) * 100 : 0;

            const item = {
                code: codeUpper,
                name,
                visits: c.visits,
                percentage,
                rank: index + 1
            };

            statsMap.set(codeUpper, item);
            if (meta?.numeric) {
                numMap.set(meta.numeric, codeUpper);
                numMap.set(String(parseInt(meta.numeric, 10)), codeUpper);
            }
        });

        return {
            countryStatsMap: statsMap,
            numericCodeMap: numMap,
            sortedCountries: sorted,
            maxVisits: max
        };
    }, [countries, totalVisits]);

    // Presets
    const handlePreset = (type: 'world' | 'europe' | 'americas') => {
        if (type === 'world') {
            setPosition({ coordinates: [10, 20], zoom: 1 });
        } else if (type === 'europe') {
            setPosition({ coordinates: [12, 52], zoom: 4.2 });
        } else if (type === 'americas') {
            setPosition({ coordinates: [-80, 25], zoom: 2.2 });
        }
    };

    const handleZoomIn = () => {
        setPosition(prev => ({ ...prev, zoom: Math.min(prev.zoom * 1.5, 8) }));
    };

    const handleZoomOut = () => {
        setPosition(prev => ({ ...prev, zoom: Math.max(prev.zoom / 1.5, 0.8) }));
    };

    const handleReset = () => {
        setPosition({ coordinates: [10, 20], zoom: 1 });
        setActiveCountryCode(null);
    };

    const handleSelectCountry = (code: string) => {
        setActiveCountryCode(code);
        const meta = COUNTRY_META[code];
        if (meta) {
            setPosition({
                coordinates: meta.coords,
                zoom: Math.max(position.zoom, 3.5)
            });
        }
    };

    // Choropleth color computation
    const getCountryFill = (geo: any) => {
        // match by numeric id or ISO code or properties.name
        const id = String(geo.id || '');
        const code = numericCodeMap.get(id);
        const stats = code ? countryStatsMap.get(code) : null;

        if (stats && stats.visits > 0) {
            const isSelected = activeCountryCode === stats.code;
            if (isSelected) return '#ff1241';

            const ratio = stats.visits / maxVisits;
            if (ratio > 0.6) return '#ff1241';
            if (ratio > 0.3) return 'rgba(255, 18, 65, 0.75)';
            if (ratio > 0.1) return 'rgba(255, 18, 65, 0.50)';
            return 'rgba(255, 18, 65, 0.30)';
        }

        return 'rgba(255, 255, 255, 0.04)';
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* MAP VIEWPORT (8 COLS) */}
            <div className="lg:col-span-8 bg-[#0a0a0a]/70 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-6 lg:p-8 flex flex-col justify-between relative overflow-hidden group">
                
                {/* Header Controls */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4 z-20">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-neon-red/10 border border-neon-red/30 rounded-2xl text-neon-red">
                            <Globe className="w-5 h-5 animate-spin-slow" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-xl font-display font-black italic uppercase text-white tracking-wider">
                                    Audience <span className="text-neon-red">Mondiale</span>
                                </h3>
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-white/5 border border-white/10 text-gray-400">
                                    {sortedCountries.length} {sortedCountries.length > 1 ? 'pays actifs' : 'pays actif'}
                                </span>
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mt-0.5">
                                Répartition en temps réel basée sur les nœuds Cloudflare
                            </p>
                        </div>
                    </div>

                    {/* Presets & Zoom buttons */}
                    <div className="flex items-center gap-2">
                        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 text-[10px] font-black uppercase">
                            <button
                                onClick={() => handlePreset('world')}
                                className="px-3 py-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                            >
                                🌍 Monde
                            </button>
                            <button
                                onClick={() => handlePreset('europe')}
                                className="px-3 py-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                            >
                                🇪🇺 Europe
                            </button>
                            <button
                                onClick={() => handlePreset('americas')}
                                className="px-3 py-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                            >
                                🌎 Amériques
                            </button>
                        </div>

                        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/10">
                            <button
                                onClick={handleZoomIn}
                                title="Zoom avant"
                                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                            >
                                <ZoomIn className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleZoomOut}
                                title="Zoom arrière"
                                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                            >
                                <ZoomOut className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleReset}
                                title="Recentrer"
                                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                            >
                                <RotateCcw className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Interactive Map Area */}
                <div className="relative w-full aspect-[2/1] min-h-[360px] md:min-h-[420px] rounded-2xl bg-black/40 border border-white/5 overflow-hidden flex items-center justify-center">
                    <ComposableMap
                        projection="geoMercator"
                        projectionConfig={{ scale: 120 }}
                        className="w-full h-full cursor-grab active:cursor-grabbing"
                    >
                        <ZoomableGroup
                            zoom={position.zoom}
                            center={position.coordinates}
                            onMoveEnd={pos => setPosition(pos)}
                            minZoom={0.8}
                            maxZoom={10}
                        >
                            <Geographies geography={GEO_URL}>
                                {({ geographies }) =>
                                    geographies.map(geo => {
                                        const id = String(geo.id || '');
                                        const code = numericCodeMap.get(id);
                                        const stats = code ? countryStatsMap.get(code) : null;
                                        const hasData = !!stats && stats.visits > 0;
                                        const isSelected = activeCountryCode === code;

                                        return (
                                            <Geography
                                                key={geo.rsmKey}
                                                geography={geo}
                                                onMouseEnter={() => {
                                                    if (stats) {
                                                        setHoveredCountry(stats);
                                                    }
                                                }}
                                                onMouseLeave={() => {
                                                    setHoveredCountry(null);
                                                }}
                                                onClick={() => {
                                                    if (code) handleSelectCountry(code);
                                                }}
                                                style={{
                                                    default: {
                                                        fill: getCountryFill(geo),
                                                        stroke: isSelected ? '#ff1241' : 'rgba(255, 255, 255, 0.1)',
                                                        strokeWidth: isSelected ? 1.5 : 0.5,
                                                        outline: 'none',
                                                        cursor: hasData ? 'pointer' : 'default',
                                                        transition: 'all 250ms'
                                                    },
                                                    hover: {
                                                        fill: hasData ? '#ff1241' : 'rgba(255, 255, 255, 0.12)',
                                                        stroke: hasData ? '#ffffff' : 'rgba(255, 255, 255, 0.3)',
                                                        strokeWidth: 1,
                                                        outline: 'none',
                                                        cursor: hasData ? 'pointer' : 'default',
                                                        transition: 'all 200ms'
                                                    },
                                                    pressed: {
                                                        fill: '#ff1241',
                                                        outline: 'none'
                                                    }
                                                }}
                                            />
                                        );
                                    })
                                }
                            </Geographies>

                            {/* Glow markers for active countries */}
                            {sortedCountries.map(c => {
                                const codeUpper = c.code.toUpperCase();
                                const meta = COUNTRY_META[codeUpper];
                                if (!meta) return null;
                                const stats = countryStatsMap.get(codeUpper);
                                if (!stats) return null;

                                const isHovered = hoveredCountry?.code === codeUpper;
                                const isSelected = activeCountryCode === codeUpper;

                                // Bubble radius relative to visits
                                const ratio = c.visits / maxVisits;
                                const baseR = Math.max(3, Math.min(10, 3 + ratio * 7)) / position.zoom;

                                return (
                                    <Marker
                                        key={codeUpper}
                                        coordinates={meta.coords}
                                        onMouseEnter={() => setHoveredCountry(stats)}
                                        onMouseLeave={() => setHoveredCountry(null)}
                                        onClick={() => handleSelectCountry(codeUpper)}
                                    >
                                        {/* Outer pulse */}
                                        <circle
                                            r={baseR * 2.5}
                                            fill="#ff1241"
                                            opacity={isHovered || isSelected ? 0.35 : 0.15}
                                            className="animate-pulse"
                                        />
                                        {/* Core circle */}
                                        <circle
                                            r={baseR}
                                            fill={isSelected ? '#ffffff' : '#ff1241'}
                                            stroke={isSelected ? '#ff1241' : '#ffffff'}
                                            strokeWidth={1 / position.zoom}
                                            className="cursor-pointer transition-all duration-200"
                                        />
                                    </Marker>
                                );
                            })}
                        </ZoomableGroup>
                    </ComposableMap>

                    {/* Floating Tooltip HUD */}
                    <AnimatePresence>
                        {hoveredCountry && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                className="absolute bottom-6 left-6 pointer-events-none z-30 bg-[#0a0a0a]/95 backdrop-blur-xl border border-neon-red/40 px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-4"
                            >
                                <span className="text-3xl filter drop-shadow">
                                    {getCountryFlag(hoveredCountry.code)}
                                </span>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-display font-black text-white uppercase italic tracking-wider">
                                            {hoveredCountry.name}
                                        </span>
                                        <span className="px-1.5 py-0.2 text-[8px] font-black uppercase tracking-widest bg-neon-red/20 text-neon-red rounded">
                                            #{hoveredCountry.rank}
                                        </span>
                                    </div>
                                    <div className="flex items-baseline gap-2 mt-1">
                                        <span className="text-lg font-display font-black text-neon-red italic">
                                            {hoveredCountry.visits.toLocaleString()}
                                        </span>
                                        <span className="text-[9px] font-bold text-gray-400 uppercase">
                                            visites ({hoveredCountry.percentage.toFixed(1)}%)
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Instruction overlay badge */}
                    <div className="absolute top-4 left-4 pointer-events-none flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider text-gray-400">
                        <Compass className="w-3.5 h-3.5 text-neon-red animate-spin-slow" />
                        <span>Molette pour zoomer • Glisser pour naviguer</span>
                    </div>
                </div>

                {/* Footer Legend */}
                <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t border-white/5 text-[9px] font-black uppercase tracking-widest text-gray-500">
                    <div className="flex items-center gap-4">
                        <span>Intensité du trafic :</span>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-md bg-white/5 border border-white/10" />
                            <span>0</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-md bg-neon-red/30" />
                            <span>Faible</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-md bg-neon-red/60" />
                            <span>Moyen</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-md bg-neon-red shadow-[0_0_8px_rgba(255,18,65,0.6)]" />
                            <span>Leader</span>
                        </div>
                    </div>
                    <div>
                        Source : En-têtes sécurisés Cloudflare Edge
                    </div>
                </div>
            </div>

            {/* SIDE PANEL: TOP COUNTRIES LEADERBOARD (4 COLS) */}
            <div className="lg:col-span-4 bg-[#0a0a0a]/70 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-6 lg:p-8 flex flex-col justify-between">
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-neon-red" />
                            <h4 className="text-sm font-display font-black uppercase tracking-widest text-white italic">
                                Top Pays <span className="text-neon-red">Visiteurs</span>
                            </h4>
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">
                            {sortedCountries.length} Détectés
                        </span>
                    </div>

                    {/* Countries List */}
                    <div className="space-y-3 max-h-[460px] overflow-y-auto pr-2 custom-scrollbar">
                        {sortedCountries.slice(0, 10).map((c, idx) => {
                            const codeUpper = c.code.toUpperCase();
                            const meta = COUNTRY_META[codeUpper];
                            const name = meta?.name || codeUpper;
                            const percentage = totalVisits > 0 ? (c.visits / totalVisits) * 100 : 0;
                            const isSelected = activeCountryCode === codeUpper;

                            return (
                                <motion.div
                                    key={codeUpper}
                                    whileHover={{ x: 4 }}
                                    onClick={() => handleSelectCountry(codeUpper)}
                                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 ${
                                        isSelected
                                            ? 'bg-neon-red/15 border-neon-red shadow-[0_0_20px_rgba(255,18,65,0.25)]'
                                            : 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/[0.08]'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg">{getCountryFlag(codeUpper)}</span>
                                            <div>
                                                <div className="text-xs font-black uppercase tracking-wide text-white flex items-center gap-1.5">
                                                    <span>{name}</span>
                                                    <span className="text-[8px] font-bold text-gray-500">({codeUpper})</span>
                                                </div>
                                                <div className="text-[8px] font-black uppercase tracking-widest text-gray-400 mt-0.5">
                                                    Rang #{idx + 1}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-display font-black text-white italic">
                                                {c.visits.toLocaleString()}
                                            </div>
                                            <div className="text-[8px] font-black text-neon-red uppercase">
                                                {percentage.toFixed(1)}%
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(100, (c.visits / maxVisits) * 100)}%` }}
                                            transition={{ duration: 1, delay: idx * 0.05 }}
                                            className="h-full bg-gradient-to-r from-neon-red to-orange-500 rounded-full"
                                        />
                                    </div>
                                </motion.div>
                            );
                        })}

                        {sortedCountries.length === 0 && (
                            <div className="py-12 text-center text-gray-500 border border-dashed border-white/10 rounded-2xl">
                                <Globe className="w-8 h-8 mx-auto opacity-30 mb-2" />
                                <p className="text-[10px] font-black uppercase tracking-widest">
                                    Aucune visite géolocalisée
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Country Summary Footnote */}
                {sortedCountries.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-gray-400">
                        <span>Leader : {COUNTRY_META[sortedCountries[0]?.code.toUpperCase()]?.name || sortedCountries[0]?.code}</span>
                        <span className="text-neon-red">
                            {totalVisits > 0 ? ((sortedCountries[0]?.visits / totalVisits) * 100).toFixed(1) : 0}% du total
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
