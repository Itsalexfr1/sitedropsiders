/**
 * Resolve an image URL to be domain-agnostic and handle fallback images.
 * Strategy: 
 * 1. If it's a full URL to Dropsiders, we keep it as is for development 
 *    (to avoid 404s if local uploads folder is missing) OR 
 *    we make it root-relative if we want to be truly domain-agnostic.
 * 2. To satisfy the user's need for images that "disappeared suddenly", 
 *    we will let absolute URLs remain absolute if they match the production domain.
 */
export function resolveImageUrl(url: string | undefined | null): string {
    const fallback = 'https://images.unsplash.com/photo-1514525253344-f814d074e015?q=80&w=1933&auto=format&fit=crop';
    
    if (!url) return fallback;
    
    // Normalize string type and trim
    let processedUrl = String(url).trim();
    
    if (!processedUrl || processedUrl === 'undefined' || processedUrl === 'null') return fallback;

    // Handle relative paths from JSON that start with uploads/...
    if (processedUrl.startsWith('uploads/')) {
        processedUrl = '/' + processedUrl;
    }

    // REDUNDANCY FIX: Many JSON paths have /uploads/uploads/
    if (processedUrl.includes('/uploads/uploads/')) {
        processedUrl = processedUrl.replace('/uploads/uploads/', '/uploads/');
    }

    // IF IT'S AN ABSOLUTE URL TO DROPSIDERS.FR:
    // We choose to KEEP IT for now so it loads from the live server 
    // even if the local development environment doesn't have the assets.
    // This fixed the "disappearing images" issue on the user's side.
    if (/^https?:\/\/(www\.)?dropsiders\.fr/i.test(processedUrl)) {
        // We clean the redundancy even on absolute URLs
        if (processedUrl.includes('/uploads/uploads/')) {
            processedUrl = processedUrl.replace('/uploads/uploads/', '/uploads/');
        }
        return processedUrl;
    }
    
    // If it's still an absolute URL (external), return it
    if (processedUrl.startsWith('http')) {
        return processedUrl;
    }

    // Handle protocol-relative URLs
    if (processedUrl.startsWith('//')) {
        return 'https:' + processedUrl;
    }
    
    // Ensure relative paths start with a single leading slash
    if (!processedUrl.startsWith('/')) {
        processedUrl = '/' + processedUrl;
    } else {
        // Clean up multiple leading slashes (e.g. //uploads -> /uploads)
        processedUrl = '/' + processedUrl.replace(/^\/+/, '');
    }
    
    return processedUrl;
}
