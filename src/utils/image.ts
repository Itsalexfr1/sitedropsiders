/**
 * Resolve an image URL to be domain-agnostic and handle fallback images.
 * Strategy:
 * 1. If absolute URL (http), keep it as is (with minimal cleanup).
 * 2. If protocol-relative (//), force https.
 * 3. If relative filename, prefix with /uploads/.
 */
export function resolveImageUrl(url: string | undefined | null): string {
    const fallback = 'https://images.unsplash.com/photo-1514525253344-f814d074e015?q=80&w=1933&auto=format&fit=crop';
    
    if (!url) return fallback;
    
    let processedUrl = String(url).trim();
    if (!processedUrl || processedUrl === 'undefined' || processedUrl === 'null') return fallback;

    // 1. If it's already an absolute URL (http/https), LEAVE IT ALONE
    // This is vital to load assets from the live server.
    if (processedUrl.startsWith('http')) {
        // Just clean up the double uploads if present in the live URL
        // Some users might have migrated data with redundant paths
        if (processedUrl.includes('/uploads/uploads/')) {
            processedUrl = processedUrl.replace('/uploads/uploads/', '/uploads/');
        }
        return processedUrl;
    }

    // 2. Handle protocol-relative URLs
    if (processedUrl.startsWith('//')) {
        return 'https:' + processedUrl;
    }

    // 3. Handle Local/Relative Paths
    // Remove any leading domain if it was passed as a relative string (edge case)
    processedUrl = processedUrl.replace(/^https?:\/\/(www\.)?dropsiders\.fr/i, '');

    // Clean redundant uploads nesting
    if (processedUrl.includes('uploads/uploads/')) {
        processedUrl = processedUrl.replace('uploads/uploads/', 'uploads/');
    }

    // Ensure it starts with /uploads/ 
    if (processedUrl.startsWith('/uploads/')) {
        // already good, just ensure single slash
        processedUrl = '/' + processedUrl.replace(/^\/+/, '');
    } else if (processedUrl.startsWith('uploads/')) {
        processedUrl = '/' + processedUrl;
    } else {
        // It's a filename or a path without uploads prefix
        // We ensure it starts with /uploads/
        if (!processedUrl.startsWith('/')) {
            processedUrl = '/uploads/' + processedUrl;
        } else {
            // It starts with / but not /uploads/
            processedUrl = '/uploads' + processedUrl;
        }
    }

    // Final cleanup of double slashes
    return processedUrl.replace(/\/+/g, '/');
}
