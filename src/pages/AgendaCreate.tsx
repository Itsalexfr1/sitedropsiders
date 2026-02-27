import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams, useBlocker } from 'react-router-dom';
import { Calendar, MapPin, Tag, Image as ImageIcon, Link as LinkIcon, ArrowLeft, Send, AlertCircle, Music, FileText, Globe } from 'lucide-react';
import { getAuthHeaders } from '../utils/auth';
import { ImageUploadModal } from '../components/ImageUploadModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import recapsData from '../data/recaps.json';
import agendaData from '../data/agenda.json';

export function AgendaCreate() {
    const navigate = useNavigate();
    const location = useLocation() as any;
    const [searchParams] = useSearchParams();
    const id = searchParams.get('id');
    const isEditing = !!id;
    const editingItem = location.state?.item;

    const [title, setTitle] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [locationInput, setLocationInput] = useState('');
    const [country, setCountry] = useState('');
    const [isAutoLocating, setIsAutoLocating] = useState(false);
    const [type, setType] = useState('Festival'); // Default
    const [imageUrl, setImageUrl] = useState('');
    const [url, setUrl] = useState('');
    const [genre, setGenre] = useState('Big Room'); // Default
    const [isWeekly, setIsWeekly] = useState(false);
    const [isSoldOut, setIsSoldOut] = useState(false);
    const [isLiveDropsiders, setIsLiveDropsiders] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);

    // Autocomplete State
    const [citySuggestions, setCitySuggestions] = useState<{ city: string, country: string }[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const suggestionRef = useRef<HTMLDivElement>(null);

    // Extract unique locations from data
    const allLocations = useMemo(() => {
        const locations = new Map<string, string>();

        // From recaps
        (recapsData as any[]).forEach(item => {
            if (item.location) {
                const city = item.location.split(',')[0].trim();
                if (city && !locations.has(city.toLowerCase())) {
                    locations.set(city.toLowerCase(), item.country || '');
                }
            }
        });

        // From agenda
        (agendaData as any[]).forEach(item => {
            if (item.location) {
                const parts = item.location.split(',');
                const city = parts[0].trim();
                const countryPart = parts.length > 1 ? parts[1].trim() : '';
                if (city && !locations.has(city.toLowerCase())) {
                    locations.set(city.toLowerCase(), countryPart);
                }
            }
        });

        return Array.from(locations.entries()).map(([city, country]) => ({
            city: city.toUpperCase(),
            country: country.toUpperCase()
        }));
    }, []);

    useEffect(() => {
        if (locationInput.length >= 1) {
            const filtered = allLocations
                .filter((loc: { city: string, country: string }) => loc.city.toLowerCase().startsWith(locationInput.toLowerCase()))
                .slice(0, 5);
            setCitySuggestions(filtered);
            setShowSuggestions(filtered.length > 0);
        } else {
            setCitySuggestions([]);
            setShowSuggestions(false);
        }
    }, [locationInput, allLocations]);

    // Close suggestions on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    const [isLoading, setIsLoading] = useState(isEditing && !editingItem);

    // Fetch item if missing from state but ID is present
    useEffect(() => {
        const id = searchParams.get('id');
        if (isEditing && !editingItem && id) {
            setIsLoading(true);
            const fetchItem = async () => {
                try {
                    const response = await fetch('/api/agenda', { headers: getAuthHeaders(null) });
                    if (response.ok) {
                        const allEvents = await response.json();
                        const item = allEvents.find((e: any) => String(e.id) === String(id));
                        if (item) {
                            setTitle(item.title);
                            setStartDate(item.startDate || item.date);
                            setEndDate(item.endDate || item.date);
                            setLocationInput(item.location);
                            setType(item.type || 'Festival');
                            setImageUrl(item.image);
                            setUrl(item.url);
                            setGenre(item.genre || 'Big Room');
                            setIsWeekly(item.isWeekly || false);
                            setIsSoldOut(item.isSoldOut || false);
                            setIsLiveDropsiders(item.isLiveDropsiders || false);
                        }
                    }
                } catch (e) {
                    console.error("Failed to fetch agenda item for edit", e);
                } finally {
                    console.log('[AgendaCreate] Fetch complete');
                    setIsLoading(false);
                    initialDataLoaded.current = true;
                }
            };
            fetchItem();
        } else {
            setIsLoading(false);
        }
    }, [isEditing, editingItem, searchParams]);

    useEffect(() => {
        if (isEditing && editingItem) {
            setTitle(editingItem.title);
            setStartDate(editingItem.startDate || editingItem.date);
            setEndDate(editingItem.endDate || editingItem.date);
            setLocationInput(editingItem.location);
            setCountry(editingItem.country || '');
            setType(editingItem.type || 'Festival');
            setImageUrl(editingItem.image);
            setUrl(editingItem.url);
            setGenre(editingItem.genre || 'Big Room');
            setIsWeekly(editingItem.isWeekly || false);
            setIsSoldOut(editingItem.isSoldOut || false);
            setIsLiveDropsiders(editingItem.isLiveDropsiders || false);
        }
    }, [isEditing, editingItem]);

    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const [isDirty, setIsDirty] = useState(false);
    const initialDataLoaded = useRef(false);

    // Track changes
    useEffect(() => {
        if (isEditing && editingItem && !initialDataLoaded.current) {
            if (title === editingItem.title) {
                initialDataLoaded.current = true;
            }
            return;
        }
        if (!isEditing && !initialDataLoaded.current) {
            if (title || locationInput || imageUrl) {
                initialDataLoaded.current = true;
            }
            return;
        }
        if (initialDataLoaded.current) {
            setIsDirty(true);
        }
    }, [title, startDate, endDate, locationInput, country, type, imageUrl, url, genre, isWeekly, isSoldOut, isLiveDropsiders]);

    // Autolocation Logic
    useEffect(() => {
        if (!locationInput || locationInput.length < 3) return;

        const timer = setTimeout(async () => {
            setIsAutoLocating(true);
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationInput)}&format=json&limit=1&accept-language=fr`);
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.length > 0) {
                        const displayName = data[0].display_name;
                        const parts = displayName.split(',');
                        const detectedCountry = parts[parts.length - 1].trim();
                        if (detectedCountry) {
                            setCountry(detectedCountry);
                        }
                    }
                }
            } catch (error) {
                console.error("Autolocation error:", error);
            } finally {
                setIsAutoLocating(false);
            }
        }, 1200);

        return () => clearTimeout(timer);
    }, [locationInput]);



    // Prompt before internal React Router navigation
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            isDirty && currentLocation.pathname !== nextLocation.pathname
    );

    // Confirm navigation handled by ConfirmationModal component in JSX

    // Prompt before window reload/close
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('Action en cours...');

        try {
            const endpoint = isEditing ? '/api/agenda/update' : '/api/agenda/create';
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    id: isEditing ? id : undefined,
                    title,
                    date: startDate, // Use startDate as the primary date for sorting
                    startDate,
                    endDate: endDate || startDate,
                    location: locationInput,
                    country,
                    type,
                    image: imageUrl,
                    url,
                    genre,
                    isWeekly,
                    isSoldOut,
                    isLiveDropsiders,
                    month: new Date(startDate).toLocaleString('fr-FR', { month: 'long' }).toUpperCase()
                }),
            });

            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    errorData = { error: `Erreur ${response.status}: ${response.statusText}` };
                }
                throw new Error(errorData.error || 'Erreur lors de la publication');
            }

            await response.json();

            setStatus('success');
            setIsDirty(false);
            setMessage(isEditing ? 'Événement mis à jour avec succès !' : 'Événement ajouté avec succès !');
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Reset form
            if (!isEditing) {
                setTitle('');
                const now = new Date().toISOString().split('T')[0];
                setStartDate(now);
                setEndDate(now);
                setLocationInput('');
                setCountry('');
                setImageUrl('');
                setUrl('');
                setIsWeekly(false);
                setIsSoldOut(false);
                setIsLiveDropsiders(false);
                setTimeout(() => setStatus('idle'), 3000);
            } else {
                setTimeout(() => navigate('/admin/manage'), 2000);
            }

        } catch (error) {
            console.error('Error creating event:', error);
            setStatus('error');
            setMessage(error instanceof Error ? error.message : 'Une erreur est survenue');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-dark-bg flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-white">
                    <div className="w-12 h-12 border-4 border-neon-red/20 border-t-neon-red rounded-full animate-spin" />
                    <p className="font-bold uppercase tracking-widest text-[10px]">Chargement des données...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark-bg py-32">
            <div className="max-w-full mx-auto px-4 md:px-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 md:mb-12">
                    <div className="flex items-center gap-4 md:gap-6">
                        <button
                            onClick={() => navigate('/admin/manage')}
                            className="p-3 md:p-4 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl hover:bg-white/10 transition-all text-white group"
                            title="Retour"
                        >
                            <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <h1 className="text-3xl md:text-5xl font-display font-black text-white uppercase italic tracking-tighter leading-none">
                                Studio <span className="text-neon-yellow">Agenda</span>
                            </h1>
                            <p className="text-gray-400 mt-2 text-sm md:text-base">{isEditing ? 'Modifier l\'Événement' : 'Ajouter à l\'Agenda'}</p>
                        </div>
                    </div>

                    {isEditing && (
                        <div className="w-full md:w-auto">
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={status === 'loading'}
                                className={`w-full md:w-auto px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 ${status === 'loading'
                                    ? 'bg-gray-600 cursor-not-allowed opacity-50'
                                    : 'bg-neon-yellow hover:scale-105 active:scale-95 text-black shadow-lg shadow-neon-yellow/20'
                                    }`}
                            >
                                <Send className="w-4 h-4" />
                                <span>{status === 'loading' ? 'EN COURS...' : 'METTRE À JOUR'}</span>
                            </button>
                        </div>
                    )}
                </div>

                <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Title */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Titre de l'événement <span className="text-neon-red">*</span></label>
                            <div className="relative group">
                                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-yellow transition-colors" />
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Ex: Martin Garrix @ Ushuaïa"
                                    className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-yellow focus:ring-1 focus:ring-neon-yellow transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Dates */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Date de début <span className="text-neon-red">*</span></label>
                                    <button
                                        type="button"
                                        onClick={() => setStartDate(new Date().toISOString().split('T')[0])}
                                        className="text-[9px] font-black text-neon-yellow hover:text-white uppercase tracking-widest transition-colors"
                                    >
                                        Aujourd'hui
                                    </button>
                                </div>
                                <div className="relative group">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-yellow transition-colors" />
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-yellow focus:ring-1 focus:ring-neon-yellow transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Date de fin</label>
                                <div className="relative group">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-yellow transition-colors" />
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-yellow focus:ring-1 focus:ring-neon-yellow transition-all"
                                    />
                                </div>
                            </div>

                            {/* Location & Country */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Lieu <span className="text-neon-red">*</span></label>
                                    <div className="relative group">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-yellow transition-colors" />
                                        <input
                                            type="text"
                                            value={locationInput}
                                            onChange={(e) => setLocationInput(e.target.value.toUpperCase())}
                                            onFocus={() => locationInput.length >= 1 && setShowSuggestions(true)}
                                            placeholder="Ex: Ibiza"
                                            className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-yellow focus:ring-1 focus:ring-neon-yellow transition-all"
                                            required
                                        />
                                        <AnimatePresence>
                                            {showSuggestions && (
                                                <motion.div
                                                    ref={suggestionRef}
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="absolute z-[100] left-0 right-0 top-full mt-2 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden shadow-2xl backdrop-blur-xl"
                                                >
                                                    {citySuggestions.map((suggestion, idx) => (
                                                        <button
                                                            key={idx}
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                setLocationInput(suggestion.city);
                                                                if (suggestion.country) setCountry(suggestion.country);
                                                                setShowSuggestions(false);
                                                            }}
                                                            className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 flex justify-between items-center group"
                                                        >
                                                            <span className="text-white font-medium group-hover:text-neon-yellow transition-colors">{suggestion.city}</span>
                                                            {suggestion.country && <span className="text-xs text-gray-500 uppercase italic">{suggestion.country}</span>}
                                                        </button>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Pays <span className="text-neon-red">*</span></label>
                                    <div className="relative group">
                                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-cyan transition-colors" />
                                        <input
                                            type="text"
                                            value={country}
                                            onChange={(e) => setCountry(e.target.value.toUpperCase())}
                                            placeholder="Ex: Espagne"
                                            required
                                            className={`w-full bg-black/20 border rounded-xl py-4 pl-12 pr-12 text-white placeholder-gray-600 focus:outline-none focus:ring-1 transition-all ${isAutoLocating ? 'border-neon-cyan animate-pulse' : 'border-white/10 focus:border-neon-cyan focus:ring-neon-cyan'}`}
                                        />
                                        {isAutoLocating && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                <div className="w-4 h-4 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin"></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Type */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Type</label>
                                <div className="relative group">
                                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-yellow transition-colors" />
                                    <select
                                        value={type}
                                        onChange={(e) => setType(e.target.value)}
                                        className="w-full bg-gray-900 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-neon-yellow focus:ring-1 focus:ring-neon-yellow transition-all appearance-none"
                                    >
                                        <option value="Festival">Festival</option>
                                        <option value="Showcase">Showcase</option>
                                        <option value="Résidence">Résidence</option>
                                        <option value="Opening">Opening</option>
                                        <option value="Events">Events</option>
                                        <option value="Live Take Over">LIVE TAKE OVER SUR DROPSIDERS</option>
                                    </select>
                                </div>
                            </div>

                            {/* Genre */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Genre Musical</label>
                                <div className="relative group">
                                    <Music className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-yellow transition-colors" />
                                    <select
                                        value={genre}
                                        onChange={(e) => setGenre(e.target.value)}
                                        className="w-full bg-gray-900 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-neon-yellow focus:ring-1 focus:ring-neon-yellow transition-all appearance-none"
                                    >
                                        <option value="Big Room">Big Room</option>
                                        <option value="Tech House">Tech House</option>
                                        <option value="Techno">Techno</option>
                                        <option value="Melodic Techno">Melodic Techno</option>
                                        <option value="Trance">Trance</option>
                                        <option value="Progressive House">Progressive House</option>
                                        <option value="Multi Styles">Multi Styles</option>
                                        <option value="Hybride">Hybride</option>
                                        <option value="Hardstyle">Hardstyle</option>
                                        <option value="Drum & Bass">Drum & Bass</option>
                                        <option value="House">House</option>
                                    </select>
                                </div>
                            </div>
                            {/* isWeekly */}
                            <div className="space-y-4 col-span-1 md:col-span-2">
                                <label className="flex items-center gap-3 cursor-pointer p-4 bg-black/20 border border-white/10 rounded-xl hover:bg-black/40 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={isWeekly}
                                        onChange={(e) => setIsWeekly(e.target.checked)}
                                        className="w-5 h-5 rounded border-white/10 bg-dark-bg text-neon-yellow focus:ring-neon-yellow focus:ring-offset-0 transition-all cursor-pointer"
                                    />
                                    <span className="text-sm font-bold text-white uppercase tracking-wider">
                                        Résidence / Événement hebdomadaire (Priorité jour de la semaine)
                                    </span>
                                </label>

                                <label className="flex items-center gap-3 cursor-pointer p-4 bg-black/20 border border-white/10 rounded-xl hover:bg-black/40 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={isSoldOut}
                                        onChange={(e) => setIsSoldOut(e.target.checked)}
                                        className="w-5 h-5 rounded border-white/10 bg-dark-bg text-neon-red focus:ring-neon-red focus:ring-offset-0 transition-all cursor-pointer"
                                    />
                                    <span className="text-sm font-bold text-neon-red uppercase tracking-wider">
                                        Événement SOLD OUT
                                    </span>
                                </label>

                                <label className="flex items-center gap-3 cursor-pointer p-4 bg-black/20 border border-white/10 rounded-xl hover:bg-black/40 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={isLiveDropsiders}
                                        onChange={(e) => setIsLiveDropsiders(e.target.checked)}
                                        className="w-5 h-5 rounded border-white/10 bg-dark-bg text-neon-cyan focus:ring-neon-cyan focus:ring-offset-0 transition-all cursor-pointer"
                                    />
                                    <span className="text-sm font-bold text-white uppercase tracking-wider">
                                        Diffusé sur <span className="text-neon-cyan font-black">DROPSIDERS</span> dans le <span className="text-neon-red italic font-black">LIVE TAKEOVER</span>
                                    </span>
                                </label>
                            </div>
                        </div>

                        {/* Image URL */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Image <span className="text-neon-red">*</span></label>
                            <div className="flex gap-2">
                                <div className="relative group flex-1">
                                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-yellow transition-colors" />
                                    <input
                                        type="text"
                                        value={imageUrl}
                                        onChange={(e) => setImageUrl(e.target.value)}
                                        placeholder="https://... ou uploadez une image"
                                        className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-yellow focus:ring-1 focus:ring-neon-yellow transition-all"
                                        required
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowUploadModal(true)}
                                    className="px-6 py-4 bg-neon-yellow/20 border border-neon-yellow/50 text-neon-yellow rounded-xl font-bold uppercase tracking-wider hover:bg-neon-yellow/30 transition-all cursor-pointer flex flex-col items-center justify-center gap-1 min-w-[120px]"
                                >
                                    Upload
                                </button>

                            </div>
                        </div>

                        {/* Link URL */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Lien de l'événement (Billetterie/Infos) <span className="text-neon-red">*</span></label>
                            <div className="relative group">
                                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-yellow transition-colors" />
                                <input
                                    type="text"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="https://..."
                                    className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-yellow focus:ring-1 focus:ring-neon-yellow transition-all"
                                    required
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${status === 'loading'
                                ? 'bg-gray-600 cursor-not-allowed'
                                : 'bg-neon-yellow hover:bg-neon-yellow/80 text-black'
                                }`}
                        >
                            {status === 'loading' ? (
                                'Publication en cours...'
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    {isEditing ? 'Mettre à jour' : 'Ajouter à l\'Agenda'}
                                </>
                            )}
                        </button>

                        {/* Status Message */}
                        {status !== 'idle' && message && (
                            <div className={`p-4 rounded-xl flex flex-col gap-3 ${status === 'error' ? 'bg-red-500/10 text-red-500' :
                                status === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'
                                }`}>
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5" />
                                    <p className="font-bold uppercase tracking-wider text-xs">{message}</p>
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            </div>

            <ImageUploadModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                initialImage={imageUrl}
                onUploadSuccess={(url) => setImageUrl(url)}
                onClear={() => {
                    setImageUrl('');
                    setShowUploadModal(false);
                }}
                accentColor="neon-yellow"
            />

            <ConfirmationModal
                isOpen={blocker.state === "blocked"}
                message="Vous avez des modifications non enregistrées. Voulez-vous vraiment quitter la page ?"
                onConfirm={() => blocker.proceed?.()}
                onCancel={() => blocker.reset?.()}
                accentColor="neon-red"
            />
        </div>
    );
}

export default AgendaCreate;
