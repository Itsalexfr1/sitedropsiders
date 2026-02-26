import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Save, Loader2, CheckCircle2, AlertCircle, Plus, X, Trash2, Image as ImageIcon, Check, Edit2, GripVertical, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Link, useBlocker } from 'react-router-dom';
import { getAuthHeaders } from '../utils/auth';
import { ImageUploadModal } from '../components/ImageUploadModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import initialSettings from '../data/settings.json';

import { AVAILABLE_COLORS } from '../data/colors';

export function AdminShop() {
    const [shopEnabled, setShopEnabled] = useState(initialSettings.shop_enabled);
    const [shopPasswordProtected, setShopPasswordProtected] = useState(initialSettings.shop_password_protected || false);
    const [shopPasswordImage, setShopPasswordImage] = useState((initialSettings as any).shop_password_image || '');
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [shopUploadTarget, setShopUploadTarget] = useState<{ type: 'image' | 'imageBack' | 'color' | 'password_image', colorHex?: string, initialImage?: string }>({ type: 'image' });
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [dateSort, setDateSort] = useState<'desc' | 'asc'>('desc');

    const [permissions] = useState<string[]>(() => JSON.parse(localStorage.getItem('admin_permissions') || '[]'));
    const storedUser = localStorage.getItem('admin_user');

    const hasPermission = (p: string) => {
        if (permissions.includes('all')) return true;
        if (storedUser === 'alex') return true;

        const actionPermissions = ['create', 'edit', 'delete'];
        if (actionPermissions.includes(p)) {
            return permissions.includes(p);
        }

        if (permissions.includes(p)) return true;

        // Fallback pour shop
        if (permissions.includes('shop') && (p === 'shop' || p === 'create' || p === 'edit' || p === 'delete')) return true;

        return false;
    };

    const canCreate = hasPermission('create');
    const canEdit = hasPermission('edit');
    const canDelete = hasPermission('delete');
    const canManageShop = hasPermission('shop');

    // Add/Edit Product Form State
    const [isAdding, setIsAdding] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<any>(null);
    const [newProduct, setNewProduct] = useState({
        name: '',
        price: '',
        image: '',
        description: '',
        url: '',
        colors: [] as string[],
        colorImages: {} as { [key: string]: string },
        images: [] as string[],
        category: 'Vetements',
        imageBack: ''
    });

    const [hasChanges, setHasChanges] = useState(false);
    const initialDataLoaded = useRef(false);

    // Track changes
    useEffect(() => {
        if (products.length > 0 && !initialDataLoaded.current) {
            initialDataLoaded.current = true;
            return;
        }
        if (initialDataLoaded.current) {
            setHasChanges(true);
        }
    }, [products, shopEnabled, shopPasswordProtected, shopPasswordImage]);

    // Prompt before internal React Router navigation
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            hasChanges && currentLocation.pathname !== nextLocation.pathname
    );

    // Confirm navigation handled by ConfirmationModal component in JSX

    // Prompt before window reload/close
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasChanges]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [settingsRes, productsRes] = await Promise.all([
                    fetch('/api/settings'),
                    fetch('/api/shop')
                ]);

                if (settingsRes.ok) {
                    const data = await settingsRes.json();
                    setShopEnabled(data.shop_enabled);
                    setShopPasswordProtected(data.shop_password_protected || false);
                    setShopPasswordImage(data.shop_password_image || '');
                }

                if (productsRes.ok) {
                    const data = await productsRes.json();
                    setProducts(data);
                }
            } catch (error) {
                console.error('Error fetching shop data:', error);
            }
        };
        fetchData();
    }, []);

    const handleSaveSettings = async () => {
        setLoading(true);
        setStatus('idle');
        try {
            const response = await fetch('/api/settings/update', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    shop_enabled: shopEnabled,
                    shop_password_protected: shopPasswordProtected,
                    shop_password_image: shopPasswordImage
                })
            });

            if (response.ok) {
                setStatus('success');
                setMessage('Paramètres mis à jour !');
                setHasChanges(false);
                setTimeout(() => setStatus('idle'), 3000);
            } else {
                setStatus('error');
                setMessage('Erreur lors de la sauvegarde');
            }
        } catch (error) {
            setStatus('error');
            setMessage('Erreur de connexion');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (editingProduct) {
                const response = await fetch('/api/shop/update', {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ id: editingProduct.id, updates: newProduct })
                });

                if (response.ok) {
                    const data = await response.json();
                    setProducts(products.map(p => p.id === editingProduct.id ? data.product : p));
                    resetForm();
                    setStatus('success');
                    setHasChanges(false);
                    setMessage('Produit mis à jour !');
                    setTimeout(() => setStatus('idle'), 3000);
                }
            } else {
                const response = await fetch('/api/shop/create', {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(newProduct)
                });

                if (response.ok) {
                    const data = await response.json();
                    setProducts([data.product, ...products]);
                    resetForm();
                    setStatus('success');
                    setHasChanges(false);
                    setMessage('Produit ajouté !');
                    setTimeout(() => setStatus('idle'), 3000);
                }
            }
        } catch (error) {
            console.error('Error saving product:', error);
            setStatus('error');
            setMessage('Erreur lors de l\'enregistrement');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setNewProduct({ name: '', price: '', image: '', description: '', url: '', colors: [], colorImages: {}, images: [], category: 'Vetements', imageBack: '' });
        setEditingProduct(null);
        setIsAdding(false);
    };

    const handleDeleteProduct = async (id: number) => {

        try {
            const response = await fetch('/api/shop/delete', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ id })
            });

            if (response.ok) {
                setProducts(products.filter(p => p.id !== id));
            }
        } catch (error) {
            console.error('Error deleting product:', error);
        }
    };

    const handleEditProductClick = (product: any) => {
        setEditingProduct(product);
        setNewProduct({
            name: product.name,
            price: product.price,
            image: product.image,
            description: product.description || '',
            url: product.url || '',
            colors: product.colors || [],
            colorImages: product.colorImages || {},
            images: product.images || [],
            category: product.category || 'Vetements',
            imageBack: product.imageBack || ''
        });
        setIsAdding(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const toggleColor = (hex: string) => {
        setNewProduct(prev => {
            const colors = prev.colors.includes(hex)
                ? prev.colors.filter(c => c !== hex)
                : [...prev.colors, hex];
            return { ...prev, colors };
        });
    };

    const handleReorder = async (newOrder: any[]) => {
        setProducts(newOrder);
        try {
            await fetch('/api/shop/reorder', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ products: newOrder })
            });
        } catch (error) {
            console.error('Error reordering products:', error);
        }
    };

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
        return matchesSearch && matchesCategory;
    }).sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateSort === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return (
        <div className="min-h-screen bg-dark-bg py-32">
            <div className="max-w-full mx-auto px-4 md:px-12">
                <div className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-6">
                        <Link to="/admin" className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-gray-400 group" title="Retour au tableau de bord">
                            <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                        </Link>
                        <div>
                            <h1 className="text-4xl md:text-5xl font-display font-black text-white uppercase italic tracking-tighter">
                                Gestion <span className="text-neon-red">Shop</span>
                            </h1>
                        </div>
                    </div>

                    {(canCreate || canManageShop) && (
                        <button
                            onClick={() => {
                                if (isAdding) {
                                    resetForm();
                                } else {
                                    setIsAdding(true);
                                }
                            }}
                            className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold uppercase tracking-widest text-xs hover:bg-white/10 transition-all"
                        >
                            {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4 text-neon-red" />}
                            {isAdding ? 'Annuler' : 'Ajouter un article'}
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Settings & Form */}
                    <div className="lg:col-span-1 space-y-8">
                        {status !== 'idle' && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`p-4 rounded-2xl border flex items-center gap-3 ${status === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-neon-red/10 border-neon-red/20 text-neon-red'}`}
                            >
                                {status === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                <span className="text-sm font-bold uppercase tracking-widest">{message}</span>
                            </motion.div>
                        )}

                        {/* Settings Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/5 border border-white/10 rounded-[32px] p-8 shadow-2xl backdrop-blur-sm relative overflow-hidden"
                        >
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-xl font-display font-black text-white uppercase italic">Paramètres</h3>
                                    <button
                                        onClick={() => setShopEnabled(!shopEnabled)}
                                        className={`relative w-14 h-7 rounded-full transition-all duration-500 p-1 border ${shopEnabled ? 'bg-green-500/20 border-green-500/40' : 'bg-white/5 border-white/10'}`}
                                    >
                                        <motion.div
                                            animate={{ x: shopEnabled ? 28 : 0 }}
                                            className={`w-5 h-5 rounded-full flex items-center justify-center ${shopEnabled ? 'bg-green-500' : 'bg-gray-600'}`}
                                        />
                                    </button>
                                </div>
                                <div className="space-y-4 mb-8">
                                    <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                                        <p className="text-gray-500 text-[9px] font-black uppercase mb-1">BOUTIQUE PUBLIQUE</p>
                                        <p className={`text-sm font-bold uppercase ${shopEnabled ? 'text-green-400' : 'text-neon-red'}`}>
                                            {shopEnabled ? 'En ligne' : 'Maintenance'}
                                        </p>
                                    </div>

                                    <div className="p-6 bg-black/40 rounded-[24px] border border-white/5 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-gray-500 text-[9px] font-black uppercase mb-1">ACCÈS PRIVÉ (CODE)</p>
                                                <p className={`text-sm font-bold uppercase ${shopPasswordProtected ? 'text-neon-red' : 'text-gray-600'}`}>
                                                    {shopPasswordProtected ? 'DROPSHOP' : 'Désactivé'}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setShopPasswordProtected(!shopPasswordProtected)}
                                                className={`relative w-14 h-7 rounded-full transition-all duration-500 p-1 border ${shopPasswordProtected ? 'bg-neon-red/20 border-neon-red/40' : 'bg-white/5 border-white/10'}`}
                                            >
                                                <motion.div
                                                    animate={{ x: shopPasswordProtected ? 28 : 0 }}
                                                    className={`w-5 h-5 rounded-full flex items-center justify-center ${shopPasswordProtected ? 'bg-neon-red' : 'bg-gray-600'}`}
                                                />
                                            </button>
                                        </div>
                                        <p className="text-[9px] text-gray-500 leading-relaxed uppercase font-medium">
                                            Si activé, le shop ne sera plus visible dans le menu et nécessitera le code <span className="text-neon-red font-black">DROPSHOP</span> pour y accéder.
                                        </p>

                                        {shopPasswordProtected && (
                                            <div className="pt-4 border-t border-white/5 space-y-4">
                                                <p className="text-[9px] font-black uppercase text-gray-500">Image Vente Privée</p>
                                                <div className="relative group/img aspect-video bg-black/40 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center">
                                                    {shopPasswordImage ? (
                                                        <img src={shopPasswordImage} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <ImageIcon className="w-8 h-8 text-gray-700" />
                                                    )}
                                                    <button
                                                        onClick={() => {
                                                            setShopUploadTarget({ type: 'password_image', initialImage: shopPasswordImage });
                                                            setShowUploadModal(true);
                                                        }}
                                                        className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 cursor-pointer"
                                                    >
                                                        <Plus className="w-6 h-6 text-white" />
                                                        <span className="text-[8px] font-black uppercase text-white">Changer l'image</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        <div className="pt-4 border-t border-white/5">
                                            <Link
                                                to="/shop"
                                                target="_blank"
                                                className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all group/link"
                                            >
                                                <span className="text-[10px] font-black text-gray-400 group-hover/link:text-white uppercase tracking-widest transition-colors">Voir la page shop</span>
                                                <ExternalLink className="w-4 h-4 text-gray-600 group-hover/link:text-neon-red transition-colors" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={handleSaveSettings}
                                    disabled={loading || !(canEdit || canManageShop)}
                                    className="w-full flex items-center justify-center gap-3 py-4 bg-neon-red text-white rounded-xl font-bold uppercase tracking-widest hover:bg-neon-red/80 transition-all shadow-lg shadow-neon-red/20 disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Sauvegarder
                                </button>
                            </div>
                        </motion.div>

                        {/* Add/Edit Product Form */}
                        <AnimatePresence mode="wait">
                            {isAdding && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 shadow-2xl backdrop-blur-sm">
                                        <h3 className="text-xl font-display font-black text-white uppercase italic mb-6">
                                            {editingProduct ? 'Modifier Article' : 'Nouvel Article'}
                                        </h3>
                                        <form onSubmit={handleSaveProduct} className="space-y-4">
                                            <div>
                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Nom du produit</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={newProduct.name}
                                                    onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-red outline-none transition-all"
                                                    placeholder="ex: T-Shirt Dropsiders Logo"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Prix (€)</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={newProduct.price}
                                                        onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
                                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-red outline-none transition-all"
                                                        placeholder="25.00"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Catégorie</label>
                                                    <select
                                                        value={newProduct.category}
                                                        onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
                                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-red outline-none transition-all appearance-none cursor-pointer"
                                                    >
                                                        <option value="Vetements" className="bg-[#0a0a0a]">Vêtements</option>
                                                        <option value="Accessoires" className="bg-[#0a0a0a]">Accessoires</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Lien Extérieur (Option) </label>
                                                <input
                                                    type="url"
                                                    value={newProduct.url}
                                                    onChange={e => setNewProduct({ ...newProduct, url: e.target.value })}
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-red outline-none transition-all"
                                                    placeholder="https://..."
                                                />
                                            </div>

                                            <div className="p-4 bg-black/40 rounded-2xl border border-white/10">
                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 block text-center">Choix des couleurs</label>
                                                <div className="grid grid-cols-7 gap-3">
                                                    {AVAILABLE_COLORS.map((color) => {
                                                        const isSelected = newProduct.colors.includes(color.hex);
                                                        return (
                                                            <button
                                                                key={color.hex}
                                                                type="button"
                                                                onClick={() => toggleColor(color.hex)}
                                                                title={color.name}
                                                                className={`w-8 h-8 rounded-full border border-white/20 relative transition-transform hover:scale-110 active:scale-90 flex items-center justify-center`}
                                                                style={{ backgroundColor: color.hex }}
                                                            >
                                                                {isSelected && (
                                                                    <Check className={`w-4 h-4 ${['#ffffff', '#f5f5dc', '#fde047', '#facc15', '#bef264', '#86efac', '#fbcfe8', '#99f6e4', '#c084fc'].includes(color.hex.toLowerCase()) ? 'text-black' : 'text-white'}`} />
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>

                                                {/* Color Specific Image Upload */}
                                                {newProduct.colors.length > 0 && (
                                                    <div className="mt-4 space-y-2 border-t border-white/5 pt-4">
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center mb-2">Photos par couleur</p>
                                                        <div className="flex flex-wrap gap-2 justify-center">
                                                            {newProduct.colors.map(hex => {
                                                                const colorImg = newProduct.colorImages[hex];
                                                                return (
                                                                    <div key={hex} className="group relative">
                                                                        <div
                                                                            className="w-10 h-10 rounded-lg border border-white/10 flex items-center justify-center relative overflow-hidden bg-black/40"
                                                                            style={{ borderLeft: `4px solid ${hex}` }}
                                                                        >
                                                                            {colorImg ? (
                                                                                <img src={colorImg} className="w-full h-full object-cover opacity-50" />
                                                                            ) : (
                                                                                <ImageIcon className="w-3 h-3 text-gray-600" />
                                                                            )}
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setShopUploadTarget({ type: 'color', colorHex: hex, initialImage: colorImg });
                                                                                    setShowUploadModal(true);
                                                                                }}
                                                                                className="absolute inset-0 flex items-center justify-center cursor-pointer hover:bg-neon-red/10 transition-colors group/upload"
                                                                            >
                                                                                <Plus className="w-3 h-3 text-white opacity-0 group-hover/upload:opacity-100" />
                                                                            </button>
                                                                        </div>
                                                                        <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full" style={{ backgroundColor: hex }} />
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="relative">
                                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Image Face (URL)</label>
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            required
                                                            value={newProduct.image}
                                                            onChange={e => setNewProduct({ ...newProduct, image: e.target.value })}
                                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white focus:border-neon-red outline-none transition-all"
                                                            placeholder="URL ou upload..."
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setShopUploadTarget({ type: 'image', initialImage: newProduct.image });
                                                                setShowUploadModal(true);
                                                            }}
                                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-neon-red/10 rounded-lg cursor-pointer transition-colors group/upload"
                                                        >
                                                            <ImageIcon className="w-4 h-4 text-gray-500 group-hover/upload:text-neon-red" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="relative">
                                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Image Dos (Option)</label>
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            value={newProduct.imageBack}
                                                            onChange={e => setNewProduct({ ...newProduct, imageBack: e.target.value })}
                                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white focus:border-neon-red outline-none transition-all"
                                                            placeholder="URL ou upload..."
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setShopUploadTarget({ type: 'imageBack', initialImage: newProduct.imageBack });
                                                                setShowUploadModal(true);
                                                            }}
                                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-neon-red/10 rounded-lg cursor-pointer transition-colors group/upload"
                                                        >
                                                            <ImageIcon className="w-4 h-4 text-gray-500 group-hover/upload:text-neon-red" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Description (Optionnel)</label>
                                                <textarea
                                                    value={newProduct.description}
                                                    onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-red outline-none transition-all h-24 resize-none"
                                                    placeholder="Description du produit..."
                                                />
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="w-full py-4 bg-white text-black rounded-xl font-bold uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                                            >
                                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingProduct ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />)}
                                                {editingProduct ? 'Mettre à jour l\'article' : 'Ajouter l\'article'}
                                            </button>
                                        </form>
                                    </div>

                                    {/* Preview Card */}
                                    <div className="mt-8 space-y-4">
                                        <div className="flex items-center gap-2 px-1">
                                            <div className="h-1 w-1 bg-neon-red rounded-full" />
                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Aperçu boutique</h4>
                                        </div>
                                        <div className="bg-[#0a0a0a] border border-white/5 rounded-[32px] overflow-hidden pb-8 shadow-2xl">
                                            <div className="aspect-square relative overflow-hidden bg-white/5 mb-6">
                                                {newProduct.image ? (
                                                    <img src={newProduct.image} className="w-full h-full object-cover" alt="preview" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center opacity-10">
                                                        <ImageIcon className="w-12 h-12" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="px-8">
                                                <h3 className="text-2xl font-bold text-white mb-4">{newProduct.name || "Nom du produit"}</h3>
                                                <p className="text-gray-500 text-sm line-clamp-2 min-h-[40px] mb-6">{newProduct.description || "Description..."}</p>
                                                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                                    <div className="flex gap-2">
                                                        {newProduct.colors.map((hex, i) => (
                                                            <div key={i} className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: hex }} />
                                                        ))}
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-neon-red font-display font-black italic text-2xl">{newProduct.price || "00.00"}€</span>
                                                    </div>
                                                </div>
                                                <div className="mt-8">
                                                    <div className="w-full py-4 bg-neon-red text-white rounded-xl font-bold uppercase tracking-widest text-center shadow-lg shadow-neon-red/20 opacity-80">
                                                        Acheter
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Right Column: Product List */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 shadow-2xl backdrop-blur-sm">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                                <h3 className="text-2xl font-display font-black text-white uppercase italic">Articles en ligne ({filteredProducts.length})</h3>

                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="relative">
                                        <select
                                            value={categoryFilter}
                                            onChange={(e) => setCategoryFilter(e.target.value)}
                                            className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-white outline-none focus:border-neon-red appearance-none pr-10 cursor-pointer min-w-[120px]"
                                        >
                                            <option value="all">Tout</option>
                                            <option value="Vetements">Vêtements</option>
                                            <option value="Accessoires">Accessoires</option>
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <select
                                            value={dateSort}
                                            onChange={(e) => setDateSort(e.target.value as 'desc' | 'asc')}
                                            className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-white outline-none focus:border-neon-red appearance-none pr-10 cursor-pointer min-w-[140px]"
                                        >
                                            <option value="desc">Le plus récent</option>
                                            <option value="asc">Le plus ancien</option>
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-8">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Rechercher un produit..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-neon-red outline-none transition-all pl-12"
                                    />
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    </div>
                                </div>
                            </div>

                            <Reorder.Group axis="y" values={filteredProducts} onReorder={handleReorder} className="space-y-4">
                                {filteredProducts.map((product) => (
                                    <Reorder.Item
                                        key={product.id}
                                        value={product}
                                        className="flex flex-col md:flex-row items-center gap-6 p-6 bg-black/40 border border-white/5 rounded-2xl hover:border-white/20 transition-all group cursor-grab active:cursor-grabbing"
                                    >
                                        <div className="flex items-center gap-4">
                                            <GripVertical className="w-5 h-5 text-gray-600 group-hover:text-neon-red transition-colors" />
                                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
                                                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h4 className="text-lg font-bold text-white truncate uppercase italic">{product.name}</h4>
                                                <span className="px-2 py-0.5 bg-neon-red/10 text-neon-red text-[8px] font-black rounded uppercase border border-neon-red/20">
                                                    {product.category}
                                                </span>
                                            </div>
                                            <p className="text-gray-500 text-xs line-clamp-1 mb-3">{product.description}</p>
                                            <div className="flex items-center gap-4">
                                                <span className="text-neon-red font-display font-black italic">{product.price}€</span>
                                                <div className="flex gap-1">
                                                    {product.colors && product.colors.map((hex: string, i: number) => (
                                                        <div
                                                            key={i}
                                                            className="w-3 h-3 rounded-full border border-white/10"
                                                            style={{ backgroundColor: hex }}
                                                            title={AVAILABLE_COLORS.find(c => c.hex.toLowerCase() === hex.toLowerCase())?.name || hex}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {(canEdit || canManageShop) && (
                                                <button
                                                    onClick={() => handleEditProductClick(product)}
                                                    className="p-3 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                                                    title="Modifier"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                            )}
                                            {(canDelete || canManageShop) && (
                                                <button
                                                    onClick={() => setDeleteTarget(product)}
                                                    className="p-3 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                    </Reorder.Item>
                                ))}
                            </Reorder.Group>
                        </div>
                    </div>
                </div>
            </div>
            <ImageUploadModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                accentColor="neon-red"
                initialImage={shopUploadTarget.initialImage}
                onUploadSuccess={(url) => {
                    const { type, colorHex } = shopUploadTarget;
                    if (type === 'color' && colorHex) {
                        setNewProduct(prev => ({
                            ...prev,
                            colorImages: { ...prev.colorImages, [colorHex]: url }
                        }));
                    } else if (type === 'password_image') {
                        setShopPasswordImage(url);
                        setHasChanges(true);
                    } else {
                        setNewProduct(prev => ({ ...prev, [type]: url }));
                    }
                    setStatus('success');
                    setTimeout(() => setStatus('idle'), 3000);
                }}
            />

            <ConfirmationModal
                isOpen={blocker.state === "blocked"}
                message="Vous avez des modifications non enregistrées. Voulez-vous vraiment quitter la page ?"
                onConfirm={() => blocker.proceed?.()}
                onCancel={() => blocker.reset?.()}
                accentColor="neon-red"
            />

            <ConfirmationModal
                isOpen={deleteTarget !== null}
                title="Supprimer le produit"
                message={`Êtes-vous sûr de vouloir supprimer le produit "${deleteTarget?.name}" ?`}
                confirmLabel="Supprimer"
                cancelLabel="Annuler"
                onConfirm={() => {
                    if (deleteTarget) handleDeleteProduct(deleteTarget.id);
                    setDeleteTarget(null);
                }}
                onCancel={() => setDeleteTarget(null)}
                accentColor="neon-red"
            />
        </div>
    );
}
