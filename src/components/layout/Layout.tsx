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
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20viewBox=%220%200%20200%20200%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter%20id=%22noiseFilter%22%3E%3CfeTurbulence%20type=%22fractalNoise%22%20baseFrequency=%220.65%22%20numOctaves=%223%22%20stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect%20width=%22100%25%22%20height=%22100%25%22%20filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')] opacity-20" />
            </div>

            {/* Background Effects - Mobile (Static gradient - no blur for Safari perf) */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden md:hidden"
                style={{
                    background: 'radial-gradient(ellipse at top, rgba(255,0,51,0.08) 0%, transparent 60%), radial-gradient(ellipse at bottom, rgba(255,0,51,0.06) 0%, transparent 60%)'
                }}
            />

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

