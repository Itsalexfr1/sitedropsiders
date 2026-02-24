
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, Image as ImageIcon, FileText, Music, Link2, Eye, X, Upload, Youtube, AlertCircle, Calendar, Edit2, CaseUpper, Type, Columns, List, Bold, Italic, Underline as UnderlineIcon, Send, User, Clock } from 'lucide-react';
import { useNavigate, useSearchParams, useLocation, useBlocker } from 'react-router-dom';
import { getAuthHeaders } from '../utils/auth';
import { ImageUploadModal } from '../components/ImageUploadModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { fixEncoding, standardizeContent } from '../utils/standardizer';
import { Wand2, Star } from 'lucide-react';
import newsData from '../data/news.json';
import editorsData from '../data/editors.json';
import '../styles/article-premium.css';



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

    const [title, setTitle] = useState('');
    const [summary, setSummary] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    console.log('[NewsCreate] Initialization. isEditing:', isEditing, 'id:', id);
    const [category, setCategory] = useState(type);
    const [youtubeId, setYoutubeId] = useState('');
    const [interviewSubtype, setInterviewSubtype] = useState<'written' | 'video'>((searchParams.get('subtype') as 'written' | 'video') || 'written');
    const [author, setAuthor] = useState(
        localStorage.getItem('admin_name') || localStorage.getItem('admin_user') || 'Alex'
    );






    // Widget System State
    const [widgets, setWidgets] = useState<{ id: string, content: string }[]>([
        { id: 'initial-1', content: '<h2 class="premium-section-title">TITRE DE L\'ARTICLE</h2>' }
    ]);

    const [activeTab, setActiveTab] = useState<'News' | 'Musique' | 'Focus'>(type === 'Musique' ? 'Musique' : 'News');
    const [musicItems, setMusicItems] = useState([{ id: Math.random().toString(36).substr(2, 9), title: '', media: '' }]);
    const [mediaModal, setMediaModal] = useState<{ show: boolean, type: 'image' | 'gallery' | 'video', url: string, urls: string, aspectRatio?: string, widgetId?: string }>({ show: false, type: 'image', url: '', urls: '', aspectRatio: 'auto' });
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadTarget, setUploadTarget] = useState<{ type: 'main' | 'widget' | 'widget-edit' | 'duo1' | 'duo2', index?: number, widgetId?: string }>({ type: 'main' });
    const [isFeatured, setIsFeatured] = useState(false);
    const [duoModal, setDuoModal] = useState({ show: false, url1: '', url2: '', widgetIndex: undefined as number | undefined, widgetId: undefined as string | undefined, aspectRatio: '3/4' });
    const [isLoading, setIsLoading] = useState(isEditing && !editingItem);

    // Fetch item if missing from state but ID is present
    useEffect(() => {
        const id = searchParams.get('id');
        if (isEditing && !editingItem && id) {
            setIsLoading(true);
            const fetchFullItem = async () => {
                try {
                    // We need to fetch both base info and content
                    // Often /api/news returns the list, and /api/news/content returns content
                    const response = await fetch(`/api/news/content?id=${id}`, { headers: getAuthHeaders() });
                    if (response.ok) {
                        const data = await response.json();
                        // If we have an article object back, use it
                        if (data.article) {
                            setTitle(data.article.title);
                            setSummary(data.article.summary);
                            setImageUrl(data.article.image);
                            setDate(data.article.date);
                            setCategory(data.article.category);
                            setYoutubeId(data.article.youtubeId || '');
                            setIsFeatured(data.article.isFeatured || false);

                            // Parse Content
                            let c = data.content || data.article.content || '';
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

                            if (data.article.category === 'Musique') {
                                setActiveTab('Musique');
                                const musicSectionRegex = /<div class="music-top-item-premium[^>]*>[\s\S]*?<h3[^>]*>(.*?)<\/h3>[\s\S]*?<iframe[^>]*src="(.*?)"[\s\S]*?<\/div>/g;
                                const foundMusic = [];
                                let match;
                                while ((match = musicSectionRegex.exec(data.article.content || '')) !== null) {
                                    foundMusic.push({
                                        id: Math.random().toString(36).substr(2, 9),
                                        title: match[1].trim(),
                                        media: match[2].trim()
                                    });
                                }
                                if (foundMusic.length > 0) setMusicItems(foundMusic);
                            } else if (data.article.category === 'Interview Video') {
                                setInterviewSubtype('video');
                            } else if (data.article.isFocus) {
                                setActiveTab('Focus');
                            }
                        } else if (data.content) {
                            // Only content returned, try to find metadata in newsData
                            const localItem = (newsData as any[]).find(n => String(n.id) === String(id));
                            if (localItem) {
                                setTitle(localItem.title);
                                setSummary(localItem.summary);
                                setImageUrl(localItem.image);
                                setDate(localItem.date);
                                setCategory(localItem.category);
                                setIsFeatured(localItem.isFeatured || false);
                                if (localItem.category === 'Interview Video') {
                                    setInterviewSubtype('video');
                                }

                                if (localItem.category === 'Musique') {
                                    setActiveTab('Musique');
                                    const musicSectionRegex = /<div class="music-top-item-premium[^>]*>[\s\S]*?<h3[^>]*>(.*?)<\/h3>[\s\S]*?<iframe[^>]*src="(.*?)"[\s\S]*?<\/div>/g;
                                    const foundMusic = [];
                                    let match;
                                    while ((match = musicSectionRegex.exec(data.content || '')) !== null) {
                                        foundMusic.push({
                                            id: Math.random().toString(36).substr(2, 9),
                                            title: match[1].trim(),
                                            media: match[2].trim()
                                        });
                                    }
                                    if (foundMusic.length > 0) setMusicItems(foundMusic);
                                } else if (localItem.isFocus) {
                                    setActiveTab('Focus');
                                }
                            }
                            setWidgets([{ id: 'legacy-1', content: data.content }]);
                        }
                    }
                } catch (e) {
                    console.error("Failed to fetch item for edit", e);
                } finally {
                    console.log('[NewsCreate] Fetch complete');
                    setIsLoading(false);
                    // Ensure tracking works after fetch
                    initialDataLoaded.current = true;
                }
            };
            fetchFullItem();
        } else {
            setIsLoading(false);
        }
    }, [isEditing, editingItem, searchParams, type]);

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
            if (title || summary || imageUrl) {
                initialDataLoaded.current = true;
            }
            return;
        }

        if (initialDataLoaded.current) {
            setIsDirty(true);
        }
    }, [title, summary, imageUrl, widgets, date, category, youtubeId, isFeatured, musicItems]);



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
            setImageUrl(editingItem.image);
            setDate(editingItem.date);
            setCategory(editingItem.category);
            setYoutubeId(editingItem.youtubeId || '');
            setIsFeatured(editingItem.isFeatured || false);
            setAuthor(editingItem.author || localStorage.getItem('admin_name') || localStorage.getItem('admin_user') || 'Alex');

            if (editingItem.category === 'Musique') {
                setActiveTab('Musique');
                // Try to parse music items
                const musicSectionRegex = /<div class="music-top-item-premium[^>]*>[\s\S]*?<h3[^>]*>(.*?)<\/h3>[\s\S]*?<iframe[^>]*src="(.*?)"[\s\S]*?<\/div>/g;
                const foundMusic = [];
                let match;
                while ((match = musicSectionRegex.exec(editingItem.content || '')) !== null) {
                    foundMusic.push({
                        id: Math.random().toString(36).substr(2, 9),
                        title: match[1].trim(),
                        media: match[2].trim()
                    });
                }
                if (foundMusic.length > 0) setMusicItems(foundMusic);
            } else if (editingItem.isFocus) {
                setActiveTab('Focus');
            }

            // Parse Content into Widgets
            let c = editingItem.content || '';
            // Basic cleanup of wrapper if present from old system
            if (typeof c === 'string' && c.startsWith('<div class="markdown-content">')) {
                c = c.replace('<div class="markdown-content">', '').replace(/<\/div>$/, '').replace(/<br>/g, '\n');
            }
            if (typeof c === 'string' && c.startsWith('<div class="article-section">')) {
                // Optimization: if it's Just one big section, we might want to keep it as one widget
            }

            const foundWidgets: { id: string, content: string }[] = [];
            const articleSectionPattern = '<div class="article-section';
            if (c.includes(articleSectionPattern)) {
                const parts = c.split(articleSectionPattern);
                for (let i = 1; i < parts.length; i++) {
                    const part = parts[i];
                    const openTagEnd = part.indexOf('>');
                    if (openTagEnd !== -1) {
                        let content = part.substring(openTagEnd + 1);
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
                // FALLBACK: If no sections found but content exists, don't leave it empty
                setWidgets([{ id: 'legacy-1', content: c || '' }]);
            }
        } else if (!isEditing) {
            setCategory(type);
        }
    }, [type, isEditing, editingItem]);

    const pageTitle = isEditing
        ? `Modifier ${type === 'Interview' ? 'l\'Interview' : 'l\'Article'}`
        : (type === 'Interview' ? 'Ajouter une Interview' : 'Ajouter une News');

    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

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

        if (isVisualEditor) {
            const url = prompt('ENTREZ L\'URL DU LIEN :');
            if (url) {
                document.execCommand('createLink', false, url);
                const event = new Event('input', { bubbles: true });
                activeEl.dispatchEvent(event);
            }
            return;
        }

        const isCorrectTextarea = !!(activeEl && activeEl.tagName === 'TEXTAREA');
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

            let content = w.content;
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
                    // Similar to toggleWidgetStyle but for style attribute
                    const styleRegex = /style="color:\s*([^"]*)"/;
                    if (w.content.includes('style="color:')) {
                        return { ...w, content: w.content.replace(styleRegex, `style="color: ${color}"`) };
                    } else {
                        return { ...w, content: `<div style="color: ${color}">\n${w.content}\n</div>` };
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

    const fixWidgetEncoding = (id: string) => {
        setWidgets(widgets.map(w => w.id === id ? { ...w, content: fixEncoding(w.content) } : w));
    };

    const removeWidget = (id: string) => {
        if (widgets.length > 1) {
            setWidgets(widgets.filter(w => w.id !== id));
        }
    };

    const addMusicItem = () => {
        setMusicItems([...musicItems, { id: Math.random().toString(36).substr(2, 9), title: '', media: '' }]);
    };

    const updateMusicItem = (id: string, field: 'title' | 'media', value: string) => {
        setMusicItems(musicItems.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const removeMusicItem = (id: string) => {
        if (musicItems.length > 1) {
            setMusicItems(musicItems.filter(item => item.id !== id));
        }
    };

    const renderMediaEmbed = (url: string) => {
        if (!url) return '';

        // 1. Spotify
        if (url.includes('spotify.com')) {
            let embedUrl = url;
            // Standardize URL to use /embed/
            if (!url.includes('/embed/')) {
                // Matches tracks, albums, playlists
                embedUrl = url.replace(/(open\.spotify\.com\/)(track|album|playlist|artist)\/([a-zA-Z0-9]+)/, '$1embed/$2/$3');
            }
            return `<iframe src="${embedUrl}" width="100%" height="152" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`;
        }

        // 2. YouTube
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            let videoId = '';
            if (url.includes('v=')) {
                videoId = url.split('v=')[1].split('&')[0];
            } else if (url.includes('youtu.be/')) {
                videoId = url.split('youtu.be/')[1].split('?')[0];
            } else if (url.includes('embed/')) {
                videoId = url.split('embed/')[1].split('?')[0];
            }
            return `<div class="aspect-video h-full w-full"><iframe src="https://www.youtube.com/embed/${videoId}" class="w-full h-full" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe></div>`;
        }

        // 3. Beatport
        if (url.includes('beatport.com')) {
            // Match track or release ID: beatport.com/track/name/ID or beatport.com/release/name/ID
            const match = url.match(/\/(track|release)\/[^/]+\/(\d+)/);
            if (match) {
                const type = match[1];
                const id = match[2];
                return `<iframe src="https://embed.beatport.com/?id=${id}&type=${type}" width="100%" height="162" frameBorder="0" scrolling="no" style="background: #111;"></iframe>`;
            }
        }

        return `<a href="${url}" target="_blank" class="text-neon-cyan hover:underline p-4 block bg-white/5 rounded-xl border border-white/10 text-center font-bold uppercase tracking-widest text-[10px]">${url}</a>`;
    };

    const handleMediaConfirm = (index?: number) => {
        const { type, url, urls, aspectRatio } = mediaModal;
        let content = '';

        if (type === 'image' && url) {
            const aspectClass = aspectRatio && aspectRatio !== 'auto' ? `aspect-[${aspectRatio}]` : '';
            const imgClass = aspectRatio && aspectRatio !== 'auto' ? 'w-full h-full object-cover' : 'w-full h-auto object-cover';
            content = `<div class="image-premium-wrapper w-full relative rounded-3xl overflow-hidden shadow-2xl border border-white/5 my-12 group ${aspectClass}">
  <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"></div>
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
  </div>`).join('\n')}
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

    const handleSubmit = async () => {
        const isInterviewVideo = type === 'Interview' && interviewSubtype === 'video';

        if (!title || (!imageUrl && !isInterviewVideo)) {
            setStatus('error');
            setMessage('Veuillez remplir les champs obligatoires (Titre, Image)');
            return;
        }

        if (isInterviewVideo && !youtubeId) {
            setStatus('error');
            setMessage('Le lien vidéo est obligatoire pour une interview vidéo');
            return;
        }

        setStatus('loading');
        setMessage('Publication en cours...');

        try {
            let finalContent = '';
            let finalCategory = category;
            let isFocus = activeTab === 'Focus';
            let finalImageUrl = imageUrl;

            if (isInterviewVideo) {
                finalCategory = 'Interview Video';
                if (!finalImageUrl && youtubeId) {
                    finalImageUrl = `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
                }
                finalContent = `<div class="article-section">
<div class="youtube-player-widget w-full relative aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/5 my-12">
  <iframe src="https://www.youtube.com/embed/${youtubeId}" class="absolute inset-0 w-full h-full" allowfullscreen></iframe>
</div>
</div>`;
            } else if (activeTab === 'Musique') {
                finalCategory = 'Musique';
                const musicHtml = musicItems.map((item) => `
<div class="music-top-item-premium mb-12 last:mb-0">
    <div class="flex items-center gap-6 mb-6">
        <h3 class="text-2xl font-display font-black text-white uppercase italic tracking-tight">${item.title}</h3>
    </div>
    <div class="rounded-2xl overflow-hidden border border-white/10 bg-black/40 shadow-2xl">
        ${renderMediaEmbed(item.media)}
    </div>
</div>`).join('\n');
                finalContent = `<div class="article-section music-top-section">\n\n${musicHtml}\n\n</div>`;
            } else {
                if (type === 'Interview') finalCategory = 'Interview';
                // Construct Final Content with HTML Wrappers for Automatic Styling
                finalContent = widgets.map(w =>
                    `<div class="article-section">\n\n${w.content}\n\n</div>`
                ).join('\n\n');
            }

            const payload = {
                id: isEditing ? id : undefined,
                title: fixEncoding(title),
                summary: fixEncoding(summary),
                date,
                image: finalImageUrl,
                category: finalCategory,
                content: fixEncoding(finalContent),
                youtubeId,
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
                await response.json();
                setStatus('success');
                setIsDirty(false);
                setMessage(isEditing ? 'Article mis à jour avec succès !' : 'Article publié avec succès !');
                window.scrollTo({ top: 0, behavior: 'smooth' });

                if (!isEditing) {
                    // Reset to TRUE initial state (with title placeholder widget)
                    setTitle('');
                    setSummary('');
                    setWidgets([{ id: 'initial-' + Math.random().toString(36).substr(2, 9), content: '<h2 class="premium-section-title">TITRE DE L\'ARTICLE</h2>' }]);
                    setImageUrl('');
                    setYoutubeId('');
                    setMusicItems([{ id: Math.random().toString(36).substr(2, 9), title: '', media: '' }]);
                    setIsFeatured(false);
                    setIsDirty(false); // Reset dirty state after successful publication
                    // Clear status after a while
                    setTimeout(() => setStatus('idle'), 3000);
                } else {
                    // If editing, redirect back to management after a short delay
                    setIsDirty(false); // Reset dirty state before redirect
                    setTimeout(() => navigate('/admin/manage'), 2000);
                }
            } else {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    errorData = { error: `Erreur ${response.status}: ${response.statusText}` };
                }
                setStatus('error');
                setMessage(errorData.error || 'Erreur lors de la publication');
            }
        } catch (e) {
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
                            <h1 className="text-3xl md:text-5xl font-display font-black text-white uppercase italic tracking-tighter leading-none">
                                Studio <span className="text-neon-red">Editor</span>
                            </h1>
                            <p className="text-gray-400 mt-2 text-sm md:text-base">{pageTitle}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        {isEditing && (
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={status === 'loading'}
                                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-lg ${status === 'loading'
                                    ? 'bg-gray-600 cursor-not-allowed opacity-50'
                                    : 'bg-gradient-to-r from-neon-orange to-neon-red hover:scale-105 active:scale-95 text-white'
                                    }`}
                            >
                                <Send className="w-4 h-4" />
                                <span>{status === 'loading' ? 'EN COURS...' : 'METTRE À JOUR'}</span>
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

                <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-4 md:p-8">
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



                    <div className="space-y-6">

                        {/* Status Message */}
                        {status !== 'idle' && (
                            <div className={`p-4 rounded-xl flex flex-col gap-3 ${status === 'error' ? 'bg-red-500/10 text-red-500' :
                                status === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'
                                }`}>
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5" />
                                    <p className="font-bold uppercase tracking-wider text-xs">{message}</p>
                                </div>

                            </div>
                        )}

                        {/* Metadata Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
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
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest">Date de Publication <span className="text-neon-red">*</span></label>
                                    <button
                                        type="button"
                                        onClick={() => setDate(new Date().toISOString().split('T')[0])}
                                        className="text-[9px] font-black text-neon-cyan hover:text-white uppercase tracking-widest transition-colors"
                                    >
                                        Aujourd'hui
                                    </button>
                                </div>
                                <div className="relative group">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-neon-cyan transition-colors" />
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 pl-10 text-white focus:border-neon-cyan outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Author Selector */}
                        <div>
                            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <User className="w-4 h-4" /> Éditeur
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                                <select
                                    value={author}
                                    onChange={(e) => setAuthor(e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 pl-10 text-white focus:border-neon-cyan outline-none appearance-none cursor-pointer"
                                >
                                    {(editorsData as any[]).map((editor: any) => (
                                        <option key={editor.username} value={editor.name} className="bg-dark-bg text-white">
                                            {editor.name}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>
                        </div>

                        {(activeTab !== 'Musique' && !(type === 'Interview' && interviewSubtype === 'video')) && (
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Résumé (Intro) <span className="text-neon-red">*</span></label>
                                <div className="relative group">
                                    <textarea
                                        value={summary}
                                        onChange={(e) => setSummary(e.target.value)}
                                        className="w-full h-24 bg-black/20 border border-white/10 rounded-lg p-3 pr-12 text-white focus:border-neon-cyan outline-none resize-none"
                                        placeholder="Un court résumé..."
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setSummary(fixEncoding(summary))}
                                        className="absolute right-3 top-3 p-1.5 bg-white/5 hover:bg-neon-red/20 text-gray-500 hover:text-neon-red rounded-lg transition-all"
                                        title="Réparer les caractères"
                                    >
                                        <Wand2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Image & Youtube */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {!(type === 'Interview' && interviewSubtype === 'video') && (
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
                                                setUploadTarget({ type: 'main' });
                                                setShowUploadModal(true);
                                            }}
                                            className="px-6 py-4 bg-neon-red/20 border border-neon-red/50 text-neon-red rounded-xl font-bold uppercase tracking-wider hover:bg-neon-red/30 transition-all cursor-pointer flex flex-col items-center justify-center gap-1 min-w-[120px]"
                                        >
                                            Upload
                                        </button>

                                    </div>
                                </div>
                            )}
                            <div className={type === 'Interview' && interviewSubtype === 'video' ? 'md:col-span-2' : ''}>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center justify-between gap-2">
                                    <span className="flex items-center gap-2">
                                        <Youtube className="w-4 h-4" /> {type === 'Interview' && interviewSubtype === 'video' ? 'Lien Vidéo (ID ou URL)' : 'Vidéo de l\'article'}
                                    </span>
                                    <span className="text-[9px] text-neon-cyan/80 normal-case font-bold">
                                        {type === 'Interview' && interviewSubtype === 'video' ? '(Obligatoire)' : '(S\'affichera en bas de l\'article)'}
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    value={youtubeId}
                                    onChange={(e) => {
                                        let val = e.target.value;
                                        if (val.includes('youtube.com/watch?v=')) {
                                            val = val.split('v=')[1].split('&')[0];
                                        } else if (val.includes('youtu.be/')) {
                                            val = val.split('youtu.be/')[1].split('?')[0];
                                        } else if (val.includes('youtube.com/embed/')) {
                                            val = val.split('youtube.com/embed/')[1].split('?')[0];
                                        }
                                        setYoutubeId(val);
                                    }}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-neon-cyan outline-none"
                                    placeholder="ID ou URL YouTube"
                                />
                            </div>
                        </div>

                        {/* WIDGET EDITOR SECTION (News & Focus & Written Interviews) */}
                        {((activeTab === 'News' || activeTab === 'Focus') && !(type === 'Interview' && interviewSubtype === 'video')) && (
                            <div className="pt-8 border-t border-white/10">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                    <label className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-neon-cyan" /> WIDGETS
                                    </label>
                                    <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0">
                                        <button
                                            onClick={() => {
                                                const id = Math.random().toString(36).substr(2, 9);
                                                setWidgets([...widgets, { id, content: '<h2 class="premium-section-title">MON TITRE ICI</h2>' }]);
                                            }}
                                            className="whitespace-nowrap flex items-center gap-2 px-3 py-2 bg-neon-red/10 border border-neon-red/30 text-neon-red rounded-full hover:bg-neon-red/20 transition-all font-bold uppercase tracking-widest text-[9px]"
                                        >
                                            <Plus className="w-3 h-3" /> Titre
                                        </button>
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
                                                setUploadTarget({ type: 'widget' });
                                                setShowUploadModal(true);
                                            }}
                                            className="whitespace-nowrap flex items-center gap-2 px-3 py-2 bg-neon-cyan/20 border border-neon-cyan/30 text-neon-cyan rounded-full hover:bg-neon-cyan/30 transition-all font-bold uppercase tracking-widest text-[9px]"
                                        >
                                            <Upload className="w-3 h-3" /> Upload
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDuoModal({ show: true, url1: '', url2: '', widgetIndex: undefined, widgetId: undefined, aspectRatio: '3/4' })}
                                            className="whitespace-nowrap flex items-center gap-2 px-3 py-2 bg-neon-purple/20 border border-neon-purple/30 text-neon-purple rounded-full hover:bg-neon-purple/30 transition-all font-bold uppercase tracking-widest text-[9px]"
                                        >
                                            <Columns className="w-3 h-3" /> Duo
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setMediaModal({ show: true, type: 'gallery', url: '', urls: '' })}
                                            className="whitespace-nowrap flex items-center gap-2 px-3 py-2 bg-neon-pink/10 border border-neon-pink/30 text-neon-pink rounded-full hover:bg-neon-pink/20 transition-all font-bold uppercase tracking-widest text-[9px]"
                                        >
                                            <Plus className="w-3 h-3" /> Galerie
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {widgets.map((widget, index) => (
                                        <div key={widget.id} className="space-y-4">
                                            <div className="relative group bg-white/5 border border-white/10 rounded-2xl p-3 md:p-6 transition-all hover:border-white/20">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-black text-gray-400">
                                                            {index + 1}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                                            {widget.content.startsWith('<h2') ? 'Titre' :
                                                                widget.content.includes('duo-photos-premium') ? 'Duo Photos' :
                                                                    widget.content.includes('image-premium-wrapper') ? 'Image' :
                                                                        widget.content.includes('gallery-premium-grid') ? 'Galerie' : 'Texte'}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-2">
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
                                                                    onMouseDown={e => e.preventDefault()} onClick={() => toggleWidgetStyle(widget.id, 'font-display')}
                                                                    className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-[10px] font-bold uppercase ${widget.content.includes('font-display') ? 'text-neon-cyan bg-neon-cyan/10' : 'text-gray-500 hover:text-neon-cyan hover:bg-neon-cyan/10'}`}
                                                                    title="Changer Police (Display)"
                                                                >
                                                                    <Type className="w-4 h-4" /> Police
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
                                                        )}
                                                        {widgets.length > 1 && (
                                                            <button
                                                                onClick={() => removeWidget(widget.id)}
                                                                className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

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
                                                        <div className="admin-editor-container bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                                                            <VisualEditor
                                                                content={widget.content}
                                                                onChange={(html) => updateWidget(widget.id, html)}
                                                                className="visual-editor-content p-4 md:p-8 min-h-[150px] text-white outline-none focus:bg-white/[0.04] transition-all article-body-premium text-sm md:text-base"
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
                                                )}
                                            </div>

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
                                                            setUploadTarget({ type: 'widget', index });
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
                                                        onClick={() => setVideoGroupModal({ show: true, urls: ['', '', ''], count: 2, widgetIndex: index })}
                                                        className="w-8 h-8 rounded-full bg-red-600/10 border border-red-600/30 text-red-600 flex items-center justify-center hover:bg-red-600/20 transition-all font-bold text-[10px]"
                                                        title="Ajouter un groupe de vidéos (1, 2 ou 3 en ligne)"
                                                    >
                                                        3x
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDuoModal({ show: true, url1: '', url2: '', widgetIndex: index, widgetId: undefined, aspectRatio: '3/4' })}
                                                        className="w-8 h-8 rounded-full bg-neon-purple/10 border border-neon-purple/30 text-neon-purple flex items-center justify-center hover:bg-neon-purple/20 transition-all"
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
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Lien YouTube ou Spotify</label>
                                                    <input
                                                        type="text"
                                                        value={item.media}
                                                        onChange={(e) => updateMusicItem(item.id, 'media', e.target.value)}
                                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-neon-cyan outline-none"
                                                        placeholder="URL du morceau..."
                                                    />
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => removeMusicItem(item.id)}
                                                className="absolute top-2 right-2 p-1.5 text-gray-600 hover:text-neon-red opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>

                                            {item.media && (
                                                <div className="mt-4 pt-4 border-t border-white/5">
                                                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Aperçu Media</div>
                                                    <div className="max-w-md" dangerouslySetInnerHTML={{ __html: renderMediaEmbed(item.media) }} />
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
                                    {summary && (
                                        <p className="article-body-premium text-gray-400 text-lg md:text-xl leading-relaxed italic" dangerouslySetInnerHTML={{ __html: standardizeContent(summary) }} />
                                    )}
                                </div>
                                {activeTab === 'Musique' ? (
                                    <div className="music-top-section">
                                        {musicItems.map((item) => (
                                            <div key={item.id} className="music-top-item-premium mb-12 last:mb-0">
                                                <div className="flex items-center gap-6 mb-6">
                                                    <h3 className="text-2xl font-display font-black text-white uppercase italic tracking-tight">{item.title || 'Titre du morceau'}</h3>
                                                </div>
                                                <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/40 shadow-2xl">
                                                    <div dangerouslySetInnerHTML={{ __html: renderMediaEmbed(item.media) }} />
                                                </div>
                                            </div>
                                        ))}
                                        {youtubeId && (
                                            <div className="mt-16 mb-16 px-4">
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
                                    </div>
                                ) : (
                                    <>
                                        {widgets.map(w => (
                                            <div key={w.id} className="article-section">
                                                <div dangerouslySetInnerHTML={{ __html: standardizeContent(w.content) }} />
                                            </div>
                                        ))}
                                        {youtubeId && (
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
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="pt-6">
                            <button
                                onClick={handleSubmit}
                                disabled={status === 'loading'}
                                className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest transition-all ${status === 'loading'
                                    ? 'bg-gray-600 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-neon-orange to-neon-red hover:shadow-[0_0_20px_rgba(255,102,0,0.4)]'
                                    } text-white`}
                            >
                                {status === 'loading' ? 'Publication...' : (isEditing ? 'Mettre à jour l\'article' : 'Publier l\'article')}
                            </button>

                            {status && status !== 'loading' && message && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`mt-4 p-4 rounded-xl text-center font-bold uppercase tracking-widest text-[10px] border ${status === 'success' ? 'bg-green-500/10 border-green-500/50 text-green-500' : 'bg-red-500/10 border-red-500/50 text-red-500'
                                        }`}
                                >
                                    {message}
                                </motion.div>
                            )}
                        </div>

                    </div>
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
                        const isVideo = url.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/) || url.includes('/video/upload/');
                        const mediaTag = isVideo
                            ? `<video src="${url}" autoplay loop muted playsinline class="w-full h-full object-cover"></video>`
                            : `<img src="${url}" alt="Image" class="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700" />`;

                        if (uploadTarget.type === 'main') {
                            setImageUrl(url);
                        } else if (uploadTarget.type === 'duo1' as any) {
                            setDuoModal(prev => ({ ...prev, url1: url }));
                        } else if (uploadTarget.type === 'duo2' as any) {
                            setDuoModal(prev => ({ ...prev, url2: url }));
                        } else if (uploadTarget.type === 'widget-edit' as any) {
                            const imgWidget = `<div class="image-premium-wrapper w-full relative rounded-3xl overflow-hidden shadow-2xl border border-white/5 my-12 group">\n  <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"></div>\n  ${mediaTag}\n</div>`;
                            updateWidget(uploadTarget.widgetId!, imgWidget);
                        } else {
                            // Create a new image widget
                            const imgWidget = `<div class="image-premium-wrapper w-full relative rounded-3xl overflow-hidden shadow-2xl border border-white/5 my-12 group">\n  <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"></div>\n  ${mediaTag}\n</div>`;
                            addWidget(uploadTarget.index, imgWidget);
                        }
                    }}
                    accentColor={type === 'Interview' ? 'neon-purple' : 'neon-red'}
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
                                                    ? `<video src="${duoModal.url1}" autoplay loop muted playsinline class="w-full aspect-[${duoModal.aspectRatio}] object-cover"></video>`
                                                    : `<img src="${duoModal.url1}" alt="Portrait 1" class="w-full aspect-[${duoModal.aspectRatio}] object-cover transform group-hover:scale-105 transition-transform duration-700" />`;

                                                const media2 = isV2
                                                    ? `<video src="${duoModal.url2}" autoplay loop muted playsinline class="w-full aspect-[${duoModal.aspectRatio}] object-cover"></video>`
                                                    : `<img src="${duoModal.url2}" alt="Portrait 2" class="w-full aspect-[${duoModal.aspectRatio}] object-cover transform group-hover:scale-105 transition-transform duration-700" />`;

                                                const duoWidget = `<div class="duo-photos-premium flex flex-row gap-4 my-12">\n  <div class="image-premium-wrapper relative rounded-3xl overflow-hidden shadow-2xl border border-white/5 group flex-1">\n    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"></div>\n    ${media1}\n  </div>\n  <div class="image-premium-wrapper relative rounded-3xl overflow-hidden shadow-2xl border border-white/5 group flex-1">\n    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"></div>\n    ${media2}\n  </div>\n</div>`;

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

                <ConfirmationModal
                    isOpen={blocker.state === "blocked"}
                    title="Modifications non enregistrées"
                    message="Vous avez des modifications non enregistrées. Voulez-vous vraiment quitter la page ?"
                    onConfirm={() => blocker.proceed?.()}
                    onCancel={() => blocker.reset?.()}
                    accentColor="neon-red"
                />
            </div >
        </div >
    );
}

export default NewsCreate;
