import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Upload, X, Image as ImageIcon, Loader2, CheckCircle2, Film, Crop, Zap, Trash2, Layers, HardDrive, ArrowUpDown, Check, Globe, Search, Sparkles } from 'lucide-react';
import { enhanceFestivalPhoto, type FestivalSceneMode } from '../utils/festivalPhotoEnhancer';
import { FestivalProBatchModal, type BatchPhotoItem } from './FestivalProBatchModal';
import { ImageCropper } from './ImageCropper';
import { getAuthHeaders } from '../utils/auth';
import { uploadMultipartFile } from '../utils/uploadService';
import settingsData from '../data/settings.json';

interface ImageUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUploadSuccess?: (urls: string | string[]) => void;
    onClear?: () => void;
    accentColor?: string; // e.g. 'neon-red', 'neon-red', etc. (Tailwind class part)
    aspect?: number;
    initialImage?: string;
    allowMultiple?: boolean;
    watermark?: boolean;   // Automatically add DROPSIDERS logo
    forceFilename?: string; // Force upload filename
    forceCrop?: boolean;    // Force open cropper automatically
}

export function ImageUploadModal({ 
    isOpen, 
    onClose, 
    onUploadSuccess, 
    onClear, 
    accentColor = 'neon-red', 
    aspect, 
    initialImage,
    allowMultiple = false,
    watermark = false,
    forceFilename,
    forceCrop = false
}: ImageUploadModalProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [storageWarning, setStorageWarning] = useState<{ remainingMo: number; usedGo: number } | null>(null);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);

    // Mapping accentColor to actual Tailwind classes
    let bgClass = "bg-neon-red/20";
    let textClass = "text-neon-red";

    if (accentColor === 'neon-red') {
        bgClass = "bg-neon-red/20";
        textClass = "text-neon-red";
    } else if (accentColor === 'neon-blue') {
        bgClass = "bg-neon-blue/20";
        textClass = "text-neon-blue";
    } else if (accentColor === 'neon-cyan') {
        bgClass = "bg-neon-cyan/20";
        textClass = "text-neon-cyan";
    }

    const [selectedImages, setSelectedImages] = useState<{file: File | null, preview: string}[]>([]);
    const [isCropOpen, setIsCropOpen] = useState(false);
    const [step, setStep] = useState<'idle' | 'preview' | 'gallery'>(initialImage ? 'preview' : 'idle');
    const [isWatermarkEnabled, setIsWatermarkEnabled] = useState(watermark);
    const [isFestivalProEnabled, setIsFestivalProEnabled] = useState(false);
    const [previewEnhancedUrl, setPreviewEnhancedUrl] = useState<string | null>(null);
    const [previewDetectedMode, setPreviewDetectedMode] = useState<FestivalSceneMode | null>(null);
    const [isPreviewEnhancing, setIsPreviewEnhancing] = useState(false);
    const [processingLabel, setProcessingLabel] = useState('');
    const [previewIndex, setPreviewIndex] = useState(0);
    const [showOriginalComparison, setShowOriginalComparison] = useState(false);

    // Batch Festival Pro Modal
    const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
    const [batchPhotos, setBatchPhotos] = useState<BatchPhotoItem[]>([]);
    const [batchEnhancedMap, setBatchEnhancedMap] = useState<Record<string, Blob | null>>({});
    const [batchEnabledMap, setBatchEnabledMap] = useState<Record<string, boolean>>({});

    // R2 State
    const [libTab, setLibTab] = useState<'r2' | 'unsplash'>('r2');
    const [r2Photos, setR2Photos] = useState<any[]>([]);
    const [r2Loading, setR2Loading] = useState(false);
    const [r2Cursor, setR2Cursor] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
    const [searchTerm, setSearchTerm] = useState('');
    const [mediaFilter, setMediaFilter] = useState<'all' | 'images' | 'videos'>('all');

    const isVideoFile = (keyOrUrl: string) => {
        if (!keyOrUrl) return false;
        const ext = (keyOrUrl.split('.').pop() || '').split('?')[0].toLowerCase();
        return ['mp4', 'webm', 'mov', 'm4v', 'mkv', 'avi'].includes(ext);
    };

    const isImageFile = (keyOrUrl: string) => {
        if (!keyOrUrl) return false;
        const ext = (keyOrUrl.split('.').pop() || '').split('?')[0].toLowerCase();
        return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'avif', 'ico'].includes(ext);
    };

    // Deletion State
    const [deleteConfirmKey, setDeleteConfirmKey] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteFile = (key: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeleteConfirmKey(key);
    };

    const confirmDeleteFile = async () => {
        if (!deleteConfirmKey) return;
        setIsDeleting(true);
        try {
            const res = await fetch('/api/r2/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({ key: deleteConfirmKey })
            });
            if (res.ok) {
                setR2Photos(prev => prev.filter(p => p.key !== deleteConfirmKey));
                setSelectedImages(prev => prev.filter(img => !img.preview.includes(deleteConfirmKey)));
            } else {
                const data = await res.json().catch(() => ({}));
                setStatus('error');
                setMessage(data.error || 'Erreur lors de la suppression');
            }
        } catch (err: any) {
            console.error('Failed to delete file from Cloud', err);
            setStatus('error');
            setMessage('Erreur: ' + (err.message || 'Impossible de supprimer le fichier'));
        } finally {
            setIsDeleting(false);
            setDeleteConfirmKey(null);
        }
    };

    const [isCleaning24h, setIsCleaning24h] = useState(false);

    const handleCleanup24h = async () => {
        if (!window.confirm("Supprimer TOUTES les photos uploadées durant les dernières 24h sur Dropsiders Cloud ?")) return;
        setIsCleaning24h(true);
        try {
            const res = await fetch('/api/r2/delete-last-24h', {
                method: 'POST',
                headers: { ...getAuthHeaders() }
            });
            const data = await res.json();
            if (data.success) {
                alert(`✓ ${data.count} photo(s) des dernières 24h ont été supprimées avec succès !`);
                fetchR2Photos();
            } else {
                alert(`Erreur: ${data.error || 'Impossible de supprimer'}`);
            }
        } catch (e: any) {
            alert(`Erreur réseau: ${e.message}`);
        } finally {
            setIsCleaning24h(false);
        }
    };

    // Web Search State
    const [webQuery, setWebQuery] = useState('');
    const [webResults, setWebResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [webStartIndex, setWebStartIndex] = useState(1);

    const sentinelRef = useRef<HTMLDivElement>(null);

    const searchWeb = async (e?: React.FormEvent, isLoadMore: boolean = false) => {
        if (e) e.preventDefault();
        if (!webQuery) return;

        setIsSearching(true);
        if (!isLoadMore) {
            setStatus('idle');
            setWebStartIndex(1);
        }

        const start = isLoadMore ? webStartIndex + 10 : 1;

        try {
            // Passe par le Worker Cloudflare en proxy pour éviter les restrictions CORS et de domaine de l'API Google
            const res = await fetch(`/api/google-image-search?q=${encodeURIComponent(webQuery)}&start=${start}`);
            const data = await res.json();

            if (res.ok) {
                const newItems = (data.items || []).map((r: any) => ({
                    id: r.link,
                    url: r.link,
                    thumb: r.image?.thumbnailLink || r.link,
                    author: r.displayLink
                }));

                if (newItems.length > 0) {
                    if (isLoadMore) {
                        setWebResults(prev => [...prev, ...newItems]);
                    } else {
                        setWebResults(newItems);
                    }
                    setWebStartIndex(start);
                } else if (!isLoadMore) {
                    setStatus('error');
                    setMessage('Aucun résultat trouvé.');
                }
            } else {
                if (!isLoadMore) setStatus('error');
                setMessage(`Erreur Google: ${data.error || 'Inconnue'}`);
            }
        } catch (e: any) {
            if (!isLoadMore) setStatus('error');
            setMessage('Erreur de connexion.');
        } finally {
            setIsSearching(false);
        }
    };

    useEffect(() => {
        if (libTab === 'r2') {
            if (!r2Cursor || r2Loading) return;
            const observer = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) {
                    handleR2LoadMore();
                }
            }, { threshold: 0.1 });
            if (sentinelRef.current) observer.observe(sentinelRef.current);
            return () => observer.disconnect();
        } else if (libTab === 'unsplash') {
            if (webResults.length === 0 || isSearching) return;
            const observer = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) {
                    searchWeb(undefined, true);
                }
            }, { threshold: 0.1 });
            if (sentinelRef.current) observer.observe(sentinelRef.current);
            return () => observer.disconnect();
        }
    }, [r2Cursor, r2Loading, libTab, webResults.length, isSearching]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            fetchR2Photos();
            if (initialImage) {
                setSelectedImages([{ file: null, preview: initialImage }]);
                setStep('preview');
                if (forceCrop) setIsCropOpen(true);
            }
        } else if (!isOpen) {
            document.body.style.overflow = 'unset';
            setSelectedImages([]);
            setStep('idle');
            setStatus('idle');
            setUploadProgress(0);
            setR2Photos([]);
            setR2Cursor(null);
            setIsUploading(false); // Safety reset
            setPreviewEnhancedUrl(null);
            setPreviewDetectedMode(null);
            setProcessingLabel('');
            setPreviewIndex(0);
            setShowOriginalComparison(false);
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen, initialImage]);

    // Aperçu en temps réel de l'Amélioration Festival Pro (Auto) sur la photo sélectionnée
    useEffect(() => {
        const current = selectedImages[previewIndex] || selectedImages[0];
        const isCurrentVideo = current && (current.file?.type.startsWith('video/') || (current.preview && isVideoFile(current.preview)));
        const isRasterImage = current && !isCurrentVideo && (
            (current.file && current.file.type.startsWith('image/') && !current.file.type.includes('svg') && !current.file.type.includes('gif')) ||
            (current.preview && !current.preview.match(/\.(svg|gif)(\?|$)/i))
        );

        if (!isOpen || step !== 'preview' || !isFestivalProEnabled || !isRasterImage || !current) {
            setPreviewEnhancedUrl(null);
            setPreviewDetectedMode(null);
            setIsPreviewEnhancing(false);
            return;
        }

        let cancelled = false;
        setIsPreviewEnhancing(true);

        const source = current.file || current.preview;
        enhanceFestivalPhoto(source, {
            fileForExif: current.file,
            maxDimension: 1280,
            quality: 0.90
        })
            .then((res) => {
                if (cancelled) return;
                setPreviewEnhancedUrl(res.dataUrl);
                setPreviewDetectedMode(res.mode);
            })
            .catch((err) => {
                console.warn('Festival Pro preview skipped:', err);
                if (!cancelled) {
                    setPreviewEnhancedUrl(null);
                    setPreviewDetectedMode(null);
                }
            })
            .finally(() => {
                if (!cancelled) setIsPreviewEnhancing(false);
            });

        return () => {
            cancelled = true;
        };
    }, [isOpen, step, isFestivalProEnabled, selectedImages, previewIndex]);

    // ESC Key listener for safety
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (isCropOpen) setIsCropOpen(false);
                else if (isOpen) onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, isCropOpen, onClose]);

    const fetchR2Photos = async (targetCursor?: string | null) => {
        setR2Loading(true);
        try {
            if (sortBy === 'unused' as any) {
                const res = await fetch('/api/admin/unused-r2-images', { headers: getAuthHeaders() });
                if (res.ok) {
                    const data = await res.json();
                    setR2Photos((data.unused || []).map((p: any) => ({ ...p, url: `/${p.key}` })));
                    setR2Cursor(null);
                }
                return;
            }

            const sortParam = sortBy === 'newest' ? '&sort=date' : '';

            if (mediaFilter === 'videos') {
                const [resUpper, resLower] = await Promise.all([
                    fetch(`/api/r2/list?limit=100${targetCursor ? `&cursor=${encodeURIComponent(targetCursor)}` : ''}${sortParam}&prefix=VIDEOS%2F`, { headers: getAuthHeaders() }),
                    fetch(`/api/r2/list?limit=100${sortParam}&prefix=videos%2F`, { headers: getAuthHeaders() })
                ]);
                const dataUpper = resUpper.ok ? await resUpper.json() : { objects: [] };
                const dataLower = resLower.ok ? await resLower.json() : { objects: [] };
                const combined = [...(dataUpper.objects || []), ...(dataLower.objects || [])].map((p: any) => ({
                    ...p,
                    url: p.url ? p.url : (p.key.startsWith('http') ? p.key : `/uploads/${p.key}`)
                }));
                const map = new Map<string, any>();
                combined.forEach((p: any) => { if (p.key && !map.has(p.key)) map.set(p.key, p); });
                const sorted = Array.from(map.values()).sort((a: any, b: any) => {
                    const ta = new Date(a.uploaded || 0).getTime();
                    const tb = new Date(b.uploaded || 0).getTime();
                    return tb - ta;
                });
                if (targetCursor) {
                    setR2Photos(prev => {
                        const existingKeys = new Set(prev.map(p => p.key));
                        const additions = sorted.filter(p => !existingKeys.has(p.key));
                        return [...prev, ...additions];
                    });
                } else {
                    setR2Photos(sorted);
                }
                setR2Cursor(dataUpper.cursor || null);
            } else if (mediaFilter === 'images') {
                const url = `/api/r2/list?limit=100${targetCursor ? `&cursor=${encodeURIComponent(targetCursor)}` : ''}${sortParam}&prefix=uploads%2F`;
                const res = await fetch(url, { headers: getAuthHeaders() });
                if (res.ok) {
                    const data = await res.json();
                    const processed = (data.objects || []).map((p: any) => ({ ...p, url: p.url ? p.url : (p.key.startsWith('http') ? p.key : `/uploads/${p.key}`) }));
                    if (targetCursor) {
                        setR2Photos(prev => [...prev, ...processed]);
                    } else {
                        setR2Photos(processed);
                    }
                    setR2Cursor(data.cursor || null);
                }
            } else {
                // 'all' : fetch BOTH uploads/ (images & uploads) and VIDEOS/ (all uploaded videos) in parallel!
                const [resUploads, resVideosUpper, resVideosLower] = await Promise.all([
                    fetch(`/api/r2/list?limit=100${targetCursor ? `&cursor=${encodeURIComponent(targetCursor)}` : ''}${sortParam}&prefix=uploads%2F`, { headers: getAuthHeaders() }),
                    fetch(`/api/r2/list?limit=100${sortParam}&prefix=VIDEOS%2F`, { headers: getAuthHeaders() }),
                    fetch(`/api/r2/list?limit=100${sortParam}&prefix=videos%2F`, { headers: getAuthHeaders() })
                ]);
                const dataUploads = resUploads.ok ? await resUploads.json() : { objects: [] };
                const dataVideosUpper = resVideosUpper.ok ? await resVideosUpper.json() : { objects: [] };
                const dataVideosLower = resVideosLower.ok ? await resVideosLower.json() : { objects: [] };

                const processedUploads = (dataUploads.objects || []).map((p: any) => ({ ...p, url: p.url ? p.url : (p.key.startsWith('http') ? p.key : `/uploads/${p.key}`) }));
                const processedVideos = [...(dataVideosUpper.objects || []), ...(dataVideosLower.objects || [])].map((p: any) => ({ ...p, url: p.url ? p.url : (p.key.startsWith('http') ? p.key : `/uploads/${p.key}`) }));

                // Combine and deduplicate by key
                const fileMap = new Map<string, any>();
                [...processedVideos, ...processedUploads].forEach((p: any) => {
                    if (p.key && !fileMap.has(p.key)) {
                        fileMap.set(p.key, p);
                    }
                });

                const merged = Array.from(fileMap.values()).sort((a: any, b: any) => {
                    const ta = new Date(a.uploaded || 0).getTime();
                    const tb = new Date(b.uploaded || 0).getTime();
                    return tb - ta;
                });

                if (targetCursor) {
                    setR2Photos(prev => {
                        const existingKeys = new Set(prev.map(p => p.key));
                        const additions = merged.filter(p => !existingKeys.has(p.key));
                        return [...prev, ...additions];
                    });
                } else {
                    setR2Photos(merged);
                }
                setR2Cursor(dataUploads.cursor || null);
            }
        } catch (err) {
            console.error('Failed to fetch R2 photos', err);
        } finally {
            setR2Loading(false);
        }
    };

    useEffect(() => {
        if (sortBy === 'unused' as any) {
            fetchR2Photos();
        } else if (isOpen) {
            fetchR2Photos();
        }
    }, [sortBy, mediaFilter, isOpen]);

    const MAX_IMAGE_SIZE = 500 * 1024 * 1024; // 500MB
    const MAX_VIDEO_SIZE = 600 * 1024 * 1024; // 600MB

    const sanitizeFilename = (name: string) => {
        const parts = name.split('.');
        const ext = parts.pop();
        const base = parts.join('.');
        return base.replace(/[^a-z0-9]/gi, '_').toLowerCase() + (ext ? `.${ext.toLowerCase()}` : '');
    };

    const handleR2LoadMore = () => {
        if (r2Cursor && !r2Loading) {
            fetchR2Photos(r2Cursor);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const newImages: {file: File, preview: string}[] = [];
        let processedCount = 0;
        let errors: string[] = [];

        files.forEach(file => {
            const isImage = file.type.startsWith('image/');
            const isVideo = file.type.startsWith('video/');
            const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;

            if (!isImage && !isVideo) {
                errors.push(`${file.name}: Type non supporté.`);
                processedCount++;
                if (processedCount === files.length) {
                    finalizeFileChange(newImages, errors);
                }
                return;
            }

            if (file.size > maxSize) {
                errors.push(`${file.name}: Trop volumineux (Max ${isImage ? '500' : '600'}MB).`);
                processedCount++;
                if (processedCount === files.length) {
                    finalizeFileChange(newImages, errors);
                }
                return;
            }

            if (isImage) {
                // Use object URL for preview to avoid loading huge files as base64 in memory
                // For large files (>50MB), readAsDataURL would freeze the browser
                const SMALL_FILE_THRESHOLD = 50 * 1024 * 1024; // 50MB
                if (file.size <= SMALL_FILE_THRESHOLD) {
                    const reader = new FileReader();
                    reader.onload = () => {
                        newImages.push({ file, preview: reader.result as string });
                        processedCount++;
                        if (processedCount === files.length) {
                            finalizeFileChange(newImages, errors);
                        }
                    };
                    reader.readAsDataURL(file);
                } else {
                    // Large image: use object URL for preview (no memory explosion)
                    newImages.push({ file, preview: URL.createObjectURL(file) });
                    processedCount++;
                    if (processedCount === files.length) {
                        finalizeFileChange(newImages, errors);
                    }
                }
            } else if (isVideo) {
                newImages.push({ file, preview: URL.createObjectURL(file) });
                processedCount++;
                if (processedCount === files.length) {
                    finalizeFileChange(newImages, errors);
                }
            }
        });
    };

    const finalizeFileChange = (images: {file: File | null, preview: string}[], errors: string[]) => {
        if (errors.length > 0) {
            setStatus('error');
            setMessage(errors.join(' '));
        }
        if (images.length > 0) {
            setSelectedImages(images);
            setStep('preview');
            if (forceCrop && aspect && images.length === 1 && (!images[0].file || images[0].file.type.startsWith('image/'))) {
                setIsCropOpen(true);
            }
        }
    };

    const processImage = async (dataUrl: string): Promise<string> => {
        if (!isWatermarkEnabled) return dataUrl;

        return new Promise((resolve, reject) => {
            const img = new Image();
            // Data URLs don't technically need crossOrigin, but for external URLs it's safe.
            // Be careful to not blindly apply it to same-origin URLs as it can break.
            if (!dataUrl.startsWith('data:') && !dataUrl.startsWith('blob:')) {
                const originMatch = dataUrl.match(/^https?:\/\/[^\/]+/i);
                if (originMatch && originMatch[0] !== window.location.origin) {
                    img.crossOrigin = "anonymous";
                }
            }
            img.src = dataUrl;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject('Canvas context error');

                // Draw original image
                ctx.drawImage(img, 0, 0);

                // Safety timeout for logo loading
                const timeout = setTimeout(() => {
                    console.warn("Watermark timeout, proceeding without it.");
                    resolve(dataUrl);
                }, 3000);

                // Add DROPSIDERS Logo
                const logo = new Image();
                // Logo is local, so no crossOrigin needed
                logo.src = '/Logo.png';
                logo.onload = () => {
                    clearTimeout(timeout);
                    const margin = canvas.width * 0.03;
                    const logoWidth = canvas.width * 0.2; // 20% of image width
                    const logoHeight = (logo.height / logo.width) * logoWidth;

                    ctx.globalAlpha = 0.4; // 40% opacity
                    ctx.drawImage(logo, margin, margin, logoWidth, logoHeight);
                    ctx.globalAlpha = 1.0;

                    resolve(canvas.toDataURL('image/jpeg', 0.9));
                };
                logo.onerror = () => {
                    clearTimeout(timeout);
                    console.warn("Logo failed to load for watermarking, skipping...");
                    resolve(dataUrl);
                };
            };
            img.onerror = () => {
                console.error("Image loading failed for processing");
                reject(new Error("Impossible de charger l'image pour le traitement"));
            };
        });
    };

    const handleUpload = async (
        toUpload: { file: File | null; preview: string }[],
        exifFallbackFile?: File | null,
        overrideEnhancedBlobs?: Record<string, Blob | null>
    ) => {
        setIsUploading(true);
        setStatus('idle');
        setUploadProgress(0);
        setProcessingLabel('');

        try {
            const total = toUpload.length;
            const uploadedUrls: (string | null)[] = new Array(total).fill(null);
            let completedCount = 0;

            const processAndUploadItem = async (item: { file: File | null; preview: string }, index: number) => {
                // Déjà hébergé (R2 ou URL externe)
                if (item.preview && (item.preview.startsWith('/') || item.preview.startsWith('http'))) {
                    uploadedUrls[index] = item.preview;
                    return;
                }

                // Aperçu base64 (ex: après recadrage)
                if (!item.file && item.preview && item.preview.startsWith('data:')) {
                    const filename = forceFilename || `crop_${Date.now()}_${index}.jpg`;
                    let sourceDataUrl = item.preview;

                    if (isFestivalProEnabled && sourceDataUrl.startsWith('data:image/')) {
                        setProcessingLabel('Optimisation Pro...');
                        const enhanced = await enhanceFestivalPhoto(sourceDataUrl, {
                            fileForExif: exifFallbackFile ?? null,
                            maxDimension: 2048,
                            quality: 0.90
                        });
                        sourceDataUrl = enhanced.dataUrl;
                    }

                    const base64 = await processImage(sourceDataUrl);
                    const response = await fetch('/api/upload', {
                        method: 'POST',
                        headers: { ...getAuthHeaders(null), 'Content-Type': 'application/json' },
                        body: JSON.stringify({ filename, content: base64, type: 'image/jpeg' })
                    });
                    const data = await response.json();
                    if (data.success && data.url) {
                        uploadedUrls[index] = data.url;
                        return;
                    }
                    throw new Error(data.error || 'Upload échoué');
                }

                // Fichier réel
                if (item.file) {
                    let filename = forceFilename || sanitizeFilename(item.file.name);
                    let fileType = item.file.type;
                    let fileBlob: Blob = item.file;
                    const isRasterPhoto =
                        fileType.startsWith('image/') &&
                        !fileType.includes('svg') &&
                        !fileType.includes('gif');

                    // Vérifie si un blob a déjà été traité par l'Atelier Batch
                    const batchKey = item.file.name + '_' + item.file.size;
                    const preBlob = overrideEnhancedBlobs ? overrideEnhancedBlobs[batchKey] : batchEnhancedMap[batchKey];
                    const isBatchEnabled = overrideEnhancedBlobs
                        ? (batchKey in overrideEnhancedBlobs && overrideEnhancedBlobs[batchKey] !== null)
                        : (batchEnabledMap[batchKey] ?? isFestivalProEnabled);

                    if (isRasterPhoto && preBlob && isBatchEnabled !== false) {
                        // Instantané : Blob déjà prêt issu du Batch Modal !
                        fileType = 'image/jpeg';
                        if (!forceFilename) {
                            filename = filename.replace(/\.(png|webp|avif|bmp|heic|heif)$/i, '.jpg');
                        }

                        if (isWatermarkEnabled) {
                            const blobUrl = URL.createObjectURL(preBlob);
                            const base64 = await processImage(blobUrl);
                            URL.revokeObjectURL(blobUrl);
                            const base64Data = base64.split(',')[1] || base64;
                            const binaryStr = atob(base64Data);
                            const byteArr = new Uint8Array(binaryStr.length);
                            for (let j = 0; j < binaryStr.length; j++) byteArr[j] = binaryStr.charCodeAt(j);
                            fileBlob = new Blob([byteArr], { type: fileType });
                        } else {
                            fileBlob = preBlob;
                        }
                    } else if (isRasterPhoto && isFestivalProEnabled && isBatchEnabled !== false) {
                        // Traitement direct optimisé en 2048px (ultra rapide)
                        setProcessingLabel(total > 1 ? `Pro (${completedCount + 1}/${total})...` : 'Optimisation Pro...');
                        const enhanced = await enhanceFestivalPhoto(item.file, {
                            maxDimension: 2048,
                            quality: 0.90
                        });
                        fileType = 'image/jpeg';
                        if (!forceFilename) {
                            filename = filename.replace(/\.(png|webp|avif|bmp|heic|heif)$/i, '.jpg');
                        }

                        if (isWatermarkEnabled) {
                            const base64 = await processImage(enhanced.dataUrl);
                            const base64Data = base64.split(',')[1] || base64;
                            const binaryStr = atob(base64Data);
                            const byteArr = new Uint8Array(binaryStr.length);
                            for (let j = 0; j < binaryStr.length; j++) byteArr[j] = binaryStr.charCodeAt(j);
                            fileBlob = new Blob([byteArr], { type: fileType });
                        } else {
                            fileBlob = enhanced.blob;
                        }
                    } else if (fileType.startsWith('image/') && isWatermarkEnabled) {
                        const base64 = await processImage(item.preview);
                        fileType = 'image/jpeg';
                        const base64Data = base64.split(',')[1] || base64;
                        const binaryStr = atob(base64Data);
                        const byteArr = new Uint8Array(binaryStr.length);
                        for (let j = 0; j < binaryStr.length; j++) byteArr[j] = binaryStr.charCodeAt(j);
                        fileBlob = new Blob([byteArr], { type: fileType });
                    }

                    // Envoi vers Cloudflare R2
                    const LARGE_FILE_THRESHOLD = 50 * 1024 * 1024;
                    if (fileBlob.size > LARGE_FILE_THRESHOLD) {
                        const targetFolder = fileType.startsWith('audio/') ? 'SONS' : (fileType.startsWith('video/') ? 'VIDEOS' : 'uploads');
                        const fileObject = new File([fileBlob], filename, { type: fileType });
                        const uploadUrl = await uploadMultipartFile(fileObject, targetFolder);
                        const finalUrl = uploadUrl.startsWith('https://dropsiders.fr')
                            ? uploadUrl.replace('https://dropsiders.fr', '')
                            : uploadUrl;
                        uploadedUrls[index] = finalUrl;
                    } else {
                        const uploadUrl = `/api/upload?filename=${encodeURIComponent(filename)}&type=${encodeURIComponent(fileType)}`;
                        const response = await fetch(uploadUrl, {
                            method: 'POST',
                            headers: { ...getAuthHeaders(null), 'Content-Type': fileType },
                            body: fileBlob
                        });
                        const data = await response.json();
                        if (data.success && data.url) {
                            uploadedUrls[index] = data.url;
                        } else {
                            throw new Error(data.error || 'Upload échoué');
                        }
                    }
                }
            };

            // Pool d'envoi parallèle (jusqu'à 4 envois simultanés)
            // Chaque photo a droit à 2 tentatives avant d'être marquée échouée
            // Un échec isolé ne fait PAS planter tout le batch (résistance aux gros albums)
            const CONCURRENCY = Math.min(4, total);
            const failedItems: number[] = [];
            let nextIndex = 0;
            const worker = async () => {
                while (nextIndex < total) {
                    const currentIdx = nextIndex++;
                    setProcessingLabel(total > 1 ? `Envoi (${completedCount + 1}/${total})...` : 'Envoi en cours...');
                    // Retry automatique : 2 tentatives max par photo
                    let lastErr: any = null;
                    for (let attempt = 0; attempt < 2; attempt++) {
                        try {
                            await processAndUploadItem(toUpload[currentIdx], currentIdx);
                            lastErr = null;
                            break;
                        } catch (err) {
                            lastErr = err;
                            if (attempt === 0) {
                                // Courte pause avant retry
                                await new Promise(res => setTimeout(res, 800 + currentIdx * 10));
                            }
                        }
                    }
                    if (lastErr) {
                        console.warn(`Upload échoué après 2 tentatives (photo ${currentIdx + 1}):`, lastErr);
                        failedItems.push(currentIdx);
                    }
                    completedCount++;
                    setUploadProgress(Math.round((completedCount / total) * 100));
                }
            };

            const workers = Array.from({ length: CONCURRENCY }, () => worker());
            await Promise.all(workers);

            const finalUrls = uploadedUrls.filter((u): u is string => typeof u === 'string');
            const failCount = failedItems.length;
            setStatus('success');
            setMessage(failCount > 0
                ? `${finalUrls.length} photo(s) envoyée(s) — ${failCount} échec(s) (réseau). Réessayez ces photos.`
                : 'Média(s) prêt(s) !');

            if (onUploadSuccess && finalUrls.length > 0) {
                onUploadSuccess(allowMultiple ? finalUrls : finalUrls[0]);
            }

            setTimeout(() => {
                onClose();
                setStatus('idle');
                setStep('idle');
                setSelectedImages([]);
            }, 1000);

        } catch (err: any) {
            console.error('Upload error:', err);
            setStatus('error');
            setMessage('Erreur: ' + (err.message || 'Connexion échouée'));
        } finally {
            setIsUploading(false);
            setProcessingLabel('');
        }
    };

    const handleClear = () => {
        if (onClear) {
            onClear();
        } else if (onUploadSuccess) {
            onUploadSuccess(allowMultiple ? [] : '');
            onClose();
        }
    };

    const hasVideo = selectedImages.some(img => 
        img.file?.type.startsWith('video/') || (img.preview && isVideoFile(img.preview))
    );

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100050] overflow-hidden flex items-center justify-center">
                    <div className="flex min-h-full items-center justify-center p-6 text-center">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/95 backdrop-blur-2xl"
                            onClick={onClose}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className={`relative w-full ${status === 'idle' && step !== 'preview' ? 'max-w-7xl' : 'max-w-lg'} bg-[#0a0a0a] border border-white/10 rounded-[32px] md:rounded-[40px] p-5 sm:p-8 md:p-10 shadow-3xl overflow-hidden text-left my-4 md:my-8 transition-all duration-500 max-h-[92vh] flex flex-col`}
                        >
                            <div className={`absolute top-0 right-0 w-64 h-64 ${bgClass.replace('/20', '/5')} rounded-full blur-[100px] pointer-events-none`} />

                            <div className="flex justify-between items-start mb-8 relative z-10">
                                <div className="flex items-center gap-5">
                                    <div className={`p-4 ${bgClass} rounded-2xl border border-white/5 shadow-inner`}>
                                        <Upload className={`w-7 h-7 ${textClass}`} />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-display font-black text-white uppercase italic tracking-tighter leading-none">
                                            Cloud <span className={textClass}>Upload</span>
                                        </h2>
                                        <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mt-1">Multi-Upload & Watermarking</p>
                                    </div>
                                </div>
                                <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full transition-all text-gray-500 hover:text-white group">
                                    <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                                </button>
                            </div>

                            <div className="space-y-6 relative z-10">
                                {storageWarning && (
                                    <div className="p-4 bg-gradient-to-r from-red-950/80 to-black/80 border border-neon-red/60 rounded-2xl flex items-center gap-3 text-left animate-pulse shadow-[0_0_20px_rgba(255,18,65,0.25)]">
                                        <HardDrive className="w-5 h-5 text-neon-red shrink-0" />
                                        <div className="text-xs text-white">
                                            <span className="font-black text-neon-red uppercase tracking-wider">Alerte Réserve Cloud R2 :</span> Il reste moins de 1 Go libre ({storageWarning.remainingMo} Mo restants sur 10 Go). Pensez à recréer votre compte Cloudflare !
                                        </div>
                                    </div>
                                )}
                                {status === 'success' ? (
                                    <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/30">
                                            <CheckCircle2 className="w-10 h-10 text-green-500" />
                                        </motion.div>
                                        <p className="font-bold text-white uppercase tracking-widest">Upload Terminé !</p>
                                        <p className="text-xs text-gray-400">Vos médias sont en ligne sur Dropsiders Cloud.</p>
                                    </div>
                                ) : step === 'preview' && selectedImages.length > 0 ? (
                                    <motion.div key="preview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-5">
                                        {/* Aperçu du média sélectionné avec comparaison avant/après et sélecteur multi-photos */}
                                        {(() => {
                                            const activeMedia = selectedImages[previewIndex] || selectedImages[0];
                                            const isMediaVideo = activeMedia && (activeMedia.file?.type.startsWith('video/') || (activeMedia.preview && isVideoFile(activeMedia.preview)));
                                            if (!activeMedia?.preview) return null;

                                            return (
                                                <div className="space-y-3">
                                                    <div className="relative w-full h-56 sm:h-64 bg-black/80 rounded-3xl overflow-hidden border border-white/10 flex items-center justify-center p-2 shadow-2xl">
                                                        {isMediaVideo ? (
                                                            <video 
                                                                src={activeMedia.preview} 
                                                                controls 
                                                                playsInline 
                                                                className="max-w-full max-h-full rounded-2xl object-contain" 
                                                            />
                                                        ) : (
                                                            <img 
                                                                src={!showOriginalComparison && isFestivalProEnabled && previewEnhancedUrl ? previewEnhancedUrl : activeMedia.preview} 
                                                                alt="Aperçu" 
                                                                className="max-w-full max-h-full rounded-2xl object-contain transition-all duration-300" 
                                                            />
                                                        )}

                                                        {/* Badge de détection du mode Jour / Nuit */}
                                                        {!isMediaVideo && isFestivalProEnabled && (isPreviewEnhancing || previewDetectedMode) && (
                                                            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-amber-400/40 flex items-center gap-1.5 shadow-lg pointer-events-none z-10">
                                                                {isPreviewEnhancing ? (
                                                                    <>
                                                                        <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
                                                                        <span className="text-[8px] font-black uppercase tracking-widest text-amber-300">Analyse Auto...</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Sparkles className="w-3 h-3 text-amber-400" />
                                                                        <span className="text-[8px] font-black uppercase tracking-widest text-white">
                                                                            {previewDetectedMode === 'NIGHT_INDOOR' ? 'Nuit / Indoor' : 'Jour / Outdoor'}
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Bouton pour comparer directement Avant / Après */}
                                                        {!isMediaVideo && isFestivalProEnabled && previewEnhancedUrl && (
                                                            <button
                                                                type="button"
                                                                onMouseDown={() => setShowOriginalComparison(true)}
                                                                onMouseUp={() => setShowOriginalComparison(false)}
                                                                onTouchStart={() => setShowOriginalComparison(true)}
                                                                onTouchEnd={() => setShowOriginalComparison(false)}
                                                                onClick={() => setShowOriginalComparison(v => !v)}
                                                                className="absolute bottom-3 left-3 px-3 py-1.5 rounded-xl bg-black/85 hover:bg-black backdrop-blur-md border border-white/20 text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-xl transition-all z-10"
                                                                title="Maintenez pour voir l'image originale sans traitement"
                                                            >
                                                                <span className={showOriginalComparison ? 'text-amber-400 font-bold' : 'text-gray-300'}>
                                                                    {showOriginalComparison ? '● Original (Brut)' : 'Maintenir pour comparer (Original)'}
                                                                </span>
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Galerie de sélection si plusieurs photos sélectionnées */}
                                                    {selectedImages.length > 1 && (
                                                        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar">
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 shrink-0">Photos ({selectedImages.length}) :</span>
                                                            {selectedImages.map((img, idx) => (
                                                                <button
                                                                    key={idx}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setPreviewIndex(idx);
                                                                        setShowOriginalComparison(false);
                                                                    }}
                                                                    className={`relative w-11 h-11 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${previewIndex === idx ? 'border-neon-red scale-105 shadow-md shadow-neon-red/30' : 'border-white/10 opacity-60 hover:opacity-100'}`}
                                                                >
                                                                    <img src={img.preview} alt="" className="w-full h-full object-cover" />
                                                                    <span className="absolute bottom-0 right-0 px-1 text-[7px] font-black bg-black/80 text-white rounded-tl">
                                                                        {idx + 1}
                                                                    </span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}

                                        {/* Amélioration Festival Pro (Auto) Toggle */}
                                        {!hasVideo && (
                                            <button 
                                                type="button"
                                                onClick={() => setIsFestivalProEnabled(!isFestivalProEnabled)}
                                                className={`flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${isFestivalProEnabled ? 'bg-amber-500/10 border-amber-400/50 shadow-[0_0_18px_rgba(251,191,36,0.14)]' : 'bg-white/5 border-white/10 opacity-70 hover:opacity-100'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Sparkles className={`w-4 h-4 shrink-0 ${isFestivalProEnabled ? 'text-amber-400' : 'text-gray-500'}`} />
                                                    <div className="flex flex-col">
                                                        <span className={`text-[10px] font-black uppercase tracking-widest ${isFestivalProEnabled ? 'text-white' : 'text-gray-400'}`}>Amélioration Festival Pro (Auto)</span>
                                                        <span className="text-[8px] font-bold text-gray-500 uppercase tracking-tighter">
                                                            {isFestivalProEnabled && previewDetectedMode
                                                                ? `Mode auto appliqué : ${previewDetectedMode === 'NIGHT_INDOOR' ? 'Nuit / Indoor (Dehaze & Lasers)' : 'Jour / Outdoor (Relief & Éclat)'}`
                                                                : 'Détection auto Jour / Nuit & étalonnage média pro'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className={`w-8 h-4 rounded-full relative transition-colors shrink-0 ${isFestivalProEnabled ? 'bg-amber-400' : 'bg-gray-700'}`}>
                                                    <div className={`absolute top-0.5 bottom-0.5 w-3 h-3 bg-white rounded-full transition-all ${isFestivalProEnabled ? 'right-0.5' : 'left-0.5'}`} />
                                                </div>
                                            </button>
                                        )}

                                        {/* Watermark Toggle */}
                                        {!hasVideo && (
                                            <button 
                                                onClick={() => setIsWatermarkEnabled(!isWatermarkEnabled)}
                                                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isWatermarkEnabled ? 'bg-neon-cyan/10 border-neon-cyan/40 shadow-[0_0_15px_rgba(0,255,255,0.1)]' : 'bg-white/5 border-white/10 opacity-70'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Layers className={`w-4 h-4 ${isWatermarkEnabled ? 'text-neon-cyan' : 'text-gray-500'}`} />
                                                    <div className="flex flex-col">
                                                        <span className={`text-[10px] font-black uppercase tracking-widest ${isWatermarkEnabled ? 'text-white' : 'text-gray-400'}`}>Watermark Dropsiders</span>
                                                        <span className="text-[8px] font-bold text-gray-500 uppercase tracking-tighter">Ajoute le logo en haut à gauche</span>
                                                    </div>
                                                </div>
                                                <div className={`w-8 h-4 rounded-full relative transition-colors ${isWatermarkEnabled ? 'bg-neon-cyan' : 'bg-gray-700'}`}>
                                                    <div className={`absolute top-0.5 bottom-0.5 w-3 h-3 bg-white rounded-full transition-all ${isWatermarkEnabled ? 'right-0.5' : 'left-0.5'}`} />
                                                </div>
                                            </button>
                                        )}

                                        <div className={`grid ${allowMultiple || hasVideo ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
                                            {!allowMultiple && !hasVideo && (
                                                <button onClick={() => setIsCropOpen(true)} className="flex flex-col items-center gap-3 p-6 bg-white/5 border border-neon-red/30 rounded-2xl hover:bg-neon-red/10 hover:border-neon-red/60 transition-all group">
                                                    <div className="p-3 bg-neon-red/20 rounded-xl group-hover:scale-110 transition-transform">
                                                        <Crop className="w-6 h-6 text-neon-red" />
                                                    </div>
                                                    <span className="text-xs font-black text-white uppercase tracking-widest">Rogner</span>
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleUpload(selectedImages)}
                                                disabled={isUploading}
                                                className="flex flex-col items-center gap-3 p-6 bg-white/5 border border-neon-blue/30 rounded-2xl hover:bg-neon-blue/10 hover:border-neon-blue/60 transition-all group disabled:opacity-50"
                                            >
                                                <div className="p-3 bg-neon-blue/20 rounded-xl group-hover:scale-110 transition-transform relative">
                                                    {isUploading ? (
                                                        <div className="relative">
                                                            <Loader2 className="w-6 h-6 text-neon-blue animate-spin" />
                                                            <span className="absolute inset-0 flex items-center justify-center text-[7px] font-black text-white">{uploadProgress}%</span>
                                                        </div>
                                                    ) : (
                                                        <Zap className="w-6 h-6 text-neon-blue" />
                                                    )}
                                                </div>
                                                <span className="text-xs font-black text-white uppercase tracking-widest">
                                                    {isUploading ? (processingLabel || 'Chargement...') : 
                                                     (selectedImages.every(i => !i.file) ? 'Valider la sélection' : 
                                                     (allowMultiple ? `Lancer l'envoi (${selectedImages.length})` : 'Uploader Direct'))}
                                                </span>
                                            </button>
                                        </div>
                                        <button onClick={() => { setStep('idle'); setSelectedImages([]); }} className="w-full py-2 text-[10px] text-gray-500 hover:text-white font-black uppercase tracking-widest transition-colors">
                                            ← Annuler et changer
                                        </button>
                                    </motion.div>
                                ) : (
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                        {/* Upload Area */}
                                        <div className="lg:col-span-4 space-y-4">
                                            <label className="block group cursor-pointer w-full">
                                                <input type="file" accept="image/*,video/*" multiple={allowMultiple} className="hidden" onChange={handleFileChange} disabled={isUploading} />
                                                <div className={`p-8 bg-white/5 border-2 border-dashed ${isUploading ? 'border-neon-cyan' : 'border-white/10 group-hover:border-neon-red/50'} rounded-[32px] flex flex-col items-center gap-4 transition-all hover:bg-white/[0.08]`}>
                                                    <div className="flex gap-4">
                                                        <ImageIcon className="w-10 h-10 text-gray-700 group-hover:text-neon-red transition-colors" />
                                                        {allowMultiple && <Film className="w-10 h-10 text-gray-700 group-hover:text-neon-blue transition-colors" />}
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="font-bold text-white uppercase tracking-widest text-[10px] mb-1">{allowMultiple ? 'MULTI-UPLOAD' : 'FICHIER UNIQUE'}</p>
                                                        <p className="text-[8px] text-gray-600 uppercase font-black italic">Cliquez ou glissez-déposez</p>
                                                    </div>
                                                </div>
                                            </label>

                                            {mediaFilter !== 'videos' && (
                                                <button
                                                    type="button"
                                                    onClick={() => setIsFestivalProEnabled(!isFestivalProEnabled)}
                                                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${isFestivalProEnabled ? 'bg-amber-500/10 border-amber-400/50 shadow-[0_0_18px_rgba(251,191,36,0.14)]' : 'bg-white/5 border-white/10 opacity-75 hover:opacity-100'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Sparkles className={`w-4 h-4 shrink-0 ${isFestivalProEnabled ? 'text-amber-400' : 'text-gray-500'}`} />
                                                        <div className="flex flex-col">
                                                            <span className={`text-[10px] font-black uppercase tracking-widest ${isFestivalProEnabled ? 'text-white' : 'text-gray-400'}`}>Amélioration Festival Pro (Auto)</span>
                                                            <span className="text-[8px] font-bold text-gray-500 uppercase tracking-tighter">Analyse auto Jour / Nuit & étalonnage pro</span>
                                                        </div>
                                                    </div>
                                                    <div className={`w-8 h-4 rounded-full relative transition-colors shrink-0 ${isFestivalProEnabled ? 'bg-amber-400' : 'bg-gray-700'}`}>
                                                        <div className={`absolute top-0.5 bottom-0.5 w-3 h-3 bg-white rounded-full transition-all ${isFestivalProEnabled ? 'right-0.5' : 'left-0.5'}`} />
                                                    </div>
                                                </button>
                                            )}

                                            {initialImage && (
                                                <button onClick={handleClear} className="w-full flex items-center justify-center gap-2 p-3 bg-red-500/5 border border-red-500/20 rounded-xl text-red-500 hover:bg-red-500/10 transition-all group">
                                                    <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Supprimer l'actuel</span>
                                                </button>
                                            )}
                                            
                                            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                                <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest mb-2">Instructions</p>
                                                <ul className="text-[8px] text-gray-600 space-y-1 font-bold uppercase italic">
                                                    <li>• JPG/PNG haute résolution conseillé</li>
                                                    <li>• MP4 optimisé pour le web</li>
                                                    <li>• Watermark ajoutable à l'étape suivante</li>
                                                </ul>
                                            </div>
                                        </div>

                                        {/* Gallery Area */}
                                        <div className="lg:col-span-8 flex flex-col gap-4 border-l border-white/5 pl-8">
                                            <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/10">
                                                <div className="flex items-center gap-4">
                                                    <button onClick={() => setLibTab('r2')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${libTab === 'r2' ? 'bg-neon-blue text-black font-black' : 'text-white hover:bg-white/10'}`}>
                                                        <HardDrive className="w-4 h-4" />
                                                        <span className="font-black text-[10px] uppercase tracking-widest">Cloud Dropsiders</span>
                                                    </button>
                                                    <button onClick={() => setLibTab('unsplash')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${libTab === 'unsplash' ? 'bg-neon-cyan text-black font-black' : 'text-white hover:bg-white/10'}`}>
                                                        <Globe className="w-4 h-4" />
                                                        <span className="font-black text-[10px] uppercase tracking-widest">Recherche Web</span>
                                                    </button>
                                                </div>
                                                
                                                 {libTab === 'r2' && (
                                                    <div className="flex flex-1 items-center gap-3">
                                                        <div className="relative flex-1 group">
                                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 group-focus-within:text-neon-blue transition-colors" />
                                                            <input 
                                                                type="text" 
                                                                placeholder="Filtrer vos fichiers..." 
                                                                value={searchTerm}
                                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                                className="w-full pl-8 pr-4 py-2 bg-black/40 border border-white/10 rounded-lg text-[10px] font-black uppercase text-white outline-none focus:border-neon-blue transition-all"
                                                            />
                                                        </div>
                                                        <ArrowUpDown className="w-3 h-3 text-gray-500" />
                                                        <select 
                                                            value={sortBy} 
                                                            onChange={(e) => setSortBy(e.target.value as any)}
                                                            className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[9px] font-bold text-white outline-none focus:border-neon-blue transition-all uppercase"
                                                        >
                                                            <option value="newest">Récent</option>
                                                            <option value="oldest">Ancien</option>
                                                            <option value="name">Nom</option>
                                                            <option value="unused">Non utilisées 🗑️</option>
                                                        </select>
                                                        
                                                        {/* Filtres Type Médias (Tout / Images / Vidéos) */}
                                                        <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-lg p-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => setMediaFilter('all')}
                                                                className={`px-2 py-1 rounded text-[8px] font-black uppercase transition-all ${mediaFilter === 'all' ? 'bg-neon-blue text-black' : 'text-gray-400 hover:text-white'}`}
                                                            >
                                                                Tout ({r2Photos.length})
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setMediaFilter('images')}
                                                                className={`px-2 py-1 rounded text-[8px] font-black uppercase transition-all ${mediaFilter === 'images' ? 'bg-neon-cyan text-black' : 'text-gray-400 hover:text-white'}`}
                                                            >
                                                                Images ({r2Photos.filter(p => isImageFile(p.key) || (p.url && isImageFile(p.url))).length})
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setMediaFilter('videos')}
                                                                className={`px-2 py-1 rounded text-[8px] font-black uppercase transition-all ${mediaFilter === 'videos' ? 'bg-[#ff3700] text-white' : 'text-gray-400 hover:text-white'}`}
                                                            >
                                                                Vidéos ({r2Photos.filter(p => isVideoFile(p.key) || (p.url && isVideoFile(p.url))).length})
                                                            </button>
                                                        </div>

                                                        {/* Bouton de nettoyage d'urgence des dernières 24h */}
                                                        <button
                                                            type="button"
                                                            onClick={handleCleanup24h}
                                                            disabled={isCleaning24h}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all bg-red-500/15 border border-red-500/40 text-red-400 hover:bg-red-500/30 hover:text-white shadow-sm shrink-0"
                                                            title="Supprimer immédiatement toutes les photos uploadées lors des dernières 24 heures"
                                                        >
                                                            {isCleaning24h ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                                            Nettoyer (24h)
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {libTab === 'unsplash' ? (
                                                <div className="flex flex-col gap-4 h-full">
                                                    <form onSubmit={searchWeb} className="flex gap-2 relative">
                                                        <input 
                                                            type="text" 
                                                            placeholder="Rechercher une image sur le web..."
                                                            value={webQuery}
                                                            onChange={e => setWebQuery(e.target.value)}
                                                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-black text-white hover:border-white/30 focus:border-neon-cyan outline-none transition-all uppercase placeholder:italic"
                                                        />
                                                        <button type="submit" disabled={isSearching} className="bg-neon-cyan text-black px-4 rounded-xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all outline-none flex items-center justify-center min-w-[100px]">
                                                            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Chercher'}
                                                        </button>
                                                    </form>
                                                    
                                                    {aspect && (
                                                        <div className="flex items-center gap-2 bg-neon-cyan/10 border border-neon-cyan/20 p-2 rounded-xl text-neon-cyan text-[9px] font-black uppercase tracking-widest">
                                                            <Check className="w-3 h-3 shrink-0" />
                                                            Vous serez invité à recadrer l'image après sélection ({aspect > 1.1 ? 'Paysage' : aspect < 0.9 ? 'Portrait' : 'Carré'})
                                                        </div>
                                                    )}

                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto no-scrollbar max-h-[60vh] rounded-xl pr-2 pb-4 content-start auto-rows-max">
                                                        {webResults.map(photo => (
                                                             <div 
                                                                key={photo.id} 
                                                                onClick={() => {
                                                                    const isSelected = selectedImages.some(img => img.preview === photo.url);
                                                                    if (allowMultiple) {
                                                                        if (isSelected) {
                                                                            setSelectedImages(prev => prev.filter(img => img.preview !== photo.url));
                                                                        } else {
                                                                            setSelectedImages(prev => [...prev, { file: null, preview: photo.url }]);
                                                                        }
                                                                    } else {
                                                                        setSelectedImages([{ file: null, preview: photo.url }]);
                                                                        setStep('preview');
                                                                    }
                                                                }}
                                                                className={`relative w-full aspect-square min-h-[100px] md:min-h-[120px] border-2 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 group shadow-lg ${selectedImages.some(img => img.preview === photo.url) ? 'border-neon-cyan ring-4 ring-neon-cyan/20 scale-[0.98]' : 'border-white/5 hover:border-white/10 hover:scale-[1.02]'}`}
                                                            >
                                                                <img src={photo.thumb} className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${selectedImages.some(img => img.preview === photo.url) ? 'opacity-100 scale-110' : 'opacity-70 group-hover:opacity-100 group-hover:scale-110'}`} />
                                                                
                                                                {selectedImages.some(img => img.preview === photo.url) && (
                                                                    <div className="absolute top-4 right-4 w-8 h-8 bg-neon-cyan rounded-full flex items-center justify-center shadow-2xl animate-in zoom-in duration-300 z-20">
                                                                        <div className="text-xs font-black text-black">
                                                                            {allowMultiple ? selectedImages.findIndex(img => img.preview === photo.url) + 1 : <Check className="w-4 h-4" strokeWidth={4} />}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                <div className="absolute inset-x-0 bottom-0 bg-black/80 backdrop-blur-md p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                                                    <span className="text-[8px] font-black text-white block truncate text-center uppercase tracking-widest">{photo.author}</span>
                                                                </div>
                                                             </div>
                                                        ))}
                                                        
                                                        {webResults.length > 0 && webResults.length % 10 === 0 && (
                                                            <div className="col-span-full mt-4 flex justify-center pb-8">
                                                                <button 
                                                                    onClick={() => searchWeb(undefined, true)}
                                                                    disabled={isSearching}
                                                                    className="px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase text-white tracking-widest transition-all flex items-center gap-2 group"
                                                                >
                                                                    {isSearching ? <Loader2 className="w-4 h-4 animate-spin text-neon-cyan" /> : <span className="flex items-center gap-2">Charger la suite <ArrowUpDown className="w-3 h-3 group-hover:translate-y-1 transition-transform" /></span>}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : r2Loading && r2Photos.length === 0 ? (
                                                <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-neon-blue" /></div>
                                            ) : (
                                                <>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6 max-h-[60vh] overflow-y-auto no-scrollbar rounded-3xl p-4 w-full auto-rows-max content-start">
                                                        {r2Photos.filter(p => {
                                                            const isImg = isImageFile(p.key) || (p.url && isImageFile(p.url));
                                                            const isVid = isVideoFile(p.key) || (p.url && isVideoFile(p.url));
                                                            if (!isImg && !isVid) return false;
                                                            if (mediaFilter === 'images' && !isImg) return false;
                                                            if (mediaFilter === 'videos' && !isVid) return false;
                                                            return (!searchTerm || p.key.toLowerCase().includes(searchTerm.toLowerCase()));
                                                        }).map(photo => {
                                                            const isVid = isVideoFile(photo.key) || (photo.url && isVideoFile(photo.url));
                                                            return (
                                                            <div 
                                                                key={photo.key} 
                                                                onClick={() => {
                                                                    const isSelected = selectedImages.some(img => img.preview === photo.url);
                                                                    if (allowMultiple) {
                                                                        if (isSelected) {
                                                                            setSelectedImages(prev => prev.filter(img => img.preview !== photo.url));
                                                                        } else {
                                                                            setSelectedImages(prev => [...prev, { file: null, preview: photo.url }]);
                                                                        }
                                                                    } else {
                                                                        setSelectedImages([{ file: null, preview: photo.url }]);
                                                                        setStep('preview');
                                                                    }
                                                                }}
                                                                className={`relative w-full aspect-square min-h-[100px] md:min-h-[120px] bg-[#111] border-2 rounded-2xl md:rounded-[2rem] overflow-hidden cursor-pointer transition-all duration-300 group shadow-lg ${selectedImages.some(img => img.preview === photo.url) ? 'border-neon-blue ring-4 ring-neon-blue/20 scale-[0.98]' : 'border-white/5 hover:border-white/10 hover:scale-[1.02]'}`}
                                                            >
                                                                {isVid ? (
                                                                    <div className="absolute inset-0 w-full h-full bg-black/60 flex items-center justify-center">
                                                                        <video  
                                                                            src={photo.url} 
                                                                            muted 
                                                                            playsInline 
                                                                            loop 
                                                                            preload="metadata"
                                                                            onMouseEnter={e => { e.currentTarget.play().catch(() => {}); }}
                                                                            onMouseLeave={e => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                                                                            className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${selectedImages.some(img => img.preview === photo.url) ? 'opacity-100 scale-110' : 'opacity-70 group-hover:opacity-100 group-hover:scale-110'}`} 
                                                                        />
                                                                        <div className="absolute top-3 left-3 px-2 py-0.5 bg-black/80 backdrop-blur-md rounded-md border border-white/20 flex items-center gap-1.5 pointer-events-none z-10 shadow-lg">
                                                                            <Film className="w-3 h-3 text-[#ff3700]" />
                                                                            <span className="text-[8px] font-black uppercase text-white tracking-wider">Vidéo</span>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <img  
                                                                        src={photo.url} 
                                                                        alt="" 
                                                                        loading="lazy"
                                                                        className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${selectedImages.some(img => img.preview === photo.url) ? 'opacity-100 scale-110' : 'opacity-70 group-hover:opacity-100 group-hover:scale-110'}`} 
                                                                    />
                                                                )}
                                                                
                                                                {/* Bouton de suppression directe au survol (en haut à droite) */}
                                                                <button
                                                                    type="button"
                                                                    title="Supprimer définitivement du Cloud"
                                                                    onClick={(e) => handleDeleteFile(photo.key, e)}
                                                                    className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/80 hover:bg-red-600 text-gray-300 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg z-30 border border-white/20 hover:border-red-500/40 backdrop-blur-md"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>

                                                                {selectedImages.some(img => img.preview === photo.url) && (
                                                                    <div className="absolute top-2.5 left-2.5 w-7 h-7 bg-neon-blue rounded-full flex items-center justify-center shadow-2xl animate-in zoom-in duration-300 z-20 pointer-events-none">
                                                                        <div className="text-xs font-black text-black">
                                                                            {allowMultiple ? selectedImages.findIndex(img => img.preview === photo.url) + 1 : <Check className="w-4 h-4" strokeWidth={4} />}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Tiroir inférieur avec nom du fichier et bouton poubelle */}
                                                                <div className="absolute inset-x-0 bottom-0 bg-black/90 backdrop-blur-xl p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-500 border-t border-white/10 z-20 flex items-center justify-between gap-2">
                                                                    <span className="text-[10px] font-black text-white block truncate uppercase tracking-[0.15em] flex-1">
                                                                        {photo.key.split('/').pop()}
                                                                    </span>
                                                                    <button
                                                                        type="button"
                                                                        title="Supprimer du Cloud"
                                                                        onClick={(e) => handleDeleteFile(photo.key, e)}
                                                                        className="p-1.5 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-lg transition-all shrink-0 hover:scale-110 shadow"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            );
                                                        })}
                                                        <div ref={sentinelRef} className="col-span-full h-32 flex items-center justify-center">
                                                            {r2Loading && <Loader2 className="w-10 h-10 animate-spin text-neon-blue" />}
                                                        </div>
                                                    </div>
                                                    
                                                    {allowMultiple && selectedImages.length > 0 && (
                                                        <div className="mt-4 flex justify-end">
                                                            <button
                                                                onClick={() => handleUpload(selectedImages)}
                                                                disabled={isUploading}
                                                                className="px-8 py-3 bg-neon-blue text-black font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all text-[11px] shadow-lg shadow-neon-blue/20 flex items-center gap-2"
                                                            >
                                                                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                                                                Valider la sélection ({selectedImages.length})
                                                            </button>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {status === 'error' && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-black uppercase tracking-widest text-center">
                                        {message}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            )}
            {/* Atelier Batch Festival Pro */}
            <FestivalProBatchModal
                isOpen={isBatchModalOpen}
                onClose={() => setIsBatchModalOpen(false)}
                photos={batchPhotos}
                onConfirm={(results) => {
                    const newBlobs: Record<string, Blob | null> = {};
                    const newEnabled: Record<string, boolean> = {};
                    results.forEach(r => {
                        newBlobs[r.id] = r.useEnhanced ? r.enhancedBlob : null;
                        newEnabled[r.id] = r.useEnhanced;
                    });
                    setBatchEnhancedMap(newBlobs);
                    setBatchEnabledMap(newEnabled);
                    if (results.some(r => r.useEnhanced)) setIsFestivalProEnabled(true);
                    setIsBatchModalOpen(false);
                    // Lance immédiatement l'envoi rapide avec les blobs déjà en mémoire !
                    handleUpload(selectedImages, null, newBlobs);
                }}
            />

            {isCropOpen && selectedImages[0] && (
                <ImageCropper
                    image={selectedImages[0].preview}
                    aspect={aspect}
                    onCropComplete={(cropped) => {
                        setIsCropOpen(false);
                        handleUpload([{ file: null, preview: cropped }], selectedImages[0]?.file ?? null);
                    }}
                    onCancel={() => setIsCropOpen(false)}
                />
            )}

            {/* Modal de confirmation de suppression */}
            {deleteConfirmKey && (
                <div className="fixed inset-0 z-[100060] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => !isDeleting && setDeleteConfirmKey(null)}
                        className="fixed inset-0 bg-black/90 backdrop-blur-md"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        className="relative w-full max-w-md bg-[#0d0d0d] border border-red-500/30 rounded-3xl p-6 shadow-2xl z-10 space-y-4 text-left"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-red-500/20 text-red-500 rounded-2xl border border-red-500/30">
                                <Trash2 className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-white uppercase tracking-wider">Supprimer du Cloud</h3>
                                <p className="text-xs text-gray-400">Cette action est définitive et irréversible.</p>
                            </div>
                        </div>

                        <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                            <p className="text-xs text-gray-300 font-mono truncate">{deleteConfirmKey.split('/').pop()}</p>
                            <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Dossier Cloud : {deleteConfirmKey.split('/')[0] || 'uploads'}</p>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => setDeleteConfirmKey(null)}
                                className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50"
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={confirmDeleteFile}
                                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 disabled:opacity-50"
                            >
                                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                {isDeleting ? 'Suppression...' : 'Supprimer'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    if (typeof document === 'undefined') return null;
    return createPortal(modalContent, document.body);
}
