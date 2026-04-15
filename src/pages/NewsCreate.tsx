import { useState, useEffect, useRef, useMemo, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Image as ImageIcon, Bold, Italic, AlignLeft, AlignCenter, AlignRight,
    Underline as UnderlineIcon, Check, Wand2, MapPin, Calendar, Globe, Youtube, 
    Columns, List, Trash2, ArrowLeft, User, CheckCircle2, Send, Star, FileText,
    Music, AlertCircle, Edit2, CaseUpper, Upload, Clock, Facebook, Instagram,
    ChevronUp, ChevronDown, Link2, Palette, X, Eye, Quote,
} from 'lucide-react';
import { useNavigate, useSearchParams, useLocation, useBlocker } from 'react-router-dom';
import { getAuthHeaders } from '../utils/auth';
import { ImageUploadModal } from '../components/ImageUploadModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { fixEncoding, standardizeContent } from '../utils/standardizer';
import { SocialSuite } from '../components/SocialSuite';
// LARGE JSON DATA IMPORTS REMOVED TO FIX CLOUDFLARE ERROR 10013
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

const SnapchatIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12,2.5c-3.7,0-5.7,2.8-5.7,6.1c0,0.8,0.2,1.5,0.6,2.1c-2.3,0.3-4.1,2.5-4.1,5c0,1,0.5,1.9,1.1,2.5 c-0.1,0.2-0.1,0.5-0.1,0.7c0,1.2,1,2.2,2.2,2.2h0.1c0.7,0.7,1.7,1.2,2.8,1.2c0.8,0,1.5-0.2,2.1-0.6c0.6,0.4,1.3,0.6,2.1,0.6 c1.1,0,2.1-0.5,2.8-1.2h0.1c1.2,0,2.2-1,2.2-2.2c0-0.2,0-0.5-0.1-0.7c0.7-0.6,1.1-1.5,1.1-2.5c0-2.5-1.8-4.7-4.1-5 c0.4-0.6,0.6-1.3,0.6-2.1C17.7,5.3,15.7,2.5,12,2.5z M12,4.5c2.1,0,3.7,1.6,3.7,4.1c0,0.7-0.2,1.3-0.5,1.9c-0.1,0.3-0.2,0.6-0.2,0.9 c0,0.3,0.1,0.6,0.3,0.8c3,0.4,3.8,2.6,3.8,4.9c0,1-0.8,1.8-1.8,1.8h-0.1c-0.2,0-0.5,0.1-0.8,0.3c-0.2,0.2-0.4,0.5-0.4,0.8 c0.1,0.3,0.1,0.6,0.1,0.9c0,0.4-0.1,0.8-0.3,1.2c-0.7,0.9-1.9,1.4-3.2,1.4s-2.5-0.5-3.2-1.4c-0.2-0.3-0.3-0.7-0.3-1.2 c0-0.3,0-0.6,0.1-0.9c0-0.3-0.1-0.6-0.4-0.8C8.5,19.3,8.3,19.2,8.1,19.2H8c-1,0-1.8-0.8-1.8-1.8c0-2.3,0.8-4.5,3.8-4.9 c0.2-0.2,0.3-0.5,0.3-0.8c0-0.3-0.1-0.6-0.2-0.9c-0.3-0.6-0.5-1.2-0.5-1.9C9.3,6.1,10.9,4.5,12,4.5z" />
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
    '#FF0099', // neon-red
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

