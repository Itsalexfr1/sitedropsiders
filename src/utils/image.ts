/**
 * Resolve an image URL to be domain-agnostic and handle fallback images.
 * This version RESTORES the double /uploads/ if present because the R2 server 
 * configuration requires the full path as a key.
 */
export function resolveImageUrl(url: string | undefined | null): string {
    const fallback = 'https://images.unsplash.com/photo-1514525253344-f814d074e015?q=80&w=1933&auto=format&fit=crop';
    
    if (!url) return fallback;
    
    let processedUrl = String(url).trim();
    if (!processedUrl || processedUrl === 'undefined' || processedUrl === 'null') return fallback;

    // 1. If it's already an absolute URL (http/https), LEAVE IT ALONE.
    // Do NOT clean it, as the double /uploads/ might be correct on the server.
    if (processedUrl.startsWith('http')) {
        return processedUrl;
    }

    // 2. Handle protocol-relative URLs
    if (processedUrl.startsWith('//')) {
        return 'https:' + processedUrl;
    }

    // 3. Handle Local/Relative Paths
    // Remove leading domain if present in a relative-style string
    processedUrl = processedUrl.replace(/^https?:\/\/(www\.)?dropsiders\.fr/i, '');

    // DO NOT clean /uploads/uploads/ anymore. 
    // The server expects /uploads/ as a prefix for the Worker route, 
    // and the remaining "uploads/filename.jpg" as the R2 key.

    // Ensure it has a leading slash
    if (!processedUrl.startsWith('/')) {
        // If it doesn't start with / and doesn't start with uploads/, it's a raw filename
        if (!processedUrl.startsWith('uploads/')) {
            processedUrl = '/uploads/' + processedUrl;
        } else {
            processedUrl = '/' + processedUrl;
        }
    } else {
        // If it starts with / but not /uploads/, we might need to add it?
        // But usually users put the whole path.
        if (!processedUrl.startsWith('/uploads/')) {
            // Check if it's a root image or if it needs /uploads/
            // Most assets are in uploads/
            processedUrl = '/uploads' + processedUrl;
        }
    }

    // Final cleanup of multiple slashes ONLY (not path segments)
    return processedUrl.replace(/\/+/g, '/');
}
