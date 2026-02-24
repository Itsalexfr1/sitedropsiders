import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { useLocation } from 'react-router-dom';

interface LayoutProps {
    children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
    const location = useLocation();
    const isHome = location.pathname === '/';
    const isAdminPage = location.pathname.startsWith('/admin') ||
        location.pathname.startsWith('/newsletter/admin') ||
        location.pathname.startsWith('/newsletter/studio') ||
        location.pathname.includes('/create');

    return (
        <div className="min-h-screen flex flex-col bg-dark-bg text-white selection:bg-neon-red selection:text-white">
            {/* Background Effects - Hidden on mobile for performance */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden hidden md:block">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-red/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-red/10 rounded-full blur-[100px]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
            </div>

            {!isAdminPage && <Navbar />}

            <main className={`flex-grow relative ${isHome || isAdminPage ? 'pt-0' : 'pt-16'}`}>
                {children}
            </main>

            {!isAdminPage && <Footer />}
        </div>
    );
}
