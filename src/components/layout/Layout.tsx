import { AnnouncementBanner } from '../AnnouncementBanner';
import { Navbar } from './Navbar';
import { MobileNavbar } from './MobileNavbar';

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
    const isAdminPage = location.pathname.startsWith('/admin') ||
        location.pathname.startsWith('/newsletter/admin') ||
        location.pathname.startsWith('/newsletter/studio') ||
        location.pathname.startsWith('/social-studio') ||
        location.pathname.startsWith('/live') ||
        location.pathname.includes('/create') ||
        isMini;


    const ptClass = isAdminPage ? 'pt-0' :
        (bannerEnabled ? 'pt-[112px]' : (isHome ? 'pt-0' : (isMobile ? 'pt-0' : 'pt-20')));

    return (
        <div className="min-h-screen flex flex-col bg-dark-bg text-white selection:bg-neon-red selection:text-white pb-24 lg:pb-0">

            {/* Background Effects - Hidden on mobile for performance */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden hidden md:block">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-red/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-red/10 rounded-full blur-[100px]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
            </div>

            {!isMobile && !isAdminPage && <Navbar />}
            {!isMobile && !isAdminPage && <AnnouncementBanner />}

            <main className={`flex-grow relative ${ptClass}`}>
                {children}
            </main>

            {!isAdminPage && <Footer />}
            {!isAdminPage && (
                <div className="lg:hidden fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black via-black/95 to-transparent z-[90] pointer-events-none" />
            )}
            {!isAdminPage && <MobileNavbar />}
        </div>
    );
}

