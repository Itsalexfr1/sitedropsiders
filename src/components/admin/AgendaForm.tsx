import { useState, useEffect, useRef, useMemo } from 'react';
import { Calendar, MapPin, Tag, Image as ImageIcon, Link as LinkIcon, Send, AlertCircle, FileText, Globe, Upload, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAuthHeaders } from '../../utils/auth';
import { ImageUploadModal } from '../ImageUploadModal';
import recapsData from '../../data/recaps.json';
import agendaData from '../../data/agenda.json';

interface AgendaFormProps {
    editingItem?: any;
    onSuccess: (item?: any) => void;
    onCancel?: () => void;
    isModal?: boolean;
}

export function AgendaForm({ editingItem, onSuccess, onCancel, isModal = false }: AgendaFormProps) {
    const isEditing = !!editingItem;

    const [title, setTitle] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState('');
    const [venue, setVenue] = useState('');
    const [locationInput, setLocationInput] = useState('');
    const [country, setCountry] = useState('');
    const [isAutoLocating, setIsAutoLocating] = useState(false);
    const [type, setType] = useState('Festival');
    const [imageUrl, setImageUrl] = useState('');
    const [url, setUrl] = useState('');
    const [genre, setGenre] = useState('');
    const [isWeekly, setIsWeekly] = useState(false);
    const [isMultiDay, setIsMultiDay] = useState(false);
    const [isSoldOut, setIsSoldOut] = useState(false);
    const [isLiveDropsiders, setIsLiveDropsiders] = useState(false);
    const [additionalDates, setAdditionalDates] = useState<string[]>([]);
    const [showUploadModal, setShowUploadModal] = useState(false);

    // Autocomplete State
    const [citySuggestions, setCitySuggestions] = useState<{ city: string, country: string }[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const suggestionRef = useRef<HTMLDivElement>(null);

    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    // Extract unique locations from data for autocomplete
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
                const city = item.location.split(',')[0].trim();
                const countryVal = item.country || (item.location.split(',').length > 1 ? item.location.split(',')[1].trim() : '');
                if (city && !locations.has(city.toLowerCase())) {
                    locations.set(city.toLowerCase(), countryVal);
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

    // Initialize form with editing data
    useEffect(() => {
        if (isEditing && editingItem) {
            setTitle(editingItem.title || '');
            setStartDate(editingItem.startDate || editingItem.date || new Date().toISOString().split('T')[0]);
            setEndDate(editingItem.endDate || editingItem.date || '');
            setIsMultiDay(editingItem.endDate && editingItem.endDate !== (editingItem.startDate || editingItem.date) && !editingItem.isWeekly);
            setVenue(editingItem.venue || '');
            setLocationInput(editingItem.location || '');
            setCountry(editingItem.country || '');
            setType(editingItem.type || 'Festival');
            setImageUrl(editingItem.image || '');
            setUrl(editingItem.url || '');
            setGenre(editingItem.genre || '');
            setIsWeekly(editingItem.isWeekly || false);
            setIsSoldOut(editingItem.isSoldOut || false);
            setIsLiveDropsiders(editingItem.isLiveDropsiders || false);
            setAdditionalDates(editingItem.additionalDates || []);
        }
    }, [isEditing, editingItem]);

    // Autolocation Logic
    useEffect(() => {
        if ((!locationInput || locationInput.length < 2) && (!venue || venue.length < 3)) return;

        const searchText = venue && venue.length >= 3 ? `${venue} ${locationInput}` : locationInput;
        if (searchText.length < 3) return;

        const timer = setTimeout(async () => {
            setIsAutoLocating(true);
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchText)}&format=json&limit=1&accept-language=fr`);
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.length > 0) {
                        const displayName = data[0].display_name;
                        const parts = displayName.split(',');
                        const detectedCountry = parts[parts.length - 1].trim();
                        const detectedCity = parts[0].trim();
                        if (detectedCountry) {
                            setCountry(detectedCountry.toUpperCase());
                        }
                        if (!locationInput && detectedCity) {
                            setLocationInput(detectedCity.toUpperCase());
                        }
                    }
                }
            } catch (error: any) {
                console.error("Autolocation error:", error);
            } finally {
                setIsAutoLocating(false);
            }
        }, 1200);

        return () => clearTimeout(timer);
    }, [locationInput, venue]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('Action en cours...');

        try {
            const endpoint = isEditing ? '/api/agenda/update' : '/api/agenda/create';
            const payload = {
                id: isEditing ? editingItem.id : undefined,
                title,
                date: startDate,
                startDate,
                endDate: endDate || startDate,
                dayOfWeek: isWeekly ? new Date(startDate).getDay() : undefined,
                venue,
                location: locationInput,
                country,
                type,
                image: imageUrl,
                url,
                genre,
                isWeekly,
                isSoldOut,
                isLiveDropsiders,
                additionalDates: additionalDates.filter(d => d),
                month: new Date(startDate).toLocaleString('fr-FR', { month: 'long' }).toUpperCase()
            };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (err: any) {
                    errorData = { error: `Erreur ${response.status}: ${response.statusText}` };
                }
                throw new Error(errorData.error || 'Erreur lors de la publication');
            }

            const result = await response.json();
            setStatus('success');
            setMessage(isEditing ? 'Événement mis à jour !' : 'Événement ajouté !');

            setTimeout(() => {
                onSuccess(result);
            }, 1500);

        } catch (error: any) {
            console.error('Error saving agenda item:', error);
            setStatus('error');
            setMessage(error instanceof Error ? error.message : 'Une erreur est survenue');
        }
    };

    return (
        <div className={isModal ? "" : "bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8"}>
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
                            className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-yellow transition-all"
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 bg-white/5 border border-white/10 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-neon-yellow" />

                    {/* Section: Dates */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <Calendar className="w-3 h-3 text-neon-yellow" /> Calendrier
                        </h3>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date de début</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-neon-yellow outline-none transition-all"
                                required
                            />
                        </div>

                        {type !== 'Résidence' && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Type de durée</label>
                                <div className="flex gap-2 p-1 bg-black/40 rounded-xl border border-white/5">
                                    <button
                                        type="button"
                                        onClick={() => { setIsMultiDay(false); if (!isWeekly) setEndDate(''); }}
                                        className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${!isMultiDay && !isWeekly ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                                    >
                                        1 Jour
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setIsMultiDay(true); setIsWeekly(false); }}
                                        className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${isMultiDay ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                                    >
                                        + Jours
                                    </button>
                                </div>
                            </div>
                        )}

                        {(isMultiDay || isWeekly) && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-2"
                            >
                                <label className="text-[10px] font-bold text-neon-red uppercase tracking-widest">Date de fin {(isMultiDay || isWeekly) && '*'}</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full bg-black/40 border border-neon-red/30 rounded-xl py-3 px-4 text-white focus:border-neon-red outline-none transition-all"
                                    required={isMultiDay || isWeekly}
                                />
                            </motion.div>
                        )}

                        {/* Additional Dates */}
                        <div className="pt-4 border-t border-white/5 space-y-4">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center justify-between">
                                Dates Additionnelles
                                <button
                                    type="button"
                                    onClick={() => setAdditionalDates([...additionalDates, ''])}
                                    className="p-1.5 bg-neon-yellow/10 border border-neon-yellow/30 text-neon-yellow rounded-lg hover:bg-neon-yellow/20 transition-all"
                                >
                                    <Plus className="w-3 h-3" />
                                </button>
                            </h4>

                            <div className="space-y-3">
                                {additionalDates.map((date, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <input
                                            type="date"
                                            value={date}
                                            onChange={(e) => {
                                                const newDates = [...additionalDates];
                                                newDates[idx] = e.target.value;
                                                setAdditionalDates(newDates);
                                            }}
                                            className="flex-1 bg-black/40 border border-white/10 rounded-xl py-2 px-3 text-white text-[10px] focus:border-neon-yellow outline-none transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setAdditionalDates(additionalDates.filter((_, i) => i !== idx))}
                                            className="p-2 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl hover:bg-red-500/20 transition-all"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Section: Type & Genre */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <Tag className="w-3 h-3 text-neon-cyan" /> Catégorie
                        </h3>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Type d'Événement</label>
                            <select
                                value={type}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setType(val);
                                    if (val === 'Résidence') {
                                        setIsWeekly(true);
                                        setIsMultiDay(false);
                                    } else {
                                        setIsWeekly(false);
                                    }
                                    if (val === 'Jeux Concours' && !url) {
                                        setUrl('/communaute?tab=CONCOURS');
                                    }
                                }}
                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white outline-none appearance-none cursor-pointer"
                            >
                                <option value="Festival">Festival</option>
                                <option value="Showcase">Showcase</option>
                                <option value="Concert">Concert</option>
                                <option value="Résidence">Résidence</option>
                                <option value="Opening">Opening</option>
                                <option value="Events">Events</option>
                                <option value="Live Take Over">LIVE TAKE OVER</option>
                                <option value="Jeux Concours">Jeux Concours</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Genre Musical</label>
                            <select
                                value={genre}
                                onChange={(e) => setGenre(e.target.value)}
                                required
                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white outline-none appearance-none cursor-pointer"
                            >
                                <option value="" disabled>-- Choisir --</option>
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
                                <option value="Hardcore">Hardcore</option>
                                <option value="HardTechno">HardTechno</option>
                            </select>
                        </div>
                    </div>

                    {/* Section: Options Spécifiques */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <AlertCircle className="w-3 h-3 text-neon-red" /> Options Vidéo/Res
                        </h3>

                        <label className={`flex items-center gap-3 cursor-pointer p-3 border rounded-xl transition-all ${isWeekly ? 'bg-neon-yellow/10 border-neon-yellow/50 text-neon-yellow' : 'bg-black/40 border-white/10 text-gray-400'}`}>
                            <input
                                type="checkbox"
                                checked={isWeekly}
                                onChange={(e) => {
                                    setIsWeekly(e.target.checked);
                                    if (e.target.checked) {
                                        setType('Résidence');
                                        setIsMultiDay(false);
                                    }
                                }}
                                className="w-4 h-4 rounded bg-dark-bg text-neon-yellow focus:ring-neon-yellow transition-all"
                            />
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black uppercase tracking-widest">Résidence</span>
                                <span className="text-[7px] opacity-70 italic lowercase">Hebdomadaire</span>
                            </div>
                        </label>

                        <label className={`flex items-center gap-3 cursor-pointer p-3 border rounded-xl transition-all ${isLiveDropsiders ? 'bg-neon-cyan/10 border-neon-cyan/50 text-neon-cyan' : 'bg-black/40 border-white/10 text-gray-400'}`}>
                            <input
                                type="checkbox"
                                checked={isLiveDropsiders}
                                onChange={(e) => setIsLiveDropsiders(e.target.checked)}
                                className="w-4 h-4 rounded bg-dark-bg text-neon-cyan focus:ring-neon-cyan transition-all"
                            />
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black uppercase tracking-widest">Diffusé LIVE</span>
                                <span className="text-[7px] opacity-70 italic lowercase">Dropsiders</span>
                            </div>
                        </label>

                        <label className={`flex items-center gap-3 cursor-pointer p-3 border rounded-xl transition-all ${isSoldOut ? 'bg-red-500/10 border-red-500/50 text-red-500' : 'bg-black/40 border-white/10 text-gray-400'}`}>
                            <input
                                type="checkbox"
                                checked={isSoldOut}
                                onChange={(e) => setIsSoldOut(e.target.checked)}
                                className="w-4 h-4 rounded bg-dark-bg text-red-500 focus:ring-neon-red transition-all"
                            />
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black uppercase tracking-widest">Sold Out</span>
                                <span className="text-[7px] opacity-70 italic lowercase">Plus de tickets</span>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Meta: Venue & Location */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lieu / Venue</label>
                        <div className="relative group">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-neon-yellow transition-colors" />
                            <input
                                type="text"
                                value={venue}
                                onChange={(e) => setVenue(e.target.value)}
                                placeholder="Ex: Ushuaïa"
                                className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-yellow transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ville <span className="text-neon-red">*</span></label>
                        <div className="relative group">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-neon-yellow transition-colors" />
                            <input
                                type="text"
                                value={locationInput}
                                onChange={(e) => setLocationInput(e.target.value.toUpperCase())}
                                onFocus={() => locationInput.length >= 1 && setShowSuggestions(true)}
                                placeholder="Ex: Ibiza"
                                className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-yellow transition-all"
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
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pays <span className="text-neon-red">*</span></label>
                        <div className="relative group">
                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-neon-cyan transition-colors" />
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
                                className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-yellow transition-all"
                                required
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowUploadModal(true)}
                            className="px-6 py-4 bg-neon-yellow/10 border border-neon-yellow/30 text-neon-yellow rounded-xl font-bold uppercase tracking-wider hover:bg-neon-yellow/20 transition-all cursor-pointer flex flex-col items-center justify-center gap-1 min-w-[120px]"
                        >
                            <Upload className="w-4 h-4" />
                            <span className="text-[10px]">Upload</span>
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
                            className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-yellow transition-all"
                            required
                        />
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex gap-4">
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 py-4 bg-white/5 border border-white/10 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
                        >
                            Annuler
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        className={`flex-[2] py-4 rounded-xl font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${status === 'loading'
                            ? 'bg-gray-600 cursor-not-allowed'
                            : 'bg-neon-yellow hover:bg-neon-yellow/80 text-black'
                            }`}
                    >
                        {status === 'loading' ? (
                            <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <Send className="w-5 h-5" />
                                {isEditing ? 'Mettre à jour' : 'Ajouter à l\'Agenda'}
                            </>
                        )}
                    </button>
                </div>

                {/* Status Message */}
                <AnimatePresence>
                    {status !== 'idle' && message && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className={`p-4 rounded-xl flex items-center gap-3 ${status === 'error' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                status === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                }`}
                        >
                            <AlertCircle className="w-5 h-5" />
                            <p className="font-bold uppercase tracking-wider text-xs">{message}</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </form>

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
        </div>
    );
}
