import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Construction, Loader2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AVAILABLE_COLORS } from '../data/colors';
import { useState, useEffect } from 'react';
import initialSettings from '../data/settings.json';
import { AdminEditBar } from '../components/admin/AdminEditBar';
import { Settings2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { resolveImageUrl } from '../utils/image';

export function Shop() {
    const isMini = new URLSearchParams(window.location.search).get('mini') === 'true';

    const [isEnabled, setIsEnabled] = useState(initialSettings.shop_enabled);
    const { t } = useLanguage();
    const [isPasswordProtected, setIsPasswordProtected] = useState((initialSettings as any).shop_password_protected || false);
    const [passwordImage, setPasswordImage] = useState((initialSettings as any).shop_password_image || '');
    const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem('shop_auth') === 'true');
    const [passwordInput, setPasswordInput] = useState(localStorage.getItem('shop_password_saved') || '');
    const [passwordError, setPasswordError] = useState(false);
    const [shopAuthPassword, setShopAuthPassword] = useState((initialSettings as any).shop_password || '');
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState<'Tous' | 'Vetements' | 'Accessoires'>('Tous');
    const [selectedProductUrl, setSelectedProductUrl] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [settingsRes, productsRes] = await Promise.all([
                    fetch('/api/settings'),
                    fetch('/api/shop')
                ]);

                if (settingsRes.ok) {
                    const data = await settingsRes.json();
                    setIsEnabled(data.shop_enabled);
                    setIsPasswordProtected(data.shop_password_protected || false);
                    setPasswordImage(data.shop_password_image || '');
                    setShopAuthPassword(data.shop_password || '');
                }

                if (productsRes.ok) {
                    const data: any[] = await productsRes.json();
                    const sortedProducts = [...data].sort((a, b) => {
                        const catA = a.category || '';
                        const catB = b.category || '';
                        if (catA === 'Vetements' && catB !== 'Vetements') return -1;
                        if (catA !== 'Vetements' && catB === 'Vetements') return 1;
                        return 0;
                    });
                    setProducts(sortedProducts);
                }
            } catch (error: any) {
                console.error('Error fetching shop data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordInput.toUpperCase() === shopAuthPassword.toUpperCase()) {
            setIsAuthenticated(true);
            setPasswordError(false);
            localStorage.setItem('shop_auth', 'true');
            localStorage.setItem('shop_password_saved', passwordInput);
        } else {
            setPasswordError(true);
        }
    };

    const filteredProducts = products.filter(p => {
        if (activeCategory === 'Tous') return true;
        return p.category === activeCategory;
    });

    if (loading) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 text-neon-red animate-spin opacity-20" />
            </div>
        );
    }

    if (isPasswordProtected && !isAuthenticated) {
        return (
            <>
                <AdminEditBar 
                    pageName="Boutique"
                    pageActions={[
                        {
                            label: 'Gérer le Shop',
                            icon: <Settings2 className="w-3.5 h-3.5" />,
                            to: '/admin/shop',
                            permission: 'shop'
                        }
                    ]}
                />
                <div className="min-h-[80vh] flex flex-col items-center justify-center px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full max-w-md bg-white/5 border border-white/10 rounded-[40px] p-12 shadow-2xl backdrop-blur-xl relative overflow-hidden"
                    >
                        {/* Decorative Elements */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-red/10 blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-neon-red/5 blur-[40px] rounded-full translate-y-1/2 -translate-x-1/2" />

                    <div className="relative z-10 text-center">
                        <div className="w-20 h-20 bg-neon-red/10 rounded-[24px] flex items-center justify-center mx-auto mb-8 border border-neon-red/20 rotate-12 group hover:rotate-0 transition-transform duration-500">
                            <ShoppingBag className="w-10 h-10 text-neon-red" />
                        </div>

                        <h1 className="text-4xl font-display font-black text-white mb-4 uppercase italic tracking-tighter" dangerouslySetInnerHTML={{ __html: t('shop.auth.title') }} />
                        <p className="text-gray-400 mb-10 text-xs font-black uppercase tracking-[0.2em] leading-relaxed">
                            {t('shop.auth.subtitle')}
                        </p>

                        <form onSubmit={handlePasswordSubmit} className="space-y-6">
                            <div className="relative">
                                <input
                                    type="password"
                                    placeholder={t('shop.auth.placeholder')}
                                    value={passwordInput}
                                    onChange={(e) => setPasswordInput(e.target.value)}
                                    className={`w-full bg-black/60 border ${passwordError ? 'border-neon-red shadow-[0_0_15px_rgba(255,0,51,0.2)]' : 'border-white/10 focus:border-neon-red'} rounded-2xl px-6 py-4 text-white text-center font-bold tracking-[0.3em] outline-none transition-all placeholder:text-gray-700`}
                                    autoFocus
                                />
                                {passwordError && (
                                    <motion.p
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-[10px] text-neon-red font-black uppercase tracking-widest mt-3"
                                    >
                                        {t('shop.auth.error')}
                                    </motion.p>
                                )}
                            </div>

                            <button
                                type="submit"
                                className="w-full py-5 bg-neon-red text-white rounded-2xl font-black uppercase tracking-[0.2em] italic hover:bg-neon-red/80 transition-all shadow-[0_10px_30px_rgba(255,0,51,0.3)] hover:shadow-[0_15px_40px_rgba(255,0,51,0.4)] active:scale-95"
                            >
                                {t('shop.auth.submit')}
                            </button>
                        </form>

                        {passwordImage && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="mt-8 rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative group"
                            >
                                <img 
                                    src={resolveImageUrl(passwordImage)} 
                                    className="w-full h-auto object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-700" 
                                    alt="Private Sale" 
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop';
                                    }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-60" />
                                <div className="absolute bottom-4 left-0 right-0">
                                    <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.5em]">Exclusive Preview</span>
                                </div>
                            </motion.div>
                        )}

                        <Link
                            to="/"
                            className="mt-8 text-[10px] text-gray-600 hover:text-white font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 mx-auto"
                        >
                            {t('common.quit')}
                        </Link>
                    </div>
                </motion.div>
            </div>
            </>
        );
    }

    if (!isEnabled && !isAuthenticated) {
        return (
            <>
                <AdminEditBar 
                    pageName="Boutique"
                    pageActions={[
                        {
                            label: 'Gérer le Shop',
                            icon: <Settings2 className="w-3.5 h-3.5" />,
                            to: '/admin/shop',
                            permission: 'shop'
                        }
                    ]}
                />
                <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center"
                    >
                        <div className="w-20 h-20 bg-neon-red/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-neon-red/20 shadow-[0_0_20px_rgba(255,0,51,0.2)]">
                            <Construction className="w-10 h-10 text-neon-red" />
                        </div>
                    <h1 className="text-5xl md:text-7xl font-display font-black text-white mb-6 uppercase italic tracking-tighter" dangerouslySetInnerHTML={{ __html: t('shop.coming_soon.title') }} />
                    <p className="text-gray-400 max-w-md mx-auto mb-10 font-bold uppercase tracking-widest text-sm opacity-60">
                        {t('shop.coming_soon.subtitle')}
                    </p>
                    <Link
                        to="/"
                        className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold hover:bg-white/10 transition-all uppercase tracking-widest text-xs"
                    >
                        {t('common.back')}
                    </Link>
                </motion.div>
            </div>
            </>
        );
    }

    return (
        <>
            <AdminEditBar 
                pageName="Boutique"
                pageActions={[
                    {
                        label: 'Gérer le Shop',
                        icon: <Settings2 className="w-3.5 h-3.5" />,
                        to: '/admin/shop',
                        permission: 'shop'
                    }
                ]}
            />
            <div className={`min-h-screen bg-dark-bg text-white ${isMini ? 'py-8 px-2' : 'py-32 px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24'} overflow-x-hidden relative`}>
            {/* Background Ambient Glows */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] bg-neon-red/10 animate-pulse transition-all duration-1000" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] bg-neon-cyan/10 animate-pulse [animation-delay:2s] transition-all duration-1000" />
            </div>

            <div className="w-full max-w-[1600px] mx-auto relative z-10">
                <div className={`${isMini ? 'mb-8' : 'mb-20'} text-center sm:text-left`}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="flex items-center justify-center sm:justify-start gap-3 mb-4">
                            <div className="p-2 bg-neon-red/10 rounded-xl border border-neon-red/20 shadow-[0_0_15px_rgba(255,0,51,0.1)]">
                                <ShoppingBag className="w-5 h-5 text-neon-red" />
                            </div>
                            <span className="text-neon-red font-black tracking-[0.3em] text-[10px] uppercase">{t('shop.badge')}</span>
                        </div>
                        
                        <h1 className={`${isMini ? 'text-4xl md:text-5xl' : 'text-4xl md:text-7xl'} font-display font-black text-white mb-6 uppercase italic tracking-tighter leading-tight`}>
                            {t('shop.title')}<span className="text-neon-red">{t('shop.title_span')}</span>
                        </h1>

                        <p className="text-gray-400 max-w-2xl text-base md:text-lg font-medium leading-relaxed mx-auto sm:mx-0">
                            {t('shop.subtitle')}
                        </p>

                        <div className="mt-8 mb-8 text-center sm:text-left text-white text-[10px] font-black uppercase tracking-widest bg-neon-red/5 py-4 px-6 border border-neon-red/10 rounded-2xl max-w-2xl sm:mx-0 shadow-[0_0_20px_rgba(255,0,51,0.05)] leading-relaxed flex items-center gap-4">
                            <div className="w-8 h-8 rounded-lg bg-neon-red/20 flex items-center justify-center shrink-0">
                                <span className="text-neon-red text-xs">!</span>
                            </div>
                            <p>{t('shop.disclaimer')}</p>
                        </div>

                        <div className={`flex justify-center sm:justify-start gap-3 mt-12 ${isMini ? 'mb-4' : 'mb-8'} flex-wrap`}>
                            {['Tous', 'Vetements', 'Accessoires'].map((cat) => {
                                const isActive = activeCategory === cat;
                                return (
                                    <motion.button
                                        key={cat}
                                        onClick={() => setActiveCategory(cat as any)}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className={`relative px-7 py-3 rounded-2xl font-black uppercase tracking-[0.1em] text-[10px] transition-all duration-300 border flex-shrink-0
                                        ${isActive
                                                ? 'bg-neon-red text-white border-transparent shadow-[0_0_20px_rgba(255,17,17,0.4)]'
                                                : 'bg-white/[0.03] text-white/40 border-white/10 hover:border-neon-red/40 hover:text-neon-red'
                                            }`}
                                    >
                                        <span className="relative z-10">
                                            {cat === 'Tous' ? t('shop.filter.all') : 
                                             cat === 'Vetements' ? t('shop.filter.clothes') : 
                                             t('shop.filter.accessories')}
                                        </span>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </motion.div>
                </div>

                {filteredProducts.length === 0 ? (
                    <div className="py-20 text-center">
                        <ShoppingBag className="w-16 h-16 text-white/5 mx-auto mb-6" />
                        <h2 className="text-2xl font-display font-black text-white uppercase italic mb-4">Aucun article dans cette catégorie</h2>
                        <p className="text-gray-400">Revenez bientôt pour nos nouveautés.</p>
                    </div>
                ) : (
                    <div className={`grid ${isMini ? 'grid-cols-4 gap-2 md:gap-4' : 'grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8'}`}>
                        <AnimatePresence mode="popLayout">
                            {filteredProducts.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    isMini={isMini}
                                    onBuy={() => setSelectedProductUrl(product.url)}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Redirection Modal (Optional, but good for UX) */}
            <AnimatePresence>
                {selectedProductUrl && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedProductUrl(null)}
                            className="absolute inset-0 bg-black/95 backdrop-blur-xl"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="relative w-full max-w-lg bg-[#0a0a0a] rounded-[32px] border border-white/10 p-12 text-center shadow-2xl"
                        >
                            <div className="w-20 h-20 bg-neon-red/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-neon-red/20">
                                <ShoppingBag className="w-10 h-10 text-neon-red" />
                            </div>

                            {isPasswordProtected && passwordImage && (
                                <div className="mb-8 rounded-2xl overflow-hidden border border-white/10 shadow-xl max-w-sm mx-auto aspect-video bg-black/40">
                                    <img 
                                        src={resolveImageUrl(passwordImage)} 
                                        className="w-full h-full object-cover" 
                                        alt="Private Sale" 
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop';
                                        }}
                                    />
                                </div>
                            )}

                            <h3 className="text-3xl font-display font-black text-white uppercase italic mb-4">
                                Redirection vers <span className="text-neon-red">le paiement</span>
                            </h3>
                            <p className="text-gray-400 mb-10 font-medium leading-relaxed">
                                Vous allez être redirigé vers notre plateforme de paiement sécurisée Fourthwall pour finaliser votre commande.
                            </p>
                            <div className="flex flex-col gap-4">
                                <a
                                    href={selectedProductUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={() => setSelectedProductUrl(null)}
                                    className="w-full py-4 bg-white text-black rounded-xl font-bold uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                                >
                                    Continuer vers le shop <ExternalLink className="w-4 h-4" />
                                </a>
                                <button
                                    onClick={() => setSelectedProductUrl(null)}
                                    className="w-full py-4 bg-white/5 text-gray-400 rounded-xl font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
                                >
                                    Annuler
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
        </>
    );
}

function ProductCard({ product, onBuy, isMini = false }: { product: any, onBuy: () => void, isMini?: boolean }) {
    const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
    const [isZooming, setIsZooming] = useState(false);
    const [showBack, setShowBack] = useState(false);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);

    const hasBackImage = !!product.imageBack;

    // Determine which image to show
    let currentDisplayImage = product.image;

    if (selectedColor && product.colorImages && product.colorImages[selectedColor]) {
        currentDisplayImage = product.colorImages[selectedColor];
    } else if (showBack && hasBackImage) {
        currentDisplayImage = product.imageBack;
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={`bg-white/5 border border-white/10 rounded-[24px] md:rounded-[32px] overflow-hidden group hover:border-white/20 transition-all duration-500 h-full flex flex-col ${isMini ? 'pb-2 md:pb-4' : 'pb-4 md:pb-8'}`}
            onMouseEnter={() => !selectedColor && setShowBack(true)}
            onMouseLeave={() => setShowBack(false)}
        >
            <div
                className={`aspect-square relative overflow-hidden bg-black/40 cursor-zoom-in ${isMini ? 'mb-3' : 'mb-6'}`}
                onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                    setZoomPos({ x, y });
                }}
                onMouseEnter={() => setIsZooming(true)}
                onMouseLeave={() => setIsZooming(false)}
            >
                <motion.img
                    key={currentDisplayImage}
                    initial={{ opacity: 0.5 }}
                    animate={{ opacity: 1 }}
                    src={resolveImageUrl(currentDisplayImage)}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-200"
                    style={{
                        transform: isZooming ? `scale(2.5)` : 'scale(1)',
                        transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`
                    }}
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1887&auto=format&fit=crop';
                    }}
                />
            </div>

            <div className={`flex flex-col flex-1 h-full ${isMini ? 'px-2 md:px-4' : 'px-3 md:px-8'}`}>
                {hasBackImage && !isZooming && (
                    <div className={`flex gap-2 justify-center ${isMini ? 'mb-3' : 'mb-6'}`}>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setShowBack(false);
                            }}
                            className={`flex-1 px-2 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-2 ${!showBack ? 'bg-white text-black border-white shadow-lg shadow-white/10' : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'}`}
                        >
                            FACE
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setShowBack(true);
                            }}
                            className={`flex-1 px-2 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-2 ${showBack ? 'bg-white text-black border-white shadow-lg shadow-white/10' : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'}`}
                        >
                            DOS
                        </button>
                    </div>
                )}
                <div className={isMini ? 'mb-2' : 'mb-4'}>
                    <h3 className={`${isMini ? 'text-[10px] md:text-sm' : 'text-xs md:text-2xl'} font-bold text-white leading-tight`}>
                        {product.name}
                    </h3>
                </div>

                {!isMini && (
                    <p className="text-gray-500 text-sm line-clamp-2 mb-6 min-h-[40px]">
                        {product.description}
                    </p>
                )}

                <div className={`flex items-center justify-between mt-auto border-t border-white/5 ${isMini ? 'pt-3' : 'pt-6'}`}>
                    {product.colors && product.colors.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {product.colors.map((hex: string, i: number) => {
                                const isSelected = selectedColor === hex;
                                return (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedColor(isSelected ? null : hex)}
                                        className={`w-5 h-5 rounded-full border transition-all ${isSelected ? 'border-white scale-125 z-10 shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'border-white/10 hover:scale-110'}`}
                                        style={{ backgroundColor: hex }}
                                        title={AVAILABLE_COLORS.find(c => c.hex.toLowerCase() === hex.toLowerCase())?.name || hex}
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        <div className="w-4 h-4 rounded-full border border-white/5 bg-white/5" />
                    )}

                    <div className="flex flex-col items-end flex-shrink-0">
                        <span className={`text-neon-red font-display font-black italic ${isMini ? 'text-sm md:text-lg' : 'text-base md:text-2xl'}`}>{product.price}€</span>
                        {!isMini && <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">+ frais de port</span>}
                    </div>
                </div>

                <div className={isMini ? 'mt-4' : 'mt-8'}>
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            onBuy();
                        }}
                        className={`w-full bg-neon-red text-white rounded-xl font-black uppercase tracking-widest text-center shadow-lg shadow-neon-red/20 transform hover:scale-[1.02] active:scale-[0.98] transition-all ${isMini ? 'py-2 text-[10px]' : 'py-4'}`}
                    >
                        ACHETER
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