// --- HELPER WRAPPER FOR MOBILE EDITOR EXPERIENCE ---
function MobileToolbar({ widgetId, applyFormat, toggleWidgetStyle, applyColorToSelection, addWidget }: any) {
    return (
        <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 z-[1000] bg-black/90 backdrop-blur-2xl border-t border-white/10 p-4 pb-10"
        >
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
                    <div className="flex bg-white/5 rounded-xl border border-white/10 p-1">
                        <button onMouseDown={e => e.preventDefault()} onClick={() => applyFormat('bold')} className="p-3 text-white hover:bg-white/10 rounded-lg"><Bold className="w-5 h-5" /></button>
                        <button onMouseDown={e => e.preventDefault()} onClick={() => applyFormat('italic')} className="p-3 text-white hover:bg-white/10 rounded-lg"><Italic className="w-5 h-5" /></button>
                        <button onMouseDown={e => e.preventDefault()} onClick={() => applyFormat('underline')} className="p-3 text-white hover:bg-white/10 rounded-lg"><UnderlineIcon className="w-5 h-5" /></button>
                    </div>

                    <div className="flex bg-white/5 rounded-xl border border-white/10 p-1">
                        <button onMouseDown={e => e.preventDefault()} onClick={() => toggleWidgetStyle(widgetId, 'text-left')} className="p-3 text-white hover:bg-white/10 rounded-lg"><AlignLeft className="w-5 h-5" /></button>
                        <button onMouseDown={e => e.preventDefault()} onClick={() => toggleWidgetStyle(widgetId, 'text-center')} className="p-3 text-white hover:bg-white/10 rounded-lg"><AlignCenter className="w-5 h-5" /></button>
                        <button onMouseDown={e => e.preventDefault()} onClick={() => toggleWidgetStyle(widgetId, 'text-right')} className="p-3 text-white hover:bg-white/10 rounded-lg"><AlignRight className="w-5 h-5" /></button>
                    </div>

                    <div className="flex bg-white/5 rounded-xl border border-white/10 p-1">
                        <button onMouseDown={e => e.preventDefault()} onClick={() => toggleWidgetStyle(widgetId, 'text-xl')} className="px-3 py-1.5 text-xs font-bold text-white uppercase">M</button>
                        <button onMouseDown={e => e.preventDefault()} onClick={() => toggleWidgetStyle(widgetId, 'text-2xl')} className="px-3 py-1.5 text-xs font-bold text-white uppercase">L</button>
                        <button onMouseDown={e => e.preventDefault()} onClick={() => toggleWidgetStyle(widgetId, 'text-4xl')} className="px-3 py-1.5 text-xs font-bold text-white uppercase">XL</button>
                    </div>

                    <div className="flex bg-white/5 rounded-xl border border-white/10 p-1">
                        <button onMouseDown={e => e.preventDefault()} onClick={() => toggleWidgetStyle(widgetId, 'uppercase')} className="px-4 py-1.5 text-[10px] font-black text-white uppercase">MAJ</button>
                    </div>

                    <button
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => addWidget()}
                        className="p-3 bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 rounded-xl"
                        title="Ajouter un widget texte après"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {EDITOR_COLORS.map(color => (
                        <button
                            key={color}
                            type="button"
                            onMouseDown={e => e.preventDefault()}
                            onClick={() => applyColorToSelection(widgetId, color)}
                            className="w-8 h-8 rounded-full border border-white/20 shrink-0"
                            style={{ backgroundColor: color }}
                        />
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

// Helper component for styled checkboxes
function StyledCheckbox({ checked, onChange, label, sublabel, icon: Icon, colorClass = "neon-red" }: { checked: boolean, onChange: (val: boolean) => void, label: string, sublabel?: string, icon?: any, colorClass?: string }) {
    const isRed = colorClass === "neon-red";
    const isCyan = colorClass === "neon-cyan";

    const colorMap: any = {
        'neon-red': 'bg-neon-red border-neon-red shadow-[0_0_15px_rgba(255,18,65,0.4)]',
        'neon-cyan': 'bg-neon-cyan border-neon-cyan shadow-[0_0_15px_rgba(0,255,243,0.4)]',
        'neon-purple': 'bg-neon-purple border-neon-purple shadow-[0_0_15px_rgba(189,0,255,0.4)]',
        'neon-green': 'bg-neon-green border-neon-green shadow-[0_0_15px_rgba(57,255,20,0.4)]',
        'neon-yellow': 'bg-neon-yellow border-neon-yellow shadow-[0_0_15px_rgba(255,240,31,0.4)]',
    };

    const textColorMap: any = {
        'neon-red': 'text-neon-red',
        'neon-cyan': 'text-neon-cyan',
        'neon-purple': 'text-neon-purple',
        'neon-green': 'text-neon-green',
        'neon-yellow': 'text-neon-yellow',
    };

    return (
        <div
            className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all border ${checked ? 'bg-white/[0.03]' : 'bg-black/20 border-white/5 hover:bg-white/[0.05] hover:border-white/10'}`}
            style={checked ? { borderColor: isRed ? 'rgba(255,18,65,0.3)' : isCyan ? 'rgba(0,240,243,0.3)' : 'rgba(255,255,255,0.2)' } : {}}
            onClick={() => onChange(!checked)}
        >
            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${checked ? colorMap[colorClass] || colorMap['neon-red'] : 'bg-black/40 border-white/10'}`}>
                {checked && <Check className="w-4 h-4 text-white" strokeWidth={4} />}
            </div>
            <div className="flex flex-col">
                <div className="flex items-center gap-2">
                    {Icon && <Icon className={`w-3 h-3 ${checked ? textColorMap[colorClass] || textColorMap['neon-red'] : 'text-gray-500'}`} />}
                    <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${checked ? 'text-white' : 'text-gray-500'}`}>{label}</span>
                </div>
                {sublabel && <span className="text-[8px] text-gray-600 font-bold uppercase tracking-widest mt-0.5">{sublabel}</span>}
            </div>
        </div>
    );
}

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

export function NewsCreate() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation() as any;
    const type = searchParams.get('type') || 'News'; // 'News' or 'Interview'
    const id = searchParams.get('id');
    const isEditing = !!id;
    const editingItem = location.state?.item;

    const [title, setTitle] = useState(editingItem?.title || '');
    const [locationInput, setLocationInput] = useState(editingItem?.location || '');
    const [country, setCountry] = useState(editingItem?.country || '');
    const [isAutoLocating, setIsAutoLocating] = useState(false);
    const [imageUrl, setImageUrl] = useState(editingItem?.image || '');
    
    // Format date for datetime-local (must be YYYY-MM-DDTHH:mm)
    const [date, setDate] = useState(() => {
        const d = editingItem?.date || '';
        if (d && d.includes('T')) return d.slice(0, 16);
        if (d) return `${d}T12:00`;
        // For new articles, default to current time
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    });
    
    const [category, setCategory] = useState(editingItem?.category || type);
    const [youtubeId, setYoutubeId] = useState(editingItem?.youtubeId || '');
    const [year, setYear] = useState(editingItem?.year || '');
    const [interviewSubtype, setInterviewSubtype] = useState<'written' | 'video'>((searchParams.get('subtype') as 'written' | 'video') || 'written');
    const [interviewTheme, setInterviewTheme] = useState('');
    const interviewThemes = ["Interview", "Fast Quizz", "La Playlist", "Drop & Talk"];
    const [author, setAuthor] = useState(() => {
        const stored = localStorage.getItem('admin_name') || localStorage.getItem('admin_user') || 'Alex';
        const found = (editorsData as any[]).find(e =>
            e.name.toLowerCase() === stored.toLowerCase() ||
            e.username.toLowerCase() === stored.toLowerCase()
        );
        return found ? found.name : stored;
    });
    const [artistNameLabel, setArtistNameLabel] = useState('');
    // Push notification options removed
    const [showSocialSuite, setShowSocialSuite] = useState(false);
    const [isAuthorConfirmed, setIsAuthorConfirmed] = useState(false);
    const [socialSuiteData, setSocialSuiteData] = useState<{
        title: string,
        imageUrl: string,
        type: string,
        category: string,
        articleId: string
    } | null>(null);
    const [activeWidgetId, setActiveWidgetId] = useState<string | null>(null);
    const [isMobileEditorActive, setIsMobileEditorActive] = useState(false);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const initialDataLoaded = useRef(false);

    // Autocomplete State
    const [citySuggestions, setCitySuggestions] = useState<{ city: string, country: string }[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const suggestionRef = useRef<HTMLDivElement>(null);

    // Extract unique locations via API or common list (Refactored to avoid 2MB JSON bundling)
    const allLocations = useMemo(() => {
        return [
            { city: "PARIS", country: "FRANCE" },
            { city: "LYON", country: "FRANCE" },
            { city: "MARSEILLE", country: "FRANCE" },
            { city: "NICE", country: "FRANCE" },
            { city: "TOULOUSE", country: "FRANCE" },
            { city: "AMSTERDAM", country: "PAYS-BAS" },
            { city: "BERLIN", country: "ALLEMAGNE" },
            { city: "LONDRES", country: "ROYAUME-UNI" },
            { city: "BRUXELLES", country: "BELGIQUE" },
            { city: "BARCELONE", country: "ESPAGNE" },
            { city: "IBIZA", country: "ESPAGNE" },
            { city: "GENÈVE", country: "SUISSE" },
            { city: "MILAN", country: "ITALIE" },
            { city: "NEW-YORK", country: "USA" },
            { city: "MIAMI", country: "USA" },
            { city: "LABEGE", country: "FRANCE" }
        ];
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
        if ((!locationInput || locationInput.length < 2) && (!title || title.length < 3)) return;

        const searchText = title && title.length >= 3 ? `${title} ${locationInput}` : locationInput;
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
    }, [locationInput, title]);

    // Widget System State
    const [widgets, setWidgets] = useState<{ id: string, content: string }[]>(() => {
        const isInterviewVideo = type === 'Interview' && (searchParams.get('subtype') === 'video');
        if (isInterviewVideo) return [];
        return [
            { id: 'initial-1', content: '<h2 class="premium-section-title">TITRE DE L\'ARTICLE</h2>' }
        ];
    });

    useEffect(() => {
        const isInterviewVideo = type === 'Interview' && interviewSubtype === 'video';
        if (isInterviewVideo) {
            setWidgets(prev => prev.filter(w => !w.content.includes('premium-section-title')));
        }
    }, [type, interviewSubtype]);

    const [interviewQuestions, setInterviewQuestions] = useState<{
        id: string,
        type: 'qa' | 'image' | 'video' | 'spotify',
        artistName?: string,
        artistColor?: string,
        question?: string,
        answer?: string,
        mediaUrl?: string
    }[]>([
        { id: Math.random().toString(36).substr(2, 9), type: 'qa', artistName: '', artistColor: '#ff1241', question: '', answer: '' }
    ]);

    const [activeTab, setActiveTab] = useState<'News' | 'Musique' | 'Focus'>(
        (searchParams.get('tab') as 'News' | 'Musique' | 'Focus') ||
        (type === 'Musique' ? 'Musique' : 'News')
    );
    const [musicItems, setMusicItems] = useState([{ id: Math.random().toString(36).substr(2, 9), title: '', media: '', imageUrl: '', playerType: 'spotify', description: '', canVote: true }]);
    const [mediaModal, setMediaModal] = useState<{
        show: boolean,
        type: 'image' | 'gallery' | 'video' | 'spotify' | 'beatport',
        url: string,
        urls: string,
        aspectRatio?: string,
        widgetId?: string,
        cols?: number,
        alignment?: 'left' | 'right' | 'center',
        width?: number
    }>({
        show: false,
        type: 'image',
        url: '',
        urls: '',
        aspectRatio: 'auto',
        cols: 4,
        alignment: 'center',
        width: 100
    });
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadTarget, setUploadTarget] = useState<{ type: 'main' | 'widget' | 'widget-edit' | 'duo-image' | 'interview-media', index?: number, widgetId?: string, interviewBlockId?: string, initialImage?: string, allowMultiple?: boolean }>({ type: 'main' });
    const [isFeatured, setIsFeatured] = useState(false);
    const [showVideo, setShowVideo] = useState(type !== 'Interview' || (type === 'Interview' && (searchParams.get('subtype') === 'video')));
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
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
    const [duoModal, setDuoModal] = useState({ show: false, urls: ['', ''], widgetIndex: undefined as number | undefined, widgetId: undefined as string | undefined, aspectRatio: '3/4' });
    const [isLoading, setIsLoading] = useState(isEditing);
    const [suggestedTitles, setSuggestedTitles] = useState<string[]>([]);
    const [videoStartTime, setVideoStartTime] = useState<number>(0);
    const [videoAutoplay, setVideoAutoplay] = useState<boolean>(false);

    // Fetch item if missing from state but ID is present
    useEffect(() => {
        const currentId = searchParams.get('id');
        if (!currentId) {
            setIsLoading(false);
            initialDataLoaded.current = false;
            return;
        }

        const parseAndInitialize = (articleData: any, fullContent: string) => {
            if (articleData.title) setTitle(articleData.title);
            if (articleData.location) setLocationInput(articleData.location);
            if (articleData.country) setCountry(articleData.country);
            if (articleData.image) setImageUrl(articleData.image);
            
            const dateValue = articleData.date || '';
            if (dateValue) {
                let finalDate = dateValue;
                if (dateValue.includes('T')) finalDate = dateValue.slice(0, 16);
                else finalDate = `${dateValue}T12:00`;
                setDate(finalDate);
            }

            if (articleData.category) setCategory(articleData.category);
            if (articleData.youtubeId) setYoutubeId(articleData.youtubeId);
            if (articleData.year) setYear(articleData.year);
            if (articleData.isFeatured !== undefined) setIsFeatured(articleData.isFeatured);
            if (articleData.author) setAuthor(articleData.author);
            setIsAuthorConfirmed(true);

            if (articleData.category === 'Focus' || (articleData.category === 'News' && articleData.isFocus)) setActiveTab('Focus');
            else if (articleData.category === 'Musique') setActiveTab('Musique');
            else setActiveTab('News');

            if (articleData.showVideo !== undefined) setShowVideo(articleData.showVideo);
            else if (articleData.category?.includes('Interview') && articleData.youtubeId) setShowVideo(true);

            const c = fullContent || articleData.content || '';
            const parser = new DOMParser();
            const doc = parser.parseFromString(c, 'text/html');

            // Parse Socials
            const artistSocialsContainer = doc.querySelector('.artist-socials-premium');
            if (artistSocialsContainer) {
                const newSocials: any = { website: '', instagram: '', tiktok: '', youtube: '', facebook: '', x: '', spotify: '', soundcloud: '', beatport: '' };
                Array.from(artistSocialsContainer.querySelectorAll('a')).forEach((a: any) => {
                    const platform = a.getAttribute('data-platform');
                    const url = a.getAttribute('href');
                    if (platform && url && platform in newSocials) newSocials[platform] = url;
                });
                setArtistSocials(newSocials);

                const h3 = artistSocialsContainer.querySelector('h3');
                const labelText = h3?.textContent?.replace(/SUIVEZ\s+/i, '').trim();
                if (labelText && labelText !== "L'ARTISTE") setArtistNameLabel(labelText);
            }

            const sections = doc.querySelectorAll('.article-section');
            const foundWidgets: { id: string, content: string }[] = [];
            const foundQuestions: any[] = [];

            if (sections.length > 0) {
                sections.forEach(section => {
                    const html = section.innerHTML.trim();
                    if (section.classList.contains('interview-qa-block')) {
                        const qaMatches = Array.from(html.matchAll(/(?:<strong[^>]*|<span[^>]*class=["']interview-q["'][^>]*)>(.*?)<\/(?:strong|span)>\s*(.*?)(?:<\/p|$)/gi));
                        if (qaMatches.length >= 2) {
                            foundQuestions.push({
                                id: Math.random().toString(36).substr(2, 9),
                                type: 'qa', artistName: section.getAttribute('data-artist-name') || qaMatches[1][1].replace(/[:]/g, '').trim(),
                                artistColor: section.getAttribute('data-artist-color') || '#ff1241',
                                question: qaMatches[0][2].trim(), answer: qaMatches[1][2].trim()
                            });
                        }
                    } else if (section.classList.contains('interview-image-block')) {
                        foundQuestions.push({ id: Math.random().toString(36).substr(2, 9), type: 'image', mediaUrl: section.getAttribute('data-media-url') || section.querySelector('img')?.src || '' });
                    } else if (section.classList.contains('interview-video-block')) {
                        foundQuestions.push({ id: Math.random().toString(36).substr(2, 9), type: 'video', mediaUrl: section.getAttribute('data-media-url') || section.querySelector('iframe')?.src?.split('/embed/')[1] || '' });
                    } else if (!html.includes('artist-socials-premium')) {
                        foundWidgets.push({ id: Math.random().toString(36).substring(2, 11), content: html });
                    }
                });
            }

            if (foundWidgets.length > 0) setWidgets(foundWidgets);
            else if (c && !c.includes('article-section')) setWidgets([{ id: 'legacy-1', content: c }]);
            if (foundQuestions.length > 0) setInterviewQuestions(foundQuestions);

            if (articleData.category === 'Musique') {
                const domItems = Array.from(doc.querySelectorAll('.music-top-item-premium')).map(el => ({
                    id: Math.random().toString(36).substr(2, 9),
                    title: el.querySelector('h3')?.textContent?.trim() || '',
                    media: el.getAttribute('data-media') || '',
                    imageUrl: el.querySelector('.vinyl-wrapper img')?.getAttribute('src') || '',
                    playerType: (el.getAttribute('data-player-type') || 'spotify') as any,
                    description: el.querySelector('.music-item-description p')?.innerHTML || '',
                    canVote: !!el.querySelector('.music-vote-button')
                })).filter(m => m.media);
                if (domItems.length > 0) setMusicItems(domItems);
            }

            setIsLoading(false);
            initialDataLoaded.current = true;
        };

        if (editingItem && String(editingItem.id) === String(currentId)) {
            parseAndInitialize(editingItem, editingItem.content || '');
            if (!editingItem.content) {
                fetch(`/api/news/content?id=${currentId}`, { headers: getAuthHeaders() })
                    .then(res => res.json())
                    .then(data => parseAndInitialize(data.article || editingItem, data.content || ''));
            }
        } else {
            setIsLoading(true);
            fetch(`/api/news/content?id=${currentId}`, { headers: getAuthHeaders() })
                .then(res => res.json())
                .then(data => parseAndInitialize(data.article || {}, data.content || ''))
                .catch(() => setIsLoading(false));
        }
    }, [searchParams, editingItem]);

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

    const [videoGroupModal, setVideoGroupModal] = useState<{
        show: boolean;
        title: string;
        rows: Array<{
            count: number;
            videos: Array<{ url: string; title: string }>;
        }>;
        widgetIndex?: number;
        widgetId?: string;
    }>({
        show: false,
        title: '',
        rows: [{ count: 3, videos: [{ url: '', title: '' }, { url: '', title: '' }, { url: '', title: '' }] }]
    });

    const [isDirty, setIsDirty] = useState(false);

    // Track changes
    useEffect(() => {
        if (isEditing && editingItem && !initialDataLoaded.current) {
            if (title === editingItem.title && locationInput === editingItem.location) {
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
    }, [title, locationInput, imageUrl, widgets, date, category, youtubeId, isFeatured, musicItems, artistSocials, interviewQuestions]);



    // Prompt before internal React Router navigation
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            isDirty && currentLocation.pathname !== nextLocation.pathname
    );

    // Confirm navigation handled by ConfirmationModal component in JSX

    // Prompt before window reload/close supprimé pour éviter la fenêtre native Windows
    useEffect(() => {
        // La protection se fait uniquement via le react router (ConfirmationModal)
    }, [isDirty]);


    useEffect(() => {
        if (!isEditing) {
            setCategory(type || 'News');
            if (type === 'Musique') {
                const today = new Date();
                const dd = String(today.getDate()).padStart(2, '0');
                const mm = String(today.getMonth() + 1).padStart(2, '0');
                const yyyy = today.getFullYear();
                setTitle(`Les Sorties de la Semaine - ${dd}/${mm}/${yyyy}`);
            }
        }
    }, [type, isEditing]);


    // const handleUpload = async (file: File) => {
    //     const validation = uploadValidation(file);
    //     if (!validation.valid) throw new Error(validation.error);
    //     return await uploadToCloudinary(file, 'news', (p) => setUploadProgress(p));
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

    // Extracted logic for direct insertion without using state
    const insertImageWidget = (url: string, targetWidgetId?: string, targetIndex?: number, config: any = {}) => {
        const { aspectRatio = 'auto', alignment = 'center', width = 100 } = config;
        const aspectClass = aspectRatio && aspectRatio !== 'auto' ? `aspect-[${aspectRatio}]` : '';
        const imgClass = aspectRatio && aspectRatio !== 'auto' ? 'w-full h-full object-cover' : 'w-full h-auto object-cover';
        const layoutClasses = "image-premium-wrapper w-full relative rounded-3xl overflow-hidden shadow-2xl border border-white/5 my-12 group";
        const sectionWrapperAttribs = `data-align="${alignment}"`;
        const sectionWrapperStyles = alignment !== 'center' ? `width: ${width}%; max-width: 100%;` : '';

        const content = `<div class="premium-image-float-container" ${sectionWrapperAttribs} style="${sectionWrapperStyles}">
  <div class="${layoutClasses} ${aspectClass}">
    <img src="${url}" alt="Image" class="${imgClass} transform group-hover:scale-105 transition-transform duration-700" />
  </div>
</div>`;

        if (targetWidgetId) {
            updateWidget(targetWidgetId, content);
        } else if (typeof targetIndex === 'number') {
            addWidget(targetIndex, content);
        } else {
            setWidgets([...widgets, { id: Math.random().toString(36).substr(2, 9), content }]);
        }
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

    const moveInterviewQuestionUp = (index: number) => {
        if (index === 0) return;
        const newQuestions = [...interviewQuestions];
        [newQuestions[index - 1], newQuestions[index]] = [newQuestions[index], newQuestions[index - 1]];
        setInterviewQuestions(newQuestions);
    };

    const moveInterviewQuestionDown = (index: number) => {
        if (index === interviewQuestions.length - 1) return;
        const newQuestions = [...interviewQuestions];
        [newQuestions[index + 1], newQuestions[index]] = [newQuestions[index], newQuestions[index + 1]];
        setInterviewQuestions(newQuestions);
    };

    const toggleWidgetStyle = (id: string, style: 'uppercase' | 'font-display' | 'text-sm' | 'text-xl' | 'text-2xl' | 'text-3xl' | 'text-4xl' | 'text-5xl' | 'text-center' | 'text-right' | 'text-left' | 'bg-white') => {
        const activeEl = document.activeElement;
        const isVisualEditor = !!(activeEl && activeEl.classList.contains('visual-editor-content'));
        const isTextarea = !!(activeEl && activeEl.tagName === 'TEXTAREA');
        const selection = window.getSelection();

        // 1. Visual Editor Selection Mode
        if (isVisualEditor && selection && selection.toString().length > 0) {
            const widgetId = (activeEl as HTMLElement).getAttribute('data-widget-id');
            if (widgetId === id) {
                const range = selection.getRangeAt(0);

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
        const isCorrectTextarea = !!(activeEl && activeEl.tagName === 'TEXTAREA');
        const isVisualEditor = !!(activeEl && activeEl.classList.contains('visual-editor-content'));

        if (isVisualEditor && activeEl) {
            document.execCommand('foreColor', false, color);
            // Trigger change event manually as document.execCommand doesn't always trigger it on contentEditable for React
            const event = new Event('input', { bubbles: true });
            activeEl.dispatchEvent(event);
            return;
        }

        if (!isCorrectTextarea) return;

        const ta = activeEl as HTMLTextAreaElement;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const val = ta.value;
        const selectedText = val.substring(start, end);

        if (!selectedText) {
            // If no selection, wrap the WHOLE widget if it's a title or wrap nothing
            setWidgets(widgets.map(w => {
                if (w.id === widgetId) {
                    return { ...w, content: `<div style="color: ${color}">\n${w.content}\n</div>` };
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

    const applyFormat = (command: string, value?: string) => {
        // Try to get the last known focused visual editor element
        const activeEl = document.activeElement;
        const isVisualEditor = !!(activeEl && activeEl.classList.contains('visual-editor-content'));
        const isTextarea = !!(activeEl && activeEl.tagName === 'TEXTAREA');

        if (isVisualEditor && activeEl) {
            // Save selection before click steals focus
            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0) {
                const range = sel.getRangeAt(0);
                // Re-focus then restore selection to make execCommand work reliably
                (activeEl as HTMLElement).focus();
                sel.removeAllRanges();
                sel.addRange(range);
            } else {
                (activeEl as HTMLElement).focus();
            }
            document.execCommand(command, false, value);
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
                formatted = `<strong>${selectedText}</strong>`;
            } else if (command === 'italic') {
                formatted = `<em>${selectedText}</em>`;
            } else if (command === 'underline') {
                formatted = `<u>${selectedText}</u>`;
            } else if (command === 'formatBlock' && value === 'blockquote') {
                formatted = `<blockquote>${selectedText}</blockquote>`;
            }

            const before = val.substring(0, start);
            const after = val.substring(end);
            const newContent = before + formatted + after;

            const widgetId = ta.getAttribute('data-widget-id');
            if (widgetId) {
                updateWidget(widgetId, newContent);
                setTimeout(() => {
                    ta.focus();
                    ta.setSelectionRange(start, start + formatted.length);
                }, 0);
            }
        }
    };

    const extractDuoUrls = (html: string) => {
        const matches = html.match(/src="([^"]+)"/g);
        const urls = matches ? matches.map(m => m.replace('src="', '').replace('"', '')) : ['', ''];
        const aspectMatch = html.match(/aspect-\[([^\]]+)\]/);
        const ratio = aspectMatch ? aspectMatch[1] : '3/4';
        return { urls, ratio };
    };

    const extractSingleImageUrlAndRatio = (html: string) => {
        const imgMatch = html.match(/src="([^"]+)"/);
        const ratioMatch = html.match(/aspect-\[([^\]]+)\]/);
        const alignMatch = html.match(/data-align="([^"]+)"/);
        const widthMatch = html.match(/width:\s*(\d+)%/);
        return {
            url: imgMatch ? imgMatch[1] : '',
            ratio: ratioMatch ? ratioMatch[1] : 'auto',
            alignment: (alignMatch ? alignMatch[1] : 'center') as 'left' | 'center' | 'right',
            width: widthMatch ? parseInt(widthMatch[1]) : 100
        };
    };

    const extractVideoUrls = (html: string) => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const iframes = doc.querySelectorAll('iframe');
        const urls = Array.from(iframes).map(iframe => iframe.src);
        return { urls, count: urls.length };
    };

    const fixWidgetEncoding = (id: string) => {
        setWidgets(widgets.map(w => w.id === id ? { ...w, content: fixEncoding(w.content) } : w));
    };

    const removeWidget = (id: string) => {
        if (widgets.length > 1) {
            setWidgets(widgets.filter(w => w.id !== id));
        }
    };

    const addMusicItem = () => {
        setMusicItems([...musicItems, { id: Math.random().toString(36).substr(2, 9), title: '', media: '', imageUrl: '', playerType: 'spotify', description: '', canVote: true }]);
    };

    const fetchMusicMetadata = async (id: string, url: string) => {
        if (!url) return;

        try {
            let title = '';
            // 1. YouTube Title Fetch
            if (url.includes('youtube.com') || url.includes('youtu.be')) {
                const response = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
                const data = await response.json();
                if (data.title) title = data.title;
            }
            // 2. Spotify Title Fetch (OEmbed)
            else if (url.includes('spotify.com')) {
                const response = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`);
                const data = await response.json();
                if (data.title) title = data.title;
            }

            // 3. Beatport Title Fetch (using Microlink as proxy to avoid CORS/Parsing)
            else if (url.includes('beatport.com') || url.match(/^\d+$/)) {
                try {
                    let sCredits = parseInt(localStorage.getItem('scrapingbee_credits') || '1000');
                    if (sCredits <= 0) {
                        alert("Le compteur ScrapingBee interne est à 0. Pense à le remettre à zéro dans tes paramètres de navigateur après avoir créé un compte !");
                        throw new Error("No limit");
                    }

                    const sbKey = 'GNOH62OMJTZUVJCH4ITXB4CANAIV0250UHXI9WR4QH1M93XMR96WOBP2057PHLEH8C7RIFRSBPXN4RYV';
                    const rules = encodeURIComponent('{"title":"title"}');
                    // Premium Proxy might be required for Beatport Cloudflare, meaning up to 25 credits per request, but we'll try without JS first to save credits. We'll deduct roughly 5 credits.
                    const sbUrl = `https://app.scrapingbee.com/api/v1/?api_key=${sbKey}&url=${encodeURIComponent(url)}&extract_rules=${rules}&render_js=false`;

                    const response = await fetch(sbUrl);
                    if (!response.ok) throw new Error("ScrapingBee failure");
                    
                    const data = await response.json();
                    
                    if (data && data.title && !data.title.includes('Just a moment') && !data.title.includes('Cloudflare')) {
                        const bTitle = data.title.split('|')[0].trim();
                        title = bTitle;

                        sCredits -= 5;
                        if (sCredits < 0) sCredits = 0;
                        localStorage.setItem('scrapingbee_credits', sCredits.toString());

                        if (sCredits <= 10 && sCredits > 0) {
                            alert(`🚨 ATTENTION : Ton quota théorique de crédits ScrapingBee atteint ${sCredits} ! \nPense à recréer un nouveau compte très vite.`);
                        }
                    } else {
                        // Sometimes standard bypass fails, fall back to iTunes
                        throw new Error("ScrapingBee blocked by CF");
                    }
                } catch (e) {
                    // Fallback to extract title from the URL slug due to bot protection
                    const match = url.match(/\/(?:track|release)\/([^/]+)/);
                    if (match && match[1]) {
                        // "losing-it" -> "Losing It"
                        const slugTitle = match[1]
                            .replace(/-/g, ' ')
                            .replace(/\b\w/g, char => char.toUpperCase());
                        
                        // Attempt to fetch Artist - Title from iTunes Search API as a smart fallback
                        try {
                            const itunesRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(slugTitle)}&media=music&limit=1`);
                            const itunesData = await itunesRes.json();
                            if (itunesData && itunesData.results && itunesData.results.length > 0) {
                                const t = itunesData.results[0];
                                title = `${t.artistName} - ${t.trackName}`;
                            } else {
                                title = slugTitle;
                            }
                        } catch (err) {
                            title = slugTitle;
                        }
                    } else if (url.match(/^\d+$/)) {
                        title = `Beatport ID: ${url}`;
                    }
                }
            }

            if (title) {
                setMusicItems(prev => prev.map(item =>
                    item.id === id ? { ...item, title: title } : item
                ));
            }
        } catch (error: any) {
            console.error('Error fetching music metadata:', error);
        }
    };

    const updateMusicItem = (id: string, field: 'title' | 'media' | 'imageUrl' | 'playerType' | 'canVote' | 'description', value: any) => {
        setMusicItems(musicItems.map(item => {
            if (item.id === id) {
                let newPlayerType = item.playerType;
                if (field === 'media' && value) {
                    if (value.includes('spotify.com')) newPlayerType = 'spotify';
                    else if (value.includes('youtube.com') || value.includes('youtu.be')) newPlayerType = 'youtube';
                    else if (value.includes('beatport.com') || value.match(/^\d+$/)) newPlayerType = 'beatport';
                }
                return { ...item, [field]: value, playerType: newPlayerType };
            }
            return item;
        }));

        if (field === 'media' && value && activeTab === 'Musique') {
            fetchMusicMetadata(id, value);
        }
    };

    const removeMusicItem = (id: string) => {
        setMusicItems(prev => prev.filter(item => item.id !== id));
    };

    const renderMediaEmbed = (url: string, playerType?: string) => {
        if (!url) return '';

        // 1. Spotify
        if (playerType === 'spotify' || url.includes('spotify.com')) {
            let embedUrl = url;
            // Standardize URL to use /embed/
            if (!url.includes('/embed/')) {
                // Matches tracks, albums, playlists, episodes, shows
                embedUrl = url.replace(/(open\.spotify\.com\/)(track|album|playlist|artist|episode|show)\/([a-zA-Z0-9]+)(\?.*)?/, '$1embed/$2/$3');
            }
            return `<iframe src="${embedUrl}" width="100%" height="152" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`;
        }

        // 2. YouTube
        if (playerType === 'youtube' || url.includes('youtube.com') || url.includes('youtu.be')) {
            let videoId = '';
            if (url.includes('v=')) {
                videoId = url.split('v=')[1].split('&')[0];
            } else if (url.includes('youtu.be/')) {
                videoId = url.split('youtu.be/')[1].split('?')[0];
            } else if (url.includes('embed/')) {
                videoId = url.split('embed/')[1].split('?')[0];
            } else if (url.match(/^[a-zA-Z0-9_-]{11}$/)) {
                videoId = url;
            }
            return `<div class="aspect-video h-full w-full"><iframe src="https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&origin=${window.location.origin}" class="w-full h-full" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" id="yt-player-${videoId}"></iframe></div>`;
        }

        // 3. Beatport
        if (playerType === 'beatport' || url.includes('beatport.com') || url.match(/^\d+$/)) {
            // Match track or release ID: beatport.com/track/name/ID or beatport.com/release/name/ID
            const trackMatch = url.match(/\/track\/[^/]+\/(\d+)/);
            const releaseMatch = url.match(/\/release\/[^/]+\/(\d+)/);

            if (trackMatch) {
                return `<iframe src="https://embed.beatport.com/?id=${trackMatch[1]}&type=track" width="100%" height="162" frameBorder="0" scrolling="no" style="background: #111;"></iframe>`;
            } else if (releaseMatch) {
                return `<iframe src="https://embed.beatport.com/?id=${releaseMatch[1]}&type=release" width="100%" height="162" frameBorder="0" scrolling="no" style="background: #111;"></iframe>`;
            } else if (url.match(/^\d+$/)) {
                return `<iframe src="https://embed.beatport.com/?id=${url}&type=track" width="100%" height="162" frameBorder="0" scrolling="no" style="background: #111;"></iframe>`;
            } else {
                // If it contains beatport.com but no clear track/release in URL
                return `<a href="${url}" target="_blank" class="text-neon-cyan hover:underline p-4 block bg-white/5 rounded-xl border border-white/10 text-center font-bold uppercase tracking-widest text-[10px]">${url} (BEATPORT)</a>`;
            }
        }

        return `<a href="${url}" target="_blank" class="text-neon-cyan hover:underline p-4 block bg-white/5 rounded-xl border border-white/10 text-center font-bold uppercase tracking-widest text-[10px]">${url}</a>`;
    };

    const handleMediaConfirm = (index?: number) => {
        const { type, url, urls, aspectRatio, alignment, width } = mediaModal;
        let content = '';

        if (type === 'image' && url) {
            const aspectClass = aspectRatio && aspectRatio !== 'auto' ? `aspect-[${aspectRatio}]` : '';
            const imgClass = aspectRatio && aspectRatio !== 'auto' ? 'w-full h-full object-cover' : 'w-full h-auto object-cover';

            // Layout classes for "premium journal" effect
            const layoutClasses = "image-premium-wrapper w-full relative rounded-3xl overflow-hidden shadow-2xl border border-white/5 my-12 group";
            const sectionWrapperAttribs = `data-align="${alignment || 'center'}"`;
            const sectionWrapperStyles = alignment !== 'center' ? `width: ${width || 45}%; max-width: 100%;` : '';

            content = `<div class="premium-image-float-container" ${sectionWrapperAttribs} style="${sectionWrapperStyles}">
  <div class="${layoutClasses} ${aspectClass}">
    <img src="${url}" alt="Image" class="${imgClass} transform group-hover:scale-105 transition-transform duration-700" />
  </div>
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
            const cols = mediaModal.cols || 4;
            const colClass = cols === 2 ? 'grid-cols-2' : cols === 3 ? 'grid-cols-3' : 'grid-cols-2 lg:grid-cols-4';
            content = `<div class="gallery-premium-grid grid grid-cols-1 ${colClass} gap-6 my-12" data-cols="${cols}">
${urlList.map(u => `  <div class="aspect-square relative overflow-hidden rounded-2xl border border-white/10 group shadow-2xl">
<img src="${u}" class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
  </div>`).join('\n')
                }
</div>`;
        } else if (type === 'spotify' && url) {
            const tm = url.match(/track[/:]([a-zA-Z0-9]+)/);
            const am = url.match(/album[/:]([a-zA-Z0-9]+)/);
            const pm = url.match(/playlist[/:]([a-zA-Z0-9]+)/);
            let spId = tm ? tm[1] : am ? am[1] : pm ? pm[1] : url;
            let spType = tm ? 'track' : am ? 'album' : pm ? 'playlist' : 'track';
            content = `<div class="spotify-compact-widget article-section my-12" data-spotify-id="${spId}" data-spotify-type="${spType}">
  <div class="relative rounded-3xl overflow-hidden shadow-2xl border border-[#1DB954]/20 bg-[#121212]">
    <iframe src="https://open.spotify.com/embed/${spType}/${spId}?utm_source=generator&theme=0" width="100%" height="${spType === 'track' ? '80' : '152'}" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" style="border-radius:12px;"></iframe>
  </div>
</div>`;
        } else if (type === 'beatport' && url) {
            const trackIdMatch = url.match(/\/track\/[^/]+\/(\d+)/);
            const releaseIdMatch = url.match(/\/release\/[^/]+\/(\d+)/);
            const chartIdMatch = url.match(/\/chart\/[^/]+\/(\d+)/);
            let bpId = trackIdMatch ? trackIdMatch[1] : releaseIdMatch ? releaseIdMatch[1] : chartIdMatch ? chartIdMatch[1] : '';
            let bpType = trackIdMatch ? 'track' : releaseIdMatch ? 'release' : chartIdMatch ? 'chart' : 'track';
            if (bpId) {
                content = `<div class="beatport-compact-widget article-section my-12" data-beatport-id="${bpId}" data-beatport-type="${bpType}">
  <div class="relative rounded-3xl overflow-hidden shadow-2xl border border-[#02FF95]/20 bg-[#121212]">
    <iframe src="https://embed.beatport.com/?id=${bpId}&type=${bpType}" width="100%" height="162" frameBorder="0" scrolling="no" style="border-radius:12px;"></iframe>
  </div>
</div>`;
            }
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
        setMediaModal({ show: false, type: 'image', url: '', urls: '', aspectRatio: 'auto', widgetId: undefined, cols: 4, alignment: 'center', width: 100 });
    };

    const generateSocialsHtml = (customName?: string, customColor?: string) => {
        const activeSocials = Object.entries(artistSocials).filter(([_, url]) => url && url.trim() !== '');
        if (activeSocials.length === 0) return '';

        const linksHtml = activeSocials.map(([platform, url]) => {
            return `<a href="${url.trim()}" target="_blank" data-platform="${platform}" class="artist-social-link" style="color: ${customColor || '#ff1241'}; border-color: ${customColor || '#ff1241'}">${platform}</a>`;
        }).join('');

        const displayName = (customName || artistNameLabel || "L'ARTISTE").toUpperCase();
        return `\n<div class="artist-socials-premium mt-12 pt-8 border-t border-white/10">\n<h3 class="text-xs font-black text-gray-500 uppercase tracking-[0.3em] mb-6" style="color: ${customColor || '#6b7280'}">SUIVEZ ${displayName}</h3>\n<div class="flex flex-wrap gap-4 uppercase font-black text-[10px] tracking-widest">\n    ${linksHtml}\n</div>\n</div>`;
    };


    const handleDelete = async () => {
        if (!id) return;
        setStatus('loading');
        try {
            const response = await fetch('/api/news/delete', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ id })
            });

            if (response.ok) {
                setStatus('success');
                setMessage('Article supprimé avec succès !');
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

    const handleSubmit = async (_publishNow = false, scheduleDate?: string) => {
        let finalDate = scheduleDate || ((_publishNow && !isEditing) ? new Date().toISOString().slice(0, 16) : date);

        const isInterviewVideo = type === 'Interview' && interviewSubtype === 'video';

        if (!title || !imageUrl || !finalDate) {
            setStatus('error');
            setMessage(`Veuillez remplir les champs obligatoires (Titre, Image, Date${!finalDate ? ' [VIDE]' : ''})`);
            return;
        }

        if (type === 'Interview' && !artistSocials.instagram) {
            setStatus('error');
            setMessage("L'Instagram de l'artiste est obligatoire pour une interview.");
            return;
        }

        // Removed mandatory check to allow user to publish freely

        if (isInterviewVideo && !youtubeId) {
            setStatus('error');
            setMessage('Le lien vidéo est obligatoire pour une interview vidéo');
            return;
        }

        if (isInterviewVideo && !interviewTheme) {
            setStatus('error');
            setMessage('Veuillez sélectionner un thème pour votre interview vidéo.');
            return;
        }

        // Check if artist socials are filled but artistNameLabel is empty
        const hasArtistSocials = Object.values(artistSocials).some(v => !!v.trim());
        if (hasArtistSocials && !artistNameLabel.trim()) {
            setStatus('error');
            setMessage("Veuillez indiquer le nom de l'artiste pour les réseaux sociaux (Champ 'Suivre :').");
            return;
        }


        if (type === 'Interview') {
            const hasEmptyVideoBlock = interviewQuestions.some(q => q.type === 'video' && !q.mediaUrl);
            if (hasEmptyVideoBlock) {
                setStatus('error');
                setMessage('Veuillez remplir le lien YouTube pour tous vos blocs vidéo.');
                return;
            }
        }

        if (!date) {
            setStatus('error');
            setMessage('Erreur: Date de publication manquante.');
            return;
        }

        setStatus('loading');
        setMessage('Publication en cours...');

        try {
            let finalContent = '';
            let finalCategory = category;
            const isFocus = activeTab === 'Focus';
            let finalImageUrl = imageUrl;

            // Normalisation de l'image (si on a un domaine ou un double préfixe)
            if (finalImageUrl && finalImageUrl.includes('dropsiders.fr/uploads/')) {
                finalImageUrl = finalImageUrl.split('dropsiders.fr')[1];
            }
            while (finalImageUrl && finalImageUrl.startsWith('/uploads/uploads/')) {
                finalImageUrl = finalImageUrl.substring(8);
            }
            if (finalImageUrl && finalImageUrl.startsWith('uploads/uploads/')) {
                finalImageUrl = '/' + finalImageUrl.substring(8);
            }

            if (isInterviewVideo) {
                finalCategory = interviewTheme === 'Interview' ? 'Interview Video' : `Interview Video - ${interviewTheme} `;
                if (!finalImageUrl && youtubeId) {
                    finalImageUrl = `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
                }
                // For Interview Video, we ALWAYS show the video regardless of the toggle
                const videoHtml = `<div class="youtube-player-widget w-full relative aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/5 my-12">
  <iframe src="https://www.youtube.com/embed/${youtubeId}?start=${videoStartTime || 0}&autoplay=${videoAutoplay ? 1 : 0}" class="absolute inset-0 w-full h-full" allowfullscreen allow="autoplay; encrypted-media"></iframe>
</div>`;

                finalContent = `<div class="article-section">
${videoHtml}
${generateSocialsHtml()}
</div>`;
            } else if (type === 'Interview' && interviewSubtype === 'written') {
                finalCategory = 'Interview';

                const widgetsHtml = widgets.map(w =>
                    `<div class="article-section text-widget-block">\n\n${w.content}\n\n</div>`
                ).join('\n\n');

                const interviewHtml = interviewQuestions.map(q => {
                    if (q.type === 'qa') {
                        return `<div class="article-section interview-qa-block" data-artist-name="${q.artistName || ''}" data-artist-color="${q.artistColor || '#ff1241'}">
    <p><strong style="color: #ff1241 !important">DROPSIDERS :</strong> ${q.question}</p>
    <p><strong style="color: ${q.artistColor || '#ff1241'} !important">${(q.artistName || '').toUpperCase()} :</strong> ${q.answer}</p>
</div>`;
                    } else if (q.type === 'image') {
                        return `<div class="article-section interview-image-block" data-media-url="${q.mediaUrl}">
<div class="image-premium-wrapper w-full relative rounded-3xl overflow-hidden shadow-2xl border border-white/5 my-12">
  <img src="${q.mediaUrl}" alt="Interview Image" class="w-full h-auto object-cover" />
</div>
</div>`;
                    } else if (q.type === 'video') {
                        return `<div class="article-section interview-video-block" data-media-url="${q.mediaUrl}">
<div class="youtube-player-widget w-full relative aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/5 my-12">
  <iframe src="https://www.youtube.com/embed/${q.mediaUrl}?start=0&autoplay=0" class="absolute inset-0 w-full h-full" allowfullscreen allow="autoplay; encrypted-media"></iframe>
</div>
</div>`;
                    } else if (q.type === 'spotify') {
                        const id = q.mediaUrl || '';
                        const type = id.includes('playlist') ? 'playlist' : id.includes('album') ? 'album' : 'track';
                        return `<div class="article-section interview-spotify-block my-8" data-media-url="${id}">
<div class="spotify-compact-widget bg-black/20 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
  <iframe src="https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0" width="100%" height="80" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" style="border-radius:12px;"></iframe>
</div>
</div>`;
                    }
                    return '';
                }).join('\n');

                const firstQA = interviewQuestions.find(q => q.type === 'qa');
                const mainName = firstQA?.artistName || '';
                const mainColor = firstQA?.artistColor || '#ff1241';

                finalContent = widgetsHtml + "\n" + interviewHtml + (interviewHtml || widgetsHtml ? `\n<div class="article-section">${generateSocialsHtml(artistNameLabel || mainName, mainColor)}</div>` : '');
            } else if (activeTab === 'Musique') {
                finalCategory = 'Musique';
                const musicTopHtml = musicItems.map((item) => {
                    const voteBtn = item.canVote ? `
  <div class="music-vote-container mt-6 flex justify-center">
    <button class="music-vote-button group flex items-center gap-3 px-8 py-4 bg-neon-cyan/10 border border-neon-cyan/30 rounded-full text-neon-cyan font-black uppercase tracking-widest text-[11px] hover:bg-neon-cyan/20 transition-all shadow-[0_0_20px_rgba(0,255,243,0.1)]" data-item-id="${item.id}" data-item-title="${item.title.replace(/"/g, '&quot;')}">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
      VOTER POUR CE MORCEAU
    </button>
  </div>` : '';

                    return `
<div class="music-top-item-premium mb-16 last:mb-0" data-media="${item.media}" data-player-type="${item.playerType || 'spotify'}">
  <div class="music-top-header flex items-center gap-6 mb-6">
    <div class="vinyl-wrapper w-24 h-24 lg:w-32 lg:h-32 shrink-0">${item.imageUrl ? `<img src="${item.imageUrl}" class="w-full h-full object-cover rounded-full shadow-2xl ring-4 ring-white/5" />` : `<div class="w-full h-full bg-black/40 rounded-full border border-white/10 flex items-center justify-center"><span class="text-[8px] font-black text-gray-700">MUSIC</span></div>`}</div>
    <div class="flex-1">
      <h3 class="text-2xl lg:text-4xl font-display font-black text-white uppercase italic tracking-tighter leading-none">${item.title}</h3>
      <div class="h-px w-24 bg-neon-red mt-3 opacity-50"></div>
    </div>
  </div>
  <div class="music-player-container rounded-[2rem] overflow-hidden border border-white/5 bg-black/20 shadow-2xl">
    ${renderMediaEmbed(item.media, item.playerType)}
  </div>
  ${item.description ? `
  <div class="music-item-description mt-6 px-4 py-3 bg-white/[0.03] border-l-2 border-neon-cyan rounded-r-xl">
    <p class="text-gray-400 text-sm italic">${standardizeContent(item.description)}</p>
  </div>` : ''}
  ${voteBtn}
</div>`;
                }).join('\n');

                const widgetsHtml = widgets.map(w =>
                    `<div class="article-section">${standardizeContent(w.content)}</div>`
                ).join('\n');

                finalContent = `
<div class="musique-article-premium">
  ${widgetsHtml}
  <div class="music-top-section mt-12 pt-12 border-t border-white/10">
    ${musicTopHtml}
  </div>
  ${youtubeId ? `<div class="article-section"><div class="youtube-player-widget w-full relative aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/5 my-12"><iframe src="https://www.youtube.com/embed/${youtubeId}" class="absolute inset-0 w-full h-full" allowfullscreen></iframe></div></div>` : ''}
  ${generateSocialsHtml()}
</div>`;
            } else {
                if (type === 'Interview') finalCategory = 'Interview';
                // Construct Final Content with HTML Wrappers for Automatic Styling
                finalContent = widgets.map(w =>
                    `<div class="article-section">\n\n${w.content}\n\n</div>`
                ).join('\n\n');

                const socialsHtml = generateSocialsHtml();
                if (socialsHtml) {
                    finalContent += `\n\n<div class="article-section">${socialsHtml}</div>`;
                }
            }

            const payload = {
                id: isEditing ? id : undefined,
                title: fixEncoding(title),
                location: fixEncoding(locationInput),
                country: fixEncoding(country),
                date: finalDate,
                image: finalImageUrl,
                category: finalCategory,
                content: fixEncoding(finalContent),
                youtubeId,
                showVideo,
                year: year || undefined,
                isFocus,
                isFeatured,
                author
            };

            const endpoint = isEditing ? '/api/news/update' : '/api/news/create';

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const data = await response.json();
                setStatus('success');
                setIsDirty(false);

                // Store data for Social Suite BEFORE resetting form
                setSocialSuiteData({
                    title: fixEncoding(title),
                    imageUrl: finalImageUrl,
                    type: type,
                    category: finalCategory,
                    articleId: isEditing ? (id || '') : (data.id || '')
                });
                setShowSocialSuite(true);

                setMessage(isEditing ? 'Article mis à jour avec succès !' : (finalDate > new Date().toISOString().slice(0, 16) ? 'Article programmé avec succès !' : 'Article publié avec succès !'));
                window.scrollTo({ top: 0, behavior: 'smooth' });

                if (!isEditing) {
                    // Reset to TRUE initial state
                    setTitle('');
                    setLocationInput('');
                    setCountry('');
                    setWidgets(isInterviewVideo ? [] : [
                        { id: 'initial-' + Math.random().toString(36).substr(2, 9), content: '<h2 class="premium-section-title">TITRE DE L\'ARTICLE</h2>' }
                    ]);
                    setImageUrl('');
                    setYoutubeId('');
                    setYear('');
                    setMusicItems([{ id: Math.random().toString(36).substr(2, 9), title: '', media: '', imageUrl: '', playerType: 'spotify', description: '', canVote: true }]);
                    setArtistNameLabel('');
                    setArtistSocials({
                        website: '', instagram: '', tiktok: '', youtube: '', facebook: '', x: '', spotify: '', soundcloud: '', beatport: ''
                    });
                    setInterviewQuestions([
                        { id: Math.random().toString(36).substr(2, 9), type: 'qa', artistName: '', artistColor: '#ff1241', question: '', answer: '' }
                    ]);
                    setIsFeatured(false);
                    setIsAuthorConfirmed(false);
                    setIsDirty(false); // Reset dirty state after successful publication
                    setActiveTab('News');
                    setShowVideo(type !== 'Interview');
                    setDate('');
                } else {
                    // If editing, redirect back to management after a short delay
                    setIsDirty(false); // Reset dirty state before redirect
                    setTimeout(() => navigate('/admin/manage'), 2000);
                }
            } else {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e: any) {
                    errorData = { error: `Erreur ${response.status}: ${response.statusText}` };
                }
                setStatus('error');
                setMessage(errorData.error || 'Erreur lors de la publication');
            }
        } catch (e: any) {
            setStatus('error');
            setMessage('Erreur de connexion au serveur');
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

    const handleEditorFocus = (widgetId: string) => {
        setActiveWidgetId(widgetId);
        if (window.innerWidth < 768) {
            setIsMobileEditorActive(true);
            document.body.style.overflow = 'hidden';
        }
    };

    const closeMobileEditor = () => {
        setIsMobileEditorActive(false);
        setActiveWidgetId(null);
        document.body.style.overflow = 'auto';
    };

    return (
        <div className={`min-h-screen bg-[#050505] relative overflow-hidden transition-all duration-500 ${isMobileEditorActive ? 'py-0 px-0' : 'py-8 md:py-20 px-0 md:px-8'}`}>
            {/* Ambient Background Glows */}
            {!isMobileEditorActive && (
                <>
                    <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-neon-red/5 rounded-full blur-[120px] pointer-events-none animate-pulse" />
                    <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-neon-cyan/5 rounded-full blur-[120px] pointer-events-none animate-pulse [animation-delay:2s]" />
                    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
                </>
            )}

            <div className={`relative z-10 max-w-7xl mx-auto ${isMobileEditorActive ? 'px-0' : 'px-4 md:px-0'}`}>
                {!isMobileEditorActive && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12"
                    >
                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => navigate(-1)}
                                className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all text-white group backdrop-blur-md"
                            >
                                <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                            </button>
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border backdrop-blur-md ${isEditing ? 'bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan' : 'bg-neon-green/10 border-neon-green/30 text-neon-green'
                                        }`}>
                                        {isEditing ? 'Mode Édition' : 'Nouvel Article'}
                                    </span>
                                    <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full backdrop-blur-md">
                                        <User className="w-3 h-3 text-gray-500" />
                                        <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">
                                            Éditeur : <span style={getAuthorTextStyle(((editorsData as any[]).find(e => e.name === author)?.username || author || '').toLowerCase())}>{author}</span>
                                        </span>
                                        {isAuthorConfirmed ? (
                                            <CheckCircle2 className="w-3 h-3 text-neon-green ml-1" />
                                        ) : (
                                            <div className="w-1.5 h-1.5 rounded-full bg-neon-red animate-pulse ml-1" />
                                        )}
                                    </div>
                                </div>
                                <h1 className="text-4xl md:text-6xl font-display font-black text-white uppercase italic tracking-tighter leading-none">
                                    {isEditing ? 'Modifier' : 'Créer'} <span className="text-neon-red drop-shadow-[0_0_15px_rgba(255,18,65,0.3)]">{type === 'Interview' ? 'une Interview' : activeTab === 'Musique' ? 'un article Musique' : 'une Actualité'}</span>
                                </h1>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                            <button
                                type="button"
                                onClick={() => handleSubmit(true)}
                                disabled={status === 'loading'}
                                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all shadow-2xl group ${status === 'loading'
                                    ? 'bg-gray-600/50 cursor-not-allowed opacity-50'
                                    : 'bg-white text-black hover:scale-105 active:scale-95'
                                    }`}
                            >
                                <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                <span>{status === 'loading' ? 'EN COURS...' : (isEditing ? 'METTRE À JOUR' : 'PUBLIER')}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowScheduleModal(true)}
                                disabled={status === 'loading'}
                                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all border backdrop-blur-md ${status === 'loading'
                                    ? 'bg-gray-600/50 cursor-not-allowed opacity-50'
                                    : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20 hover:scale-105 active:scale-95'
                                    }`}
                            >
                                <Calendar className="w-4 h-4" />
                                <span>PROGRAMMER</span>
                            </button>
                            {isEditing && (
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className={`flex items-center justify-center gap-2 px-5 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all border bg-red-500/5 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500`}
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span className="hidden md:inline">SUPPRIMER</span>
                                </button>
                            )}
                            <StyledCheckbox
                                checked={isFeatured}
                                onChange={setIsFeatured}
                                label={isFeatured ? 'À LA UNE' : 'UNE'}
                                icon={Star}
                                colorClass="neon-yellow"
                            />
                        </div>
                    </motion.div>
                )}

                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                    className={`bg-white/[0.03] backdrop-blur-2xl transition-all duration-500 ${isMobileEditorActive ? 'min-h-screen rounded-none border-0' : 'rounded-[2.5rem] border border-white/5 shadow-[0_25px_100px_-25px_rgba(0,0,0,0.5)]'} p-4 md:p-10`}
                >
                    {/* Tabs Selector - Only for News */}
                    {type === 'News' && (
                        <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 mb-8 w-full md:w-fit mx-auto overflow-x-auto">
                            <button
                                onClick={() => setActiveTab('News')}
                                className={`flex items-center gap-2 px-4 md:px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-[9px] md:text-[10px] transition-all whitespace-nowrap ${activeTab === 'News' ? 'bg-neon-red text-white shadow-[0_0_15px_rgba(255,18,65,0.4)]' : 'text-gray-500 hover:text-white'
                                    }`}
                            >
                                <FileText className="w-3.5 h-3.5" /> News
                            </button>
                            <button
                                onClick={() => setActiveTab('Musique')}
                                className={`flex items-center gap-2 px-4 md:px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-[9px] md:text-[10px] transition-all whitespace-nowrap ${activeTab === 'Musique' ? 'bg-neon-cyan text-black shadow-[0_0_15px_rgba(0,255,243,0.4)]' : 'text-gray-500 hover:text-white'
                                    }`}
                            >
                                <Music className="w-3.5 h-3.5" /> Musique
                            </button>
                            <button
                                onClick={() => setActiveTab('Focus')}
                                className={`flex items-center gap-2 px-4 md:px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-[9px] md:text-[10px] transition-all whitespace-nowrap ${activeTab === 'Focus' ? 'bg-neon-purple text-white shadow-[0_0_15px_rgba(189,0,255,0.4)]' : 'text-gray-500 hover:text-white'
                                    }`}
                            >
                                <Star className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Focus de la semaine</span><span className="sm:hidden">Focus</span>
                            </button>
                        </div>
                    )}

                    {type === 'Interview' && (
                        <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 mb-8 w-full md:w-fit mx-auto overflow-x-auto">
                            <button
                                onClick={() => setInterviewSubtype('written')}
                                className={`flex items-center gap-2 px-4 md:px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-[9px] md:text-[10px] transition-all whitespace-nowrap ${interviewSubtype === 'written' ? 'bg-neon-purple text-white shadow-[0_0_15px_rgba(189,0,255,0.4)]' : 'text-gray-500 hover:text-white'
                                    }`}
                            >
                                <FileText className="w-3.5 h-3.5" /> Interview Écrite
                            </button>
                            <button
                                onClick={() => setInterviewSubtype('video')}
                                className={`flex items-center gap-2 px-4 md:px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-[9px] md:text-[10px] transition-all whitespace-nowrap ${interviewSubtype === 'video' ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]' : 'text-gray-500 hover:text-white'
                                    }`}
                            >
                                <Youtube className="w-3.5 h-3.5" /> Interview Vidéo
                            </button>
                        </div>
                    )}

                    {type === 'Interview' && interviewSubtype === 'video' && (
                        <div className="flex flex-col gap-4 mb-8">
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] text-center">
                                Thème de l'Interview Vidéo <span className="text-neon-red">*</span>
                            </label>
                            <div className="flex flex-wrap justify-center gap-2">
                                {interviewThemes.map(theme => (
                                    <button
                                        key={theme}
                                        type="button"
                                        onClick={() => setInterviewTheme(theme)}
                                        className={`px-4 py-2.5 rounded-xl font-bold uppercase tracking-widest text-[9px] transition-all border ${interviewTheme === theme
                                            ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan shadow-[0_0_15px_rgba(0,255,243,0.3)]'
                                            : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20 hover:text-white'
                                            }`}
                                    >
                                        {theme}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}



                    <div className="space-y-6">



                        {/* Status Message */}
                        {status !== 'idle' && (
                            <div className={`p-4 rounded-xl flex flex-col gap-3 ${status === 'error' ? 'bg-red-500/10 text-red-500' :
                                status === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'
                                }`}>
                                <div className="flex items-center gap-3">
                                    {status === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                    <p className="font-bold uppercase tracking-wider text-xs">{message}</p>
                                    {status === 'success' && (
                                        <button
                                            onClick={() => setShowSocialSuite(true)}
                                            className="ml-auto px-3 py-1 bg-green-500/20 hover:bg-green-500 hover:text-white border border-green-500/40 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                                        >
                                            REVOIR SOCIALS
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        <AnimatePresence>
                            {showSocialSuite && socialSuiteData && (
                                <SocialSuite
                                    title={socialSuiteData.title}
                                    imageUrl={socialSuiteData.imageUrl}
                                    onClose={() => setShowSocialSuite(false)}
                                />
                            )}
                        </AnimatePresence>

                        {/* Author Selector */}
                        <div data-section="editor-selection" className="space-y-6">
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <User className="w-3 h-3 text-neon-cyan" /> Choisir l'Éditeur <span className="text-neon-red">*</span>
                            </label>

                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
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
                                            className={`relative group p-4 rounded-3xl border transition-all duration-300 flex flex-col items-center gap-3 active:scale-95 ${isSelected
                                                ? 'bg-white/[0.05] border-white/20'
                                                : 'bg-black/20 border-white/5 hover:border-white/10 grayscale hover:grayscale-0'
                                                }`}
                                        >
                                            <div
                                                className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-black uppercase text-white shadow-2xl transition-all duration-500 ${isSelected ? 'scale-110 shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'group-hover:scale-105'}`}
                                                style={{
                                                    background: `linear-gradient(135deg, ${editorColor}, #000)`,
                                                    boxShadow: isSelected ? `0 0 30px ${editorColor}55` : 'none'
                                                }}
                                            >
                                                {editor.username.substring(0, 1)}
                                            </div>
                                            <div className="text-center">
                                                <p className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-white' : 'text-white/30'}`}>
                                                    {editor.name}
                                                </p>
                                                <p className="text-[8px] font-bold text-white/20 uppercase tracking-tighter">@{editor.username}</p>
                                            </div>
                                            {isSelected && (
                                                <motion.div
                                                    layoutId="editor-selector-glow"
                                                    className="absolute inset-0 rounded-3xl border-2 border-white/20 pointer-events-none"
                                                    style={{ borderColor: `${editorColor}33` }}
                                                />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <StyledCheckbox
                                checked={isAuthorConfirmed}
                                onChange={setIsAuthorConfirmed}
                                label="Confirmer l'Éditeur"
                                sublabel={`Je certifie que ${author} est bien l'auteur de ce contenu`}
                                icon={CheckCircle2}
                                colorClass="neon-cyan"
                            />
                        </div>




                        {/* Metadata Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="md:col-span-2 lg:col-span-3">
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Titre <span className="text-neon-red">*</span></label>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 pr-12 text-white focus:border-neon-cyan outline-none"
                                        placeholder="Titre de l'article"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setTitle(fixEncoding(title))}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-white/5 hover:bg-neon-red/20 text-gray-500 hover:text-neon-red rounded-lg transition-all"
                                        title="Réparer les caractères"
                                    >
                                        <Wand2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>



                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {activeTab !== 'Musique' && (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Ville</label>
                                        <div className="relative group">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-cyan transition-colors" />
                                            <input
                                                type="text"
                                                value={locationInput}
                                                onChange={(e) => setLocationInput(e.target.value.toUpperCase())}
                                                onFocus={() => locationInput.length >= 1 && setShowSuggestions(true)}
                                                placeholder="Ex: Boom"
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
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
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
                                        <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Pays</label>
                                        <div className="relative group">
                                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-cyan transition-colors" />
                                            <input
                                                type="text"
                                                value={country}
                                                onChange={(e) => setCountry(e.target.value.toUpperCase())}
                                                placeholder="Ex: France"
                                                className={`w-full bg-black/20 border rounded-xl py-4 pl-12 pr-12 text-white placeholder-gray-600 focus:outline-none focus:ring-1 transition-all ${isAutoLocating ? 'border-neon-cyan animate-pulse' : 'border-white/10 focus:border-neon-cyan focus:ring-neon-cyan'}`}
                                            />
                                            {isAutoLocating && (
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                    <div className="w-4 h-4 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin"></div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Année</label>
                                <div className="relative group">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-cyan transition-colors" />
                                    <input
                                        type="number"
                                        value={year}
                                        onChange={(e) => setYear(e.target.value)}
                                        placeholder="Ex: 2024"
                                        min="1900"
                                        max="2100"
                                        className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all"
                                    />
                                </div>
                            </div>
                        </div>


                        {/* Image & Youtube */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4" /> Image <span className="text-neon-red">*</span>
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={imageUrl}
                                        onChange={(e) => setImageUrl(e.target.value)}
                                        className="flex-1 bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-neon-cyan outline-none"
                                        placeholder="https://..."
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setUploadTarget({ type: 'main', initialImage: imageUrl });
                                            setShowUploadModal(true);
                                        }}
                                        className="px-6 py-4 bg-neon-red/20 border border-neon-red/50 text-neon-red rounded-xl font-bold uppercase tracking-wider hover:bg-neon-red/30 transition-all cursor-pointer flex flex-col items-center justify-center gap-1 min-w-[120px]"
                                    >
                                        Upload
                                    </button>
                                    {imageUrl && (
                                        <button
                                            type="button"
                                            onClick={() => setImageUrl('')}
                                            className="p-3 bg-red-600/10 border border-red-600/20 text-red-600 rounded-xl hover:bg-red-600/20 transition-all flex items-center justify-center h-full"
                                            title="Supprimer l'image"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    )}

                                </div>
                            </div>
                            {activeTab !== 'Musique' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                            <Youtube className="w-4 h-4" /> {type === 'Interview' && interviewSubtype === 'video' ? 'Lien Vidéo (ID ou URL)' : 'Vidéo de l\'article'}
                                            {type === 'Interview' && interviewSubtype === 'video' && <span className="text-neon-red">*</span>}
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <StyledCheckbox
                                                checked={showVideo}
                                                onChange={setShowVideo}
                                                label="Activer"
                                                colorClass="neon-red"
                                            />
                                            {youtubeId && (
                                                <button
                                                    type="button"
                                                    onClick={() => setYoutubeId('')}
                                                    className="p-1 text-gray-500 hover:text-red-500 transition-colors"
                                                    title="Supprimer la vidéo"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {showVideo && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="space-y-4"
                                        >
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={youtubeId}
                                                    onChange={async (e) => {
                                                        let val = e.target.value;
                                                        if (val.includes('youtube.com/watch?v=')) {
                                                            val = val.split('v=')[1].split('&')[0];
                                                        } else if (val.includes('youtu.be/')) {
                                                            val = val.split('youtu.be/')[1].split('?')[0];
                                                        } else if (val.includes('youtube.com/embed/')) {
                                                            val = val.split('youtube.com/embed/')[1].split('?')[0];
                                                        }
                                                        setYoutubeId(val);

                                                        // Auto-fetch info
                                                        if (val.length === 11) {
                                                            try {
                                                                const resp = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${val}`);
                                                                const data = await resp.json();
                                                                if (data.title) {
                                                                    const clean = data.title
                                                                        .replace(/\(Official Video\)/gi, '')
                                                                        .replace(/\[Official Video\]/gi, '')
                                                                        .replace(/\(Official Music Video\)/gi, '')
                                                                        .replace(/\[Official Music Video\]/gi, '')
                                                                        .replace(/Official Video/gi, '')
                                                                        .replace(/Official Music Video/gi, '')
                                                                        .replace(/\(Original Mix\)/gi, '')
                                                                        .replace(/\[Original Mix\]/gi, '')
                                                                        .replace(/Original Mix/gi, '')
                                                                        .trim();

                                                                    const suggestions = [clean];
                                                                    if (clean.includes(' - ')) {
                                                                        const parts = clean.split(' - ');
                                                                        if (parts.length === 2) {
                                                                            suggestions.push(`${parts[1].trim()} - ${parts[0].trim()}`);
                                                                            suggestions.push(clean.toUpperCase());
                                                                        }
                                                                    } else {
                                                                        suggestions.push(clean.toUpperCase());
                                                                        suggestions.push(clean + " - EXCLUSIVE");
                                                                    }
                                                                    setSuggestedTitles(suggestions.slice(0, 3));
                                                                    if (!title) setTitle(clean);
                                                                }
                                                            } catch (err) {
                                                                console.error("YT Fetch error", err);
                                                            }
                                                        }
                                                    }}
                                                    className="flex-1 bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-neon-cyan outline-none"
                                                    placeholder="ID ou URL YouTube"
                                                />
                                                <div className="flex gap-1 items-center">
                                                    <StyledCheckbox
                                                        checked={videoAutoplay}
                                                        onChange={setVideoAutoplay}
                                                        label="Autoplay"
                                                        colorClass="neon-green"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => { setVideoStartTime(90); setVideoAutoplay(true); }}
                                                        className={`px-3 py-2 rounded-lg border text-[8px] font-bold uppercase transition-all ${videoStartTime === 90 ? 'bg-neon-red border-neon-red text-white' : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'}`}
                                                    >1:30</button>
                                                    <button
                                                        type="button"
                                                        onClick={() => { setVideoStartTime(105); setVideoAutoplay(true); }}
                                                        className={`px-3 py-2 rounded-lg border text-[8px] font-bold uppercase transition-all ${videoStartTime === 105 ? 'bg-neon-red border-neon-red text-white' : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'}`}
                                                    >1:45</button>
                                                </div>
                                            </div>

                                            {suggestedTitles.length > 0 && (
                                                <div className="flex flex-wrap gap-2 pt-2">
                                                    <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest w-full">Suggestions de Titre :</span>
                                                    {suggestedTitles.map((st, i) => (
                                                        <button
                                                            key={i}
                                                            type="button"
                                                            onClick={() => setTitle(st)}
                                                            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[9px] font-bold text-gray-400 hover:text-neon-cyan hover:border-neon-cyan transition-all"
                                                        >
                                                            {st}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {!(type === 'Interview' && interviewSubtype === 'video') && (
                                                <p className="text-[10px] text-gray-500 italic">S'affichera tout en bas de l'article</p>
                                            )}
                                        </motion.div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ARTIST SOCIALS (Everywhere except Musique) */}
                    {activeTab !== 'Musique' && (
                        <div className="pt-8 border-t border-white/10 mt-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    <Link2 className="w-4 h-4 text-neon-cyan" /> Réseaux Sociaux de l'Artiste
                                </label>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-black text-gray-500 uppercase">Suivre : {Object.values(artistSocials).some(v => v.trim()) && <span className="text-neon-red">*</span>}</span>
                                    <input
                                        type="text"
                                        value={artistNameLabel}
                                        onChange={(e) => setArtistNameLabel(e.target.value)}
                                        className={`bg-black/40 border ${Object.values(artistSocials).some(v => v.trim()) && !artistNameLabel.trim() ? 'border-neon-red/50 shadow-[0_0_10px_rgba(255,0,81,0.1)]' : 'border-white/10'} rounded-lg px-3 py-1.5 text-white text-[10px] outline-none focus:border-neon-cyan w-40 font-bold uppercase tracking-widest transition-all`}
                                        placeholder="NOM DE L'ARTISTE"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    { id: 'website', name: 'Site Web', icon: Globe, color: 'text-white' },
                                    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'text-pink-500' },
                                    { id: 'tiktok', name: 'TikTok', icon: TikTokIcon, color: 'text-white' },
                                    { id: 'snapchat', name: 'Snapchat', icon: SnapchatIcon, color: 'text-yellow-400' },
                                    { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'text-red-500' },
                                    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'text-blue-600' },
                                    { id: 'x', name: 'X / Twitter', icon: XIcon, color: 'text-white' },
                                    { id: 'spotify', name: 'Spotify', icon: SpotifyIcon, color: 'text-green-500' },
                                    { id: 'soundcloud', name: 'SoundCloud', icon: SoundCloudIcon, color: 'text-orange-500' },
                                    { id: 'beatport', name: 'Beatport', icon: BeatportIcon, color: 'text-green-400' }
                                ].map((social) => (
                                    <div key={social.id}>
                                        <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">
                                            {social.name} {type === 'Interview' && social.id === 'instagram' && <span className="text-neon-red">*</span>}
                                        </label>
                                        <div className="relative group">
                                            <div className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${social.color} opacity-50 group-hover:opacity-100 transition-opacity`}>
                                                <social.icon className="w-full h-full" />
                                            </div>
                                            <input
                                                type="text"
                                                value={(artistSocials as any)[social.id]}
                                                onChange={(e) => setArtistSocials({ ...artistSocials, [social.id]: e.target.value })}
                                                className="w-full bg-black/20 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white text-[11px] focus:border-neon-red outline-none transition-all"
                                                placeholder="URL Artiste..."
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                        </div>
                    )}



                    {/* WIDGET EDITOR SECTION (Always available to add flexibility) */}
                    {(activeTab === 'News' || activeTab === 'Focus' || activeTab === 'Musique' || type === 'Interview') && (
                        <div className="pt-8 border-t border-white/10">
                            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 ${isMobileEditorActive ? 'hidden' : ''}`}>
                                <label className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-neon-cyan" /> WIDGETS
                                </label>
                                <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0">
                                    {!(type === 'Interview' && interviewSubtype === 'video') && (
                                        <button
                                            onClick={() => {
                                                const id = Math.random().toString(36).substr(2, 9);
                                                setWidgets([...widgets, { id, content: '<h2 class="premium-section-title">MON TITRE ICI</h2>' }]);
                                            }}
                                            className="whitespace-nowrap flex items-center gap-2 px-3 py-2 bg-neon-red/10 border border-neon-red/30 text-neon-red rounded-full hover:bg-neon-red/20 transition-all font-bold uppercase tracking-widest text-[9px]"
                                        >
                                            <Plus className="w-3 h-3" /> Titre
                                        </button>
                                    )}
                                    <button
                                        onClick={() => addWidget()}
                                        className="whitespace-nowrap flex items-center gap-2 px-3 py-2 bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan rounded-full hover:bg-neon-cyan/20 transition-all font-bold uppercase tracking-widest text-[9px]"
                                    >
                                        <Plus className="w-3 h-3" /> Texte
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMediaModal({ show: true, type: 'video', url: '', urls: '' })}
                                        className="whitespace-nowrap flex items-center gap-2 px-3 py-2 bg-red-600/20 border border-red-600/30 text-red-600 rounded-full hover:bg-red-600/30 transition-all font-bold uppercase tracking-widest text-[9px]"
                                    >
                                        <Youtube className="w-3 h-3" /> Vidéo
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setUploadTarget({
                                                type: 'widget',
                                                initialImage: ''
                                            });
                                            setShowUploadModal(true);
                                        }}
                                        className="whitespace-nowrap flex items-center gap-2 px-3 py-2 bg-neon-cyan/20 border border-neon-cyan/30 text-neon-cyan rounded-full hover:bg-neon-cyan/30 transition-all font-bold uppercase tracking-widest text-[9px]"
                                    >
                                        <Upload className="w-3 h-3" /> Upload
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDuoModal({ show: true, urls: ['', ''], widgetIndex: undefined, widgetId: undefined, aspectRatio: '3/4' })}
                                        className="whitespace-nowrap flex items-center gap-2 px-3 py-2 bg-neon-purple/20 border border-neon-purple/30 text-neon-purple rounded-full hover:bg-neon-purple/30 transition-all font-bold uppercase tracking-widest text-[9px]"
                                    >
                                        <Columns className="w-3 h-3" /> Duo
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMediaModal({ show: true, type: 'spotify', url: '', urls: '' })}
                                        className="whitespace-nowrap flex items-center gap-2 px-3 py-2 bg-[#1DB954]/20 border border-[#1DB954]/30 text-[#1DB954] rounded-full hover:bg-[#1DB954]/30 transition-all font-bold uppercase tracking-widest text-[9px]"
                                    >
                                        <SpotifyIcon className="w-3.5 h-3.5" /> Spotify
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMediaModal({ show: true, type: 'beatport', url: '', urls: '' })}
                                        className="whitespace-nowrap flex items-center gap-2 px-3 py-2 bg-[#02FF95]/20 border border-[#02FF95]/30 text-[#02FF95] rounded-full hover:bg-[#02FF95]/30 transition-all font-bold uppercase tracking-widest text-[9px]"
                                    >
                                        <BeatportIcon className="w-3.5 h-3.5" /> Beatport
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setMediaModal({ show: true, type: 'beatport', url: '', urls: '' })}
                                        className="whitespace-nowrap flex items-center gap-2 px-3 py-2 bg-[#02FF95]/20 border border-[#02FF95]/30 text-[#02FF95] rounded-full hover:bg-[#02FF95]/30 transition-all font-bold uppercase tracking-widest text-[9px]"
                                    >
                                        <Music className="w-3 h-3" /> Beatport
                                    </button>
                                </div>
                            </div>

                            <div className={`space-y-4 ${isMobileEditorActive ? 'pb-32' : ''}`}>
                                {widgets.map((widget, index) => (
                                    <div
                                        key={widget.id}
                                        className={`space-y-4 transition-all duration-500 ${isMobileEditorActive && activeWidgetId !== widget.id ? 'hidden' : ''}`}
                                    >
                                        <div className={`relative group transition-all duration-500 ${isMobileEditorActive ? 'bg-transparent border-0 p-0 shadow-none' : 'bg-white/5 border border-white/10 rounded-2xl p-3 md:p-6 hover:border-white/20 shadow-xl'}`}>
                                            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 ${isMobileEditorActive ? 'hidden' : ''}`}>
                                                <div className="flex items-center gap-3">
                                                    <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-black text-gray-400">
                                                        {index + 1}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                                        {widget.content.startsWith('<h2') ? 'Titre' :
                                                            widget.content.includes('duo-photos-premium') ? 'Duo Photos' :
                                                                widget.content.includes('image-premium-wrapper') ? 'Image' :
                                                                    widget.content.includes('gallery-premium-grid') ? 'Galerie' : 
                                                                        widget.content.includes('spotify-compact-widget') ? 'Spotify' : 'Texte'}
                                                    </span>

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
                                                <div className="flex flex-wrap items-center gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        type="button"
                                                        onMouseDown={e => e.preventDefault()}
                                                        onClick={() => {
                                                            const activeEl = document.activeElement as HTMLElement;
                                                            const isVisualEditor = activeEl && activeEl.classList.contains('visual-editor-content');
                                                            if (isVisualEditor) {
                                                                insertLinkToActiveWidget(widget.id);
                                                            } else {
                                                                const url = prompt('URL du lien :');
                                                                if (url) {
                                                                    const text = prompt('Texte du lien (ou vide pour l\'URL) :');
                                                                    const link = `<a href="${url}" target="_blank" class="text-neon-cyan hover:underline">${text || url}</a>`;
                                                                    updateWidget(widget.id, widget.content + ' ' + link);
                                                                }
                                                            }
                                                        }}
                                                        className="p-2 text-gray-500 hover:text-neon-cyan hover:bg-neon-cyan/10 rounded-lg transition-colors flex items-center gap-2 text-[10px] font-bold uppercase"
                                                        title="Ajouter un lien"
                                                    >
                                                        <Link2 className="w-4 h-4" /> <span className="hidden sm:inline">Lien</span>
                                                    </button>
                                                    {(!widget.content.includes('image-premium-wrapper') && !widget.content.includes('gallery-premium-grid') && !widget.content.includes('youtube-player-widget')) && (
                                                        <>
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
                                                                <button
                                                                    type="button"
                                                                    onMouseDown={e => e.preventDefault()}
                                                                    onClick={() => applyFormat('formatBlock', 'blockquote')}
                                                                    className="p-1.5 text-gray-500 hover:text-white"
                                                                    title="Citation"
                                                                >
                                                                    <Quote className="w-4 h-4" />
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
                                                        onClick={() => fixWidgetEncoding(widget.id)}
                                                        className="p-2 text-gray-500 hover:text-neon-red hover:bg-neon-red/10 rounded-lg transition-colors"
                                                        title="Réparer les caractères"
                                                    >
                                                        <Wand2 className="w-4 h-4" />
                                                    </button>
                                                    {(widget.content.includes('youtube-player-widget') || widget.content.includes('image-premium-wrapper')) && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (widget.content.includes('duo-photos-premium')) {
                                                                    const extracted = extractDuoUrls(widget.content);
                                                                    setDuoModal({
                                                                        show: true,
                                                                        urls: extracted.urls,
                                                                        widgetIndex: undefined,
                                                                        widgetId: widget.id,
                                                                        aspectRatio: extracted.ratio
                                                                    });
                                                                 } else if (widget.content.includes('video-group-premium') || widget.content.includes('premium-video-group')) {
                                                                     const extracted = extractVideoUrls(widget.content);
                                                                     setVideoGroupModal({
                                                                         show: true,
                                                                         rows: [{ count: extracted.count, videos: extracted.urls.map(u => ({ url: u, title: '' })) }],
                                                                         title: '',
                                                                         widgetId: widget.id
                                                                     });
                                                                } else if (widget.content.includes('youtube-player-widget')) {
                                                                    const title = prompt('Artiste de la vidéo');
                                                                    const val = prompt('Nouvelle URL YouTube ou ID');
                                                                    if (!val) return;
                                                                    let id = val;
                                                                    if (val.includes('youtube.com/watch?v=')) {
                                                                        id = val.split('v=')[1].split('&')[0];
                                                                    } else if (val.includes('youtu.be/')) {
                                                                        id = val.split('youtu.be/')[1];
                                                                    }
                                                                     const titleHtml = title?.trim() ? `<div class="text-gray-400 text-[10px] font-black uppercase mb-3 tracking-[0.2em]">${title.toUpperCase()}</div>` : '';
                                                                     const videoWidget = `<div class="youtube-player-widget w-full my-12">\n  ${titleHtml}\n  <div class="relative aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/5">\n    <iframe src="https://www.youtube-nocookie.com/embed/${id}?enablejsapi=1&origin=${window.location.origin}" className="absolute inset-0 w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" id="yt-player-${id}"></iframe>\n  </div>\n</div>`;
                                                                    updateWidget(widget.id, videoWidget);
                                                                } else if (widget.content.includes('image-premium-wrapper')) {
                                                                    const { url, ratio, alignment, width } = extractSingleImageUrlAndRatio(widget.content);
                                                                    setMediaModal({
                                                                        show: true,
                                                                        type: 'image',
                                                                        url: url,
                                                                        urls: '',
                                                                        aspectRatio: ratio,
                                                                        alignment,
                                                                        width,
                                                                        widgetId: widget.id
                                                                    });
                                                                }
                                                            }}
                                                            className={`p-2 text-gray-500 hover:text-neon-cyan hover:bg-neon-cyan/10 rounded-lg transition-colors ${isMobileEditorActive ? 'hidden' : ''}`}
                                                            title="Éditer le widget"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {widgets.length > 1 && (
                                                        <button
                                                            onClick={() => removeWidget(widget.id)}
                                                            className={`p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors ${isMobileEditorActive ? 'hidden' : ''}`}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Mobile Active Header */}
                                            {isMobileEditorActive && activeWidgetId === widget.id && (
                                                <div className="flex items-center justify-between p-4 mb-4 bg-white/5 border-b border-white/10">
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={closeMobileEditor}
                                                            className="p-2 bg-white/10 rounded-xl text-white"
                                                        >
                                                            <ArrowLeft className="w-5 h-5" />
                                                        </button>
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-neon-cyan">Édition Focus</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => fixWidgetEncoding(widget.id)}
                                                            className="p-2 text-gray-400 hover:text-white"
                                                            title="Réparer"
                                                        >
                                                            <Wand2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={closeMobileEditor}
                                                            className="px-4 py-2 bg-neon-green/20 text-neon-green border border-neon-green/30 rounded-xl text-[10px] font-black uppercase tracking-widest"
                                                        >
                                                            Terminer
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Le rendu final est désormais directement éditable au-dessus */}

                                            {/* Title Block Editor */}
                                            {widget.content.startsWith('<h2 class="premium-section-title">') && widget.content.endsWith('</h2>') ? (
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
                                                    <div className={`admin-editor-container bg-white/[0.02] border transition-all duration-500 ${isMobileEditorActive ? 'min-h-[80vh] border-0 rounded-none bg-black/40' : 'border-white/5 rounded-3xl overflow-hidden shadow-2xl'}`}>
                                                        <VisualEditor
                                                            content={widget.content}
                                                            onChange={(html) => updateWidget(widget.id, html)}
                                                            className={`visual-editor-content outline-none transition-all article-body-premium ${isMobileEditorActive ? 'p-6 pb-40 text-lg leading-relaxed' : 'p-4 md:p-8 min-h-[150px] text-sm md:text-base text-white focus:bg-white/[0.04]'}`}
                                                            widgetId={widget.id}
                                                            onFocus={(e) => {
                                                                if (e.currentTarget.innerHTML === '<br>') e.currentTarget.innerHTML = '';
                                                                handleEditorFocus(widget.id);
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
                                            )}
                                        </div>

                                        {/* Mobile Bottom Toolbar */}
                                        <AnimatePresence>
                                            {isMobileEditorActive && activeWidgetId === widget.id && (
                                                <MobileToolbar
                                                    widgetId={widget.id}
                                                    widgets={widgets}
                                                    updateWidget={updateWidget}
                                                    applyFormat={applyFormat}
                                                    toggleWidgetStyle={toggleWidgetStyle}
                                                    applyColorToSelection={applyColorToSelection}
                                                    addWidget={() => {
                                                        const newId = Math.random().toString(36).substr(2, 9);
                                                        const newWidgets = [...widgets];
                                                        newWidgets.splice(index + 1, 0, { id: newId, content: '<p><br></p>' });
                                                        setWidgets(newWidgets);
                                                        setTimeout(() => handleEditorFocus(newId), 100);
                                                    }}
                                                />
                                            )}
                                        </AnimatePresence>

                                        {/* Add Button BETWEEN widgets */}
                                        <div className="flex items-center gap-4 py-2 group/adder">
                                            <div className="h-px flex-1 bg-white/10 group-hover/adder:bg-neon-cyan/30 transition-colors" />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => addWidget(index, '<h2 class="premium-section-title">NOUVEAU TITRE</h2>')}
                                                    className="w-8 h-8 rounded-full bg-neon-red/10 border border-neon-red/30 text-neon-red flex items-center justify-center hover:bg-neon-red/20 transition-all"
                                                    title="Ajouter un titre ici"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                                <button
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
                                                    className="w-8 h-8 rounded-full bg-neon-red/10 border border-neon-red/30 text-neon-red flex items-center justify-center hover:bg-neon-red/20 transition-all"
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
                                                    onClick={() => setVideoGroupModal({ show: true, title: '', rows: [{ count: 3, videos: [{ url: '', title: '' }, { url: '', title: '' }, { url: '', title: '' }] }], widgetIndex: index })}
                                                    className="w-8 h-8 rounded-full bg-red-600/10 border border-red-600/30 text-red-600 flex items-center justify-center hover:bg-red-600/20 transition-all font-bold text-[10px]"
                                                    title="Ajouter un groupe de vidéos (ligne de 1, 2 ou 3)"
                                                >
                                                    3x
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setDuoModal({ show: true, urls: ['', ''], widgetIndex: index, widgetId: undefined, aspectRatio: '3/4' })}
                                                    className="w-8 h-8 rounded-full bg-neon-purple/10 border border-neon-purple/30 text-neon-purple flex items-center justify-center hover:bg-neon-purple/20 transition-all"
                                                    title="Ajouter un Duo Photo ici"
                                                >
                                                    <Columns className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setMediaModal({ show: true, type: 'spotify', url: '', urls: '', widgetIndex: index } as any)}
                                                    className="w-8 h-8 rounded-full bg-[#1DB954]/10 border border-[#1DB954]/30 text-[#1DB954] flex items-center justify-center hover:bg-[#1DB954]/20 transition-all"
                                                    title="Ajouter Spotify ici"
                                                >
                                                    <SpotifyIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setMediaModal({ show: true, type: 'beatport', url: '', urls: '', widgetIndex: index } as any)}
                                                    className="w-8 h-8 rounded-full bg-[#02FF95]/10 border border-[#02FF95]/30 text-[#02FF95] flex items-center justify-center hover:bg-[#02FF95]/20 transition-all"
                                                    title="Ajouter Beatport ici"
                                                >
                                                    <BeatportIcon className="w-4 h-4" />
                                                </button>


                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}


                    {/* WRITTEN INTERVIEW Q&A EDITOR */}
                    {(type === 'Interview' && interviewSubtype === 'written') && (
                        <div className="pt-8 border-t border-white/10 mt-8">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                <label className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <List className="w-4 h-4 text-neon-purple" /> Studio Interview
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => setInterviewQuestions([...interviewQuestions, { id: Math.random().toString(36).substr(2, 9), type: 'qa', artistName: interviewQuestions.find(q => q.type === 'qa')?.artistName || '', artistColor: interviewQuestions.find(q => q.type === 'qa')?.artistColor || '#ff1241', question: '', answer: '' }])}
                                        className="flex items-center gap-2 px-4 py-2 bg-neon-purple text-white rounded-full hover:bg-neon-purple/80 transition-all font-black uppercase tracking-widest text-[9px] shadow-lg shadow-neon-purple/20"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Question
                                    </button>
                                    <button
                                        onClick={() => setInterviewQuestions([...interviewQuestions, { id: Math.random().toString(36).substr(2, 9), type: 'image', mediaUrl: '' }])}
                                        className="flex items-center gap-2 px-4 py-2 bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan rounded-full hover:bg-neon-cyan/20 transition-all font-black uppercase tracking-widest text-[9px]"
                                    >
                                        <ImageIcon className="w-3.5 h-3.5" /> Photo
                                    </button>
                                    <button
                                        onClick={() => setInterviewQuestions([...interviewQuestions, { id: Math.random().toString(36).substr(2, 9), type: 'video', mediaUrl: '' }])}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-600/10 border border-red-600/30 text-red-600 rounded-full hover:bg-red-600/20 transition-all font-black uppercase tracking-widest text-[9px]"
                                    >
                                        <Youtube className="w-3.5 h-3.5" /> Vidéo
                                    </button>
                                    <button
                                        onClick={() => setInterviewQuestions([...interviewQuestions, { id: Math.random().toString(36).substr(2, 9), type: 'spotify', mediaUrl: '' }])}
                                        className="flex items-center gap-2 px-4 py-2 bg-[#1DB954]/10 border border-[#1DB954]/30 text-[#1DB954] rounded-full hover:bg-[#1DB954]/20 transition-all font-black uppercase tracking-widest text-[9px]"
                                    >
                                        <Music className="w-3.5 h-3.5" /> Spotify
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {interviewQuestions.map((q, idx) => (
                                    <Fragment key={q.id}>
                                        <div className="bg-black/40 border border-white/5 rounded-[2.5rem] p-8 relative group">
                                            <div className="flex items-center gap-3 mb-6">
                                                <span className={`w-8 h-8 rounded-2xl flex items-center justify-center text-xs font-black ${q.type === 'qa' ? 'bg-neon-purple/10 border border-neon-purple/20 text-neon-purple' : q.type === 'image' ? 'bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan' : q.type === 'spotify' ? 'bg-[#1DB954]/10 border border-[#1DB954]/20 text-[#1DB954]' : 'bg-red-600/10 border border-red-600/20 text-red-600'}`}>
                                                    {idx + 1}
                                                </span>
                                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                                    {q.type === 'qa' ? 'Bloc Question/Réponse' : q.type === 'image' ? 'Bloc Photo' : q.type === 'spotify' ? 'Bloc Spotify' : 'Bloc Vidéo'}
                                                </h4>

                                                {/* Movement Arrows */}
                                                <div className="flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        type="button"
                                                        onClick={() => moveInterviewQuestionUp(idx)}
                                                        className="p-1.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all disabled:opacity-20"
                                                        disabled={idx === 0}
                                                        title="Monter"
                                                    >
                                                        <ChevronUp className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => moveInterviewQuestionDown(idx)}
                                                        className="p-1.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all disabled:opacity-20"
                                                        disabled={idx === interviewQuestions.length - 1}
                                                        title="Descendre"
                                                    >
                                                        <ChevronDown className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                {q.type === 'qa' ? (
                                                    <div className="grid grid-cols-1 gap-4">
                                                        <div className="space-y-2">
                                                            <div className="flex items-center justify-between px-1">
                                                                <label className="flex items-center gap-2 text-[10px] font-black text-neon-red uppercase tracking-widest">
                                                                    DROPSIDERS (Question)
                                                                </label>
                                                                <span className="text-[9px] font-bold text-gray-600 uppercase italic">Label auto-généré</span>
                                                            </div>
                                                            <div className="admin-editor-container bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                                                                <VisualEditor
                                                                    content={q.question || ''}
                                                                    onChange={(html) => setInterviewQuestions(interviewQuestions.map(item => item.id === q.id ? { ...item, question: html } : item))}
                                                                    className="visual-editor-content p-6 min-h-[80px] text-white outline-none focus:bg-white/[0.04] transition-all article-body-premium text-sm"
                                                                    widgetId={q.id + '-question'}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                            <div className="space-y-4">
                                                                <div className="space-y-2">
                                                                    <label className="flex items-center gap-2 text-[10px] font-black text-neon-red uppercase tracking-widest ml-1">
                                                                        NOM ARTISTE
                                                                    </label>
                                                                    <input
                                                                        type="text"
                                                                        value={q.artistName}
                                                                        onChange={(e) => {
                                                                            const newName = e.target.value;
                                                                            setInterviewQuestions(interviewQuestions.map(item => item.type === 'qa' ? { ...item, artistName: newName } : item));
                                                                            // Auto-sync label if it's empty or matches old value
                                                                            if (!artistNameLabel.trim() || artistNameLabel.toUpperCase() === (q.artistName || '').toUpperCase()) {
                                                                                setArtistNameLabel(newName);
                                                                            }
                                                                        }}
                                                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-neon-purple outline-none uppercase font-bold"
                                                                        placeholder="Ex: ANYMA"
                                                                        style={{ color: q.artistColor || '#ff1241' }}
                                                                    />
                                                                </div>

                                                                <div className="space-y-2">
                                                                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
                                                                        COULEUR ARTISTE
                                                                    </label>
                                                                    <div className="flex flex-wrap bg-black/40 rounded-xl border border-white/5 p-2 gap-1.5 font-mono">
                                                                        {EDITOR_COLORS.map(color => (
                                                                            <button
                                                                                key={color}
                                                                                type="button"
                                                                                onClick={() => setInterviewQuestions(interviewQuestions.map(item => item.type === 'qa' ? { ...item, artistColor: color } : item))}
                                                                                className={`w-5 h-5 rounded-full border transition-all ${q.artistColor === color ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'border-white/10 hover:scale-110'}`}
                                                                                style={{ backgroundColor: color }}
                                                                            />
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="md:col-span-3 space-y-2">
                                                                <div className="flex items-center justify-between px-1">
                                                                    <label className="flex items-center gap-2 text-[10px] font-black text-neon-red uppercase tracking-widest">
                                                                        RÉPONSE (Artiste)
                                                                    </label>
                                                                    <span className="text-[9px] font-bold text-gray-600 uppercase italic">Label auto-généré (<span style={{ color: q.artistColor || '#ff1241' }}>{(q.artistName || 'ARTISTE').toUpperCase()}</span> :)</span>
                                                                </div>
                                                                <div className="admin-editor-container bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                                                                    <VisualEditor
                                                                        content={q.answer || ''}
                                                                        onChange={(html) => setInterviewQuestions(interviewQuestions.map(item => item.id === q.id ? { ...item, answer: html } : item))}
                                                                        className="visual-editor-content p-6 min-h-[120px] text-white outline-none focus:bg-white/[0.04] transition-all article-body-premium text-sm"
                                                                        widgetId={q.id + '-answer'}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : q.type === 'image' ? (
                                                    <div className="flex gap-4 items-center">
                                                        <div className="flex-1 space-y-2">
                                                            <label className="text-[10px] font-black text-neon-cyan uppercase tracking-widest ml-1">URL de l'image</label>
                                                            <div className="flex gap-2">
                                                                <div className="flex-1 relative group/input">
                                                                    <input
                                                                        type="text"
                                                                        value={q.mediaUrl}
                                                                        onChange={(e) => setInterviewQuestions(interviewQuestions.map(item => item.id === q.id ? { ...item, mediaUrl: e.target.value } : item))}
                                                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 pr-10 text-white text-xs outline-none focus:border-neon-cyan"
                                                                        placeholder="https://..."
                                                                    />
                                                                    {q.mediaUrl && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setInterviewQuestions(interviewQuestions.map(item => item.id === q.id ? { ...item, mediaUrl: '' } : item))}
                                                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-red-500 transition-colors"
                                                                            title="Effacer l'image"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setUploadTarget({
                                                                            type: 'interview-media',
                                                                            interviewBlockId: q.id,
                                                                            initialImage: q.mediaUrl
                                                                        });
                                                                        setShowUploadModal(true);
                                                                    }}
                                                                    className="px-4 bg-neon-cyan/20 border border-neon-cyan/30 text-neon-cyan rounded-xl font-bold text-[10px] uppercase hover:bg-neon-cyan/30 transition-all font-black"
                                                                >
                                                                    Upload
                                                                </button>
                                                            </div>
                                                        </div>
                                                        {q.mediaUrl && (
                                                            <div className="w-20 h-20 rounded-xl overflow-hidden border border-white/10">
                                                                <img src={q.mediaUrl} alt="Preview" className="w-full h-full object-cover" />
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : q.type === 'spotify' ? (
                                                    <div className="space-y-4">
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-[#1DB954] uppercase tracking-widest ml-1">Lien ou ID Spotify</label>
                                                            <input
                                                                type="text"
                                                                value={q.mediaUrl}
                                                                onChange={(e) => {
                                                                    let val = e.target.value;
                                                                    let id = val;
                                                                    if (val.includes('track/')) id = val.split('track/')[1].split('?')[0];
                                                                    else if (val.includes('album/')) id = val.split('album/')[1].split('?')[0];
                                                                    else if (val.includes('playlist/')) id = val.split('playlist/')[1].split('?')[0];
                                                                    setInterviewQuestions(interviewQuestions.map(item => item.id === q.id ? { ...item, mediaUrl: id } : item));
                                                                }}
                                                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-[#1DB954] outline-none"
                                                                placeholder="Lien ou ID Spotify (Track, Album, Playlist)..."
                                                            />
                                                        </div>
                                                        {q.mediaUrl && (
                                                            <div className="bg-black/40 rounded-2xl p-4 border border-white/5">
                                                                <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Aperçu Compact Spotify</div>
                                                                <iframe 
                                                                    src={`https://open.spotify.com/embed/track/${q.mediaUrl}?utm_source=generator&theme=0`} 
                                                                    width="100%" 
                                                                    height="80" 
                                                                    frameBorder="0" 
                                                                    allowFullScreen 
                                                                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                                                                    loading="lazy"
                                                                    className="rounded-xl"
                                                                ></iframe>
                                                                <p className="mt-2 text-[9px] text-gray-500 italic">* Pour les albums/playlists, le type sera détecté automatiquement lors de la publication.</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-red-600 uppercase tracking-widest ml-1">Lien ou ID YouTube</label>
                                                        <input
                                                            type="text"
                                                            value={q.mediaUrl}
                                                            onChange={async (e) => {
                                                                let val = e.target.value;
                                                                if (val.includes('youtube.com/watch?v=')) val = val.split('v=')[1].split('&')[0];
                                                                else if (val.includes('youtu.be/')) val = val.split('youtu.be/')[1].split('?')[0];
                                                                setInterviewQuestions(interviewQuestions.map(item => item.id === q.id ? { ...item, mediaUrl: val } : item));

                                                                // Auto-fetch question if video
                                                                if (val.length === 11) {
                                                                    try {
                                                                        const resp = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${val}`);
                                                                        const data = await resp.json();
                                                                        if (data.title) {
                                                                            const clean = data.title
                                                                                .replace(/\(Official Video\)/gi, '')
                                                                                .replace(/\[Official Video\]/gi, '')
                                                                                .replace(/\(Official Music Video\)/gi, '')
                                                                                .replace(/\[Official Music Video\]/gi, '')
                                                                                .replace(/Official Video/gi, '')
                                                                                .replace(/Official Music Video/gi, '')
                                                                                .replace(/\(Original Mix\)/gi, '')
                                                                                .replace(/\[Original Mix\]/gi, '')
                                                                                .replace(/Original Mix/gi, '')
                                                                                .trim();

                                                                            // For specific interview block, we can set it as question if empty
                                                                            setInterviewQuestions(interviewQuestions.map(item =>
                                                                                item.id === q.id && !item.question ? { ...item, mediaUrl: val, question: clean } : (item.id === q.id ? { ...item, mediaUrl: val } : item)
                                                                            ));
                                                                        }
                                                                    } catch (e) { }
                                                                }
                                                            }}
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:border-red-600"
                                                            placeholder="Ex: dQw4w9WgXcQ"
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            <button
                                                onClick={() => setInterviewQuestions(interviewQuestions.filter(item => item.id !== q.id))}
                                                className="absolute top-6 right-6 p-2 text-gray-600 hover:text-neon-red opacity-0 group-hover:opacity-100 transition-all bg-white/5 rounded-xl hover:bg-neon-red/10 border border-transparent hover:border-neon-red/20"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* Quick Insert Buttons BELOW each block */}
                                        <div className="flex justify-center -my-2 opacity-0 hover:opacity-100 transition-opacity relative z-10">
                                            <div className="flex items-center bg-black/80 backdrop-blur-md border border-white/10 rounded-full p-1 gap-1 shadow-2xl">
                                                <button
                                                    onClick={() => {
                                                        const newBlock = { id: Math.random().toString(36).substr(2, 9), type: 'qa', artistName: q.artistName || '', artistColor: q.artistColor || '#ff1241', question: '', answer: '' };
                                                        const updated = [...interviewQuestions];
                                                        updated.splice(idx + 1, 0, newBlock as any);
                                                        setInterviewQuestions(updated);
                                                    }}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-neon-purple/20 text-neon-purple rounded-full transition-all text-[8px] font-black uppercase tracking-widest"
                                                >
                                                    <Plus className="w-3 h-3" /> Q&A
                                                </button>
                                                <div className="w-px h-3 bg-white/10" />
                                                <button
                                                    onClick={() => {
                                                        const newBlock = { id: Math.random().toString(36).substr(2, 9), type: 'image', mediaUrl: '' };
                                                        const updated = [...interviewQuestions];
                                                        updated.splice(idx + 1, 0, newBlock as any);
                                                        setInterviewQuestions(updated);
                                                    }}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-neon-cyan/20 text-neon-cyan rounded-full transition-all text-[8px] font-black uppercase tracking-widest"
                                                >
                                                    <ImageIcon className="w-3 h-3" /> Photo
                                                </button>
                                                <div className="w-px h-3 bg-white/10" />
                                                <button
                                                    onClick={() => {
                                                        const newBlock = { id: Math.random().toString(36).substr(2, 9), type: 'video', mediaUrl: '' };
                                                        const updated = [...interviewQuestions];
                                                        updated.splice(idx + 1, 0, newBlock as any);
                                                        setInterviewQuestions(updated);
                                                    }}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-red-600/20 text-red-600 rounded-full transition-all text-[8px] font-black uppercase tracking-widest"
                                                >
                                                    <Youtube className="w-3 h-3" /> Vidéo
                                                </button>
                                            </div>
                                        </div>
                                    </Fragment>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* MUSIC TOP LIST EDITOR */}
                    {activeTab === 'Musique' && (
                        <div className="pt-8 border-t border-white/10">
                            <div className="flex justify-between items-center mb-6">
                                <label className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <Music className="w-4 h-4 text-neon-cyan" /> TOP LISTE MUSIQUE
                                </label>
                                <button
                                    onClick={addMusicItem}
                                    className="flex items-center gap-2 px-6 py-2 bg-neon-cyan text-black rounded-full hover:bg-neon-cyan/80 transition-all font-bold uppercase tracking-widest text-[10px]"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Ajouter un morceau
                                </button>
                            </div>

                            <div className="space-y-6">
                                {musicItems.map((item) => (
                                    <div key={item.id} className="bg-black/40 border border-white/5 rounded-2xl p-6 relative group overflow-hidden">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Titre du morceau / Artiste</label>
                                                <input
                                                    type="text"
                                                    value={item.title}
                                                    onChange={(e) => updateMusicItem(item.id, 'title', e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-neon-cyan outline-none"
                                                    placeholder="Ex: Anyma - Pictures Of You"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Source Player</label>
                                                <div className="flex gap-2 p-1 bg-white/5 border border-white/10 rounded-lg h-[46px]">
                                                    {[
                                                        { id: 'spotify', label: 'Spotify', icon: SpotifyIcon, color: 'text-[#1DB954]' },
                                                        { id: 'youtube', label: 'YouTube', icon: Youtube, color: 'text-[#FF0000]' },
                                                        { id: 'beatport', label: 'Beatport', icon: BeatportIcon, color: 'text-[#00FF00]' }
                                                    ].map(p => (
                                                        <button
                                                            key={p.id}
                                                            onClick={() => updateMusicItem(item.id, 'playerType', p.id)}
                                                            className={`flex-1 flex items-center justify-center gap-2 rounded-md transition-all ${item.playerType === p.id ? 'bg-white/10 shadow-lg' : 'opacity-40 hover:opacity-100'}`}
                                                            title={p.label}
                                                        >
                                                            <p.icon className={`w-4 h-4 ${p.color}`} />
                                                            <span className="hidden xl:inline text-[8px] font-black uppercase">{p.label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Lien ou ID {item.playerType || 'Media'}</label>
                                                <input
                                                    type="text"
                                                    value={item.media}
                                                    onChange={(e) => updateMusicItem(item.id, 'media', e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-neon-cyan outline-none mb-3"
                                                    placeholder={item.playerType === 'beatport' ? "Lien ou ID Beatport..." : item.playerType === 'youtube' ? "Lien YouTube..." : "Lien Spotify..."}
                                                />
                                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Photo du Vinyl (URL)</label>
                                                <input
                                                    type="text"
                                                    value={item.imageUrl || ''}
                                                    onChange={(e) => updateMusicItem(item.id, 'imageUrl', e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-neon-cyan outline-none"
                                                    placeholder="Lien de la photo..."
                                                />
                                            </div>
                                        </div>
                                        <div className="mt-6">
                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Texte sous le morceau (Description / Avis)</label>
                                            <textarea
                                                value={item.description || ''}
                                                onChange={(e) => updateMusicItem(item.id, 'description', e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg p-4 text-white focus:border-neon-cyan outline-none min-h-[100px] text-sm resize-none"
                                                placeholder="Partage ton avis sur ce morceau ou donne plus d'infos..."
                                            />
                                        </div>
                                        <div className="flex items-center justify-between mt-4">
                                            <StyledCheckbox
                                                checked={item.canVote || false}
                                                onChange={(val) => updateMusicItem(item.id, 'canVote', val)}
                                                label="Activer les votes"
                                                sublabel="Ajouter un bouton de vote sur ce morceau"
                                                icon={Star}
                                                colorClass="neon-cyan"
                                            />
                                            <button
                                                onClick={() => removeMusicItem(item.id)}
                                                className="p-3 text-gray-600 hover:text-neon-red transition-all bg-white/5 border border-white/10 rounded-xl"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {item.media && (
                                            <div className="mt-4 pt-4 border-t border-white/5">
                                                <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Aperçu Media</div>
                                                <div className="max-w-md" dangerouslySetInnerHTML={{ __html: renderMediaEmbed(item.media, item.playerType) }} />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

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
                            {/* Aperçu de l'En-tête */}
                            <div className="mb-12 border-b border-white/10 pb-8">
                                <div className="flex flex-wrap gap-2 mb-6">
                                    <span className={`px-4 py-1.5 rounded-full text-white font-black text-[9px] uppercase tracking-widest shadow-lg ${activeTab === 'Focus' ? 'bg-yellow-500 shadow-yellow-500/20' : activeTab === 'Musique' ? 'bg-neon-green shadow-neon-green/20' : 'bg-neon-red shadow-neon-red/20'}`}>
                                        {activeTab === 'Focus' ? 'FOCUS' : activeTab === 'Musique' ? 'MUSIQUE' : (category || 'NEWS')}
                                    </span>
                                    <span className="px-4 py-1.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full text-white/70 font-bold text-[9px] flex items-center gap-2 uppercase tracking-widest">
                                        <Clock className="w-3 h-3 text-neon-red" />
                                        LECTURE RAPIDE
                                    </span>
                                    <span className="px-4 py-1.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full text-white/70 font-bold text-[9px] flex items-center gap-2 uppercase tracking-widest">
                                        {new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </span>
                                    <span className="px-4 py-1.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full text-white/70 font-bold text-[9px] flex items-center gap-2 uppercase tracking-widest">
                                        <User className="w-3 h-3 text-neon-red" />
                                        {author || 'Alex'}
                                    </span>
                                </div>
                                <h1 className="text-4xl md:text-6xl font-display font-black text-white uppercase italic tracking-tighter leading-none mb-4" dangerouslySetInnerHTML={{ __html: standardizeContent(title || 'TITRE DE L\'ARTICLE') }} />
                                {(locationInput || country) && (
                                    <div className="flex items-center gap-3 text-gray-400 text-sm font-bold uppercase tracking-widest mt-2 mb-6">
                                        {locationInput && (
                                            <span className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-neon-cyan" /> {locationInput}
                                            </span>
                                        )}
                                        {locationInput && country && <span className="w-1 h-1 rounded-full bg-white/20" />}
                                        {country && (
                                            <span className="flex items-center gap-2">
                                                <Globe className="w-4 h-4 text-neon-cyan" /> {country}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {activeTab === 'Musique' ? (
                                <div className="musique-preview-container">
                                    {/* Widgets first (if any) */}
                                    {widgets.length > 0 && widgets[0].content && (
                                        <div className="mb-12">
                                            {widgets.map(w => (
                                                <div key={w.id} className="article-section">
                                                    <div dangerouslySetInnerHTML={{ __html: standardizeContent(w.content) }} />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="music-top-section pt-12 border-t border-white/10">
                                        {musicItems.map((item) => (
                                            <div key={item.id} className="music-top-item-premium mb-16 last:mb-0 relative">
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-8 mb-6">
                                                    {/* VINYL ANIMATION */}
                                                    <div className="relative group/vinyl flex justify-center">
                                                        <motion.div
                                                            animate={{ rotate: 360 }}
                                                            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                                            className="w-24 h-24 lg:w-32 lg:h-32 rounded-full bg-[#111] border-[6px] lg:border-[8px] border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.8)] relative flex items-center justify-center overflow-hidden"
                                                        >
                                                            {item.imageUrl ? (
                                                                <img src={item.imageUrl} className="w-full h-full object-cover rounded-full opacity-60 group-hover/vinyl:opacity-80 transition-opacity" alt="Vinyl" />
                                                            ) : (
                                                                <div className="w-full h-full bg-gradient-to-br from-gray-800 to-black rounded-full opacity-40" />
                                                            )}
                                                            <div className="absolute inset-0 rounded-full border-[20px] lg:border-[30px] border-black/20 opacity-40" />
                                                            <div className="absolute inset-0 rounded-full border-[1px] border-white/5" />
                                                            <div className="absolute w-8 h-8 lg:w-12 lg:h-12 rounded-full bg-black flex items-center justify-center border-2 border-white/20 z-10">
                                                                <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-white/40 ring-4 ring-black" />
                                                            </div>
                                                            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
                                                        </motion.div>
                                                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[80%] h-4 bg-black/60 blur-xl rounded-full" />
                                                    </div>

                                                    <div className="flex-1 text-center sm:text-left">
                                                        <h3 className="text-2xl lg:text-4xl font-display font-black text-white uppercase italic tracking-tight leading-loose mb-2" dangerouslySetInnerHTML={{ __html: standardizeContent(item.title || 'Titre du morceau') }} />
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-px flex-1 bg-gradient-to-r from-neon-red to-transparent opacity-30" />
                                                            <span className="text-[9px] font-black text-neon-red uppercase tracking-[0.4em]">EXCLUSIVITÉ DROPSIDERS</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="rounded-[2.5rem] overflow-hidden border border-white/10 bg-black/40 shadow-2xl relative z-10 backdrop-blur-xl transition-colors">
                                                    <div dangerouslySetInnerHTML={{ __html: renderMediaEmbed(item.media, item.playerType) }} />
                                                </div>

                                                {item.description && (
                                                    <div className="mt-8 px-6 py-4 bg-white/[0.02] border-l-4 border-neon-cyan rounded-r-2xl">
                                                        <p className="text-gray-400 text-sm leading-relaxed italic" dangerouslySetInnerHTML={{ __html: standardizeContent(item.description) }} />
                                                    </div>
                                                )}
                                                
                                                {item.canVote && (
                                                    <div className="mt-8 flex justify-center">
                                                        <button className="flex items-center gap-3 px-10 py-4 bg-neon-cyan/10 border border-neon-cyan/20 rounded-full text-neon-cyan font-black uppercase tracking-widest text-[10px] hover:bg-neon-cyan/20 hover:scale-105 transition-all shadow-[0_0_20px_rgba(0,255,243,0.1)] group">
                                                            <Star className="w-4 h-4 group-hover:fill-neon-cyan transition-all" />
                                                            VOTER POUR CE MORCEAU
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        {youtubeId && (
                                            <div className="mt-20">
                                                <h3 className="text-3xl font-display font-black text-white mb-10 uppercase italic flex items-center gap-4 group">
                                                    <div className="w-12 h-12 rounded-2xl bg-neon-red/10 flex items-center justify-center border border-neon-red/30">
                                                        <Youtube className="w-6 h-6 text-neon-red" />
                                                    </div>
                                                    <div className="flex flex-col text-left">
                                                        <span className="text-neon-red text-[10px] tracking-[0.4em] font-black mb-1 italic">DÉCOUVREZ</span>
                                                        LA VIDÉO DE L'ARTICLE
                                                    </div>
                                                </h3>
                                                <div className="relative aspect-video rounded-[2.5rem] overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(255,0,51,0.15)] group">
                                                    <iframe
                                                        src={`https://www.youtube.com/embed/${youtubeId}`}
                                                        className="absolute top-0 left-0 w-full h-full"
                                                        allowFullScreen
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        {/* Socials Preview for Musique */}
                                        {Object.values(artistSocials).some(v => v) && (
                                            <div className="article-section pt-12 border-t border-white/5 mt-12">
                                                <div dangerouslySetInnerHTML={{
                                                    __html: generateSocialsHtml(artistNameLabel)
                                                }} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Widgets Content Rendering in Preview */}
                                    {widgets.map(w => (
                                        <div key={w.id} className="article-section">
                                            <div dangerouslySetInnerHTML={{ __html: standardizeContent(w.content) }} />
                                        </div>
                                    ))}

                                    {/* Interview Content Rendering in Preview */}
                                    {type === 'Interview' && interviewSubtype === 'written' && interviewQuestions.map((q) => (
                                        <div key={q.id} className="article-section">
                                            {q.type === 'qa' ? (
                                                <div className="space-y-4">
                                                    <p className="article-body-premium mb-4"><strong style={{ color: '#ff1241' }}>DROPSIDERS :</strong> <span dangerouslySetInnerHTML={{ __html: standardizeContent(q.question || '') }} /></p>
                                                    <p className="article-body-premium" style={{ color: q.artistColor || '#ff1241' }}><strong style={{ color: q.artistColor || '#ff1241' }}>{(q.artistName || 'ARTISTE').toUpperCase()} :</strong> <span dangerouslySetInnerHTML={{ __html: standardizeContent(q.answer || '') }} /></p>
                                                </div>
                                            ) : q.type === 'image' ? (
                                                <div className="image-premium-wrapper w-full relative rounded-3xl overflow-hidden shadow-2xl border border-white/5 my-12">
                                                    <img src={q.mediaUrl} alt="Interview Image" className="w-full h-auto object-cover" />
                                                </div>
                                            ) : q.type === 'video' ? (
                                                <div className="youtube-player-widget w-full relative aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/5 my-12">
                                                    <iframe src={`https://www.youtube.com/embed/${q.mediaUrl}`} className="absolute inset-0 w-full h-full" allowFullScreen />
                                                </div>
                                            ) : null}
                                        </div>
                                    ))}

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
                                                    LA VIDÉO DE L'ARTICLE
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

                                    {/* Socials Preview */}
                                    {Object.values(artistSocials).some(v => v) && (
                                        <div className="article-section pt-12 border-t border-white/5 mt-12">
                                            <div dangerouslySetInnerHTML={{
                                                __html: generateSocialsHtml(
                                                    (type === 'Interview' ? (artistNameLabel || interviewQuestions.find(q => q.type === 'qa')?.artistName) : artistNameLabel),
                                                    (type === 'Interview' ? interviewQuestions.find(q => q.type === 'qa')?.artistColor : undefined)
                                                )
                                            }} />
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    <div className="pt-6 flex flex-col gap-4">
                        {/* Published Date replaced by automatic current time */}


                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                onClick={() => handleSubmit(true)}
                                disabled={status === 'loading'}
                                className={`py-4 rounded-xl font-bold uppercase tracking-widest transition-all ${status === 'loading'
                                    ? 'bg-gray-600 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-neon-orange to-neon-red hover:shadow-[0_0_20px_rgba(255,102,0,0.4)] hover:scale-[1.02]'
                                    } text-white flex items-center justify-center gap-2`}
                            >
                                <Send className="w-5 h-5" />
                                {status === 'loading' ? 'Publication...' : (isEditing ? 'Mettre à jour l\'article' : 'Publier l\'article')}
                            </button>

                            <button
                                onClick={() => setShowScheduleModal(true)}
                                disabled={status === 'loading'}
                                className={`py-4 rounded-xl font-bold uppercase tracking-widest transition-all ${status === 'loading'
                                    ? 'bg-gray-600 cursor-not-allowed'
                                    : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:scale-[1.02]'
                                    } text-white flex items-center justify-center gap-2`}
                            >
                                <Calendar className="w-5 h-5" />
                                {status === 'loading' ? 'Programmation...' : 'Programmer l\'article'}
                            </button>
                        </div>

                        {isEditing && (
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                type="button"
                                className="w-full py-4 rounded-xl font-bold uppercase tracking-widest transition-all bg-red-600/10 border border-red-600/20 text-red-600 hover:bg-red-600/20 flex items-center justify-center gap-2"
                            >
                                <Trash2 className="w-5 h-5" /> Supprimer cet article
                            </button>
                        )}

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

                </motion.div>
            </div>
            <style>{`
                .admin-editor-container .w-md-editor {
                    border: 1px solid rgba(255,255,255,0.1) !important;
                    background: #000 !important;
                    border-radius: 8px;
                }
                .admin-editor-container .w-md-editor-toolbar {
                    background: #000 !important;
                    border-bottom: 1px solid rgba(255,255,255,0.05) !important;
                }
                .admin-editor-container .w-md-editor-content {
                    background: #000 !important;
                }
                .article-body-premium img:not(.absolute):not([class*="aspect-"]) {
                    display: block;
                    width: 100% !important;
                    height: auto !important;
                    margin: 2rem auto !important;
                    border-radius: 16px !important;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                }
                .article-body-premium .grid img,
                .article-body-premium [class*="aspect-"] img {
                    width: 100% !important;
                    height: 100% !important;
                    object-fit: cover !important;
                    object-position: center !important;
                    margin: 0 !important;
                    border-radius: inherit !important;
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
                    pointer-events: none; /* Prevent navigation during edit */
                }
                /* Line wrapping for editor */
                .visual-editor-content p {
                    max-width: 100%;
                    font-size: 14px !important;
                    line-height: 1.6 !important;
                    margin-bottom: 1.5rem !important;
                    color: #d1d5db;
                }
                /* PREMIUM JOURNAL PREVIEW */
                .premium-image-float-container {
                    margin: 1.5rem 0;
                    clear: none;
                }
                .premium-image-float-container[data-align="left"] {
                    float: left !important;
                    margin-right: 2rem !important;
                    margin-bottom: 1rem !important;
                }
                .premium-image-float-container[data-align="right"] {
                    float: right !important;
                    margin-left: 2rem !important;
                    margin-bottom: 1rem !important;
                }
                .premium-image-float-container[data-align="center"] {
                    float: none !important;
                    margin: 2rem auto !important;
                    width: 100% !important;
                }
                .article-body-premium {
                    overflow: auto; /* Clearfix for floats */
                    display: flow-root;
                }
                .article-section {
                    clear: none !important; /* Allow wrapping between widgets */
                }
                .article-section:has(h2), .article-section:has(.premium-section-title), .article-section:has(.grid) {
                    clear: both !important;
                }
                /* Mobile Scroll fix (Request 8) */
                body, html {
                    overflow-x: hidden;
                    -webkit-overflow-scrolling: touch;
                }
                .admin-editor-container {
                    -webkit-overflow-scrolling: touch;
                    touch-action: pan-y;
                }
            `}</style>
            {/* Media Selection Modal */}
            <AnimatePresence>
                {mediaModal.show && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
                            className="relative w-full max-w-md bg-dark-bg border border-white/10 rounded-3xl p-8 shadow-2xl"
                        >
                            <button
                                onClick={() => setMediaModal({ ...mediaModal, show: false })}
                                className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <h3 className="text-xl font-display font-black text-white uppercase italic mb-6">
                                {mediaModal.type === 'image' ? 'Ajouter une photo' : mediaModal.type === 'video' ? 'Ajouter une vidéo' : mediaModal.type === 'gallery' ? 'Ajouter une galerie' : mediaModal.type === 'spotify' ? '🎵 Lecteur Spotify' : '🎶 Lecteur Beatport'}
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
                                        <div className="mt-4">
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 text-center">Colonnes par ligne</label>
                                            <div className="flex justify-center gap-3">
                                                {[2, 3, 4].map(c => (
                                                    <button
                                                        key={c}
                                                        type="button"
                                                        onClick={() => setMediaModal({ ...mediaModal, cols: c })}
                                                        className={`flex-1 max-w-[80px] py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all border ${mediaModal.cols === c ? 'bg-neon-red border-neon-red text-white shadow-lg shadow-neon-red/20' : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20 hover:text-white'}`}
                                                    >
                                                        {c} Photos
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : mediaModal.type === 'spotify' ? (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-[#1DB954] uppercase tracking-widest mb-2">URL Spotify (Morceau, Album, Playlist)</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={mediaModal.url}
                                                    onChange={e => setMediaModal({ ...mediaModal, url: e.target.value })}
                                                    className="w-full bg-black/40 border border-[#1DB954]/30 rounded-xl p-3 pr-10 text-white outline-none focus:border-[#1DB954] transition-all text-xs"
                                                    placeholder="https://open.spotify.com/track/..."
                                                    autoFocus
                                                />
                                                {mediaModal.url && (
                                                    <button type="button" onClick={() => setMediaModal({ ...mediaModal, url: '' })} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-red-500">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        {mediaModal.url && (() => {
                                            const v = mediaModal.url;
                                            const tm = v.match(/track[/:]([a-zA-Z0-9]+)/); const am = v.match(/album[/:]([a-zA-Z0-9]+)/); const pm = v.match(/playlist[/:]([a-zA-Z0-9]+)/);
                                            let spId = tm ? tm[1] : am ? am[1] : pm ? pm[1] : v;
                                            let spType = tm ? 'track' : am ? 'album' : pm ? 'playlist' : 'track';
                                            return (
                                                <div className="bg-black/40 rounded-2xl p-3 border border-[#1DB954]/20">
                                                    <p className="text-[9px] text-[#1DB954] font-black uppercase tracking-widest mb-2">Aperçu • {spType}</p>
                                                    <iframe src={`https://open.spotify.com/embed/${spType}/${spId}?utm_source=generator&theme=0`} width="100%" height={spType === 'track' ? 80 : 152} frameBorder={0} allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" className="rounded-xl" />
                                                </div>
                                            );
                                        })()}
                                    </div>
                                ) : mediaModal.type === 'beatport' ? (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-[#02FF95] uppercase tracking-widest mb-2">URL Beatport (Track, Release, Chart)</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={mediaModal.url}
                                                    onChange={e => setMediaModal({ ...mediaModal, url: e.target.value })}
                                                    className="w-full bg-black/40 border border-[#02FF95]/30 rounded-xl p-3 pr-10 text-white outline-none focus:border-[#02FF95] transition-all text-xs"
                                                    placeholder="https://www.beatport.com/track/name/12345"
                                                    autoFocus
                                                />
                                                {mediaModal.url && (
                                                    <button type="button" onClick={() => setMediaModal({ ...mediaModal, url: '' })} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-red-500">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        {mediaModal.url && (() => {
                                            const bpUrl = mediaModal.url;
                                            const trackIdMatch = bpUrl.match(/\/track\/[^/]+\/(\d+)/);
                                            const releaseIdMatch = bpUrl.match(/\/release\/[^/]+\/(\d+)/);
                                            const chartIdMatch = bpUrl.match(/\/chart\/[^/]+\/(\d+)/);
                                            let bpId = trackIdMatch ? trackIdMatch[1] : releaseIdMatch ? releaseIdMatch[1] : chartIdMatch ? chartIdMatch[1] : '';
                                            let bpType = trackIdMatch ? 'track' : releaseIdMatch ? 'release' : chartIdMatch ? 'chart' : 'track';
                                            if (!bpId) return null;
                                            return (
                                                <div className="bg-black/40 rounded-2xl p-3 border border-[#02FF95]/20">
                                                    <p className="text-[9px] text-[#02FF95] font-black uppercase tracking-widest mb-2">Aperçu Beatport • {bpType} #{bpId}</p>
                                                    <iframe src={`https://embed.beatport.com/?id=${bpId}&type=${bpType}`} width="100%" height="162" frameBorder={0} scrolling="no" className="rounded-xl" />
                                                </div>
                                            );
                                        })()}
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
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 text-center">Format de l'image</label>
                                            <div className="grid grid-cols-4 gap-2">
                                                {['auto', '1/1', '3/4', '16/9'].map(ratio => (
                                                    <button
                                                        key={ratio}
                                                        type="button"
                                                        onClick={() => setMediaModal({ ...mediaModal, aspectRatio: ratio as any })}
                                                        className={`py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${mediaModal.aspectRatio === ratio ? 'bg-neon-red text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                                                    >
                                                        {ratio === 'auto' ? 'Orig' : ratio}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 text-center">Position du texte (Journal Premium)</label>
                                            <div className="flex justify-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setMediaModal({ ...mediaModal, alignment: 'left', width: 45 })}
                                                    className={`flex-1 py-2.5 rounded-xl transition-all border flex flex-col items-center gap-1 ${mediaModal.alignment === 'left' ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
                                                >
                                                    <AlignLeft className="w-4 h-4" />
                                                    <span className="text-[8px] font-black uppercase">À gauche</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setMediaModal({ ...mediaModal, alignment: 'center', width: 100 })}
                                                    className={`flex-1 py-2.5 rounded-xl transition-all border flex flex-col items-center gap-1 ${mediaModal.alignment === 'center' ? 'bg-neon-red/20 border-neon-red text-neon-red' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
                                                >
                                                    <AlignCenter className="w-4 h-4" />
                                                    <span className="text-[8px] font-black uppercase">Centré</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setMediaModal({ ...mediaModal, alignment: 'right', width: 45 })}
                                                    className={`flex-1 py-2.5 rounded-xl transition-all border flex flex-col items-center gap-1 ${mediaModal.alignment === 'right' ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
                                                >
                                                    <AlignRight className="w-4 h-4" />
                                                    <span className="text-[8px] font-black uppercase">À droite</span>
                                                </button>
                                            </div>
                                        </div>

                                        {mediaModal.alignment !== 'center' && (
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center px-1">
                                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Largeur Image : {mediaModal.width}%</label>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="25"
                                                    max="75"
                                                    step="5"
                                                    value={mediaModal.width || 45}
                                                    onChange={(e) => setMediaModal({ ...mediaModal, width: parseInt(e.target.value) })}
                                                    className="w-full accent-neon-cyan h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex gap-4">
                                    {(mediaModal.type === 'image' || mediaModal.type === 'gallery' || mediaModal.type === 'video') && (
                                        <button
                                            onClick={() => {
                                                setUploadTarget({
                                                    type: mediaModal.widgetId ? 'widget-edit' : 'widget',
                                                    widgetId: mediaModal.widgetId,
                                                    initialImage: mediaModal.url,
                                                    allowMultiple: mediaModal.type === 'gallery'
                                                });
                                                setShowUploadModal(true);
                                            }}
                                            className="flex-1 flex flex-col items-center gap-2 p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-neon-red/10 hover:border-neon-red/50 transition-all group"
                                        >
                                            <Upload className="w-5 h-5 text-neon-red group-hover:scale-110 transition-transform" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white">Upload</span>
                                        </button>
                                    )}

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
                            onClick={() => setLinkModal({ ...linkModal, show: false })}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-sm bg-dark-bg border border-white/10 rounded-3xl p-8 shadow-2xl"
                        >
                            <button
                                onClick={() => setLinkModal({ ...linkModal, show: false })}
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
                initialImage={uploadTarget.initialImage}
                allowMultiple={(uploadTarget as any).allowMultiple}
                onUploadSuccess={(url: string | string[]) => {
                    const actualUrl = Array.isArray(url) ? url[0] : url;
                    const allUrls = Array.isArray(url) ? url : [url];
                    const isVideo = actualUrl.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/) || actualUrl.includes('/video/upload/');
                    const mediaTag = isVideo
                        ? `<video src="${actualUrl}" autoplay loop muted playsinline class="w-full h-full object-cover"></video>`
                        : `<img src="${actualUrl}" alt="Image" class="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700" />`;

                    if (uploadTarget.type === 'main') {
                        setImageUrl(actualUrl);
                        setShowUploadModal(false);
                    } else if (uploadTarget.type === 'duo1' as any) {
                        setDuoModal(prev => ({ ...prev, url1: actualUrl }));
                        setShowUploadModal(false);
                    } else if (uploadTarget.type === 'duo2' as any) {
                        setDuoModal(prev => ({ ...prev, url2: actualUrl }));
                        setShowUploadModal(false);
                    } else if (uploadTarget.type === 'interview-media') {
                        setInterviewQuestions(prev => prev.map(q => q.id === uploadTarget.interviewBlockId ? { ...q, mediaUrl: actualUrl } : q));
                        setShowUploadModal(false);
                    } else if (uploadTarget.type === 'widget-edit' as any) {
                        if (mediaModal.type === 'gallery') {
                            const newUrls = allUrls.join('\n');
                            setMediaModal(prev => ({ 
                                ...prev, 
                                urls: prev.urls ? prev.urls + '\n' + newUrls : newUrls 
                            }));
                        } else {
                            // AUTO-CONFIRM for editing existing image from gallery
                            insertImageWidget(actualUrl, uploadTarget.widgetId, undefined, {
                                aspectRatio: mediaModal.aspectRatio,
                                alignment: mediaModal.alignment,
                                width: mediaModal.width
                            });
                            setMediaModal(prev => ({ ...prev, show: false, url: '' }));
                        }
                        setShowUploadModal(false);
                    } else if (uploadTarget.type === 'widget' as any) {
                        // Direct addition of NEW widget (from plus button or image button)
                        const imgWidget = `<div class="image-premium-wrapper w-full relative rounded-3xl overflow-hidden shadow-2xl border border-white/5 my-12 group">\n  ${mediaTag}\n</div>`;
                        addWidget(uploadTarget.index, imgWidget);
                        setShowUploadModal(false);
                    } else if (uploadTarget.type === 'duo-image' as any) {
                        const actualUrl = Array.isArray(url) ? url[0] : url;
                        const newUrls = [...duoModal.urls];
                        newUrls[uploadTarget.index!] = actualUrl;
                        setDuoModal(prev => ({ ...prev, urls: newUrls }));
                        setShowUploadModal(false);
                    } else {
                        // Final fallback
                        setShowUploadModal(false);
                    }
                }}
                onClear={() => {
                    if (uploadTarget.type === 'main') {
                        setImageUrl('');
                    } else if (uploadTarget.type === 'duo-image' as any) {
                        const newUrls = [...duoModal.urls];
                        newUrls[uploadTarget.index!] = '';
                        setDuoModal(prev => ({ ...prev, urls: newUrls }));
                    } else if (uploadTarget.type === 'interview-media') {
                        setInterviewQuestions(prev => prev.map(q => q.id === uploadTarget.interviewBlockId ? { ...q, mediaUrl: '' } : q));
                    } else if (uploadTarget.type === 'widget-edit' as any) {
                        updateWidget(uploadTarget.widgetId!, '');
                        setMediaModal(prev => ({ ...prev, show: false }));
                    }
                    setShowUploadModal(false);
                }}
                accentColor={type === 'Interview' ? 'neon-purple' : 'neon-red'}
            />

            {/* Duo/Grid Photos Modal */}
            <AnimatePresence>
                {duoModal.show && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-dark-bg border border-white/10 rounded-3xl p-8 max-w-xl w-full shadow-2xl relative"
                        >
                            <button
                                onClick={() => setDuoModal({ show: false, urls: ['', ''], widgetIndex: undefined, widgetId: undefined, aspectRatio: '3/4' })}
                                className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <h2 className="text-xl font-display font-black text-white uppercase italic mb-6">Ajouter Duo/Grid Photos</h2>
                            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 no-scrollbar">
                                {duoModal.urls.map((url, idx) => (
                                    <div key={idx} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Image {idx + 1} (URL)</label>
                                            {duoModal.urls.length > 2 && (
                                                <button
                                                    onClick={() => {
                                                        const newUrls = duoModal.urls.filter((_, i) => i !== idx);
                                                        setDuoModal({ ...duoModal, urls: newUrls });
                                                    }}
                                                    className="text-red-500 hover:text-red-400 p-1 transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="flex-1 relative group/input">
                                                <input
                                                    type="text"
                                                    value={url}
                                                    onChange={e => {
                                                        const newUrls = [...duoModal.urls];
                                                        newUrls[idx] = e.target.value;
                                                        setDuoModal({ ...duoModal, urls: newUrls });
                                                    }}
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 pr-10 text-white outline-none focus:border-neon-purple transition-all text-xs"
                                                    placeholder="https://..."
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setUploadTarget({ type: 'duo-image' as any, index: idx, initialImage: url });
                                                    setShowUploadModal(true);
                                                }}
                                                className="px-4 bg-neon-purple/20 border border-neon-purple/30 text-neon-purple rounded-xl font-bold text-[10px] uppercase hover:bg-neon-purple/30 transition-all font-black"
                                            >
                                                Upload
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {duoModal.urls.length < 6 && (
                                    <button
                                        onClick={() => setDuoModal({ ...duoModal, urls: [...duoModal.urls, ''] })}
                                        className="w-full py-4 rounded-xl border border-dashed border-white/10 text-gray-500 hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest"
                                    >
                                        <Plus className="w-4 h-4" /> Ajouter une image
                                    </button>
                                )}

                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Format des images</label>
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
                                        onClick={() => setDuoModal({ show: false, urls: ['', ''], widgetIndex: undefined, widgetId: undefined, aspectRatio: '3/4' })}
                                        className="flex-1 py-3 rounded-xl border border-white/10 text-gray-500 font-bold uppercase tracking-widest text-[10px] hover:bg-white/5 transition-all"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        onClick={() => {
                                            const activeUrls = duoModal.urls.filter(u => u.trim());
                                            if (activeUrls.length < 2) return;

                                            const mediaItems = activeUrls.map((url, idx) => {
                                                const isV = url.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/) || url.includes('/video/upload/');
                                                return isV
                                                    ? `<video src="${url}" autoplay loop muted playsinline class="w-full aspect-[${duoModal.aspectRatio}] object-cover"></video>`
                                                    : `<img src="${url}" alt="Grid item ${idx + 1}" class="w-full aspect-[${duoModal.aspectRatio}] object-cover transform group-hover:scale-105 transition-transform duration-700" />`;
                                            });

                                            // Determine layout classes based on item count
                                            let layoutClasses = "duo-photos-premium flex flex-row gap-4 my-12";
                                            let itemClasses = "image-premium-wrapper relative rounded-3xl overflow-hidden shadow-2xl border border-white/5 group flex-1";
                                            
                                            if (activeUrls.length > 2) {
                                                // Grid layout for 3+ items
                                                const gridCols = activeUrls.length === 2 ? 'grid-cols-2' : activeUrls.length === 3 ? 'grid-cols-3' : activeUrls.length === 4 ? 'grid-cols-2' : 'grid-cols-3';
                                                layoutClasses = `grid-photos-premium grid ${gridCols} gap-4 my-12`;
                                                itemClasses = "image-premium-wrapper relative rounded-3xl overflow-hidden shadow-2xl border border-white/5 group";
                                            }

                                            const gridWidget = `<div class="${layoutClasses}">\n  ${mediaItems.map(m => `<div class="${itemClasses}">\n    ${m}\n  </div>`).join('\n  ')}\n</div>`;

                                            if (duoModal.widgetId) {
                                                updateWidget(duoModal.widgetId, gridWidget);
                                            } else if (duoModal.widgetIndex !== undefined) {
                                                addWidget(duoModal.widgetIndex, gridWidget);
                                            } else {
                                                setWidgets([...widgets, { id: Math.random().toString(36).substr(2, 9), content: gridWidget }]);
                                            }
                                            setDuoModal({ show: false, urls: ['', ''], widgetIndex: undefined, widgetId: undefined, aspectRatio: '3/4' });
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

            <ConfirmationModal
                isOpen={showDeleteConfirm}
                onCancel={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="Supprimer l'article ?"
                message="Cette action est irréversible. Voulez-vous vraiment supprimer cet article ?"
                confirmLabel="Oui, supprimer"
                cancelLabel="Annuler"
                accentColor="neon-red"
            />

                <AnimatePresence>
                    {videoGroupModal.show && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-hidden">
                            <motion.div
                                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 30, scale: 0.95 }}
                                className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 md:p-10 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative scrollbar-hide"
                            >
                                <button
                                    onClick={() => setVideoGroupModal(prev => ({ ...prev, show: false }))}
                                    className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white transition-colors hover:bg-white/5 rounded-full"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-12 h-12 bg-red-600/10 rounded-2xl flex items-center justify-center border border-red-600/30">
                                        <Youtube className="w-6 h-6 text-red-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-display font-black text-white uppercase italic leading-none">Groupe de Sets Premium</h3>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2">Gestion par rangées (Max 50 vidéos)</p>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    {/* Titre du Groupe */}
                                    <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                                        <label className="block text-[10px] font-black text-neon-cyan uppercase tracking-[0.2em] mb-4">Titre Principal du Groupe (ex: TOMORROWLAND 2024)</label>
                                        <input
                                            type="text"
                                            value={videoGroupModal.title}
                                            onChange={e => setVideoGroupModal({ ...videoGroupModal, title: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-neon-cyan transition-all text-sm font-bold uppercase"
                                            placeholder="LAISSER VIDE SI AUCUN TITRE..."
                                        />
                                    </div>

                                    {/* Liste des Rangées */}
                                    <div className="space-y-6">
                                        {videoGroupModal.rows.map((row, rowIndex) => (
                                            <div key={rowIndex} className="p-6 bg-white/[0.03] border border-white/10 rounded-3xl relative group/row">
                                                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-[10px] font-bold text-white border border-white/10">
                                                            {rowIndex + 1}
                                                        </div>
                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-shadow-sm">CONFIGURATION DE LA LIGNE</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 bg-black/40 p-1 rounded-xl border border-white/5">
                                                        {[1, 2, 3].map(count => (
                                                                <button
                                                                    key={count}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const newRows = [...videoGroupModal.rows];
                                                                        const oldVideos = newRows[rowIndex].videos;
                                                                        const newVideos = Array(count).fill(null).map((_, i) => oldVideos[i] || { url: '', title: '' });
                                                                        newRows[rowIndex] = { count, videos: newVideos };
                                                                        setVideoGroupModal({ ...videoGroupModal, rows: newRows });
                                                                    }}
                                                                    className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${row.count === count ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-white'}`}
                                                                >
                                                                    {count} {count === 1 ? 'VIDÉO' : 'VIDÉOS'}
                                                                </button>
                                                            ))}
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newRows = videoGroupModal.rows.filter((_, i) => i !== rowIndex);
                                                                if (newRows.length === 0) newRows.push({ count: 3, videos: [{ url: '', title: '' }, { url: '', title: '' }, { url: '', title: '' }] });
                                                                setVideoGroupModal({ ...videoGroupModal, rows: newRows });
                                                            }}
                                                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors ml-2"
                                                            title="Supprimer la ligne"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className={`grid gap-4 ${row.count === 1 ? 'grid-cols-1' : row.count === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                                                    {row.videos.map((video, videoIndex) => (
                                                        <div key={videoIndex} className="space-y-3 p-4 bg-black/40 rounded-2xl border border-white/5 hover:border-white/20 transition-all">
                                                            <div>
                                                                <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 italic">Artiste</label>
                                                                <input
                                                                    type="text"
                                                                    value={video.title}
                                                                    onChange={e => {
                                                                        const newRows = [...videoGroupModal.rows];
                                                                        newRows[rowIndex].videos[videoIndex].title = e.target.value;
                                                                        setVideoGroupModal({ ...videoGroupModal, rows: newRows });
                                                                    }}
                                                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-red-600 transition-all text-[11px] font-bold"
                                                                    placeholder="ex: Martin Garrix"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 italic">Lien / ID YouTube</label>
                                                                <input
                                                                    type="text"
                                                                    value={video.url}
                                                                    onChange={e => {
                                                                        const newRows = [...videoGroupModal.rows];
                                                                        newRows[rowIndex].videos[videoIndex].url = e.target.value;
                                                                        setVideoGroupModal({ ...videoGroupModal, rows: newRows });
                                                                    }}
                                                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-red-600 transition-all text-[11px] font-mono"
                                                                    placeholder="Lien..."
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Ajouter une ligne */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (videoGroupModal.rows.length >= 50) return;
                                            setVideoGroupModal({
                                                ...videoGroupModal,
                                                rows: [...videoGroupModal.rows, { count: 3, videos: [{ url: '', title: '' }, { url: '', title: '' }, { url: '', title: '' }] }]
                                            });
                                        }}
                                        className="w-full py-6 rounded-2xl border-2 border-dashed border-white/10 text-gray-500 hover:border-red-600/50 hover:text-red-500 transition-all flex items-center justify-center gap-3 group/add"
                                    >
                                        <Plus className="w-5 h-5 group-hover/add:scale-125 transition-transform" />
                                        <span className="text-[11px] font-black uppercase tracking-widest">Ajouter une ligne de sets</span>
                                    </button>

                                    {/* Actions Finales */}
                                    <div className="flex gap-4 pt-6 border-t border-white/10">
                                        <button
                                            type="button"
                                            onClick={() => setVideoGroupModal(prev => ({ ...prev, show: false }))}
                                            className="px-8 py-4 rounded-xl text-gray-500 font-bold uppercase tracking-widest text-[10px] hover:bg-white/5 transition-all outline-none"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const rowsHtml = videoGroupModal.rows.map(row => {
                                                    const videosHtml = row.videos
                                                        .filter(v => v.url.trim())
                                                        .map(video => {
                                                            let id = video.url;
                                                            if (video.url.includes('v=')) id = video.url.split('v=')[1].split('&')[0];
                                                            else if (video.url.includes('youtu.be/')) id = video.url.split('youtu.be/')[1];
                                                            
                                                            const embedUrl = `https://www.youtube.com/embed/${id}`;
                                                            const widthClass = row.count === 1 ? 'width: 100%' : row.count === 2 ? 'width: calc(50% - 20px)' : 'width: calc(33.333% - 27px)';
                                                            
                                                            return `
          <div class="premium-video-wrapper" style="flex: 1; ${widthClass}; margin-bottom: 40px;">
            ${video.title ? `<div style="color: #9ca3af; font-size: 16px; font-weight: 900; text-transform: uppercase; margin-bottom: 15px; letter-spacing: 0.25em; color: #fff !important; text-shadow: 0 0 10px rgba(255,255,255,0.3);">${video.title.toUpperCase()}</div>` : ''}
            <div style="position: relative; aspect-ratio: 16/9; border-radius: 24px; overflow: hidden; background: #111; border: 1px solid rgba(255,255,255,0.05); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);">
              <iframe src="${embedUrl}" style="position: absolute; top: 0; left: 0; width: 100%; h-full; border: none;" allowfullscreen></iframe>
            </div>
          </div>`;
                                                        }).join('');

                                                    return `<div class="premium-video-row" style="display: grid; grid-template-columns: repeat(${row.count}, 1fr); gap: 30px; margin-bottom: 40px; width: 100%;">\n${videosHtml}\n</div>`;
                                                }).join('\n');

                                                const groupTitleHtml = videoGroupModal.title?.trim() ? `<h2 class="text-white text-3xl font-display font-black uppercase italic mb-10">${videoGroupModal.title.toUpperCase()}</h2>\n` : "";
                                                const videoWidget = `${groupTitleHtml}<div class="premium-video-container" style="margin: 60px 0;">\n${rowsHtml}\n</div>`;

                                                if (videoGroupModal.widgetId) {
                                                    updateWidget(videoGroupModal.widgetId, videoWidget);
                                                } else if (videoGroupModal.widgetIndex !== undefined) {
                                                    addWidget(videoGroupModal.widgetIndex, videoWidget);
                                                } else {
                                                    setWidgets([...widgets, { id: Math.random().toString(36).substr(2, 9), content: videoWidget }]);
                                                }
                                                setVideoGroupModal(prev => ({ ...prev, show: false }));
                                            }}
                                            className="flex-1 py-4 rounded-xl bg-red-600 text-white font-bold uppercase tracking-widest text-[11px] shadow-[0_10px_30px_rgba(220,38,38,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all outline-none"
                                        >
                                            Valider le groupe de sets
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

                            <div className="w-12 h-12 bg-neon-orange/10 rounded-2xl flex items-center justify-center border border-neon-orange/30 mb-6">
                                <Calendar className="w-6 h-6 text-neon-orange" />
                            </div>

                            <h3 className="text-xl font-display font-black text-white uppercase italic mb-2">
                                Programmer l'article
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
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-neon-orange transition-colors" />
                                        <input
                                            type="datetime-local"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:border-neon-orange outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <button
                                        onClick={() => {
                                            setShowScheduleModal(false);
                                            handleSubmit(false);
                                        }}
                                        className="w-full py-4 bg-gradient-to-r from-neon-orange to-neon-red text-white rounded-xl font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-neon-red/20"
                                    >
                                        Confirmer la programmation
                                    </button>

                                    <p className="text-[9px] text-gray-500 text-center font-bold uppercase tracking-[0.1em] px-4">
                                        L'article sera publié {date > new Date().toISOString().slice(0, 16) ? 'automatiquement' : ' Immédiatement'} à la date indiquée.
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
                accentColor="neon-red"
            />
        </div >
    );
}

export default NewsCreate;
