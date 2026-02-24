import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function GoogleAdSense() {
    const location = useLocation();

    useEffect(() => {
        // Paths where we DON'T want ads (Admin, Login, Gated content)
        const excludedPaths = [
            '/admin',
            '/kit-media',
            '/news/create',
            '/recaps/create',
            '/agenda/create',
            '/galerie/create',
            '/newsletter/studio',
            '/newsletter/admin'
        ];

        const isExcluded = excludedPaths.some(path => location.pathname.startsWith(path));

        if (!isExcluded) {
            // Check if script already exists
            if (!document.querySelector('script[src*="adsbygoogle.js"]')) {
                const script = document.createElement('script');
                script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3678332774662079";
                script.async = true;
                script.crossOrigin = "anonymous";
                document.head.appendChild(script);
            }
        }
    }, [location]);

    return null;
}
