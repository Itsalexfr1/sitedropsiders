import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const location = useLocation();

    useEffect(() => {
        const auth = localStorage.getItem('admin_auth_v2');
        setIsAuthenticated(auth === 'true');
    }, []);

    if (isAuthenticated === null) {
        return (
            <div className="min-h-screen bg-dark-bg flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-neon-red/20 border-t-neon-red rounded-full animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) {
        if (location.pathname === '/admin' || location.pathname === '/admin/') {
            return <>{children}</>;
        }
        return <Navigate to="/admin" replace />;
    }

    return <>{children}</>;
}
