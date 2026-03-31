/**
 * Resolve an image URL to be domain-agnostic and handle fallback images.
 * If the URL points to dropsiders.fr (with or without www), it converts it to a root-relative path.
 */
export function resolveImageUrl(url: string | undefined | null): string {
    const fallback = 'https://images.unsplash.com/photo-1514525253344-f814d074e015?q=80&w=1933&auto=format&fit=crop';
    
    if (!url) return fallback;
    
    // Normalize string type and trim
    let processedUrl = String(url).trim();
    
    if (!processedUrl || processedUrl === 'undefined' || processedUrl === 'null') return fallback;

    // Remove domains to make it root-relative
    // This handles:
    // http(s)://dropsiders.fr
    // http(s)://www.dropsiders.fr
    processedUrl = processedUrl.replace(/^https?:\/\/(www\.)?dropsiders\.fr/i, '');
    
    // If it's still an absolute URL (external), return it
    if (processedUrl.startsWith('http')) {
        return processedUrl;
    }

    // Handle protocol-relative URLs
    if (processedUrl.startsWith('//')) {
        return 'https:' + processedUrl;
    }
    
    // Ensure relative paths start with a single leading slash
    // and handle cases where they might accidentally have doubles or none
    if (!processedUrl.startsWith('/')) {
        processedUrl = '/' + processedUrl;
    } else {
        // Clean up multiple leading slashes (e.g. //uploads -> /uploads)
        processedUrl = '/' + processedUrl.replace(/^\/+/, '');
    }
    
    return processedUrl;
}

