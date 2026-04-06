import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, ArrowLeft, Bold, Calendar, CaseUpper, CheckCircle2, Clock, Columns, Edit2, Eye, FileText, Image as ImageIcon, Italic, Link2, List, MapPin, PartyPopper, Plus, Send, Star, Trash2, Underline as UnderlineIcon, Upload, User, Wand2, X, Youtube, Globe, Facebook, Instagram, ChevronUp, ChevronDown, Check, AlignLeft, AlignCenter, AlignRight, Palette } from 'lucide-react';
import { useNavigate, useLocation, useSearchParams, useBlocker } from 'react-router-dom';
import { getAuthHeaders } from '../utils/auth';
import { ImageUploadModal } from '../components/ImageUploadModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { fixEncoding, standardizeContent } from '../utils/standardizer';
import recapsData from '../data/recaps.json';
import agendaData from '../data/agenda.json';
import editorsData from '../data/editors.json';

import '../styles/article-premium.css';



// Custom Icons for Official Brands
const TikTokIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43V7.82a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.25z" />
    </svg>
);

const SpotifyIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.5 17.3c-.2.3-.6.4-.9.2-2.8-1.7-6.4-2.1-10.6-1.1-.3.1-.7-.1-.8-.4-.1-.3.1-.7.4-.8 4.7-1.1 8.7-.6 11.8 1.3.2.2.3.5.1.8zm1.5-3.3c-.3.4-.8.5-1.2.3-3.2-2-8.2-2.6-12-1.4-.4.1-.9-.1-1-.5-.1-.4.1-.9.5-1 4.4-1.3 9.9-.7 13.6 1.6.3.3.4.8.1 1zM19.2 10.6c-3.9-2.3-10.3-2.5-14.1-1.4-.6.2-1.2-.2-1.4-.8-.2-.6.2-1.2.8-1.4 4.3-1.3 11.4-1.1 16 1.6.5.3.7 1 .4 1.5-.3.5-1 .7-1.5.4v.1z" />
    </svg>
);

const SoundCloudIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M23.999 14.165c-.052 1.796-1.612 3.169-3.4 3.169h-8.18a.68.68 0 0 1-.675-.683V7.862a.747.747 0 0 1 .452-.724s.75-.513 2.333-.513a5.364 5.364 0 0 1 2.763.755 5.433 5.433 0 0 1 2.57 3.54c.282-.08.574-.121.868-.12.884 0 1.73.358 2.347.992s.948 1.49.922 2.373ZM10.721 8.421c.247 2.98.427 5.697 0 8.672a.264.264 0 0 1-.53 0c-.395-2.946-.22-5.718 0-8.672a.264.264 0 0 1 .53 0ZM9.072 9.448c.285 2.659.37 4.986-.006 7.655a.277.277 0 0 1-.55 0c-.331-2.63-.256-5.02 0-7.655a.277.277 0 0 1 .556 0Zm-1.663-.257c.27 2.726.39 5.171 0 7.904a.266.266 0 0 1-.532 0c-.38-2.69-.257-5.21 0-7.904a.266.266 0 0 1 .532 0Zm-1.647.77a26.108 26.108 0 0 1-.008 7.147.272.272 0 0 1-.542 0 27.955 27.955 0 0 1 0-7.147.275.275 0 0 1 .55 0Zm-1.67 1.769c.421 1.865.228 3.5-.029 5.388a.257.257 0 0 1-.514 0c-.21-1.858-.398-3.549 0-5.389a.272.272 0 0 1 .543 0Zm-1.655-.273c.388 1.897.26 3.508-.01 5.412-.026.28-.514.283-.54 0-.244-1.878-.347-3.54-.01-5.412a.283.283 0 0 1 .56 0Zm-1.668.911c.4 1.268.257 2.292-.026 3.572a.257.257 0 0 1-.514 0c-.241-1.262-.354-2.312-.023-3.572a.283.283 0 0 1 .563 0Z" />
    </svg>
);

const BeatportIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M21.429 17.055a7.114 7.114 0 0 1-.794 3.246 6.917 6.917 0 0 1-2.181 2.492 6.698 6.698 0 0 1-3.063 1.163 6.653 6.653 0 0 1-3.239-.434 6.796 6.796 0 0 1-2.668-1.932 7.03 7.03 0 0 1-1.481-2.983 7.124 7.124 0 0 1 .049-3.345 7.015 7.015 0 0 1 1.566-2.937l-4.626 4.73-2.421-2.479 5.201-5.265a3.791 3.791 0 0 0 1.066-2.675V0h3.41v6.613a7.172 7.172 0 0 1-.519 2.794 7.02 7.02 0 0 1-1.559 2.353l-.153.156a6.768 6.768 0 0 1 3.49-1.725 6.687 6.687 0 0 1 3.845.5 6.873 6.873 0 0 1 2.959 2.564 7.118 7.118 0 0 1 1.118 3.8Zm-3.089 0a3.89 3.89 0 0 0-.611-2.133 3.752 3.752 0 0 0-1.666-1.424 3.65 3.65 0 0 0-2.158-.233 3.704 3.704 0 0 0-1.92 1.037 3.852 3.852 0 0 0-1.031 1.955 3.908 3.908 0 0 0 .205 2.213c.282.7.76 1.299 1.374 1.721a3.672 3.672 0 0 0 2.076.647 3.637 3.637 0 0 0 2.635-1.096c.347-.351.622-.77.81-1.231.188-.461.285-.956.286-1.456Z" />
    </svg>
);

const XIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
);

const EDITOR_COLORS = [
    '#FF1241', // neon-red
    '#00FFFF', // neon-cyan
    '#BF00FF', // neon-purple
    '#39FF14', // neon-green
    '#FFF01F', // neon-yellow
    '#FF5E00', // neon-orange
    '#00BFFF', // neon-blue
    '#FF0099', // neon-pink
    '#00FF88', // neon-mint
    '#7B61FF', // neon-indigo
    '#FFFFFF', // blanc
];

const getEditorColor = (username: string) => {
    const normalized = username.toLowerCase();
    // Manual overrides for core team to provide unique colors
    if (normalized === 'alex') return '#FF1241';
    if (normalized === 'tanguy') return '#00FFFF';
    if (normalized === 'julien') return '#BF00FF';
    if (normalized === 'tiffany') return '#39FF14';
    if (normalized === 'kevin') return '#FFF01F';
    if (normalized === 'guiyoome') return '#FF5E00';

    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
        hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
    }
    return EDITOR_COLORS[Math.abs(hash) % EDITOR_COLORS.length];
};

// Special style for Alex (Gradient)
const getAuthorTextStyle = (username: string) => {
    const color = getEditorColor(username);
    if (username.toLowerCase() === 'alex') {
        return {
            background: 'linear-gradient(to right, #FF1241, #FF0099, #BF00FF)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block'
        };
    }
    return { color };
};

// Helper component to fix caret jumping in contentEditable
function VisualEditor({ content, onChange, className, widgetId, onFocus }: { content: string, onChange: (html: string) => void, className: string, widgetId: string, onFocus?: (e: any) => void }) {
    const editorRef = useRef<HTMLDivElement>(null);

    // Update innerHTML only if it differs from state (prevents caret jumping)
    useEffect(() => {
        if (editorRef.current) {
            if (editorRef.current.innerHTML !== content) {
                editorRef.current.innerHTML = content;
            }
        }
    }, [content]);

    return (
        <div
            ref={editorRef}
            contentEditable
            onInput={(e) => onChange(e.currentTarget.innerHTML)}
            onFocus={onFocus}
            className={className}
            data-widget-id={widgetId}
            onBlur={(e) => onChange(e.currentTarget.innerHTML)}
            spellCheck={false}
        />
    );
}

