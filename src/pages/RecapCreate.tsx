import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, ArrowLeft, Bold, Calendar, CaseUpper, Columns, Eye, FileText, Image as ImageIcon, Italic, Link2, List, MapPin, Music, PartyPopper, Plus, Send, Star, Trash2, Type, Underline as UnderlineIcon, Upload, Wand2, X, Youtube } from 'lucide-react';
import { useNavigate, useLocation, useSearchParams, useBlocker } from 'react-router-dom';
import { getAuthHeaders } from '../utils/auth';
import { ImageUploadModal } from '../components/ImageUploadModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { fixEncoding, standardizeContent } from '../utils/standardizer';
import recapsData from '../data/recaps.json';



export function RecapCreate() {
    const navigate = useNavigate();
    const location = useLocation() as any;
    const [searchParams] = useSearchParams();
    const id = searchParams.get('id');
    const isEditing = !!id;
    const editingItem = location.state?.item;

    const [title, setTitle] = useState('');
    const [summary, setSummary] = useState('');
    const [coverImage, setCoverImage] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [festival, setFestival] = useState('');
    const [locationInput, setLocationInput] = useState('');
    const [youtubeId, setYoutubeId] = useState('');
    const [isFeatured, setIsFeatured] = useState(false);



    // Widget System State
    const [widgets, setWidgets] = useState<{ id: string, content: string }[]>([
        { id: 'initial-1', content: '<h2 class="premium-section-title">TITRE DU RÉCAP</h2>' }
    ]);

    const [mediaModal, setMediaModal] = useState<{ show: boolean, type: 'image' | 'gallery' | 'video', url: string, urls: string }>({ show: false, type: 'image', url: '', urls: '' });
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadTarget, setUploadTarget] = useState<{ type: 'main' | 'widget', index?: number }>({ type: 'main' });
    const [duoModal, setDuoModal] = useState({ show: false, url1: '', url2: '', widgetIndex: undefined as number | undefined });
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
                            setSummary(data.recap.summary || '');
                            setCoverImage(data.recap.image || '');
                            setDate(data.recap.date || new Date().toISOString().split('T')[0]);
                            setFestival(data.recap.festival || '');
                            setLocationInput(data.recap.location || '');
                            setYoutubeId(data.recap.youtubeId || '');
                            setIsFeatured(data.recap.isFeatured || false);

                            let c = data.content || data.recap.content || '';
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
                                setSummary(localItem.summary);
                                setCoverImage(localItem.image);
                                setDate(localItem.date);
                                setFestival(localItem.festival || '');
                                setLocationInput(localItem.location || '');
                                setYoutubeId(localItem.youtubeId || '');
                                setIsFeatured(localItem.isFeatured || false);
                            }
                            setWidgets([{ id: 'legacy-1', content: data.content }]);
                        }
                    }
                } catch (e) {
                    console.error("Failed to fetch recap for edit", e);
                    setLoadError("Impossible de charger les données du récap.");
                } finally {
                    console.log('[RecapCreate] Fetch complete');
                    setIsLoading(false);
                    initialDataLoaded.current = true;
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
    }>({
        show: false,
        url: '',
        text: '',
        widgetId: null,
        start: 0,
        end: 0,
        isTextarea: false,
        isVisualEditor: false
    });

    const [isDirty, setIsDirty] = useState(false);
    const initialDataLoaded = useRef(false);

    // Track changes
    useEffect(() => {
        if (isEditing && editingItem && !initialDataLoaded.current) {
            if (title === editingItem.title && summary === editingItem.summary) {
                initialDataLoaded.current = true;
            }
            return;
        }
        if (!isEditing && !initialDataLoaded.current) {
            if (title || summary || coverImage) {
                initialDataLoaded.current = true;
            }
            return;
        }
        if (initialDataLoaded.current) {
            setIsDirty(true);
        }
    }, [title, summary, coverImage, widgets, date, festival, locationInput, youtubeId, isFeatured]);



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
            setSummary(editingItem.summary);
            setCoverImage(editingItem.image);
            setDate(editingItem.date);
            setFestival(editingItem.festival || '');
            setLocationInput(editingItem.location || '');
            setYoutubeId(editingItem.youtubeId || '');
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
        const isCorrectTextarea = !!(activeEl && activeEl.tagName === 'TEXTAREA');
        const isVisualEditor = !!(activeEl && activeEl.classList.contains('visual-editor-content'));

        const widgetId = id || (activeEl ? activeEl.getAttribute('data-widget-id') : null);
        if (!widgetId) return;

        let selection = '';
        let start = 0;
        let end = 0;

        if (isCorrectTextarea) {
            const ta = activeEl as HTMLTextAreaElement;
            selection = ta.value.substring(ta.selectionStart, ta.selectionEnd);
            start = ta.selectionStart;
            end = ta.selectionEnd;
        } else if (isVisualEditor) {
            selection = window.getSelection()?.toString() || '';
        }

        setLinkModal({
            show: true,
            url: '',
            text: selection || '',
            widgetId,
            start,
            end,
            isTextarea: isCorrectTextarea,
            isVisualEditor: isVisualEditor
        });
    };

    const confirmLinkInsertion = () => {
        const { url, text, widgetId, start, end, isTextarea, isVisualEditor } = linkModal;
        if (!url || !widgetId) return;

        if (isVisualEditor) {
            document.execCommand('createLink', false, url);
            setLinkModal({ ...linkModal, show: false });
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

        setLinkModal({ ...linkModal, show: false });
    };

    const updateWidget = (id: string, newContent: string) => {
        setWidgets(widgets.map(w => w.id === id ? { ...w, content: newContent } : w));
    };

    const toggleWidgetStyle = (id: string, style: 'uppercase' | 'font-display' | 'text-sm' | 'text-2xl' | 'text-5xl') => {
        setWidgets(prev => prev.map(w => {
            if (w.id !== id) return w;

            let content = w.content;
            // Detect if it's already wrapped in our style div
            const wrapperRegex = /^<div class="([^"]*)">\n([\s\S]*)\n<\/div>$/;
            const match = content.match(wrapperRegex);

            let classes: string[] = [];
            let innerContent = content;

            if (match) {
                classes = match[1].split(' ').filter(c => c);
                innerContent = match[2];
            }

            const sizeClasses = ['text-sm', 'text-2xl', 'text-5xl'];

            if (sizeClasses.includes(style)) {
                if (classes.includes(style)) {
                    classes = classes.filter(c => !sizeClasses.includes(c));
                } else {
                    classes = classes.filter(c => !sizeClasses.includes(c));
                    classes.push(style);
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
        const { type, url, urls } = mediaModal;
        let content = '';

        if (type === 'image' && url) {
            content = `<div class="image-premium-wrapper w-full relative rounded-3xl overflow-hidden shadow-2xl border border-white/5 my-12 group">
  <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"></div>
  <img src="${url}" alt="Image" class="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700" />
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
            if (typeof index === 'number') {
                addWidget(index, content);
            } else {
                setWidgets([...widgets, { id: Math.random().toString(36).substr(2, 9), content }]);
            }
        }
        setMediaModal({ show: false, type: 'image', url: '', urls: '' });
    };

    const handleSubmit = async (e: React.FormEvent | MouseEvent) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('Publication en cours...');

        try {
            const finalContent = widgets.map(w =>
                `<div class="article-section">\n\n${w.content}\n\n</div>`
            ).join('\n\n');

            const endpoint = isEditing ? '/api/recaps/update' : '/api/recaps/create';

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    id: isEditing ? id : undefined,
                    title,
                    summary,
                    content: finalContent,
                    image: coverImage,
                    date,
                    festival,
                    location: locationInput,
                    youtubeId,
                    category: 'Recaps',
                    isFeatured
                }),
            });

            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    errorData = { error: `Erreur ${response.status}: ${response.statusText} ` };
                }
                throw new Error(errorData.error || 'Erreur lors de la publication');
            }

            await response.json();

            setStatus('success');
            setIsDirty(false);
            setMessage(isEditing ? 'Récap mis à jour avec succès !' : 'Récap publié avec succès !');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            if (!isEditing) {
                setTitle('');
                setSummary('');
                setWidgets([{ id: 'new-1', content: '' }]);
                setCoverImage('');
                setFestival('');
                setLocationInput('');
                setYoutubeId('');
                setIsFeatured(false);
            }

        } catch (error) {
            console.error('Error creating recap:', error);
            setStatus('error');
            setMessage(error instanceof Error ? error.message : 'Une erreur est survenue');
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
        <div className="min-h-screen bg-dark-bg text-white py-32 px-6">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center gap-6 mb-8">
                    <button
                        onClick={() => {
                            if (window.history.length > 1) {
                                navigate(-1);
                            } else {
                                navigate('/admin/manage');
                            }
                        }}
                        className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-white group"
                        title="Retour"
                    >
                        <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div className="flex-1 flex items-center justify-between gap-4">
                        <h1 className="text-2xl md:text-4xl font-display font-black text-white uppercase italic tracking-tighter">
                            {isEditing ? 'Modifier le Récap' : 'Nouveau Récap'}
                        </h1>
                        {isEditing && (
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={status === 'loading'}
                                className={`px-4 md:px-6 py-2.5 rounded-2xl font-black uppercase tracking-widest text-[8px] md:text-[10px] transition-all flex items-center gap-2 shadow-lg ${status === 'loading'
                                    ? 'bg-gray-600 cursor-not-allowed opacity-50'
                                    : 'bg-neon-red hover:scale-105 active:scale-95 text-white shadow-neon-red/20'
                                    }`}
                            >
                                <Send className="w-4 h-4" />
                                {status === 'loading' ? 'EN COURS...' : 'METTRE À JOUR'}
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => setIsFeatured(!isFeatured)}
                            className={`flex items-center gap-3 px-6 py-2.5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all border ${isFeatured
                                ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.2)]'
                                : 'bg-white/5 border-white/10 text-gray-500 hover:text-white hover:border-white/20'
                                }`}
                        >
                            <Star className={`w-4 h-4 ${isFeatured ? 'fill-current' : ''}`} />
                            {isFeatured ? 'À LA UNE' : 'METTRE À LA UNE'}
                        </button>
                    </div>
                </div>

                <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8">

                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Title */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Titre du Récap <span className="text-neon-red">*</span></label>
                            <div className="relative group">
                                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-cyan transition-colors" />
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Ex: Récap : Tomorrowland 2026"
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

                        {/* Date & Youtube */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Date <span className="text-neon-red">*</span></label>
                                <div className="relative group">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-cyan transition-colors" />
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400 uppercase tracking-wider flex items-center justify-between">
                                    <span>Vidéo de l'article</span>
                                    <span className="text-[10px] text-neon-cyan/80 normal-case font-bold">(S'affichera en bas de l'article)</span>
                                </label>
                                <div className="relative group">
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
                                                id = val.split('youtu.be/')[1];
                                            }
                                            setYoutubeId(id);
                                        }}
                                        placeholder="URL Youtube ou ID"
                                        className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Festival & Location */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Images de la Galerie (Une par ligne) <span className="text-neon-red">*</span></label>
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
                                <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Lieu (Opt)</label>
                                <div className="relative group">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-cyan transition-colors" />
                                    <input
                                        type="text"
                                        value={locationInput}
                                        onChange={(e) => setLocationInput(e.target.value)}
                                        placeholder="Ex: Boom"
                                        className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Cover Image */}
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
                                        setUploadTarget({ type: 'main' });
                                        setShowUploadModal(true);
                                    }}
                                    className="px-6 py-4 bg-neon-red/20 border border-neon-red/50 text-neon-red rounded-xl font-bold uppercase tracking-wider hover:bg-neon-red/30 transition-all cursor-pointer flex flex-col items-center justify-center gap-1 min-w-[120px]"
                                >
                                    Upload
                                </button>

                            </div>
                        </div>

                        {/* Summary */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Résumé court</label>
                            <div className="relative group">
                                <textarea
                                    value={summary}
                                    onChange={(e) => setSummary(e.target.value)}
                                    placeholder="Un bref résumé..."
                                    className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-4 pr-12 text-white placeholder-gray-600 focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all h-24 resize-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setSummary(fixEncoding(summary))}
                                    className="absolute right-3 top-3 p-1.5 bg-white/5 hover:bg-neon-cyan/20 text-gray-500 hover:text-neon-cyan rounded-lg transition-all"
                                    title="Réparer les caractères"
                                >
                                    <Wand2 className="w-4 h-4" />
                                </button>
                            </div>
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
                                            setUploadTarget({ type: 'widget' });
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
                                        onClick={() => setMediaModal({ show: true, type: 'image', url: '', urls: '' })}
                                        className="flex items-center gap-2 px-4 py-2 bg-neon-red/20 border border-neon-red/30 text-neon-red rounded-full hover:bg-neon-red/30 transition-all font-bold uppercase tracking-widest text-[10px]"
                                    >
                                        <ImageIcon className="w-3 h-3" /> Image (URL)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDuoModal({ show: true, url1: '', url2: '', widgetIndex: undefined })}
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
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => insertLinkToActiveWidget(widget.id)}
                                                        className="p-2 text-gray-500 hover:text-neon-cyan hover:bg-neon-cyan/10 rounded-lg transition-colors flex items-center gap-2 text-[10px] font-bold uppercase"
                                                        title="Ajouter un lien"
                                                    >
                                                        <Link2 className="w-4 h-4" /> Lien
                                                    </button>
                                                    {(!widget.content.startsWith('<h2') && !widget.content.includes('image-premium-wrapper') && !widget.content.includes('gallery-premium-grid') && !widget.content.includes('youtube-player-widget')) && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleWidgetStyle(widget.id, 'font-display')}
                                                                className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-[10px] font-bold uppercase ${widget.content.includes('font-display') ? 'text-neon-cyan bg-neon-cyan/10' : 'text-gray-500 hover:text-neon-cyan hover:bg-neon-cyan/10'}`}
                                                                title="Changer Police (Display)"
                                                            >
                                                                <Type className="w-4 h-4" /> Police
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleWidgetStyle(widget.id, 'uppercase')}
                                                                className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-[10px] font-bold uppercase ${widget.content.includes('uppercase') ? 'text-neon-cyan bg-neon-cyan/10' : 'text-gray-500 hover:text-neon-cyan hover:bg-neon-cyan/10'}`}
                                                                title="Tout en Majuscules"
                                                            >
                                                                <CaseUpper className="w-4 h-4" /> MAJ
                                                            </button>
                                                            <div className="flex bg-black/40 rounded-lg border border-white/5 p-0.5">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleWidgetStyle(widget.id, 'text-sm')}
                                                                    className={`px-2 py-1 rounded transition-colors text-[10px] font-bold ${widget.content.includes('text-sm') ? 'text-neon-cyan bg-neon-cyan/10' : 'text-gray-500 hover:text-white'}`}
                                                                    title="Petit"
                                                                >
                                                                    S
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleWidgetStyle(widget.id, 'text-2xl')}
                                                                    className={`px-2 py-1 rounded transition-colors text-[10px] font-bold ${widget.content.includes('text-2xl') ? 'text-neon-cyan bg-neon-cyan/10' : 'text-gray-500 hover:text-white'}`}
                                                                    title="Grand"
                                                                >
                                                                    L
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleWidgetStyle(widget.id, 'text-5xl')}
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
                                                                {[
                                                                    '#ffffff', '#000000', '#6b7280', '#f5f5dc', '#ff1241', '#dc2626', '#991b1b',
                                                                    '#7f1d1d', '#7c3aed', '#bd00ff', '#ff00ff', '#f472b6', '#c084fc', '#fbcfe8',
                                                                    '#db2777', '#fb7185', '#fca5a5', '#fdba74', '#fb923c', '#fde047', '#facc15',
                                                                    '#bef264', '#86efac', '#22c55e', '#f87171', '#16a34a', '#10b981', '#84cc16',
                                                                    '#2dd4bf', '#99f6e4', '#2b65ec', '#38bdf8', '#00fff3'
                                                                ].map(color => (
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
                                                !widget.content.includes('youtube-player-widget') && !widget.content.includes('image-premium-wrapper') && !widget.content.includes('gallery-premium-grid') && (
                                                    <div className="admin-editor-container bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                                                        <div
                                                            contentEditable
                                                            dangerouslySetInnerHTML={{ __html: widget.content }}
                                                            onInput={(e) => updateWidget(widget.id, e.currentTarget.innerHTML)}
                                                            className="visual-editor-content p-8 min-h-[150px] text-white outline-none focus:bg-white/[0.04] transition-all article-body-premium"
                                                            data-widget-id={widget.id}
                                                            onFocus={(e) => {
                                                                if (e.currentTarget.innerHTML === '<br>') e.currentTarget.innerHTML = '';
                                                            }}
                                                        />
                                                    </div>
                                                )
                                            )}
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
                                                    onClick={() => setMediaModal({ show: true, type: 'image', url: '', urls: '', widgetIndex: index } as any)}
                                                    className="w-8 h-8 rounded-full bg-neon-purple/10 border border-neon-purple/30 text-neon-purple flex items-center justify-center hover:bg-neon-purple/20 transition-all"
                                                    title="Ajouter une image ici"
                                                >
                                                    <ImageIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setUploadTarget({ type: 'widget', index });
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
                                {youtubeId && (
                                    <div className="mb-12">
                                        <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-3xl shadow-neon-red/5">
                                            <iframe
                                                src={`https://www.youtube.com/embed/${youtubeId}`}
                                                className="absolute top-0 left-0 w-full h-full"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            />
                                        </div>
                                    </div>
                                )}
                                {
                                    widgets.map(w => (
                                        <div key={w.id} className="article-section">
                                            <div dangerouslySetInnerHTML={{ __html: standardizeContent(w.content) }} />
                                        </div>
                                    ))
                                }
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${status === 'loading'
                                    ? 'bg-gray-600 cursor-not-allowed'
                                    : 'bg-neon-cyan hover:bg-neon-cyan/80 text-black'
                                    }`}
                            >
                                {status === 'loading' ? (
                                    'Publication en cours...'
                                ) : (
                                    <>
                                        <Send className="w-5 h-5" />
                                        {isEditing ? 'Mettre à jour le Récap' : 'Publier le Récap'}
                                    </>
                                )}
                            </button>

                            {
                                status && status !== 'loading' && message && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`mt-4 p-4 rounded-xl text-center font-bold uppercase tracking-widest text-[10px] border ${status === 'success' ? 'bg-green-500/10 border-green-500/50 text-green-500' : 'bg-red-500/10 border-red-500/50 text-red-500'
                                            }`}
                                    >
                                        {message}
                                    </motion.div>
                                )
                            }
                        </div>
                    </form>
                </div>
            </div>
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
                                        <input
                                            type="text"
                                            value={mediaModal.url}
                                            onChange={e => setMediaModal({ ...mediaModal, url: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-neon-red transition-all text-xs"
                                            placeholder={mediaModal.type === 'video' ? "Ex: https://youtube.com/watch?v=..." : "https://site.com/image.jpg"}
                                            autoFocus
                                        />
                                    </div>
                                )}

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => window.open('https://www.image2url.com/bulk-image-upload', 'ImageUpload', 'width=800,height=600')}
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
                onUploadSuccess={(url) => {
                    if (uploadTarget.type === 'main') {
                        setCoverImage(url);
                    } else if (uploadTarget.type === 'duo1' as any) {
                        setDuoModal(prev => ({ ...prev, url1: url }));
                    } else if (uploadTarget.type === 'duo2' as any) {
                        setDuoModal(prev => ({ ...prev, url2: url }));
                    } else {
                        // Create a new image widget
                        const imgWidget = `<div class="image-premium-wrapper w-full relative rounded-3xl overflow-hidden shadow-2xl border border-white/5 my-12 group">\n  <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"></div>\n  <img src="${url}" alt="Image" class="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700" />\n</div>`;
                        addWidget(uploadTarget.index, imgWidget);
                    }
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
                                onClick={() => setDuoModal({ show: false, url1: '', url2: '', widgetIndex: undefined })}
                                className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <h3 className="text-xl font-display font-black text-white uppercase italic mb-6">Ajouter Duo Photos</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Image Gauche (URL)</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={duoModal.url1}
                                            onChange={e => setDuoModal({ ...duoModal, url1: e.target.value })}
                                            className="flex-1 bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-neon-purple transition-all"
                                            placeholder="https://..."
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setUploadTarget({ type: 'duo1' as any });
                                                setShowUploadModal(true);
                                            }}
                                            className="px-4 bg-neon-purple/20 border border-neon-purple/30 text-neon-purple rounded-xl font-bold text-[10px] uppercase hover:bg-neon-purple/30 transition-all"
                                        >
                                            Upload
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Image Droite (URL)</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={duoModal.url2}
                                            onChange={e => setDuoModal({ ...duoModal, url2: e.target.value })}
                                            className="flex-1 bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-neon-purple transition-all"
                                            placeholder="https://..."
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setUploadTarget({ type: 'duo2' as any });
                                                setShowUploadModal(true);
                                            }}
                                            className="px-4 bg-neon-purple/20 border border-neon-purple/30 text-neon-purple rounded-xl font-bold text-[10px] uppercase hover:bg-neon-purple/30 transition-all"
                                        >
                                            Upload
                                        </button>
                                    </div>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button
                                        onClick={() => setDuoModal({ show: false, url1: '', url2: '', widgetIndex: undefined })}
                                        className="flex-1 py-3 rounded-xl border border-white/10 text-gray-500 font-bold uppercase tracking-widest text-[10px] hover:bg-white/5 transition-all"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (!duoModal.url1 || !duoModal.url2) return;
                                            const duoWidget = `<div class="duo-photos-premium grid grid-cols-2 gap-4 my-12">\n  <div class="image-premium-wrapper relative rounded-3xl overflow-hidden shadow-2xl border border-white/5 group">\n    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"></div>\n    <img src="${duoModal.url1}" alt="Portrait 1" class="w-full aspect-[3/4] object-cover transform group-hover:scale-105 transition-transform duration-700" />\n  </div>\n  <div class="image-premium-wrapper relative rounded-3xl overflow-hidden shadow-2xl border border-white/5 group">\n    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"></div>\n    <img src="${duoModal.url2}" alt="Portrait 2" class="w-full aspect-[3/4] object-cover transform group-hover:scale-105 transition-transform duration-700" />\n  </div>\n</div>`;

                                            if (duoModal.widgetIndex !== undefined) {
                                                addWidget(duoModal.widgetIndex, duoWidget);
                                            } else {
                                                setWidgets([...widgets, { id: Math.random().toString(36).substr(2, 9), content: duoWidget }]);
                                            }
                                            setDuoModal({ show: false, url1: '', url2: '', widgetIndex: undefined });
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
                isOpen={blocker.state === "blocked"}
                message="Vous avez des modifications non enregistrées. Voulez-vous vraiment quitter la page ?"
                onConfirm={() => blocker.proceed?.()}
                onCancel={() => blocker.reset?.()}
                accentColor="neon-red"
            />
        </div>
    );
}

export default RecapCreate;
