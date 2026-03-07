import { AnnouncementBanner } from '../AnnouncementBanner';
import { Navbar } from './Navbar';
import { MobileNavbar } from './MobileNavbar';
import { MobileHeader } from './MobileHeader';
import { MobileSearchOverlay } from '../mobile/MobileSearchOverlay';
import { VinylCursor } from '../ui/VinylCursor';

import { Footer } from './Footer';
import { useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

interface LayoutProps {
    children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
    const location = useLocation();
    const [bannerEnabled, setBannerEnabled] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const checkBanner = async () => {
            try {
                const res = await fetch('/api/settings');
                if (res.ok) {
                    const data = await res.json();
                    setBannerEnabled(data.announcement_banner?.enabled || false);
                }
            } catch (e: any) { }
        };
        checkBanner();
    }, [location.pathname]);

    const isHome = location.pathname === '/';
    const isMini = new URLSearchParams(location.search).get('mini') === 'true';
    const isLivePage = location.pathname === '/live';
    const isHideLayout = location.pathname.startsWith('/admin') ||
        location.pathname.startsWith('/newsletter/admin') ||
        location.pathname.startsWith('/newsletter/studio') ||
        location.pathname.startsWith('/social-studio') ||
        location.pathname.includes('/create') ||
        isMini ||
        isLivePage;

    const isAdminPage = (location.pathname.startsWith('/admin') ||
        location.pathname.startsWith('/newsletter/admin') ||
        location.pathname.startsWith('/newsletter/studio') ||
        location.pathname.startsWith('/social-studio') ||
        location.pathname.includes('/create') ||
        isMini);


    const ptClass = isHideLayout ? 'pt-0' :
        (isMobile ? 'pt-16' : (bannerEnabled ? 'pt-[112px]' : (isHome ? 'pt-0' : 'pt-20')));

    return (
        <div className={`min-h-screen flex flex-col bg-dark-bg text-white selection:bg-neon-red selection:text-white pb-24 lg:pb-0 overflow-x-hidden ${isLivePage ? 'h-screen overflow-hidden' : ''}`}>

            {/* Background Effects - Desktop */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden hidden md:block">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-red/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-red/10 rounded-full blur-[100px]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
            </div>

            {/* Background Effects - Mobile (Optimized glows for smaller screens) */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden md:hidden">
                <div className="absolute top-[-5%] left-[-20%] w-[140%] h-64 bg-neon-red/15 rounded-[100%] blur-[60px] opacity-80" />
                <div className="absolute bottom-[-5%] right-[-20%] w-[140%] h-64 bg-neon-red/15 rounded-[100%] blur-[60px] opacity-80" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15]" />
            </div>

            {!isMobile && !isAdminPage && <VinylCursor />}

            {!isMobile && !isHideLayout && <Navbar />}
            {!isMobile && !isHideLayout && <AnnouncementBanner />}
            {isMobile && !isHideLayout && <MobileHeader onOpenSearch={() => setIsSearchOpen(true)} />}

            <MobileSearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

            <main className={`flex-grow relative ${ptClass}`}>
                {children}
            </main>

            {!isHideLayout && <Footer />}
            {!isHideLayout && (
                <div className="lg:hidden fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black via-black/95 to-transparent z-[90] pointer-events-none" />
            )}
            {!isHideLayout && <MobileNavbar />}
        </div>
    );
}