export function RecapCreate() {
    const navigate = useNavigate();
    const location = useLocation() as any;
    const [searchParams] = useSearchParams();
    const id = searchParams.get('id');
    const isEditing = !!id;
    const editingItem = location.state?.item;

    const [title, setTitle] = useState('');
    const [coverImage, setCoverImage] = useState('');
    const [date, setDate] = useState(() => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    });
    const [festival, setFestival] = useState('');
    const [locationInput, setLocationInput] = useState('');
    const [country, setCountry] = useState('');
    const [isAutoLocating, setIsAutoLocating] = useState(false);
    const [youtubeId, setYoutubeId] = useState('');
    const [showVideo, setShowVideo] = useState(true);
    const [year, setYear] = useState('');
    const [isFeatured, setIsFeatured] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [author, setAuthor] = useState(() => {
        const stored = localStorage.getItem('admin_name') || localStorage.getItem('admin_user') || 'Alex';
        const found = (editorsData as any[]).find(e =>
            e.name.toLowerCase() === stored.toLowerCase() ||
            e.username.toLowerCase() === stored.toLowerCase()
        );
        return found ? found.name : 'Alex';
    });
    const [isAuthorConfirmed, setIsAuthorConfirmed] = useState(false);
    const [festivalSocials, setFestivalSocials] = useState({
        website: '',
        instagram: '',
        tiktok: '',
        youtube: '',
        facebook: '',
        x: ''
    });
    const [festivalNameLabel, setFestivalNameLabel] = useState('');

    const [artistSocials, setArtistSocials] = useState({
        website: '',
        instagram: '',
        tiktok: '',
        youtube: '',
        facebook: '',
        x: '',
        spotify: '',
        soundcloud: '',
        beatport: ''
    });
    const [artistNameLabel, setArtistNameLabel] = useState('');

    const [showFestivalSocials, setShowFestivalSocials] = useState(false);
    const [showArtistSocials, setShowArtistSocials] = useState(false);



    // Widget System State
    const [widgets, setWidgets] = useState<{ id: string, content: string }[]>([
        { id: 'initial-1', content: '<h2 class="premium-section-title">TITRE DU RÉCAP</h2>' }
    ]);

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
            country: (country || '').toUpperCase()
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

    // Auto-location effect
    useEffect(() => {
        if (isEditing && initialDataLoaded.current && country) return;
        if ((!locationInput || locationInput.length < 2) && (!festival || festival.length < 3)) return;

        const searchText = festival && festival.length >= 3 ? `${festival} ${locationInput}` : locationInput;
        if (searchText.length < 3) return;

        const timeoutId = setTimeout(async () => {
            setIsAutoLocating(true);
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchText)}&limit=1&accept-language=fr`);
                const data = await response.json();
                if (data && data[0]) {
                    const displayName = data[0].display_name;
                    const parts = displayName.split(', ');
                    const countryName = parts[parts.length - 1];
                    const cityName = parts[0].trim();
                    if (countryName) setCountry(countryName.toUpperCase());
                    if (!locationInput && cityName) setLocationInput(cityName.toUpperCase());
                }
            } catch (error: any) {
                console.error('Auto-location error:', error);
            } finally {
                setIsAutoLocating(false);
            }
        }, 1200);

        return () => clearTimeout(timeoutId);
    }, [locationInput, festival]);

    const [mediaModal, setMediaModal] = useState<{ show: boolean, type: 'image' | 'gallery' | 'video', url: string, urls: string, aspectRatio?: string, widgetId?: string }>({ show: false, type: 'image', url: '', urls: '', aspectRatio: 'auto' });
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadTarget, setUploadTarget] = useState<{ type: 'main' | 'widget' | 'widget-edit' | 'duo1' | 'duo2', index?: number, widgetId?: string, initialImage?: string }>({ type: 'main' });
    const [duoModal, setDuoModal] = useState({ show: false, url1: '', url2: '', widgetIndex: undefined as number | undefined, widgetId: undefined as string | undefined, aspectRatio: '3/4' });
    const [videoGroupModal, setVideoGroupModal] = useState<{
        show: boolean;
        urls: string[];
        count: number;
        widgetIndex?: number;
        widgetId?: string;
    }>({
        show: false,
        urls: ['', '', ''],
        count: 2
    });
    const [isLoading, setIsLoading] = useState(isEditing && !editingItem);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Fetch item if missing from state but ID is present
    useEffect(() => {
        const id = searchParams.get('id');
        if (isEditing && !editingItem && id) {
            setIsLoading(true);
            const fetchFullItem = async () => {
                try {
                    const response = await fetch(`/api/recaps/content?id=${id}`, { headers: getAuthHeaders() });
                    if (response.ok) {
                        const data = await response.json();
                        if (data.recap) {
                            setTitle(data.recap.title || '');
                            setCoverImage(data.recap.image || '');
                            const dateValue = data.recap.date || new Date().toISOString();
                            let finalDate = dateValue;
                            if (dateValue.includes('T')) {
                                try {
                                    const parsedDate = new Date(dateValue);
                                    parsedDate.setMinutes(parsedDate.getMinutes() - parsedDate.getTimezoneOffset());
                                    finalDate = parsedDate.toISOString().slice(0, 16);
                                } catch (e: any) {
                                    finalDate = dateValue.slice(0, 16);
                                }
                            } else {
                                finalDate = dateValue + "T12:00";
                            }
                            setDate(finalDate);
                            setFestival(data.recap.festival || '');
                            setLocationInput(data.recap.location || '');
                            setYoutubeId(data.recap.youtubeId || '');
                            setShowVideo(data.recap.showVideo !== false);
                            setYear(data.recap.year || '');
                            setIsFeatured(data.recap.isFeatured || false);

                            const c = data.content || data.recap.content || '';
                            const foundWidgets = [];
                            const articleSectionPattern = '<div class="article-section';
                            if (c.includes(articleSectionPattern)) {
                                const parts = c.split(articleSectionPattern);
                                for (let i = 1; i < parts.length; i++) {
                                    const part = parts[i];
                                    const openTagEnd = part.indexOf('>');
                                    if (openTagEnd !== -1) {
                                        let content = part.substring(openTagEnd + 1);
                                        const lastCloseIdx = content.lastIndexOf('</div>');
                                        if (lastCloseIdx !== -1) content = content.substring(0, lastCloseIdx);
                                        foundWidgets.push({ id: Math.random().toString(36).substring(2, 11), content: content.trim() });
                                    }
                                }
                            }
                            if (foundWidgets.length > 0) setWidgets(foundWidgets);
                            else setWidgets([{ id: 'legacy-1', content: c }]);
                        } else if (data.content) {
                            const localItem = (recapsData as any[]).find(r => String(r.id) === String(id));
                            if (localItem) {
                                setTitle(localItem.title);
                                setCoverImage(localItem.image);
                                const localDateValue = localItem.date || new Date().toISOString();
                                let localFinalDate = localDateValue;
                                if (localDateValue.includes('T')) {
                                    try {
                                        const parsedDate = new Date(localDateValue);
                                        parsedDate.setMinutes(parsedDate.getMinutes() - parsedDate.getTimezoneOffset());
                                        localFinalDate = parsedDate.toISOString().slice(0, 16);
                                    } catch (e: any) {
                                        localFinalDate = localDateValue.slice(0, 16);
                                    }
                                } else {
                                    localFinalDate = localDateValue + "T12:00";
                                }
                                setDate(localFinalDate);
                                setFestival(localItem.festival || '');
                                setLocationInput(localItem.location || '');
                                setYoutubeId(localItem.youtubeId || '');
                                setShowVideo(localItem.showVideo !== false);
                                setYear(localItem.year || '');
                                setIsFeatured(localItem.isFeatured || false);
                                if (localItem.author) setAuthor(localItem.author);
                            }

                            // Extract Festival Socials
                            const festSocialsRegex = /<div class="festival-socials-premium[^>]*>([\s\S]*?)<\/div>/i;
                            const socialLinkRegex = /href="([^"]+)"[^>]*data-platform="([^"]+)"/g;
                            const festSocialsMatch = (data.content || '').match(festSocialsRegex);
                            if (festSocialsMatch) {
                                const socialsContent = festSocialsMatch[1];
                                let linkMatch;
                                const newSocials = { ...festivalSocials };
                                while ((linkMatch = socialLinkRegex.exec(socialsContent)) !== null) {
                                    const [_, url, platform] = linkMatch;
                                    if (platform in newSocials) {
                                        (newSocials as any)[platform] = url;
                                    }
                                }
                                setFestivalSocials(newSocials);
                            }

                            setWidgets([{ id: 'legacy-1', content: data.content }]);
                        }
                    }
                } catch (e: any) {
                    console.error("Failed to fetch recap for edit", e);
                    setLoadError("Impossible de charger les données du récap.");
                } finally {
                    console.log('[RecapCreate] Fetch complete');
                    setIsLoading(false);
                    initialDataLoaded.current = true;
                    setIsAuthorConfirmed(true); // Auto-confirm on edit
                }
            };
            fetchFullItem();
        } else {
            setIsLoading(false);
        }
    }, [isEditing, editingItem, searchParams]);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const [linkModal, setLinkModal] = useState<{
        show: boolean;
        url: string;
        text: string;
        widgetId: string | null;
        start: number;
        end: number;
        isTextarea: boolean;
        isVisualEditor: boolean;
        savedRange: Range | null;
    }>({
        show: false,
        url: '',
        text: '',
        widgetId: null,
        start: 0,
        end: 0,
        isTextarea: false,
        isVisualEditor: false,
        savedRange: null
    });

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
            if (title || coverImage) {
                initialDataLoaded.current = true;
            }
            return;
        }
        if (initialDataLoaded.current) {
            setIsDirty(true);
        }
    }, [title, coverImage, widgets, date, festival, locationInput, country, youtubeId, isFeatured, festivalSocials, artistSocials]);

    // Autolocation Logic
    useEffect(() => {
        // Don't auto-locate if we already have a country and just loaded the item
        if (isEditing && initialDataLoaded.current && country) return;
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
            } catch (error: any) {
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

    useEffect(() => {
        if (isEditing && editingItem) {
            setTitle(editingItem.title);
            setCoverImage(editingItem.image);
            setDate(editingItem.date);
            setFestival(editingItem.festival || '');
            setLocationInput(editingItem.location || '');
            setCountry(editingItem.country || '');
            setYoutubeId(editingItem.youtubeId || '');
            setShowVideo(editingItem.showVideo !== false);
            setYear(editingItem.year || '');
            setIsFeatured(editingItem.isFeatured || false);

            // Parse Content into Widgets
            let c = editingItem.content || '';
            if (typeof c === 'string' && c.startsWith('<div class="markdown-content">')) {
                c = c.replace('<div class="markdown-content">', '').replace(/<\/div>$/, '').replace(/<br>/g, '\n');
            }

            const articleSectionPattern = '<div class="article-section';
            const foundWidgets = [];

            if (c.includes(articleSectionPattern)) {
                const parts = c.split(articleSectionPattern);
                // parts[0] is content before first section
                for (let i = 1; i < parts.length; i++) {
                    const part = parts[i];
                    const openTagEnd = part.indexOf('>');
                    if (openTagEnd !== -1) {
                        let content = part.substring(openTagEnd + 1);
                        // Find the last closing div for this section
                        const lastCloseIdx = content.lastIndexOf('</div>');
                        if (lastCloseIdx !== -1) {
                            content = content.substring(0, lastCloseIdx);
                        }
                        foundWidgets.push({
                            id: Math.random().toString(36).substring(2, 11),
                            content: content.trim()
                        });
                    }
                }
            }

            if (foundWidgets.length > 0) {
                setWidgets(foundWidgets);
            } else {
                setWidgets([{ id: 'legacy-1', content: c || '' }]);
            }
        }
    }, [isEditing, editingItem]);

    // const handleUpload = async (file: File) => {
    //     const validation = uploadValidation(file);
    //     if (!validation.valid) throw new Error(validation.error);
    //     return await uploadToCloudinary(file, 'recaps', (p) => setUploadProgress(p));
    // };





    const addWidget = (index?: number, customContent?: string) => {
        const newWidget = { id: Math.random().toString(36).substr(2, 9), content: customContent || '' };
        if (typeof index === 'number') {
            const newWidgets = [...widgets];
            newWidgets.splice(index + 1, 0, newWidget);
            setWidgets(newWidgets);
        } else {
            setWidgets([...widgets, newWidget]);
        }
    };

    const insertLinkToActiveWidget = (id: string | null) => {
        const activeEl = document.activeElement;
        const isVisualEditor = !!(activeEl && activeEl.classList.contains('visual-editor-content'));
        const widgetId = id || (activeEl ? activeEl.getAttribute('data-widget-id') : null);
        if (!widgetId) return;

        let selectionText = '';
        let start = 0;
        let end = 0;
        let savedRange: Range | null = null;

        if (isVisualEditor) {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                savedRange = selection.getRangeAt(0).cloneRange();
                selectionText = selection.toString();
            }
        } else {
            const isTextarea = !!(activeEl && activeEl.tagName === 'TEXTAREA');
            if (isTextarea) {
                const ta = activeEl as HTMLTextAreaElement;
                selectionText = ta.value.substring(ta.selectionStart, ta.selectionEnd);
                start = ta.selectionStart;
                end = ta.selectionEnd;
            }
        }

        setLinkModal({
            show: true,
            url: '',
            text: selectionText || '',
            widgetId,
            start,
            end,
            isTextarea: !isVisualEditor,
            isVisualEditor: isVisualEditor,
            savedRange
        });
    };

    const confirmLinkInsertion = () => {
        const { url, text, widgetId, start, end, isTextarea, isVisualEditor, savedRange } = linkModal;
        if (!url || !widgetId) return;

        if (isVisualEditor) {
            const editor = document.querySelector(`.visual-editor-content[data-widget-id="${widgetId}"]`) as HTMLElement;
            if (editor) {
                editor.focus();
                if (savedRange) {
                    const selection = window.getSelection();
                    selection?.removeAllRanges();
                    selection?.addRange(savedRange);
                }
                document.execCommand('createLink', false, url);

                // Trigger change
                const event = new Event('input', { bubbles: true });
                editor.dispatchEvent(event);
            }
            setLinkModal({ ...linkModal, show: false, savedRange: null });
            return;
        }

        const markdownLink = `[${text || url}](${url})`;

        setWidgets(prevWidgets => prevWidgets.map(w => {
            if (w.id === widgetId) {
                if (isTextarea) {
                    const before = w.content.substring(0, start);
                    const after = w.content.substring(end);
                    return { ...w, content: before + markdownLink + after };
                }
                return { ...w, content: w.content + (w.content ? ' ' : '') + markdownLink };
            }
            return w;
        }));

        setLinkModal({ ...linkModal, show: false, savedRange: null });
    };

    const updateWidget = (id: string, newContent: string) => {
        setWidgets(widgets.map(w => w.id === id ? { ...w, content: newContent } : w));
    };

    const moveWidgetUp = (index: number) => {
        if (index === 0) return;
        const newWidgets = [...widgets];
        [newWidgets[index - 1], newWidgets[index]] = [newWidgets[index], newWidgets[index - 1]];
        setWidgets(newWidgets);
    };

    const moveWidgetDown = (index: number) => {
        if (index === widgets.length - 1) return;
        const newWidgets = [...widgets];
        [newWidgets[index + 1], newWidgets[index]] = [newWidgets[index], newWidgets[index + 1]];
        setWidgets(newWidgets);
    };

    const extractDuoUrls = (html: string) => {
        const matches = html.match(/src="([^"]+)"/g);
        const urls = matches ? matches.map(m => m.replace('src="', '').replace('"', '')) : ['', ''];
        const aspectMatch = html.match(/aspect-\[([^\]]+)\]/);
        const ratio = aspectMatch ? aspectMatch[1] : '3/4';
        return { urls, ratio };
    };

    const extractSingleImageUrlAndRatio = (html: string) => {
        const srcMatch = html.match(/src="([^"]+)"/);
        const aspectMatch = html.match(/aspect-\[([^\]]+)\]/);
        return {
            url: srcMatch ? srcMatch[1] : '',
            ratio: aspectMatch ? aspectMatch[1] : 'auto'
        };
    };

    const extractVideoUrls = (html: string) => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const iframes = doc.querySelectorAll('iframe');
        const urls = Array.from(iframes).map(iframe => iframe.src);
        return { urls, count: urls.length };
    };

    const toggleWidgetStyle = (id: string, style: 'uppercase' | 'font-display' | 'text-sm' | 'text-xl' | 'text-2xl' | 'text-3xl' | 'text-4xl' | 'text-5xl' | 'text-left' | 'text-center' | 'text-right' | 'bg-white') => {
        const activeEl = document.activeElement;
        const isVisualEditor = !!(activeEl && activeEl.classList.contains('visual-editor-content'));
        const isTextarea = !!(activeEl && activeEl.tagName === 'TEXTAREA');
        const selection = window.getSelection();

        // 1. Visual Editor Selection Mode
        if (isVisualEditor && selection && selection.toString().length > 0) {
            const widgetId = (activeEl as HTMLElement).getAttribute('data-widget-id');
            if (widgetId === id) {
                const range = selection.getRangeAt(0);

                // Check if already wrapped in a span with this style
                let parent = range.commonAncestorContainer;
                if (parent && parent.nodeType === 3) parent = parent.parentNode as HTMLElement;

                if (parent && (parent as HTMLElement).tagName === 'SPAN' && (parent as HTMLElement).classList.contains(style)) {
                    const content = (parent as HTMLElement).innerHTML;
                    (parent as HTMLElement).outerHTML = content;
                } else {
                    const span = document.createElement('span');
                    span.className = style;
                    const content = range.cloneContents();
                    span.appendChild(content);
                    range.deleteContents();
                    range.insertNode(span);
                }

                updateWidget(id, (activeEl as HTMLElement).innerHTML);
                return;
            }
        }

        // 2. Textarea Selection Mode
        if (isTextarea && activeEl) {
            const ta = activeEl as HTMLTextAreaElement;
            const widgetId = ta.getAttribute('data-widget-id');
            if (widgetId === id) {
                const start = ta.selectionStart;
                const end = ta.selectionEnd;
                const val = ta.value;
                const selectedText = val.substring(start, end);

                if (selectedText) {
                    const formatted = `<span class="${style}">${selectedText}</span>`;
                    const before = val.substring(0, start);
                    const after = val.substring(end);
                    updateWidget(id, before + formatted + after);
                    return;
                }
            }
        }

        // 3. Whole Widget Mode (Fallback)
        setWidgets(prev => prev.map(w => {
            if (w.id !== id) return w;

            const content = w.content;
            const wrapperRegex = /^<div class="([^"]*)">\n([\s\S]*)\n<\/div>$/;
            const match = content.match(wrapperRegex);

            let classes: string[] = [];
            let innerContent = content;

            if (match) {
                classes = match[1].split(' ').filter(c => c);
                innerContent = match[2];
            }

            const sizeClasses = ['text-sm', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl'];
            const alignClasses = ['text-left', 'text-center', 'text-right'];

            if (sizeClasses.includes(style)) {
                if (classes.includes(style)) {
                    classes = classes.filter(c => !sizeClasses.includes(c));
                } else {
                    classes = classes.filter(c => !sizeClasses.includes(c));
                    classes.push(style);
                }
            } else if (alignClasses.includes(style)) {
                if (classes.includes(style)) {
                    classes = classes.filter(c => !alignClasses.includes(c));
                } else {
                    classes = classes.filter(c => !alignClasses.includes(c));
                    classes.push(style);
                }
            } else if (style === 'bg-white') {
                if (classes.includes('bg-white')) {
                    classes = classes.filter(c => c !== 'bg-white');
                } else {
                    classes.push('bg-white');
                }
            } else {
                if (classes.includes(style)) {
                    classes = classes.filter(c => c !== style);
                } else {
                    classes.push(style);
                }
            }

            if (classes.length > 0) {
                return { ...w, content: `<div class="${classes.join(' ')}">\n${innerContent}\n</div>` };
            } else {
                return { ...w, content: innerContent };
            }
        }));
    };

    const applyColorToSelection = (widgetId: string, color: string) => {
        const activeEl = document.activeElement;
        const isVisualEditor = !!(activeEl && activeEl.classList.contains('visual-editor-content'));

        if (isVisualEditor && activeEl) {
            document.execCommand('foreColor', false, color);
            const event = new Event('input', { bubbles: true });
            activeEl.dispatchEvent(event);
            return;
        }

        // Fallback for textarea (not visual editor)
        const isCorrectTextarea = !!(activeEl && activeEl.tagName === 'TEXTAREA');
        if (!isCorrectTextarea) return;

        const ta = activeEl as HTMLTextAreaElement;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const val = ta.value;
        const selectedText = val.substring(start, end);

        if (!selectedText) {
            // If no text is selected, apply color to the whole widget content
            setWidgets(widgets.map(w => {
                if (w.id === widgetId) {
                    // Check if content is already wrapped in a div with style
                    const styleRegex = /<div style="color:\s*([^"]*)">([\s\S]*)<\/div>/;
                    const match = w.content.match(styleRegex);
                    if (match) {
                        // Update existing color
                        return { ...w, content: `<div style="color: ${color}">${match[2]}</div>` };
                    } else {
                        // Wrap content in a new div with color
                        return { ...w, content: `<div style="color: ${color}">${w.content}</div>` };
                    }
                }
                return w;
            }));
            return;
        }

        const coloredText = `<span style="color: ${color}">${selectedText}</span>`;

        setWidgets(widgets.map(w => {
            if (w.id === widgetId) {
                const before = val.substring(0, start);
                const after = val.substring(end);
                return { ...w, content: before + coloredText + after };
            }
            return w;
        }));
    };

    const applyFormat = (command: string) => {
        const activeEl = document.activeElement;
        const isVisualEditor = !!(activeEl && activeEl.classList.contains('visual-editor-content'));
        const isTextarea = !!(activeEl && activeEl.tagName === 'TEXTAREA');

        if (isVisualEditor && activeEl) {
            document.execCommand(command, false);
            const event = new Event('input', { bubbles: true });
            activeEl.dispatchEvent(event);
            return;
        }

        if (isTextarea && activeEl) {
            const ta = activeEl as HTMLTextAreaElement;
            const start = ta.selectionStart;
            const end = ta.selectionEnd;
            const val = ta.value;
            const selectedText = val.substring(start, end);

            let formatted = selectedText;
            if (command === 'bold') {
                formatted = `**${selectedText}**`;
            } else if (command === 'italic') {
                formatted = `*${selectedText}*`;
            } else if (command === 'underline') {
                formatted = `<u>${selectedText}</u>`;
            }

            const before = val.substring(0, start);
            const after = val.substring(end);
            const newContent = before + formatted + after;

            const widgetId = ta.getAttribute('data-widget-id');
            if (widgetId) {
                updateWidget(widgetId, newContent);
                // Need to restore selection after state update (approximate)
                setTimeout(() => {
                    ta.focus();
                    ta.setSelectionRange(start, start + formatted.length);
                }, 0);
            }
        }
    };

    const fixWidgetEncoding = (id: string) => {
        setWidgets(widgets.map(w => w.id === id ? { ...w, content: fixEncoding(w.content) } : w));
    };

    const removeWidget = (id: string) => {
        if (widgets.length > 1) {
            setWidgets(widgets.filter(w => w.id !== id));
        }
    };

    const handleMediaConfirm = (index?: number) => {
        const { type, url, urls, aspectRatio } = mediaModal;
        let content = '';

        if (type === 'image' && url) {
            const aspectClass = aspectRatio && aspectRatio !== 'auto' ? `aspect-[${aspectRatio}]` : '';
            const imgClass = aspectRatio && aspectRatio !== 'auto' ? 'w-full h-full object-cover' : 'w-full h-auto object-cover';
            content = `<div class="image-premium-wrapper w-full relative rounded-3xl overflow-hidden shadow-2xl border border-white/5 my-12 group ${aspectClass}">
  <img src="${url}" alt="Image" class="${imgClass} transform group-hover:scale-105 transition-transform duration-700" />
</div>`;
        } else if (type === 'video' && url) {
            let id = url;
            if (url.includes('youtube.com/watch?v=')) {
                id = url.split('v=')[1].split('&')[0];
            } else if (url.includes('youtu.be/')) {
                id = url.split('youtu.be/')[1].split('?')[0];
            } else if (url.includes('embed/')) {
                id = url.split('embed/')[1].split('?')[0];
            }
            content = `<div class="youtube-player-widget w-full relative aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/5 my-12">
    <iframe src="https://www.youtube.com/embed/${id}" class="absolute inset-0 w-full h-full" allowfullscreen></iframe>
</div>`;
        } else if (type === 'gallery' && urls) {
            const urlList = urls.split('\n').map(u => u.trim()).filter(u => u);
            content = `<div class="gallery-premium-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 my-12">
    ${urlList.map(u => `  <div class="aspect-square relative overflow-hidden rounded-2xl border border-white/10 group shadow-2xl">
    <img src="${u}" class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
  </div>`).join('\n')
                }
</div>`;
        }

        if (content) {
            if (mediaModal.widgetId) {
                updateWidget(mediaModal.widgetId, content);
            } else if (typeof index === 'number') {
                addWidget(index, content);
            } else {
                setWidgets([...widgets, { id: Math.random().toString(36).substr(2, 9), content }]);
            }
        }
        setMediaModal({ show: false, type: 'image', url: '', urls: '', aspectRatio: 'auto', widgetId: undefined });
    };

    const handleSubmit = async (e?: React.FormEvent | React.MouseEvent | any, publishNow = false, scheduleDate?: string) => {
        if (e) {
            if (typeof e.preventDefault === 'function') e.preventDefault();
            if (typeof e.stopPropagation === 'function') e.stopPropagation();
        }

        let finalDate = scheduleDate || date;
        if (publishNow) {
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            finalDate = now.toISOString().slice(0, 16);
            setDate(finalDate);
        }
        if (!isAuthorConfirmed) {
            setStatus('error');
            setMessage("Veuillez confirmer l'éditeur de l'article en cochant la case correspondante.");
            // Scroll to the editor section
            const editorLabel = document.querySelector('[data-section="editor-selection"]');
            if (editorLabel) {
                editorLabel.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        if (!coverImage || !locationInput || !country || !year) {
            setStatus('error');
            setMessage('Veuillez ajouter une image de couverture, un lieu, un pays et l\'année.');
            return;
        }

        setStatus('loading');
        setMessage('Publication en cours...');

        try {
            const generateSocialsHtml = (customName?: string, customColor?: string) => {
                const activeSocials = Object.entries(artistSocials).filter(([_, url]) => url && url.trim() !== '');
                if (activeSocials.length === 0) return '';

                const linksHtml = activeSocials.map(([platform, url]) => {
                    return `<a href="${url.trim()}" target="_blank" data-platform="${platform}" class="artist-social-link" style="color: ${customColor || '#ff1241'}; border-color: ${customColor || '#ff1241'}">${platform}</a>`;
                }).join('');

                const displayName = (customName || artistNameLabel || "L'ARTISTE").toUpperCase();
                return `\n<div class="artist-socials-premium mt-12 pt-8 border-t border-white/10">\n  <h3 class="text-xs font-black text-gray-500 uppercase tracking-[0.3em] mb-6" style="color: ${customColor || '#6b7280'}">SUIVEZ ${displayName}</h3>\n  <div class="flex flex-wrap gap-4 uppercase font-black text-[10px] tracking-widest">\n    ${linksHtml}\n  </div>\n</div>`;
            };

            const generateFestivalSocialsHtml = () => {
                const activeSocials = Object.entries(festivalSocials).filter(([_, url]) => url && url.trim() !== '');
                if (activeSocials.length === 0) return '';

                const linksHtml = activeSocials.map(([platform, url]) => {
                    return `<a href="${url.trim()}" target="_blank" data-platform="${platform}" class="festival-social-link">${platform}</a>`;
                }).join('');

                const displayName = (festivalNameLabel || festival || "LE FESTIVAL").toUpperCase();
                return `\n<div class="festival-socials-premium mt-12 pt-8 border-t border-white/10">\n  <h3 class="text-xs font-black text-gray-500 uppercase tracking-[0.3em] mb-6">SUIVEZ ${displayName}</h3>\n  <div class="flex flex-wrap gap-4 uppercase font-black text-[10px] tracking-widest">\n    ${linksHtml}\n  </div>\n</div>`;
            };

            const finalContent = widgets.map(w =>
                `<div class="article-section">\n\n${w.content}\n\n</div>`
            ).join('\n\n') + (Object.values(artistSocials).some(v => v.trim()) ? `\n\n<div class="article-section">${generateSocialsHtml()}</div>` : '') + (Object.values(festivalSocials).some(v => v.trim()) ? `\n\n<div class="article-section">${generateFestivalSocialsHtml()}</div>` : '');

            const endpoint = isEditing ? '/api/recaps/update' : '/api/recaps/create';

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    id: isEditing ? id : undefined,
                    title: fixEncoding(title),
                    content: fixEncoding(finalContent),
                    image: coverImage,
                    date: finalDate,
                    festival,
                    location: locationInput,
                    country,
                    youtubeId,
                    showVideo,
                    year: year || undefined,
                    category: 'Recaps',
                    isFeatured,
                    author: author
                }),
            });

            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e: any) {
                    errorData = { error: `Erreur ${response.status}: ${response.statusText} ` };
                }
                throw new Error(errorData.error || 'Erreur lors de la publication');
            }

            await response.json();
            setStatus('success');
            setIsDirty(false);
            setMessage(isEditing ? 'Récap mis à jour avec succès !' : (finalDate > new Date().toISOString().split('T')[0] ? 'Récap programmé avec succès !' : 'Récap publié avec succès !'));
            window.scrollTo({ top: 0, behavior: 'smooth' });

            if (!isEditing) {
                setTitle('');
                setWidgets([{ id: 'initial-' + Math.random().toString(36).substr(2, 9), content: '<h2 class="premium-section-title">TITRE DU RÉCAP</h2>' }]);
                setCoverImage('');
                setFestival('');
                setLocationInput('');
                setYoutubeId('');
                setShowVideo(true);
                setYear('');
                setIsFeatured(false);
                setIsAuthorConfirmed(false);
                setFestivalSocials({
                    website: '',
                    instagram: '',
                    tiktok: '',
                    youtube: '',
                    facebook: '',
                    x: ''
                });
                setIsDirty(false); // Reset dirty state
                // Clear status after a while
                setTimeout(() => setStatus('idle'), 3000);
            } else {
                // Redirect after edit
                setIsDirty(false); // Reset dirty state
                setTimeout(() => navigate('/admin/manage'), 2000);
            }

        } catch (error: any) {
            console.error('Error creating recap:', error);
            setStatus('error');
            setMessage(error instanceof Error ? error.message : 'Une erreur est survenue');
        }
    };

    const handleDelete = async () => {
        if (!id) return;
        setStatus('loading');
        try {
            const response = await fetch('/api/recaps/delete', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ id })
            });

            if (response.ok) {
                setStatus('success');
                setMessage('Récap supprimé avec succès !');
                setTimeout(() => navigate('/admin/manage'), 2000);
            } else {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e: any) {
                    errorData = { error: 'Erreur lors de la suppression' };
                }
                setStatus('error');
                setMessage(errorData.error || 'Erreur lors de la suppression');
            }
        } catch (e: any) {
            setStatus('error');
            setMessage('Erreur de connexion');
        } finally {
            setShowDeleteConfirm(false);
        }
    };

    if (isLoading || loadError) {
        return (
            <div className="min-h-screen bg-dark-bg flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-white">
                    {isLoading ? (
                        <>
                            <div className="w-12 h-12 border-4 border-neon-red/20 border-t-neon-red rounded-full animate-spin" />
                            <p className="font-bold uppercase tracking-widest text-[10px]">Chargement des données...</p>
                        </>
                    ) : (
                        <>
                            <AlertCircle className="w-12 h-12 text-neon-red" />
                            <p className="font-bold uppercase tracking-widest text-[10px] text-neon-red">{loadError}</p>
                            <button onClick={() => navigate('/admin/manage')} className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-[10px] font-bold uppercase tracking-widest">Retour</button>
                        </>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark-bg py-8 md:py-20 px-4 md:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 md:mb-12">
                    <div className="flex items-center gap-4 md:gap-6">
                        <button
                            onClick={() => {
                                if (window.history.length > 1) navigate(-1);
                                else navigate('/admin/manage');
                            }}
                            className="p-3 md:p-4 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl hover:bg-white/10 transition-all text-white group"
                            title="Retour"
                        >
                            <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${isEditing ? 'bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan' : 'bg-neon-green/10 border-neon-green/30 text-neon-green'}`}>
                                    {isEditing ? 'Mode Édition' : 'Nouveau Récap'}
                                </span>
                                <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                                    <User className="w-3 h-3 text-gray-500" />
                                    <span className="text-[9px] font-black text-white uppercase tracking-widest">
                                        Éditeur : <span style={getAuthorTextStyle(((editorsData as any[]).find(e => e.name === author)?.username || author).toLowerCase())}>{author}</span>
                                    </span>
                                    {isAuthorConfirmed ? (
                                        <Check className="w-3 h-3 text-neon-green" />
                                    ) : (
                                        <div className="w-1.5 h-1.5 rounded-full bg-neon-red animate-pulse" />
                                    )}
                                </div>
                            </div>
                            <h1 className="text-3xl md:text-5xl font-display font-black text-white uppercase italic tracking-tighter leading-none">
                                Studio <span className="text-neon-red">Editor</span>
                            </h1>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <button
                            type="button"
                            onClick={(e) => handleSubmit(e, true)}
                            disabled={status === 'loading'}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-lg ${status === 'loading'
                                ? 'bg-gray-600 cursor-not-allowed opacity-50'
                                : 'bg-neon-red hover:scale-105 active:scale-95 text-white shadow-[0_0_20px_rgba(255,18,65,0.4)]'
                                }`}
                        >
                            <Send className="w-4 h-4" />
                            <span>{status === 'loading' ? 'EN COURS...' : (isEditing ? 'METTRE À JOUR' : 'PUBLIER')}</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setShowScheduleModal(true)}
                            disabled={status === 'loading'}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-lg ${status === 'loading'
                                ? 'bg-gray-600 cursor-not-allowed opacity-50'
                                : 'bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:scale-105 active:scale-95'
                                }`}
                        >
                            <Calendar className="w-4 h-4" />
                            <span>{status === 'loading' ? 'EN COURS...' : 'PROGRAMMER'}</span>
                        </button>
                        {isEditing && (
                            <button
                                type="button"
                                onClick={() => setShowDeleteConfirm(true)}
                                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all border bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500`}
                            >
                                <Trash2 className="w-4 h-4" />
                                <span className="hidden md:inline">SUPPRIMER</span>
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => setIsFeatured(!isFeatured)}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all border ${isFeatured
                                ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.2)]'
                                : 'bg-white/5 border-white/10 text-gray-500 hover:text-white hover:border-white/20'
                                }`}
                        >
                            <Star className={`w-4 h-4 ${isFeatured ? 'fill-current' : ''}`} />
                            <span className="hidden md:inline">{isFeatured ? 'À LA UNE' : 'METTRE À LA UNE'}</span>
                            <span className="md:hidden">UNE</span>
                        </button>
                    </div>
                </div>

                <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8">

                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Status Message */}
                        {status !== 'idle' && (
                            <div className={`p-4 rounded-xl flex flex-col gap-3 ${status === 'error' ? 'bg-red-500/10 text-red-500' :
                                status === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'
                                }`}>
                                <div className="flex items-center gap-3">
                                    {status === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                    <p className="font-bold uppercase tracking-wider text-xs">{message}</p>
                                </div>
                            </div>
                        )}

                        {/* Author Selector */}
                        <div data-section="editor-selection" className="space-y-6">
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <User className="w-3 h-3 text-neon-cyan" /> Choisir l'Éditeur <span className="text-neon-red">*</span>
                            </label>

                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                {(editorsData as any[]).map((editor: any) => {
                                    const editorColor = getEditorColor(editor.username.toLowerCase());
                                    const isSelected = author === editor.name;
                                    return (
                                        <button
                                            key={editor.username}
                                            type="button"
                                            onClick={() => {
                                                setAuthor(editor.name);
                                                setIsAuthorConfirmed(false);
                                            }}
                                            className={`group relative p-3 rounded-2xl border transition-all duration-300 flex flex-col items-center gap-2 ${isSelected
                                                ? 'bg-white/10'
                                                : 'bg-black/40 border-white/10 hover:border-white/20'
                                                }`}
                                            style={{
                                                borderColor: isSelected ? editorColor : 'rgba(255,255,255,0.1)',
                                                boxShadow: isSelected ? `0 0 20px ${editorColor}20` : 'none'
                                            }}
                                        >
                                            <div
                                                className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                                                style={{
                                                    backgroundColor: isSelected ? editorColor : 'rgba(255,255,255,0.05)',
                                                    color: isSelected ? '#000' : '#666'
                                                }}
                                            >
                                                <User className="w-5 h-5" />
                                            </div>
                                            <span
                                                className="text-[10px] font-black uppercase tracking-widest transition-colors"
                                                style={getAuthorTextStyle(editor.username)}
                                            >
                                                {editor.name}
                                            </span>
                                            {isSelected && (
                                                <div className="absolute top-2 right-2">
                                                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: editorColor }} />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <div
                                className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all border ${isAuthorConfirmed
                                    ? 'bg-neon-cyan/5 border-neon-cyan/30'
                                    : 'bg-white/5 border-white/10 hover:bg-white/[0.07] hover:border-white/20 animate-pulse'
                                    }`}
                                onClick={() => setIsAuthorConfirmed(!isAuthorConfirmed)}
                            >
                                <button
                                    type="button"
                                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isAuthorConfirmed
                                        ? 'bg-neon-cyan border-neon-cyan shadow-[0_0_10px_rgba(0,255,255,0.3)]'
                                        : 'bg-black/40 border-white/20'
                                        }`}
                                >
                                    {isAuthorConfirmed && <Check className="w-4 h-4 text-black" />}
                                </button>
                                <div className="flex flex-col">
                                    <span className={`text-xs font-black uppercase tracking-widest transition-colors ${isAuthorConfirmed ? 'text-white' : 'text-gray-400'}`}>
                                        Confirmer l'Éditeur
                                    </span>
                                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                                        Je certifie que <span className="font-black" style={getAuthorTextStyle(((editorsData as any[]).find(e => e.name === author)?.username || author).toLowerCase())}>{author}</span> est bien l'auteur de ce contenu
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Title & Cover */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/5">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Titre du Récap <span className="text-neon-red">*</span></label>
                                <div className="relative group">
                                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-cyan transition-colors" />
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Ex: Récap : Tomorrowland 2024"
                                        className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-12 text-white placeholder-gray-600 focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setTitle(fixEncoding(title))}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-white/5 hover:bg-neon-cyan/20 text-gray-500 hover:text-neon-cyan rounded-lg transition-all"
                                        title="Réparer les caractères"
                                    >
                                        <Wand2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Image de couverture <span className="text-neon-red">*</span></label>
                                <div className="flex gap-2">
                                    <div className="relative group flex-1">
                                        <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-cyan transition-colors" />
                                        <input
                                            type="text"
                                            value={coverImage}
                                            onChange={(e) => setCoverImage(e.target.value)}
                                            placeholder="https://..."
                                            className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all"
                                            required
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setUploadTarget({ type: 'main', initialImage: coverImage });
                                            setShowUploadModal(true);
                                        }}
                                        className="px-6 py-4 bg-neon-red/20 border border-neon-red/50 text-neon-red rounded-xl font-bold uppercase tracking-wider hover:bg-neon-red/30 transition-all cursor-pointer flex flex-col items-center justify-center gap-1 min-w-[120px]"
                                    >
                                        Upload
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Date & Youtube */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Date de l'événement <span className="text-neon-red">*</span></label>
                                <div className="relative group">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-cyan transition-colors" />
                                    <input
                                        type="datetime-local"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400 uppercase tracking-wider flex items-center justify-between">
                                    <span>Vidéo de l'article</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Activer :</span>
                                        <button
                                            type="button"
                                            onClick={() => setShowVideo(!showVideo)}
                                            className={`w-10 h-5 rounded-full relative transition-colors ${showVideo ? 'bg-neon-red' : 'bg-gray-800'}`}
                                        >
                                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${showVideo ? 'right-1' : 'left-1'}`} />
                                        </button>
                                    </div>
                                </label>
                                <AnimatePresence>
                                    {showVideo && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="relative group"
                                        >
                                            <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-cyan transition-colors" />
                                            <input
                                                type="text"
                                                value={youtubeId}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    let id = val;
                                                    if (val.includes('youtube.com/watch?v=')) {
                                                        id = val.split('v=')[1].split('&')[0];
                                                    } else if (val.includes('youtu.be/')) {
                                                        id = val.split('youtu.be/')[1].split('?')[0];
                                                    } else if (val.includes('youtube.com/embed/')) {
                                                        id = val.split('youtube.com/embed/')[1].split('?')[0];
                                                    }
                                                    setYoutubeId(id);
                                                }}
                                                placeholder="ID ou URL YouTube"
                                                className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all"
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Festival, Location, Country & Year */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Nom du Festival <span className="text-neon-red">*</span></label>
                                <div className="relative group">
                                    <PartyPopper className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-cyan transition-colors" />
                                    <input
                                        type="text"
                                        value={festival}
                                        onChange={(e) => setFestival(e.target.value)}
                                        placeholder="Ex: Tomorrowland"
                                        className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Lieu <span className="text-neon-red">*</span></label>
                                <div className="relative group">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-cyan transition-colors" />
                                    <input
                                        type="text"
                                        value={locationInput}
                                        onChange={(e) => setLocationInput(e.target.value.toUpperCase())}
                                        onFocus={() => locationInput.length >= 1 && setShowSuggestions(true)}
                                        placeholder="Ex: Boom"
                                        required
                                        className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all"
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
                                                        onClick={() => {
                                                            setLocationInput(suggestion.city);
                                                            if (suggestion.country) setCountry(suggestion.country);
                                                            setShowSuggestions(false);
                                                        }}
                                                        className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 flex justify-between items-center group"
                                                    >
                                                        <span className="text-white font-medium group-hover:text-neon-cyan transition-colors">{suggestion.city}</span>
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
                                        placeholder="Ex: France"
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
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Année <span className="text-neon-red">*</span></label>
                                <div className="relative group">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-cyan transition-colors" />
                                    <input
                                        type="number"
                                        value={year}
                                        onChange={(e) => setYear(e.target.value)}
                                        placeholder="Ex: 2025"
                                        min="2000"
                                        max="2100"
                                        className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Festival Socials */}
                        <div className="pt-8 border-t border-white/10 mt-4">
                            <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-6 flex items-center justify-between">
                                <span className="flex items-center gap-2"><Link2 className="w-4 h-4 text-neon-cyan" /> Réseaux Sociaux du Festival (Optionnel)</span>
                                <label className="flex items-center gap-2 cursor-pointer bg-black/20 px-4 py-2 rounded-xl border border-white/10 shrink-0 hover:bg-white/5 transition-all">
                                    <input
                                        type="checkbox"
                                        checked={showFestivalSocials}
                                        onChange={(e) => setShowFestivalSocials(e.target.checked)}
                                        className="w-4 h-4 rounded bg-black/40 border-white/10 text-neon-cyan focus:ring-neon-cyan focus:ring-offset-0 focus:ring-1 cursor-pointer"
                                    />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300">Afficher la configuration</span>
                                </label>
                            </label>

                            {showFestivalSocials && (
                                <>
                                    <div className="mb-6">
                                        <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Nom du Festival (Label de suivi)</label>
                                        <input
                                            type="text"
                                            value={festivalNameLabel}
                                            onChange={(e) => setFestivalNameLabel(e.target.value)}
                                            className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white text-[11px] focus:border-neon-cyan outline-none transition-all"
                                            placeholder="Ex: Tomorrowland Winter"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {[
                                            { id: 'website', name: 'Site Web Festival', icon: Globe, color: 'text-white' },
                                            { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'text-pink-500' },
                                            { id: 'tiktok', name: 'TikTok', icon: TikTokIcon, color: 'text-white' },
                                            { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'text-red-500' },
                                            { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'text-blue-600' },
                                            { id: 'x', name: 'X / Twitter', icon: XIcon, color: 'text-white' }
                                        ].map((social) => (
                                            <div key={social.id}>
                                                <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">{social.name}</label>
                                                <div className="relative group">
                                                    <div className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${social.color} opacity-50 group-hover:opacity-100 transition-opacity`}>
                                                        <social.icon className="w-full h-full" />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={(festivalSocials as any)[social.id]}
                                                        onChange={(e) => setFestivalSocials({ ...festivalSocials, [social.id]: e.target.value })}
                                                        className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-[11px] focus:border-neon-cyan outline-none transition-all"
                                                        placeholder="URL Festival..."
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Artist Socials */}
                        <div className="pt-8 border-t border-white/10 mt-4">
                            <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-6 flex items-center justify-between">
                                <span className="flex items-center gap-2"><User className="w-4 h-4 text-neon-red" /> Réseaux Sociaux de l'Artiste (Optionnel)</span>
                                <label className="flex items-center gap-2 cursor-pointer bg-black/20 px-4 py-2 rounded-xl border border-white/10 shrink-0 hover:bg-white/5 transition-all">
                                    <input
                                        type="checkbox"
                                        checked={showArtistSocials}
                                        onChange={(e) => setShowArtistSocials(e.target.checked)}
                                        className="w-4 h-4 rounded bg-black/40 border-white/10 text-neon-cyan focus:ring-neon-cyan focus:ring-offset-0 focus:ring-1 cursor-pointer"
                                    />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300">Afficher la configuration</span>
                                </label>
                            </label>

                            {showArtistSocials && (
                                <>
                                    <div className="mb-6">
                                        <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Nom de l'Artiste (Label de suivi)</label>
                                        <input
                                            type="text"
                                            value={artistNameLabel}
                                            onChange={(e) => setArtistNameLabel(e.target.value)}
                                            className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white text-[11px] focus:border-neon-red outline-none transition-all"
                                            placeholder="Ex: Martin Garrix"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {[
                                            { id: 'website', name: 'Site Web Artiste', icon: Globe, color: 'text-white' },
                                            { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'text-pink-500' },
                                            { id: 'tiktok', name: 'TikTok', icon: TikTokIcon, color: 'text-white' },
                                            { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'text-red-500' },
                                            { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'text-blue-600' },
                                            { id: 'x', name: 'X / Twitter', icon: XIcon, color: 'text-white' },
                                            { id: 'spotify', name: 'Spotify', icon: SpotifyIcon, color: 'text-green-500' },
                                            { id: 'soundcloud', name: 'SoundCloud', icon: SoundCloudIcon, color: 'text-orange-500' },
                                            { id: 'beatport', name: 'Beatport', icon: BeatportIcon, color: 'text-green-400' }
                                        ].map((social) => (
                                            <div key={social.id}>
                                                <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">{social.name}</label>
                                                <div className="relative group">
                                                    <div className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${social.color} opacity-50 group-hover:opacity-100 transition-opacity`}>
                                                        <social.icon className="w-full h-full" />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={(artistSocials as any)[social.id]}
                                                        onChange={(e) => setArtistSocials({ ...artistSocials, [social.id]: e.target.value })}
                                                        className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-[11px] focus:border-neon-red outline-none transition-all"
                                                        placeholder="URL Artiste..."
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>





                        {/* WIDGET EDITOR SECTION */}
                        <div className="pt-8 border-t border-white/10">
                            <div className="flex justify-between items-center mb-6">
                                <label className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-neon-cyan" /> WIDGETS DE CONTENU
                                </label>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const id = Math.random().toString(36).substr(2, 9);
                                            setWidgets([...widgets, { id, content: '<h2 class="premium-section-title">MON TITRE ICI</h2>' }]);
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-neon-red/10 border border-neon-red/30 text-neon-red rounded-full hover:bg-neon-red/20 transition-all font-bold uppercase tracking-widest text-[10px]"
                                    >
                                        <Plus className="w-3 h-3" /> Bloc Titre
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => addWidget()}
                                        className="flex items-center gap-2 px-4 py-2 bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan rounded-full hover:bg-neon-cyan/20 transition-all font-bold uppercase tracking-widest text-[10px]"
                                    >
                                        <Plus className="w-3 h-3" /> Bloc Texte
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setUploadTarget({ type: 'widget', initialImage: '' });
                                            setShowUploadModal(true);
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-neon-red/20 border border-neon-red/30 text-neon-red rounded-full hover:bg-neon-red/30 transition-all font-bold uppercase tracking-widest text-[10px]"
                                    >
                                        <Upload className="w-3 h-3" /> Upload
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMediaModal({ show: true, type: 'video', url: '', urls: '' })}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-600/20 border border-red-600/30 text-red-600 rounded-full hover:bg-red-600/30 transition-all font-bold uppercase tracking-widest text-[10px]"
                                    >
                                        <Youtube className="w-3 h-3" /> Vidéo
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDuoModal({ show: true, url1: '', url2: '', widgetIndex: undefined, widgetId: undefined, aspectRatio: '3/4' })}
                                        className="flex items-center gap-2 px-4 py-2 bg-neon-purple/20 border border-neon-purple/30 text-neon-purple rounded-full hover:bg-neon-purple/30 transition-all font-bold uppercase tracking-widest text-[10px]"
                                    >
                                        <Columns className="w-3 h-3" /> Duo Photos
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMediaModal({ show: true, type: 'gallery', url: '', urls: '' })}
                                        className="flex items-center gap-2 px-4 py-2 bg-neon-pink/10 border border-neon-pink/30 text-neon-pink rounded-full hover:bg-neon-pink/20 transition-all font-bold uppercase tracking-widest text-[10px]"
                                    >
                                        <Plus className="w-3 h-3" /> Galerie
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {widgets.map((widget, index) => (
                                    <div key={widget.id} className="space-y-4">
                                        <div className="relative group bg-white/5 border border-white/10 rounded-2xl p-6 transition-all hover:border-white/20">
                                            <div className="flex justify-between items-center mb-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-black text-gray-400">
                                                        {index + 1}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                                        {widget.content.startsWith('<h2') ? 'Bloc Titre' :
                                                            widget.content.includes('duo-photos-premium') ? 'Bloc Duo Photos' :
                                                                widget.content.includes('image-premium-wrapper') ? 'Bloc Image' :
                                                                    widget.content.includes('gallery-premium-grid') ? 'Bloc Galerie' : 'Bloc Texte'}
                                                    </span>

                                                    {/* Movement Arrows */}
                                                    <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            type="button"
                                                            onClick={() => moveWidgetUp(index)}
                                                            className="p-1.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all disabled:opacity-20"
                                                            disabled={index === 0}
                                                            title="Monter"
                                                        >
                                                            <ChevronUp className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => moveWidgetDown(index)}
                                                            className="p-1.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all disabled:opacity-20"
                                                            disabled={index === widgets.length - 1}
                                                            title="Descendre"
                                                        >
                                                            <ChevronDown className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onMouseDown={e => e.preventDefault()}
                                                        onClick={() => insertLinkToActiveWidget(widget.id)}
                                                        className="p-2 text-gray-500 hover:text-neon-cyan hover:bg-neon-cyan/10 rounded-lg transition-colors flex items-center gap-2 text-[10px] font-bold uppercase"
                                                        title="Ajouter un lien"
                                                    >
                                                        <Link2 className="w-4 h-4" /> Lien
                                                    </button>
                                                    {(!widget.content.includes('image-premium-wrapper') && !widget.content.includes('gallery-premium-grid') && !widget.content.includes('youtube-player-widget')) && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onMouseDown={e => e.preventDefault()} onClick={() => toggleWidgetStyle(widget.id, 'text-left')}
                                                                className={`p-2 rounded-lg transition-colors flex items-center justify-center ${widget.content.includes('text-left') ? 'text-neon-cyan bg-neon-cyan/10' : 'text-gray-500 hover:text-neon-cyan hover:bg-neon-cyan/10'}`}
                                                                title="Aligner à gauche"
                                                            >
                                                                <AlignLeft className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onMouseDown={e => e.preventDefault()} onClick={() => toggleWidgetStyle(widget.id, 'text-center')}
                                                                className={`p-2 rounded-lg transition-colors flex items-center justify-center ${widget.content.includes('text-center') ? 'text-neon-cyan bg-neon-cyan/10' : 'text-gray-500 hover:text-neon-cyan hover:bg-neon-cyan/10'}`}
                                                                title="Centrer"
                                                            >
                                                                <AlignCenter className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onMouseDown={e => e.preventDefault()} onClick={() => toggleWidgetStyle(widget.id, 'text-right')}
                                                                className={`p-2 rounded-lg transition-colors flex items-center justify-center ${widget.content.includes('text-right') ? 'text-neon-cyan bg-neon-cyan/10' : 'text-gray-500 hover:text-neon-cyan hover:bg-neon-cyan/10'}`}
                                                                title="Aligner à droite"
                                                            >
                                                                <AlignRight className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onMouseDown={e => e.preventDefault()} onClick={() => toggleWidgetStyle(widget.id, 'text-xl')}
                                                                className={`p-2 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold uppercase ${widget.content.includes('text-xl') ? 'text-neon-cyan bg-neon-cyan/10' : 'text-gray-500 hover:text-neon-cyan hover:bg-neon-cyan/10'}`}
                                                                title="Texte XL"
                                                            >
                                                                <CaseUpper className="w-3.5 h-3.5 translate-y-[1px]" /> XL
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onMouseDown={e => e.preventDefault()} onClick={() => toggleWidgetStyle(widget.id, 'text-2xl')}
                                                                className={`p-2 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold uppercase ${widget.content.includes('text-2xl') ? 'text-neon-cyan bg-neon-cyan/10' : 'text-gray-500 hover:text-neon-cyan hover:bg-neon-cyan/10'}`}
                                                                title="Texte 2XL"
                                                            >
                                                                <CaseUpper className="w-4 h-4" /> 2XL
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onMouseDown={e => e.preventDefault()} onClick={() => toggleWidgetStyle(widget.id, 'text-4xl')}
                                                                className={`p-2 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold uppercase ${widget.content.includes('text-4xl') ? 'text-neon-cyan bg-neon-cyan/10' : 'text-gray-500 hover:text-neon-cyan hover:bg-neon-cyan/10'}`}
                                                                title="Texte 4XL"
                                                            >
                                                                <CaseUpper className="w-5 h-5" /> 4XL
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onMouseDown={e => e.preventDefault()} onClick={() => toggleWidgetStyle(widget.id, 'bg-white')}
                                                                className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-[10px] font-bold uppercase ${widget.content.includes('bg-white') ? 'text-neon-cyan bg-neon-cyan/10' : 'text-gray-500 hover:text-neon-cyan hover:bg-neon-cyan/10'}`}
                                                                title="Fond Blanc"
                                                            >
                                                                <Palette className="w-4 h-4" /> Fond
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onMouseDown={e => e.preventDefault()} onClick={() => toggleWidgetStyle(widget.id, 'uppercase')}
                                                                className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-[10px] font-bold uppercase ${widget.content.includes('uppercase') ? 'text-neon-cyan bg-neon-cyan/10' : 'text-gray-500 hover:text-neon-cyan hover:bg-neon-cyan/10'}`}
                                                                title="Tout en Majuscules"
                                                            >
                                                                <CaseUpper className="w-4 h-4" /> MAJ
                                                            </button>
                                                            <div className="flex bg-black/40 rounded-lg border border-white/5 p-0.5">
                                                                <button
                                                                    type="button"
                                                                    onMouseDown={e => e.preventDefault()} onClick={() => toggleWidgetStyle(widget.id, 'text-sm')}
                                                                    className={`px-2 py-1 rounded transition-colors text-[10px] font-bold ${widget.content.includes('text-sm') ? 'text-neon-cyan bg-neon-cyan/10' : 'text-gray-500 hover:text-white'}`}
                                                                    title="Petit"
                                                                >
                                                                    S
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onMouseDown={e => e.preventDefault()} onClick={() => toggleWidgetStyle(widget.id, 'text-2xl')}
                                                                    className={`px-2 py-1 rounded transition-colors text-[10px] font-bold ${widget.content.includes('text-2xl') ? 'text-neon-cyan bg-neon-cyan/10' : 'text-gray-500 hover:text-white'}`}
                                                                    title="Grand"
                                                                >
                                                                    L
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onMouseDown={e => e.preventDefault()} onClick={() => toggleWidgetStyle(widget.id, 'text-5xl')}
                                                                    className={`px-2 py-1 rounded transition-colors text-[10px] font-bold ${widget.content.includes('text-5xl') ? 'text-neon-cyan bg-neon-cyan/10' : 'text-gray-500 hover:text-white'}`}
                                                                    title="Énorme"
                                                                >
                                                                    XL
                                                                </button>
                                                            </div>

                                                            <div className="flex bg-black/40 rounded-lg border border-white/5 p-1">
                                                                <button
                                                                    type="button"
                                                                    onMouseDown={e => e.preventDefault()}
                                                                    onClick={() => applyFormat('bold')}
                                                                    className="p-1.5 text-gray-500 hover:text-white"
                                                                    title="Gras"
                                                                >
                                                                    <Bold className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onMouseDown={e => e.preventDefault()}
                                                                    onClick={() => applyFormat('italic')}
                                                                    className="p-1.5 text-gray-500 hover:text-white"
                                                                    title="Italique"
                                                                >
                                                                    <Italic className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onMouseDown={e => e.preventDefault()}
                                                                    onClick={() => applyFormat('underline')}
                                                                    className="p-1.5 text-gray-500 hover:text-white"
                                                                    title="Souligner"
                                                                >
                                                                    <UnderlineIcon className="w-4 h-4" />
                                                                </button>
                                                            </div>

                                                            <div className="flex flex-wrap bg-black/40 rounded-lg border border-white/5 p-1 gap-1 max-w-[160px]">
                                                                {EDITOR_COLORS.map(color => (
                                                                    <button
                                                                        key={color}
                                                                        type="button"
                                                                        onMouseDown={e => e.preventDefault()}
                                                                        onClick={() => applyColorToSelection(widget.id, color)}
                                                                        className="w-3 h-3 rounded-full border border-white/10 hover:scale-125 transition-transform"
                                                                        style={{ backgroundColor: color }}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const activeEl = document.activeElement;
                                                            const isVisualEditor = activeEl && activeEl.classList.contains('visual-editor-content');

                                                            if (isVisualEditor) {
                                                                document.execCommand('insertUnorderedList', false);
                                                                return;
                                                            }

                                                            const ta = activeEl as HTMLTextAreaElement;
                                                            const isCorrectTextarea = ta && ta.tagName === 'TEXTAREA';
                                                            if (!isCorrectTextarea) return;

                                                            const start = ta.selectionStart;
                                                            const end = ta.selectionEnd;
                                                            const val = ta.value;
                                                            const bullet = '• ';

                                                            setWidgets(widgets.map(w => {
                                                                if (w.id === widget.id) {
                                                                    const before = val.substring(0, start);
                                                                    const after = val.substring(end);
                                                                    return { ...w, content: before + bullet + after };
                                                                }
                                                                return w;
                                                            }));
                                                        }}
                                                        className="p-2 text-gray-500 hover:text-neon-red hover:bg-neon-red/10 rounded-lg transition-colors flex items-center gap-2 text-[10px] font-bold uppercase"
                                                        title="Ajouter une puce"
                                                    >
                                                        <List className="w-4 h-4" /> Puce
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (widget.content.includes('duo-photos-premium')) {
                                                                const extracted = extractDuoUrls(widget.content);
                                                                setDuoModal({
                                                                    show: true,
                                                                    url1: extracted.urls[0] || '',
                                                                    url2: extracted.urls[1] || '',
                                                                    widgetIndex: undefined,
                                                                    widgetId: widget.id,
                                                                    aspectRatio: extracted.ratio
                                                                });
                                                            } else if (widget.content.includes('video-group-premium')) {
                                                                const extracted = extractVideoUrls(widget.content);
                                                                setVideoGroupModal({
                                                                    show: true,
                                                                    urls: [...extracted.urls, '', ''].slice(0, 3),
                                                                    count: extracted.count,
                                                                    widgetId: widget.id
                                                                });
                                                            } else if (widget.content.includes('youtube-player-widget')) {
                                                                const val = prompt('Nouvelle URL YouTube ou ID');
                                                                if (!val) return;
                                                                let id = val;
                                                                if (val.includes('youtube.com/watch?v=')) {
                                                                    id = val.split('v=')[1].split('&')[0];
                                                                } else if (val.includes('youtu.be/')) {
                                                                    id = val.split('youtu.be/')[1];
                                                                }
                                                                const videoWidget = `<div class="youtube-player-widget w-full relative aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/5 my-12">\n  <iframe src="https://www.youtube.com/embed/${id}" className="absolute inset-0 w-full h-full" allowFullScreen></iframe>\n</div>`;
                                                                updateWidget(widget.id, videoWidget);
                                                            } else if (widget.content.includes('image-premium-wrapper')) {
                                                                const { url, ratio } = extractSingleImageUrlAndRatio(widget.content);
                                                                setMediaModal({
                                                                    show: true,
                                                                    type: 'image',
                                                                    url: url,
                                                                    urls: '',
                                                                    aspectRatio: ratio,
                                                                    widgetId: widget.id
                                                                });
                                                            }
                                                        }}
                                                        className="p-2 text-gray-500 hover:text-neon-cyan hover:bg-neon-cyan/10 rounded-lg transition-colors"
                                                        title="Éditer le widget"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => fixWidgetEncoding(widget.id)}
                                                        className="p-2 text-gray-500 hover:text-neon-cyan hover:bg-neon-cyan/10 rounded-lg transition-colors"
                                                        title="Réparer les caractères"
                                                    >
                                                        <Wand2 className="w-4 h-4" />
                                                    </button>
                                                    {widgets.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeWidget(widget.id)}
                                                            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Le rendu final est désormais directement éditable au-dessus (WYSIWYG) */}

                                            {/* Title Block Editor */}
                                            {
                                                widget.content.startsWith('<h2 class="premium-section-title">') && widget.content.endsWith('</h2>') ? (
                                                    <div className="bg-black/60 border-l-4 border-neon-red pl-4 py-4 rounded-r-xl">
                                                        <input
                                                            type="text"
                                                            value={widget.content.replace('<h2 class="premium-section-title">', '').replace('</h2>', '')}
                                                            onChange={(e) => updateWidget(widget.id, `<h2 class="premium-section-title">${e.target.value}</h2>`)}
                                                            className="w-full bg-transparent text-xl font-display font-black text-white uppercase italic tracking-tighter border-none focus:ring-0 placeholder-gray-700"
                                                            placeholder="VOTRE TITRE DE SECTION..."
                                                        />
                                                    </div>
                                                ) : (
                                                    !widget.content.includes('youtube-player-widget') &&
                                                        !widget.content.includes('image-premium-wrapper') &&
                                                        !widget.content.includes('gallery-premium-grid') &&
                                                        !widget.content.includes('duo-photos-premium') ? (
                                                        <div className="admin-editor-container bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                                                            <VisualEditor
                                                                content={widget.content}
                                                                onChange={(html) => updateWidget(widget.id, html)}
                                                                className="visual-editor-content p-8 min-h-[150px] text-white outline-none focus:bg-white/[0.04] transition-all article-body-premium"
                                                                widgetId={widget.id}
                                                                onFocus={(e) => {
                                                                    if (e.currentTarget.innerHTML === '<br>') e.currentTarget.innerHTML = '';
                                                                }}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/40 p-4 shadow-xl">
                                                            <div className="article-body-premium transform scale-[0.8] origin-top opacity-90 pointer-events-none mb-[-20%]" dangerouslySetInnerHTML={{ __html: standardizeContent(widget.content) }} />
                                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                                                                <div className="bg-white/10 backdrop-blur-md rounded-full p-4 border border-white/20">
                                                                    <ImageIcon className="w-8 h-8 text-white" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                )
                                            }
                                        </div>

                                        {/* Add Button BETWEEN widgets */}
                                        <div className="flex items-center gap-4 py-2 group/adder">
                                            <div className="h-px flex-1 bg-white/10 group-hover/adder:bg-neon-cyan/30 transition-colors" />
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => addWidget(index, '<h2 class="premium-section-title">NOUVEAU TITRE</h2>')}
                                                    className="w-8 h-8 rounded-full bg-neon-red/10 border border-neon-red/30 text-neon-red flex items-center justify-center hover:bg-neon-red/20 transition-all"
                                                    title="Ajouter un titre ici"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => addWidget(index)}
                                                    className="w-8 h-8 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan flex items-center justify-center hover:bg-neon-cyan/20 transition-all"
                                                    title="Ajouter du texte ici"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setUploadTarget({ type: 'widget', index, initialImage: '' });
                                                        setShowUploadModal(true);
                                                    }}
                                                    className="w-8 h-8 rounded-full bg-neon-red/10 border border-neon-red/30 text-neon-red flex items-center justify-center hover:bg-neon-red/20 transition-all font-bold uppercase tracking-widest text-[10px]"
                                                    title="Verser une image ici"
                                                >
                                                    <Upload className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setMediaModal({ show: true, type: 'video', url: '', urls: '', widgetIndex: index } as any)}
                                                    className="w-8 h-8 rounded-full bg-red-600/10 border border-red-600/30 text-red-600 flex items-center justify-center hover:bg-red-600/20 transition-all"
                                                    title="Ajouter une vidéo ici"
                                                >
                                                    <Youtube className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setVideoGroupModal({ show: true, urls: ['', '', ''], count: 2, widgetIndex: index })}
                                                    className="w-8 h-8 rounded-full bg-red-600/10 border border-red-600/30 text-red-600 flex items-center justify-center hover:bg-red-600/20 transition-all font-bold text-[10px]"
                                                    title="Ajouter un groupe de vidéos (1, 2 ou 3 en ligne)"
                                                >
                                                    3x
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setDuoModal({ show: true, url1: '', url2: '', widgetIndex: index, widgetId: undefined, aspectRatio: '3/4' })}
                                                    className="w-8 h-8 rounded-full bg-neon-purple/10 border border-neon-purple/30 text-neon-purple flex items-center justify-center hover:bg-neon-purple/20 transition-all font-bold uppercase tracking-widest text-[10px]"
                                                    title="Ajouter un Duo Photo ici"
                                                >
                                                    <Columns className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="h-px flex-1 bg-white/10 group-hover/adder:bg-neon-cyan/30 transition-colors" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* LIVE PREVIEW SECTION */}
                        <div className="pt-12 border-t border-white/10 mt-12 bg-black/20 rounded-[40px] p-2 sm:p-4 border-2 border-dashed border-white/5">
                            <div className="flex items-center justify-between mb-8 px-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-neon-cyan/10 flex items-center justify-center border border-neon-cyan/30">
                                        <Eye className="w-5 h-5 text-neon-cyan" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-display font-black text-white uppercase italic tracking-tighter">Aperçu <span className="text-neon-cyan">Final</span></h3>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Rendu exact tel qu'affiché sur le site</p>
                                    </div>
                                </div>
                                <div className="px-4 py-1.5 bg-neon-cyan/10 border border-neon-cyan/20 rounded-full">
                                    <span className="text-[9px] font-black text-neon-cyan uppercase tracking-widest animate-pulse">Mode Visualisation</span>
                                </div>
                            </div>

                            <div className="bg-black border border-white/10 rounded-[32px] p-8 md:p-12 article-body-premium shadow-[0_0_50px_rgba(0,0,0,0.5)] min-h-[400px]">
                                {/* Header Preview */}
                                <div className="mb-12 border-b border-white/10 pb-12">
                                    <div className="flex flex-wrap gap-3 mb-8">
                                        <span className="px-4 py-1.5 bg-neon-cyan/10 border border-neon-cyan/20 rounded-full text-neon-cyan font-bold text-[9px] uppercase tracking-widest">
                                            Recaps
                                        </span>
                                        <span className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-white/70 font-bold text-[9px] flex items-center gap-2 uppercase tracking-widest">
                                            <Clock className="w-3 h-3" />
                                            {date}
                                        </span>
                                        <span className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-white/70 font-bold text-[9px] flex items-center gap-2 uppercase tracking-widest">
                                            <User className="w-3 h-3 text-neon-red" />
                                            {author || 'Alex'}
                                        </span>
                                        {festival && (
                                            <span className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-white/70 font-bold text-[9px] flex items-center gap-2 uppercase tracking-widest">
                                                <PartyPopper className="w-3 h-3 text-neon-cyan" />
                                                {festival}
                                            </span>
                                        )}
                                        {locationInput && (
                                            <span className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-white/70 font-bold text-[9px] flex items-center gap-2 uppercase tracking-widest">
                                                <MapPin className="w-3 h-3 text-neon-purple" />
                                                {locationInput}{country ? `, ${country}` : ''}
                                            </span>
                                        )}
                                    </div>

                                    <h1 className="text-4xl md:text-6xl font-display font-black text-white uppercase italic tracking-tighter leading-[0.9] mb-8">
                                        {title || "TITRE DU RÉCAP"}
                                    </h1>


                                </div>
                                {
                                    widgets.map(w => (
                                        <div key={w.id} className="article-section">
                                            <div dangerouslySetInnerHTML={{ __html: standardizeContent(w.content) }} />
                                        </div>
                                    ))
                                }
                                {youtubeId && showVideo && (
                                    <div className="mt-16 mb-16">
                                        <h3 className="text-3xl font-display font-black text-white mb-10 uppercase italic flex items-center gap-4 group">
                                            <div className="w-12 h-12 rounded-2xl bg-neon-red/10 flex items-center justify-center border border-neon-red/30">
                                                <div className="w-6 h-6 text-neon-red fill-neon-red" style={{
                                                    width: '0',
                                                    height: '0',
                                                    borderTop: '8px solid transparent',
                                                    borderBottom: '8px solid transparent',
                                                    borderLeft: '12px solid currentColor',
                                                    marginLeft: '4px'
                                                }} />
                                            </div>
                                            <div className="flex flex-col text-left">
                                                <span className="text-neon-red text-[10px] tracking-[0.4em] font-black mb-1 italic">À NE PAS MANQUER</span>
                                                LA VIDÉO DU RÉCAP
                                            </div>
                                        </h3>
                                        <div className="relative aspect-video rounded-[2.5rem] overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(255,0,51,0.15)] group">
                                            <iframe
                                                src={`https://www.youtube.com/embed/${youtubeId}`}
                                                className="absolute top-0 left-0 w-full h-full"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-6 flex flex-col gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={(e) => handleSubmit(e, true)}
                                    disabled={status === 'loading'}
                                    className={`py-4 rounded-xl font-bold uppercase tracking-widest transition-all ${status === 'loading'
                                        ? 'bg-gray-600 cursor-not-allowed'
                                        : 'bg-neon-red hover:shadow-[0_0_20px_rgba(255,18,65,0.4)] hover:scale-[1.02]'
                                        } text-white flex items-center justify-center gap-2`}
                                >
                                    <Send className="w-5 h-5" />
                                    {status === 'loading' ? 'Publication...' : (isEditing ? 'Mettre à jour le Récap' : 'Publier le Récap')}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setShowScheduleModal(true)}
                                    disabled={status === 'loading'}
                                    className={`py-4 rounded-xl font-bold uppercase tracking-widest transition-all ${status === 'loading'
                                        ? 'bg-gray-600 cursor-not-allowed'
                                        : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:scale-[1.02]'
                                        } text-white flex items-center justify-center gap-2`}
                                >
                                    <Calendar className="w-5 h-5" />
                                    {status === 'loading' ? 'Programmation...' : 'Programmer le Récap'}
                                </button>
                            </div>

                            {status && status !== 'loading' && message && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`p-4 rounded-xl text-center font-bold uppercase tracking-widest text-[10px] border ${status === 'success' ? 'bg-green-500/10 border-green-500/50 text-green-500' : 'bg-red-500/10 border-red-500/50 text-red-500'
                                        }`}
                                >
                                    {message}
                                </motion.div>
                            )}
                        </div>
                    </form>
                </div >
            </div >
            <style>{`
                .admin-editor-container.w-md-editor {
                    border: 1px solid rgba(255, 255, 255, 0.1)!important;
                    background: #000!important;
                    border-radius: 8px;
                }
                .admin-editor-container.w-md-editor-toolbar {
                    background: #000!important;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05)!important;
                }
                .admin-editor-container.w-md-editor-content {
                    background: #000!important;
                }
                .article-body-premium img:not(.absolute):not([class*="aspect-"]) {
                    display: block;
                    width: 100% !important;
                    height: auto!important;
                    margin: 2rem auto!important;
                    border-radius: 16px!important;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                }
                .article-body-premium.grid img,
                .article-body-premium[class*="aspect-"] img {
                    width: 100% !important;
                    height: 100% !important;
                    object-fit: cover!important;
                    object-position: center!important;
                    margin: 0!important;
                    border-radius: inherit!important;
                }
                /* Editor Preview Overrides */
                .editor-preview-content .youtube-player-wrapper {
                    width: 355px !important; 
                    height: 200px !important;
                    margin: 0 !important;
                }
                .visual-editor-content {
                    transition: all 0.2s ease;
                }
                .visual-editor-content:focus {
                    background: rgba(255, 255, 255, 0.02);
                }
                .visual-editor-content[contenteditable=true]:empty:before {
                    content: "Commencez à écrire...";
                    color: rgba(255, 255, 255, 0.2);
                    pointer-events: none;
                    display: block;
                }
                .visual-editor-content a {
                    color: #00fff3;
                    text-decoration: underline;
                    pointer-events: none;
                }
            `}</style>
            {/* Media Choice Modal (Image/Gallery/Video) */}
            <AnimatePresence>
                {mediaModal.show && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMediaModal({ ...mediaModal, show: false })}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-sm bg-dark-bg border border-white/10 rounded-3xl p-8 shadow-2xl"
                        >
                            <button
                                onClick={() => setMediaModal({ ...mediaModal, show: false })}
                                className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="w-12 h-12 bg-neon-red/10 rounded-2xl flex items-center justify-center border border-neon-red/30 mb-6">
                                {mediaModal.type === 'video' ? <Youtube className="w-6 h-6 text-neon-red" /> : <ImageIcon className="w-6 h-6 text-neon-red" />}
                            </div>

                            <h3 className="text-xl font-display font-black text-white uppercase italic mb-6">
                                {mediaModal.type === 'image' ? 'Ajouter une photo' : mediaModal.type === 'video' ? 'Ajouter une vidéo' : 'Ajouter une galerie'}
                            </h3>

                            <div className="space-y-4">
                                {mediaModal.type === 'gallery' ? (
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 text-center">URLs des images (une par ligne)</label>
                                        <textarea
                                            value={mediaModal.urls}
                                            onChange={e => setMediaModal({ ...mediaModal, urls: e.target.value })}
                                            className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-neon-red transition-all resize-none text-xs"
                                            placeholder="https://image1.jpg&#10;https://image2.jpg"
                                            autoFocus
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 text-center">URL {mediaModal.type === 'video' ? 'YouTube / ID' : 'de l\'image'}</label>
                                        <div className="relative group/input">
                                            <input
                                                type="text"
                                                value={mediaModal.url}
                                                onChange={e => setMediaModal({ ...mediaModal, url: e.target.value })}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 pr-10 text-white outline-none focus:border-neon-red transition-all text-xs"
                                                placeholder={mediaModal.type === 'video' ? "Ex: https://youtube.com/watch?v=..." : "https://site.com/image.jpg"}
                                                autoFocus
                                            />
                                            {mediaModal.url && (
                                                <button
                                                    type="button"
                                                    onClick={() => setMediaModal({ ...mediaModal, url: '' })}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-red-500 transition-colors"
                                                    title="Effacer"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {mediaModal.type === 'image' && (
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 text-center">Format de l'image</label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {['auto', '1/1', '3/4', '16/9'].map(ratio => (
                                                <button
                                                    key={ratio}
                                                    type="button"
                                                    onClick={() => setMediaModal({ ...mediaModal, aspectRatio: ratio })}
                                                    className={`py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${mediaModal.aspectRatio === ratio ? 'bg-neon-red text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                                                >
                                                    {ratio === 'auto' ? 'Orig' : ratio}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => {
                                            setUploadTarget({
                                                type: mediaModal.widgetId ? 'widget-edit' : 'widget',
                                                widgetId: mediaModal.widgetId,
                                                initialImage: mediaModal.url
                                            });
                                            setShowUploadModal(true);
                                        }}
                                        className="flex-1 flex flex-col items-center gap-2 p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-neon-red/10 hover:border-neon-red/50 transition-all group"
                                    >
                                        <Upload className="w-5 h-5 text-neon-red group-hover:scale-110 transition-transform" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white">Upload</span>
                                    </button>

                                    <button
                                        onClick={() => handleMediaConfirm((mediaModal as any).widgetIndex)}
                                        className="flex-1 flex flex-col items-center gap-2 p-4 bg-neon-red text-white border border-neon-red rounded-2xl hover:bg-neon-red/80 transition-all font-bold group"
                                    >
                                        <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Confirmer</span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Link Insertion Modal */}
            <AnimatePresence>
                {linkModal.show && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setLinkModal({ ...linkModal, show: false, savedRange: null })}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-sm bg-dark-bg border border-white/10 rounded-3xl p-8 shadow-2xl"
                        >
                            <button
                                onClick={() => setLinkModal({ ...linkModal, show: false, savedRange: null })}
                                className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="w-12 h-12 bg-neon-cyan/10 rounded-2xl flex items-center justify-center border border-neon-cyan/30 mb-6">
                                <Link2 className="w-6 h-6 text-neon-cyan" />
                            </div>

                            <h3 className="text-xl font-display font-black text-white uppercase italic mb-6">
                                Insérer un lien
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Texte à afficher</label>
                                    <input
                                        type="text"
                                        value={linkModal.text}
                                        onChange={(e) => setLinkModal({ ...linkModal, text: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-neon-cyan outline-none"
                                        placeholder="Ex: Cliquez ici"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">URL du lien</label>
                                    <input
                                        type="text"
                                        value={linkModal.url}
                                        onChange={(e) => setLinkModal({ ...linkModal, url: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-neon-cyan outline-none"
                                        placeholder="https://..."
                                        autoFocus
                                    />
                                </div>

                                <button
                                    onClick={confirmLinkInsertion}
                                    disabled={!linkModal.url}
                                    className="w-full py-4 bg-neon-cyan text-black rounded-xl font-bold uppercase tracking-widest hover:bg-neon-cyan/80 transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Confirmer le lien
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Upload Modal */}
             <ImageUploadModal
                 isOpen={showUploadModal}
                 onClose={() => setShowUploadModal(false)}
                 allowMultiple={uploadTarget.type !== 'main' && uploadTarget.type !== 'duo1' && uploadTarget.type !== 'duo2' && uploadTarget.type !== 'widget-edit'}
                 watermark={uploadTarget.type !== 'main'}
                 initialImage={uploadTarget.initialImage}
                 onUploadSuccess={(urlOrUrls: string | string[]) => {
                    const urls = Array.isArray(urlOrUrls) ? urlOrUrls : [urlOrUrls];
                    
                    urls.forEach((url, i) => {
                        const isVideo = url.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/) || url.includes('/video/upload/');
                        const mediaTag = isVideo
                            ? `<video src="${url}" autoplay loop muted playsinline class="w-full h-full object-cover"></video>`
                            : `<img src="${url}" alt="Image" class="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700" />`;

                        if (uploadTarget.type === 'main') {
                            setCoverImage(url);
                        } else if (uploadTarget.type === 'duo1' as any) {
                            setDuoModal(prev => ({ ...prev, url1: url }));
                        } else if (uploadTarget.type === 'duo2' as any) {
                            setDuoModal(prev => ({ ...prev, url2: url }));
                        } else if (uploadTarget.type === 'widget-edit') {
                            const imgWidget = `<div class="image-premium-wrapper w-full relative rounded-3xl overflow-hidden shadow-2xl border border-white/5 my-12 group">\n  ${mediaTag}\n</div>`;
                            updateWidget(uploadTarget.widgetId!, imgWidget);
                            setMediaModal(prev => ({ ...prev, show: false }));
                        } else {
                            // Create a new image widget
                            const imgWidget = `<div class="image-premium-wrapper w-full relative rounded-3xl overflow-hidden shadow-2xl border border-white/5 my-12 group">\n  ${mediaTag}\n</div>`;
                            // If multiple, add them one after another
                            addWidget(uploadTarget.index !== undefined ? uploadTarget.index + i : undefined, imgWidget);
                        }
                    });
                 }}
                 onClear={() => {
                     if (uploadTarget.type === 'main') {
                         setCoverImage('');
                     } else if (uploadTarget.type === 'duo1' as any) {
                         setDuoModal(prev => ({ ...prev, url1: '' }));
                     } else if (uploadTarget.type === 'duo2' as any) {
                         setDuoModal(prev => ({ ...prev, url2: '' }));
                     } else if (uploadTarget.type === 'widget-edit') {
                         updateWidget(uploadTarget.widgetId!, '');
                         setMediaModal(prev => ({ ...prev, show: false }));
                     }
                     setShowUploadModal(false);
                 }}
                 accentColor="neon-red"
             />

            {/* Duo Photos Modal */}
            <AnimatePresence>
                {duoModal.show && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-dark-bg border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl relative"
                        >
                            <button
                                onClick={() => setDuoModal({ show: false, url1: '', url2: '', widgetIndex: undefined, widgetId: undefined, aspectRatio: '3/4' })}
                                className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <h3 className="text-xl font-display font-black text-white uppercase italic mb-6">Ajouter Duo Photos</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Image Gauche (URL)</label>
                                    <div className="flex gap-2">
                                        <div className="flex-1 relative group/input">
                                            <input
                                                type="text"
                                                value={duoModal.url1}
                                                onChange={e => setDuoModal({ ...duoModal, url1: e.target.value })}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 pr-10 text-white outline-none focus:border-neon-purple transition-all"
                                                placeholder="https://..."
                                                autoFocus
                                            />
                                            {duoModal.url1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setDuoModal({ ...duoModal, url1: '' })}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-red-500 transition-colors"
                                                    title="Effacer"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setUploadTarget({ type: 'duo1' as any, initialImage: duoModal.url1 });
                                                setShowUploadModal(true);
                                            }}
                                            className="px-4 bg-neon-purple/20 border border-neon-purple/30 text-neon-purple rounded-xl font-bold text-[10px] uppercase hover:bg-neon-purple/30 transition-all font-black"
                                        >
                                            Upload
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Image Droite (URL)</label>
                                    <div className="flex gap-2">
                                        <div className="flex-1 relative group/input">
                                            <input
                                                type="text"
                                                value={duoModal.url2}
                                                onChange={e => setDuoModal({ ...duoModal, url2: e.target.value })}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 pr-10 text-white outline-none focus:border-neon-purple transition-all"
                                                placeholder="https://..."
                                            />
                                            {duoModal.url2 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setDuoModal({ ...duoModal, url2: '' })}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-red-500 transition-colors"
                                                    title="Effacer"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setUploadTarget({ type: 'duo2' as any, initialImage: duoModal.url2 });
                                                setShowUploadModal(true);
                                            }}
                                            className="px-4 bg-neon-purple/20 border border-neon-purple/30 text-neon-purple rounded-xl font-bold text-[10px] uppercase hover:bg-neon-purple/30 transition-all font-black"
                                        >
                                            Upload
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Format du duo</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['1/1', '3/4', '16/9'].map(ratio => (
                                            <button
                                                key={ratio}
                                                type="button"
                                                onClick={() => setDuoModal({ ...duoModal, aspectRatio: ratio })}
                                                className={`py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${duoModal.aspectRatio === ratio ? 'bg-neon-purple text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                                            >
                                                {ratio}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button
                                        onClick={() => setDuoModal({ show: false, url1: '', url2: '', widgetIndex: undefined, widgetId: undefined, aspectRatio: '3/4' })}
                                        className="flex-1 py-3 rounded-xl border border-white/10 text-gray-500 font-bold uppercase tracking-widest text-[10px] hover:bg-white/5 transition-all"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (!duoModal.url1 || !duoModal.url2) return;

                                            const isV1 = duoModal.url1.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/) || duoModal.url1.includes('/video/upload/');
                                            const isV2 = duoModal.url2.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/) || duoModal.url2.includes('/video/upload/');

                                            const media1 = isV1
                                                ? `<video src="${duoModal.url1}" autoplay loop muted playsinline class="w-full aspect-[3/4] object-cover"></video>`
                                                : `<img src="${duoModal.url1}" alt="Portrait 1" class="w-full aspect-[3/4] object-cover transform group-hover:scale-105 transition-transform duration-700" />`;

                                            const media2 = isV2
                                                ? `<video src="${duoModal.url2}" autoplay loop muted playsinline class="w-full aspect-[3/4] object-cover"></video>`
                                                : `<img src="${duoModal.url2}" alt="Portrait 2" class="w-full aspect-[3/4] object-cover transform group-hover:scale-105 transition-transform duration-700" />`;

                                            const duoWidget = `<div class="duo-photos-premium flex flex-row gap-4 my-12">\n  <div class="image-premium-wrapper relative rounded-3xl overflow-hidden shadow-2xl border border-white/5 group flex-1">\n    ${media1}\n  </div>\n  <div class="image-premium-wrapper relative rounded-3xl overflow-hidden shadow-2xl border border-white/5 group flex-1">\n    ${media2}\n  </div>\n</div>`;

                                            if (duoModal.widgetId) {
                                                updateWidget(duoModal.widgetId, duoWidget);
                                            } else if (duoModal.widgetIndex !== undefined) {
                                                addWidget(duoModal.widgetIndex, duoWidget);
                                            } else {
                                                setWidgets([...widgets, { id: Math.random().toString(36).substr(2, 9), content: duoWidget }]);
                                            }
                                            setDuoModal({ show: false, url1: '', url2: '', widgetIndex: undefined, widgetId: undefined, aspectRatio: '3/4' });
                                        }}
                                        className="flex-1 py-3 rounded-xl bg-neon-purple text-white font-bold uppercase tracking-widest text-[10px] shadow-[0_0_15px_rgba(189,0,255,0.4)] hover:scale-105 transition-all"
                                    >
                                        Confirmer
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {videoGroupModal.show && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-dark-bg border border-white/10 rounded-3xl p-8 max-w-lg w-full shadow-2xl relative"
                        >
                            <button
                                onClick={() => setVideoGroupModal({ show: false, urls: ['', '', ''], count: 2 })}
                                className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <h3 className="text-xl font-display font-black text-white uppercase italic mb-6">Groupe de Vidéos en ligne</h3>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Nombre de vidéos par ligne</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[1, 2, 3].map(n => (
                                            <button
                                                key={n}
                                                type="button"
                                                onClick={() => setVideoGroupModal({ ...videoGroupModal, count: n })}
                                                className={`py-3 rounded-xl text-sm font-black transition-all border ${videoGroupModal.count === n ? 'bg-red-600 border-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                                            >
                                                {n} VIDÉO{n > 1 ? 'S' : ''}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {[...Array(videoGroupModal.count)].map((_, i) => (
                                        <div key={i}>
                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 text-neon-red">Vidéo {i + 1} (URL ou ID)</label>
                                            <input
                                                type="text"
                                                value={videoGroupModal.urls[i] || ''}
                                                onChange={e => {
                                                    const newUrls = [...videoGroupModal.urls];
                                                    newUrls[i] = e.target.value;
                                                    setVideoGroupModal({ ...videoGroupModal, urls: newUrls });
                                                }}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-red-600 transition-all text-sm"
                                                placeholder="Lien YouTube..."
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        onClick={() => setVideoGroupModal({ show: false, urls: ['', '', ''], count: 2 })}
                                        className="flex-1 py-4 rounded-xl border border-white/10 text-gray-500 font-bold uppercase tracking-widest text-[10px] hover:bg-white/5 transition-all"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        onClick={() => {
                                            const validUrls = videoGroupModal.urls.slice(0, videoGroupModal.count).filter(u => u.trim());
                                            if (validUrls.length === 0) return;

                                            const processedUrls = validUrls.map(val => {
                                                let id = val;
                                                if (val.includes('youtube.com/watch?v=')) {
                                                    id = val.split('v=')[1].split('&')[0];
                                                } else if (val.includes('youtu.be/')) {
                                                    id = val.split('youtu.be/')[1];
                                                } else if (val.includes('youtube.com/embed/')) {
                                                    id = val.split('youtube.com/embed/')[1].split('?')[0];
                                                }
                                                return `https://www.youtube.com/embed/${id}`;
                                            });

                                            const videoItems = processedUrls.map(url => `
    <div className="video-wrapper flex-1 relative aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/5 group">
      <iframe src="${url}" className="absolute inset-0 w-full h-full" allowFullScreen></iframe>
    </div>`).join('');

                                            const videoWidget = `<div class="video-group-premium flex flex-col md:flex-row gap-4 my-12">\n${videoItems}\n</div>`;

                                            if (videoGroupModal.widgetId) {
                                                updateWidget(videoGroupModal.widgetId, videoWidget);
                                            } else if (videoGroupModal.widgetIndex !== undefined) {
                                                addWidget(videoGroupModal.widgetIndex, videoWidget);
                                            } else {
                                                setWidgets([...widgets, { id: Math.random().toString(36).substr(2, 9), content: videoWidget }]);
                                            }
                                            setVideoGroupModal({ show: false, urls: ['', '', ''], count: 2 });
                                        }}
                                        className="flex-1 py-4 rounded-xl bg-red-600 text-white font-bold uppercase tracking-widest text-[10px] shadow-[0_0_15px_rgba(220,38,38,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    >
                                        Confirmer
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Schedule Modal */}
            <AnimatePresence>
                {showScheduleModal && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowScheduleModal(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-sm bg-dark-bg border border-white/10 rounded-3xl p-8 shadow-2xl"
                        >
                            <button
                                onClick={() => setShowScheduleModal(false)}
                                className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="w-12 h-12 bg-neon-red/10 rounded-2xl flex items-center justify-center border border-neon-red/30 mb-6">
                                <Calendar className="w-6 h-6 text-neon-red" />
                            </div>

                            <h3 className="text-xl font-display font-black text-white uppercase italic mb-2">
                                Programmer le Récap
                            </h3>
                            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-6">
                                Choisissez la date et l'heure de publication
                            </p>

                            <div className="space-y-6">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Date & Heure</label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const now = new Date();
                                                now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
                                                setDate(now.toISOString().slice(0, 16));
                                            }}
                                            className="text-[9px] font-black text-neon-cyan hover:text-white uppercase tracking-widest transition-colors"
                                        >
                                            Maintenant
                                        </button>
                                    </div>
                                    <div className="relative group">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-neon-red transition-colors" />
                                        <input
                                            type="datetime-local"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:border-neon-red outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            setShowScheduleModal(false);
                                            handleSubmit(e, false);
                                        }}
                                        className="w-full py-4 bg-neon-red text-white rounded-xl font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,18,65,0.3)]"
                                    >
                                        Confirmer la programmation
                                    </button>

                                    <p className="text-[9px] text-gray-500 text-center font-bold uppercase tracking-[0.1em] px-4">
                                        Le récap sera publié {date > new Date().toISOString().slice(0, 16) ? 'automatiquement' : ' Immédiatement'} à la date indiquée.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <ConfirmationModal
                isOpen={blocker.state === "blocked"}
                title="Modifications non enregistrées"
                message="Vous avez des modifications non enregistrées. Voulez-vous vraiment quitter la page ?"
                onConfirm={() => blocker.proceed?.()}
                onCancel={() => blocker.reset?.()}
            />

            <ConfirmationModal
                isOpen={showDeleteConfirm}
                title="Supprimer ce récap"
                message="Êtes-vous sûr de vouloir supprimer définitivement ce récapitulatif ? Cette action est irréversible."
                onConfirm={handleDelete}
                onCancel={() => setShowDeleteConfirm(false)}
            />
        </div>
    );
}

export default RecapCreate;
